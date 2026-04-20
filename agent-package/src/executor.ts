import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { log, setLogContext, clearLogContext } from './logger';
import { pushNotify } from './push-notify';
import type { SupabaseClient } from '@supabase/supabase-js';

/** executor 가 완료·에러 시점에 Web Push 를 보낼 때 필요한 문맥 */
export interface PushCtx {
  apiBase: string;
  getAccessToken: () => Promise<string>;
  agentName: string;
}

/** 입력 길이 상한 (토큰 과소비·DoS 방지) */
const MAX_PROMPT_LENGTH = 20_000;

/** 작업 타임아웃 기본값 (30분). 환경변수/DB 로 오버라이드 가능. */
const TASK_TIMEOUT_DEFAULT_MS = parseInt(process.env.TASK_TIMEOUT_MS || '1800000', 10);

/**
 * 메시지별 유효 타임아웃 계산.
 * 우선순위:
 *   1. messages.timeout_extended = true  → 아래 해상도의 2배
 *   2. conversations.timeout_override_minutes (NULL 아님)
 *   3. agents.task_timeout_minutes        (NULL 아님)
 *   4. 환경변수 TASK_TIMEOUT_MS
 *   5. 기본 30 분
 * 상한: 12 시간.
 */
async function resolveTaskTimeoutMs(
  supabase: SupabaseClient,
  agentId: string,
  conversationId: string,
  userMessageId: string,
): Promise<{ timeoutMs: number; source: string }> {
  const MAX = 12 * 60 * 60 * 1000;
  const results = await Promise.all([
    supabase.from('messages').select('timeout_extended').eq('id', userMessageId).maybeSingle(),
    supabase.from('conversations').select('timeout_override_minutes').eq('id', conversationId).maybeSingle(),
    supabase.from('agents').select('task_timeout_minutes').eq('id', agentId).maybeSingle(),
  ]);
  const msg = results[0].data as { timeout_extended?: boolean } | null;
  const conv = results[1].data as { timeout_override_minutes?: number | null } | null;
  const ag = results[2].data as { task_timeout_minutes?: number | null } | null;

  let base: number;
  let source: string;
  if (conv?.timeout_override_minutes) {
    base = conv.timeout_override_minutes * 60_000;
    source = '대화 설정';
  } else if (ag?.task_timeout_minutes) {
    base = ag.task_timeout_minutes * 60_000;
    source = 'PC 설정';
  } else {
    base = TASK_TIMEOUT_DEFAULT_MS;
    source = '기본값';
  }
  if (msg?.timeout_extended) {
    base = Math.min(MAX, base * 2);
    source += ' ×2 (연장)';
  }
  return { timeoutMs: Math.min(MAX, base), source };
}

/** 출력 버퍼 상한 (1MB) — 초과 시 잘림 표시 */
const MAX_OUTPUT_BYTES = 1_024 * 1_024;

/**
 * 프라이빗/루프백/메타데이터 대역 차단.
 * webhook URL 이 내부 서비스를 공격하지 못하게 막는 최소 SSRF 방어.
 */
function isSafeWebhookUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;

  const host = u.hostname.toLowerCase();

  // 호스트 이름 기반 차단
  const blockedHosts = ['localhost', '0.0.0.0', 'metadata.google.internal', 'metadata.goog'];
  if (blockedHosts.includes(host)) return false;

  // IPv4 리터럴이면 대역 확인
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map(Number);
    if (a === 127) return false; // 루프백
    if (a === 10) return false;   // 사설 A
    if (a === 192 && b === 168) return false; // 사설 C
    if (a === 172 && b >= 16 && b <= 31) return false; // 사설 B
    if (a === 169 && b === 254) return false; // 링크로컬 (AWS/GCP 메타데이터 포함)
    if (a === 0) return false;
  }

  // IPv6 루프백/링크로컬
  if (host === '[::1]' || host.startsWith('[fe80:') || host.startsWith('[fc') || host.startsWith('[fd')) {
    return false;
  }

  return true;
}

/**
 * 작업 완료 시 에이전트에 설정된 웹훅 URL로 알림 전송.
 * Discord/Telegram 호환 형식. 실패해도 로그만 남기고 무시.
 */
async function sendWebhook(
  supabase: SupabaseClient,
  agentId: string,
  prompt: string,
  result: string
): Promise<void> {
  const { data: agent } = await supabase
    .from('agents')
    .select('name, webhook_url')
    .eq('id', agentId)
    .single();

  const webhookUrl = (agent as Record<string, unknown>)?.webhook_url;
  if (!webhookUrl || typeof webhookUrl !== 'string') return;

  if (!isSafeWebhookUrl(webhookUrl)) {
    log(`웹훅 차단됨 (사설망/비HTTP)`, 'warn');
    return;
  }

  const agentName = (agent as Record<string, unknown>)?.name ?? 'Unknown';

  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**[ACP] ${agentName}** 작업 완료\n> ${prompt.substring(0, 100)}\n\`\`\`\n${result.substring(0, 300)}\n\`\`\``,
      }),
      signal: ctrl.signal,
      redirect: 'error',
    });
    clearTimeout(timeout);
    log('웹훅 전송 완료');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log(`웹훅 전송 실패: ${errMsg}`, 'warn');
  }
}

export async function executeClaudeCommand(
  supabase: SupabaseClient,
  agentId: string,
  userId: string,
  userMessageId: string,
  content: string,
  harnessPath: string | null,
  conversationId: string,
  pushCtx?: PushCtx,
): Promise<void> {
  // 같은 대화에 이전 user 메시지가 있었으면 자동 --continue.
  // (CLI 의 --continue 는 cwd 의 마지막 Claude 세션을 이어간다. 동일 harness 내에서만 의미 있음.)
  let priorUserCount = 0;
  {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('role', 'user')
      .neq('id', userMessageId);
    priorUserCount = count ?? 0;
  }
  const isContinueMode = priorUserCount > 0;

  // assistant 응답 메시지를 미리 생성 (streaming 상태)
  const { data: responseMsg, error: insertError } = await supabase
    .from('messages')
    .insert({
      agent_id: agentId,
      user_id: userId,
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      status: 'streaming',
    })
    .select('id')
    .single();

  if (insertError || !responseMsg) {
    log(`응답 메시지 생성 실패: ${insertError?.message}`, 'error');
    return;
  }

  const responseId = responseMsg.id;
  // 이 실행 동안 발생하는 모든 로그는 이 대화/메시지에 태깅됨 (큐 직렬 실행 전제).
  setLogContext({ conversationId, messageId: responseId });
  const streamStartTs = Date.now();

  try {
    let actualContent = content;

    // 길이 제한 (DoS/토큰 과소비 방지)
    if (actualContent.length > MAX_PROMPT_LENGTH) {
      actualContent = actualContent.slice(0, MAX_PROMPT_LENGTH);
      log(`입력이 ${MAX_PROMPT_LENGTH}자로 잘렸습니다`, 'warn');
    }

    // 제어 문자 제거 (탭·개행 허용)
    actualContent = actualContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    if (!actualContent.trim()) {
      await supabase
        .from('messages')
        .update({ content: '(빈 메시지)', status: 'error' })
        .eq('id', responseId);
      return;
    }

    // 인자 구성 (spawn shell:false 이므로 args 배열로 안전 전달)
    // --dangerously-skip-permissions 는 기본 해제 — 사용자 PC 에서 마음대로 권한 승인
    // 을 우회하면 안전 책임을 사용자가 인지하기 어려움. 필요 시 env 로 명시적 opt-in.
    const args = ['--print'];
    if (process.env.DANGEROUSLY_SKIP_PERMISSIONS === '1') {
      args.push('--dangerously-skip-permissions');
    }
    if (isContinueMode) {
      args.push('--continue');
    }
    args.push(actualContent);

    // 하네스 경로가 있으면 해당 디렉토리에서 실행 (CLAUDE.md 자동 로드)
    // path traversal 방어: resolve 후 정상 경로인지 확인
    let cwd: string | undefined;
    if (harnessPath) {
      const resolved = resolve(harnessPath);
      // harnessPath가 상대경로 공격 패턴을 포함하지 않도록 확인
      if (resolved === harnessPath || !harnessPath.includes('..')) {
        cwd = dirname(resolved);
      }
    }

    log(`실행: "${actualContent.substring(0, 60)}..."${cwd ? ` (${cwd})` : ''}${isContinueMode ? ' [컨텍스트]' : ''}`);

    // Windows: cmd.exe /c claude ..., Linux/Mac: claude 직접
    const spawnCmd = process.platform === 'win32' ? 'cmd.exe' : 'claude';
    const spawnArgs = process.platform === 'win32'
      ? ['/c', 'claude', ...args]
      : args;

    const child = spawn(spawnCmd, spawnArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
      cwd,
    });

    let fullOutput = '';
    let outputBytes = 0;
    let outputTruncated = false;
    let updateTimer: NodeJS.Timeout | null = null;
    let cancelled = false;

    // 메시지별 유효 타임아웃 해상
    const { timeoutMs: TASK_TIMEOUT_MS, source: timeoutSource } = await resolveTaskTimeoutMs(
      supabase,
      agentId,
      conversationId,
      userMessageId,
    );
    log(`타임아웃: ${Math.round(TASK_TIMEOUT_MS / 60_000)}분 (${timeoutSource})`);

    // 타임아웃 90% 지점에서 사전 경고 (사용자가 자리를 비웠어도 모바일 푸시로 안내)
    const warnTimer = setTimeout(async () => {
      if (cancelled) return;
      log(`작업이 타임아웃 90% 임계 ${Math.round(TASK_TIMEOUT_MS / 60_000 * 0.9)}분 경과`, 'warn');
      if (pushCtx) {
        try {
          await pushNotify({
            apiBase: pushCtx.apiBase,
            getAccessToken: pushCtx.getAccessToken,
            title: `${pushCtx.agentName} 작업 지연`,
            body: `곧 타임아웃됩니다 (${Math.round(TASK_TIMEOUT_MS / 60_000)}분 중 90% 경과). "타임아웃 연장" 버튼으로 2배 연장 가능.`,
            variant: 'warning',
            agentId,
            conversationId,
            tag: `acp-timeout-warn-${responseId}`,
          });
        } catch {}
      }
    }, TASK_TIMEOUT_MS * 0.9);

    // 작업 타임아웃 (계산된 값 사용)
    const taskTimeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        child.kill();
        log(`작업 타임아웃 (${Math.round(TASK_TIMEOUT_MS / 1000)}초 초과)`, 'warn');
      }
    }, TASK_TIMEOUT_MS);

    // 취소 감지: 500ms 마다 상태 확인 (사용자 체감 반응성 우선).
    const cancelCheck = setInterval(async () => {
      const { data } = await supabase
        .from('messages')
        .select('status')
        .eq('id', responseId)
        .single();
      if (data && data.status === 'cancelled') {
        cancelled = true;
        child.kill();
        clearInterval(cancelCheck);
        log('사용자가 취소함 — 프로세스 종료됨', 'warn');
        // 에이전트가 실제로 kill 했다는 사실을 UI 에 전달.
        await supabase
          .from('messages')
          .update({ error_message: '사용자 요청으로 중단됨 — 에이전트 프로세스 종료' })
          .eq('id', responseId);
      }
    }, 500);

    /**
     * 적응형 디바운스 — 첫 반응속도를 위해 최초 chunk 는 100ms 뒤에 업로드하고,
     * 10초 안까지는 300ms, 이후 정상 페이스에서는 800ms 로 완만히 늘린다.
     * "바로 응답 시작" 체감과 "DB 업데이트 폭주 방지" 의 절충.
     */
    let firstUpdate = true;
    const scheduleUpdate = () => {
      if (updateTimer || cancelled) return;
      const elapsed = Date.now() - streamStartTs;
      const delay = firstUpdate ? 100 : elapsed < 10_000 ? 300 : 800;
      updateTimer = setTimeout(async () => {
        updateTimer = null;
        firstUpdate = false;
        if (fullOutput && !cancelled) {
          await supabase
            .from('messages')
            .update({ content: fullOutput })
            .eq('id', responseId);
        }
      }, delay);
    };

    /**
     * 10초마다 keepalive: content 가 바뀌지 않아도 updated_at 을 bump 해
     * 클라이언트가 "스트리밍이 살아 있음" 을 확인할 수 있게 한다.
     * 긴 생각(응답 안 나오는 구간) 중 UI 가 죽은 것처럼 보이는 문제 완화.
     */
    const keepaliveTimer = setInterval(async () => {
      if (cancelled) return;
      try {
        await supabase
          .from('messages')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', responseId)
          .eq('status', 'streaming');
      } catch {}
    }, 10_000);

    child.stdout.on('data', (data: Buffer) => {
      if (outputTruncated) return;
      outputBytes += data.length;
      if (outputBytes > MAX_OUTPUT_BYTES) {
        fullOutput += '\n\n⚠️ 출력이 1MB를 초과하여 잘렸습니다.';
        outputTruncated = true;
      } else {
        fullOutput += data.toString();
      }
      scheduleUpdate();
    });

    child.stderr.on('data', (data: Buffer) => {
      if (outputTruncated) return;
      const text = data.toString();
      // Warning/Deprecation은 무시
      if (!text.includes('Warning:') && !text.includes('DeprecationWarning')) {
        outputBytes += data.length;
        if (outputBytes > MAX_OUTPUT_BYTES) {
          fullOutput += '\n\n⚠️ 출력이 1MB를 초과하여 잘렸습니다.';
          outputTruncated = true;
        } else {
          fullOutput += text;
        }
        scheduleUpdate();
      }
    });

    await new Promise<void>((resolve) => {
      child.on('close', async (code) => {
        clearTimeout(taskTimeout);
        clearTimeout(warnTimer);
        clearInterval(cancelCheck);
        clearInterval(keepaliveTimer);
        if (updateTimer) { clearTimeout(updateTimer); updateTimer = null; }

        if (cancelled) {
          const reason = code === null
            ? '(타임아웃으로 자동 종료됨)'
            : '(사용자에 의해 취소됨)';
          await supabase
            .from('messages')
            .update({
              content: fullOutput + '\n\n' + reason,
              status: 'cancelled',
            })
            .eq('id', responseId);
          log('취소 완료');

          if (pushCtx) {
            pushNotify({
              apiBase: pushCtx.apiBase,
              getAccessToken: pushCtx.getAccessToken,
              agentId,
              conversationId,
              title: `${pushCtx.agentName} 작업 중단`,
              body: reason + ' — ' + content.slice(0, 80),
              variant: 'warning',
              tag: `conv-${conversationId}`,
            });
          }
        } else {
          await supabase
            .from('messages')
            .update({
              content: fullOutput || '(응답 없음)',
              status: code === 0 ? 'completed' : 'error',
              error_message: code !== 0 ? `종료 코드: ${code}` : null,
            })
            .eq('id', responseId);
          log(`완료 (코드: ${code}, ${fullOutput.length}자)`);

          // 완료 시 웹훅 알림 전송
          if (code === 0) {
            sendWebhook(supabase, agentId, content, fullOutput);
          }

          // Web Push 알림
          if (pushCtx) {
            const summary = (fullOutput || '(응답 없음)').replace(/\s+/g, ' ').slice(0, 140);
            pushNotify({
              apiBase: pushCtx.apiBase,
              getAccessToken: pushCtx.getAccessToken,
              agentId,
              conversationId,
              title:
                code === 0
                  ? `${pushCtx.agentName} 작업 완료`
                  : `${pushCtx.agentName} 작업 실패 (코드 ${code})`,
              body: summary,
              variant: code === 0 ? 'success' : 'error',
              tag: `conv-${conversationId}`,
            });
          }
        }
        resolve();
      });

      child.on('error', async (err) => {
        clearTimeout(taskTimeout);
        clearInterval(cancelCheck);
        clearInterval(keepaliveTimer);
        log(`프로세스 오류: ${err.message}`, 'error');
        await supabase
          .from('messages')
          .update({
            content: fullOutput || '실행 오류',
            status: 'error',
            error_message: err.message,
          })
          .eq('id', responseId);
        resolve();
      });
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    log(`치명적 실행 오류: ${errorMsg}`, 'error');
    await supabase
      .from('messages')
      .update({
        content: '실행 중 오류가 발생했습니다.',
        status: 'error',
        error_message: errorMsg,
      })
      .eq('id', responseId);
  } finally {
    clearLogContext();
  }
}

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { log } from './logger';
import type { SupabaseClient } from '@supabase/supabase-js';

/** 입력 길이 상한 (토큰 과소비·DoS 방지) */
const MAX_PROMPT_LENGTH = 20_000;

/** 작업 타임아웃 (기본 5분, 환경변수로 조정 가능) */
const TASK_TIMEOUT_MS = parseInt(process.env.TASK_TIMEOUT_MS || '300000', 10);

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
  harnessPath: string | null
): Promise<void> {
  // assistant 응답 메시지를 미리 생성 (streaming 상태)
  const { data: responseMsg, error: insertError } = await supabase
    .from('messages')
    .insert({
      agent_id: agentId,
      user_id: userId,
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

  try {
    // [CTX] 접두사 감지: 컨텍스트 유지 모드
    const isContinueMode = content.startsWith('[CTX]');
    let actualContent = isContinueMode ? content.slice(5) : content;

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
    const args = ['--print', '--dangerously-skip-permissions'];
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

    // 작업 타임아웃: 기본 5분, TASK_TIMEOUT_MS 환경변수로 조정
    const taskTimeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        child.kill();
        log(`작업 타임아웃 (${TASK_TIMEOUT_MS / 1000}초 초과)`, 'warn');
      }
    }, TASK_TIMEOUT_MS);

    // 취소 감지: 1.5초마다 상태 확인
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
        log('사용자가 취소함', 'warn');
      }
    }, 1500);

    const scheduleUpdate = () => {
      if (updateTimer || cancelled) return;
      updateTimer = setTimeout(async () => {
        updateTimer = null;
        if (fullOutput && !cancelled) {
          await supabase
            .from('messages')
            .update({ content: fullOutput })
            .eq('id', responseId);
        }
      }, 500);
    };

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
        clearInterval(cancelCheck);
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
        }
        resolve();
      });

      child.on('error', async (err) => {
        clearTimeout(taskTimeout);
        clearInterval(cancelCheck);
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
  }
}

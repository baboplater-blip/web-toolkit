import { spawn } from 'child_process';
import { dirname } from 'path';
import { log } from './logger';
import type { SupabaseClient } from '@supabase/supabase-js';

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

  const agentName = (agent as Record<string, unknown>)?.name ?? 'Unknown';

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**[ACP] ${agentName}** 작업 완료\n> ${prompt.substring(0, 100)}\n\`\`\`\n${result.substring(0, 300)}\n\`\`\``,
      }),
    });
    log('웹훅 전송 완료');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log(`웹훅 전송 실패: ${errMsg}`, 'warn');
  }
}

export async function executeClaudeCommand(
  supabase: SupabaseClient,
  agentId: string,
  userMessageId: string,
  content: string,
  harnessPath: string | null
): Promise<void> {
  // assistant 응답 메시지를 미리 생성 (streaming 상태)
  const { data: responseMsg, error: insertError } = await supabase
    .from('messages')
    .insert({
      agent_id: agentId,
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
    const actualContent = isContinueMode ? content.slice(5) : content;

    // 인자 구성
    const args = ['--print', '--dangerously-skip-permissions'];
    if (isContinueMode) {
      args.push('--continue');
    }
    args.push(actualContent);

    // 하네스 경로가 있으면 해당 디렉토리에서 실행 (CLAUDE.md 자동 로드)
    const cwd = harnessPath ? dirname(harnessPath) : undefined;

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
    let updateTimer: NodeJS.Timeout | null = null;
    let cancelled = false;

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
      fullOutput += data.toString();
      scheduleUpdate();
    });

    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      // Warning/Deprecation은 무시
      if (!text.includes('Warning:') && !text.includes('DeprecationWarning')) {
        fullOutput += text;
        scheduleUpdate();
      }
    });

    await new Promise<void>((resolve) => {
      child.on('close', async (code) => {
        clearInterval(cancelCheck);
        if (updateTimer) { clearTimeout(updateTimer); updateTimer = null; }

        if (cancelled) {
          await supabase
            .from('messages')
            .update({
              content: fullOutput + '\n\n(사용자에 의해 취소됨)',
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

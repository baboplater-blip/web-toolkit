import { spawn } from 'child_process';
import { dirname } from 'path';
import type { SupabaseClient } from '@supabase/supabase-js';

// Windows에서 claude.cmd의 전체 경로
const CLAUDE_CMD = process.env.CLAUDE_PATH
  || (process.platform === 'win32'
    ? `${process.env.APPDATA}\\npm\\claude.cmd`
    : 'claude');

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
    console.error('[실행] 응답 메시지 생성 실패:', insertError);
    return;
  }

  const responseId = responseMsg.id;

  try {
    // claude --print "prompt" 형태로 실행
    const args = ['--print', content];

    // 하네스 경로가 있으면 해당 디렉토리에서 실행 (CLAUDE.md 자동 로드)
    const cwd = harnessPath ? dirname(harnessPath) : undefined;

    console.log(`[실행] claude --print "${content.substring(0, 50)}..."${cwd ? ` (cwd: ${cwd})` : ''}`);

    // Windows: cmd.exe /c claude ... 로 실행 (shell:false + .cmd 파일은 EINVAL 발생)
    const spawnArgs = process.platform === 'win32'
      ? ['cmd.exe', ['/c', 'claude', ...args]]
      : ['claude', args];

    const child = spawn(spawnArgs[0] as string, spawnArgs[1] as string[], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
      cwd,
    });

    let fullOutput = '';
    let updateTimer: NodeJS.Timeout | null = null;

    const scheduleUpdate = () => {
      if (updateTimer) return;
      updateTimer = setTimeout(async () => {
        updateTimer = null;
        if (fullOutput) {
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
      // stderr에서 Warning은 무시, 실제 에러만 수집
      const text = data.toString();
      if (!text.includes('Warning:') && !text.includes('DeprecationWarning')) {
        fullOutput += text;
        scheduleUpdate();
      }
    });

    await new Promise<void>((resolve) => {
      child.on('close', async (code) => {
        if (updateTimer) {
          clearTimeout(updateTimer);
          updateTimer = null;
        }

        await supabase
          .from('messages')
          .update({
            content: fullOutput || '(응답 없음)',
            status: code === 0 ? 'completed' : 'error',
            error_message: code !== 0 ? `종료 코드: ${code}` : null,
          })
          .eq('id', responseId);

        console.log(`[실행] 완료 (코드: ${code})`);
        resolve();
      });

      child.on('error', async (err) => {
        await supabase
          .from('messages')
          .update({
            content: fullOutput || '실행 오류',
            status: 'error',
            error_message: err.message,
          })
          .eq('id', responseId);

        console.error('[실행] 오류:', err.message);
        resolve();
      });
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
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

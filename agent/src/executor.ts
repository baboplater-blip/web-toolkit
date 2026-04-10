import { spawn } from 'child_process';
import type { SupabaseClient } from '@supabase/supabase-js';

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
    // claude 명령어 조합
    const args = ['--print'];
    if (harnessPath) {
      args.push('--harness', harnessPath);
    }
    args.push(content);

    console.log(`[실행] claude ${args.join(' ').substring(0, 80)}...`);

    const child = spawn('claude', args, {
      shell: true,
      env: { ...process.env },
    });

    let fullOutput = '';
    let updateTimer: NodeJS.Timeout | null = null;

    // 일정 간격으로 DB 업데이트 (너무 자주 업데이트하지 않도록 디바운스)
    const scheduleUpdate = () => {
      if (updateTimer) return;
      updateTimer = setTimeout(async () => {
        updateTimer = null;
        await supabase
          .from('messages')
          .update({ content: fullOutput })
          .eq('id', responseId);
      }, 500); // 500ms 디바운스
    };

    child.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      fullOutput += chunk;
      scheduleUpdate();
    });

    child.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      fullOutput += chunk;
      scheduleUpdate();
    });

    await new Promise<void>((resolve, reject) => {
      child.on('close', async (code) => {
        // 마지막 업데이트 플러시
        if (updateTimer) {
          clearTimeout(updateTimer);
          updateTimer = null;
        }

        await supabase
          .from('messages')
          .update({
            content: fullOutput,
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

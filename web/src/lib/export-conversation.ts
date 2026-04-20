import type { Message, Conversation } from '@/lib/supabase/types';

/**
 * 대화 + 메시지 목록을 파일로 다운로드한다.
 * 형식:
 *   - 'markdown': 사람이 읽기 좋은 .md
 *   - 'json': 프로그래밍 처리용 .json
 *
 * 다운로드는 Blob → object URL → anchor click 으로 수행.
 */

export type ExportFormat = 'markdown' | 'json';

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) || 'conversation';
}

function formatMarkdown(conv: Conversation, messages: Message[]): string {
  const lines: string[] = [];
  lines.push(`# ${conv.title}`);
  lines.push('');
  lines.push(`- 대화 ID: \`${conv.id}\``);
  lines.push(`- 생성: ${new Date(conv.created_at).toLocaleString('ko-KR')}`);
  lines.push(`- 마지막 활동: ${new Date(conv.last_message_at).toLocaleString('ko-KR')}`);
  lines.push(`- 메시지 수: ${messages.length}`);
  lines.push('');
  lines.push('---');

  for (const m of messages) {
    const time = new Date(m.created_at).toLocaleString('ko-KR');
    const roleLabel =
      m.role === 'user' ? '🙋 요청' : m.role === 'assistant' ? '🤖 응답' : 'ℹ️ 시스템';
    const statusTag = m.status !== 'completed' ? ` _(${m.status})_` : '';
    lines.push('');
    lines.push(`## ${roleLabel} · ${time}${statusTag}`);
    lines.push('');
    lines.push(m.content || '_(빈 내용)_');
    if (m.error_message) {
      lines.push('');
      lines.push(`> ⚠️ ${m.error_message}`);
    }
  }

  return lines.join('\n');
}

function formatJson(conv: Conversation, messages: Message[]): string {
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      conversation: conv,
      messages,
    },
    null,
    2,
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportConversation(
  conv: Conversation,
  messages: Message[],
  format: ExportFormat,
): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const safeTitle = sanitizeFileName(conv.title);

  if (format === 'json') {
    const body = formatJson(conv, messages);
    triggerDownload(
      new Blob([body], { type: 'application/json;charset=utf-8' }),
      `conversation-${safeTitle}-${stamp}.json`,
    );
    return;
  }

  const body = formatMarkdown(conv, messages);
  triggerDownload(
    new Blob([body], { type: 'text/markdown;charset=utf-8' }),
    `conversation-${safeTitle}-${stamp}.md`,
  );
}

/**
 * 대화를 markdown 문자열로 클립보드에 복사. 파일 다운로드 없이 빠르게 붙여넣기.
 * 성공 시 true 반환.
 */
export async function copyConversationToClipboard(
  conv: Conversation,
  messages: Message[],
): Promise<boolean> {
  const body = formatMarkdown(conv, messages);
  try {
    await navigator.clipboard.writeText(body);
    return true;
  } catch {
    return false;
  }
}

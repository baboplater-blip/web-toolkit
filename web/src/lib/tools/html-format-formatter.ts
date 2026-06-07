// 의존성 없는 HTML beautify / minify 포매터.
// 정규식 토크나이저로 태그·텍스트·주석을 분리한 뒤 들여쓰기를 재구성한다.

// 콘텐츠를 그대로 보존해야 하는(내부를 포맷하면 안 되는) 요소
const PREFORMATTED = new Set(['pre', 'textarea', 'script', 'style']);

// 종료 태그가 없는 void 요소 (HTML5 스펙)
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

// 인라인 요소 — 텍스트 흐름을 끊지 않으므로 줄바꿈 들여쓰기 대상에서 제외하지 않되,
// beautify 시 블록 요소만 줄을 나눠 가독성을 확보한다.
type TokenType = 'open' | 'close' | 'self' | 'void' | 'text' | 'comment' | 'doctype';

interface Token {
  type: TokenType;
  /** 원본 텍스트(태그 전체 또는 텍스트 내용) */
  raw: string;
  /** 태그 토큰의 소문자 태그명 */
  name?: string;
}

/** 입력 HTML 을 토큰 배열로 분해한다. */
function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  // 주석, doctype, 일반 태그, 그 사이의 텍스트를 차례로 매칭한다.
  const pattern = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/?[a-zA-Z][^>]*>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    if (match.index > lastIndex) {
      const text = html.slice(lastIndex, match.index);
      if (text.trim().length > 0) {
        tokens.push({ type: 'text', raw: text });
      }
    }

    const raw = match[0];
    if (raw.startsWith('<!--')) {
      tokens.push({ type: 'comment', raw });
    } else if (/^<!doctype/i.test(raw)) {
      tokens.push({ type: 'doctype', raw });
    } else {
      const nameMatch = /^<\/?\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(raw);
      const name = nameMatch ? nameMatch[1].toLowerCase() : '';
      if (raw.startsWith('</')) {
        tokens.push({ type: 'close', raw, name });
      } else if (raw.endsWith('/>')) {
        tokens.push({ type: 'self', raw, name });
      } else if (VOID_ELEMENTS.has(name)) {
        tokens.push({ type: 'void', raw, name });
      } else {
        tokens.push({ type: 'open', raw, name });
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < html.length) {
    const text = html.slice(lastIndex);
    if (text.trim().length > 0) {
      tokens.push({ type: 'text', raw: text });
    }
  }

  return tokens;
}

/** 내부 공백을 한 칸으로 정규화한다(텍스트 노드용). */
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * HTML 을 들여쓰기로 정리한다.
 * @param indentSize 들여쓰기 칸 수 (기본 2)
 */
export function beautifyHtml(html: string, indentSize = 2): string {
  const tokens = tokenize(html);
  const indentUnit = ' '.repeat(indentSize);
  const lines: string[] = [];
  let depth = 0;

  // preformatted 요소 내부는 원문 그대로 보존하기 위한 상태
  let rawStack: string | null = null;
  let rawBuffer: string[] = [];

  const pushLine = (content: string, level: number) => {
    lines.push(indentUnit.repeat(Math.max(0, level)) + content);
  };

  for (const token of tokens) {
    // preformatted 영역 내부 처리
    if (rawStack) {
      if (token.type === 'close' && token.name === rawStack) {
        const inner = rawBuffer.join('');
        pushLine(`${inner}${token.raw}`, depth + 1);
        rawStack = null;
        rawBuffer = [];
      } else {
        rawBuffer.push(token.raw);
      }
      continue;
    }

    switch (token.type) {
      case 'open':
        pushLine(token.raw, depth);
        if (PREFORMATTED.has(token.name ?? '')) {
          rawStack = token.name ?? null;
          rawBuffer = [];
        } else {
          depth += 1;
        }
        break;
      case 'close':
        depth = Math.max(0, depth - 1);
        pushLine(token.raw, depth);
        break;
      case 'self':
      case 'void':
      case 'doctype':
        pushLine(token.raw, depth);
        break;
      case 'comment':
        pushLine(token.raw, depth);
        break;
      case 'text': {
        const normalized = collapseWhitespace(token.raw);
        if (normalized) pushLine(normalized, depth);
        break;
      }
    }
  }

  // preformatted 태그가 닫히지 않은 손상 입력 방어
  if (rawStack && rawBuffer.length > 0) {
    pushLine(rawBuffer.join(''), depth + 1);
  }

  return lines.join('\n');
}

/** 태그 사이 공백을 제거해 HTML 을 한 줄로 압축한다. */
export function minifyHtml(html: string): string {
  return html
    // 주석 제거 (조건부 주석 <!--[if 은 보존)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    // 태그 사이 공백 제거
    .replace(/>\s+</g, '><')
    // 연속 공백을 한 칸으로
    .replace(/\s{2,}/g, ' ')
    .trim();
}

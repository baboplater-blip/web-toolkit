/**
 * 가이드 본문(steps·faqs·intro)에 인-프로즈 내부 링크를 렌더한다.
 *
 * 맞춤 가이드 본문은 평문 문자열이라 그대로는 링크를 넣을 수 없다. 여기서
 * 가벼운 인라인 구문 `[표시문구](guide:도구id)` 를 지원해, 문맥 안에서
 * 자연스럽게 다른 가이드로 연결한다(하단 큐레이션 클러스터와 별개로 본문
 * 안에서 거는 링크라 내부링크 신호·체류 동선이 더 강해진다).
 *
 * 설계 원칙:
 *   - **내부 전용**: `guide:` 스킴만 허용. 출력 href 는 항상 `${prefix}/guide/{id}`.
 *     외부 URL·임의 경로는 만들 수 없다(스킴 화이트리스트).
 *   - **로케일 자동**: prefix('' | '/en' | '/ja' | '/zh')만 넘기면 현재 언어의
 *     가이드로 연결된다. 작성자는 언어별 경로를 신경 쓸 필요 없이 도구 id 만 쓴다.
 *   - **XSS 불가**: dangerouslySetInnerHTML 을 쓰지 않고 React 노드로 직접
 *     구성한다. 매칭되지 않은 텍스트는 평문 그대로 출력.
 *
 * 정적 export 의 server component 에서 호출해 정적 HTML 에 박힌다.
 */

import type { ReactNode } from 'react';

// [label](guide:tool-id) — label 은 ']' 제외, id 는 소문자/숫자/하이픈.
const INLINE_LINK = /\[([^\]]+)\]\(guide:([a-z0-9-]+)\)/g;

/**
 * 인라인 링크 구문을 평문(라벨만)으로 변환한다.
 * JSON-LD(FAQPage 등) 구조화 데이터·메타 텍스트에는 마크업이 아닌 깨끗한
 * 텍스트가 들어가야 하므로, 렌더 대신 이 함수로 구문을 제거한다.
 * 예: "필요하면 [이미지 압축](guide:compress)으로" → "필요하면 이미지 압축으로"
 */
export function stripInlineGuide(text: string): string {
  if (!text.includes('](guide:')) return text;
  return text.replace(INLINE_LINK, (_full, label: string) => label);
}

/**
 * 본문 문자열을 파싱해 인라인 가이드 링크를 React 노드로 렌더한다.
 * @param text   원문(예: "변환 전 [압축](guide:compress)을 권장합니다.")
 * @param prefix 로케일 경로 접두사: ''(ko) | '/en' | '/ja' | '/zh'
 */
export function renderInlineGuide(text: string, prefix: string): ReactNode {
  // 빠른 경로: 인라인 링크가 없으면 문자열 그대로 반환.
  if (!text.includes('](guide:')) return text;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  // 새 정규식 인스턴스로 lastIndex 상태 격리(모듈 상수 재사용 시 g 플래그 안전).
  const re = new RegExp(INLINE_LINK.source, 'g');

  while ((match = re.exec(text)) !== null) {
    const [full, label, id] = match;
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <a
        key={`${id}-${match.index}`}
        href={`${prefix}/guide/${id}`}
        className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
      >
        {label}
      </a>,
    );
    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

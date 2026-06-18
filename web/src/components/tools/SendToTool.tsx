'use client';

import { ArrowUpRight } from 'lucide-react';

/** 체인 한 칸: 목표 도구의 경로 + 라벨 + 넘길 쿼리 값. */
export interface SendToToolTarget {
  /** 목표 도구 페이지 경로(예: '/tools/dev/color-contrast'). */
  href: string;
  /** 사용자에게 보이는 라벨(예: '색상 대비 검사'). */
  label: string;
  /**
   * 넘길 쿼리 값(작은 스칼라만). 받는 도구는 같은 키를
   * `useToolUrlState` 로 읽어 prefill 해야 한다. 값이 비어 있거나
   * 직렬화 불가하면 해당 키는 링크에서 제외된다.
   */
  params: Record<string, string | number | boolean | null | undefined>;
}

interface SendToToolProps {
  /** 섹션 제목(기본 "이어서 사용"). */
  heading?: string;
  /** 체인 대상 목록(의미 있는 1~2개만 — 억지 체인 금지). */
  targets: SendToToolTarget[];
}

/** 단일 스칼라를 쿼리에 담아도 안전한지 검사한다(파일·대용량 방지). */
const MAX_PARAM_LENGTH = 512;

function buildHref(target: SendToToolTarget): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(target.params)) {
    if (value === null || value === undefined || value === '') continue;
    const str = String(value);
    if (str.length > MAX_PARAM_LENGTH) continue;
    search.set(key, str);
  }
  const query = search.toString();
  return query ? `${target.href}?${query}` : target.href;
}

/**
 * 현재 도구의 값형 결과를 관련 도구로 넘기는 "도구 체이닝" 링크 묶음.
 *
 * 정적 export 환경이므로 `next/link` 대신 native `<a>` 를 쓴다(클라이언트
 * 네비게이션이 정적 export 에서 실패하는 회귀 방지). 받는 도구는 동일한
 * 쿼리 키를 `useToolUrlState` 로 읽어 입력을 prefill 한다.
 *
 * 넘기는 값은 작은 텍스트·숫자뿐이며 파일·이미지는 절대 담지 않는다.
 */
export function SendToTool({ heading = '이어서 사용', targets }: SendToToolProps) {
  if (targets.length === 0) return null;

  return (
    <section className="space-y-2 rounded-xl border bg-card/50 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {heading}
      </h2>
      <div className="flex flex-wrap gap-2">
        {targets.map((target) => (
          <a
            key={target.href}
            href={buildHref(target)}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-sm hover:bg-muted"
          >
            {target.label}
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          </a>
        ))}
      </div>
    </section>
  );
}

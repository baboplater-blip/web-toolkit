import { describe, it, expect } from 'vitest';
import { Wand2 } from 'lucide-react';
import { toChoseong, isChoseongQuery, scoreTool, searchTools } from './search';
import { filterTools, TOOLS, type ToolMeta } from './registry';

/* 합성 도구 — 랭킹 규칙을 격리 검증 */
function tool(p: Partial<ToolMeta>): ToolMeta {
  return {
    id: p.id ?? 'x',
    title: p.title ?? '제목',
    description: p.description ?? '설명',
    href: p.href ?? '/x',
    category: p.category ?? 'util',
    icon: Wand2,
    status: p.status ?? 'ready',
    phase: p.phase ?? 1,
    keywords: p.keywords,
  };
}

describe('toChoseong', () => {
  it('한글 음절을 초성으로 변환', () => {
    expect(toChoseong('얼굴')).toBe('ㅇㄱ');
    expect(toChoseong('얼굴 모자이크')).toBe('ㅇㄱ ㅁㅈㅇㅋ');
    expect(toChoseong('PDF 합치기')).toBe('PDF ㅎㅊㄱ');
  });
  it('음절이 아닌 문자는 보존', () => {
    expect(toChoseong('abc123')).toBe('abc123');
  });
});

describe('isChoseongQuery', () => {
  it('초성으로만 이뤄진 토큰 판별', () => {
    expect(isChoseongQuery('ㅇㄱ')).toBe(true);
    expect(isChoseongQuery('ㅎㅊㄱ')).toBe(true);
    expect(isChoseongQuery('얼굴')).toBe(false);
    expect(isChoseongQuery('pdf')).toBe(false);
  });
});

describe('scoreTool 랭킹', () => {
  const merge = tool({ id: 'pdf-merge', title: 'PDF 합치기', keywords: ['merge', '병합'] });

  it('완전/접두 일치가 부분 일치보다 높다', () => {
    const exact = scoreTool(tool({ title: 'merge' }), ['merge']);
    const prefix = scoreTool(tool({ title: 'merge tool' }), ['merge']);
    const partial = scoreTool(tool({ title: 'auto-merge utility', keywords: [] }), ['merge']);
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(partial);
  });

  it('제목 매칭이 키워드 매칭보다 가중이 높다', () => {
    const inTitle = scoreTool(tool({ title: 'merge', keywords: [] }), ['merge']);
    const inKeyword = scoreTool(tool({ title: '합치기', keywords: ['merge'] }), ['merge']);
    expect(inTitle).toBeGreaterThan(inKeyword);
  });

  it('다중 토큰은 모두 매칭돼야 한다(AND)', () => {
    expect(scoreTool(merge, ['pdf', '병합'])).toBeGreaterThan(0);
    expect(scoreTool(merge, ['pdf', '없는단어'])).toBe(0);
  });

  it('초성 토큰으로 매칭된다', () => {
    expect(scoreTool(merge, ['ㅎㅊㄱ'])).toBeGreaterThan(0); // 합치기
  });

  it('오타/서브시퀀스를 흡수한다', () => {
    // "comprss" → "compress" 서브시퀀스
    expect(scoreTool(tool({ title: 'compress', keywords: [] }), ['comprss'])).toBeGreaterThan(0);
  });
});

describe('searchTools 정렬', () => {
  const pool = [
    tool({ id: 'a', title: 'JSON 포맷터', keywords: ['json'] }),
    tool({ id: 'b', title: 'JSON', keywords: [] }), // 완전일치 → 최상위여야
    tool({ id: 'c', title: '텍스트 변환', keywords: ['json 변환'] }),
  ];
  it('완전 일치가 가장 위로', () => {
    const r = searchTools('json', pool);
    expect(r[0].id).toBe('b');
  });
  it('미매칭은 제외', () => {
    expect(searchTools('xyzxyz', pool)).toHaveLength(0);
  });
  it('빈 쿼리는 전체 통과', () => {
    expect(searchTools('   ', pool)).toHaveLength(pool.length);
  });
});

describe('filterTools 통합 (실제 TOOLS)', () => {
  it('초성으로 실제 도구를 찾는다', () => {
    const r = filterTools('ㅇㄱ', 'all'); // 얼굴…
    expect(r.some((t) => t.title.includes('얼굴'))).toBe(true);
  });
  it('영문 키워드로 PDF 합치기를 찾는다', () => {
    const r = filterTools('merge', 'all');
    expect(r.some((t) => t.id === 'pdf-merge')).toBe(true);
  });
  it('카테고리 필터가 적용된다', () => {
    const r = filterTools('compress', 'image');
    expect(r.every((t) => t.category === 'image')).toBe(true);
  });
  it('빈 쿼리는 ready 우선 정렬', () => {
    const r = filterTools('', 'all');
    const firstPlanned = r.findIndex((t) => t.status === 'planned');
    const lastReady = r.map((t) => t.status).lastIndexOf('ready');
    if (firstPlanned !== -1) expect(firstPlanned).toBeGreaterThan(lastReady - 1);
    expect(r.length).toBe(TOOLS.length);
  });
});

'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface RegexToken {
  token: string;
  desc: string;
  example: string;
}

interface TokenGroup {
  title: string;
  tokens: RegexToken[];
}

const GROUPS: ReadonlyArray<TokenGroup> = [
  {
    title: '문자 클래스',
    tokens: [
      { token: '.', desc: '줄바꿈을 제외한 모든 문자', example: 'a.c → "abc", "a_c"' },
      { token: '\\d', desc: '숫자 [0-9]', example: '\\d{3} → "123"' },
      { token: '\\D', desc: '숫자가 아닌 문자', example: '\\D → "a", "-"' },
      { token: '\\w', desc: '단어 문자 [A-Za-z0-9_]', example: '\\w+ → "user_1"' },
      { token: '\\W', desc: '단어 문자가 아닌 것', example: '\\W → "@", " "' },
      { token: '\\s', desc: '공백(스페이스·탭·줄바꿈)', example: 'a\\sb → "a b"' },
      { token: '\\S', desc: '공백이 아닌 문자', example: '\\S+ → "word"' },
      { token: '[abc]', desc: '나열한 문자 중 하나', example: '[aeiou] → 모음' },
      { token: '[^abc]', desc: '나열한 문자를 제외한 하나', example: '[^0-9] → 숫자 외' },
      { token: '[a-z]', desc: '범위 안의 문자 하나', example: '[a-z] → 소문자' },
    ],
  },
  {
    title: '앵커·경계',
    tokens: [
      { token: '^', desc: '문자열(또는 줄)의 시작', example: '^abc → "abc..."' },
      { token: '$', desc: '문자열(또는 줄)의 끝', example: 'abc$ → "...abc"' },
      { token: '\\b', desc: '단어 경계', example: '\\bcat\\b → 단어 "cat"' },
      { token: '\\B', desc: '단어 경계가 아닌 위치', example: '\\Bcat → "scat"' },
    ],
  },
  {
    title: '수량자',
    tokens: [
      { token: '*', desc: '0회 이상 반복', example: 'ab* → "a", "abbb"' },
      { token: '+', desc: '1회 이상 반복', example: 'ab+ → "ab", "abbb"' },
      { token: '?', desc: '0회 또는 1회(선택)', example: 'colou?r → "color", "colour"' },
      { token: '{n}', desc: '정확히 n회', example: '\\d{4} → "2024"' },
      { token: '{n,}', desc: 'n회 이상', example: '\\d{2,} → "12", "123"' },
      { token: '{n,m}', desc: 'n회 이상 m회 이하', example: '\\d{2,4} → "12"~"1234"' },
      { token: '*?', desc: '게으른(lazy) 0회 이상', example: '<.*?> → 최소 매칭' },
    ],
  },
  {
    title: '그룹·치환',
    tokens: [
      { token: '(...)', desc: '캡처 그룹', example: '(ab)+ → "abab"' },
      { token: '(?:...)', desc: '캡처하지 않는 그룹', example: '(?:ab)+ → 그룹만 묶기' },
      { token: '(?<name>...)', desc: '이름 있는 캡처 그룹', example: '(?<year>\\d{4})' },
      { token: 'a|b', desc: '대안(alternation) — a 또는 b', example: 'cat|dog → "cat", "dog"' },
      { token: '\\1', desc: '역참조(첫 번째 그룹)', example: '(\\w)\\1 → "ll", "oo"' },
    ],
  },
  {
    title: '룩어라운드',
    tokens: [
      { token: '(?=...)', desc: '긍정 전방탐색', example: '\\d(?=px) → "px" 앞 숫자' },
      { token: '(?!...)', desc: '부정 전방탐색', example: '\\d(?!px) → "px" 앞이 아닌' },
      { token: '(?<=...)', desc: '긍정 후방탐색', example: '(?<=\\$)\\d+ → "$" 뒤 숫자' },
      { token: '(?<!...)', desc: '부정 후방탐색', example: '(?<!\\$)\\d+ → "$" 뒤가 아닌' },
    ],
  },
  {
    title: '플래그',
    tokens: [
      { token: 'g', desc: '전역 검색(모든 일치)', example: '/a/g → 모든 "a"' },
      { token: 'i', desc: '대소문자 무시', example: '/abc/i → "ABC"' },
      { token: 'm', desc: '여러 줄 모드(^ $ 가 줄마다)', example: '/^a/m' },
      { token: 's', desc: 'dotAll — . 이 줄바꿈도 매칭', example: '/a.b/s' },
      { token: 'u', desc: '유니코드 모드', example: '/\\u{1F600}/u' },
      { token: 'y', desc: 'sticky — lastIndex 위치에서만', example: '/a/y' },
    ],
  },
];

/** 검색어로 토큰 그룹을 필터링한다(빈 검색어는 전체 반환). */
function filterGroups(query: string): TokenGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...GROUPS];

  const result: TokenGroup[] = [];
  for (const group of GROUPS) {
    const matched = group.tokens.filter(
      (item) =>
        item.token.toLowerCase().includes(needle) ||
        item.desc.toLowerCase().includes(needle) ||
        item.example.toLowerCase().includes(needle),
    );
    if (matched.length > 0 || group.title.toLowerCase().includes(needle)) {
      result.push({ title: group.title, tokens: matched.length > 0 ? matched : group.tokens });
    }
  }
  return result;
}

export default function RegexCheatsheetPage() {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => filterGroups(query), [query]);

  const handleReset = () => setQuery('');

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="정규식 치트시트" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden />
          정규식 토큰·수량자·플래그를 빠르게 찾아봅니다.
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="토큰·설명·예시 검색 (예: 숫자, 그룹, \\d)"
            className="pl-9"
            spellCheck={false}
            autoComplete="off"
            aria-label="검색"
          />
        </div>

        {groups.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            검색 결과가 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.title} className="overflow-hidden rounded-xl border bg-card">
                <h2 className="border-b bg-muted/40 px-4 py-2 text-sm font-semibold">{group.title}</h2>
                <div>
                  {group.tokens.map((item) => (
                    <div
                      key={item.token}
                      className="grid gap-1 border-b px-4 py-2.5 last:border-b-0 sm:grid-cols-[8rem_1fr]"
                    >
                      <code className="font-mono text-sm font-semibold text-primary break-all">{item.token}</code>
                      <div className="space-y-0.5">
                        <p className="text-sm">{item.desc}</p>
                        <p className="font-mono text-xs text-muted-foreground break-all">{item.example}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface AsciiEntry {
  code: number;
  char: string;
  name: string;
}

/** 제어문자(0~31, 127) 약어와 설명. */
const CONTROL_NAMES: Record<number, AsciiEntry> = {
  0: { code: 0, char: 'NUL', name: '널 문자' },
  1: { code: 1, char: 'SOH', name: '헤딩 시작' },
  2: { code: 2, char: 'STX', name: '본문 시작' },
  3: { code: 3, char: 'ETX', name: '본문 끝' },
  4: { code: 4, char: 'EOT', name: '전송 끝' },
  5: { code: 5, char: 'ENQ', name: '조회' },
  6: { code: 6, char: 'ACK', name: '확인 응답' },
  7: { code: 7, char: 'BEL', name: '경고음' },
  8: { code: 8, char: 'BS', name: '백스페이스' },
  9: { code: 9, char: 'HT', name: '수평 탭' },
  10: { code: 10, char: 'LF', name: '줄바꿈' },
  11: { code: 11, char: 'VT', name: '수직 탭' },
  12: { code: 12, char: 'FF', name: '폼 피드' },
  13: { code: 13, char: 'CR', name: '캐리지 리턴' },
  14: { code: 14, char: 'SO', name: '시프트 아웃' },
  15: { code: 15, char: 'SI', name: '시프트 인' },
  16: { code: 16, char: 'DLE', name: '데이터 링크 이스케이프' },
  17: { code: 17, char: 'DC1', name: '장치 제어 1' },
  18: { code: 18, char: 'DC2', name: '장치 제어 2' },
  19: { code: 19, char: 'DC3', name: '장치 제어 3' },
  20: { code: 20, char: 'DC4', name: '장치 제어 4' },
  21: { code: 21, char: 'NAK', name: '부정 응답' },
  22: { code: 22, char: 'SYN', name: '동기 대기' },
  23: { code: 23, char: 'ETB', name: '전송 블록 끝' },
  24: { code: 24, char: 'CAN', name: '취소' },
  25: { code: 25, char: 'EM', name: '매체 끝' },
  26: { code: 26, char: 'SUB', name: '대체' },
  27: { code: 27, char: 'ESC', name: '이스케이프' },
  28: { code: 28, char: 'FS', name: '파일 구분자' },
  29: { code: 29, char: 'GS', name: '그룹 구분자' },
  30: { code: 30, char: 'RS', name: '레코드 구분자' },
  31: { code: 31, char: 'US', name: '단위 구분자' },
  32: { code: 32, char: 'SP', name: '공백' },
  127: { code: 127, char: 'DEL', name: '삭제' },
};

/** ASCII 0~127 전체 표(결정적 — 모듈 로드 시 1회 생성). */
const ASCII_TABLE: ReadonlyArray<AsciiEntry> = Array.from({ length: 128 }, (_, code) => {
  const control = CONTROL_NAMES[code];
  if (control) return control;
  return { code, char: String.fromCharCode(code), name: '출력 가능 문자' };
});

function toHex(code: number): string {
  return `0x${code.toString(16).toUpperCase().padStart(2, '0')}`;
}

function toOct(code: number): string {
  return `0${code.toString(8).padStart(3, '0')}`;
}

export default function AsciiTablePage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return ASCII_TABLE;
    return ASCII_TABLE.filter((entry) => {
      return (
        entry.char.toLowerCase() === trimmed ||
        entry.char.toLowerCase().includes(trimmed) ||
        entry.name.toLowerCase().includes(trimmed) ||
        String(entry.code).includes(trimmed) ||
        toHex(entry.code).toLowerCase().includes(trimmed) ||
        toOct(entry.code).includes(trimmed)
      );
    });
  }, [query]);

  function reset() {
    setQuery('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="ASCII 코드표" onReset={reset} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">ASCII 0~127 문자·10진·16진·8진 코드를 검색·참조합니다.</p>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="문자·코드·이름으로 검색 (예: A, 65, 0x41, 줄바꿈)"
          aria-label="검색"
        />

        {filtered.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 font-medium">
                <tr>
                  <th className="p-2">문자</th>
                  <th className="p-2 text-right tabular-nums">10진</th>
                  <th className="p-2 text-right tabular-nums">16진</th>
                  <th className="p-2 text-right tabular-nums">8진</th>
                  <th className="p-2">설명</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.code} className="border-b last:border-0">
                    <td className="p-2 font-mono">{entry.char}</td>
                    <td className="p-2 text-right font-mono tabular-nums">{entry.code}</td>
                    <td className="p-2 text-right font-mono tabular-nums">{toHex(entry.code)}</td>
                    <td className="p-2 text-right font-mono tabular-nums">{toOct(entry.code)}</td>
                    <td className="p-2 text-muted-foreground">{entry.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

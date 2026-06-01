'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Copy, Sigma } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';

interface Param {
  key: string;
  label: string;
  ph: string;
}
interface Template {
  id: string;
  name: string;
  desc: string;
  params: Param[];
  build: (v: Record<string, string>) => string;
}

const T = (v: Record<string, string>, k: string, fallback: string) =>
  (v[k]?.trim() || fallback);

const TEMPLATES: Template[] = [
  {
    id: 'vlookup',
    name: 'VLOOKUP (값 찾기)',
    desc: '다른 표에서 기준값으로 데이터 가져오기',
    params: [
      { key: 'key', label: '찾을 값', ph: 'A2' },
      { key: 'range', label: '찾을 범위', ph: 'Sheet2!A:C' },
      { key: 'col', label: '가져올 열 번호', ph: '3' },
    ],
    build: (v) => `=VLOOKUP(${T(v, 'key', 'A2')}, ${T(v, 'range', 'Sheet2!A:C')}, ${T(v, 'col', '2')}, FALSE)`,
  },
  {
    id: 'indexmatch',
    name: 'INDEX + MATCH (유연한 조회)',
    desc: 'VLOOKUP보다 유연한 양방향 조회',
    params: [
      { key: 'ret', label: '반환 범위', ph: 'C:C' },
      { key: 'key', label: '찾을 값', ph: 'A2' },
      { key: 'lookup', label: '찾을 범위', ph: 'A:A' },
    ],
    build: (v) => `=INDEX(${T(v, 'ret', 'C:C')}, MATCH(${T(v, 'key', 'A2')}, ${T(v, 'lookup', 'A:A')}, 0))`,
  },
  {
    id: 'sumif',
    name: 'SUMIF (조건부 합계)',
    desc: '조건에 맞는 행만 더하기',
    params: [
      { key: 'crange', label: '조건 범위', ph: 'B:B' },
      { key: 'cond', label: '조건', ph: '"영업팀"' },
      { key: 'srange', label: '합계 범위', ph: 'C:C' },
    ],
    build: (v) => `=SUMIF(${T(v, 'crange', 'B:B')}, ${T(v, 'cond', '"조건"')}, ${T(v, 'srange', 'C:C')})`,
  },
  {
    id: 'sumifs',
    name: 'SUMIFS (다중 조건 합계)',
    desc: '여러 조건을 모두 만족하는 합계',
    params: [
      { key: 'srange', label: '합계 범위', ph: 'D:D' },
      { key: 'c1r', label: '조건1 범위', ph: 'B:B' },
      { key: 'c1', label: '조건1', ph: '"서울"' },
      { key: 'c2r', label: '조건2 범위', ph: 'C:C' },
      { key: 'c2', label: '조건2', ph: '">=100"' },
    ],
    build: (v) =>
      `=SUMIFS(${T(v, 'srange', 'D:D')}, ${T(v, 'c1r', 'B:B')}, ${T(v, 'c1', '"조건1"')}, ${T(v, 'c2r', 'C:C')}, ${T(v, 'c2', '"조건2"')})`,
  },
  {
    id: 'countif',
    name: 'COUNTIF (조건부 개수)',
    desc: '조건에 맞는 셀 개수 세기',
    params: [
      { key: 'range', label: '범위', ph: 'A:A' },
      { key: 'cond', label: '조건', ph: '"완료"' },
    ],
    build: (v) => `=COUNTIF(${T(v, 'range', 'A:A')}, ${T(v, 'cond', '"조건"')})`,
  },
  {
    id: 'if',
    name: 'IF (조건 분기)',
    desc: '조건에 따라 다른 값 반환',
    params: [
      { key: 'cond', label: '조건', ph: 'A2>=60' },
      { key: 't', label: '참일 때', ph: '"합격"' },
      { key: 'f', label: '거짓일 때', ph: '"불합격"' },
    ],
    build: (v) => `=IF(${T(v, 'cond', 'A2>=60')}, ${T(v, 't', '"참"')}, ${T(v, 'f', '"거짓"')})`,
  },
  {
    id: 'iferror',
    name: 'IFERROR (오류 처리)',
    desc: '오류 시 대체값 표시 (#N/A 숨기기)',
    params: [
      { key: 'formula', label: '수식', ph: 'VLOOKUP(A2,B:C,2,0)' },
      { key: 'alt', label: '오류 시 값', ph: '""' },
    ],
    build: (v) => `=IFERROR(${T(v, 'formula', 'A2/B2')}, ${T(v, 'alt', '""')})`,
  },
  {
    id: 'textjoin',
    name: 'TEXTJOIN (여러 셀 합치기)',
    desc: '구분자로 여러 셀을 한 셀에 연결',
    params: [
      { key: 'sep', label: '구분자', ph: '", "' },
      { key: 'range', label: '범위', ph: 'A2:A10' },
    ],
    build: (v) => `=TEXTJOIN(${T(v, 'sep', '", "')}, TRUE, ${T(v, 'range', 'A2:A10')})`,
  },
  {
    id: 'round',
    name: 'ROUND (반올림)',
    desc: '지정 자리수로 반올림',
    params: [
      { key: 'num', label: '값/수식', ph: 'A2*1.1' },
      { key: 'digits', label: '자리수', ph: '0' },
    ],
    build: (v) => `=ROUND(${T(v, 'num', 'A2')}, ${T(v, 'digits', '0')})`,
  },
  {
    id: 'datedif',
    name: 'DATEDIF (기간 계산)',
    desc: '두 날짜 사이 연/월/일 차이',
    params: [
      { key: 'start', label: '시작일', ph: 'A2' },
      { key: 'end', label: '종료일', ph: 'TODAY()' },
      { key: 'unit', label: '단위', ph: '"Y" (Y년/M월/D일)' },
    ],
    build: (v) => `=DATEDIF(${T(v, 'start', 'A2')}, ${T(v, 'end', 'TODAY()')}, ${T(v, 'unit', '"Y"').replace(/\s.*/, '')})`,
  },
];

/** 수식 설명용 함수 사전. */
const FN_DICT: Record<string, string> = {
  VLOOKUP: '범위의 첫 열에서 값을 찾아 같은 행의 지정 열 값을 반환',
  HLOOKUP: '범위의 첫 행에서 값을 찾아 같은 열의 지정 행 값을 반환',
  XLOOKUP: '최신 조회 함수 — 양방향 조회, 기본값·오류 처리 내장',
  INDEX: '범위에서 행·열 번호로 값을 반환',
  MATCH: '범위에서 값의 위치(번호)를 반환',
  SUMIF: '조건에 맞는 셀의 합계',
  SUMIFS: '여러 조건을 모두 만족하는 합계',
  COUNTIF: '조건에 맞는 셀 개수',
  COUNTIFS: '여러 조건을 모두 만족하는 개수',
  AVERAGEIF: '조건에 맞는 셀의 평균',
  SUM: '합계',
  AVERAGE: '평균',
  COUNT: '숫자가 든 셀 개수',
  COUNTA: '비어 있지 않은 셀 개수',
  MAX: '최댓값',
  MIN: '최솟값',
  IF: '조건이 참/거짓일 때 각각 다른 값 반환',
  IFS: '여러 조건을 차례로 검사해 첫 참값 반환',
  IFERROR: '수식이 오류면 대체값 반환',
  AND: '모든 조건이 참이면 TRUE',
  OR: '하나라도 참이면 TRUE',
  NOT: '논리값 반전',
  CONCAT: '여러 텍스트를 연결',
  CONCATENATE: '여러 텍스트를 연결(구버전)',
  TEXTJOIN: '구분자로 여러 셀을 연결',
  LEFT: '왼쪽에서 n글자 추출',
  RIGHT: '오른쪽에서 n글자 추출',
  MID: '중간에서 글자 추출',
  LEN: '글자 수',
  TRIM: '앞뒤·중복 공백 제거',
  SUBSTITUTE: '특정 문자열을 다른 문자열로 치환',
  REPLACE: '위치 기준으로 문자열 치환',
  TEXT: '숫자/날짜를 지정 서식의 텍스트로',
  VALUE: '텍스트를 숫자로',
  ROUND: '지정 자리수로 반올림',
  ROUNDUP: '올림',
  ROUNDDOWN: '내림',
  INT: '정수부만',
  MOD: '나머지',
  TODAY: '오늘 날짜',
  NOW: '현재 날짜·시각',
  DATE: '연·월·일로 날짜 생성',
  DATEDIF: '두 날짜 사이 연/월/일 차이',
  YEAR: '연도 추출',
  MONTH: '월 추출',
  DAY: '일 추출',
  WEEKDAY: '요일 번호',
  EOMONTH: '지정 월의 마지막 날',
  NETWORKDAYS: '주말·휴일 제외 영업일 수',
  RANK: '순위',
  LARGE: 'n번째 큰 값',
  SMALL: 'n번째 작은 값',
  UNIQUE: '중복 제거한 고유 목록(최신)',
  FILTER: '조건에 맞는 행만 추출(최신)',
  SORT: '범위 정렬(최신)',
};

export default function ExcelFormulaPage() {
  const [tab, setTab] = useState<'build' | 'explain'>('build');
  const [tplId, setTplId] = useState(TEMPLATES[0].id);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [formula, setFormula] = useState('');

  const tpl = TEMPLATES.find((t) => t.id === tplId)!;
  const built = useMemo(() => tpl.build(vals), [tpl, vals]);

  const explained = useMemo(() => {
    const found = new Set<string>();
    const re = /([A-Z][A-Z0-9.]+)\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(formula.toUpperCase()))) found.add(m[1]);
    return [...found].map((fn) => ({ fn, desc: FN_DICT[fn] ?? null }));
  }, [formula]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <Sigma className="h-5 w-5" />
          <h1 className="font-semibold text-base">Excel 수식 생성·설명</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-1.5">
          {(['build', 'explain'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`h-10 text-sm rounded-md border font-medium ${
                tab === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
              }`}
            >
              {t === 'build' ? '수식 만들기' : '수식 설명'}
            </button>
          ))}
        </div>

        {tab === 'build' ? (
          <>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" htmlFor="tpl">무엇을 하고 싶나요?</label>
                <select
                  id="tpl"
                  value={tplId}
                  onChange={(e) => {
                    setTplId(e.target.value);
                    setVals({});
                  }}
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">{tpl.desc}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {tpl.params.map((p) => (
                  <div key={p.key}>
                    <label className="text-xs font-medium block mb-1" htmlFor={`p-${p.key}`}>
                      {p.label}
                    </label>
                    <Input
                      id={`p-${p.key}`}
                      value={vals[p.key] ?? ''}
                      onChange={(e) => setVals((v) => ({ ...v, [p.key]: e.target.value }))}
                      placeholder={p.ph}
                      aria-label={p.label}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">생성된 수식</span>
                <button type="button" onClick={() => copy(built)} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1 h-7' })}>
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? '복사됨' : '복사'}
                </button>
              </div>
              <code className="block text-sm font-mono break-all bg-background rounded-md border p-3">
                {built}
              </code>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="fx">수식 붙여넣기</label>
              <textarea
                id="fx"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                rows={3}
                placeholder="=IFERROR(VLOOKUP(A2, Sheet2!A:C, 3, FALSE), &quot;없음&quot;)"
                className="w-full rounded-md border bg-background p-3 text-sm font-mono"
                aria-label="수식"
              />
            </div>
            <div className="rounded-xl border bg-card p-4">
              {explained.length === 0 ? (
                <p className="text-sm text-muted-foreground">수식을 입력하면 사용된 함수를 풀어 설명합니다.</p>
              ) : (
                <ul className="space-y-2">
                  {explained.map(({ fn, desc }) => (
                    <li key={fn} className="text-sm">
                      <code className="font-mono font-semibold text-primary">{fn}</code>
                      {' — '}
                      {desc ?? <span className="text-muted-foreground">사전에 없는 함수입니다.</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            자주 쓰는 업무 수식(VLOOKUP·SUMIFS·IFERROR 등)을 항목만 채워 만들거나, 복잡한
            수식을 붙여넣어 사용된 함수를 한국어로 풀어 봅니다. 셀 참조(A2, B:B)는 본인
            시트에 맞게 수정하세요. 모든 처리는 브라우저 안에서 이뤄집니다.
          </p>
        </div>
      </main>
    </div>
  );
}

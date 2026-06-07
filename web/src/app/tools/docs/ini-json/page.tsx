'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Check, Copy, Download, FileCog } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/file-utils';

type Direction = 'ini-to-json' | 'json-to-ini';

type IniValue = string | number | boolean;
type IniSection = { [key: string]: IniValue };
type IniObject = { [key: string]: IniValue | IniSection };

const SAMPLE_INI = `; 전역 설정
appName = web-toolkit
debug = false

[server]
host = localhost
port = 8080

[database]
# 연결 정보
url = postgres://localhost/app
pool = 10`;

/* ------------------------------------------------------------------ */
/* INI 파서                                                            */
/* 섹션 [section], key = value, ; 또는 # 주석.                         */
/* 섹션 밖 키는 최상위에 둔다. 값은 따옴표 제거 후 숫자·불리언 추론.   */
/* ------------------------------------------------------------------ */

function parseIni(text: string): IniObject {
  const root: IniObject = {};
  let current: IniSection = root as IniSection;

  const lines = text.split(/\r?\n/);
  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo].trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;

    if (line.startsWith('[')) {
      if (!line.endsWith(']')) {
        throw new Error(`${lineNo + 1}번째 줄: 섹션 헤더의 닫는 대괄호가 없습니다.`);
      }
      const name = line.slice(1, -1).trim();
      if (!name) throw new Error(`${lineNo + 1}번째 줄: 빈 섹션 이름입니다.`);
      const existing = root[name];
      if (existing !== undefined && !isSection(existing)) {
        throw new Error(`${lineNo + 1}번째 줄: '${name}' 이(가) 최상위 키와 충돌합니다.`);
      }
      const section: IniSection = isSection(existing) ? existing : {};
      root[name] = section;
      current = section;
      continue;
    }

    const eq = line.indexOf('=');
    if (eq === -1) {
      throw new Error(`${lineNo + 1}번째 줄: '키 = 값' 형식이 아닙니다.`);
    }
    const key = line.slice(0, eq).trim();
    if (!key) throw new Error(`${lineNo + 1}번째 줄: 키가 비어 있습니다.`);
    current[key] = coerceIniValue(line.slice(eq + 1).trim());
  }

  return root;
}

function isSection(value: IniValue | IniSection | undefined): value is IniSection {
  return typeof value === 'object' && value !== null;
}

/** 따옴표 제거 후 불리언·숫자로 추론, 아니면 문자열. */
function coerceIniValue(raw: string): IniValue {
  if (
    raw.length >= 2 &&
    ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))
  ) {
    return raw.slice(1, -1);
  }
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^[+-]?\d+$/.test(raw) || /^[+-]?\d*\.\d+$/.test(raw)) {
    const num = Number(raw);
    if (Number.isFinite(num)) return num;
  }
  return raw;
}

/* ------------------------------------------------------------------ */
/* INI 직렬화                                                          */
/* 최상위 스칼라 먼저, 그 뒤 섹션. 중첩 객체는 1단계만 섹션으로 표현.  */
/* ------------------------------------------------------------------ */

function stringifyIni(value: unknown): string {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('최상위 JSON 값은 객체여야 INI 로 변환할 수 있습니다.');
  }
  const obj = value as { [key: string]: unknown };

  const scalarKeys: string[] = [];
  const sectionKeys: string[] = [];
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) sectionKeys.push(key);
    else scalarKeys.push(key);
  }

  const lines: string[] = [];
  for (const key of scalarKeys) {
    lines.push(`${key} = ${formatIniScalar(obj[key], key)}`);
  }

  for (const key of sectionKeys) {
    if (lines.length > 0) lines.push('');
    lines.push(`[${key}]`);
    const section = obj[key] as { [k: string]: unknown };
    for (const subKey of Object.keys(section)) {
      lines.push(`${subKey} = ${formatIniScalar(section[subKey], `${key}.${subKey}`)}`);
    }
  }

  return lines.join('\n') + '\n';
}

function formatIniScalar(value: unknown, keyPath: string): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`'${keyPath}' 의 NaN·Infinity 는 표현할 수 없습니다.`);
    return String(value);
  }
  if (value === null) {
    throw new Error(`'${keyPath}' 의 null 은 INI 로 표현할 수 없습니다.`);
  }
  throw new Error(`'${keyPath}' 의 값은 INI 로 표현할 수 없습니다(2단계 이상 중첩·배열 미지원).`);
}

/* ------------------------------------------------------------------ */

export default function IniJsonPage() {
  const [dir, setDir] = useState<Direction>('ini-to-json');
  const [input, setInput] = useState(SAMPLE_INI);
  const [output, setOutput] = useState('');
  const [prettyJson, setPrettyJson] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      if (dir === 'ini-to-json') {
        const parsed = parseIni(input);
        setOutput(JSON.stringify(parsed, null, prettyJson ? 2 : 0));
      } else {
        const parsed = JSON.parse(input) as unknown;
        setOutput(stringifyIni(parsed));
      }
    } catch (err) {
      setOutput('');
      setError(err instanceof Error ? err.message : '변환에 실패했습니다.');
    }
  }, [input, dir, prettyJson]);

  const swap = () => {
    setInput(output);
    setDir(dir === 'ini-to-json' ? 'json-to-ini' : 'ini-to-json');
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const ext = dir === 'ini-to-json' ? 'json' : 'ini';
    triggerDownload(new Blob([output], { type: 'text/plain;charset=utf-8' }), `converted.${ext}`);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <FileCog className="h-5 w-5" />
            <h1 className="font-semibold text-base">INI ↔ JSON</h1>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={swap}>
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
            방향 전환
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setDir('ini-to-json')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'ini-to-json'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            INI → JSON
          </button>
          <button
            type="button"
            onClick={() => setDir('json-to-ini')}
            className={`h-9 text-xs rounded-md border ${
              dir === 'json-to-ini'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            JSON → INI
          </button>
        </div>

        {dir === 'ini-to-json' && (
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={prettyJson}
              onChange={(e) => setPrettyJson(e.target.checked)}
            />
            JSON 정렬 (들여쓰기 2)
          </label>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <label className="text-xs font-medium">
              입력 ({dir === 'ini-to-json' ? 'INI' : 'JSON'})
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={18}
              className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs font-mono resize-y"
              spellCheck={false}
              aria-label="입력"
            />
          </div>
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">출력</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={download}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={18}
              className="w-full rounded-lg border bg-muted px-2.5 py-2 text-xs font-mono resize-y"
              aria-label="결과"
            />
          </div>
        </div>

        <Separator />
        <p className="text-[10px] text-muted-foreground text-center">
          자체 구현 파서 — 섹션·key=value·주석(; #) 지원. 숫자·불리언 자동 추론. 2단계 이상 중첩 객체와 배열은
          미지원.
        </p>
      </main>
    </div>
  );
}

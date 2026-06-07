#!/usr/bin/env node
/**
 * create-tool — 신규 도구 1폴더 자동 스캐폴딩 CLI (Phase ε).
 *
 * 한 번의 실행으로:
 *   1) src/app/tools/{route}/page.tsx           아키타입 템플릿
 *   2) src/workers/{id}.worker.ts               (worker:true 일 때)
 *   3) src/lib/tools/registry.ts                ToolMeta 항목 + lucide 아이콘 import
 *   4) src/lib/en-tools.ts                      EnToolCopy 항목 (en 제공 시)
 * 를 생성·삽입한다. 가이드(/guide·/en/guide)·HowTo JSON-LD·OG 이미지는
 * 기존 prebuild(generate-tool-metadata) 와 `npm run og:gen` 이 registry/데이터에서
 * 자동 파생하므로 별도 작업이 필요 없다.
 *
 * 사용법
 *   단일:  node scripts/create-tool.mjs \
 *            --id qr-batch --route util/qr-batch --category util \
 *            --title "QR 일괄 생성" --desc "여러 줄 텍스트를 QR 묶음으로." \
 *            --icon QrCode --keywords "qr,일괄,batch" --archetype generator
 *
 *   배치:  node scripts/create-tool.mjs --spec tools.json   (객체 또는 배열)
 *          node scripts/create-tool.mjs --spec -            (stdin 으로 JSON)
 *
 * 옵션
 *   --worker        page 가 Worker 를 호출하는 file 아키타입 골격 + worker.ts 생성
 *   --phase N       registry phase (기본 7)
 *   --en            EN 카피 동시 생성 (--en-name/--en-tagline/--en-desc/--en-keywords)
 *   --addedAt DATE  registry addedAt (기본: 오늘)
 *   --dry           파일 쓰기 없이 계획만 출력
 *   --force         기존 page.tsx 가 있어도 덮어쓰기 (registry 항목은 중복 시 항상 skip)
 *
 * spec(JSON) 필드는 위 플래그와 동일 키:
 *   { id, route, category, title, desc, icon, keywords:[], archetype,
 *     worker?, phase?, addedAt?, en?:{ name, tagline, desc, keywords:[] } }
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(__dirname, '..');
const REGISTRY = join(WEB, 'src/lib/tools/registry.ts');
const EN_TOOLS = join(WEB, 'src/lib/en-tools.ts');

const CATEGORIES = ['image', 'pdf', 'video', 'gif', 'audio', 'docs', 'text', 'dev', 'util', 'security', 'ai'];
const ARCHETYPES = ['calc', 'text', 'generator', 'file', 'viewer'];

// ── 인자 파싱 ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) {
      const key = t.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) a[key] = true;
      else {
        a[key] = next;
        i++;
      }
    } else a._.push(t);
  }
  return a;
}

function today() {
  // CLI 는 일반 Node 스크립트라 new Date() 사용 가능.
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function loadSpecs(args) {
  if (args.spec) {
    const raw = args.spec === '-' ? readStdin() : readFileSync(resolve(process.cwd(), args.spec), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  // 플래그 → 단일 spec
  const spec = {
    id: args.id,
    route: args.route,
    category: args.category,
    title: args.title,
    desc: args.desc,
    icon: args.icon,
    keywords: args.keywords ? String(args.keywords).split(',').map((s) => s.trim()).filter(Boolean) : [],
    archetype: args.archetype || 'file',
    worker: !!args.worker,
    phase: args.phase ? Number(args.phase) : undefined,
    addedAt: args.addedAt,
  };
  if (args.en) {
    spec.en = {
      name: args['en-name'],
      tagline: args['en-tagline'],
      desc: args['en-desc'],
      keywords: args['en-keywords'] ? String(args['en-keywords']).split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
  }
  return [spec];
}

// ── 검증 ─────────────────────────────────────────────────────────────────────
function validate(spec, registrySrc) {
  const errs = [];
  if (!spec.id || !/^[a-z0-9][a-z0-9-]*$/.test(spec.id)) errs.push(`id 형식 오류: ${spec.id}`);
  if (!spec.route || !/^[a-z0-9][a-z0-9/-]*$/.test(spec.route)) errs.push(`route 형식 오류: ${spec.route}`);
  if (!CATEGORIES.includes(spec.category)) errs.push(`category 불명: ${spec.category}`);
  if (!spec.title) errs.push('title 누락');
  if (!spec.desc) errs.push('desc 누락');
  if (!spec.icon || !/^[A-Z][A-Za-z0-9]*$/.test(spec.icon)) errs.push(`icon(lucide PascalCase) 오류: ${spec.icon}`);
  const arch = spec.archetype || 'file';
  if (!ARCHETYPES.includes(arch)) errs.push(`archetype 불명: ${arch} (${ARCHETYPES.join('|')})`);
  if (new RegExp(`id:\\s*'${spec.id}'`).test(registrySrc)) errs.push(`registry 에 id '${spec.id}' 이미 존재`);
  return errs;
}

// ── 아키타입 page.tsx 템플릿 ──────────────────────────────────────────────────
function pageTemplate(spec) {
  const arch = spec.archetype || 'file';
  const { title, desc, icon } = spec;
  const comp = pascal(spec.id) + 'Page';

  if (arch === 'calc') {
    return `'use client';

import { useMemo, useState } from 'react';
import { ${icon} } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ${comp}() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const result = useMemo(() => {
    const na = Number(a.replace(/,/g, ''));
    const nb = Number(b.replace(/,/g, ''));
    if (!Number.isFinite(na) || !Number.isFinite(nb) || a === '' || b === '') return null;
    // TODO: 실제 계산 로직으로 교체
    return na + nb;
  }, [a, b]);

  function copy() {
    if (result !== null) navigator.clipboard?.writeText(String(result));
  }

  return (
    <main className="mx-auto max-w-xl space-y-5 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <${icon} className="h-5 w-5 text-primary" aria-hidden />
          ${esc(title)}
        </h1>
        <p className="text-sm text-muted-foreground">${esc(desc)}</p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">값 1</span>
          <Input inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} placeholder="예: 1000" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">값 2</span>
          <Input inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} placeholder="예: 200" />
        </label>
      </div>

      {result !== null && (
        <div className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">결과</p>
            <p className="text-2xl font-bold tabular-nums">{result.toLocaleString()}</p>
          </div>
          <Button variant="outline" size="sm" onClick={copy}>복사</Button>
        </div>
      )}
    </main>
  );
}
`;
  }

  if (arch === 'text') {
    return `'use client';

import { useMemo, useState } from 'react';
import { ${icon} } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ${comp}() {
  const [input, setInput] = useState('');

  const output = useMemo(() => {
    if (!input) return '';
    // TODO: 실제 변환 로직으로 교체
    return input;
  }, [input]);

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '${spec.id}.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <${icon} className="h-5 w-5 text-primary" aria-hidden />
          ${esc(title)}
        </h1>
        <p className="text-sm text-muted-foreground">${esc(desc)}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요"
          aria-label="입력"
        />
        <textarea
          className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="결과"
          aria-label="결과"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={copy} disabled={!output}>복사</Button>
        <Button variant="outline" onClick={download} disabled={!output}>다운로드</Button>
      </div>
    </main>
  );
}
`;
  }

  if (arch === 'generator') {
    return `'use client';

import { useRef, useState } from 'react';
import { ${icon} } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ${comp}() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function generate() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // TODO: 실제 생성 로직으로 교체 (Canvas 에 그린 뒤 PNG 로 내보냄)
    canvas.width = 512;
    canvas.height = 512;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111111';
    ctx.font = '24px sans-serif';
    ctx.fillText(text || '미리보기', 24, 64);
    canvas.toBlob((blob) => {
      if (!blob) return;
      if (url) URL.revokeObjectURL(url);
      setUrl(URL.createObjectURL(blob));
    }, 'image/png');
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <${icon} className="h-5 w-5 text-primary" aria-hidden />
          ${esc(title)}
        </h1>
        <p className="text-sm text-muted-foreground">${esc(desc)}</p>
      </header>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">내용</span>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="생성할 내용" />
        </label>
        <Button onClick={generate}>생성</Button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {url && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="생성 결과" className="mx-auto max-w-full rounded-lg border" />
          <a
            href={url}
            download="${spec.id}.png"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            PNG 다운로드
          </a>
        </div>
      )}
    </main>
  );
}
`;
  }

  if (arch === 'viewer') {
    return `'use client';

import { useState } from 'react';
import { ${icon} } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';

export default function ${comp}() {
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    setError(null);
    const file = files[0];
    if (!file) return;
    try {
      // TODO: 파일을 읽어 표시할 내용으로 파싱
      setInfo(\`\${file.name} · \${(file.size / 1024).toFixed(1)} KB · \${file.type || '알 수 없음'}\`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일을 열 수 없습니다.');
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <${icon} className="h-5 w-5 text-primary" aria-hidden />
          ${esc(title)}
        </h1>
        <p className="text-sm text-muted-foreground">${esc(desc)}</p>
      </header>

      <FileDropZone accept="*/*" onFiles={handleFiles} onError={setError} />

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {info && <div className="rounded-xl border bg-card p-4 text-sm">{info}</div>}
    </main>
  );
}
`;
  }

  // arch === 'file'
  const workerBlock = spec.worker
    ? `      const worker = new Worker(new URL('@/workers/${spec.id}.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;
      const out = await new Promise<Blob>((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data.type === 'progress') setProgress(e.data.percent);
          else if (e.data.type === 'done') resolve(e.data.result);
          else if (e.data.type === 'error') reject(new Error(e.data.message));
        };
        worker.onerror = (e) => reject(new Error(e.message));
        worker.postMessage({ type: 'process', file: files[0] });
      });`
    : `      // TODO: 동적 import 로 처리 로직 로드 후 실행
      // const { process } = await import('@/lib/tools/${spec.id}');
      // const out = await process(files[0], (p) => setProgress(p));
      const out = files[0];`;

  const workerRef = spec.worker ? '\n  const workerRef = useRef<Worker | null>(null);' : '';
  const workerReset = spec.worker ? '\n    workerRef.current?.terminate();\n    workerRef.current = null;' : '';
  const useRefImport = spec.worker ? 'useRef, useState' : 'useState';

  return `'use client';

import { ${useRefImport} } from 'react';
import { ${icon}, Loader2, X } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';

export default function ${comp}() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);${workerRef}

  function reset() {${workerReset}
    setProcessing(false);
    setProgress(0);
  }

  async function handleProcess() {
    if (files.length === 0) {
      setError('파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setResult(null);
    setProcessing(true);
    setProgress(0);
    try {
${workerBlock}
      setResult({ url: URL.createObjectURL(out), name: '${spec.id}-result' });
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리에 실패했습니다.');
    } finally {
      reset();
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <${icon} className="h-5 w-5 text-primary" aria-hidden />
          ${esc(title)}
        </h1>
        <p className="text-sm text-muted-foreground">${esc(desc)}</p>
      </header>

      <FileDropZone accept="*/*" onFiles={setFiles} onError={setError} />

      <div className="flex items-center gap-2">
        <Button onClick={handleProcess} disabled={processing || files.length === 0}>
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          처리 시작
        </Button>
        {processing && (
          <>
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-primary transition-all" style={{ width: \`\${progress}%\` }} />
            </div>
            <Button variant="ghost" size="icon" onClick={reset} aria-label="취소">
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <a
          href={result.url}
          download={result.name}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          결과 다운로드
        </a>
      )}
    </main>
  );
}
`;
}

function workerTemplate(spec) {
  return `/// <reference lib="webworker" />
// ${spec.id} 처리 워커. UI 스레드 차단 없이 무거운 작업을 수행한다.

self.onmessage = async (e: MessageEvent) => {
  const { type, file } = e.data as { type: string; file: File };
  if (type !== 'process') return;
  try {
    // TODO: 실제 처리 로직. 진행률은 아래처럼 보고한다.
    // self.postMessage({ type: 'progress', percent: 50 });
    const result = new Blob([await file.arrayBuffer()], { type: file.type });
    self.postMessage({ type: 'done', result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : '처리 실패' });
  }
};

export {};
`;
}

// ── registry / en-tools 삽입 ──────────────────────────────────────────────────
function registryEntry(spec, addedAt) {
  const kw = (spec.keywords || []).map((k) => `'${k.replace(/'/g, "\\'")}'`).join(', ');
  const phase = spec.phase ?? 7;
  return `  {
    id: '${spec.id}',
    title: '${esc(spec.title)}',
    description: '${esc(spec.desc)}',
    href: '/tools/${spec.route}',
    category: '${spec.category}',
    icon: ${spec.icon},
    status: 'ready',
    phase: ${phase},
    keywords: [${kw}],
    addedAt: '${addedAt}',
  },
`;
}

function enEntry(spec) {
  const en = spec.en;
  const kw = (en.keywords || []).map((k) => `'${k.replace(/'/g, "\\'")}'`).join(', ');
  return `  '${spec.id}': {
    name: '${esc(en.name)}',
    tagline: '${esc(en.tagline)}',
    description:
      '${esc(en.desc)}',
    keywords: [${kw}],
  },
`;
}

/** lucide-react import 블록에 누락 아이콘 추가. 별칭(Hash as HashIcon) 은 base 로 검사. */
function ensureIconImports(src, icons) {
  const importRe = /import \{([\s\S]*?)\} from 'lucide-react';/;
  const m = src.match(importRe);
  if (!m) throw new Error("registry.ts 에서 lucide-react import 블록을 찾지 못함");
  const block = m[1];
  const present = new Set(
    block
      .split(',')
      .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean),
  );
  const missing = [...new Set(icons)].filter((ic) => !present.has(ic));
  if (missing.length === 0) return { src, added: [] };
  const additions = missing.map((ic) => `  ${ic},`).join('\n');
  const newBlock = block.replace(/\s*$/, '') + '\n' + additions + '\n';
  return { src: src.replace(importRe, `import {${newBlock}} from 'lucide-react';`), added: missing };
}

function insertBeforeArrayClose(src, marker, insertion) {
  // marker 다음의 첫 '^];' 라인 앞에 삽입
  const idx = src.indexOf(marker);
  if (idx < 0) throw new Error(`마커 '${marker}' 없음`);
  const closeRe = /\n\];/g;
  closeRe.lastIndex = idx;
  const cm = closeRe.exec(src);
  if (!cm) throw new Error(`'${marker}' 이후 배열 종료(];) 없음`);
  const at = cm.index + 1; // '\n' 다음
  return src.slice(0, at) + insertion + src.slice(at);
}

function insertBeforeObjectClose(src, marker, insertion) {
  const idx = src.indexOf(marker);
  if (idx < 0) throw new Error(`마커 '${marker}' 없음`);
  const closeRe = /\n\};/g;
  closeRe.lastIndex = idx;
  const cm = closeRe.exec(src);
  if (!cm) throw new Error(`'${marker}' 이후 객체 종료(};) 없음`);
  const at = cm.index + 1;
  return src.slice(0, at) + insertion + src.slice(at);
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
function pascal(slug) {
  return slug.replace(/(^|[-_])([a-z0-9])/g, (_, __, c) => c.toUpperCase());
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h || (!args.spec && !args.id)) {
    console.log('사용법: node scripts/create-tool.mjs --id <id> --route <cat/slug> --category <cat> --title <t> --desc <d> --icon <Lucide> [--archetype calc|text|generator|file|viewer] [--worker] [--keywords a,b] [--en ...] [--dry]');
    console.log('  또는: node scripts/create-tool.mjs --spec tools.json');
    process.exit(args.help || args.h ? 0 : 1);
  }

  const dry = !!args.dry;
  const force = !!args.force;
  const addedAt = args.addedAt || today();

  let registrySrc = readFileSync(REGISTRY, 'utf8');
  let enSrc = existsSync(EN_TOOLS) ? readFileSync(EN_TOOLS, 'utf8') : null;

  const specs = loadSpecs(args);
  const created = [];
  const regInserts = [];
  const enInserts = [];
  const icons = [];
  const skipped = [];

  for (const spec of specs) {
    spec.archetype = spec.archetype || 'file';
    const errs = validate(spec, registrySrc);
    if (errs.length) {
      skipped.push({ id: spec.id, errs });
      console.error(`✗ ${spec.id || '(id없음)'}: ${errs.join('; ')}`);
      continue;
    }

    const pageDir = join(WEB, 'src/app/tools', spec.route);
    const pagePath = join(pageDir, 'page.tsx');
    const pageExists = existsSync(pagePath);
    if (pageExists && !force) {
      skipped.push({ id: spec.id, errs: [`page 이미 존재: ${spec.route}/page.tsx (덮어쓰려면 --force)`] });
      console.error(`✗ ${spec.id}: page.tsx 이미 존재 (--force 로 덮어쓰기)`);
      continue;
    }

    const page = pageTemplate(spec);
    const files = [{ path: pagePath, content: page }];
    if (spec.worker) files.push({ path: join(WEB, 'src/workers', `${spec.id}.worker.ts`), content: workerTemplate(spec) });

    if (!dry) {
      mkdirSync(pageDir, { recursive: true });
      for (const f of files) {
        mkdirSync(dirname(f.path), { recursive: true });
        writeFileSync(f.path, f.content, 'utf8');
      }
    }

    icons.push(spec.icon);
    regInserts.push(registryEntry(spec, spec.addedAt || addedAt));
    if (spec.en && spec.en.name && enSrc) enInserts.push(enEntry(spec));

    created.push({ id: spec.id, route: spec.route, archetype: spec.archetype, worker: !!spec.worker, files: files.map((f) => f.path) });
  }

  if (regInserts.length) {
    const iconRes = ensureIconImports(registrySrc, icons);
    registrySrc = iconRes.src;
    registrySrc = insertBeforeArrayClose(registrySrc, 'export const TOOLS', regInserts.join(''));
    if (!dry) writeFileSync(REGISTRY, registrySrc, 'utf8');
    if (iconRes.added.length) console.log(`  + lucide 아이콘 import 추가: ${iconRes.added.join(', ')}`);
  }

  if (enInserts.length && enSrc) {
    enSrc = insertBeforeObjectClose(enSrc, 'export const EN_TOOLS', enInserts.join(''));
    if (!dry) writeFileSync(EN_TOOLS, enSrc, 'utf8');
  }

  // ── 요약 ──
  console.log('');
  console.log(`${dry ? '[DRY] ' : ''}생성 ${created.length}개 · 스킵 ${skipped.length}개 · EN ${enInserts.length}개`);
  for (const c of created) {
    console.log(`  ✓ ${c.id}  (/tools/${c.route}, ${c.archetype}${c.worker ? '+worker' : ''})`);
  }
  if (created.length && !dry) {
    console.log('');
    console.log('다음 단계:');
    console.log('  1) 각 page.tsx 의 TODO 핵심 로직 구현');
    console.log('  2) npm run build  (tsc + next build · 가이드/메타 자동 생성)');
    console.log('  3) npm run og:gen (필요 시 OG 이미지)');
  }
  if (skipped.length) process.exitCode = 1;
}

main();

'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import {
  parseEpub,
  resolveHref,
  type ParsedEpub,
} from '@/lib/tools/epub-common';

type Severity = 'ok' | 'warn' | 'error';
interface Check {
  id: string;
  label: string;
  severity: Severity;
  detail?: string;
}

export default function EpubValidatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState<Check[] | null>(null);

  async function handleProcess() {
    if (!file) {
      setError('EPUB 파일을 먼저 선택해주세요.');
      return;
    }
    setError(null);
    setBusy(true);
    setChecks(null);
    try {
      const epub = await parseEpub(file);
      const out: Check[] = await runChecks(epub);
      setChecks(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : '검증에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  const errors = checks?.filter((c) => c.severity === 'error') ?? [];
  const warns = checks?.filter((c) => c.severity === 'warn') ?? [];

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="EPUB 구조 검증" widthClass="max-w-2xl" />
    <main className="mx-auto max-w-2xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          OPF · spine · manifest · 표지 · 누락된 자산을 검사합니다.
        </p>

      </header>

      <FileDropZone
        accept="application/epub+zip,.epub"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="EPUB 파일을 끌어다 놓거나 클릭하여 선택"
      />

      <Button onClick={handleProcess} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        검증 실행
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {checks && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1">
              통과 {checks.filter((c) => c.severity === 'ok').length}
            </span>
            {warns.length > 0 && (
              <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1">
                경고 {warns.length}
              </span>
            )}
            {errors.length > 0 && (
              <span className="rounded-full bg-destructive/10 text-destructive px-2 py-1">
                오류 {errors.length}
              </span>
            )}
          </div>
          <ul className="rounded-xl border divide-y bg-card">
            {checks.map((c) => (
              <li key={c.id} className="p-3 flex items-start gap-2">
                {c.severity === 'ok' && <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />}
                {c.severity === 'warn' && <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />}
                {c.severity === 'error' && <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{c.label}</p>
                  {c.detail && <p className="text-[11px] text-muted-foreground mt-0.5 font-mono break-words">{c.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
    </div>
  );
}

async function runChecks(epub: ParsedEpub): Promise<Check[]> {
  const checks: Check[] = [];

  // 1. mimetype
  const mimetypeFile = epub.zip.file('mimetype');
  if (mimetypeFile) {
    const content = (await mimetypeFile.async('text')).trim();
    if (content === 'application/epub+zip') {
      checks.push({ id: 'mimetype', label: 'mimetype 파일이 올바릅니다.', severity: 'ok' });
    } else {
      checks.push({
        id: 'mimetype',
        label: 'mimetype 내용이 올바르지 않습니다.',
        severity: 'error',
        detail: content,
      });
    }
  } else {
    checks.push({ id: 'mimetype', label: 'mimetype 파일이 없습니다.', severity: 'error' });
  }

  // 2. container.xml
  if (epub.zip.file('META-INF/container.xml')) {
    checks.push({ id: 'container', label: 'META-INF/container.xml 존재', severity: 'ok' });
  } else {
    checks.push({ id: 'container', label: 'META-INF/container.xml 없음', severity: 'error' });
  }

  // 3. OPF
  if (epub.zip.file(epub.opfPath)) {
    checks.push({ id: 'opf', label: `OPF 패키지 파일 존재`, severity: 'ok', detail: epub.opfPath });
  } else {
    checks.push({ id: 'opf', label: 'OPF 파일을 찾을 수 없습니다.', severity: 'error' });
  }

  // 4. 메타데이터 필수
  if (epub.metadata.title && epub.metadata.title !== '제목 없음') {
    checks.push({ id: 'title', label: `제목 메타데이터: "${epub.metadata.title}"`, severity: 'ok' });
  } else {
    checks.push({ id: 'title', label: 'dc:title 누락 또는 비어 있음', severity: 'error' });
  }
  if (epub.metadata.identifier) {
    checks.push({ id: 'id', label: `식별자: ${epub.metadata.identifier}`, severity: 'ok' });
  } else {
    checks.push({ id: 'id', label: 'dc:identifier 누락', severity: 'error' });
  }
  if (epub.metadata.language) {
    checks.push({ id: 'lang', label: `언어: ${epub.metadata.language}`, severity: 'ok' });
  } else {
    checks.push({ id: 'lang', label: 'dc:language 누락', severity: 'error' });
  }
  if (epub.metadata.creator) {
    checks.push({ id: 'creator', label: `저자: ${epub.metadata.creator}`, severity: 'ok' });
  } else {
    checks.push({ id: 'creator', label: 'dc:creator 비어 있음', severity: 'warn' });
  }

  // 5. spine 비어있는지
  if (epub.spine.length === 0) {
    checks.push({ id: 'spine', label: 'spine 이 비어 있음 (읽을 챕터가 없음)', severity: 'error' });
  } else {
    checks.push({ id: 'spine', label: `읽기 순서 ${epub.spine.length} 챕터`, severity: 'ok' });
  }

  // 6. spine idref → manifest 매칭
  const missingSpine = epub.spine.filter((id) => !epub.manifest.has(id));
  if (missingSpine.length > 0) {
    checks.push({
      id: 'spine-manifest',
      label: 'spine 의 idref 가 manifest 와 매칭되지 않음',
      severity: 'error',
      detail: missingSpine.slice(0, 5).join(', '),
    });
  } else {
    checks.push({ id: 'spine-manifest', label: 'spine ↔ manifest 일관성 OK', severity: 'ok' });
  }

  // 7. manifest 항목 파일 실재 검증 (최대 50개까지만 — 큰 책 보호)
  const items = Array.from(epub.manifest.values());
  const missing: string[] = [];
  for (const item of items.slice(0, 50)) {
    const path = resolveHref(epub.opfDir, item.href);
    if (!epub.zip.file(path)) missing.push(item.href);
  }
  if (missing.length > 0) {
    checks.push({
      id: 'manifest-files',
      label: `manifest 의 ${missing.length} 개 파일이 zip 안에 없음`,
      severity: 'error',
      detail: missing.slice(0, 5).join(', '),
    });
  } else {
    checks.push({
      id: 'manifest-files',
      label: `manifest 항목 ${Math.min(items.length, 50)} 개 파일 존재 확인`,
      severity: 'ok',
    });
  }

  // 8. 표지
  if (epub.coverItemId) {
    checks.push({
      id: 'cover',
      label: `표지 검출: ${epub.manifest.get(epub.coverItemId)?.href}`,
      severity: 'ok',
    });
  } else {
    checks.push({ id: 'cover', label: '표지가 지정되어 있지 않음', severity: 'warn' });
  }

  // 9. nav (EPUB3)
  if (epub.version === '3') {
    const hasNav = Array.from(epub.manifest.values()).some(
      (i) => i.properties && /\bnav\b/.test(i.properties),
    );
    if (hasNav) {
      checks.push({ id: 'nav', label: 'EPUB3 nav (목차) 존재', severity: 'ok' });
    } else {
      checks.push({ id: 'nav', label: 'EPUB3 인데 nav 항목이 없음 (목차 권장)', severity: 'warn' });
    }
  }

  return checks;
}

'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  FolderDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';
import type { BatchOutput } from '@/lib/tools/folder-batch';
import { buildZip } from '@/lib/tools/zip-builder';
import {
  isFsAccessSupported,
  pickDirectory,
  writeFileToDirectory,
} from '@/lib/tools/fs-access';

export interface BatchResultPanelProps {
  results: BatchOutput[];
  /** ZIP 안의 최상위 폴더명. 비우면 평탄. */
  zipRootName?: string;
  /** 다운로드 ZIP 파일명 */
  zipFileName?: string;
  /** 부가 통계 노출 (입력 대비 출력 크기 등) */
  totalInputSize?: number;
}

export function BatchResultPanel({
  results,
  zipRootName,
  zipFileName = 'web-toolkit-batch.zip',
  totalInputSize,
}: BatchResultPanelProps) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(results.map((_, i) => i)),
  );
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveDone, setSaveDone] = useState<number | null>(null);

  const okResults = useMemo(() => results.filter((r) => !r.error), [results]);
  const errCount = results.length - okResults.length;
  const totalOutputSize = okResults.reduce((s, r) => s + r.blob.size, 0);
  const fsSupported = isFsAccessSupported();

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(results.map((_, i) => i)));
  const selectNone = () => setSelected(new Set());

  const downloadSelected = () => {
    for (const i of selected) {
      const r = results[i];
      if (r.error) continue;
      const baseName = r.relativePath.split('/').pop() || 'file';
      triggerDownload(r.blob, baseName);
    }
  };

  const downloadZip = async () => {
    setZipping(true);
    setZipProgress(0);
    try {
      const filtered = [...selected].sort().map((i) => results[i]);
      const blob = await buildZip(filtered, {
        rootName: zipRootName,
        onProgress: setZipProgress,
      });
      triggerDownload(blob, zipFileName);
    } finally {
      setZipping(false);
      setZipProgress(0);
    }
  };

  const saveToFolder = async () => {
    setSaveError(null);
    setSaveDone(null);
    setSaving(true);
    try {
      const dir = await pickDirectory();
      if (!dir) {
        setSaving(false);
        return;
      }
      let count = 0;
      const filtered = [...selected].sort().map((i) => results[i]);
      for (const r of filtered) {
        if (r.error) continue;
        await writeFileToDirectory(dir, r.relativePath, r.blob);
        count++;
      }
      setSaveDone(count);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          결과 ({okResults.length}/{results.length})
          {errCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              실패 {errCount}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={selectAll}>
            전체
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={selectNone}>
            해제
          </Button>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3">
        <span>선택: {selected.size}개</span>
        <span>총 크기: {formatBytes(totalOutputSize)}</span>
        {totalInputSize !== undefined && totalInputSize > 0 && (
          <span>
            절감: {Math.max(0, Math.round((1 - totalOutputSize / totalInputSize) * 100))}%
          </span>
        )}
      </div>

      <ul className="max-h-72 overflow-y-auto space-y-0.5 rounded-lg border bg-background/40 p-1">
        {results.map((r, i) => {
          const isSelected = selected.has(i);
          return (
            <li
              key={`${r.relativePath}-${i}`}
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                r.error
                  ? 'bg-destructive/5 text-destructive'
                  : isSelected
                    ? 'bg-primary/5'
                    : 'hover:bg-muted'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={!!r.error}
                onChange={() => toggle(i)}
                aria-label={`${r.relativePath} 선택`}
                className="h-3 w-3 shrink-0"
              />
              {r.error ? (
                <AlertTriangle className="h-3 w-3 shrink-0" />
              ) : (
                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
              )}
              <span className="flex-1 truncate font-mono text-[11px]" title={r.relativePath}>
                {r.relativePath}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                {r.error ? r.error : formatBytes(r.blob.size)}
              </span>
              {!r.error && (
                <button
                  type="button"
                  onClick={() => {
                    const name = r.relativePath.split('/').pop() || 'file';
                    triggerDownload(r.blob, name);
                  }}
                  className="h-5 w-5 shrink-0 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`${r.relativePath} 다운로드`}
                >
                  <Download className="h-3 w-3" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          onClick={downloadZip}
          disabled={zipping || selected.size === 0}
          className="w-full"
        >
          {zipping ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              ZIP 생성 중 {Math.round(zipProgress)}%
            </>
          ) : (
            <>
              <Archive className="h-4 w-4" />
              ZIP 다운로드 ({selected.size})
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={saveToFolder}
          disabled={!fsSupported || saving || selected.size === 0}
          className="w-full"
          title={fsSupported ? undefined : 'Chrome·Edge·Opera 에서만 지원됩니다.'}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <FolderDown className="h-4 w-4" />
              폴더에 저장
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={downloadSelected}
          disabled={selected.size === 0}
          className="w-full"
        >
          <Download className="h-4 w-4" />
          개별 다운로드
        </Button>
      </div>

      {!fsSupported && (
        <p className="text-[10px] text-muted-foreground text-center">
          폴더 직접 저장은 Chrome·Edge·Opera 에서만 지원됩니다. 다른 브라우저에서는 ZIP 을
          사용하세요.
        </p>
      )}
      {saveError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {saveError}
        </div>
      )}
      {saveDone !== null && !saveError && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-300">
          {saveDone}개 파일을 폴더에 저장했습니다.
        </div>
      )}
    </div>
  );
}

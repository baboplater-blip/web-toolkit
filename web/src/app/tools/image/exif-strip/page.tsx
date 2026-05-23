'use client';

import { useState } from 'react';
import { Loader2, ShieldOff } from 'lucide-react';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';
import {
  commonRoot,
  filterFiles,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

type PiexifMod = {
  default?: { remove: (jpegData: string) => string };
  remove?: (jpegData: string) => string;
};

let piexifCache: { remove: (data: string) => string } | null = null;
async function loadPiexif() {
  if (piexifCache) return piexifCache;
  const mod = (await import('piexifjs')) as unknown as PiexifMod;
  const lib = mod.default ?? mod;
  if (!lib.remove) throw new Error('piexifjs 로드 실패');
  piexifCache = { remove: lib.remove };
  return piexifCache;
}

async function stripExifOne(file: File): Promise<Blob> {
  const piexif = await loadPiexif();
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    bin += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  const dataUrl = `data:image/jpeg;base64,${btoa(bin)}`;
  const stripped = piexif.remove(dataUrl);
  const m = stripped.match(/^data:[^;]+;base64,(.+)$/);
  if (!m) throw new Error('처리 결과가 비어있습니다.');
  const binOut = atob(m[1]);
  const outBuf = new Uint8Array(binOut.length);
  for (let i = 0; i < binOut.length; i++) outBuf[i] = binOut.charCodeAt(i);
  return new Blob([outBuf], { type: 'image/jpeg' });
}

export default function ExifStripPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onFolderPicked = (files: RelativeFile[]) => {
    setError(null);
    setResult(null);
    setBatchResults(null);
    const filtered = filterFiles(files, { extensions: ['.jpg', '.jpeg'] });
    if (filtered.length === 0) {
      setError('폴더 안에 JPG 파일이 없습니다.');
      setAllFolderFiles([]);
      setFolderFiles([]);
      return;
    }
    setAllFolderFiles(filtered);
    setFolderFiles(filtered);
  };

  async function handleStrip() {
    setError(null);
    setResult(null);
    setBatchResults(null);

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setBusy(true);
      try {
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const blob = await stripExifOne(rf.file);
            return { relativePath: rf.relativePath, blob };
          },
          {
            concurrency: 3,
            onProgress: (d, t, p) => setProgress(`처리 중 ${d}/${t} — ${p}`),
          },
        );
        setBatchResults(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : '일괄 처리 실패');
      } finally {
        setBusy(false);
        setProgress('');
      }
      return;
    }

    if (!file) {
      setError('JPG 파일을 선택해주세요.');
      return;
    }
    setBusy(true);
    try {
      const blob = await stripExifOne(file);
      const baseName = file.name.replace(/\.(jpe?g)$/i, '');
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-no-exif.jpg`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'EXIF 제거에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  const ready = inputMode === 'folder' ? folderFiles.length > 0 : !!file;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldOff className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EXIF 제거</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          JPG 사진의 EXIF (위치·촬영 정보·카메라 모델) 메타데이터를 제거합니다.
        </p>
      </header>

      <DualDropZone
        mode={inputMode}
        onModeChange={(m) => {
          setInputMode(m);
          setError(null);
        }}
        fileProps={{
          accept: 'image/jpeg,.jpg,.jpeg',
          onFiles: (files) => setFile(files[0] ?? null),
          title: 'JPG 파일을 끌어다 놓거나 클릭하여 선택',
          hint: 'JPEG/JPG 만 지원 (HEIC 는 HEIC→JPG 로 먼저 변환)',
        }}
        folderProps={{
          accept: 'image/jpeg',
          description: '폴더 안 모든 JPG 의 EXIF 를 일괄 제거합니다.',
          onFolder: onFolderPicked,
        }}
      />

      {inputMode === 'folder' && allFolderFiles.length > 0 && (
        <FolderPreviewPanel
          files={allFolderFiles}
          onSelectionChange={setFolderFiles}
          fileKindLabel="이미지"
        />
      )}

      <Button onClick={handleStrip} disabled={busy || !ready}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {busy && progress ? progress : 'EXIF 제거'}
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <ResultCard
          fileName={result.filename}
          originalSize={result.originalSize}
          compressedSize={result.compressedSize}
          blobUrl={result.blobUrl}
          extraInfo="GPS · 촬영 정보 · 카메라 모델 제거됨"
        />
      )}

      {batchResults && (
        <BatchResultPanel
          results={batchResults}
          zipRootName={commonRoot(folderFiles) || 'no-exif'}
          zipFileName={`${commonRoot(folderFiles) || 'images'}-no-exif.zip`}
          totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
        />
      )}

      <div className="rounded-lg border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">왜 EXIF 를 제거하나요?</p>
        <p>
          스마트폰으로 찍은 사진에는 GPS 좌표·촬영 시각·기기 정보가 함께 저장됩니다.
          공개 게시·SNS 업로드 전 EXIF 를 제거하면 의도치 않은 위치 노출을 막을 수 있습니다.
        </p>
      </div>
    </main>
  );
}

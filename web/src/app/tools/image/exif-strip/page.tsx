'use client';

import { useState } from 'react';
import { Loader2, ShieldOff } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { Button } from '@/components/ui/button';

export default function ExifStripPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStrip() {
    if (!file) {
      setError('JPG 파일을 선택해주세요.');
      return;
    }
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const mod = (await import('piexifjs')) as unknown as {
        default?: { remove: (jpegData: string) => string };
        remove?: (jpegData: string) => string;
      };
      const piexif = mod.default ?? mod;
      if (!piexif.remove) throw new Error('piexifjs 로드 실패');

      // piexifjs 는 "binary string" 입력 받는다 (FileReader.readAsDataURL → 또는 직접 변환)
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      // piexif.remove 는 base64 data URL 도 받는다. 안전을 위해 data URL 로 감싼다.
      const dataUrl = `data:image/jpeg;base64,${btoa(bin)}`;
      const stripped = piexif.remove(dataUrl);

      // stripped 는 base64 data URL → Blob 으로
      const m = stripped.match(/^data:[^;]+;base64,(.+)$/);
      if (!m) throw new Error('처리 결과가 비어있습니다.');
      const binOut = atob(m[1]);
      const outBuf = new Uint8Array(binOut.length);
      for (let i = 0; i < binOut.length; i++) outBuf[i] = binOut.charCodeAt(i);
      const blob = new Blob([outBuf], { type: 'image/jpeg' });

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

      <FileDropZone
        accept="image/jpeg,.jpg,.jpeg"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="JPG 파일을 끌어다 놓거나 클릭하여 선택"
        hint="JPEG/JPG 만 지원 (HEIC 는 HEIC→JPG 로 먼저 변환)"
      />

      <Button onClick={handleStrip} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        EXIF 제거
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

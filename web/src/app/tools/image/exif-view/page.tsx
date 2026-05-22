'use client';

import { useState } from 'react';
import { Loader2, Info } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';

interface ExifGroup {
  title: string;
  entries: Array<{ label: string; value: string }>;
}

export default function ExifViewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [groups, setGroups] = useState<ExifGroup[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRead() {
    if (!file) {
      setError('이미지 파일을 선택해주세요.');
      return;
    }
    setError(null);
    setGroups(null);
    setBusy(true);
    try {
      const exifr = await import('exifr');
      // exifr.parse 의 두 번째 인자는 옵션 객체. 타입이 boolean union 으로 좁혀져 있어 cast.
      const opts: unknown = { gps: true, exif: true, ifd0: true, xmp: false };
      const parseAny = exifr.parse as unknown as (
        file: File,
        opts: unknown,
      ) => Promise<Record<string, unknown> | undefined>;
      const data = await parseAny(file, opts);
      if (!data) {
        setError('이 사진에는 EXIF 정보가 없습니다.');
        return;
      }

      const next: ExifGroup[] = [
        {
          title: '카메라',
          entries: pick(data, [
            ['Make', '제조사'],
            ['Model', '모델'],
            ['LensModel', '렌즈'],
            ['Software', '소프트웨어'],
          ]),
        },
        {
          title: '촬영',
          entries: pick(data, [
            ['DateTimeOriginal', '촬영 시각'],
            ['ExposureTime', '노출 시간'],
            ['FNumber', '조리개'],
            ['ISO', 'ISO'],
            ['FocalLength', '초점거리'],
            ['Flash', '플래시'],
          ]),
        },
        {
          title: '이미지',
          entries: pick(data, [
            ['ExifImageWidth', '가로'],
            ['ExifImageHeight', '세로'],
            ['Orientation', '회전'],
            ['ColorSpace', '색공간'],
          ]),
        },
        {
          title: '위치 (GPS)',
          entries: pick(data, [
            ['latitude', '위도'],
            ['longitude', '경도'],
            ['GPSAltitude', '고도'],
          ]),
        },
      ].filter((g) => g.entries.length > 0);

      if (next.length === 0) {
        setError('표시할 수 있는 EXIF 정보가 없습니다.');
      } else {
        setGroups(next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'EXIF 추출에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EXIF 뷰어</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          사진의 촬영 정보·GPS·카메라 정보를 표시합니다.
        </p>
      </header>

      <FileDropZone
        accept="image/jpeg,image/heic,image/heif,image/tiff,.jpg,.jpeg,.heic,.heif,.tif,.tiff"
        onFiles={(files) => setFile(files[0] ?? null)}
        title="이미지 파일을 끌어다 놓거나 클릭하여 선택"
        hint="JPG · HEIC · TIFF (EXIF 가 있는 포맷)"
      />

      <Button onClick={handleRead} disabled={busy || !file}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        EXIF 읽기
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {groups && (
        <div className="space-y-3">
          {groups.map((g) => (
            <section key={g.title} className="rounded-xl border bg-card p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {g.title}
              </h2>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
                {g.entries.map((e) => (
                  <div key={e.label} className="contents">
                    <dt className="text-muted-foreground">{e.label}</dt>
                    <dd className="font-medium break-all">{e.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function pick(
  data: Record<string, unknown>,
  spec: Array<[string, string]>,
): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  for (const [key, label] of spec) {
    const v = data[key];
    if (v === undefined || v === null || v === '') continue;
    if (v instanceof Date) {
      out.push({ label, value: v.toLocaleString('ko-KR') });
    } else if (typeof v === 'number') {
      out.push({ label, value: String(Math.round(v * 1000) / 1000) });
    } else {
      out.push({ label, value: String(v) });
    }
  }
  return out;
}

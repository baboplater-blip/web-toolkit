'use client';

import { useRef, useState } from 'react';
import { Loader2, Info, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import {
  commonRoot,
  filterFiles,
  runBatch,
  type RelativeFile,
} from '@/lib/tools/folder-batch';
import { triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

interface ExifGroup {
  title: string;
  entries: Array<{ label: string; value: string }>;
}

const EXIF_FIELDS = [
  'DateTimeOriginal',
  'GPSLatitude',
  'GPSLongitude',
  'latitude',
  'longitude',
  'Make',
  'Model',
  'LensModel',
  'ExposureTime',
  'FNumber',
  'ISO',
  'FocalLength',
];

const CSV_HEADER = [
  'relative_path',
  'size_bytes',
  'date',
  'gps_lat',
  'gps_lon',
  'make',
  'model',
  'lens',
  'shutter',
  'aperture',
  'iso',
  'focal_length',
];

const IMAGE_EXTS = ['.jpg', '.jpeg', '.heic', '.heif', '.tif', '.tiff', '.png', '.webp'];

/** CSV 한 값 인코딩: 콤마·따옴표·개행이 있으면 큰따옴표로 감싸고 내부 " 는 "" 로 치환 */
function csvEscape(value: string): string {
  if (value === '' || value === null || value === undefined) return '';
  const needsQuote = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

function formatExifValue(v: unknown): string {
  if (v === undefined || v === null || v === '') return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'number') return String(Math.round(v * 1000) / 1000);
  return String(v);
}

/** exifr 로 메타데이터 추출. 실패 시 모든 필드 빈 문자열. */
async function extractExif(file: File): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const f of EXIF_FIELDS) result[f] = '';
  try {
    const exifr = await import('exifr');
    const opts: unknown = { gps: true, exif: true, ifd0: true, xmp: false };
    const parseAny = exifr.parse as unknown as (
      file: File,
      opts: unknown,
    ) => Promise<Record<string, unknown> | undefined>;
    const data = await parseAny(file, opts);
    if (!data) return result;
    for (const f of EXIF_FIELDS) {
      if (f in data) result[f] = formatExifValue(data[f]);
    }
  } catch {
    /* return empty fields on parse error */
  }
  return result;
}

function buildCsvLine(relativePath: string, sizeBytes: number, exif: Record<string, string>): string {
  // GPS 는 exifr 가 latitude/longitude 로 컴포지트 필드 제공 (10진수). 그것 우선, 없으면 raw.
  const lat = exif.latitude || exif.GPSLatitude || '';
  const lon = exif.longitude || exif.GPSLongitude || '';
  const cols = [
    relativePath,
    String(sizeBytes),
    exif.DateTimeOriginal,
    lat,
    lon,
    exif.Make,
    exif.Model,
    exif.LensModel,
    exif.ExposureTime,
    exif.FNumber,
    exif.ISO,
    exif.FocalLength,
  ];
  return cols.map(csvEscape).join(',');
}

export default function ExifViewPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [groups, setGroups] = useState<ExifGroup[] | null>(null);
  const [csvResult, setCsvResult] = useState<{
    blob: Blob;
    fileName: string;
    rowCount: number;
    errorCount: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFolderPicked = (files: RelativeFile[]) => {
    setError(null);
    setGroups(null);
    setCsvResult(null);
    const filtered = filterFiles(files, { extensions: IMAGE_EXTS });
    if (filtered.length === 0) {
      setError('폴더 안에 EXIF 가 있을 만한 이미지가 없습니다.');
      setAllFolderFiles([]);
      setFolderFiles([]);
      return;
    }
    setAllFolderFiles(filtered);
    setFolderFiles(filtered);
  };

  async function handleRead() {
    setError(null);
    setCsvResult(null);
    setGroups(null);

    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setBusy(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: folderFiles.length, current: '' });
      try {
        const rows: string[] = [CSV_HEADER.join(',')];
        let errorCount = 0;
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const exif = await extractExif(rf.file);
            const line = buildCsvLine(rf.relativePath, rf.file.size, exif);
            // CSV 한 줄을 Blob 으로 회수 — buildZip 으로 가지 않는다.
            return { relativePath: rf.relativePath, blob: new Blob([line]) };
          },
          {
            concurrency: 3,
            signal: ctrl.signal,
            onProgress: (done, total, path) => {
              setProgress({ done, total, current: path });
              setProgressText(`EXIF 추출 ${done}/${total} — ${path}`);
            },
          },
        );
        // 결과를 순서대로 CSV 본문 구성. runBatch 는 input 순서를 보장하므로 그대로 사용.
        for (const r of results) {
          if (r.error) {
            errorCount++;
            // 실패한 줄도 경로·크기만이라도 포함 (나머지 빈 값)
            const idx = results.indexOf(r);
            const rf = folderFiles[idx];
            const empty: Record<string, string> = {};
            for (const f of EXIF_FIELDS) empty[f] = '';
            rows.push(buildCsvLine(rf.relativePath, rf.file.size, empty));
          } else {
            rows.push(await r.blob.text());
          }
        }

        const csv = rows.join('\r\n');
        // BOM 추가 — 엑셀에서 한글·UTF-8 인식
        const bom = '﻿';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        const root = commonRoot(folderFiles) || 'exif';
        setCsvResult({
          blob,
          fileName: `${root}-exif.csv`,
          rowCount: results.length,
          errorCount,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : '일괄 EXIF 추출 실패');
      } finally {
        abortRef.current = null;
        setProgress(null);
        setCancelling(false);
        setBusy(false);
        setProgressText('');
      }
      return;
    }

    // 파일 모드 — 기존 단일 표시
    if (!file) {
      setError('이미지 파일을 선택해주세요.');
      return;
    }
    setBusy(true);
    try {
      const exifr = await import('exifr');
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

  const cancelRun = () => {
    if (abortRef.current && !cancelling) {
      setCancelling(true);
      abortRef.current.abort();
    }
  };

  const ready = inputMode === 'folder' ? folderFiles.length > 0 : !!file;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          <h1 className="text-xl font-semibold">EXIF 뷰어</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          사진의 촬영 정보·GPS·카메라 정보를 표시합니다. 폴더 모드는 모든 이미지의 EXIF 를 CSV
          한 장으로 익스포트합니다.
        </p>
      </header>

      <DualDropZone
        mode={inputMode}
        onModeChange={(m) => {
          setInputMode(m);
          setError(null);
          setGroups(null);
          setCsvResult(null);
        }}
        fileProps={{
          accept: 'image/jpeg,image/heic,image/heif,image/tiff,.jpg,.jpeg,.heic,.heif,.tif,.tiff',
          onFiles: (files) => {
            setFile(files[0] ?? null);
            setGroups(null);
            setCsvResult(null);
          },
          title: '이미지 파일을 끌어다 놓거나 클릭하여 선택',
          hint: 'JPG · HEIC · TIFF (EXIF 가 있는 포맷)',
        }}
        folderProps={{
          accept: 'image/*',
          description: '폴더 안 모든 이미지의 EXIF 를 추출하여 CSV 한 장으로 익스포트합니다.',
          onFolder: onFolderPicked,
        }}
      />

      {inputMode === 'folder' && allFolderFiles.length > 0 && (
        <>
          <FolderPreviewPanel
            files={allFolderFiles}
            onSelectionChange={setFolderFiles}
            fileKindLabel="이미지"
          />
          <p className="text-[10px] text-muted-foreground">
            CSV 컬럼: relative_path, size_bytes, date, gps_lat, gps_lon, make, model, lens, shutter,
            aperture, iso, focal_length
          </p>
        </>
      )}

      <Button onClick={handleRead} disabled={busy || !ready}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {busy && progressText
          ? progressText
          : inputMode === 'folder'
            ? `CSV 익스포트 (${folderFiles.length}장)`
            : 'EXIF 읽기'}
      </Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {progress && (
        <BatchProgressPanel
          done={progress.done}
          total={progress.total}
          current={progress.current}
          onCancel={cancelRun}
          label="EXIF 추출 중"
          cancelling={cancelling}
        />
      )}

      {csvResult && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">EXIF CSV 익스포트 완료</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground">총 행</p>
              <p className="text-sm font-semibold mt-0.5">{csvResult.rowCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">EXIF 미검출</p>
              <p className="text-sm font-semibold mt-0.5">{csvResult.errorCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">CSV 크기</p>
              <p className="text-sm font-semibold mt-0.5">{formatBytes(csvResult.blob.size)}</p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => triggerDownload(csvResult.blob, csvResult.fileName)}
          >
            <Download className="h-4 w-4" />
            {csvResult.fileName} 다운로드
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            UTF-8 BOM 포함 · 엑셀에서 바로 한글 표시.
          </p>
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

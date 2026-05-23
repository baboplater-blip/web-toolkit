'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ArrowLeft,
  FileImage,
  FileText,
  Loader2,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DualDropZone, useBatchMode } from '@/components/tools/DualDropZone';
import { BatchResultPanel } from '@/components/tools/BatchResultPanel';
import { BatchProgressPanel } from '@/components/tools/BatchProgressPanel';
import { FolderPreviewPanel } from '@/components/tools/FolderPreviewPanel';
import { ResultCard } from '@/components/tools/ResultCard';
import {
  compressImage,
  isImageFile,
  type ImageCompressOptions,
  type ImageOutputFormat,
} from '@/lib/compress/image';
import {
  compressPdf,
  isPdfFile,
  type PdfCompressMode,
  type PdfCompressOptions,
  type PdfCompressProgress,
} from '@/lib/compress/pdf';
import { formatBytes, renameWithSuffix } from '@/lib/compress/format';
import {
  commonRoot,
  filterFiles,
  replaceExtension,
  runBatch,
  type BatchOutput,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

type FileKind = 'image' | 'pdf' | 'unsupported';

interface ResultState {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  url: string;
  blob: Blob;
  extraInfo?: string;
}

function detectKind(file: File): FileKind {
  if (isImageFile(file)) return 'image';
  if (isPdfFile(file)) return 'pdf';
  return 'unsupported';
}

export default function CompressPage() {
  const { mode: inputMode, setMode: setInputMode } = useBatchMode();
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<FileKind>('unsupported');
  const [allFolderFiles, setAllFolderFiles] = useState<RelativeFile[]>([]);
  const [folderFiles, setFolderFiles] = useState<RelativeFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState<string>('');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [batchResults, setBatchResults] = useState<BatchOutput[] | null>(null);

  // 이미지 옵션
  const [imgQuality, setImgQuality] = useState(75);
  const [imgMaxDim, setImgMaxDim] = useState(1920);
  const [imgFormat, setImgFormat] = useState<ImageOutputFormat>('jpeg');

  // PDF 옵션
  const [pdfMode, setPdfMode] = useState<PdfCompressMode>('smart');
  const [pdfQuality, setPdfQuality] = useState(72);
  const [pdfScale, setPdfScale] = useState(150); // 1.0 ~ 2.0 범위 * 100
  const [pdfMaxImageDim, setPdfMaxImageDim] = useState(1600);

  const clearResult = useCallback(() => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
  }, [result]);

  const acceptFile = useCallback(
    (f: File) => {
      const k = detectKind(f);
      clearResult();
      setError(null);
      if (k === 'unsupported') {
        setFile(null);
        setKind('unsupported');
        setError('지원하지 않는 파일 형식입니다. 이미지 또는 PDF 파일만 업로드 가능합니다.');
        return;
      }
      setFile(f);
      setKind(k);
    },
    [clearResult],
  );

  const onFolderPicked = (files: RelativeFile[]) => {
    clearResult();
    setBatchResults(null);
    setError(null);
    const filtered = filterFiles(files, {
      mimePrefixes: ['image/', 'application/pdf'],
      extensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.gif', '.pdf'],
    });
    if (filtered.length === 0) {
      setError('폴더 안에 처리할 이미지·PDF 가 없습니다.');
      setAllFolderFiles([]);
      setFolderFiles([]);
      return;
    }
    setAllFolderFiles(filtered);
    setFolderFiles(filtered);
  };

  const reset = () => {
    clearResult();
    setFile(null);
    setKind('unsupported');
    setAllFolderFiles([]);
    setFolderFiles([]);
    setBatchResults(null);
    setError(null);
    setProgressText('');
  };

  async function compressOne(srcFile: File, srcKind: FileKind): Promise<Blob> {
    if (srcKind === 'image') {
      const out = await compressImage(srcFile, {
        quality: imgQuality / 100,
        maxDimension: imgMaxDim,
        format: imgFormat,
      });
      return out.blob;
    }
    if (srcKind === 'pdf') {
      const out = await compressPdf(srcFile, {
        mode: pdfMode,
        quality: pdfQuality / 100,
        scale: pdfScale / 100,
        maxImageDimension: pdfMaxImageDim,
      });
      return out.blob;
    }
    throw new Error('지원하지 않는 파일 형식');
  }

  const runCompression = async () => {
    if (inputMode === 'folder') {
      if (folderFiles.length === 0) {
        setError('처리할 파일을 선택하세요.');
        return;
      }
      setProcessing(true);
      setError(null);
      clearResult();
      setBatchResults(null);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setCancelling(false);
      setProgress({ done: 0, total: folderFiles.length, current: '' });
      try {
        const results = await runBatch(
          folderFiles,
          async (rf) => {
            const k = detectKind(rf.file);
            if (k === 'unsupported') {
              return {
                relativePath: rf.relativePath,
                blob: new Blob(),
                error: '지원하지 않는 형식',
              };
            }
            const blob = await compressOne(rf.file, k);
            let outPath = rf.relativePath;
            if (k === 'image') {
              outPath = replaceExtension(rf.relativePath, imgFormat === 'jpeg' ? 'jpg' : imgFormat);
            }
            return { relativePath: outPath, blob };
          },
          {
            concurrency: 1, // PDF 처리는 메모리 비용이 큼 → 직렬
            signal: ctrl.signal,
            onProgress: (done, total, path) => {
              setProgress({ done, total, current: path });
            },
          },
        );
        setBatchResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : '일괄 압축 실패');
      } finally {
        abortRef.current = null;
        setProgress(null);
        setCancelling(false);
        setProcessing(false);
        setProgressText('');
      }
      return;
    }

    if (!file) return;
    setProcessing(true);
    setError(null);
    clearResult();
    setProgressText('');

    try {
      if (kind === 'image') {
        const opts: Partial<ImageCompressOptions> = {
          quality: imgQuality / 100,
          maxDimension: imgMaxDim,
          format: imgFormat,
        };
        const out = await compressImage(file, opts);
        const newName = renameWithSuffix(file.name, '-compressed', imgFormat === 'jpeg' ? 'jpg' : imgFormat);
        setResult({
          fileName: newName,
          originalSize: out.originalSize,
          compressedSize: out.compressedSize,
          url: URL.createObjectURL(out.blob),
          blob: out.blob,
          extraInfo: `${out.width} × ${out.height} · ${imgFormat.toUpperCase()}`,
        });
      } else if (kind === 'pdf') {
        const opts: Partial<PdfCompressOptions> = {
          mode: pdfMode,
          quality: pdfQuality / 100,
          scale: pdfScale / 100,
          maxImageDimension: pdfMaxImageDim,
        };
        const onProgress = (p: PdfCompressProgress) => {
          const stageMap: Record<PdfCompressProgress['stage'], string> = {
            preparing: 'PDF 분석 중',
            scanning: '이미지 스캔 중',
            recompressing: `이미지 재인코딩 ${p.current}/${p.total}`,
            rendering: `페이지 변환 중 ${p.current}/${p.total}`,
            assembling: 'PDF 재조립 중',
            done: '완료',
          };
          setProgressText(stageMap[p.stage]);
        };
        const out = await compressPdf(file, opts, onProgress);
        const newName = renameWithSuffix(file.name, '-compressed', 'pdf');
        const modeLabel =
          pdfMode === 'light'
            ? '가벼운 압축'
            : pdfMode === 'smart'
              ? '스마트 압축'
              : '래스터화 압축';
        const extraInfo =
          pdfMode === 'smart' && out.imagesProcessed !== undefined
            ? `${out.pageCount}페이지 · ${modeLabel} · 이미지 ${out.imagesProcessed}개 처리${out.imagesSkipped ? ` (${out.imagesSkipped}개 스킵)` : ''}`
            : `${out.pageCount}페이지 · ${modeLabel}`;
        setResult({
          fileName: newName,
          originalSize: out.originalSize,
          compressedSize: out.compressedSize,
          url: URL.createObjectURL(out.blob),
          blob: out.blob,
          extraInfo,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '압축 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  const cancelRun = () => {
    if (abortRef.current && !cancelling) {
      setCancelling(true);
      abortRef.current.abort();
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <a
              href="/tools"
              className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
              title="도구로"
              aria-label="도구 목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Wand2 className="h-5 w-5" />
            <h1 className="font-semibold text-base">파일 용량 줄이기</h1>
          </div>
          {(file || allFolderFiles.length > 0) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {((inputMode === 'files' && !file) ||
          (inputMode === 'folder' && allFolderFiles.length === 0)) && (
          <DualDropZone
            mode={inputMode}
            onModeChange={(m) => {
              setInputMode(m);
              setError(null);
            }}
            fileProps={{
              accept: 'image/*,application/pdf',
              description: '이미지 (JPG/PNG/WebP) 또는 PDF 파일',
              onFiles: (files) => acceptFile(files[0]),
            }}
            folderProps={{
              accept: 'image/*,application/pdf',
              description: '폴더 안의 이미지·PDF 를 한꺼번에 압축합니다.',
              onFolder: onFolderPicked,
            }}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {inputMode === 'folder' && allFolderFiles.length > 0 && (
          <>
            <FolderPreviewPanel
              files={allFolderFiles}
              onSelectionChange={setFolderFiles}
              fileKindLabel="파일"
            />
            <p className="text-[11px] text-muted-foreground">
              이미지에는 이미지 설정, PDF 에는 PDF 설정이 자동으로 적용됩니다.
            </p>
          </>
        )}

        {/* 파일 정보 + 설정 (파일 모드일 때만 단일 정보) */}
        {file && inputMode === 'files' && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              {kind === 'image' ? (
                <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />
              ) : (
                <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {kind === 'image' ? '이미지' : 'PDF'}
              </Badge>
            </div>

            <Separator />

            {/* 이미지 옵션 */}
            {kind === 'image' && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium">품질</label>
                    <span className="text-xs text-muted-foreground">{imgQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={1}
                    value={imgQuality}
                    onChange={(e) => setImgQuality(Number(e.target.value))}
                    disabled={imgFormat === 'png' || processing}
                    className="w-full accent-primary disabled:opacity-50"
                  />
                  {imgFormat === 'png' && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      PNG는 무손실 포맷이므로 품질 슬라이더가 적용되지 않습니다.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium">최대 크기 (긴 변, px)</label>
                    <span className="text-xs text-muted-foreground">
                      {imgMaxDim === 0 ? '원본 유지' : `${imgMaxDim}px`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4096}
                    step={128}
                    value={imgMaxDim}
                    onChange={(e) => setImgMaxDim(Number(e.target.value))}
                    disabled={processing}
                    className="w-full accent-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
                  <div className="flex gap-1.5">
                    {(['jpeg', 'webp', 'png'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setImgFormat(f)}
                        disabled={processing}
                        className={`flex-1 h-8 text-xs rounded-md border transition-colors ${
                          imgFormat === f
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-border'
                        } disabled:opacity-50`}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PDF 옵션 */}
            {kind === 'pdf' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">압축 모드</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPdfMode('light')}
                      disabled={processing}
                      className={`h-auto py-2 px-2 text-xs rounded-md border transition-colors text-left ${
                        pdfMode === 'light'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      } disabled:opacity-50`}
                    >
                      <div className="font-medium">가볍게</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        메타만 제거<br />5~15%↓
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfMode('smart')}
                      disabled={processing}
                      className={`h-auto py-2 px-2 text-xs rounded-md border transition-colors text-left ${
                        pdfMode === 'smart'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      } disabled:opacity-50`}
                    >
                      <div className="font-medium">스마트 (권장)</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        이미지만 재압축<br />텍스트·벡터 보존
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfMode('rasterize')}
                      disabled={processing}
                      className={`h-auto py-2 px-2 text-xs rounded-md border transition-colors text-left ${
                        pdfMode === 'rasterize'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      } disabled:opacity-50`}
                    >
                      <div className="font-medium">래스터화</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        페이지 전체 JPEG<br />최대 감소
                      </div>
                    </button>
                  </div>
                  {pdfMode === 'smart' && (
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                      원본 PDF 구조를 그대로 유지하며 내부 이미지만 재인코딩합니다. 텍스트
                      선택·북마크·폼 완전 보존.
                    </p>
                  )}
                </div>

                {pdfMode === 'smart' && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium">이미지 품질</label>
                        <span className="text-xs text-muted-foreground">{pdfQuality}%</span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={95}
                        step={1}
                        value={pdfQuality}
                        onChange={(e) => setPdfQuality(Number(e.target.value))}
                        disabled={processing}
                        className="w-full accent-primary"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        낮출수록 감소율이 커지지만 이미지 화질이 떨어집니다. 텍스트에는 영향 없음.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium">이미지 최대 크기 (긴 변)</label>
                        <span className="text-xs text-muted-foreground">
                          {pdfMaxImageDim === 0 ? '원본 유지' : `${pdfMaxImageDim}px`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={3200}
                        step={100}
                        value={pdfMaxImageDim}
                        onChange={(e) => setPdfMaxImageDim(Number(e.target.value))}
                        disabled={processing}
                        className="w-full accent-primary"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        고해상도 이미지를 다운샘플합니다. 인쇄용이 아니면 1200~1600px 권장.
                      </p>
                    </div>
                  </>
                )}

                {pdfMode === 'rasterize' && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium">JPEG 품질</label>
                        <span className="text-xs text-muted-foreground">{pdfQuality}%</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={95}
                        step={1}
                        value={pdfQuality}
                        onChange={(e) => setPdfQuality(Number(e.target.value))}
                        disabled={processing}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium">렌더링 배율</label>
                        <span className="text-xs text-muted-foreground">
                          {(pdfScale / 100).toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min={75}
                        max={200}
                        step={5}
                        value={pdfScale}
                        onChange={(e) => setPdfScale(Number(e.target.value))}
                        disabled={processing}
                        className="w-full accent-primary"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        배율이 높을수록 선명해지지만 용량이 커집니다.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <Separator />

            <Button onClick={runCompression} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '압축 중...'}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  압축 시작
                </>
              )}
            </Button>
          </div>
        )}

        {/* 폴더 모드 옵션 패널 — 이미지·PDF 옵션 둘 다 노출 */}
        {inputMode === 'folder' && allFolderFiles.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                이미지 옵션 (이미지에 적용)
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium">품질</label>
                    <span className="text-xs text-muted-foreground">{imgQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={1}
                    value={imgQuality}
                    onChange={(e) => setImgQuality(Number(e.target.value))}
                    disabled={imgFormat === 'png' || processing}
                    className="w-full accent-primary disabled:opacity-50"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium">최대 크기 (긴 변, px)</label>
                    <span className="text-xs text-muted-foreground">
                      {imgMaxDim === 0 ? '원본 유지' : `${imgMaxDim}px`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4096}
                    step={128}
                    value={imgMaxDim}
                    onChange={(e) => setImgMaxDim(Number(e.target.value))}
                    disabled={processing}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">출력 포맷</label>
                  <div className="flex gap-1.5">
                    {(['jpeg', 'webp', 'png'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setImgFormat(f)}
                        disabled={processing}
                        className={`flex-1 h-8 text-xs rounded-md border transition-colors ${
                          imgFormat === f
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-border'
                        } disabled:opacity-50`}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                PDF 옵션 (PDF 에 적용)
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">압축 모드</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['light', 'smart', 'rasterize'] as PdfCompressMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPdfMode(m)}
                        disabled={processing}
                        className={`h-9 text-[11px] rounded-md border ${
                          pdfMode === m
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                      >
                        {m === 'light' ? '가볍게' : m === 'smart' ? '스마트' : '래스터'}
                      </button>
                    ))}
                  </div>
                </div>
                {pdfMode !== 'light' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium">PDF 이미지 품질</label>
                      <span className="text-xs text-muted-foreground">{pdfQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={95}
                      step={1}
                      value={pdfQuality}
                      onChange={(e) => setPdfQuality(Number(e.target.value))}
                      disabled={processing}
                      className="w-full accent-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <Button onClick={runCompression} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || '압축 중...'}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  폴더 일괄 압축 ({folderFiles.length}개)
                </>
              )}
            </Button>
          </div>
        )}

        {/* 결과 카드 */}
        {result && (
          <ResultCard
            fileName={result.fileName}
            originalSize={result.originalSize}
            compressedSize={result.compressedSize}
            blobUrl={result.url}
            extraInfo={result.extraInfo}
          />
        )}

        {progress && (
          <BatchProgressPanel
            done={progress.done}
            total={progress.total}
            current={progress.current}
            onCancel={cancelRun}
            label="압축 중"
            cancelling={cancelling}
          />
        )}

        {batchResults && (
          <BatchResultPanel
            results={batchResults}
            zipRootName={commonRoot(folderFiles) || 'compressed'}
            zipFileName={`${commonRoot(folderFiles) || 'compressed'}.zip`}
            totalInputSize={folderFiles.reduce((s, f) => s + f.file.size, 0)}
          />
        )}
      </main>
    </div>
  );
}

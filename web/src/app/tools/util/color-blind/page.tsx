'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, EyeOff, Loader2, RotateCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { triggerDownload, stripExtension } from '@/lib/tools/file-utils';

type CvdType = 'protanopia' | 'deuteranopia' | 'tritanopia';

/**
 * sRGB 공간에서 동작하는 색각이상(이색형) 시뮬레이션 행렬.
 * (Machado, Oliveira & Fernandes 2009 의 severity=1.0 근사값.)
 * 각 행렬은 [R',G',B'] = M · [R,G,B] 형태로, 9개 계수를 행 우선으로 담는다.
 */
const CVD_MATRICES: Record<CvdType, readonly number[]> = {
  protanopia: [
    0.567, 0.433, 0.0,
    0.558, 0.442, 0.0,
    0.0, 0.242, 0.758,
  ],
  deuteranopia: [
    0.625, 0.375, 0.0,
    0.7, 0.3, 0.0,
    0.0, 0.3, 0.7,
  ],
  tritanopia: [
    0.95, 0.05, 0.0,
    0.0, 0.433, 0.567,
    0.0, 0.475, 0.525,
  ],
};

const CVD_LABELS: Record<CvdType, string> = {
  protanopia: '적색맹 (Protanopia)',
  deuteranopia: '녹색맹 (Deuteranopia)',
  tritanopia: '청색맹 (Tritanopia)',
};

/** 0~255 범위로 클램프해 정수로 반환한다. */
function clampByte(value: number): number {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return Math.round(value);
}

/**
 * 이미지 데이터의 픽셀에 색각이상 행렬을 적용한다. (in-place 변경)
 * 알파 채널은 보존한다.
 */
function applyCvdMatrix(imageData: ImageData, matrix: readonly number[]): void {
  const { data } = imageData;
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = matrix;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = clampByte(m0 * r + m1 * g + m2 * b);
    data[i + 1] = clampByte(m3 * r + m4 * g + m5 * b);
    data[i + 2] = clampByte(m6 * r + m7 * g + m8 * b);
  }
}

/** File → HTMLImageElement 로 디코드한다. 실패 시 reject. */
function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지를 불러오지 못했습니다.'));
    };
    img.src = objectUrl;
  });
}

export default function ColorBlindPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [cvdType, setCvdType] = useState<CvdType>('deuteranopia');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 원본 디코드 이미지를 캐시해 유형 변경 시 재디코드 없이 재처리한다.
  const imageRef = useRef<HTMLImageElement | null>(null);

  // 미리보기 URL 정리.
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);
  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  /** 캐시된 이미지에 현재 선택 유형의 행렬을 적용해 결과 URL 을 만든다. */
  const renderSimulation = useCallback(
    async (type: CvdType) => {
      const img = imageRef.current;
      if (!img) return;
      setProcessing(true);
      setError(null);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 컨텍스트를 생성하지 못했습니다.');

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        applyCvdMatrix(imageData, CVD_MATRICES[type]);
        ctx.putImageData(imageData, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        );
        if (!blob) throw new Error('이미지 변환에 실패했습니다.');

        setResultUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      } catch (err) {
        // 다른 출처 이미지(canvas tainting) 등으로 getImageData 가 막힐 수 있다.
        console.error('[color-blind] simulation failed', err);
        setError(
          err instanceof Error
            ? err.message
            : '시뮬레이션 처리 중 오류가 발생했습니다.',
        );
        setResultUrl(null);
      } finally {
        setProcessing(false);
      }
    },
    [],
  );

  const acceptImage = useCallback(
    async (incoming: File) => {
      if (!incoming.type.startsWith('image/')) {
        setError('이미지 파일만 업로드할 수 있습니다.');
        return;
      }
      setError(null);
      setResultUrl(null);
      setFile(incoming);
      setOriginalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(incoming);
      });

      try {
        imageRef.current = await loadImageElement(incoming);
        await renderSimulation(cvdType);
      } catch (err) {
        console.error('[color-blind] load failed', err);
        setError(
          err instanceof Error ? err.message : '이미지를 불러오지 못했습니다.',
        );
      }
    },
    [cvdType, renderSimulation],
  );

  const handleTypeChange = useCallback(
    (type: CvdType) => {
      setCvdType(type);
      if (imageRef.current) {
        void renderSimulation(type);
      }
    },
    [renderSimulation],
  );

  const reset = useCallback(() => {
    imageRef.current = null;
    setFile(null);
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }, []);

  const download = useCallback(async () => {
    if (!resultUrl || !file) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      triggerDownload(blob, `${stripExtension(file.name)}-${cvdType}.png`);
    } catch (err) {
      console.error('[color-blind] download failed', err);
      setError('다운로드에 실패했습니다.');
    }
  }, [resultUrl, file, cvdType]);

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
            <EyeOff className="h-5 w-5" />
            <h1 className="font-semibold text-base">색맹 시뮬레이션</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          이미지를 색각이상(적·녹·청색맹) 시야로 변환해 미리보고 다운로드합니다.
        </p>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {!file && (
          <FileDropZone
            accept="image/*"
            description="시뮬레이션할 이미지를 업로드하세요"
            onFiles={(files) => acceptImage(files[0])}
            onError={setError}
          />
        )}

        {file && (
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                다른 이미지
              </Button>
            </div>

            <div>
              <p className="text-xs font-medium mb-1.5">색각이상 유형</p>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(CVD_LABELS) as CvdType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`h-9 rounded-md border text-xs px-1 ${
                      cvdType === type
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {CVD_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground text-center">원본</p>
                <div className="rounded-lg border bg-muted p-2 flex items-center justify-center">
                  {originalUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={originalUrl}
                      alt="원본 이미지"
                      className="max-w-full max-h-[40vh] object-contain"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground text-center">
                  {CVD_LABELS[cvdType]}
                </p>
                <div className="rounded-lg border bg-muted p-2 flex items-center justify-center min-h-32">
                  {processing ? (
                    <span className="text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                      처리 중...
                    </span>
                  ) : (
                    resultUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resultUrl}
                        alt="시뮬레이션 결과"
                        className="max-w-full max-h-[40vh] object-contain"
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            <Button onClick={download} disabled={!resultUrl || processing} className="w-full">
              <Download className="h-4 w-4" />
              결과 PNG 다운로드
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

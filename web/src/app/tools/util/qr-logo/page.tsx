'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, ImagePlus, Loader2, QrCode, RotateCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { triggerDownload } from '@/lib/tools/file-utils';

/** 출력 QR 한 변의 픽셀 크기. */
const QR_SIZE = 512;
/** 로고가 차지할 비율(가로·세로). 오류정정 H(~30%) 범위 안에서 안전한 값. */
const LOGO_RATIO = 0.22;
/** 로고 뒤에 깔 흰 패딩 비율(로고 크기 대비). */
const LOGO_PADDING_RATIO = 0.12;

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
      reject(new Error('로고 이미지를 불러오지 못했습니다.'));
    };
    img.src = objectUrl;
  });
}

export default function QrLogoPage() {
  const [text, setText] = useState('https://example.com');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 디코드한 로고 이미지를 캐시해 텍스트 변경 시 재디코드를 피한다.
  const logoImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const generate = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('QR 코드에 담을 텍스트 또는 URL을 입력하세요.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = QR_SIZE;
      canvas.height = QR_SIZE;

      // 오류정정 H(~30%)로 생성해야 가운데 로고를 덮어도 스캔이 유지된다.
      const QR = await import('qrcode');
      await QR.toCanvas(canvas, trimmed, {
        errorCorrectionLevel: 'H',
        width: QR_SIZE,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 컨텍스트를 생성하지 못했습니다.');

      const logo = logoImageRef.current;
      if (logo) {
        const logoSize = Math.round(QR_SIZE * LOGO_RATIO);
        const padding = Math.round(logoSize * LOGO_PADDING_RATIO);
        const boxSize = logoSize + padding * 2;
        const boxX = Math.round((QR_SIZE - boxSize) / 2);
        const boxY = Math.round((QR_SIZE - boxSize) / 2);
        const logoX = boxX + padding;
        const logoY = boxY + padding;

        // 로고 뒤에 흰 배경을 깔아 QR 패턴과 대비를 확보한다.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(boxX, boxY, boxSize, boxSize);

        // 로고를 비율 유지하며 정사각 영역 안에 맞춘다(contain).
        const scale = Math.min(logoSize / logo.naturalWidth, logoSize / logo.naturalHeight);
        const drawW = logo.naturalWidth * scale;
        const drawH = logo.naturalHeight * scale;
        ctx.drawImage(
          logo,
          logoX + (logoSize - drawW) / 2,
          logoY + (logoSize - drawH) / 2,
          drawW,
          drawH,
        );
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) throw new Error('이미지 변환에 실패했습니다.');

      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (err) {
      console.error('[qr-logo] generate failed', err);
      setError(
        err instanceof Error ? err.message : 'QR 코드 생성 중 오류가 발생했습니다.',
      );
      setResultUrl(null);
    } finally {
      setGenerating(false);
    }
  }, [text]);

  const acceptLogo = useCallback(async (incoming: File) => {
    if (!incoming.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setError(null);
    try {
      logoImageRef.current = await loadImageElement(incoming);
      setLogoFile(incoming);
    } catch (err) {
      console.error('[qr-logo] logo load failed', err);
      setError(err instanceof Error ? err.message : '로고를 불러오지 못했습니다.');
    }
  }, []);

  const removeLogo = useCallback(() => {
    logoImageRef.current = null;
    setLogoFile(null);
  }, []);

  const download = useCallback(async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      triggerDownload(blob, 'qr-logo.png');
    } catch (err) {
      console.error('[qr-logo] download failed', err);
      setError('다운로드에 실패했습니다.');
    }
  }, [resultUrl]);

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
            <QrCode className="h-5 w-5" />
            <h1 className="font-semibold text-base">로고 QR 코드</h1>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          QR 코드 가운데에 로고를 합성합니다. 오류정정 레벨 H로 생성되어 로고를 덮어도 스캔됩니다.
        </p>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium">내용 (URL 또는 텍스트)</span>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://... 또는 텍스트"
              aria-label="내용 (URL 또는 텍스트)"
            />
          </label>

          <div>
            <p className="text-xs font-medium mb-1.5">가운데 로고 (선택)</p>
            {!logoFile ? (
              <FileDropZone
                accept="image/*"
                title="로고 이미지를 끌어다 놓거나 클릭"
                description="PNG·JPG·SVG 등 (투명 PNG 권장)"
                onFiles={(files) => acceptLogo(files[0])}
                onError={setError}
              />
            ) : (
              <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                <ImagePlus className="h-5 w-5 text-muted-foreground shrink-0" />
                <p className="text-sm font-medium truncate flex-1">{logoFile.name}</p>
                <Button variant="ghost" size="sm" onClick={removeLogo}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  제거
                </Button>
              </div>
            )}
          </div>

          <Button onClick={generate} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                QR 코드 생성
              </>
            )}
          </Button>
        </div>

        {resultUrl && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="rounded-lg border bg-muted p-3 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt="로고가 합성된 QR 코드"
                className="max-w-full max-h-[50vh]"
              />
            </div>
            <Button onClick={download} className="w-full">
              <Download className="h-4 w-4" />
              PNG 다운로드
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

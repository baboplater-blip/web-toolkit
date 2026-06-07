'use client';

import { useEffect, useState } from 'react';
import { FileDigit, Download, Copy, Check } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { Button } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';

type Mode = 'encode' | 'decode';

/** Data URI 의 base64 본문 길이로부터 디코딩된 바이트 수를 계산. */
function base64ByteLength(dataUri: string): number {
  const commaIndex = dataUri.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUri.slice(commaIndex + 1) : dataUri;
  const clean = base64.replace(/\s/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 입력을 정규화된 Data URI 로 변환한다.
 * - 이미 data: URI 면 그대로(공백만 제거).
 * - 순수 base64 면 image/png 로 가정해 접두사를 붙인다.
 * 잘못된 base64 면 예외.
 */
function normalizeToDataUri(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('변환할 Base64 또는 Data URI 를 입력하세요.');

  let dataUri: string;
  if (trimmed.startsWith('data:')) {
    if (!trimmed.includes(',')) {
      throw new Error('올바른 Data URI 형식이 아닙니다.');
    }
    dataUri = trimmed.replace(/\s/g, '');
  } else {
    const clean = trimmed.replace(/\s/g, '');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) {
      throw new Error('유효하지 않은 Base64 문자열입니다.');
    }
    dataUri = `data:image/png;base64,${clean}`;
  }

  // base64 본문 디코딩 가능 여부 검증.
  const commaIndex = dataUri.indexOf(',');
  const body = dataUri.slice(commaIndex + 1);
  try {
    atob(body);
  } catch {
    throw new Error('Base64 디코딩에 실패했습니다. 입력을 확인하세요.');
  }
  return dataUri;
}

function dataUriToBlob(dataUri: string): Blob {
  const [header, body] = dataUri.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function extensionForMime(mime: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
  };
  return map[mime] ?? 'png';
}

export default function ImageBase64Page() {
  const [mode, setMode] = useState<Mode>('encode');
  const [error, setError] = useState<string | null>(null);

  // encode
  const [dataUri, setDataUri] = useState('');
  const [copied, setCopied] = useState(false);

  // decode
  const [decodeInput, setDecodeInput] = useState('');
  const [decoded, setDecoded] = useState<{ url: string; blob: Blob; ext: string } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (decoded) URL.revokeObjectURL(decoded.url);
    };
  }, [decoded]);

  async function handleEncodeFiles(files: File[]) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('이미지 파일을 업로드해주세요.');
      return;
    }
    setError(null);
    setCopied(false);
    try {
      const uri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
        reader.readAsDataURL(file);
      });
      setDataUri(uri);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Base64 변환에 실패했습니다.');
    }
  }

  async function handleCopy() {
    if (!dataUri) return;
    try {
      await navigator.clipboard.writeText(dataUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('클립보드 복사에 실패했습니다. 직접 선택해 복사하세요.');
    }
  }

  function handleDecode() {
    setError(null);
    if (decoded) {
      URL.revokeObjectURL(decoded.url);
      setDecoded(null);
    }
    try {
      const uri = normalizeToDataUri(decodeInput);
      const blob = dataUriToBlob(uri);
      setDecoded({
        url: URL.createObjectURL(blob),
        blob,
        ext: extensionForMime(blob.type),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Data URI 복원에 실패했습니다.');
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <FileDigit className="h-5 w-5 text-primary" aria-hidden />
          이미지 ↔ Base64
        </h1>
        <p className="text-sm text-muted-foreground">
          이미지를 Base64 Data URI 로 변환하거나, Data URI / Base64 문자열을 이미지로 복원합니다.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['encode', '이미지 → Base64'],
            ['decode', 'Base64 → 이미지'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => switchMode(value)}
            className={`h-10 rounded-md border text-sm transition-colors ${
              mode === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {mode === 'encode' && (
        <div className="space-y-3">
          <FileDropZone
            accept="image/*"
            onFiles={handleEncodeFiles}
            onError={setError}
            description="Base64 로 인코딩할 이미지를 올려주세요."
          />

          {dataUri && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  Data URI ({formatBytes(dataUri.length)} 텍스트 · 이미지{' '}
                  {formatBytes(base64ByteLength(dataUri))})
                </span>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  )}
                  {copied ? '복사됨' : '복사'}
                </Button>
              </div>
              <textarea
                readOnly
                value={dataUri}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Base64 Data URI 결과"
                className="h-48 w-full resize-y rounded-md border bg-muted p-3 font-mono text-xs"
              />
            </div>
          )}
        </div>
      )}

      {mode === 'decode' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="decode-input" className="text-xs font-medium">
              Data URI 또는 Base64 문자열
            </label>
            <textarea
              id="decode-input"
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
              placeholder="data:image/png;base64,iVBORw0KGgo... 또는 순수 Base64"
              className="h-40 w-full resize-y rounded-md border bg-background p-3 font-mono text-xs"
            />
          </div>

          <Button onClick={handleDecode} disabled={!decodeInput.trim()}>
            이미지로 복원
          </Button>

          {decoded && (
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                복원된 이미지 ({decoded.blob.type || '알 수 없음'} ·{' '}
                {formatBytes(decoded.blob.size)})
              </h2>
              <div className="flex items-center justify-center rounded-lg border bg-muted p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={decoded.url}
                  alt="복원된 이미지"
                  className="max-h-[50vh] max-w-full object-contain"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => triggerDownload(decoded.blob, `decoded.${decoded.ext}`)}
              >
                <Download className="mr-2 h-4 w-4" aria-hidden />
                이미지 다운로드
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

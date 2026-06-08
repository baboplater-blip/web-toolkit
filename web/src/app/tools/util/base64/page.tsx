'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileCode,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { triggerDownload } from '@/lib/tools/file-utils';
import { formatBytes } from '@/lib/compress/format';

type Mode = 'encode-text' | 'decode-text' | 'encode-file';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function Base64Page() {
  const [mode, setMode] = useState<Mode>('encode-text');
  const [inputText, setInputText] = useState('');
  const [fileData, setFileData] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
  } | null>(null);
  // 파일 읽기 등 이벤트 핸들러에서 발생하는 에러만 별도 상태로 관리.
  const [fileError, setFileError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 변환 결과와 에러를 함께 계산해 반환한다.
  // (렌더 중 setState 호출 = 불순한 useMemo → 에러 플래시·추가 렌더 유발하므로 금지.)
  const { value: output, error: outputError } = useMemo<{
    value: string;
    error: string | null;
  }>(() => {
    if (mode === 'encode-text') {
      if (!inputText) return { value: '', error: null };
      return { value: bytesToBase64(new TextEncoder().encode(inputText)), error: null };
    }
    if (mode === 'decode-text') {
      if (!inputText) return { value: '', error: null };
      try {
        return { value: new TextDecoder('utf-8').decode(base64ToBytes(inputText)), error: null };
      } catch (err) {
        return { value: '', error: err instanceof Error ? err.message : '디코딩 실패' };
      }
    }
    return { value: fileData?.base64 ?? '', error: null };
  }, [mode, inputText, fileData]);

  // 입력 변환 에러(outputError)와 파일 읽기 에러(fileError)를 합쳐 표시.
  const error = outputError ?? fileError;

  const acceptFile = async (f: File) => {
    setFileError(null);
    try {
      const buf = await f.arrayBuffer();
      const b64 = bytesToBase64(new Uint8Array(buf));
      setFileData({
        name: f.name,
        size: f.size,
        type: f.type || 'application/octet-stream',
        base64: b64,
      });
    } catch (err) {
      setFileError(err instanceof Error ? err.message : '파일 읽기 실패');
    }
  };

  const reset = () => {
    setInputText('');
    setFileData(null);
    setFileError(null);
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const downloadDecoded = () => {
    if (mode !== 'decode-text' || !inputText) return;
    try {
      const bytes = base64ToBytes(inputText);
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
      triggerDownload(blob, 'decoded.bin');
    } catch {
      setFileError('디코딩 실패');
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
            <FileCode className="h-5 w-5" />
            <h1 className="font-semibold text-base">Base64 인코딩</h1>
          </div>
          {(inputText || fileData) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setMode('encode-text')}
            className={`h-10 text-xs rounded-md border ${
              mode === 'encode-text'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            텍스트 → Base64
          </button>
          <button
            type="button"
            onClick={() => setMode('decode-text')}
            className={`h-10 text-xs rounded-md border ${
              mode === 'decode-text'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            Base64 → 텍스트
          </button>
          <button
            type="button"
            onClick={() => setMode('encode-file')}
            className={`h-10 text-xs rounded-md border ${
              mode === 'encode-file'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            파일 → Base64
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {mode !== 'encode-file' && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <label className="text-xs font-medium block">
              {mode === 'encode-text' ? '텍스트 입력' : 'Base64 입력'}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === 'encode-text'
                  ? '인코딩할 텍스트 (UTF-8)'
                  : 'Base64 문자열 (공백/줄바꿈 허용)'
              }
              rows={8}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono resize-y"
              spellCheck={false} aria-label="encode-text" />
          </div>
        )}

        {mode === 'encode-file' && (
          <>
            {!fileData && (
              <FileDropZone
                accept="*"
                description="Base64로 인코딩할 파일을 업로드하세요"
                hint="모든 파일 타입 지원. Data URL 형식도 출력됩니다."
                onFiles={(files) => acceptFile(files[0])}
              />
            )}
            {fileData && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Upload className="h-6 w-6 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileData.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(fileData.size)} · {fileData.type}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {output && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                결과 ({output.length.toLocaleString()}자)
              </h2>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyOutput}>
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      복사
                    </>
                  )}
                </Button>
                {mode === 'decode-text' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={downloadDecoded}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    이진 저장
                  </Button>
                )}
              </div>
            </div>
            <Separator />
            <textarea
              readOnly
              value={output}
              rows={8}
              className="w-full rounded-lg border bg-muted px-3 py-2 text-xs font-mono resize-y" aria-label="결과" />
            {mode === 'encode-file' && fileData && (
              <div className="rounded-lg border bg-background p-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                  Data URL 형식
                </p>
                <p className="text-[10px] font-mono break-all">
                  data:{fileData.type};base64,{fileData.base64.slice(0, 80)}...
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

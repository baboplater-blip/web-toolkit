'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  FileLock,
  FileText,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { isPdfFile, stripExtension, triggerDownload } from '@/lib/tools/pdf-common';
import { formatBytes } from '@/lib/compress/format';

interface Permissions {
  printing: 'highResolution' | 'lowResolution' | false;
  modifying: boolean;
  copying: boolean;
  annotating: boolean;
  fillingForms: boolean;
  contentAccessibility: boolean;
  documentAssembly: boolean;
}

const PERMISSION_LABELS: Record<keyof Omit<Permissions, 'printing'>, string> = {
  modifying: '내용 편집',
  copying: '텍스트·이미지 복사',
  annotating: '주석 추가',
  fillingForms: '양식 작성',
  contentAccessibility: '접근성 도구 사용',
  documentAssembly: '페이지 추출·재조립',
};

const DEFAULT_PERMISSIONS: Permissions = {
  printing: 'highResolution',
  modifying: false,
  copying: false,
  annotating: true,
  fillingForms: true,
  contentAccessibility: true,
  documentAssembly: false,
};

export default function PdfProtectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showUserPw, setShowUserPw] = useState(false);
  const [showOwnerPw, setShowOwnerPw] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string; size: number } | null>(
    null,
  );

  const acceptFile = (f: File) => {
    if (!isPdfFile(f)) {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setResult(null);
    setFile(f);
  };

  const reset = () => {
    setFile(null);
    setUserPassword('');
    setOwnerPassword('');
    setPermissions(DEFAULT_PERMISSIONS);
    setResult(null);
    setError(null);
  };

  const togglePerm = <K extends keyof Omit<Permissions, 'printing'>>(key: K) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const runProtect = async () => {
    if (!file) return;
    if (!userPassword && !ownerPassword) {
      setError('사용자 암호 또는 소유자 암호 중 최소 하나는 입력해야 합니다.');
      return;
    }
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      // @cantoo/pdf-lib 는 보호 기능 추가된 pdf-lib 포크
      const { PDFDocument } = await import('@cantoo/pdf-lib');
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { updateMetadata: false });

      doc.encrypt({
        userPassword: userPassword || undefined,
        ownerPassword: ownerPassword || userPassword || undefined,
        permissions,
      });

      const out = await doc.save({ useObjectStreams: false });
      const blob = new Blob([out as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = stripExtension(file.name);
      setResult({
        blob,
        fileName: `${baseName}-protected.pdf`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '암호 설정 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="도구로">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <FileLock className="h-5 w-5" />
            <h1 className="font-semibold text-base">PDF 암호 설정</h1>
          </div>
          {file && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {!file && (
          <FileDropZone
            accept="application/pdf"
            description="암호를 걸 PDF 를 업로드하세요"
            onFiles={(files) => acceptFile(files[0])}
          />
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {file && (
          <>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                암호
              </h2>

              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  사용자 암호 <span className="text-muted-foreground">(PDF 열람 시 요구)</span>
                </label>
                <div className="relative">
                  <Input
                    type={showUserPw ? 'text' : 'password'}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="문서를 열 때 필요한 암호"
                    disabled={processing}
                    className="h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showUserPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  소유자 암호{' '}
                  <span className="text-muted-foreground">(권한 변경 시 요구, 선택)</span>
                </label>
                <div className="relative">
                  <Input
                    type={showOwnerPw ? 'text' : 'password'}
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="편집·인쇄 제한을 해제할 때 필요한 암호"
                    disabled={processing}
                    className="h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showOwnerPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  비워두면 사용자 암호와 동일하게 설정됩니다.
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  허용할 권한
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  체크한 항목만 허용됩니다
                </p>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">인쇄</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      [false, '금지'],
                      ['lowResolution', '저해상도만'],
                      ['highResolution', '고해상도'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setPermissions((p) => ({ ...p, printing: value }))}
                      disabled={processing}
                      className={`h-9 text-xs rounded-md border ${
                        permissions.printing === value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      } disabled:opacity-50`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                {(Object.keys(PERMISSION_LABELS) as (keyof typeof PERMISSION_LABELS)[]).map(
                  (key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={permissions[key]}
                        onChange={() => togglePerm(key)}
                        disabled={processing}
                      />
                      <span className="text-xs flex-1">{PERMISSION_LABELS[key]}</span>
                    </label>
                  ),
                )}
              </div>
            </div>

            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3">
              <p className="text-[11px] text-yellow-600 dark:text-yellow-400 leading-relaxed">
                💡 <strong>권한 설정의 한계</strong>: PDF 권한은 리더 프로그램의 자발적 준수에 의존합니다.
                전문 도구로는 우회될 수 있으므로 진정한 보안은 <strong>사용자 암호</strong>(열람 암호)로
                설정하세요.
              </p>
            </div>

            <Button onClick={runProtect} disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  암호 설정 중...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  암호 걸기
                </>
              )}
            </Button>
          </>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              완료
            </h2>
            <p className="text-xs text-muted-foreground text-center">
              크기: {formatBytes(result.size)} · 비밀번호를 잊지 마세요!
            </p>
            <Button
              className="w-full"
              onClick={() => triggerDownload(result.blob, result.fileName)}
            >
              <Download className="h-4 w-4" />
              {result.fileName} 다운로드
            </Button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          @cantoo/pdf-lib (MIT) 기반. 암호는 브라우저에서만 사용되며 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}

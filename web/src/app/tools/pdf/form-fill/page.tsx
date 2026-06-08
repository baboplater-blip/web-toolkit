'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileDropZone } from '@/components/tools/FileDropZone';
import { ResultCard } from '@/components/tools/ResultCard';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { Button } from '@/components/ui/button';
import { loadPdfLib } from '@/lib/tools/pdf-lazy';

type FieldKind = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'other';
interface FieldInfo {
  name: string;
  kind: FieldKind;
  value: string;
  options?: string[];
}

export default function PdfFormFillPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [flatten, setFlatten] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blobUrl: string;
    filename: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  // 언마운트 시 마지막 결과 ObjectURL 회수 (merge 의 생명주기와 동일)
  useEffect(() => () => { if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl); }, [result?.blobUrl]);

  async function handleLoad(f: File) {
    setFile(f);
    setError(null);
    setBusy(true);
    setFields([]);
    setResult(null);
    try {
      const { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } = await loadPdfLib();
      const doc = await PDFDocument.load(await f.arrayBuffer(), { updateMetadata: false });
      const form = doc.getForm();
      const list: FieldInfo[] = [];
      for (const field of form.getFields()) {
        const name = field.getName();
        if (field instanceof PDFTextField) {
          list.push({ name, kind: 'text', value: field.getText() ?? '' });
        } else if (field instanceof PDFCheckBox) {
          list.push({ name, kind: 'checkbox', value: field.isChecked() ? 'true' : 'false' });
        } else if (field instanceof PDFRadioGroup) {
          list.push({ name, kind: 'radio', value: field.getSelected() ?? '', options: field.getOptions() });
        } else if (field instanceof PDFDropdown) {
          list.push({ name, kind: 'dropdown', value: (field.getSelected()[0] ?? ''), options: field.getOptions() });
        } else {
          list.push({ name, kind: 'other', value: '' });
        }
      }
      setFields(list);
      if (list.length === 0) {
        setError('이 PDF 에는 채울 양식 필드(AcroForm) 가 없습니다.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF 를 열 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  function updateField(i: number, value: string) {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, value } : f)));
  }

  async function handleSave() {
    if (!file) return;
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } = await loadPdfLib();
      const doc = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
      const form = doc.getForm();
      for (const f of fields) {
        const field = form.getField(f.name);
        if (!field) continue;
        if (field instanceof PDFTextField) {
          field.setText(f.value);
        } else if (field instanceof PDFCheckBox) {
          if (f.value === 'true') field.check();
          else field.uncheck();
        } else if (field instanceof PDFRadioGroup) {
          if (f.value) field.select(f.value);
        } else if (field instanceof PDFDropdown) {
          if (f.value) field.select(f.value);
        }
      }
      if (flatten) form.flatten();
      const bytes = await doc.save({ useObjectStreams: true });
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      // 새 URL 생성 전 직전 결과 URL 회수 (재실행 시 누수 방지)
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
      setResult({
        blobUrl: URL.createObjectURL(blob),
        filename: `${baseName}-filled.pdf`,
        originalSize: file.size,
        compressedSize: blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setFields([]);
    setFlatten(false);
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="PDF 양식 채우기" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        PDF 안의 양식(AcroForm) 텍스트·체크박스·라디오·드롭다운 필드를 채워 저장합니다.
      </p>

      <FileDropZone
        accept="application/pdf,.pdf"
        onFiles={(files) => files[0] && handleLoad(files[0])}
        title="양식이 포함된 PDF 를 끌어다 놓거나 클릭"
      />

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {fields.length > 0 && (
        <div className="rounded-xl border bg-card p-3 space-y-3">
          <p className="text-xs font-semibold">{fields.length} 개 필드 발견</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {fields.map((f, i) => (
              <div key={i} className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-2">
                  <span className="truncate">{f.name}</span>
                  <span className="text-[10px] text-muted-foreground">[{f.kind}]</span>
                </label>
                {f.kind === 'text' && (
                  <input
                    value={f.value}
                    onChange={(e) => updateField(i, e.target.value)}
                    className="w-full rounded-md border bg-background px-2 py-1 text-sm" aria-label="필드 값" />
                )}
                {f.kind === 'checkbox' && (
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={f.value === 'true'}
                      onChange={(e) => updateField(i, e.target.checked ? 'true' : 'false')}
                      className="h-4 w-4"
                    />
                    체크
                  </label>
                )}
                {(f.kind === 'radio' || f.kind === 'dropdown') && (
                  <select
                    value={f.value}
                    onChange={(e) => updateField(i, e.target.value)}
                    className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                  >
                    <option value="">— 선택 —</option>
                    {(f.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {f.kind === 'other' && (
                  <p className="text-[10px] text-muted-foreground">지원하지 않는 필드 타입</p>
                )}
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" className="h-4 w-4" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} />
            양식을 평탄화(편집 잠금) 하여 저장
          </label>
          <Button onClick={handleSave} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            채워서 저장
          </Button>
        </div>
      )}

      {result && (
        <ResultCard
          fileName={result.filename}
          originalSize={result.originalSize}
          compressedSize={result.compressedSize}
          blobUrl={result.blobUrl}
        />
      )}
      </main>
    </div>
  );
}

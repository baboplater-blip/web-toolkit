'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

export interface FileDropZoneProps {
  /** <input accept="..."> 형식. 예: "image/*,application/pdf" */
  accept: string;
  /** 다중 파일 허용 여부. 기본 false */
  multiple?: boolean;
  /** 파일 선택/드롭 시 호출. multiple=false 여도 배열로 전달 (길이 1). */
  onFiles: (files: File[]) => void;
  /** 드롭존 타이틀 */
  title?: string;
  /** 드롭존 보조 설명 (파일 타입 힌트 등) */
  description?: string;
  /** 하단 작은 안내 문구 */
  hint?: string;
  /** 파일 직접 유효성 검사. 에러 문자열 반환 시 onError 호출. */
  validate?: (files: File[]) => string | null;
  /** 유효성 실패 시 */
  onError?: (message: string) => void;
}

export function FileDropZone({
  accept,
  multiple = false,
  onFiles,
  title = '파일을 끌어다 놓거나 클릭하여 선택',
  description,
  hint = '모든 처리는 브라우저 안에서 이루어집니다. 파일은 서버로 전송되지 않습니다.',
  validate,
  onError,
}: FileDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      if (validate) {
        const err = validate(files);
        if (err) {
          onError?.(err);
          return;
        }
      }
      onFiles(files);
    },
    [onFiles, validate, onError],
  );

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  return (
    <div
      role="button"
      tabIndex={0}
      // aria-label 제거: 안의 <p> 텍스트가 accessible name 으로 자동 사용됨
      // (visible label 과 mismatch 발생 방지 — WCAG 2.5.3)
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPicker();
        }
      }}
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        dragActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-hidden="true"
        tabIndex={-1}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // 같은 파일 재선택 가능하게 값 초기화
          e.target.value = '';
        }}
      />
      <Upload
        className="h-10 w-10 mx-auto text-muted-foreground mb-3"
        aria-hidden="true"
      />
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {hint && <p className="text-[10px] text-muted-foreground mt-3">{hint}</p>}
    </div>
  );
}

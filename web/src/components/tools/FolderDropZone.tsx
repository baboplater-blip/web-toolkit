'use client';

import { useCallback, useRef, useState } from 'react';
import { Folder, FolderInput } from 'lucide-react';
import {
  fromDataTransfer,
  fromFileList,
  type RelativeFile,
} from '@/lib/tools/folder-batch';

export interface FolderDropZoneProps {
  /** 선택/드롭 시 호출 — 폴더 구조 그대로 평탄화된 RelativeFile[] 반환 */
  onFolder: (files: RelativeFile[]) => void;
  /** input accept hint (실제 필터링은 호출자가 filterFiles 로 처리) */
  accept?: string;
  /** 드롭존 타이틀 */
  title?: string;
  /** 보조 설명 */
  description?: string;
}

/**
 * 폴더 입력 컴포넌트.
 * - 클릭 시 webkitdirectory <input> 으로 폴더 선택
 * - 드래그 드롭 시 DataTransferItem 재귀 워크
 * - 둘 다 동일한 RelativeFile[] 형태로 정규화
 */
export function FolderDropZone({
  onFolder,
  accept,
  title = '폴더를 끌어다 놓거나 클릭하여 선택',
  description = '폴더 안의 파일을 일괄 처리합니다. 구조는 그대로 유지됩니다.',
}: FolderDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (!e.dataTransfer.items) return;
      setBusy(true);
      try {
        const files = await fromDataTransfer(e.dataTransfer.items);
        if (files.length > 0) onFolder(files);
      } finally {
        setBusy(false);
      }
    },
    [onFolder],
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFolder(fromFileList(fileList));
    },
    [onFolder],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="폴더 선택 또는 끌어다 놓기"
      aria-busy={busy}
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
    >
      <input
        ref={(el) => {
          inputRef.current = el;
          // webkitdirectory + directory 비표준 속성 — TS prop 으로 직접 못 박으므로 ref 시점에 설정
          if (el) {
            el.setAttribute('webkitdirectory', '');
            el.setAttribute('directory', '');
          }
        }}
        type="file"
        multiple
        accept={accept}
        aria-hidden="true"
        tabIndex={-1}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        aria-hidden="true"
      >
        {busy ? <FolderInput className="h-5 w-5 animate-pulse" /> : <Folder className="h-6 w-6" />}
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      <p className="mt-3 text-[10px] text-muted-foreground">
        브라우저 안에서 모든 처리가 이뤄집니다. 폴더와 파일은 서버로 전송되지 않습니다.
      </p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { File, Folder } from 'lucide-react';
import { FileDropZone, type FileDropZoneProps } from './FileDropZone';
import { FolderDropZone, type FolderDropZoneProps } from './FolderDropZone';
import { cn } from '@/lib/utils';

export type InputMode = 'files' | 'folder';

interface DualDropZoneProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  /** 파일 모드 전달 props */
  fileProps: Omit<FileDropZoneProps, 'onFiles'> & {
    onFiles: FileDropZoneProps['onFiles'];
  };
  /** 폴더 모드 전달 props */
  folderProps: Omit<FolderDropZoneProps, 'onFolder'> & {
    onFolder: FolderDropZoneProps['onFolder'];
  };
}

/**
 * 파일 / 폴더 모드를 탭으로 토글하는 통합 드롭존.
 * 두 모드는 같은 도구에서 같은 처리 로직을 공유 — 호출자가 mode 에 따라
 * 결과를 단일 UI 또는 BatchResultPanel 로 표시한다.
 */
export function DualDropZone({
  mode,
  onModeChange,
  fileProps,
  folderProps,
}: DualDropZoneProps) {
  return (
    <div className="space-y-2">
      <div
        className="inline-flex rounded-lg border bg-card p-0.5"
        role="group"
        aria-label="입력 모드 선택"
      >
        {(
          [
            ['files', '파일', File],
            ['folder', '폴더', Folder],
          ] as const
        ).map(([v, label, Icon]) => (
          <button
            key={v}
            type="button"
            onClick={() => onModeChange(v)}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-3 text-xs rounded-md transition-colors',
              mode === v
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
            aria-pressed={mode === v}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {mode === 'files' ? (
        <FileDropZone {...fileProps} />
      ) : (
        <FolderDropZone {...folderProps} />
      )}
    </div>
  );
}

/** 파일 모드와 폴더 모드 둘 다 관리하는 상태 훅 — 도구에서 한 번에 사용 */
export function useBatchMode(initial: InputMode = 'files') {
  const [mode, setMode] = useState<InputMode>(initial);
  return { mode, setMode };
}

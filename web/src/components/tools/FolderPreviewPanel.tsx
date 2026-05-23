'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FolderTree, ListFilter, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { commonRoot, type RelativeFile } from '@/lib/tools/folder-batch';
import { formatBytes } from '@/lib/compress/format';
import { cn } from '@/lib/utils';

export interface FolderPreviewPanelProps {
  files: RelativeFile[];
  /** 사용자가 체크박스로 선택한 파일들. 호출자가 호출 시점에 받아 처리한다. */
  onSelectionChange: (selected: RelativeFile[]) => void;
  /** 헤더 라벨 (예: "이미지", "PDF") */
  fileKindLabel?: string;
  /** 트리 노출 기본값 */
  defaultView?: 'flat' | 'tree';
}

interface TreeNode {
  name: string;
  fullPath: string;
  isFile: boolean;
  fileIndex?: number; // files 배열 내 인덱스
  children?: TreeNode[];
}

function buildTree(files: RelativeFile[]): TreeNode {
  const root: TreeNode = { name: '', fullPath: '', isFile: false, children: [] };

  for (let i = 0; i < files.length; i++) {
    const parts = files[i].relativePath.split('/').filter(Boolean);
    let cur = root;
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j];
      const isLast = j === parts.length - 1;
      const path = parts.slice(0, j + 1).join('/');
      cur.children = cur.children ?? [];
      let next = cur.children.find((c) => c.name === part);
      if (!next) {
        next = {
          name: part,
          fullPath: path,
          isFile: isLast,
          fileIndex: isLast ? i : undefined,
          children: isLast ? undefined : [],
        };
        cur.children.push(next);
      }
      cur = next;
    }
  }

  // 정렬 — 폴더 우선, 그 다음 이름순 (Intl.Collator numeric)
  const collator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' });
  const sortTree = (node: TreeNode) => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return collator.compare(a.name, b.name);
    });
    node.children.forEach(sortTree);
  };
  sortTree(root);
  return root;
}

interface TreeRowProps {
  node: TreeNode;
  depth: number;
  selected: Set<number>;
  expanded: Set<string>;
  onToggleSelect: (indices: number[]) => void;
  onToggleExpand: (path: string) => void;
  files: RelativeFile[];
  matchQuery: string;
}

function collectFileIndices(node: TreeNode): number[] {
  if (node.isFile && node.fileIndex !== undefined) return [node.fileIndex];
  return (node.children ?? []).flatMap(collectFileIndices);
}

function TreeRow({
  node,
  depth,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  files,
  matchQuery,
}: TreeRowProps) {
  const isExpanded = expanded.has(node.fullPath);
  const childIndices = useMemo(() => collectFileIndices(node), [node]);
  const allSelected = childIndices.length > 0 && childIndices.every((i) => selected.has(i));
  const someSelected = childIndices.some((i) => selected.has(i));

  // 검색 필터 — 노드가 매치되거나 자손에 매치 있으면 표시
  const matches = useMemo(() => {
    if (!matchQuery) return true;
    const q = matchQuery.toLowerCase();
    if (node.fullPath.toLowerCase().includes(q)) return true;
    if (node.isFile) return false;
    return collectFileIndices(node).some((i) =>
      files[i].relativePath.toLowerCase().includes(q),
    );
  }, [matchQuery, node, files]);

  if (!matches) return null;

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1.5 py-0.5 px-1 rounded text-xs hover:bg-muted',
          allSelected && 'bg-primary/5',
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        {!node.isFile && node.children && node.children.length > 0 ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.fullPath)}
            className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = !allSelected && someSelected;
          }}
          onChange={() => onToggleSelect(childIndices)}
          aria-label={`${node.name} 선택`}
          className="h-3 w-3 shrink-0"
        />

        {node.isFile ? (
          <span className="font-mono truncate flex-1">{node.name}</span>
        ) : (
          <span className="font-medium truncate flex-1">{node.name}/</span>
        )}

        {node.isFile && node.fileIndex !== undefined && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {formatBytes(files[node.fileIndex].file.size)}
          </span>
        )}
      </div>
      {!node.isFile &&
        isExpanded &&
        node.children?.map((child) => (
          <TreeRow
            key={child.fullPath}
            node={child}
            depth={depth + 1}
            selected={selected}
            expanded={expanded}
            onToggleSelect={onToggleSelect}
            onToggleExpand={onToggleExpand}
            files={files}
            matchQuery={matchQuery}
          />
        ))}
    </>
  );
}

export function FolderPreviewPanel({
  files,
  onSelectionChange,
  fileKindLabel = '파일',
  defaultView = 'tree',
}: FolderPreviewPanelProps) {
  const [view, setView] = useState<'flat' | 'tree'>(defaultView);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(files.map((_, i) => i)),
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['']));
  const [query, setQuery] = useState('');

  const root = useMemo(() => buildTree(files), [files]);

  // files 가 바뀌면 selected 를 전체로 리셋
  useEffect(() => {
    setSelected(new Set(files.map((_, i) => i)));
    // 최상위 폴더는 기본 펼침
    if (root.children && root.children.length > 0) {
      const topDirs = root.children.filter((c) => !c.isFile).map((c) => c.fullPath);
      setExpanded(new Set(['', ...topDirs]));
    }
  }, [files, root]);

  // selection 변경 시 부모에 통보
  useEffect(() => {
    const sel = files.filter((_, i) => selected.has(i));
    onSelectionChange(sel);
  }, [selected, files, onSelectionChange]);

  const toggleSelect = (indices: number[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allInSelected = indices.every((i) => prev.has(i));
      for (const i of indices) {
        if (allInSelected) next.delete(i);
        else next.add(i);
      }
      return next;
    });
  };
  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(files.map((_, i) => i)));
  const selectNone = () => setSelected(new Set());

  const root_ = commonRoot(files);
  const totalSize = files.reduce((s, f) => s + f.file.size, 0);
  const selectedSize = files.reduce(
    (s, f, i) => (selected.has(i) ? s + f.file.size : s),
    0,
  );

  const filteredFlat = useMemo(() => {
    if (!query) return files.map((f, i) => ({ ...f, idx: i }));
    const q = query.toLowerCase();
    return files
      .map((f, i) => ({ ...f, idx: i }))
      .filter((f) => f.relativePath.toLowerCase().includes(q));
  }, [files, query]);

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          폴더 — {files.length}개 {fileKindLabel} · 루트:{' '}
          <span className="font-mono">{root_ || '(다중)'}</span>
        </h2>
        <div className="inline-flex rounded-md border bg-card p-0.5">
          {(
            [
              ['tree', '트리', FolderTree],
              ['flat', '평탄', ListFilter],
            ] as const
          ).map(([v, label, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'inline-flex items-center gap-1 h-6 px-2 text-[10px] rounded',
                view === v
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="파일명·경로 필터"
          className="h-7 pl-7 pr-7 text-xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:bg-muted"
            aria-label="검색어 지우기"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          선택 {selected.size}/{files.length} · {formatBytes(selectedSize)} /{' '}
          {formatBytes(totalSize)}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={selectAll}
            className="h-6 px-2 rounded border bg-background hover:bg-muted"
          >
            전체
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="h-6 px-2 rounded border bg-background hover:bg-muted"
          >
            해제
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto rounded border bg-background/40 p-1">
        {view === 'tree' ? (
          root.children?.map((child) => (
            <TreeRow
              key={child.fullPath}
              node={child}
              depth={0}
              selected={selected}
              expanded={expanded}
              onToggleSelect={toggleSelect}
              onToggleExpand={toggleExpand}
              files={files}
              matchQuery={query}
            />
          ))
        ) : (
          <ul className="space-y-0.5">
            {filteredFlat.map((f) => (
              <li
                key={f.idx}
                className="flex items-center gap-1.5 py-0.5 px-1.5 rounded text-xs hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selected.has(f.idx)}
                  onChange={() => toggleSelect([f.idx])}
                  aria-label={`${f.relativePath} 선택`}
                  className="h-3 w-3 shrink-0"
                />
                <span className="font-mono truncate flex-1">{f.relativePath}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {formatBytes(f.file.size)}
                </span>
              </li>
            ))}
            {filteredFlat.length === 0 && (
              <li className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                검색 결과 없음
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

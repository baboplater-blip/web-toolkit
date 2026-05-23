/**
 * 폴더 일괄 처리 공통 유틸.
 *
 * 폴더 입력은 세 가지 경로로 들어온다:
 *   1) <input webkitdirectory> → FileList (각 File 의 webkitRelativePath 가 채워짐)
 *   2) 드래그-드롭 → DataTransferItemList → entry.createReader() (재귀 워크)
 *   3) showDirectoryPicker() → FileSystemDirectoryHandle (재귀 워크)
 *
 * 어느 경로로 들어와도 결과는 RelativeFile[] — 상대 경로 + File 페어.
 */

export interface RelativeFile {
  /** "subdir/photo.jpg" 형식 상대 경로 (앞에 /  X) */
  relativePath: string;
  file: File;
}

export interface BatchOutput {
  /** 입력 파일의 상대 경로에 대응 — 일반적으로 확장자만 바뀐 형태 */
  relativePath: string;
  blob: Blob;
  /** 처리 실패 시 채워짐. blob 은 null 가능. */
  error?: string;
}

/* ---------- 입력 소스 정규화 ---------- */

/** webkitdirectory <input> 의 FileList 를 RelativeFile[] 로 변환 */
export function fromFileList(list: FileList | File[]): RelativeFile[] {
  const result: RelativeFile[] = [];
  const arr = Array.from(list);
  for (const f of arr) {
    // webkitRelativePath 는 "rootDir/subdir/photo.jpg" 형식.
    // 첫 디렉터리는 사용자가 선택한 폴더 자체이므로 그대로 두면 ZIP 에 잘 매핑.
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
    result.push({ relativePath: rel, file: f });
  }
  return result;
}

/**
 * 드래그-드롭의 DataTransferItem 배열을 재귀로 풀어 RelativeFile[] 반환.
 * 폴더가 아닌 파일이 섞여 있어도 OK.
 */
export async function fromDataTransfer(
  items: DataTransferItemList,
): Promise<RelativeFile[]> {
  const result: RelativeFile[] = [];
  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }
  for (const entry of entries) {
    await walkEntry(entry, '', result);
  }
  return result;
}

async function walkEntry(
  entry: FileSystemEntry,
  prefix: string,
  out: RelativeFile[],
): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((res, rej) =>
      (entry as FileSystemFileEntry).file(res, rej),
    );
    const rel = prefix ? `${prefix}/${file.name}` : file.name;
    out.push({ relativePath: rel, file });
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const subPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
    let batch: FileSystemEntry[] = [];
    do {
      batch = await new Promise<FileSystemEntry[]>((res, rej) =>
        reader.readEntries(res, rej),
      );
      for (const child of batch) {
        await walkEntry(child, subPrefix, out);
      }
    } while (batch.length > 0);
  }
}

/* ---------- 필터링 ---------- */

export interface AcceptSpec {
  /** 허용할 확장자 (점 포함, 소문자). 예: ['.jpg', '.png'] */
  extensions?: string[];
  /** 허용할 MIME 타입 prefix. 예: ['image/', 'application/pdf'] */
  mimePrefixes?: string[];
  /** 숨김 파일 (.DS_Store 등) 자동 제외. 기본 true. */
  excludeHidden?: boolean;
  /** 최대 파일 크기 (바이트). 초과 시 제외. */
  maxSize?: number;
}

const HIDDEN = /(^|\/)\.[^/]+/; // .git, .DS_Store 등

export function filterFiles(
  files: RelativeFile[],
  spec: AcceptSpec,
): RelativeFile[] {
  const exts = spec.extensions?.map((e) => e.toLowerCase());
  const mimes = spec.mimePrefixes;
  const excludeHidden = spec.excludeHidden !== false;
  return files.filter(({ relativePath, file }) => {
    if (excludeHidden && HIDDEN.test(relativePath)) return false;
    if (spec.maxSize !== undefined && file.size > spec.maxSize) return false;
    if (exts && exts.length > 0) {
      const lower = relativePath.toLowerCase();
      if (!exts.some((e) => lower.endsWith(e))) return false;
    }
    if (mimes && mimes.length > 0) {
      if (!mimes.some((p) => file.type.startsWith(p))) {
        // MIME 비어 있는 경우 (대부분 안드로이드/일부 브라우저) 확장자에 의지
        if (file.type) return false;
      }
    }
    return true;
  });
}

/* ---------- 경로 유틸 ---------- */

export function replaceExtension(path: string, newExt: string): string {
  const ext = newExt.startsWith('.') ? newExt : `.${newExt}`;
  const idx = path.lastIndexOf('.');
  const slashIdx = path.lastIndexOf('/');
  if (idx > slashIdx) return path.slice(0, idx) + ext;
  return path + ext;
}

export function appendSuffix(path: string, suffix: string): string {
  const idx = path.lastIndexOf('.');
  const slashIdx = path.lastIndexOf('/');
  if (idx > slashIdx) return path.slice(0, idx) + suffix + path.slice(idx);
  return path + suffix;
}

export function dirname(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx >= 0 ? path.slice(0, idx) : '';
}

export function basename(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx >= 0 ? path.slice(idx + 1) : path;
}

/** 모든 파일이 공유하는 최상위 폴더 추출. 단일 폴더만 선택했을 때 그 이름. */
export function commonRoot(files: RelativeFile[]): string {
  if (files.length === 0) return '';
  const first = files[0].relativePath.split('/');
  if (first.length < 2) return '';
  const root = first[0];
  for (const f of files) {
    if (!f.relativePath.startsWith(root + '/')) return '';
  }
  return root;
}

/* ---------- 일괄 처리 헬퍼 ---------- */

export interface BatchOptions {
  /** 동시에 처리할 파일 수. 메모리 부담을 줄이기 위한 한도. 기본 3. */
  concurrency?: number;
  /** AbortSignal — 중간 취소 */
  signal?: AbortSignal;
  /** 진행률 콜백 */
  onProgress?: (done: number, total: number, currentPath: string) => void;
}

/**
 * 파일 목록을 동시성 제한 아래 순회하며 처리 함수에 통과.
 * 각 처리 실패는 BatchOutput.error 로 회수 (전체 중단하지 않음).
 */
export async function runBatch(
  files: RelativeFile[],
  process: (rf: RelativeFile) => Promise<BatchOutput | null>,
  options: BatchOptions = {},
): Promise<BatchOutput[]> {
  const concurrency = Math.max(1, options.concurrency ?? 3);
  const results: BatchOutput[] = new Array(files.length);
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= files.length) return;
      if (options.signal?.aborted) {
        results[idx] = {
          relativePath: files[idx].relativePath,
          blob: new Blob(),
          error: '취소됨',
        };
        done++;
        continue;
      }
      try {
        const out = await process(files[idx]);
        results[idx] = out ?? {
          relativePath: files[idx].relativePath,
          blob: new Blob(),
          error: '처리 결과가 비어 있습니다',
        };
      } catch (e) {
        results[idx] = {
          relativePath: files[idx].relativePath,
          blob: new Blob(),
          error: e instanceof Error ? e.message : String(e),
        };
      }
      done++;
      options.onProgress?.(done, files.length, files[idx].relativePath);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, files.length) }, worker);
  await Promise.all(workers);
  return results;
}

/* ---------- 사람이 읽기 좋은 ---------- */

export function formatCount(n: number, unit: string): string {
  return `${n.toLocaleString()}${unit}`;
}

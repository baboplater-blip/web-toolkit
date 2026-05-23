/**
 * File System Access API 얇은 래퍼.
 *
 * Chrome·Edge·Opera 만 지원. Firefox·Safari 폴백은 ZIP 다운로드.
 *
 * 노출 API:
 *   - isFsAccessSupported() — 능력 감지
 *   - pickDirectory() — 사용자가 출력 폴더 선택
 *   - writeFileToDirectory(dirHandle, relativePath, blob) — 폴더 안에 파일 쓰기
 *
 * 출력 폴더 핸들은 component state 에 캐시. 사용자에게 매번 선택받지 않음.
 */

type FSDirHandle = FileSystemDirectoryHandle;
type FSFileHandle = FileSystemFileHandle;

interface DirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}

interface WindowWithFSPicker extends Window {
  showDirectoryPicker?: (opts?: DirectoryPickerOptions) => Promise<FSDirHandle>;
}

export function isFsAccessSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as WindowWithFSPicker).showDirectoryPicker === 'function';
}

export async function pickDirectory(
  startIn: DirectoryPickerOptions['startIn'] = 'downloads',
): Promise<FSDirHandle | null> {
  const w = window as WindowWithFSPicker;
  if (!w.showDirectoryPicker) {
    throw new Error('이 브라우저는 폴더 직접 저장을 지원하지 않습니다. ZIP 다운로드를 사용하세요.');
  }
  try {
    return await w.showDirectoryPicker({ mode: 'readwrite', startIn });
  } catch (e) {
    // 사용자가 취소
    if (e instanceof DOMException && e.name === 'AbortError') return null;
    throw e;
  }
}

/**
 * 폴더 핸들 안에 상대 경로로 파일 쓰기. 중간 폴더는 자동 생성.
 * 같은 이름이 있으면 덮어쓴다.
 */
export async function writeFileToDirectory(
  root: FSDirHandle,
  relativePath: string,
  blob: Blob,
): Promise<void> {
  const parts = relativePath.split('/').filter(Boolean);
  if (parts.length === 0) throw new Error('빈 경로');
  const fileName = parts.pop()!;

  let current: FSDirHandle = root;
  for (const seg of parts) {
    current = await current.getDirectoryHandle(seg, { create: true });
  }
  const fileHandle: FSFileHandle = await current.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  try {
    await writable.write(blob);
  } finally {
    await writable.close();
  }
}

/**
 * 폴더 핸들 안의 모든 파일을 readonly 로 순회. 폴더 통째로 처리할 때 사용.
 * 단, 도구 입력은 webkitdirectory 가 더 호환성 좋아 일반적으로 그쪽 권장.
 */
export async function* walkDirectoryHandle(
  root: FSDirHandle,
  prefix: string = '',
): AsyncGenerator<{ relativePath: string; file: File }> {
  for await (const [name, entry] of root as unknown as AsyncIterable<
    [string, FileSystemHandle]
  >) {
    const rel = prefix ? `${prefix}/${name}` : name;
    if (entry.kind === 'file') {
      const file = await (entry as FSFileHandle).getFile();
      yield { relativePath: rel, file };
    } else if (entry.kind === 'directory') {
      yield* walkDirectoryHandle(entry as FSDirHandle, rel);
    }
  }
}

/**
 * 폴더 구조를 유지하며 결과를 ZIP 으로 묶는 헬퍼.
 *
 * jszip 동적 로드 — 사용 시점에만 번들에 포함되도록 한다.
 */

import type { BatchOutput } from './folder-batch';

export interface ZipBuildOptions {
  /** ZIP 안의 최상위 폴더명. 비우면 평탄. */
  rootName?: string;
  /** 진행률 콜백 (0~1) */
  onProgress?: (ratio: number) => void;
  /** 실패한 결과를 만나면 어떻게 할지. 기본: 건너뛰기 + 로그 동봉 */
  onError?: 'skip' | 'include-stub';
}

export async function buildZip(
  outputs: BatchOutput[],
  options: ZipBuildOptions = {},
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const errors: string[] = [];
  for (const out of outputs) {
    if (out.error) {
      errors.push(`${out.relativePath}\t${out.error}`);
      if (options.onError !== 'include-stub') continue;
    }
    const path = options.rootName ? `${options.rootName}/${out.relativePath}` : out.relativePath;
    zip.file(path, out.blob);
  }

  if (errors.length > 0) {
    const log = `${errors.length}개 파일이 처리되지 않았습니다:\n\n` + errors.join('\n');
    const logPath = options.rootName ? `${options.rootName}/_errors.txt` : '_errors.txt';
    zip.file(logPath, log);
  }

  return zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (meta) => {
      options.onProgress?.(meta.percent / 100);
    },
  );
}

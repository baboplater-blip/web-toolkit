/** 바이트를 사람이 읽기 쉬운 단위로 변환 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

/** 감소율 % (원본 대비). 원본이 0이면 0 */
export function compressionRatio(original: number, compressed: number): number {
  if (original <= 0) return 0;
  return Math.max(0, Math.round(((original - compressed) / original) * 100));
}

/** 원본 파일명에 suffix 를 붙이고 확장자 교체 */
export function renameWithSuffix(name: string, suffix: string, newExt?: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.substring(0, dot) : name;
  const ext = newExt ?? (dot > 0 ? name.substring(dot + 1) : '');
  return ext ? `${base}${suffix}.${ext}` : `${base}${suffix}`;
}

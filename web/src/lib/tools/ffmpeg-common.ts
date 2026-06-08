/**
 * FFmpeg.wasm 공통 유틸. 모든 video/gif 도구가 공유.
 *
 * - 단일 인스턴스 캐시 (한 번 로드 후 페이지 내 재사용)
 * - unpkg CDN 에서 core 다운로드 (31MB WASM, 최초만)
 * - 로그·진행률 이벤트 중계
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg';

// @ffmpeg/core 버전을 package.json 과 동기화할 수 있도록 상수화
const CORE_VERSION = '0.12.10';
const CDN_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let instance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

export interface LoadProgress {
  stage: 'fetching-core' | 'fetching-wasm' | 'initializing' | 'ready';
  received?: number;
  total?: number;
}

export async function getFFmpeg(
  onProgress?: (p: LoadProgress) => void,
): Promise<FFmpeg> {
  if (instance) return instance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();
    onProgress?.({ stage: 'fetching-core' });
    const coreURL = await toBlobURL(`${CDN_BASE}/ffmpeg-core.js`, 'text/javascript');
    onProgress?.({ stage: 'fetching-wasm' });
    const wasmURL = await toBlobURL(`${CDN_BASE}/ffmpeg-core.wasm`, 'application/wasm');

    onProgress?.({ stage: 'initializing' });
    await ffmpeg.load({ coreURL, wasmURL });

    instance = ffmpeg;
    onProgress?.({ stage: 'ready' });
    return ffmpeg;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

/**
 * 캐시된 FFmpeg 인스턴스를 종료하고 캐시를 비운다.
 * WASM 메모리는 한 번 늘면 줄지 않고, 중단된 실행은 인스턴스를 망가진 상태로
 * 남길 수 있다 — 이때 호출하면 다음 getFFmpeg() 가 깨끗하게 재로드한다.
 */
export function resetFFmpeg(): void {
  const current = instance;
  instance = null;
  loadingPromise = null;
  if (current) {
    try {
      // terminate 는 버전에 따라 없을 수 있어 존재 확인 후 호출.
      const terminate = (current as Partial<Pick<FFmpeg, 'terminate'>>).terminate;
      if (typeof terminate === 'function') terminate.call(current);
    } catch {
      /* 종료 실패는 무시 — 어차피 캐시는 비웠다 */
    }
  }
}

export async function writeFile(
  ffmpeg: FFmpeg,
  name: string,
  file: File | Blob,
): Promise<void> {
  const { fetchFile } = await import('@ffmpeg/util');
  await ffmpeg.writeFile(name, await fetchFile(file));
}

export async function readOutput(
  ffmpeg: FFmpeg,
  name: string,
  mimeType: string,
): Promise<Blob> {
  const data = await ffmpeg.readFile(name);
  // data 는 Uint8Array | string. Uint8Array 만 처리.
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return new Blob([bytes as unknown as BlobPart], { type: mimeType });
}

export async function cleanupFiles(ffmpeg: FFmpeg, names: string[]): Promise<void> {
  for (const n of names) {
    try {
      await ffmpeg.deleteFile(n);
    } catch {
      /* 파일이 없으면 무시 */
    }
  }
}

/** 시간 문자열 "HH:MM:SS.ms" 또는 "MM:SS" 를 초로 변환 */
export function parseTimeToSeconds(s: string): number {
  const parts = s.split(':').map((p) => p.trim());
  if (parts.length === 0) return 0;
  let seconds = 0;
  if (parts.length === 3) {
    seconds = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  } else if (parts.length === 2) {
    seconds = Number(parts[0]) * 60 + Number(parts[1]);
  } else {
    seconds = Number(parts[0]);
  }
  return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
}

/** 초 → "MM:SS.ms" 형식 */
export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const mm = Math.floor(sec / 60);
  const ss = sec - mm * 60;
  return `${String(mm).padStart(2, '0')}:${ss.toFixed(2).padStart(5, '0')}`;
}

/** 브라우저에서 비디오 메타(길이·크기) 를 읽기 */
export async function probeVideo(
  file: File,
): Promise<{ duration: number; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        resolve({
          duration: v.duration,
          width: v.videoWidth,
          height: v.videoHeight,
        });
      };
      v.onerror = () => reject(new Error('비디오 메타데이터 로드 실패'));
      v.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 오디오 파일의 길이를 읽기 */
export async function probeAudio(file: File): Promise<{ duration: number }> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const a = document.createElement('audio');
      a.preload = 'metadata';
      a.onloadedmetadata = () => resolve({ duration: a.duration });
      a.onerror = () => reject(new Error('오디오 메타데이터 로드 실패'));
      a.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

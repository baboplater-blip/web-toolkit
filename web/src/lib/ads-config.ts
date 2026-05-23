/**
 * 광고 설정 로더.
 *
 * /ads-config.json 을 정적 fetch 해서 사이트 전체 광고 슬롯에 적용.
 * /admin 페이지에서 GitHub API 로 같은 파일을 commit → Vercel 자동 재배포 → 사이트에 반영.
 */

export type AdSlotKey = 'top' | 'sidebarLeft' | 'sidebarRight';

export interface AdImageConfig {
  /** data URL (data:image/png;base64,...) 또는 절대/상대 URL */
  src: string;
  /** 클릭 시 이동 URL. 비우면 단순 표시. */
  href?: string;
  alt?: string;
}

export interface AdSlotConfig {
  enabled: boolean;
  /** 이미지 광고 (우선순위 1) */
  image?: AdImageConfig | null;
  /** HTML 코드 (이미지 없을 때, AdSense 등) */
  html: string;
}

export interface AdsConfig {
  version: number;
  updatedAt: string;
  slots: Record<AdSlotKey, AdSlotConfig>;
}

const DEFAULT_CONFIG: AdsConfig = {
  version: 1,
  updatedAt: '1970-01-01T00:00:00Z',
  slots: {
    top: { enabled: true, html: '', image: null },
    sidebarLeft: { enabled: true, html: '', image: null },
    sidebarRight: { enabled: true, html: '', image: null },
  },
};

let cached: AdsConfig | null = null;
let inflight: Promise<AdsConfig> | null = null;

export async function loadAdsConfig(force = false): Promise<AdsConfig> {
  if (cached && !force) return cached;
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch('/ads-config.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as Partial<AdsConfig>;
      const merged: AdsConfig = {
        version: data.version ?? DEFAULT_CONFIG.version,
        updatedAt: data.updatedAt ?? DEFAULT_CONFIG.updatedAt,
        slots: {
          top: { ...DEFAULT_CONFIG.slots.top, ...(data.slots?.top ?? {}) },
          sidebarLeft: { ...DEFAULT_CONFIG.slots.sidebarLeft, ...(data.slots?.sidebarLeft ?? {}) },
          sidebarRight: {
            ...DEFAULT_CONFIG.slots.sidebarRight,
            ...(data.slots?.sidebarRight ?? {}),
          },
        },
      };
      cached = merged;
      return merged;
    } catch {
      cached = DEFAULT_CONFIG;
      return DEFAULT_CONFIG;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function clearAdsConfigCache() {
  cached = null;
  inflight = null;
}

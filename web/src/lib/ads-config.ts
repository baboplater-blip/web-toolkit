/**
 * 광고 설정 로더.
 *
 * /ads-config.json 을 정적 fetch 해서 사이트 전체 광고 슬롯에 적용.
 * /admin 페이지에서 GitHub API 로 같은 파일을 commit → Vercel 자동 재배포 → 사이트에 반영.
 */

export type AdSlotKey = 'top' | 'sidebarLeft' | 'sidebarRight' | 'inline';

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

export interface NoticeConfig {
  enabled: boolean;
  /** 배너 본문 텍스트 */
  message: string;
  /** 표시 색상 (info | warning | success) */
  tone?: 'info' | 'warning' | 'success';
  /** 자세히 보기 링크 */
  href?: string;
}

export interface AdsConfig {
  version: number;
  updatedAt: string;
  slots: Record<AdSlotKey, AdSlotConfig>;
  notice?: NoticeConfig;
}

const DEFAULT_CONFIG: AdsConfig = {
  version: 1,
  updatedAt: '1970-01-01T00:00:00Z',
  slots: {
    top: { enabled: true, html: '', image: null },
    sidebarLeft: { enabled: true, html: '', image: null },
    sidebarRight: { enabled: true, html: '', image: null },
    inline: { enabled: true, html: '', image: null },
  },
  notice: { enabled: false, message: '', tone: 'info' },
};

let cached: AdsConfig | null = null;
let inflight: Promise<AdsConfig> | null = null;

export async function loadAdsConfig(force = false): Promise<AdsConfig> {
  if (cached && !force) return cached;
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      // 캐시 적극 활용 — admin 변경 → Vercel 재배포로 ETag 갱신되어
      // 자연스럽게 새 응답 받음. no-store 시 SW precache·HTTP 캐시 모두 무효.
      const res = await fetch('/ads-config.json');
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
          inline: { ...DEFAULT_CONFIG.slots.inline, ...(data.slots?.inline ?? {}) },
        },
        notice: data.notice
          ? { ...DEFAULT_CONFIG.notice!, ...data.notice }
          : DEFAULT_CONFIG.notice,
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

// Module 평가 시점에 즉시 fetch 시작 — AdSlot 컴포넌트의 hydration 보다 먼저.
// 결과는 inflight cache 에 보관되어 컴포넌트 mount 시 await 한 번에 끝남.
// 서버 환경(typeof window === 'undefined')에서는 noop.
if (typeof window !== 'undefined') {
  // microtask 로 미루지 않고 즉시 발화. 큰 데이터 (~78KB) 라 RTT 시간을
  // hydration 과 병렬화하는 게 핵심.
  void loadAdsConfig();
}

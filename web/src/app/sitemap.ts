import type { MetadataRoute } from 'next';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://web-toolkit.vercel.app';

export const dynamic = 'force-static';

/**
 * 카테고리별 priority. 트래픽이 큰 코어 카테고리에 가중치.
 * Google 은 priority 를 거의 무시하지만 일부 검색엔진은 참고한다.
 */
const CATEGORY_PRIORITY: Record<ToolCategory, number> = {
  pdf: 0.9,
  image: 0.9,
  video: 0.85,
  audio: 0.8,
  docs: 0.8,
  ai: 0.8,
  text: 0.75,
  dev: 0.75,
  gif: 0.7,
  util: 0.7,
  security: 0.7,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const hub: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/settings`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const seen = new Set<string>();
  const toolEntries: MetadataRoute.Sitemap = [];
  for (const tool of TOOLS) {
    if (tool.status !== 'ready') continue;
    if (seen.has(tool.href)) continue;
    seen.add(tool.href);
    toolEntries.push({
      url: `${SITE_URL}${tool.href}`,
      lastModified: now,
      // phase 1·2 = 안정, 그 이상 = 최근 추가 → weekly
      changeFrequency: tool.phase >= 5 ? 'weekly' : 'monthly',
      priority: CATEGORY_PRIORITY[tool.category] ?? 0.7,
    });
  }

  return [...hub, ...toolEntries];
}

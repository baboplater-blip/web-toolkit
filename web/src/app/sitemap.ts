import type { MetadataRoute } from 'next';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { hasEnCopy } from '@/lib/en-tools';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/^﻿/, '').replace(/\/$/, '') ??
  'https://agent-control-panel-phi.vercel.app';

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
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/`,
          en: `${SITE_URL}/en`,
          'x-default': `${SITE_URL}/`,
        },
      },
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/tools`,
          en: `${SITE_URL}/en/tools`,
          'x-default': `${SITE_URL}/tools`,
        },
      },
    },
    {
      url: `${SITE_URL}/en`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/en/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/guide`,
          en: `${SITE_URL}/en/guide`,
          'x-default': `${SITE_URL}/guide`,
        },
      },
    },
    {
      url: `${SITE_URL}/en/guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/guide`,
          en: `${SITE_URL}/en/guide`,
          'x-default': `${SITE_URL}/guide`,
        },
      },
    },
    ...(
      ['pdf', 'image', 'video', 'gif', 'audio', 'docs', 'text', 'dev', 'util', 'security', 'ai'] as ToolCategory[]
    ).flatMap<MetadataRoute.Sitemap[number]>((cat) => {
      const koUrl = `${SITE_URL}/guide/category/${cat}`;
      const enUrl = `${SITE_URL}/en/guide/category/${cat}`;
      const alternates = {
        languages: {
          'ko-KR': koUrl,
          en: enUrl,
          'x-default': koUrl,
        },
      };
      return [
        {
          url: koUrl,
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: (CATEGORY_PRIORITY[cat] ?? 0.7) * 0.9,
          alternates,
        },
        {
          url: enUrl,
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: (CATEGORY_PRIORITY[cat] ?? 0.7) * 0.85,
          alternates,
        },
      ];
    }),
    {
      url: `${SITE_URL}/settings`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const seen = new Set<string>();
  const toolEntries: MetadataRoute.Sitemap = [];
  const guideEntries: MetadataRoute.Sitemap = [];
  // 영문 개별 도구 페이지/가이드 (큐레이션 도구만)
  const enEntries: MetadataRoute.Sitemap = [];
  for (const tool of TOOLS) {
    if (tool.status !== 'ready') continue;
    if (seen.has(tool.href)) continue;
    seen.add(tool.href);
    const enabled = hasEnCopy(tool.id);
    const prio = CATEGORY_PRIORITY[tool.category] ?? 0.7;

    toolEntries.push({
      url: `${SITE_URL}${tool.href}`,
      lastModified: now,
      // phase 1·2 = 안정, 그 이상 = 최근 추가 → weekly
      changeFrequency: tool.phase >= 5 ? 'weekly' : 'monthly',
      priority: prio,
      // 영문 트랜잭셔널 페이지가 있으면 ko 도구 페이지 ↔ en 도구 페이지 연결
      ...(enabled
        ? {
            alternates: {
              languages: {
                'ko-KR': `${SITE_URL}${tool.href}`,
                en: `${SITE_URL}/en/tools/${tool.id}`,
                'x-default': `${SITE_URL}${tool.href}`,
              },
            },
          }
        : {}),
    });

    // 각 도구별 가이드 페이지 (long-tail SEO)
    const koGuide = `${SITE_URL}/guide/${tool.id}`;
    const enGuide = `${SITE_URL}/en/guide/${tool.id}`;
    guideEntries.push({
      url: koGuide,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: prio * 0.8,
      ...(enabled
        ? {
            alternates: {
              languages: { 'ko-KR': koGuide, en: enGuide, 'x-default': koGuide },
            },
          }
        : {}),
    });

    if (enabled) {
      // 영문 트랜잭셔널 도구 페이지
      enEntries.push({
        url: `${SITE_URL}/en/tools/${tool.id}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: prio * 0.85,
        alternates: {
          languages: {
            'ko-KR': `${SITE_URL}${tool.href}`,
            en: `${SITE_URL}/en/tools/${tool.id}`,
            'x-default': `${SITE_URL}/en/tools/${tool.id}`,
          },
        },
      });
      // 영문 도구별 가이드
      enEntries.push({
        url: enGuide,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: prio * 0.75,
        alternates: {
          languages: { 'ko-KR': koGuide, en: enGuide, 'x-default': koGuide },
        },
      });
    }
  }

  return [...hub, ...toolEntries, ...guideEntries, ...enEntries];
}

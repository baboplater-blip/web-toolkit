import type { MetadataRoute } from 'next';
import { TOOLS, type ToolCategory } from '@/lib/tools/registry';
import { hasEnCopy } from '@/lib/en-tools';
import { hasJaCopy } from '@/lib/ja-tools';
import { hasZhCopy } from '@/lib/zh-tools';
import { COMPARE_SLUGS, getCompare } from '@/lib/en-compares';
import { CONVERT_SLUGS, FORMATS, conversionCategory, getConversion } from '@/lib/convert-matrix';
import { USE_CASE_SLUGS, getUseCase } from '@/lib/use-cases';

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

/**
 * 콘텐츠 개정일 — 데이터 기반 페이지(변환·비교·활용법·카테고리 가이드)의 lastmod.
 * 빌드 시각(now)을 모든 URL 에 박으면 "매 배포마다 전부 변경"으로 보여 신선도
 * 신호가 무뎌진다. 허브/색인만 now 를 쓰고, 에버그린 콘텐츠는 이 상수를 쓴다.
 * 콘텐츠를 실제로 크게 개정할 때만 갱신한다.
 */
const CONTENT_REVISION = new Date('2026-06-05T00:00:00Z');

/** 사이트 출범 baseline — addedAt 없는 도구의 lastmod 기준. */
const SITE_BASELINE = new Date('2026-05-01T00:00:00Z');

/** 프로그래매틱 페이지의 카테고리 인지 priority (en 은 살짝 낮춤). */
function progPriority(cat: ToolCategory, en = false): number {
  const base = CATEGORY_PRIORITY[cat] ?? 0.7;
  const p = 0.45 + base * 0.33; // pdf/image≈0.75 … gif/util≈0.68
  const clamped = Math.min(0.78, Math.max(0.55, en ? p - 0.02 : p));
  return Math.round(clamped * 100) / 100;
}

/** 변환 slug → 대표 카테고리 */
function convertCategory(slug: string): ToolCategory {
  const c = getConversion(slug);
  if (!c) return 'util';
  return conversionCategory(FORMATS[c.from], FORMATS[c.to]);
}

/** addedAt 이 최근(60일 이내)이면 weekly, 아니면 phase 기준 */
function isRecent(addedAt?: string): boolean {
  if (!addedAt) return false;
  const t = Date.parse(addedAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 60 * 86_400_000;
}

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
          ja: `${SITE_URL}/ja`,
          zh: `${SITE_URL}/zh`,
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
          ja: `${SITE_URL}/ja/tools`,
          zh: `${SITE_URL}/zh/tools`,
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
      url: `${SITE_URL}/ja`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/`,
          en: `${SITE_URL}/en`,
          ja: `${SITE_URL}/ja`,
          zh: `${SITE_URL}/zh`,
          'x-default': `${SITE_URL}/`,
        },
      },
    },
    {
      url: `${SITE_URL}/ja/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/tools`,
          en: `${SITE_URL}/en/tools`,
          ja: `${SITE_URL}/ja/tools`,
          zh: `${SITE_URL}/zh/tools`,
          'x-default': `${SITE_URL}/tools`,
        },
      },
    },
    {
      url: `${SITE_URL}/zh`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/`,
          en: `${SITE_URL}/en`,
          ja: `${SITE_URL}/ja`,
          zh: `${SITE_URL}/zh`,
          'x-default': `${SITE_URL}/`,
        },
      },
    },
    {
      url: `${SITE_URL}/zh/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/tools`,
          en: `${SITE_URL}/en/tools`,
          ja: `${SITE_URL}/ja/tools`,
          zh: `${SITE_URL}/zh/tools`,
          'x-default': `${SITE_URL}/tools`,
        },
      },
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
          ja: `${SITE_URL}/ja/guide`,
          zh: `${SITE_URL}/zh/guide`,
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
          ja: `${SITE_URL}/ja/guide`,
          zh: `${SITE_URL}/zh/guide`,
          'x-default': `${SITE_URL}/guide`,
        },
      },
    },
    {
      url: `${SITE_URL}/ja/guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/guide`,
          en: `${SITE_URL}/en/guide`,
          ja: `${SITE_URL}/ja/guide`,
          zh: `${SITE_URL}/zh/guide`,
          'x-default': `${SITE_URL}/guide`,
        },
      },
    },
    {
      url: `${SITE_URL}/zh/guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/guide`,
          en: `${SITE_URL}/en/guide`,
          ja: `${SITE_URL}/ja/guide`,
          zh: `${SITE_URL}/zh/guide`,
          'x-default': `${SITE_URL}/guide`,
        },
      },
    },
    ...(
      ['pdf', 'image', 'video', 'gif', 'audio', 'docs', 'text', 'dev', 'util', 'security', 'ai'] as ToolCategory[]
    ).flatMap<MetadataRoute.Sitemap[number]>((cat) => {
      const koUrl = `${SITE_URL}/guide/category/${cat}`;
      const enUrl = `${SITE_URL}/en/guide/category/${cat}`;
      const jaUrl = `${SITE_URL}/ja/guide/category/${cat}`;
      const zhUrl = `${SITE_URL}/zh/guide/category/${cat}`;
      const alternates = {
        languages: {
          'ko-KR': koUrl,
          en: enUrl,
          ja: jaUrl,
          zh: zhUrl,
          'x-default': koUrl,
        },
      };
      return [
        {
          url: koUrl,
          lastModified: CONTENT_REVISION,
          changeFrequency: 'monthly' as const,
          priority: Math.round((CATEGORY_PRIORITY[cat] ?? 0.7) * 0.9 * 100) / 100,
          alternates,
        },
        {
          url: enUrl,
          lastModified: CONTENT_REVISION,
          changeFrequency: 'monthly' as const,
          priority: Math.round((CATEGORY_PRIORITY[cat] ?? 0.7) * 0.85 * 100) / 100,
          alternates,
        },
        {
          url: jaUrl,
          lastModified: CONTENT_REVISION,
          changeFrequency: 'monthly' as const,
          priority: Math.round((CATEGORY_PRIORITY[cat] ?? 0.7) * 0.85 * 100) / 100,
          alternates,
        },
        {
          url: zhUrl,
          lastModified: CONTENT_REVISION,
          changeFrequency: 'monthly' as const,
          priority: Math.round((CATEGORY_PRIORITY[cat] ?? 0.7) * 0.85 * 100) / 100,
          alternates,
        },
      ];
    }),
    {
      url: `${SITE_URL}/compare`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.72,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/compare`,
          en: `${SITE_URL}/en/compare`,
          ja: `${SITE_URL}/ja/compare`,
          'x-default': `${SITE_URL}/compare`,
        },
      },
    },
    {
      url: `${SITE_URL}/en/compare`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/compare`,
          en: `${SITE_URL}/en/compare`,
          ja: `${SITE_URL}/ja/compare`,
          'x-default': `${SITE_URL}/en/compare`,
        },
      },
    },
    {
      url: `${SITE_URL}/ja/compare`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/compare`,
          en: `${SITE_URL}/en/compare`,
          ja: `${SITE_URL}/ja/compare`,
          'x-default': `${SITE_URL}/compare`,
        },
      },
    },
    ...COMPARE_SLUGS.flatMap<MetadataRoute.Sitemap[number]>((slug) => {
      const koUrl = `${SITE_URL}/compare/${slug}`;
      const enUrl = `${SITE_URL}/en/compare/${slug}`;
      const jaUrl = `${SITE_URL}/ja/compare/${slug}`;
      const alternates = { languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, 'x-default': koUrl } };
      const cat = (getCompare(slug)?.category ?? 'util') as ToolCategory;
      return [
        { url: koUrl, lastModified: CONTENT_REVISION, changeFrequency: 'monthly' as const, priority: progPriority(cat), alternates },
        { url: enUrl, lastModified: CONTENT_REVISION, changeFrequency: 'monthly' as const, priority: progPriority(cat, true), alternates },
        { url: jaUrl, lastModified: CONTENT_REVISION, changeFrequency: 'monthly' as const, priority: progPriority(cat, true), alternates },
      ];
    }),
    // 변환 매트릭스 (ko ↔ en hreflang)
    {
      url: `${SITE_URL}/convert`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/convert`,
          en: `${SITE_URL}/en/convert`,
          ja: `${SITE_URL}/ja/convert`,
          'x-default': `${SITE_URL}/convert`,
        },
      },
    },
    {
      url: `${SITE_URL}/en/convert`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/convert`,
          en: `${SITE_URL}/en/convert`,
          ja: `${SITE_URL}/ja/convert`,
          'x-default': `${SITE_URL}/en/convert`,
        },
      },
    },
    {
      url: `${SITE_URL}/ja/convert`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
      alternates: {
        languages: {
          'ko-KR': `${SITE_URL}/convert`,
          en: `${SITE_URL}/en/convert`,
          ja: `${SITE_URL}/ja/convert`,
          'x-default': `${SITE_URL}/convert`,
        },
      },
    },
    ...CONVERT_SLUGS.flatMap<MetadataRoute.Sitemap[number]>((slug) => {
      const koUrl = `${SITE_URL}/convert/${slug}`;
      const enUrl = `${SITE_URL}/en/convert/${slug}`;
      const jaUrl = `${SITE_URL}/ja/convert/${slug}`;
      const alternates = {
        languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, 'x-default': koUrl },
      };
      const cat = convertCategory(slug);
      return [
        { url: koUrl, lastModified: CONTENT_REVISION, changeFrequency: 'monthly' as const, priority: progPriority(cat), alternates },
        { url: enUrl, lastModified: CONTENT_REVISION, changeFrequency: 'monthly' as const, priority: progPriority(cat, true), alternates },
        { url: jaUrl, lastModified: CONTENT_REVISION, changeFrequency: 'monthly' as const, priority: progPriority(cat, true), alternates },
      ];
    }),
    // 유스케이스 (활용법, ko ↔ en hreflang)
    {
      url: `${SITE_URL}/use`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: { 'ko-KR': `${SITE_URL}/use`, en: `${SITE_URL}/en/use`, ja: `${SITE_URL}/ja/use`, 'x-default': `${SITE_URL}/use` },
      },
    },
    {
      url: `${SITE_URL}/en/use`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
      alternates: {
        languages: { 'ko-KR': `${SITE_URL}/use`, en: `${SITE_URL}/en/use`, ja: `${SITE_URL}/ja/use`, 'x-default': `${SITE_URL}/en/use` },
      },
    },
    {
      url: `${SITE_URL}/ja/use`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
      alternates: {
        languages: { 'ko-KR': `${SITE_URL}/use`, en: `${SITE_URL}/en/use`, ja: `${SITE_URL}/ja/use`, 'x-default': `${SITE_URL}/use` },
      },
    },
    ...USE_CASE_SLUGS.flatMap<MetadataRoute.Sitemap[number]>((slug) => {
      const koUrl = `${SITE_URL}/use/${slug}`;
      const enUrl = `${SITE_URL}/en/use/${slug}`;
      const jaUrl = `${SITE_URL}/ja/use/${slug}`;
      const alternates = { languages: { 'ko-KR': koUrl, en: enUrl, ja: jaUrl, 'x-default': koUrl } };
      const cat = (getUseCase(slug)?.category ?? 'util') as ToolCategory;
      // 활용법은 작업 의도(상업적 가치)가 높아 변환·비교보다 살짝 가중
      const koP = Math.round(Math.min(0.78, progPriority(cat) + 0.02) * 100) / 100;
      const enP = Math.round(Math.min(0.76, progPriority(cat, true) + 0.02) * 100) / 100;
      return [
        { url: koUrl, lastModified: CONTENT_REVISION, changeFrequency: 'monthly' as const, priority: koP, alternates },
        { url: enUrl, lastModified: CONTENT_REVISION, changeFrequency: 'monthly' as const, priority: enP, alternates },
        { url: jaUrl, lastModified: CONTENT_REVISION, changeFrequency: 'monthly' as const, priority: enP, alternates },
      ];
    }),
    {
      url: `${SITE_URL}/settings`,
      lastModified: CONTENT_REVISION,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const seen = new Set<string>();
  const toolEntries: MetadataRoute.Sitemap = [];
  const guideEntries: MetadataRoute.Sitemap = [];
  // 영문 개별 도구 페이지/가이드 (큐레이션 도구만)
  const enEntries: MetadataRoute.Sitemap = [];
  // 일본어 개별 도구 페이지/가이드 (큐레이션 도구만)
  const jaEntries: MetadataRoute.Sitemap = [];
  // 중국어 간체 개별 도구 페이지/가이드 (큐레이션 도구만)
  const zhEntries: MetadataRoute.Sitemap = [];
  for (const tool of TOOLS) {
    if (tool.status !== 'ready') continue;
    if (seen.has(tool.href)) continue;
    seen.add(tool.href);
    const enabled = hasEnCopy(tool.id);
    const jaEnabled = hasJaCopy(tool.id);
    const zhEnabled = hasZhCopy(tool.id);
    const prio = CATEGORY_PRIORITY[tool.category] ?? 0.7;
    // 실제 추가일을 lastmod 로 — 신선도 신호 정확화(없으면 baseline)
    const toolLastMod = tool.addedAt ? new Date(tool.addedAt) : SITE_BASELINE;
    // 최근 추가(60일 이내)면 weekly, 아니면 monthly
    const toolFreq = isRecent(tool.addedAt) || tool.phase >= 5 ? 'weekly' : 'monthly';

    const koHref = `${SITE_URL}${tool.href}`;
    const enHref = `${SITE_URL}/en/tools/${tool.id}`;
    const jaHref = `${SITE_URL}/ja/tools/${tool.id}`;
    const zhHref = `${SITE_URL}/zh/tools/${tool.id}`;
    const koGuide = `${SITE_URL}/guide/${tool.id}`;
    const enGuide = `${SITE_URL}/en/guide/${tool.id}`;
    const jaGuide = `${SITE_URL}/ja/guide/${tool.id}`;
    const zhGuide = `${SITE_URL}/zh/guide/${tool.id}`;

    // 언어 카피 보유 여부에 따라 alternate 언어 맵 구성 (큐레이션된 언어만 연결)
    const toolLangs: Record<string, string> = { 'ko-KR': koHref };
    if (enabled) toolLangs.en = enHref;
    if (jaEnabled) toolLangs.ja = jaHref;
    if (zhEnabled) toolLangs.zh = zhHref;
    const guideLangs: Record<string, string> = { 'ko-KR': koGuide };
    if (enabled) guideLangs.en = enGuide;
    if (jaEnabled) guideLangs.ja = jaGuide;
    if (zhEnabled) guideLangs.zh = zhGuide;
    const hasAltTool = enabled || jaEnabled || zhEnabled;

    toolEntries.push({
      url: koHref,
      lastModified: toolLastMod,
      changeFrequency: toolFreq,
      priority: prio,
      // 다른 언어 트랜잭셔널 페이지가 있으면 상호 연결
      ...(hasAltTool
        ? { alternates: { languages: { ...toolLangs, 'x-default': koHref } } }
        : {}),
    });

    // 각 도구별 가이드 페이지 (long-tail SEO)
    guideEntries.push({
      url: koGuide,
      lastModified: toolLastMod,
      changeFrequency: 'monthly',
      priority: Math.round(prio * 0.8 * 100) / 100,
      ...(hasAltTool
        ? { alternates: { languages: { ...guideLangs, 'x-default': koGuide } } }
        : {}),
    });

    if (enabled) {
      // 영문 트랜잭셔널 도구 페이지
      enEntries.push({
        url: enHref,
        lastModified: toolLastMod,
        changeFrequency: toolFreq,
        priority: Math.round(prio * 0.85 * 100) / 100,
        alternates: { languages: { ...toolLangs, 'x-default': enHref } },
      });
      // 영문 도구별 가이드
      enEntries.push({
        url: enGuide,
        lastModified: toolLastMod,
        changeFrequency: 'monthly',
        priority: Math.round(prio * 0.75 * 100) / 100,
        alternates: { languages: { ...guideLangs, 'x-default': enGuide } },
      });
    }

    if (jaEnabled) {
      // 일본어 트랜잭셔널 도구 페이지
      jaEntries.push({
        url: jaHref,
        lastModified: toolLastMod,
        changeFrequency: toolFreq,
        priority: Math.round(prio * 0.85 * 100) / 100,
        alternates: { languages: { ...toolLangs, 'x-default': jaHref } },
      });
      // 일본어 도구별 가이드
      jaEntries.push({
        url: jaGuide,
        lastModified: toolLastMod,
        changeFrequency: 'monthly',
        priority: Math.round(prio * 0.75 * 100) / 100,
        alternates: { languages: { ...guideLangs, 'x-default': jaGuide } },
      });
    }

    if (zhEnabled) {
      // 중국어 간체 트랜잭셔널 도구 페이지
      zhEntries.push({
        url: zhHref,
        lastModified: toolLastMod,
        changeFrequency: toolFreq,
        priority: Math.round(prio * 0.85 * 100) / 100,
        alternates: { languages: { ...toolLangs, 'x-default': zhHref } },
      });
      // 중국어 간체 도구별 가이드
      zhEntries.push({
        url: zhGuide,
        lastModified: toolLastMod,
        changeFrequency: 'monthly',
        priority: Math.round(prio * 0.75 * 100) / 100,
        alternates: { languages: { ...guideLangs, 'x-default': zhGuide } },
      });
    }
  }

  return [...hub, ...toolEntries, ...guideEntries, ...enEntries, ...jaEntries, ...zhEntries];
}

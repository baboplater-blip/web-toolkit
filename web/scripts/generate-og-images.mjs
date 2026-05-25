#!/usr/bin/env node
/**
 * Open Graph 이미지 정적 생성기.
 *
 * 출력: public/og/default.png + public/og/{category}.png (총 12장, 1200×630)
 *
 * 한번 실행해 PNG 를 커밋해두고 메타에서 참조한다. 빌드 시점 의존성 없음.
 * 필요할 때(브랜딩 변경, 카테고리 추가)만 재실행: `npm run og:gen`
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, '..');
const OUT_DIR = join(WEB_ROOT, 'public/og');

const SITE_NAME = 'Web Toolkit';
const TAGLINE = '브라우저에서 완결되는 무료 도구';
const ACCENT = '#7c3aed'; // 보라

/**
 * 카테고리별 시각 ID — 색상은 어두운 그라데이션 두 색.
 */
const CATEGORIES = {
  image: { label: '이미지', from: '#0f172a', to: '#1e293b', hue: '#60a5fa' },
  pdf: { label: 'PDF', from: '#0f172a', to: '#1e1b1b', hue: '#f87171' },
  video: { label: '비디오', from: '#0f172a', to: '#1a1335', hue: '#a78bfa' },
  gif: { label: 'GIF', from: '#0f172a', to: '#1e1b3f', hue: '#fb923c' },
  audio: { label: '오디오', from: '#0f172a', to: '#172554', hue: '#22d3ee' },
  docs: { label: '문서 변환', from: '#0f172a', to: '#1a2333', hue: '#4ade80' },
  text: { label: '텍스트', from: '#0f172a', to: '#1f2937', hue: '#fbbf24' },
  dev: { label: '개발자', from: '#0f172a', to: '#0f1f2e', hue: '#34d399' },
  util: { label: '유틸', from: '#0f172a', to: '#1f1f1f', hue: '#a3a3a3' },
  security: { label: '보안', from: '#0f172a', to: '#1f0f1a', hue: '#f472b6' },
  ai: { label: 'AI', from: '#0f172a', to: '#0b1a2e', hue: '#22d3ee' },
};

/**
 * SVG 템플릿. resvg-js 는 외부 폰트 없이 system fallback 으로 한글을 렌더링하지 못한다.
 * 따라서 한글 라벨도 폰트 데이터 임베드 없이 안전한 박스/위치만 사용하고,
 * 한글은 SVG `<text>` 로 두되 resvg 의 system-font fallback 에 맡긴다.
 * (Windows / Linux 양쪽에 한글 폰트가 있다고 가정. CI/Vercel 빌드와 무관 — 로컬 1회 생성용)
 */
function buildSvg({ category, title, subtitle, label }) {
  const cat = CATEGORIES[category] ?? { from: '#0f172a', to: '#1e293b', hue: ACCENT, label: '' };
  const showLabel = label ?? cat.label;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${cat.from}"/>
      <stop offset="100%" stop-color="${cat.to}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${cat.hue}" stop-opacity="0.0"/>
      <stop offset="50%" stop-color="${cat.hue}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${cat.hue}" stop-opacity="0.0"/>
    </linearGradient>
  </defs>

  <!-- bg -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- subtle grid -->
  <g stroke="#ffffff" stroke-opacity="0.04">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="630"/>`).join('')}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="1200" y2="${i * 100}"/>`).join('')}
  </g>

  <!-- accent stripe -->
  <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>

  <!-- category badge -->
  <g transform="translate(80, 80)">
    <rect rx="8" ry="8" width="${Math.max(120, showLabel.length * 22 + 40)}" height="44" fill="${cat.hue}" fill-opacity="0.15" stroke="${cat.hue}" stroke-opacity="0.5"/>
    <text x="20" y="30" font-family="system-ui, -apple-system, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" font-size="22" font-weight="600" fill="${cat.hue}">${escapeXml(showLabel)}</text>
  </g>

  <!-- main title -->
  <text x="80" y="320" font-family="system-ui, -apple-system, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" font-size="84" font-weight="800" fill="#f8fafc">${escapeXml(title)}</text>

  <!-- subtitle -->
  ${
    subtitle
      ? `<text x="80" y="400" font-family="system-ui, -apple-system, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" font-size="32" font-weight="400" fill="#cbd5e1">${escapeXml(subtitle)}</text>`
      : ''
  }

  <!-- footer brand -->
  <g transform="translate(80, 540)">
    <circle cx="14" cy="14" r="14" fill="${cat.hue}"/>
    <text x="44" y="22" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="26" font-weight="700" fill="#f8fafc">${SITE_NAME}</text>
    <text x="44" y="50" font-family="system-ui, -apple-system, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" font-size="18" font-weight="400" fill="#94a3b8">${escapeXml(TAGLINE)}</text>
  </g>

  <!-- right corner — no upload mark -->
  <g transform="translate(960, 540)">
    <rect rx="20" ry="20" width="160" height="44" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.15"/>
    <text x="22" y="30" font-family="system-ui, -apple-system, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" font-size="20" font-weight="600" fill="#f8fafc">no upload</text>
  </g>
</svg>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderPng(svg) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      // 시스템 폰트 사용 (Windows: Malgun Gothic, macOS: Apple SD Gothic Neo)
      loadSystemFonts: true,
    },
  });
  return resvg.render().asPng();
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  // 1) 사이트 기본
  const defaultSvg = buildSvg({
    category: 'default',
    title: 'Web Toolkit',
    subtitle: 'PDF · 이미지 · 비디오 · 오디오 · OCR · AI 도구 109종',
    label: '도구 모음',
  });
  writeFileSync(join(OUT_DIR, 'default.png'), renderPng(defaultSvg));
  console.log('✔ default.png');

  // 2) 카테고리별
  for (const [key, meta] of Object.entries(CATEGORIES)) {
    const svg = buildSvg({
      category: key,
      title: meta.label,
      subtitle: `브라우저 안에서 처리되는 ${meta.label} 도구`,
      label: meta.label,
    });
    writeFileSync(join(OUT_DIR, `${key}.png`), renderPng(svg));
    console.log(`✔ ${key}.png`);
  }

  console.log(`\nOG 이미지 ${1 + Object.keys(CATEGORIES).length}장 생성 → public/og/`);
}

main();

#!/usr/bin/env node
/**
 * 광고 설정 데이터 URL → 외부 파일 분리 (마이그레이션 + 신규 업로드 통합).
 *
 * 동작:
 *   - public/ads-config.json 을 읽고, 각 슬롯의 image.src 가
 *     data:image/...;base64,... 형식이면 다음을 수행:
 *       1. base64 디코딩 → 바이트
 *       2. mime 타입에 맞는 확장자 결정 (webp / png / jpg / svg+xml 등)
 *       3. public/ads/{slotKey}.{ext} 로 저장
 *       4. config 의 image.src 를 `/ads/{slotKey}.{ext}` 로 교체
 *   - data URL 이 아니면 (이미 외부 경로) 그대로 둠
 *   - 결과 config 를 같은 위치에 다시 저장
 *
 * 효과:
 *   - ads-config.json 사이즈가 ~78KB → ~1KB 로 축소 → LCP critical path 단축
 *   - 광고 이미지 자체는 cache-first SW + browser HTTP cache 로 효율적 갱신
 *   - 광고 변경 시 admin 페이지는 그대로 data URL 로 저장 → 다음 deploy 전에
 *     본 스크립트 다시 실행하면 또 분리됨 (idempotent)
 *
 * 호출:
 *   npm run ads:extract            # dry-run (변경 안 함)
 *   npm run ads:extract -- --apply # 실제 적용
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, '..');
const CONFIG_PATH = join(WEB_ROOT, 'public/ads-config.json');
const ADS_DIR = join(WEB_ROOT, 'public/ads');

const APPLY = process.argv.includes('--apply');

const MIME_TO_EXT = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

function parseDataUrl(dataUrl) {
  const m = dataUrl.match(/^data:([^;,]+)(?:;[^,]*)?,(.+)$/);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const rest = m[2];
  const isBase64 = /;base64/i.test(dataUrl.slice(0, dataUrl.indexOf(',')));
  return {
    mime,
    bytes: isBase64 ? Buffer.from(rest, 'base64') : Buffer.from(decodeURIComponent(rest), 'utf-8'),
  };
}

function main() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`[ads-extract] config 없음: ${CONFIG_PATH}`);
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  const slots = config.slots ?? {};
  const summary = [];
  let touched = false;

  for (const [key, slot] of Object.entries(slots)) {
    if (!slot || typeof slot !== 'object') continue;
    const img = slot.image;
    if (!img || !img.src) continue;
    if (!img.src.startsWith('data:')) {
      summary.push({ key, action: 'skip', reason: '이미 외부 경로' });
      continue;
    }
    const parsed = parseDataUrl(img.src);
    if (!parsed) {
      summary.push({ key, action: 'error', reason: 'data URL 파싱 실패' });
      continue;
    }
    const ext = MIME_TO_EXT[parsed.mime] ?? 'bin';
    const fileName = `${key}.${ext}`;
    const outPath = join(ADS_DIR, fileName);
    const externalSrc = `/ads/${fileName}`;
    summary.push({
      key,
      action: 'extract',
      mime: parsed.mime,
      bytes: parsed.bytes.length,
      fileName,
      externalSrc,
    });
    if (APPLY) {
      mkdirSync(ADS_DIR, { recursive: true });
      writeFileSync(outPath, parsed.bytes);
      slot.image = { ...img, src: externalSrc };
      touched = true;
    }
  }

  console.log('\n[ads-extract] 처리 결과');
  for (const s of summary) {
    if (s.action === 'extract') {
      console.log(`  ✔ ${s.key}: ${s.mime} ${(s.bytes / 1024).toFixed(1)}KB → public${s.externalSrc}`);
    } else if (s.action === 'skip') {
      console.log(`  ↩ ${s.key}: ${s.reason}`);
    } else {
      console.log(`  ✗ ${s.key}: ${s.reason}`);
    }
  }

  if (APPLY && touched) {
    // updatedAt 갱신
    config.updatedAt = new Date().toISOString();
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    console.log(`\n[ads-extract] config 저장: ${CONFIG_PATH}`);
  } else if (!APPLY) {
    console.log('\n[ads-extract] DRY-RUN — 파일 변경 없음. --apply 로 실제 적용.');
  } else {
    console.log('\n[ads-extract] 변경할 항목 없음.');
  }
}

main();

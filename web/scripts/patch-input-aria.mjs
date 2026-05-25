#!/usr/bin/env node
/**
 * 도구 페이지의 라벨 누락 input/textarea/Input/Textarea 에 aria-label 을 자동 주입.
 *
 * 휴리스틱:
 *   1. 입력 요소 직전 250자 안에서 가장 가까운 텍스트 라벨 후보를 찾는다.
 *      후보: <label>...</label>, <h1..h6>..</hX>, <legend>..</legend>,
 *            <p className="*font-medium*">..</p>, <span className="*font-medium*">..</span>
 *   2. 라벨 텍스트는 단순 한글/영문 문자열만 추출 (JSX 식·중괄호 제거).
 *   3. 80자 이상이거나 비었으면 스킵.
 *   4. 이미 aria-label / aria-labelledby / 같은 id 의 htmlFor 가 있으면 스킵.
 *   5. 결과는 dry-run / apply 두 모드. apply 모드만 파일 수정.
 *
 * 호출:
 *   node scripts/patch-input-aria.mjs               # dry-run, 처음 30건 출력
 *   node scripts/patch-input-aria.mjs --apply       # 실제 패치
 *   node scripts/patch-input-aria.mjs --apply --all # 전체
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, '..');

const APPLY = process.argv.includes('--apply');
const SHOW_ALL = process.argv.includes('--all');
const MAX_PREVIEW = SHOW_ALL ? Infinity : 30;

/* ---------- 입력 태그 매칭 ---------- */

function findOpeningTags(src, tagNames) {
  const out = [];
  for (const name of tagNames) {
    const re = new RegExp(`<${name}\\b`, 'g');
    let m;
    while ((m = re.exec(src)) !== null) {
      const start = m.index;
      let i = m.index + 1 + name.length;
      let depthBrace = 0;
      let inStr = null;
      let end = -1;
      while (i < src.length) {
        const c = src[i];
        if (inStr) {
          if (c === inStr) inStr = null;
        } else if (c === '"' || c === "'" || c === '`') {
          inStr = c;
        } else if (c === '{') {
          depthBrace++;
        } else if (c === '}') {
          depthBrace--;
        } else if (c === '>' && depthBrace === 0) {
          end = i;
          break;
        }
        i++;
      }
      if (end < 0) continue;
      out.push({ name, start, end, block: src.slice(start, end + 1) });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/* ---------- 라벨 후보 추출 ----------
 *
 * 중첩 태그 문제로 backreference 매칭이 외부 wrapper 를 먼저 잡는다.
 * 따라서 각 후보 태그를 별도 정규식으로 찾고, "단순 텍스트만 담은" 인스턴스만
 * (즉 [^<] 만 허용) 후보로 받는다. JSX 식 {…} 은 텍스트로 평탄화.
 */
function extractCandidateLabels(precedingChunk) {
  const found = [];

  // 1) <label className=".." >text</label> 또는 <legend>...</legend>, <h1-6>...</h6>
  //    내부에 다른 태그가 없는 "리프 라벨" 만 가져온다.
  const leafRe = /<(label|legend|h[1-6])\b([^>]*)>([^<]+)<\/\1>/gi;
  let m;
  while ((m = leafRe.exec(precedingChunk)) !== null) {
    const inner = m[3];
    const text = cleanLabelText(inner);
    if (!text) continue;
    found.push({ text, pos: m.index });
  }

  // 2) <p|span|div className="...font-medium..."> simple text </X>
  //    리프(다른 태그 없는) 만, 그리고 font-medium 류 강조 클래스 필수.
  const emphasized = /<(p|span|div|h2)\b([^>]*font-(?:medium|semibold|bold)[^>]*)>([^<]+)<\/\1>/gi;
  while ((m = emphasized.exec(precedingChunk)) !== null) {
    const attrs = m[2];
    if (/text-muted-foreground/.test(attrs)) continue;
    const text = cleanLabelText(m[3]);
    if (!text) continue;
    found.push({ text, pos: m.index });
  }

  if (found.length === 0) return null;
  // 가장 가까운(끝쪽) 것 선택
  found.sort((a, b) => a.pos - b.pos);
  return found[found.length - 1].text;
}

function cleanLabelText(raw) {
  // JSX 식 안에 단일 문자열 리터럴만 있으면 그걸 우선 사용 — 삼항·논리식이라도
  // 'X' 처럼 보이는 첫 한국어/영문 리터럴을 라벨로 채택.
  const jsxExpr = raw.match(/\{([^}]*)\}/);
  let candidate = '';
  if (jsxExpr) {
    const inside = jsxExpr[1];
    // 따옴표 안의 단순 문자열 (한·영·숫자·공백·기본 문장부호)
    const lit = inside.match(/['"`]([A-Za-z0-9가-힣 ()%·:_./\-+]+)['"`]/);
    if (lit) candidate = lit[1].trim();
  }
  if (!candidate) {
    candidate = raw
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (!candidate) return null;
  if (candidate.length > 60) return null;
  candidate = candidate.replace(/\s+:/g, ':').replace(/\(\s*\)/g, '').trim();
  return candidate || null;
}

/* ---------- 입력 태그 단일 처리 ---------- */

const SKIP_TYPES = new Set([
  'hidden',
  'file',
  'button',
  'submit',
  'reset',
  'checkbox',
  'radio',
]);

function shouldSkip(block, src) {
  if (/aria-label\b/.test(block)) return true;
  if (/aria-labelledby\b/.test(block)) return true;
  const tMatch = block.match(/type\s*=\s*"([^"]+)"/);
  if (tMatch && SKIP_TYPES.has(tMatch[1])) return true;
  const idMatch =
    block.match(/\sid="([^"]+)"/) ||
    block.match(/\sid=\{[^}]*?["'`]([^"'`]+)["'`]/);
  if (idMatch) {
    const id = idMatch[1];
    if (src.includes(`htmlFor="${id}"`)) return true;
  }
  return false;
}

function patchAttributeInto(block, ariaLabel) {
  // JSX 속성 큰따옴표 안에 \" 가 들어가면 파서 에러. 안전하게 따옴표는 제거하거나 ' 로 치환.
  const escaped = ariaLabel.replace(/"/g, "'");
  // 마지막 닫는 > 직전(자기닫힘 / 끝났을 수 있음)
  const selfClose = block.endsWith('/>');
  const cut = selfClose ? block.length - 2 : block.length - 1;
  const head = block.slice(0, cut).trimEnd();
  const tail = selfClose ? ' />' : '>';
  return `${head} aria-label="${escaped}"${tail}`;
}

/* ---------- 메인 ---------- */

function main() {
  const files = globSync('src/app/tools/**/page.tsx', { cwd: WEB_ROOT });
  let patches = 0;
  let skipped = 0;
  let touchedFiles = 0;
  const samples = [];

  for (const rel of files) {
    const fp = join(WEB_ROOT, rel);
    const src = readFileSync(fp, 'utf-8');
    const opens = findOpeningTags(src, ['input', 'textarea', 'Input', 'Textarea']);
    if (opens.length === 0) continue;

    // 뒤쪽부터 처리해 인덱스 깨짐 방지
    let next = src;
    for (let k = opens.length - 1; k >= 0; k--) {
      const t = opens[k];
      const block = next.slice(t.start, t.end + 1);
      if (shouldSkip(block, next)) {
        skipped++;
        continue;
      }
      const preceding = next.slice(Math.max(0, t.start - 400), t.start);
      let candidate = extractCandidateLabels(preceding);

      // 폴백 1: placeholder 가 있으면 그 값을 라벨로 사용
      if (!candidate) {
        const ph = block.match(/placeholder\s*=\s*"([^"]+)"/);
        if (ph) candidate = ph[1].slice(0, 40);
      }
      // 폴백 2: readOnly textarea/Input 은 "결과" 로 의미 부여
      if (!candidate && /\breadOnly\b/.test(block)) {
        candidate = '결과';
      }

      if (!candidate) {
        skipped++;
        continue;
      }
      const patched = patchAttributeInto(block, candidate);
      next = next.slice(0, t.start) + patched + next.slice(t.end + 1);
      patches++;
      if (samples.length < MAX_PREVIEW) {
        samples.push({
          file: rel,
          line: src.slice(0, t.start).split('\n').length,
          label: candidate,
          before: block.slice(0, 80),
        });
      }
    }

    if (next !== src) {
      touchedFiles++;
      if (APPLY) writeFileSync(fp, next, 'utf-8');
    }
  }

  console.log(`\n패치 ${patches}건 / 스킵 ${skipped}건 / 변경 파일 ${touchedFiles}개`);
  console.log(`모드: ${APPLY ? 'APPLY (파일 수정 완료)' : 'DRY-RUN (파일 변경 없음)'}\n`);
  for (const s of samples) {
    console.log(`${s.file}:${s.line}`);
    console.log(`  라벨: "${s.label}"`);
    console.log(`  before: ${s.before.replace(/\n/g, ' ')}`);
  }
  if (samples.length === MAX_PREVIEW && !SHOW_ALL) {
    console.log(`\n...추가 ${patches - samples.length}건 (전체 보기: --all)`);
  }
}

main();

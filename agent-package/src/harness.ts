import { readdirSync, statSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import type { SupabaseClient } from '@supabase/supabase-js';

const SEARCH_PATHS = [
  join(homedir(), 'Desktop'),
  join(homedir(), 'Documents'),
  join(homedir(), 'Projects'),
  'C:\\Projects',
  'D:\\Projects',
];

interface HarnessInfo {
  name: string;
  path: string;
  description: string;
  content: string;
  score: number;
  features: string[];
}

/**
 * CLAUDE.md 내용을 분석하여 점수와 기능 목록을 추출
 */
function analyzeHarness(content: string): { score: number; features: string[]; description: string } {
  const features: string[] = [];
  let score = 0;

  const lines = content.split('\n');
  const headings = lines.filter((l) => l.startsWith('#'));
  const totalLength = content.length;

  // 1. 기본 구조 점수 (최대 20점)
  if (totalLength > 100) score += 5;
  if (totalLength > 500) score += 5;
  if (totalLength > 1500) score += 5;
  if (totalLength > 3000) score += 5;

  // 2. 섹션 구조 점수 (최대 20점)
  if (headings.length >= 2) { score += 5; features.push('섹션 구조화'); }
  if (headings.length >= 5) score += 5;
  if (headings.length >= 8) score += 5;
  if (headings.length >= 12) score += 5;

  // 3. 핵심 항목 존재 여부 (각 10점, 최대 60점)
  if (/기술\s*스택|tech\s*stack|스택/i.test(content)) {
    score += 10; features.push('기술 스택 정의');
  }
  if (/프로젝트\s*구조|구조|structure|디렉토리/i.test(content)) {
    score += 10; features.push('프로젝트 구조');
  }
  if (/컨벤션|convention|코딩\s*스타일|스타일/i.test(content)) {
    score += 10; features.push('코딩 컨벤션');
  }
  if (/명령어|command|스크립트|npm run|yarn/i.test(content)) {
    score += 10; features.push('명령어 가이드');
  }
  if (/제약|constraint|주의|금지|절대|never|must not/i.test(content)) {
    score += 10; features.push('제약사항/규칙');
  }
  if (/데이터|db|database|스키마|schema|테이블|table/i.test(content)) {
    score += 10; features.push('DB/스키마 정의');
  }

  // 보너스 항목 (각 5점)
  if (/```/.test(content)) { score += 5; features.push('코드 예시'); }
  if (/\|.*\|.*\|/.test(content)) { score += 5; features.push('테이블 사용'); }
  if (/플로우|flow|워크플로우|workflow|순서/i.test(content)) {
    score += 5; features.push('워크플로우 정의');
  }
  if (/에러|error|디버그|debug|문제\s*해결|troubleshoot/i.test(content)) {
    score += 5; features.push('문제해결 가이드');
  }
  if (/api|엔드포인트|endpoint|route/i.test(content)) {
    score += 5; features.push('API 정의');
  }
  if (/테스트|test|jest|vitest/i.test(content)) {
    score += 5; features.push('테스트 가이드');
  }
  if (/배포|deploy|vercel|docker|ci\/cd/i.test(content)) {
    score += 5; features.push('배포 가이드');
  }
  if (/인증|auth|보안|security/i.test(content)) {
    score += 5; features.push('인증/보안');
  }

  // 100점 상한
  score = Math.min(score, 100);

  // 설명 추출: 첫 비헤딩 비빈줄
  const firstLine = lines.find((l) => l.trim() && !l.startsWith('#'));
  const description = firstLine ? firstLine.trim().substring(0, 100) : '';

  return { score, features, description };
}

function findHarnesses(searchPath: string, depth = 0, maxDepth = 2): HarnessInfo[] {
  const results: HarnessInfo[] = [];

  try {
    const entries = readdirSync(searchPath);

    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'node_modules') continue;

      const fullPath = join(searchPath, entry);

      try {
        const stat = statSync(fullPath);

        if (!stat.isDirectory()) {
          if (entry === 'CLAUDE.md') {
            const projectName = basename(searchPath);
            let content = '';

            try {
              content = readFileSync(fullPath, 'utf-8');
            } catch {}

            const analysis = analyzeHarness(content);

            results.push({
              name: projectName,
              path: fullPath,
              content,
              description: analysis.description,
              score: analysis.score,
              features: analysis.features,
            });
          }
          continue;
        }

        if (depth < maxDepth) {
          results.push(...findHarnesses(fullPath, depth + 1, maxDepth));
        }
      } catch {}
    }
  } catch {}

  return results;
}

export async function syncHarnesses(supabase: SupabaseClient, agentId: string) {
  console.log('[하네스] 스캔 시작...');

  const allHarnesses: HarnessInfo[] = [];

  for (const searchPath of SEARCH_PATHS) {
    try {
      statSync(searchPath);
      const found = findHarnesses(searchPath);
      allHarnesses.push(...found);
    } catch {}
  }

  const uniqueHarnesses = allHarnesses.filter(
    (h, i, arr) => arr.findIndex((x) => x.path === h.path) === i
  );

  console.log(`[하네스] ${uniqueHarnesses.length}개 발견`);

  await supabase.from('harnesses').delete().eq('agent_id', agentId);

  if (uniqueHarnesses.length > 0) {
    const rows = uniqueHarnesses.map((h) => ({
      agent_id: agentId,
      name: h.name,
      path: h.path,
      description: h.description,
      content: h.content,
      score: h.score,
      features: h.features,
    }));

    const { error } = await supabase.from('harnesses').insert(rows);
    if (error) {
      console.error('[하네스] 등록 실패:', error.message);
    } else {
      uniqueHarnesses.forEach((h) =>
        console.log(`  - ${h.name}: ${h.score}점 [${h.features.join(', ')}]`)
      );
    }
  }
}

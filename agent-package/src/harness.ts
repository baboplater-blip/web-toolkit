import { readdirSync, statSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import type { SupabaseClient } from '@supabase/supabase-js';

// CLAUDE.md 파일을 찾을 기본 경로 목록
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
}

/**
 * 지정된 디렉토리에서 CLAUDE.md 파일을 탐색 (최대 2단계 깊이)
 */
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
            // 프로젝트 이름은 부모 디렉토리 이름 사용
            const projectName = basename(searchPath);
            let description = '';

            // 파일 첫 줄에서 설명 추출
            try {
              const content = readFileSync(fullPath, 'utf-8');
              const firstLine = content.split('\n').find((l) => l.trim() && !l.startsWith('#'));
              if (firstLine) description = firstLine.trim().substring(0, 100);
            } catch {}

            results.push({
              name: projectName,
              path: fullPath,
              description,
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

/**
 * PC의 하네스 목록을 Supabase에 동기화
 */
export async function syncHarnesses(supabase: SupabaseClient, agentId: string) {
  console.log('[하네스] 스캔 시작...');

  const allHarnesses: HarnessInfo[] = [];

  for (const searchPath of SEARCH_PATHS) {
    try {
      statSync(searchPath);
      const found = findHarnesses(searchPath);
      allHarnesses.push(...found);
    } catch {
      // 경로가 존재하지 않으면 스킵
    }
  }

  // 중복 제거 (path 기준)
  const uniqueHarnesses = allHarnesses.filter(
    (h, i, arr) => arr.findIndex((x) => x.path === h.path) === i
  );

  console.log(`[하네스] ${uniqueHarnesses.length}개 발견`);

  // 기존 하네스 삭제 후 재등록
  await supabase.from('harnesses').delete().eq('agent_id', agentId);

  if (uniqueHarnesses.length > 0) {
    const rows = uniqueHarnesses.map((h) => ({
      agent_id: agentId,
      name: h.name,
      path: h.path,
      description: h.description,
    }));

    const { error } = await supabase.from('harnesses').insert(rows);
    if (error) {
      console.error('[하네스] 등록 실패:', error.message);
    } else {
      uniqueHarnesses.forEach((h) =>
        console.log(`  - ${h.name}: ${h.path}`)
      );
    }
  }
}

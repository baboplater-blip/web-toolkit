/**
 * 빌드 전 agent-package 소스 파일을 web/public/_agent/ 로 복사한다.
 *
 * 이유: 원클릭 설치 스크립트(PowerShell)가 public GitHub URL 에 의존하던 것을 바꿔,
 * Vercel 로 배포된 바로 이 앱 자체가 agent-package 파일을 서빙하게 함.
 * GitHub repo 가 private 이거나 URL 이 바뀌어도 자동 설치가 깨지지 않는다.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const agentPackageDir = resolve(here, '..', '..', 'agent-package');
const targetDir = resolve(here, '..', 'public', '_agent');

if (!existsSync(agentPackageDir)) {
  console.warn(`[copy-agent-package] source missing: ${agentPackageDir} — skipping`);
  process.exit(0);
}

// 이전 복사본 제거
if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });
}
mkdirSync(targetDir, { recursive: true });
mkdirSync(join(targetDir, 'src'), { recursive: true });

// 최상위 파일
for (const f of ['package.json', 'tsconfig.json', 'ecosystem.config.js']) {
  const src = join(agentPackageDir, f);
  if (existsSync(src)) cpSync(src, join(targetDir, f));
}

// src 전체 복사 (재귀)
const srcDir = join(agentPackageDir, 'src');
if (existsSync(srcDir)) {
  for (const name of readdirSync(srcDir)) {
    cpSync(join(srcDir, name), join(targetDir, 'src', name), { recursive: true });
  }
}

const count = readdirSync(join(targetDir, 'src')).length;
console.log(`[copy-agent-package] copied ${count} src files → public/_agent/`);

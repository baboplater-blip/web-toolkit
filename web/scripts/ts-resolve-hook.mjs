/**
 * Node 모듈 resolve 훅 — 빌드 스크립트가 프로젝트 TS 데이터 모듈을 직접 import 할 때
 * `@/...` 경로 별칭과 확장자 없는 `.ts` import 를 해석한다.
 *
 * Node 24 의 네이티브 TypeScript(타입 스트리핑)와 함께 쓰면, esbuild/tsx 같은
 * 추가 의존성 없이 실제 타입 데이터를 그대로 읽어 라이트 인덱스를 생성할 수 있다.
 */

import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve as resolvePath, join } from 'node:path';

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function withExt(p) {
  if (existsSync(p)) return p;
  for (const ext of ['.ts', '.tsx', '.mjs', '.js']) {
    if (existsSync(p + ext)) return p + ext;
  }
  return p;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const target = withExt(join(SRC, specifier.slice(2)));
    return nextResolve(pathToFileURL(target).href, context);
  }
  return nextResolve(specifier, context);
}

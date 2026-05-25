#!/usr/bin/env python3
"""
webpack-bundle-analyzer 리포트(client.html) 에서 모듈 단위 분석 요약을 추출.

사용:
  1. `ANALYZE=true npx next build --webpack` 실행 → `.next/analyze/client.html` 생성
  2. `python3 scripts/parse-bundle.py` 로 상위 패키지/청크 요약 출력

Turbopack 빌드(`next build`) 에는 분석 데이터가 안 들어가므로, 분석이 필요한 라운드에서만
일회성으로 webpack 빌드를 돌려서 사용한다. 프로덕션 빌드는 계속 Turbopack 으로.
"""
import re
import json
import sys
from collections import defaultdict


def load_chart(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    m = re.search(r'window\.chartData\s*=\s*(\[[\s\S]*?\]);', html)
    if not m:
        raise SystemExit('chartData not found')
    return json.loads(m.group(1))


def walk_groups(node, prefix=''):
    """Yield (path, parsedSize, gzipSize) for every leaf module."""
    if 'groups' not in node or not node['groups']:
        yield (
            node.get('path') or node.get('label', '?'),
            node.get('parsedSize', 0),
            node.get('gzipSize', 0),
        )
        return
    for g in node['groups']:
        yield from walk_groups(g, prefix)


def classify(path):
    """Return a short bucket label for a module path."""
    if 'node_modules' in path:
        parts = path.split('node_modules')[-1].lstrip('/').split('/')
        if parts and parts[0].startswith('@'):
            return '/'.join(parts[:2])
        return parts[0] if parts else '?'
    if 'src/app' in path:
        return 'app:' + path.split('src/app')[-1].lstrip('/').rsplit('/', 1)[0]
    if 'src/components' in path:
        return 'components'
    if 'src/lib' in path:
        return 'lib'
    if 'src/' in path:
        return 'src-other'
    return 'other'


def main():
    chunks = load_chart('.next/analyze/client.html')
    print(f'Loaded {len(chunks)} chunks')

    # Per-package aggregate (parsedSize)
    pkg_parsed = defaultdict(int)
    pkg_gzip = defaultdict(int)
    pkg_modules = defaultdict(int)

    for ch in chunks:
        for path, parsed, gzip in walk_groups(ch):
            bucket = classify(path)
            pkg_parsed[bucket] += parsed
            pkg_gzip[bucket] += gzip
            pkg_modules[bucket] += 1

    print()
    print('=== TOP 30 NODE_MODULES PACKAGES BY parsedSize (across all chunks) ===')
    items = sorted(pkg_parsed.items(), key=lambda x: -x[1])
    for bucket, total in items[:30]:
        gz = pkg_gzip[bucket]
        mods = pkg_modules[bucket]
        print(f'  parsed={total:>10,}  gzip={gz:>9,}  mods={mods:>4}  {bucket}')

    # Now per-chunk: which chunks are biggest and what's the top contributor in each
    print()
    print('=== TOP 15 CHUNKS WITH TOP 3 CONTRIBUTORS EACH ===')
    big = sorted(chunks, key=lambda c: -c.get('parsedSize', 0))[:15]
    for ch in big:
        label = ch.get('label', '?')
        total = ch.get('parsedSize', 0)
        gzip = ch.get('gzipSize', 0)
        contribs = defaultdict(int)
        for path, p, _g in walk_groups(ch):
            contribs[classify(path)] += p
        top3 = sorted(contribs.items(), key=lambda x: -x[1])[:3]
        top3_str = ', '.join(f'{n}={p:,}' for n, p in top3)
        print(f'  chunk={label[:50]:50}  parsed={total:>10,}  gzip={gzip:>8,}')
        print(f'    top: {top3_str}')


if __name__ == '__main__':
    main()

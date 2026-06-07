/** .gitignore 템플릿 모음 (브라우저 전용, 외부 의존성 없음). */

export interface GitignoreTemplate {
  id: string;
  /** 표시용 라벨 */
  label: string;
  /** 분류(언어/프레임워크/OS·에디터) */
  group: 'language' | 'framework' | 'tooling';
  /** 템플릿 본문(여러 줄) */
  body: string;
}

export const GITIGNORE_TEMPLATES: readonly GitignoreTemplate[] = [
  {
    id: 'node',
    label: 'Node',
    group: 'language',
    body: ['node_modules/', 'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*', 'pnpm-debug.log*', '.pnp.*', '.npm/', '*.tsbuildinfo'].join('\n'),
  },
  {
    id: 'python',
    label: 'Python',
    group: 'language',
    body: ['__pycache__/', '*.py[cod]', '*$py.class', '*.egg-info/', '.eggs/', 'build/', 'dist/', '.venv/', 'venv/', 'env/', '.pytest_cache/', '.mypy_cache/', '.coverage', 'htmlcov/'].join('\n'),
  },
  {
    id: 'java',
    label: 'Java',
    group: 'language',
    body: ['*.class', '*.jar', '*.war', '*.ear', 'target/', '.gradle/', 'build/', 'hs_err_pid*'].join('\n'),
  },
  {
    id: 'go',
    label: 'Go',
    group: 'language',
    body: ['*.exe', '*.exe~', '*.dll', '*.so', '*.dylib', '*.test', '*.out', 'vendor/', 'go.work'].join('\n'),
  },
  {
    id: 'rust',
    label: 'Rust',
    group: 'language',
    body: ['/target/', 'Cargo.lock', '**/*.rs.bk', '*.pdb'].join('\n'),
  },
  {
    id: 'next',
    label: 'Next.js',
    group: 'framework',
    body: ['.next/', 'out/', 'build/', '.vercel/', 'next-env.d.ts', '.env*.local'].join('\n'),
  },
  {
    id: 'react',
    label: 'React (CRA/Vite)',
    group: 'framework',
    body: ['build/', 'dist/', '.env.local', '.env.development.local', '.env.production.local', 'coverage/'].join('\n'),
  },
  {
    id: 'django',
    label: 'Django',
    group: 'framework',
    body: ['*.log', 'local_settings.py', 'db.sqlite3', 'db.sqlite3-journal', 'media/', 'staticfiles/', '/static/'].join('\n'),
  },
  {
    id: 'unity',
    label: 'Unity',
    group: 'framework',
    body: ['[Ll]ibrary/', '[Tt]emp/', '[Oo]bj/', '[Bb]uild/', '[Bb]uilds/', '[Ll]ogs/', '[Uu]ser[Ss]ettings/', '*.csproj', '*.sln', '*.unitypackage', '.vs/'].join('\n'),
  },
  {
    id: 'macos',
    label: 'macOS',
    group: 'tooling',
    body: ['.DS_Store', '.AppleDouble', '.LSOverride', '._*', '.Spotlight-V100', '.Trashes', '.fseventsd'].join('\n'),
  },
  {
    id: 'windows',
    label: 'Windows',
    group: 'tooling',
    body: ['Thumbs.db', 'Thumbs.db:encryptable', 'ehthumbs.db', 'Desktop.ini', '$RECYCLE.BIN/', '*.lnk'].join('\n'),
  },
  {
    id: 'linux',
    label: 'Linux',
    group: 'tooling',
    body: ['*~', '.fuse_hidden*', '.directory', '.Trash-*', '.nfs*'].join('\n'),
  },
  {
    id: 'vscode',
    label: 'VS Code',
    group: 'tooling',
    body: ['.vscode/*', '!.vscode/settings.json', '!.vscode/extensions.json', '*.code-workspace', '.history/'].join('\n'),
  },
  {
    id: 'jetbrains',
    label: 'JetBrains',
    group: 'tooling',
    body: ['.idea/', '*.iml', '*.ipr', '*.iws', 'out/', '.idea_modules/'].join('\n'),
  },
];

/**
 * 선택한 템플릿 id 들을 정의 순서대로 조합해 단일 .gitignore 문자열로 만든다.
 * 각 블록 앞에 출처 주석 헤더를 붙이고, 블록 사이를 빈 줄로 구분한다.
 */
export function buildGitignore(selectedIds: readonly string[]): string {
  const blocks: string[] = [];
  // 정의 순서를 유지하기 위해 원본 배열을 순회한다.
  for (const template of GITIGNORE_TEMPLATES) {
    if (!selectedIds.includes(template.id)) continue;
    blocks.push(`# ${template.label}\n${template.body}`);
  }
  if (blocks.length === 0) return '';
  return `${blocks.join('\n\n')}\n`;
}

'use client';

import { useMemo, useState } from 'react';
import { GitBranch, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

/** 명령 조립에 쓰이는 입력 필드 식별자. */
type FieldKey = 'branch' | 'message' | 'file' | 'hash';

interface GitTask {
  id: string;
  label: string;
  /** 이 작업이 노출할 입력 필드. */
  fields: FieldKey[];
  /** 입력값을 받아 git 명령 문자열을 생성. */
  build: (values: Record<FieldKey, string>) => string;
}

const FIELD_META: Record<FieldKey, { label: string; placeholder: string; fallback: string }> = {
  branch: { label: '브랜치 이름', placeholder: 'feature/login', fallback: '<branch>' },
  message: { label: '커밋 메시지', placeholder: '버그 수정', fallback: '<message>' },
  file: { label: '파일 경로', placeholder: 'src/app.ts', fallback: '<file>' },
  hash: { label: '커밋 해시', placeholder: 'a1b2c3d', fallback: '<hash>' },
};

/** 빈 값이면 자리표시자로 대체해 항상 형태가 보이도록 한다. */
function valueOr(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed === '' ? fallback : trimmed;
}

const TASKS: GitTask[] = [
  {
    id: 'new-branch',
    label: '새 브랜치 만들기',
    fields: ['branch'],
    build: (v) => `git switch -c ${valueOr(v.branch, FIELD_META.branch.fallback)}`,
  },
  {
    id: 'commit',
    label: '커밋',
    fields: ['message'],
    build: (v) => `git commit -m "${valueOr(v.message, FIELD_META.message.fallback)}"`,
  },
  {
    id: 'amend',
    label: '마지막 커밋 수정',
    fields: ['message'],
    build: (v) => `git commit --amend -m "${valueOr(v.message, FIELD_META.message.fallback)}"`,
  },
  {
    id: 'unstage',
    label: '스테이징 취소',
    fields: ['file'],
    build: (v) => `git restore --staged ${valueOr(v.file, FIELD_META.file.fallback)}`,
  },
  {
    id: 'discard',
    label: '변경 되돌리기',
    fields: ['file'],
    build: (v) => `git restore ${valueOr(v.file, FIELD_META.file.fallback)}`,
  },
  {
    id: 'push',
    label: '원격에 푸시',
    fields: ['branch'],
    build: (v) => `git push -u origin ${valueOr(v.branch, FIELD_META.branch.fallback)}`,
  },
  {
    id: 'stash',
    label: 'stash 저장',
    fields: [],
    build: () => 'git stash push',
  },
  {
    id: 'reset-hash',
    label: '특정 커밋으로 reset',
    fields: ['hash'],
    build: (v) => `git reset --hard ${valueOr(v.hash, FIELD_META.hash.fallback)}`,
  },
  {
    id: 'merge',
    label: '병합',
    fields: ['branch'],
    build: (v) => `git merge ${valueOr(v.branch, FIELD_META.branch.fallback)}`,
  },
  {
    id: 'tag',
    label: '태그',
    fields: ['branch'],
    build: (v) => `git tag ${valueOr(v.branch, '<tag>')}`,
  },
];

const EMPTY_VALUES: Record<FieldKey, string> = { branch: '', message: '', file: '', hash: '' };

export default function GitCommandBuilderPage() {
  const [taskId, setTaskId] = useState(TASKS[0].id);
  const [values, setValues] = useState<Record<FieldKey, string>>({ ...EMPTY_VALUES });
  const [copied, setCopied] = useState(false);

  const task = useMemo(() => TASKS.find((item) => item.id === taskId) ?? TASKS[0], [taskId]);
  const command = useMemo(() => task.build(values), [task, values]);

  function setField(key: FieldKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setTaskId(TASKS[0].id);
    setValues({ ...EMPTY_VALUES });
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="Git 명령 빌더" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitBranch className="h-4 w-4 text-primary" aria-hidden />
          작업을 고르고 값을 채우면 git 명령을 만들어 줍니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">작업</span>
            <select
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              aria-label="git 작업 선택"
            >
              {TASKS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          {task.fields.map((key) => (
            <label key={key} className="block space-y-1">
              <span className="text-sm font-medium">{FIELD_META[key].label}</span>
              <Input
                value={values[key]}
                onChange={(event) => setField(key, event.target.value)}
                placeholder={FIELD_META[key].placeholder}
                aria-label={FIELD_META[key].label}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">명령</span>
            <Button variant="outline" size="sm" onClick={copy} aria-label="명령 복사">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap break-all">
            {command}
          </pre>
        </div>
      </main>
    </div>
  );
}

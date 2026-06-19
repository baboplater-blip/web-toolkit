'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Shuffle, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToolHeader } from '@/components/tools/ToolHeader';

/**
 * [0, maxExclusive) 범위의 균등한 정수를 반환한다.
 * 단순 `% maxExclusive` 는 2^32 가 maxExclusive 의 배수가 아닐 때 모듈로 편향이 생기므로,
 * 균등 분포가 보장되는 상한 이상 값은 버리고 다시 뽑는 거부 표집(rejection sampling)을 쓴다.
 */
function secureRandomInt(maxExclusive: number): number {
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % maxExclusive;
}

function shuffleSecure<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Mode = 'teams' | 'size';

export default function RandomTeamGeneratorPage() {
  const [raw, setRaw] = useState('');
  const [mode, setMode] = useState<Mode>('teams');
  const [teamCount, setTeamCount] = useState(2);
  const [teamSize, setTeamSize] = useState(2);
  const [teams, setTeams] = useState<string[][]>([]);
  const [copied, setCopied] = useState(false);

  const names = useMemo(
    () =>
      raw
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    [raw],
  );

  const canGenerate =
    names.length > 0 && (mode === 'teams' ? teamCount > 0 : teamSize > 0);

  const generate = () => {
    if (!canGenerate) return;

    const shuffled = shuffleSecure(names);
    // 팀 수 결정: 'teams' 모드는 입력값, 'size' 모드는 팀당 인원으로 역산.
    const groups =
      mode === 'teams'
        ? Math.min(teamCount, shuffled.length)
        : Math.max(1, Math.ceil(shuffled.length / teamSize));

    const buckets: string[][] = Array.from({ length: groups }, () => []);
    // 라운드 로빈 분배 → 팀 간 인원 균형(차이 최대 1명).
    shuffled.forEach((name, index) => {
      buckets[index % groups].push(name);
    });

    setTeams(buckets);
  };

  const reset = () => {
    setTeams([]);
    setCopied(false);
  };

  const copyAll = async () => {
    if (teams.length === 0) return;
    const text = teams
      .map((team, i) => `[팀 ${i + 1}]\n${team.join('\n')}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 접근 불가 시 무시 */
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="랜덤 팀 편성" onReset={teams.length > 0 ? reset : undefined} />

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          이름 목록을 무작위로 섞어 균형 잡힌 팀으로 나눕니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="rt-names">
              이름 목록 (한 줄에 하나)
            </label>
            <textarea
              id="rt-names"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={8}
              placeholder={'홍길동\n김철수\n이영희\n박민수'}
              className="w-full resize-y rounded-lg border bg-background px-3 py-2 font-mono text-sm"
              spellCheck={false}
              aria-label="이름 목록"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">인식된 인원: {names.length}명</p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'teams' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('teams')}
            >
              팀 개수로 나누기
            </Button>
            <Button
              type="button"
              variant={mode === 'size' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('size')}
            >
              팀당 인원으로 나누기
            </Button>
          </div>

          {mode === 'teams' ? (
            <label className="block space-y-1">
              <span className="text-xs font-medium">팀 개수</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={teamCount}
                onChange={(e) => setTeamCount(Math.max(1, Number(e.target.value) || 1))}
                aria-label="팀 개수"
              />
            </label>
          ) : (
            <label className="block space-y-1">
              <span className="text-xs font-medium">팀당 인원</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={teamSize}
                onChange={(e) => setTeamSize(Math.max(1, Number(e.target.value) || 1))}
                aria-label="팀당 인원"
              />
            </label>
          )}

          <Button onClick={generate} disabled={!canGenerate} className="w-full">
            <Shuffle className="mr-1.5 h-4 w-4" />
            팀 편성
          </Button>
        </div>

        {teams.length > 0 && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                결과 ({teams.length}팀)
              </h2>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={generate}>
                  <Shuffle className="mr-1 h-3.5 w-3.5" />
                  다시 편성
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyAll}>
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      전체 복사
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
              {teams.map((team, i) => (
                <div key={i} className="rounded-lg border bg-background p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" aria-hidden />
                    <span className="text-sm font-semibold">
                      팀 {i + 1}{' '}
                      <span className="font-normal text-muted-foreground">({team.length}명)</span>
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {team.map((name, j) => (
                      <li key={`${name}-${j}`} className="text-sm">
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            Web Crypto <code className="font-mono">crypto.getRandomValues</code> 기반 Fisher–Yates
            셔플 후 라운드 로빈으로 분배합니다. 명단은 서버로 전송되지 않습니다.
          </p>
        </div>
      </main>
    </div>
  );
}

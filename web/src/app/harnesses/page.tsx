'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import {
  FileCode,
  ChevronDown,
  ChevronRight,
  Monitor,
  RefreshCw,
  Loader2,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HarnessWithAgent {
  id: string;
  name: string;
  path: string;
  description: string;
  content: string;
  score: number;
  features: string[];
  agent_id: string;
  agents: { name: string; status: string } | null;
}

function ScoreBadge({ score }: { score: number }) {
  let color = 'bg-red-500/20 text-red-400';
  let label = 'F';

  if (score >= 90) { color = 'bg-emerald-500/20 text-emerald-400'; label = 'S'; }
  else if (score >= 75) { color = 'bg-green-500/20 text-green-400'; label = 'A'; }
  else if (score >= 60) { color = 'bg-blue-500/20 text-blue-400'; label = 'B'; }
  else if (score >= 40) { color = 'bg-yellow-500/20 text-yellow-400'; label = 'C'; }
  else if (score >= 20) { color = 'bg-orange-500/20 text-orange-400'; label = 'D'; }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold ${color}`}>
        {label}
      </div>
      <div>
        <p className="text-xl font-bold">{score}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  let barColor = 'bg-red-500';
  if (score >= 90) barColor = 'bg-emerald-500';
  else if (score >= 75) barColor = 'bg-green-500';
  else if (score >= 60) barColor = 'bg-blue-500';
  else if (score >= 40) barColor = 'bg-yellow-500';
  else if (score >= 20) barColor = 'bg-orange-500';

  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${barColor}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function HarnessCard({ harness, onImprove }: { harness: HarnessWithAgent; onImprove: (h: HarnessWithAgent) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [improving, setImproving] = useState(false);
  const features = Array.isArray(harness.features) ? harness.features : [];

  const handleImprove = async () => {
    setImproving(true);
    onImprove(harness);
    // 버튼을 5초 후 리셋 (명령이 전송되면 바로 반영되지 않으므로)
    setTimeout(() => setImproving(false), 5000);
  };

  return (
    <div className="border rounded-xl p-4 bg-card">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
            <h3 className="font-semibold text-base truncate">{harness.name}</h3>
          </div>
          {harness.agents && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Monitor className="h-3.5 w-3.5" />
              <span>{harness.agents.name}</span>
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  harness.agents.status === 'online'
                    ? 'bg-emerald-500'
                    : harness.agents.status === 'busy'
                      ? 'bg-amber-500'
                      : 'bg-zinc-500',
                )}
              />
            </div>
          )}
        </div>
        <ScoreBadge score={harness.score} />
      </div>

      <ScoreBar score={harness.score} />

      {/* 설명 */}
      {harness.description && (
        <p className="text-sm text-muted-foreground mt-3">{harness.description}</p>
      )}

      {/* 기능 태그 */}
      {features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {features.map((f) => (
            <Badge key={f} variant="secondary" className="text-[11px]">
              {f}
            </Badge>
          ))}
        </div>
      )}

      {/* 경로 + 개선 버튼 */}
      <div className="flex items-center justify-between mt-3 gap-2">
        <p className="text-[11px] text-muted-foreground font-mono truncate flex-1">
          {harness.path}
        </p>
        <Button
          variant={harness.score >= 90 ? 'outline' : 'default'}
          size="sm"
          className="shrink-0 h-8 text-xs gap-1"
          onClick={handleImprove}
          disabled={improving || harness.agents?.status === 'offline'}
        >
          {improving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {improving ? '개선 중...' : harness.score >= 90 ? '추가 개선' : '개선하기'}
        </Button>
      </div>

      {/* 내용 펼치기/접기 */}
      {harness.content && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            CLAUDE.md 내용 보기 ({harness.content.length}자)
          </button>
          {expanded && (
            <div className="mt-2 border rounded-lg p-3 bg-muted/30 max-h-96 overflow-y-auto text-sm">
              <MarkdownRenderer content={harness.content} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HarnessesPage() {
  const [harnesses, setHarnesses] = useState<HarnessWithAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('harnesses')
      .select('*, agents(name, status)')
      .order('score', { ascending: false });

    if (data) setHarnesses(data as unknown as HarnessWithAgent[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /** 하네스 개선 명령을 해당 PC Agent에게 전송 */
  const handleImprove = async (h: HarnessWithAgent) => {
    // 부족한 항목 분석
    const allPossible = [
      '기술 스택 정의', '프로젝트 구조', '코딩 컨벤션', '명령어 가이드',
      '제약사항/규칙', 'DB/스키마 정의', '코드 예시', '테이블 사용',
      '워크플로우 정의', '문제해결 가이드', 'API 정의', '테스트 가이드',
      '배포 가이드', '인증/보안',
    ];
    const existing = Array.isArray(h.features) ? h.features : [];
    const missing = allPossible.filter((f) => !existing.includes(f));

    const prompt = `이 프로젝트의 CLAUDE.md 하네스 파일을 분석하고 개선해주세요.

현재 점수: ${h.score}/100점
현재 포함된 항목: ${existing.join(', ') || '없음'}
부족한 항목: ${missing.join(', ') || '없음'}

다음을 수행해주세요:
1. 현재 프로젝트 코드를 분석하여 CLAUDE.md에 빠진 정보를 파악
2. ${missing.length > 0 ? `특히 다음 항목을 보강: ${missing.slice(0, 5).join(', ')}` : '기존 내용의 정확성과 최신성을 검증'}
3. CLAUDE.md 파일을 직접 수정하여 개선
4. 불필요한 내용은 제거하고, 실제 코드 구조에 맞게 업데이트

프로젝트 코드를 먼저 탐색한 후 CLAUDE.md를 수정해주세요.`;

    // 해당 agent에게 메시지 전송
    await supabase.from('messages').insert({
      agent_id: h.agent_id,
      harness_id: h.id,
      role: 'user',
      content: prompt,
      status: 'completed',
    });
  };

  const avgScore = harnesses.length > 0
    ? Math.round(harnesses.reduce((sum, h) => sum + h.score, 0) / harnesses.length)
    : 0;

  const allFeatures = [...new Set(harnesses.flatMap((h) =>
    Array.isArray(h.features) ? h.features : []
  ))];

  return (
    <div className="min-h-dvh bg-background pb-14 md:pb-0">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center gap-2 px-4">
          <FileCode className="h-5 w-5" />
          <h1 className="text-base font-semibold">하네스 분석</h1>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={fetchData}
              aria-label="새로고침"
              title="새로고침"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100dvh-52px-3.5rem)] md:h-[calc(100dvh-52px)]">
        <div className="max-w-3xl mx-auto p-4 space-y-4">
          {/* 전체 요약 카드 */}
          <div className="border rounded-xl p-4 bg-card">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{harnesses.length}</p>
                <p className="text-xs text-muted-foreground">총 하네스</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{avgScore}</p>
                <p className="text-xs text-muted-foreground">평균 점수</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{allFeatures.length}</p>
                <p className="text-xs text-muted-foreground">총 기능 항목</p>
              </div>
            </div>

            {allFeatures.length > 0 && (
              <>
                <Separator className="my-3" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                    전체 기능 현황
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {allFeatures.map((f) => {
                      const count = harnesses.filter((h) =>
                        Array.isArray(h.features) && h.features.includes(f)
                      ).length;
                      return (
                        <Badge key={f} variant="outline" className="text-[11px]">
                          {f} ({count})
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 로딩 */}
          {loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              로딩 중...
            </div>
          )}

          {/* 하네스 카드 목록 (점수 높은 순) */}
          {!loading && harnesses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              등록된 하네스가 없습니다. Agent를 실행하면 자동으로 스캔됩니다.
            </div>
          )}

          {harnesses.map((h) => (
            <HarnessCard key={h.id} harness={h} onImprove={handleImprove} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

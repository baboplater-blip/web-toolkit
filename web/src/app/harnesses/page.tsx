'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import Link from 'next/link';
import {
  MessageSquare,
  LayoutDashboard,
  FileCode,
  Star,
  ChevronDown,
  ChevronRight,
  Monitor,
  RefreshCw,
} from 'lucide-react';

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

function HarnessCard({ harness }: { harness: HarnessWithAgent }) {
  const [expanded, setExpanded] = useState(false);
  const features = Array.isArray(harness.features) ? harness.features : [];

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
              <Monitor className="h-3 w-3" />
              <span>{harness.agents.name}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${
                harness.agents.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
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

      {/* 경로 */}
      <p className="text-[10px] text-muted-foreground mt-3 font-mono truncate">
        {harness.path}
      </p>

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

  const avgScore = harnesses.length > 0
    ? Math.round(harnesses.reduce((sum, h) => sum + h.score, 0) / harnesses.length)
    : 0;

  const allFeatures = [...new Set(harnesses.flatMap((h) =>
    Array.isArray(h.features) ? h.features : []
  ))];

  return (
    <div className="min-h-dvh bg-background">
      {/* 헤더 */}
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCode className="h-5 w-5" />
          <h1 className="font-bold text-lg">하네스 분석</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchData} title="새로고침">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/chat">
            <Button variant="ghost" size="icon" title="채팅">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" title="대시보드">
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <ScrollArea className="h-[calc(100dvh-57px)]">
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
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                    전체 기능 현황
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {allFeatures.map((f) => {
                      const count = harnesses.filter((h) =>
                        Array.isArray(h.features) && h.features.includes(f)
                      ).length;
                      return (
                        <Badge key={f} variant="outline" className="text-[10px]">
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
            <HarnessCard key={h.id} harness={h} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

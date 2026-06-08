'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type GradientKind = 'linear' | 'radial';

interface ColorStop {
  id: number;
  color: string;
  /** 0~100 백분율 위치 */
  position: number;
}

let stopIdSeq = 0;
function createStop(color: string, position: number): ColorStop {
  stopIdSeq += 1;
  return { id: stopIdSeq, color, position };
}

/** 색상 stop 배열을 "color pos%" 조각으로 직렬화한다. */
function stopsToCss(stops: ColorStop[]): string {
  return stops
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(', ');
}

/** 현재 설정으로 CSS background 값을 만든다. */
function buildGradientCss(kind: GradientKind, angle: number, stops: ColorStop[]): string {
  const stopsCss = stopsToCss(stops);
  if (kind === 'linear') {
    return `linear-gradient(${angle}deg, ${stopsCss})`;
  }
  return `radial-gradient(circle, ${stopsCss})`;
}

export default function CssGradientPage() {
  const [kind, setKind] = useState<GradientKind>('linear');
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<ColorStop[]>(() => [
    createStop('#6366f1', 0),
    createStop('#ec4899', 100),
  ]);
  const [copied, setCopied] = useState(false);

  const gradient = useMemo(
    () => buildGradientCss(kind, angle, stops),
    [kind, angle, stops],
  );
  const cssCode = `background: ${gradient};`;

  const updateStop = (id: number, patch: Partial<Omit<ColorStop, 'id'>>) => {
    setStops((prev) =>
      prev.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
    );
  };

  const addStop = () => {
    setStops((prev) => {
      // 마지막 두 stop 의 중간 위치에 새 stop 을 삽입한다.
      const sorted = prev.slice().sort((a, b) => a.position - b.position);
      const last = sorted[sorted.length - 1];
      const prevStop = sorted[sorted.length - 2];
      const midPos = prevStop ? Math.round((prevStop.position + last.position) / 2) : 50;
      return [...prev, createStop('#22d3ee', midPos)];
    });
  };

  const removeStop = (id: number) => {
    setStops((prev) => (prev.length <= 2 ? prev : prev.filter((s) => s.id !== id)));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 클립보드 접근 불가 — 무시 */
    }
  };

  const handleReset = () => {
    setKind('linear');
    setAngle(90);
    setStops([createStop('#6366f1', 0), createStop('#ec4899', 100)]);
  };

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="CSS 그라디언트 생성기" widthClass="max-w-xl" onReset={handleReset} />
      <main className="mx-auto max-w-xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          색·각도를 조절해 CSS linear/radial 그라디언트를 미리보고 코드를 복사합니다.
        </p>

      <div
        className="h-44 w-full rounded-xl border"
        style={{ background: gradient }}
        role="img"
        aria-label="그라디언트 미리보기"
      />

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm font-medium">유형</span>
          <Button
            type="button"
            variant={kind === 'linear' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setKind('linear')}
            aria-pressed={kind === 'linear'}
          >
            Linear
          </Button>
          <Button
            type="button"
            variant={kind === 'radial' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setKind('radial')}
            aria-pressed={kind === 'radial'}
          >
            Radial
          </Button>
        </div>

        {kind === 'linear' && (
          <label className="block space-y-1">
            <span className="text-sm font-medium">각도: {angle}°</span>
            <input
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="그라디언트 각도"
            />
          </label>
        )}
      </div>

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">색상 스톱 ({stops.length}개)</span>
          <Button type="button" variant="outline" size="sm" onClick={addStop}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            추가
          </Button>
        </div>

        <div className="space-y-2">
          {stops.map((stop, index) => (
            <div key={stop.id} className="flex items-center gap-2">
              <input
                type="color"
                value={stop.color}
                onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-background"
                aria-label={`스톱 ${index + 1} 색상`}
              />
              <Input
                value={stop.color}
                onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                className="font-mono"
                spellCheck={false}
                autoComplete="off"
                aria-label={`스톱 ${index + 1} 색상 hex`}
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(e) =>
                    updateStop(stop.id, {
                      position: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-16 font-mono"
                  aria-label={`스톱 ${index + 1} 위치(%)`}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeStop(stop.id)}
                disabled={stops.length <= 2}
                aria-label={`스톱 ${index + 1} 삭제`}
                title={stops.length <= 2 ? '최소 2개의 스톱이 필요합니다' : '삭제'}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">CSS 코드</span>
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg border bg-muted px-3 py-2 font-mono text-xs">
          {cssCode}
        </pre>
      </div>
      </main>
    </div>
  );
}

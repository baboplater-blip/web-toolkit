'use client';

import { useEffect, useRef, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';

type ChartType = 'bar' | 'line' | 'pie';

export default function ChartPage() {
  const [type, setType] = useState<ChartType>('bar');
  const [data, setData] = useState(`서울, 9700
부산, 3400
인천, 2900
대구, 2400
대전, 1500`);
  const [title, setTitle] = useState('인구 (천 명)');
  const [color, setColor] = useState('#6366f1');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(500);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState('');

  const parsed = parseData(data);

  useEffect(() => {
    drawChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, data, title, color, width, height]);

  function drawChart() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    const padding = { top: 60, right: 30, bottom: 60, left: 80 };

    // 제목
    ctx.fillStyle = '#111';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 32);

    if (parsed.length === 0) return;

    if (type === 'pie') {
      drawPie(ctx, parsed, width, height, color);
      return;
    }

    const max = Math.max(...parsed.map((p) => p.value));
    const min = Math.min(0, ...parsed.map((p) => p.value));
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // y 축 눈금
    ctx.strokeStyle = '#e5e7eb';
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const yVal = min + ((max - min) * i) / yTicks;
      const yPos = padding.top + chartH - (chartH * i) / yTicks;
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(padding.left + chartW, yPos);
      ctx.stroke();
      ctx.fillText(yVal.toFixed(0), padding.left - 8, yPos + 4);
    }

    // x 축 레이블
    ctx.textAlign = 'center';
    const slotW = chartW / parsed.length;
    parsed.forEach((p, i) => {
      const x = padding.left + slotW * (i + 0.5);
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.fillText(p.label, x, padding.top + chartH + 18);
    });

    if (type === 'bar') {
      ctx.fillStyle = color;
      parsed.forEach((p, i) => {
        const barW = slotW * 0.6;
        const x = padding.left + slotW * i + (slotW - barW) / 2;
        const h = ((p.value - min) / (max - min)) * chartH;
        const y = padding.top + chartH - h;
        ctx.fillRect(x, y, barW, h);
        ctx.fillStyle = '#111';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.value.toFixed(0), x + barW / 2, y - 4);
        ctx.fillStyle = color;
      });
    } else {
      // line
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      parsed.forEach((p, i) => {
        const x = padding.left + slotW * (i + 0.5);
        const y = padding.top + chartH - ((p.value - min) / (max - min)) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      parsed.forEach((p, i) => {
        const x = padding.left + slotW * (i + 0.5);
        const y = padding.top + chartH - ((p.value - min) / (max - min)) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    const url = canvas.toDataURL('image/png');
    setDownloadUrl(url);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h1 className="text-xl font-semibold">차트 → PNG</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          간단한 데이터를 막대·꺾은선·원그래프 PNG 로 만듭니다.
        </p>
      </header>

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium">차트 종류</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={type === 'bar' ? 'default' : 'outline'} size="sm" onClick={() => setType('bar')}>막대</Button>
            <Button variant={type === 'line' ? 'default' : 'outline'} size="sm" onClick={() => setType('line')}>꺾은선</Button>
            <Button variant={type === 'pie' ? 'default' : 'outline'} size="sm" onClick={() => setType('pie')}>원그래프</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">제목</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">색상</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-full rounded-md border bg-background" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">너비 (px)</label>
            <input type="number" min={300} max={2000} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">높이 (px)</label>
            <input type="number" min={200} max={2000} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">데이터 (한 줄에 "레이블, 값")</label>
        <textarea value={data} onChange={(e) => setData(e.target.value)} className="w-full rounded-md border bg-background p-3 text-xs font-mono h-32 leading-relaxed" />
      </div>

      <div className="rounded-xl border bg-card p-2 overflow-x-auto">
        <canvas ref={canvasRef} className="mx-auto max-w-full block" />
      </div>

      {downloadUrl && (
        <a
          href={downloadUrl}
          download={`chart-${Date.now()}.png`}
          className={buttonVariants({ variant: 'default', className: 'w-full' })}
        >
          <Download className="h-4 w-4" />
          PNG 다운로드
        </a>
      )}
    </main>
  );
}

function parseData(s: string): Array<{ label: string; value: number }> {
  return s
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      const label = parts[0] ?? '';
      const value = Number(parts[1]);
      return { label, value };
    })
    .filter((d) => d.label && !Number.isNaN(d.value));
}

function drawPie(
  ctx: CanvasRenderingContext2D,
  data: Array<{ label: string; value: number }>,
  width: number,
  height: number,
  baseColor: string,
) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return;
  const cx = width / 2;
  const cy = height / 2 + 20;
  const radius = Math.min(width, height) * 0.32;
  let start = -Math.PI / 2;

  const colors = generatePalette(baseColor, data.length);

  data.forEach((d, i) => {
    const slice = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 레이블
    const midAngle = start + slice / 2;
    const lx = cx + Math.cos(midAngle) * (radius * 0.65);
    const ly = cy + Math.sin(midAngle) * (radius * 0.65);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${((d.value / total) * 100).toFixed(1)}%`, lx, ly + 4);
    start += slice;
  });

  // 범례
  ctx.textAlign = 'left';
  ctx.font = '11px sans-serif';
  data.forEach((d, i) => {
    const ly = 70 + i * 16;
    if (ly > height - 20) return;
    ctx.fillStyle = colors[i];
    ctx.fillRect(20, ly, 12, 12);
    ctx.fillStyle = '#111';
    ctx.fillText(`${d.label} (${d.value})`, 38, ly + 10);
  });
}

function generatePalette(base: string, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const hue = (i * 360) / Math.max(n, 5);
    out.push(`hsl(${hue}, 65%, 55%)`);
  }
  // 첫 색을 baseColor 로 교체
  out[0] = base;
  return out;
}

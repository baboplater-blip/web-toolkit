'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Stamp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';

type Shape = 'circle' | 'square';

const SIZE = 600; // 캔버스 픽셀 (고해상도, 표시 시 축소)

/** 직인/도장을 캔버스에 그린다. 배경 투명, 글자는 한글 세로/격자 배치. */
function drawSeal(
  ctx: CanvasRenderingContext2D,
  text: string,
  shape: Shape,
  color: string,
) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  const chars = [...text.trim()].slice(0, 4);
  if (chars.length === 0) return;

  const pad = 40;
  const lineW = 26;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineW;

  // 테두리
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - pad, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const r = 28;
    const x = pad,
      y = pad,
      w = SIZE - pad * 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + w, r);
    ctx.arcTo(x + w, y + w, x, y + w, r);
    ctx.arcTo(x, y + w, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.stroke();
  }

  // 글자 — 1~2자: 1행, 3~4자: 2×2 격자 (한자/한글 도장 관습)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const font = (size: number) =>
    `bold ${size}px "Noto Sans KR", "Malgun Gothic", system-ui, serif`;

  const inner = SIZE - pad * 2 - lineW * 2;
  if (chars.length <= 2) {
    ctx.font = font(chars.length === 1 ? inner * 0.62 : inner * 0.46);
    const gap = chars.length === 1 ? 0 : inner * 0.24;
    chars.forEach((c, i) => {
      const y = SIZE / 2 + (i - (chars.length - 1) / 2) * gap;
      ctx.fillText(c, SIZE / 2, y);
    });
  } else {
    // 2×2: 읽는 순서(전통 도장은 우→좌, 상→하)지만 가독성 위해 좌→우 상→하
    ctx.font = font(inner * 0.34);
    const positions = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    const off = inner * 0.24;
    chars.forEach((c, i) => {
      const [dx, dy] = positions[i];
      ctx.fillText(c, SIZE / 2 + dx * off, SIZE / 2 + dy * off);
    });
  }
}

export default function SealPage() {
  const [text, setText] = useState('주식회사');
  const [shape, setShape] = useState<Shape>('circle');
  const [color, setColor] = useState('#c0392b');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    drawSeal(ctx, text, shape, color);
  }, [text, shape, color]);

  function download() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `${text.trim() || 'seal'}-도장.png`;
    a.click();
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-3 max-w-3xl mx-auto">
          <a
            href="/tools"
            className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
            title="도구로"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <Stamp className="h-5 w-5" />
          <h1 className="font-semibold text-base">직인·도장 생성기</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1" htmlFor="seal-text">
              텍스트 (1~4자 — 회사명·이름·직인)
            </label>
            <Input
              id="seal-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={8}
              placeholder="예: 홍길동 / 주식회사 / 대표이사"
              aria-label="도장 텍스트"
            />
            <p className="text-[10px] text-muted-foreground mt-1">최대 4자까지 표시됩니다.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-medium block mb-1">모양</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['circle', 'square'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShape(s)}
                    aria-pressed={shape === s}
                    className={`h-9 text-xs rounded-md border ${
                      shape === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {s === 'circle' ? '원형' : '사각'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" htmlFor="seal-color">색상</label>
              <input
                id="seal-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-full rounded-md border bg-background"
                aria-label="도장 색상"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 flex flex-col items-center gap-3">
          <div
            className="rounded-lg p-4"
            style={{
              backgroundImage:
                'repeating-conic-gradient(#0000000d 0% 25%, transparent 0% 50%)',
              backgroundSize: '20px 20px',
            }}
          >
            <canvas
              ref={canvasRef}
              width={SIZE}
              height={SIZE}
              className="h-56 w-56 sm:h-64 sm:w-64"
              aria-label="도장 미리보기"
            />
          </div>
          <button
            type="button"
            onClick={download}
            className={buttonVariants({ className: 'gap-1.5' })}
          >
            <Download className="h-4 w-4" />
            투명 PNG 저장
          </button>
        </div>

        <div className="rounded-xl border bg-card/50 p-4 text-xs text-muted-foreground">
          <p>
            결재·계약서 서명란에 삽입할 수 있는 투명배경 도장 이미지를 만듭니다. 1~2자는
            한 줄, 3~4자는 2×2 격자로 배치됩니다. 모든 처리는 브라우저 안에서 이뤄지며
            입력값은 어디로도 전송되지 않습니다. (법적 효력이 필요한 인감은 관할 기관에
            등록된 실물 인감을 사용하세요.)
          </p>
        </div>
      </main>
    </div>
  );
}

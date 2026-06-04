/**
 * 얼굴/영역 가림(cover) 렌더링 공용 유틸.
 *
 * 한 함수로 이미지·동영상 프레임 양쪽에서 동일한 가림 효과를 그린다.
 * 좌표는 항상 "원본 이미지 좌표계"(box)로 받고, 출력 캔버스가 축소/확대된
 * 경우 drawW/drawH 로 스케일을 맞춘다 → 미리보기(축소)와 최종(원본)이 동일.
 */

export type CoverStyle = 'blur' | 'pixelate' | 'bar' | 'solid' | 'emoji';
export type CoverShape = 'rect' | 'ellipse';

export interface CoverBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CoverOptions {
  style: CoverStyle;
  shape: CoverShape;
  /** 블러 강도(px) 또는 모자이크 기준 크기 */
  strength: number;
  /** 박스 크기에 비례해 강도 자동 조절 */
  autoScale: boolean;
  /** style==='emoji' 일 때 사용할 이모지 */
  emoji: string;
  /** style==='solid' 일 때 채울 색 */
  solidColor: string;
}

/** 박스 폭 기준 유효 강도. autoScale 시 폭에 비례(기준 160px)하고 6~120 으로 클램프. */
function effStrength(boxW: number, base: number, autoScale: boolean): number {
  if (!autoScale) return base;
  return Math.max(6, Math.min(120, base * (boxW / 160)));
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * ctx 에 box 한 개의 가림 효과를 그린다.
 *
 * @param img     원본 이미지/캔버스 (전체 프레임)
 * @param imgW/H  원본 픽셀 크기 (box 좌표 기준)
 * @param drawW/H ctx 에 그려진 전체 프레임 크기 (스케일 = drawW/imgW)
 */
export function paintCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  imgW: number,
  imgH: number,
  drawW: number,
  drawH: number,
  box: CoverBox,
  opts: CoverOptions,
): void {
  if (box.w < 1 || box.h < 1) return;
  const sc = drawW / imgW;
  const x = box.x * sc;
  const y = box.y * sc;
  const w = box.w * sc;
  const h = box.h * sc;
  const strength = effStrength(box.w, opts.strength, opts.autoScale);

  const clipShape = () => {
    ctx.beginPath();
    if (opts.shape === 'ellipse') {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.clip();
  };

  if (opts.style === 'blur') {
    ctx.save();
    clipShape();
    ctx.filter = `blur(${Math.max(1, strength * sc)}px)`;
    ctx.drawImage(img, 0, 0, drawW, drawH);
    ctx.filter = 'none';
    ctx.restore();
  } else if (opts.style === 'pixelate') {
    const block = Math.max(3, Math.round((strength * sc) / 1.5));
    const sw = Math.max(1, Math.floor(w / block));
    const sh = Math.max(1, Math.floor(h / block));
    const tmp = document.createElement('canvas');
    tmp.width = sw;
    tmp.height = sh;
    const tctx = tmp.getContext('2d');
    if (!tctx) return;
    tctx.imageSmoothingEnabled = false;
    // 원본 좌표계에서 box 영역을 축소 샘플링
    tctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, sw, sh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, sw, sh, x, y, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.restore();
  } else if (opts.style === 'bar') {
    ctx.save();
    ctx.fillStyle = '#000000';
    roundRectPath(ctx, x, y, w, h, Math.min(w, h) * 0.12);
    ctx.fill();
    ctx.restore();
  } else if (opts.style === 'solid') {
    ctx.save();
    ctx.fillStyle = opts.solidColor;
    ctx.beginPath();
    if (opts.shape === 'ellipse') {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.fill();
    ctx.restore();
  } else if (opts.style === 'emoji') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const size = Math.min(w, h) * 1.05;
    ctx.font = `${size}px "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", serif`;
    ctx.fillText(opts.emoji, x + w / 2, y + h / 2);
    ctx.restore();
  }
}

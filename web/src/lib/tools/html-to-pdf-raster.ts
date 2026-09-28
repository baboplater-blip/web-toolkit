/**
 * DOM 요소 → A4 PDF (래스터).
 *
 * jsPDF `.html()` 은 (1) 전달한 요소의 인라인 style 을 그대로 복제하므로 화면 밖으로 숨기려고 준
 * `left:-9999px` 가 PDF 안에서도 적용돼 빈 페이지가 나오고, (2) context2d 가 기본 Helvetica 로
 * 글자를 그려 한글이 깨진다. 여기서는 html2canvas-pro 로 페이지 단위 이미지를 만들어 넣는다.
 * 브라우저 글꼴로 그리므로 한글이 그대로 보이며, 문단·이미지 중간에서 잘리지 않게 블록 경계에서
 * 페이지를 나눈다. (대신 PDF 안 텍스트는 선택·검색되지 않는다)
 *
 * 사용: 호출자는 폭을 지정한 요소(예: width 595px)를 만들어 넘긴다. DOM 에 붙어 있지 않아도 된다 —
 * 이 함수가 화면 밖 홀더에 붙였다가 끝나면 떼어낸다.
 */

const A4_W_PT = 595.28;
const A4_H_PT = 841.89;
const MARGIN_Y_PT = 28;
const DOC_CLASS = '__raster-pdf-doc';

export interface RasterPdfOptions {
  /** 렌더 배율(선명도). 기본 2 */
  scale?: number;
  /** 페이지 렌더 진행률 콜백 */
  onProgress?: (done: number, total: number) => void;
  /** true 가 되면 다음 페이지 전에 중단(에러 throw) */
  signal?: { aborted: boolean };
}

/** 이미지 로딩을 기다린다(깨진 이미지는 무시). */
async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
            setTimeout(res, 8000);
          }),
    ),
  );
}

/** 블록 경계를 고려한 페이지 분할 위치(요소 기준 CSS px) 계산 */
function computeBreaks(el: HTMLElement, pageH: number): number[] {
  const base = el.getBoundingClientRect().top;
  const total = Math.max(el.scrollHeight, el.offsetHeight);
  const blocks: Array<[number, number]> = [];
  const forced: number[] = [];
  el.querySelectorAll<HTMLElement>(
    'p,h1,h2,h3,h4,h5,h6,li,img,tr,pre,blockquote,figure,svg,dt,dd,hr,[data-pdf-break]',
  ).forEach((node) => {
    const r = node.getBoundingClientRect();
    if (node.hasAttribute('data-pdf-break')) {
      forced.push(r.top - base);
      return;
    }
    if (r.height > 0) blocks.push([r.top - base, r.bottom - base]);
  });
  forced.sort((a, b) => a - b);

  const breaks = [0];
  let y = 0;
  while (y + 1 < total) {
    // 강제 페이지 나눔(챕터 경계)이 이번 페이지 안에 있으면 거기서 자른다.
    const f = forced.find((v) => v > y + 4 && v < y + pageH);
    let cut = f ?? Math.min(y + pageH, total);
    if (f === undefined && cut < total) {
      // 경계에 걸친 (한 페이지보다 작은) 블록이 있으면 그 블록 시작점으로 당긴다.
      for (let guard = 0; guard < 20; guard++) {
        let moved = false;
        for (const [top, bottom] of blocks) {
          if (top < cut - 0.5 && bottom > cut + 0.5 && bottom - top < pageH * 0.9 && top > y + pageH * 0.3) {
            cut = top;
            moved = true;
          }
        }
        if (!moved) break;
      }
    }
    if (cut <= y) cut = Math.min(y + pageH, total);
    breaks.push(cut);
    y = cut;
  }
  return breaks;
}

export async function renderElementToPdf(el: HTMLElement, opts: RasterPdfOptions = {}): Promise<Blob> {
  const scale = opts.scale ?? 2;
  const [{ jsPDF }, h2c] = await Promise.all([import('jspdf'), import('html2canvas-pro')]);
  const html2canvas = h2c.default;

  // 화면 밖 홀더 > 페이지 뷰포트(overflow hidden) > 콘텐츠(el, margin-top 으로 스크롤)
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none;';
  // 사이트 전역 CSS 리셋(Tailwind preflight)이 제목·목록·표 서식을 지우므로 문서 기본 서식을 되살린다.
  const style = document.createElement('style');
  style.textContent = `.${DOC_CLASS} h1{font-size:1.8em;font-weight:700;margin:.8em 0 .4em}
.${DOC_CLASS} h2{font-size:1.5em;font-weight:700;margin:.8em 0 .4em}
.${DOC_CLASS} h3{font-size:1.25em;font-weight:700;margin:.7em 0 .3em}
.${DOC_CLASS} h4,.${DOC_CLASS} h5,.${DOC_CLASS} h6{font-weight:700;margin:.6em 0 .3em}
.${DOC_CLASS} p{margin:.5em 0}
.${DOC_CLASS} ul{list-style:disc;padding-left:1.6em;margin:.5em 0}
.${DOC_CLASS} ol{list-style:decimal;padding-left:1.6em;margin:.5em 0}
.${DOC_CLASS} blockquote{border-left:3px solid #ccc;padding-left:1em;color:#555;margin:.6em 0}
.${DOC_CLASS} table{border-collapse:collapse;margin:.6em 0}
.${DOC_CLASS} td,.${DOC_CLASS} th{border:1px solid #bbb;padding:2px 6px}
.${DOC_CLASS} img,.${DOC_CLASS} svg{max-width:100%;height:auto}
.${DOC_CLASS} a{color:#1a56db;text-decoration:underline}
.${DOC_CLASS} pre{white-space:pre-wrap;background:#f4f4f4;padding:.6em}
.${DOC_CLASS} strong,.${DOC_CLASS} b{font-weight:700}
.${DOC_CLASS} em,.${DOC_CLASS} i{font-style:italic}`;
  holder.appendChild(style);
  el.classList.add(DOC_CLASS);
  const viewport = document.createElement('div');
  viewport.style.cssText = 'overflow:hidden;background:#fff;';
  const prevMarginTop = el.style.marginTop;
  const prevParent = el.parentNode;
  const prevNext = el.nextSibling;
  viewport.appendChild(el);
  holder.appendChild(viewport);
  document.body.appendChild(holder);

  try {
    await waitForImages(el);
    if (document.fonts?.ready) await document.fonts.ready;

    const widthPx = el.offsetWidth || 595;
    viewport.style.width = `${widthPx}px`;
    const pxPerPt = widthPx / A4_W_PT;
    const pageH = (A4_H_PT - MARGIN_Y_PT * 2) * pxPerPt; // 한 페이지 콘텐츠 높이(CSS px)
    const breaks = computeBreaks(el, pageH);
    const pages = breaks.length - 1;

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    for (let i = 0; i < pages; i++) {
      if (opts.signal?.aborted) throw new Error('작업이 취소되었습니다.');
      const top = breaks[i];
      const h = Math.max(1, Math.ceil(breaks[i + 1] - top));
      viewport.style.height = `${h}px`;
      el.style.marginTop = `${-top}px`;
      const canvas = await html2canvas(viewport, {
        scale,
        backgroundColor: '#ffffff',
        useCORS: false,
        logging: false,
        width: widthPx,
        height: h,
      });
      if (i > 0) pdf.addPage();
      const img = canvas.toDataURL('image/jpeg', 0.9);
      pdf.addImage(img, 'JPEG', 0, MARGIN_Y_PT, A4_W_PT, h / pxPerPt, undefined, 'FAST');
      canvas.width = 0;
      canvas.height = 0;
      opts.onProgress?.(i + 1, pages);
    }
    return pdf.output('blob');
  } finally {
    el.style.marginTop = prevMarginTop;
    el.classList.remove(DOC_CLASS);
    if (prevParent) prevParent.insertBefore(el, prevNext);
    else el.remove();
    holder.remove();
  }
}

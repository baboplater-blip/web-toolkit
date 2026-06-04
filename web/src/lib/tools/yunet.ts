/**
 * YuNet (ONNX) 얼굴 검출 — onnxruntime-web 기반.
 *
 * MediaPipe BlazeFace(정면 위주) 보조용. YuNet 은 측면·각도 변화·작은 얼굴에
 * 더 강하고 모델이 ~227KB 로 가볍다. 결과는 BlazeFace 와 NMS 로 병합한다.
 *
 * 모델: public/models/yunet.onnx (OpenCV Zoo face_detection_yunet 2023mar)
 * 출력: cls_{s}/obj_{s}/bbox_{s}/kps_{s} (s=8,16,32). kps 는 사용 안 함.
 * 입력: [1,3,H,W] float32, BGR, 0~255 원시값 (OpenCV 관례).
 *
 * onnxruntime-web 은 동적 import 로 초기 번들에서 분리한다. wasm 은 CDN(jsdelivr)
 * 에서 로드 — CSP script-src/connect-src 에 jsdelivr 허용됨. 단일 스레드(SAB 미사용).
 */

const ORT_VERSION = '1.21.0';
const MODEL_URL = '/models/yunet.onnx';
const STRIDES = [8, 16, 32] as const;
const MAX_SIDE = 768; // 입력 긴 변 (작은 얼굴 회수율 ↔ 속도 균형)

export interface YuBox {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
}

interface OrtSessionLike {
  run: (feeds: Record<string, unknown>) => Promise<Record<string, { data: ArrayLike<number> }>>;
}
interface OrtTensor {
  data: ArrayLike<number>;
}
interface OrtModule {
  env: { wasm: { numThreads: number; wasmPaths: string } };
  Tensor: new (type: string, data: Float32Array, dims: number[]) => OrtTensor;
  InferenceSession: { create: (path: string, opts: unknown) => Promise<OrtSessionLike> };
}

let ortPromise: Promise<OrtModule> | null = null;
let sessionPromise: Promise<OrtSessionLike> | null = null;

async function getOrt(): Promise<OrtModule> {
  if (!ortPromise) {
    ortPromise = import('onnxruntime-web').then((mod) => {
      const ort = mod as unknown as OrtModule;
      ort.env.wasm.numThreads = 1; // COEP 미설정 환경 — SharedArrayBuffer 회피
      ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
      return ort;
    });
  }
  return ortPromise;
}

async function getSession(): Promise<OrtSessionLike> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await getOrt();
      return (await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      })) as unknown as OrtSessionLike;
    })();
  }
  return sessionPromise;
}

/** 모델·런타임을 미리 로드 (상태 표시용). */
export async function warmUpYuNet(): Promise<void> {
  await getSession();
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * 이미지/캔버스에서 얼굴을 검출해 원본 좌표계 박스를 반환.
 * @param scoreThresh 신뢰도 임계 (기본 0.6 — 보조 검출이라 보수적)
 */
export async function detectYuNet(
  img: CanvasImageSource,
  imgW: number,
  imgH: number,
  scoreThresh = 0.6,
): Promise<YuBox[]> {
  const ort = await getOrt();
  const session = await getSession();

  const scale = Math.min(1, MAX_SIDE / Math.max(imgW, imgH));
  const inW = Math.max(32, Math.round((imgW * scale) / 32) * 32);
  const inH = Math.max(32, Math.round((imgH * scale) / 32) * 32);

  const canvas = document.createElement('canvas');
  canvas.width = inW;
  canvas.height = inH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, inW, inH);
  const { data } = ctx.getImageData(0, 0, inW, inH); // RGBA

  // NCHW, BGR, 원시 0~255
  const area = inW * inH;
  const chw = new Float32Array(3 * area);
  for (let i = 0; i < area; i++) {
    chw[i] = data[i * 4 + 2]; // B
    chw[area + i] = data[i * 4 + 1]; // G
    chw[2 * area + i] = data[i * 4]; // R
  }

  const tensor = new ort.Tensor('float32', chw, [1, 3, inH, inW]);
  const out = await session.run({ input: tensor });

  const sx = imgW / inW;
  const sy = imgH / inH;
  const boxes: YuBox[] = [];

  for (const s of STRIDES) {
    const cls = out[`cls_${s}`]?.data;
    const obj = out[`obj_${s}`]?.data;
    const bbox = out[`bbox_${s}`]?.data;
    if (!cls || !obj || !bbox) continue;
    const cols = inW / s;
    const rows = inH / s;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const score = Math.sqrt(clamp01(cls[idx] as number) * clamp01(obj[idx] as number));
        if (score < scoreThresh) continue;
        const b0 = bbox[idx * 4] as number;
        const b1 = bbox[idx * 4 + 1] as number;
        const b2 = bbox[idx * 4 + 2] as number;
        const b3 = bbox[idx * 4 + 3] as number;
        const cx = (c + b0) * s;
        const cy = (r + b1) * s;
        const w = Math.exp(b2) * s;
        const h = Math.exp(b3) * s;
        boxes.push({
          x: (cx - w / 2) * sx,
          y: (cy - h / 2) * sy,
          w: w * sx,
          h: h * sy,
          score,
        });
      }
    }
  }
  return boxes;
}

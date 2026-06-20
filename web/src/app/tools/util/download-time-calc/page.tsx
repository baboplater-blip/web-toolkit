'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type SizeUnit = 'KB' | 'MB' | 'GB' | 'TB';
type SpeedUnit = 'Mbps' | 'MBps' | 'Gbps' | 'KBps';

// 모든 크기를 바이트로 환산하는 계수 (이진 접두어 1024 기준)
const SIZE_BYTES: Record<SizeUnit, number> = {
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
};

// 속도를 초당 바이트(Bps)로 환산하는 계수
// 비트 단위(bps)는 ÷8, 바이트 단위는 그대로. 10진 1000 기준(회선 표기 관례).
const SPEED_BYTES_PER_SEC: Record<SpeedUnit, number> = {
  Mbps: 1_000_000 / 8,
  Gbps: 1_000_000_000 / 8,
  KBps: 1024,
  MBps: 1024 ** 2,
};

const SIZE_UNITS: SizeUnit[] = ['KB', 'MB', 'GB', 'TB'];
const SPEED_UNITS: SpeedUnit[] = ['Mbps', 'MBps', 'Gbps', 'KBps'];

function parseNum(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return '—';
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface DownloadResult {
  seconds: number;
  formatted: string;
}

export default function DownloadTimeCalcPage() {
  const [size, setSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>('GB');
  const [speed, setSpeed] = useState('');
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('Mbps');
  const [overhead, setOverhead] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const result = useMemo<DownloadResult | null>(() => {
    const sizeValue = parseNum(size);
    const speedValue = parseNum(speed);
    if (sizeValue === null || speedValue === null) return null;
    if (sizeValue <= 0 || speedValue <= 0) return null;

    const overheadPercent = overhead.trim() === '' ? 0 : parseNum(overhead);
    if (overheadPercent === null || overheadPercent < 0) return null;

    const totalBytes = sizeValue * SIZE_BYTES[sizeUnit];
    const bytesPerSec = speedValue * SPEED_BYTES_PER_SEC[speedUnit];
    if (bytesPerSec <= 0) return null;

    // 오버헤드: 유효 처리량 감소로 모델링. 100% 이상이면 처리량 0 → 무한대 방지.
    const efficiency = 1 - overheadPercent / 100;
    if (efficiency <= 0) return null;

    const seconds = totalBytes / (bytesPerSec * efficiency);
    if (!Number.isFinite(seconds)) return null;

    return { seconds, formatted: formatDuration(seconds) };
  }, [size, sizeUnit, speed, speedUnit, overhead]);

  const invalid =
    (size !== '' && parseNum(size) === null) ||
    (speed !== '' && parseNum(speed) === null) ||
    (overhead !== '' && parseNum(overhead) === null);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 1500);
    }
  }

  function handleReset() {
    setSize('');
    setSizeUnit('GB');
    setSpeed('');
    setSpeedUnit('Mbps');
    setOverhead('');
  }

  const dirty = size !== '' || speed !== '' || overhead !== '';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader
        title="다운로드 시간 계산기"
        widthClass="max-w-xl"
        onReset={dirty ? handleReset : undefined}
      />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          파일 크기와 회선 속도로 예상 전송 소요 시간을 계산합니다. (크기 1024 기준, 회선 1000 기준)
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">파일 크기</span>
            <div className="flex gap-2">
              <Input
                inputMode="decimal"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="예: 4.7"
                aria-label="파일 크기"
              />
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="크기 단위">
                {SIZE_UNITS.map((unit) => (
                  <Button
                    key={unit}
                    type="button"
                    variant={sizeUnit === unit ? 'default' : 'outline'}
                    size="sm"
                    aria-pressed={sizeUnit === unit}
                    onClick={() => setSizeUnit(unit)}
                  >
                    {unit}
                  </Button>
                ))}
              </div>
            </div>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">회선 속도</span>
            <div className="flex gap-2">
              <Input
                inputMode="decimal"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                placeholder="예: 100"
                aria-label="회선 속도"
              />
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="속도 단위">
                {SPEED_UNITS.map((unit) => (
                  <Button
                    key={unit}
                    type="button"
                    variant={speedUnit === unit ? 'default' : 'outline'}
                    size="sm"
                    aria-pressed={speedUnit === unit}
                    onClick={() => setSpeedUnit(unit)}
                  >
                    {unit}
                  </Button>
                ))}
              </div>
            </div>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">오버헤드 (%, 선택)</span>
            <Input
              inputMode="decimal"
              value={overhead}
              onChange={(e) => setOverhead(e.target.value)}
              placeholder="예: 10 (프로토콜·손실 등 여유분)"
              aria-label="오버헤드"
            />
          </label>
        </div>

        {invalid && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            숫자만 입력해 주세요. (쉼표는 허용됩니다)
          </p>
        )}

        {result && (
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">예상 소요 시간 (시:분:초)</p>
              <p className="text-3xl font-bold tabular-nums">{result.formatted}</p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                총 {Math.round(result.seconds).toLocaleString('ko-KR')}초
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              <span className="ml-1">{copied ? '복사됨' : copyError ? '복사 실패' : '복사'}</span>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 텍스트 → 모스부호 매핑 (문자, 숫자, 일부 기호)
const TEXT_TO_MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
  H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
  O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
  V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
};

const MORSE_TO_TEXT: Record<string, string> = Object.entries(TEXT_TO_MORSE).reduce<
  Record<string, string>
>((acc, [char, morse]) => {
  acc[morse] = char;
  return acc;
}, {});

const MORSE_CHARS = new Set(['.', '-', '/', ' ', '\n']);

/** 입력이 이미 모스부호(점·선·구분자만)인지 감지한다. */
function isMorseInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  for (const ch of trimmed) {
    if (!MORSE_CHARS.has(ch)) return false;
  }
  return trimmed.includes('.') || trimmed.includes('-');
}

/** 텍스트를 모스부호로 변환한다. 알 수 없는 문자는 건너뛴다. */
function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split('\n')
    .map((line) =>
      line
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word) =>
          Array.from(word)
            .map((char) => TEXT_TO_MORSE[char] ?? '')
            .filter((code) => code.length > 0)
            .join(' '),
        )
        .filter((word) => word.length > 0)
        .join(' / '),
    )
    .join('\n');
}

/** 모스부호를 텍스트로 변환한다. ' / ' 또는 다중 공백을 단어 경계로 본다. */
function morseToText(morse: string): string {
  return morse
    .split('\n')
    .map((line) =>
      line
        .trim()
        .split(/\s*\/\s*|\s{2,}/)
        .filter((word) => word.length > 0)
        .map((word) =>
          word
            .trim()
            .split(/\s+/)
            .filter((code) => code.length > 0)
            .map((code) => MORSE_TO_TEXT[code] ?? '')
            .join(''),
        )
        .join(' '),
    )
    .join('\n');
}

export default function MorseCodePage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const playTimerRef = useRef<number | null>(null);

  const isMorse = useMemo(() => isMorseInput(input), [input]);

  const output = useMemo(() => {
    if (!input) return '';
    return isMorse ? morseToText(input) : textToMorse(input);
  }, [input, isMorse]);

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'morse-code.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /** 모스부호 문자열을 oscillator 비프음으로 재생한다. */
  function playMorse() {
    // 재생 대상 모스부호 (텍스트 입력이면 변환 결과가 모스부호)
    const morse = isMorse ? input : output;
    if (!morse.trim()) return;

    setError(null);
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) {
      setError('이 브라우저는 오디오 재생을 지원하지 않습니다.');
      return;
    }

    if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }

    try {
      let context = audioRef.current;
      if (!context || context.state === 'closed') {
        context = new AudioCtor();
        audioRef.current = context;
      }
      void context.resume();

      const unit = 0.08; // 점 1단위 길이(초)
      const frequency = 600;
      const startAt = context.currentTime + 0.05;
      let cursor = startAt;

      for (const symbol of morse) {
        if (symbol === '.') {
          scheduleBeep(context, frequency, cursor, unit);
          cursor += unit + unit; // 신호 + 신호 내 간격
        } else if (symbol === '-') {
          scheduleBeep(context, frequency, cursor, unit * 3);
          cursor += unit * 3 + unit;
        } else if (symbol === ' ') {
          cursor += unit * 2; // 글자 간격(이미 1단위 소비됨 → 총 3단위)
        } else if (symbol === '/' || symbol === '\n') {
          cursor += unit * 6; // 단어 간격(총 7단위)
        }
      }

      // 재생이 끝난 후의 정리는 GC 가 처리하므로 별도 stop 불필요
    } catch (err) {
      setError('오디오 재생 중 오류가 발생했습니다.');
      // 개발 진단용
      console.error(err);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="모스부호 번역" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          텍스트와 모스부호를 서로 변환하고 소리로 재생합니다. 입력 형태를 자동으로 감지합니다.
        </p>

      </header>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        현재 입력: {input ? (isMorse ? '모스부호 → 텍스트' : '텍스트 → 모스부호') : '대기 중'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 텍스트 또는 모스부호(.- 와 /)를 입력하세요"
          aria-label="입력"
        />
        <textarea
          className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={output}
          readOnly
          placeholder="결과"
          aria-label="결과"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={copy} disabled={!output}>
          복사
        </Button>
        <Button variant="outline" onClick={download} disabled={!output}>
          다운로드
        </Button>
        <Button variant="outline" onClick={playMorse} disabled={!input}>
          <Play className="mr-1 h-4 w-4" aria-hidden />
          소리 재생
        </Button>
      </div>
    </main>
    </div>
  );
}

/** 지정한 시각에 일정 길이의 비프음을 예약 재생한다. */
function scheduleBeep(
  context: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  // 클릭음 방지를 위한 짧은 페이드 인/아웃
  const fade = 0.005;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.3, startTime + fade);
  gain.gain.setValueAtTime(0.3, startTime + duration - fade);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

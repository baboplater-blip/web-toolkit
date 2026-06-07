'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TtsPage() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  // 컴포넌트 언마운트 시 진행 중인 발화를 중지하기 위한 ref
  const speakingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }

    const synth = window.speechSynthesis;

    // getVoices 는 비동기로 채워지므로 voiceschanged 이벤트도 함께 구독한다.
    const loadVoices = () => {
      const available = synth.getVoices();
      if (available.length > 0) {
        setVoices(available);
        setVoiceUri((current) => {
          if (current) return current;
          // 기본값: 한국어 음성 우선, 없으면 첫 번째
          const korean = available.find((voice) => voice.lang.toLowerCase().startsWith('ko'));
          return (korean ?? available[0]).voiceURI;
        });
      }
    };

    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
      // 화면을 떠날 때 재생 중이던 음성을 정리한다.
      if (speakingRef.current) {
        synth.cancel();
      }
    };
  }, []);

  function speak() {
    if (!supported || !text.trim()) return;

    const synth = window.speechSynthesis;
    // 이전 발화가 남아 있으면 먼저 중지한다.
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const selected = voices.find((voice) => voice.voiceURI === voiceUri);
    if (selected) {
      utterance.voice = selected;
      utterance.lang = selected.lang;
    }
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => {
      speakingRef.current = false;
      setSpeaking(false);
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      setSpeaking(false);
    };

    speakingRef.current = true;
    setSpeaking(true);
    synth.speak(utterance);
  }

  function stop() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    setSpeaking(false);
  }

  if (!supported) {
    return (
      <main className="mx-auto max-w-xl space-y-4 p-4">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Volume2 className="h-5 w-5 text-primary" aria-hidden />
            텍스트 음성 변환(TTS)
          </h1>
        </header>
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          이 브라우저는 음성 합성(Web Speech API)을 지원하지 않습니다. 최신 Chrome, Edge, Safari를
          이용해 주세요.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Volume2 className="h-5 w-5 text-primary" aria-hidden />
          텍스트 음성 변환(TTS)
        </h1>
        <p className="text-sm text-muted-foreground">
          브라우저 음성 합성으로 텍스트를 읽어줍니다. 음성·속도·피치를 조절하세요.
        </p>
      </header>

      <textarea
        className="min-h-32 w-full rounded-xl border bg-card p-3 text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="읽어줄 텍스트를 입력하세요"
        aria-label="읽을 텍스트"
      />

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">음성</span>
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={voiceUri}
            onChange={(e) => setVoiceUri(e.target.value)}
            aria-label="음성 선택"
          >
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang}){voice.default ? ' — 기본' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="flex items-center justify-between text-sm font-medium">
            <span>속도</span>
            <span className="font-mono text-muted-foreground">{rate.toFixed(1)}</span>
          </span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full"
            aria-label="속도"
          />
        </label>

        <label className="block space-y-1">
          <span className="flex items-center justify-between text-sm font-medium">
            <span>피치</span>
            <span className="font-mono text-muted-foreground">{pitch.toFixed(1)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="w-full"
            aria-label="피치"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <Button onClick={speak} disabled={!text.trim()}>
          <Play className="mr-1 h-4 w-4" aria-hidden />
          {speaking ? '다시 재생' : '재생'}
        </Button>
        <Button variant="outline" onClick={stop} disabled={!speaking}>
          <Square className="mr-1 h-4 w-4" aria-hidden />
          중지
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        오디오 파일 내보내기는 브라우저 환경에서 불안정하여 제공하지 않습니다. 재생만 지원합니다.
      </p>
    </main>
  );
}

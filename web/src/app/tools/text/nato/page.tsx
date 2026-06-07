'use client';

import { useMemo, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

// NATO 음성문자 (ICAO 표준) + 숫자 발음
const NATO_MAP: Record<string, string> = {
  A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot',
  G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima',
  M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo',
  S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey',
  X: 'X-ray', Y: 'Yankee', Z: 'Zulu',
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
  '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine',
};

/**
 * 텍스트를 NATO 음성문자로 변환한다.
 * 알파벳·숫자는 코드워드로, 공백은 단어 구분(개행),
 * 그 외 기호는 원문 그대로 보존한다.
 */
function textToNato(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const words = line.split(/\s+/).filter((word) => word.length > 0);
      return words
        .map((word) =>
          Array.from(word)
            .map((char) => {
              const upper = char.toUpperCase();
              return NATO_MAP[upper] ?? char;
            })
            .join(' '),
        )
        .join('   '); // 단어 사이는 넓은 간격
    })
    .join('\n');
}

export default function NatoPhoneticPage() {
  const [input, setInput] = useState('');

  const output = useMemo(() => {
    if (!input) return '';
    return textToNato(input);
  }, [input]);

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'nato-phonetic.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Megaphone className="h-5 w-5 text-primary" aria-hidden />
          NATO 음성문자 변환
        </h1>
        <p className="text-sm text-muted-foreground">
          텍스트를 Alfa·Bravo·Charlie 같은 NATO 음성문자(숫자 포함)로 변환합니다.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 입력하세요 (영문·숫자)"
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

      <div className="flex gap-2">
        <Button onClick={copy} disabled={!output}>
          복사
        </Button>
        <Button variant="outline" onClick={download} disabled={!output}>
          다운로드
        </Button>
      </div>
    </main>
  );
}

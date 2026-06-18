'use client';

import { useMemo, useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Confidence = 'high' | 'medium' | 'low';

interface HashCandidate {
  /** 알고리즘·해시 종류 이름 */
  name: string;
  /** 추정 확신도 */
  confidence: Confidence;
  /** 식별 근거(길이·문자셋·접두사 등) */
  reason: string;
}

/** 16진수(hex) 문자열 여부. */
function isHex(value: string): boolean {
  return /^[0-9a-fA-F]+$/.test(value);
}

/** Base64 문자열 여부(표준 알파벳, 선택적 패딩). */
function isBase64(value: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

/**
 * 고정 길이 hex 해시 후보 매핑.
 * key = hex 문자 길이, value = 해당 길이를 가지는 알고리즘 목록.
 */
const HEX_LENGTH_MAP: Record<number, string[]> = {
  8: ['CRC-32', 'Adler-32'],
  16: ['CRC-64'],
  32: ['MD5', 'MD4', 'NTLM', 'MD2', 'RIPEMD-128'],
  40: ['SHA-1', 'RIPEMD-160'],
  56: ['SHA-224', 'SHA3-224'],
  64: ['SHA-256', 'SHA3-256', 'BLAKE2s-256', 'RIPEMD-256'],
  96: ['SHA-384', 'SHA3-384'],
  128: ['SHA-512', 'SHA3-512', 'BLAKE2b-512', 'Whirlpool'],
};

/** 길이별 1순위(가장 흔한) 알고리즘 — 이것만 high 로 올린다. */
const PRIMARY_BY_LENGTH: Record<number, string> = {
  8: 'CRC-32',
  32: 'MD5',
  40: 'SHA-1',
  64: 'SHA-256',
  128: 'SHA-512',
};

/** 접두사로 단정적으로 식별 가능한 모듈러 크립트 해시들. */
const PREFIX_SIGNATURES: Array<{ test: (v: string) => boolean; candidate: HashCandidate }> = [
  {
    test: (v) => /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(v),
    candidate: { name: 'bcrypt', confidence: 'high', reason: '$2a$/$2b$/$2y$ 접두사 + 22자 솔트 + 31자 해시' },
  },
  {
    test: (v) => /^\$1\$/.test(v),
    candidate: { name: 'MD5 Crypt (Unix)', confidence: 'high', reason: '$1$ 접두사(Unix md5crypt)' },
  },
  {
    test: (v) => /^\$5\$/.test(v),
    candidate: { name: 'SHA-256 Crypt (Unix)', confidence: 'high', reason: '$5$ 접두사(Unix sha256crypt)' },
  },
  {
    test: (v) => /^\$6\$/.test(v),
    candidate: { name: 'SHA-512 Crypt (Unix)', confidence: 'high', reason: '$6$ 접두사(Unix sha512crypt)' },
  },
  {
    test: (v) => /^\$argon2(id|i|d)\$/.test(v),
    candidate: { name: 'Argon2', confidence: 'high', reason: '$argon2id$/$argon2i$/$argon2d$ 접두사' },
  },
  {
    test: (v) => /^\$scrypt\$/.test(v) || /^\$7\$/.test(v),
    candidate: { name: 'scrypt', confidence: 'high', reason: '$scrypt$/$7$ 접두사' },
  },
  {
    test: (v) => /^\$pbkdf2(-sha\d+)?\$/.test(v),
    candidate: { name: 'PBKDF2', confidence: 'high', reason: '$pbkdf2$ 접두사' },
  },
  {
    test: (v) => /^{SSHA}/.test(v),
    candidate: { name: 'SSHA (LDAP)', confidence: 'high', reason: '{SSHA} 접두사(LDAP salted SHA-1)' },
  },
];

/** hex 길이 기반 후보 목록을 생성한다. */
function candidatesFromHexLength(length: number): HashCandidate[] {
  const names = HEX_LENGTH_MAP[length];
  if (!names) return [];
  const primary = PRIMARY_BY_LENGTH[length];
  return names.map((name) => ({
    name,
    confidence: name === primary ? 'high' : 'medium',
    reason: `${length}자 16진수 길이와 일치`,
  }));
}

/**
 * 해시 문자열을 분석해 가능한 알고리즘 후보를 추정한다.
 * 접두사 시그니처를 우선 확인하고, 없으면 길이·문자셋으로 추정한다.
 */
function identifyHash(raw: string): HashCandidate[] {
  const value = raw.trim();
  if (!value) return [];

  // 1) 접두사 기반 단정 식별(공백 없는 토큰일 때만).
  if (!/\s/.test(value)) {
    for (const sig of PREFIX_SIGNATURES) {
      if (sig.test(value)) return [sig.candidate];
    }
  }

  const candidates: HashCandidate[] = [];
  const hexLike = isHex(value);

  // 2) hex 길이 기반 추정.
  if (hexLike) {
    candidates.push(...candidatesFromHexLength(value.length));

    // NTLM 은 MD5 와 같은 32자 hex 라 위에서 이미 포함됨. 추가 근거 보강 없음.
    if (candidates.length === 0) {
      candidates.push({
        name: '알 수 없는 16진수 해시',
        confidence: 'low',
        reason: `${value.length}자 16진수이나 알려진 표준 길이와 불일치`,
      });
    }
  }

  // 3) Base64 추정(hex 가 아닐 때만 — hex 도 Base64 패턴에 걸리므로).
  if (!hexLike && isBase64(value)) {
    // Base64 디코드 후 바이트 길이로 추정.
    const padding = (value.match(/=+$/)?.[0].length) ?? 0;
    const byteLength = Math.floor((value.length * 3) / 4) - padding;
    const byBytes: Record<number, string> = {
      16: 'MD5 (Base64)',
      20: 'SHA-1 (Base64)',
      28: 'SHA-224 (Base64)',
      32: 'SHA-256 (Base64)',
      48: 'SHA-384 (Base64)',
      64: 'SHA-512 (Base64)',
    };
    if (byBytes[byteLength]) {
      candidates.push({
        name: byBytes[byteLength],
        confidence: 'medium',
        reason: `Base64 디코드 시 ${byteLength}바이트(해시 길이와 일치)`,
      });
    } else {
      candidates.push({
        name: 'Base64 인코딩 데이터',
        confidence: 'low',
        reason: 'Base64 형식이나 표준 해시 길이와 불일치',
      });
    }
  }

  // 4) 아무것도 못 찾음.
  if (candidates.length === 0) {
    candidates.push({
      name: '식별 불가',
      confidence: 'low',
      reason: '알려진 해시 길이·문자셋·접두사와 일치하지 않음',
    });
  }

  return candidates;
}

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

const CONFIDENCE_STYLE: Record<Confidence, string> = {
  high: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  medium: 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  low: 'border-muted-foreground/30 bg-muted text-muted-foreground',
};

export default function HashIdentifierPage() {
  const [input, setInput] = useState('');

  const candidates = useMemo(() => identifyHash(input), [input]);
  const trimmed = input.trim();

  function reset() {
    setInput('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="해시 종류 식별" onReset={reset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          <Fingerprint className="mr-1 inline h-4 w-4 text-primary" aria-hidden />
          해시 문자열의 길이·문자셋·접두사로 가능한 알고리즘을 추정합니다. 결정적 식별이 아닌 후보 추정입니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">해시 문자열</span>
          <input
            className="w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 5f4dcc3b5aa765d61d8327deb882cf99"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="해시 문자열"
          />
        </label>

        {trimmed && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              길이 <span className="font-mono font-medium text-foreground">{trimmed.length}</span>자 · 가능한 후보{' '}
              <span className="font-medium text-foreground">{candidates.length}</span>개
            </p>
            <ul className="space-y-2">
              {candidates.map((candidate, index) => (
                <li
                  key={`${candidate.name}-${index}`}
                  className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <span className="font-medium">{candidate.name}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLE[candidate.confidence]}`}
                  >
                    확신도 {CONFIDENCE_LABEL[candidate.confidence]}
                  </span>
                  <span className="w-full text-xs text-muted-foreground">{candidate.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          여러 알고리즘이 같은 길이를 공유하므로(예: MD5·NTLM·MD4 모두 32자 hex) 길이만으로는 단정할 수 없습니다.
          모든 분석은 브라우저 안에서만 수행되며 입력값은 서버로 전송되지 않습니다.
        </p>
      </main>
    </div>
  );
}

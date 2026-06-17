'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type AngleMode = 'deg' | 'rad';

class CalcError extends Error {}

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' | '^' }
  | { kind: 'lparen' }
  | { kind: 'rparen' }
  | { kind: 'func'; value: string }
  | { kind: 'const'; value: number };

const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'sqrt']);

/** 입력식을 토큰 배열로 변환. 인식 불가 문자 발견 시 CalcError. */
function tokenize(input: string): Token[] {
  // 표시용 기호를 내부 연산자로 정규화.
  const normalized = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'PI')
    .replace(/√/g, 'sqrt');

  const tokens: Token[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];

    if (ch === ' ') {
      i += 1;
      continue;
    }

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let num = '';
      while (i < normalized.length && /[0-9.]/.test(normalized[i])) {
        num += normalized[i];
        i += 1;
      }
      if ((num.match(/\./g)?.length ?? 0) > 1) {
        throw new CalcError('숫자 형식이 올바르지 않습니다.');
      }
      const value = Number(num);
      if (!Number.isFinite(value)) {
        throw new CalcError('숫자 형식이 올바르지 않습니다.');
      }
      tokens.push({ kind: 'num', value });
      continue;
    }

    if (/[a-zA-Z]/.test(ch)) {
      let name = '';
      while (i < normalized.length && /[a-zA-Z]/.test(normalized[i])) {
        name += normalized[i];
        i += 1;
      }
      if (name === 'PI') {
        tokens.push({ kind: 'const', value: Math.PI });
      } else if (name === 'e') {
        tokens.push({ kind: 'const', value: Math.E });
      } else if (FUNCTIONS.has(name)) {
        tokens.push({ kind: 'func', value: name });
      } else {
        throw new CalcError(`알 수 없는 식별자: ${name}`);
      }
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      tokens.push({ kind: 'op', value: ch });
      i += 1;
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' });
      i += 1;
      continue;
    }

    throw new CalcError(`사용할 수 없는 문자: ${ch}`);
  }

  return tokens;
}

/**
 * 재귀하강 파서.
 * 문법: expr = term (('+'|'-') term)*
 *       term = power (('*'|'/') power)*
 *       power = unary ('^' power)?   (우결합)
 *       unary = ('+'|'-') unary | primary
 *       primary = num | const | func '(' expr ')' | '(' expr ')'
 */
function parse(tokens: Token[], angle: AngleMode): number {
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];

  function expect(predicate: (t: Token) => boolean, message: string): Token {
    const t = peek();
    if (!t || !predicate(t)) throw new CalcError(message);
    pos += 1;
    return t;
  }

  function applyFunc(name: string, arg: number): number {
    const radians = angle === 'deg' ? (arg * Math.PI) / 180 : arg;
    switch (name) {
      case 'sin':
        return Math.sin(radians);
      case 'cos':
        return Math.cos(radians);
      case 'tan':
        return Math.tan(radians);
      case 'log':
        if (arg <= 0) throw new CalcError('log 의 입력은 0보다 커야 합니다.');
        return Math.log10(arg);
      case 'ln':
        if (arg <= 0) throw new CalcError('ln 의 입력은 0보다 커야 합니다.');
        return Math.log(arg);
      case 'sqrt':
        if (arg < 0) throw new CalcError('음수의 제곱근은 계산할 수 없습니다.');
        return Math.sqrt(arg);
      default:
        throw new CalcError(`알 수 없는 함수: ${name}`);
    }
  }

  function parsePrimary(): number {
    const t = peek();
    if (!t) throw new CalcError('식이 완성되지 않았습니다.');

    if (t.kind === 'num') {
      pos += 1;
      return t.value;
    }
    if (t.kind === 'const') {
      pos += 1;
      return t.value;
    }
    if (t.kind === 'func') {
      pos += 1;
      expect((x) => x.kind === 'lparen', '함수 뒤에는 ( 가 와야 합니다.');
      const arg = parseExpr();
      expect((x) => x.kind === 'rparen', '괄호가 닫히지 않았습니다.');
      return applyFunc(t.value, arg);
    }
    if (t.kind === 'lparen') {
      pos += 1;
      const value = parseExpr();
      expect((x) => x.kind === 'rparen', '괄호가 닫히지 않았습니다.');
      return value;
    }
    throw new CalcError('예상하지 못한 토큰입니다.');
  }

  function parseUnary(): number {
    const t = peek();
    if (t && t.kind === 'op' && (t.value === '+' || t.value === '-')) {
      pos += 1;
      const operand = parseUnary();
      return t.value === '-' ? -operand : operand;
    }
    return parsePrimary();
  }

  function parsePower(): number {
    const base = parseUnary();
    const t = peek();
    if (t && t.kind === 'op' && t.value === '^') {
      pos += 1;
      const exponent = parsePower();
      return base ** exponent;
    }
    return base;
  }

  function parseTerm(): number {
    let value = parsePower();
    for (;;) {
      const t = peek();
      if (t && t.kind === 'op' && (t.value === '*' || t.value === '/')) {
        pos += 1;
        const rhs = parsePower();
        if (t.value === '/') {
          if (rhs === 0) throw new CalcError('0으로 나눌 수 없습니다.');
          value /= rhs;
        } else {
          value *= rhs;
        }
      } else {
        break;
      }
    }
    return value;
  }

  function parseExpr(): number {
    let value = parseTerm();
    for (;;) {
      const t = peek();
      if (t && t.kind === 'op' && (t.value === '+' || t.value === '-')) {
        pos += 1;
        const rhs = parseTerm();
        value += t.value === '-' ? -rhs : rhs;
      } else {
        break;
      }
    }
    return value;
  }

  const result = parseExpr();
  if (pos !== tokens.length) {
    throw new CalcError('식에 불필요한 부분이 있습니다.');
  }
  if (!Number.isFinite(result)) {
    throw new CalcError('계산 결과가 유효하지 않습니다.');
  }
  return result;
}

function evaluate(input: string, angle: AngleMode): number {
  const tokens = tokenize(input);
  if (tokens.length === 0) throw new CalcError('식을 입력하세요.');
  return parse(tokens, angle);
}

const PAD: Array<{ label: string; insert: string }> = [
  { label: 'sin', insert: 'sin(' },
  { label: 'cos', insert: 'cos(' },
  { label: 'tan', insert: 'tan(' },
  { label: 'log', insert: 'log(' },
  { label: 'ln', insert: 'ln(' },
  { label: '√', insert: 'sqrt(' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: '^', insert: '^' },
  { label: 'π', insert: 'π' },
  { label: 'e', insert: 'e' },
  { label: '÷', insert: '÷' },
  { label: '7', insert: '7' },
  { label: '8', insert: '8' },
  { label: '9', insert: '9' },
  { label: '×', insert: '×' },
  { label: '4', insert: '4' },
  { label: '5', insert: '5' },
  { label: '6', insert: '6' },
  { label: '−', insert: '-' },
  { label: '1', insert: '1' },
  { label: '2', insert: '2' },
  { label: '3', insert: '3' },
  { label: '+', insert: '+' },
  { label: '0', insert: '0' },
  { label: '.', insert: '.' },
];

export default function ScientificCalcPage() {
  const [expr, setExpr] = useState('');
  const [angle, setAngle] = useState<AngleMode>('rad');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function append(text: string): void {
    setExpr((prev) => prev + text);
    setResult(null);
    setError(null);
  }

  function backspace(): void {
    setExpr((prev) => prev.slice(0, -1));
    setResult(null);
    setError(null);
  }

  function toggleSign(): void {
    // 현재 식 전체를 괄호로 묶어 부호 반전.
    setExpr((prev) => (prev.trim() === '' ? '-' : `-(${prev})`));
    setResult(null);
    setError(null);
  }

  function compute(): void {
    try {
      const value = evaluate(expr, angle);
      // 부동소수 잔차 정리 후 표시.
      const rounded = Number.parseFloat(value.toPrecision(12));
      setResult(String(rounded));
      setError(null);
    } catch (err) {
      setResult(null);
      setError(err instanceof CalcError ? err.message : '계산 중 오류가 발생했습니다.');
    }
  }

  async function copyResult(): Promise<void> {
    if (result === null) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function reset(): void {
    setExpr('');
    setAngle('rad');
    setResult(null);
    setError(null);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="공학용 계산기" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <Input
              value={expr}
              onChange={(e) => {
                setExpr(e.target.value);
                setResult(null);
                setError(null);
              }}
              placeholder="예: sin(30) + 2 ^ 3"
              spellCheck={false}
              className="font-mono"
              aria-label="수식 입력"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">각도 단위</span>
            <Button
              type="button"
              size="sm"
              variant={angle === 'deg' ? 'default' : 'outline'}
              onClick={() => setAngle('deg')}
            >
              도(°)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={angle === 'rad' ? 'default' : 'outline'}
              onClick={() => setAngle('rad')}
            >
              라디안
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {PAD.map((key) => (
              <Button
                key={key.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(key.insert)}
              >
                {key.label}
              </Button>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={toggleSign}>
              ±
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={backspace}>
              ⌫
            </Button>
            <Button type="button" size="sm" className="col-span-2" onClick={compute}>
              =
            </Button>
          </div>
        </div>

        {error !== null && <p className="text-sm text-destructive">{error}</p>}

        {result !== null && (
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">결과</p>
              <p className="truncate text-2xl font-bold tabular-nums">{result}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyResult}>
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

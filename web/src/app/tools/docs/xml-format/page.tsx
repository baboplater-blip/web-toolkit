'use client';

import { ToolHeader } from '@/components/tools/ToolHeader';
import { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerDownload } from '@/lib/tools/file-utils';

type Mode = 'beautify' | 'minify';

const INDENT_UNIT = '  ';

interface FormatResult {
  text: string;
  error: string | null;
}

/**
 * DOMParser 로 XML 을 파싱하고 parsererror 발생 시 한국어 메시지를 반환한다.
 * 성공 시 Document, 실패 시 에러 문자열을 돌려준다.
 */
function parseXml(source: string): Document | string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, 'application/xml');
  const parserError = doc.getElementsByTagName('parsererror');
  if (parserError.length > 0) {
    const detail = parserError[0].textContent?.trim();
    return detail && detail.length > 0
      ? `XML 파싱 오류: ${detail}`
      : 'XML 파싱 오류: 올바른 XML 형식이 아닙니다.';
  }
  return doc;
}

/** XML 특수문자 이스케이프 (텍스트 노드용) */
function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 속성 값 이스케이프 (큰따옴표 둘러쌈 기준) */
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 한 요소의 여는 태그 속성 문자열을 직렬화한다. */
function serializeAttributes(element: Element): string {
  const attributes = element.attributes;
  let result = '';
  for (let index = 0; index < attributes.length; index += 1) {
    const attribute = attributes[index];
    result += ` ${attribute.name}="${escapeAttribute(attribute.value)}"`;
  }
  return result;
}

/**
 * 자식 노드 중 의미 있는(공백만 아닌) 노드가 있는지 검사.
 * 미화 시 기존 들여쓰기 공백 텍스트는 버리고 재구성하기 위함.
 */
function hasMeaningfulChildren(node: Node): boolean {
  for (let index = 0; index < node.childNodes.length; index += 1) {
    const child = node.childNodes[index];
    if (child.nodeType === Node.ELEMENT_NODE) return true;
    if (
      child.nodeType === Node.TEXT_NODE &&
      (child.textContent ?? '').trim().length > 0
    ) {
      return true;
    }
    if (
      child.nodeType === Node.CDATA_SECTION_NODE ||
      child.nodeType === Node.COMMENT_NODE
    ) {
      return true;
    }
  }
  return false;
}

/**
 * 요소가 텍스트만(자식 요소 없이) 담고 있는지 검사.
 * 텍스트 전용 요소는 <tag>값</tag> 한 줄로 직렬화한다.
 */
function isTextOnly(element: Element): boolean {
  for (let index = 0; index < element.childNodes.length; index += 1) {
    if (element.childNodes[index].nodeType === Node.ELEMENT_NODE) {
      return false;
    }
  }
  return true;
}

/** 요소의 직접 텍스트 자식을 모아 트림한 문자열을 만든다. */
function collectText(element: Element): string {
  let text = '';
  for (let index = 0; index < element.childNodes.length; index += 1) {
    const child = element.childNodes[index];
    if (
      child.nodeType === Node.TEXT_NODE ||
      child.nodeType === Node.CDATA_SECTION_NODE
    ) {
      text += child.textContent ?? '';
    }
  }
  return text;
}

/** 한 노드를 들여쓰기와 함께 재귀 직렬화한다. */
function serializeNode(node: Node, depth: number, lines: string[]): void {
  const pad = INDENT_UNIT.repeat(depth);

  if (node.nodeType === Node.COMMENT_NODE) {
    lines.push(`${pad}<!--${node.textContent ?? ''}-->`);
    return;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const openTag = `<${element.tagName}${serializeAttributes(element)}`;

    if (!hasMeaningfulChildren(element)) {
      lines.push(`${pad}${openTag} />`);
      return;
    }

    if (isTextOnly(element)) {
      const value = collectText(element).trim();
      lines.push(`${pad}${openTag}>${escapeText(value)}</${element.tagName}>`);
      return;
    }

    lines.push(`${pad}${openTag}>`);
    for (let index = 0; index < element.childNodes.length; index += 1) {
      const child = element.childNodes[index];
      if (
        child.nodeType === Node.TEXT_NODE &&
        (child.textContent ?? '').trim().length === 0
      ) {
        // 들여쓰기용 공백 텍스트는 버리고 재구성
        continue;
      }
      if (child.nodeType === Node.TEXT_NODE) {
        lines.push(
          `${INDENT_UNIT.repeat(depth + 1)}${escapeText((child.textContent ?? '').trim())}`,
        );
        continue;
      }
      if (child.nodeType === Node.CDATA_SECTION_NODE) {
        lines.push(
          `${INDENT_UNIT.repeat(depth + 1)}<![CDATA[${child.textContent ?? ''}]]>`,
        );
        continue;
      }
      serializeNode(child, depth + 1, lines);
    }
    lines.push(`${pad}</${element.tagName}>`);
  }
}

/** 문서를 미화(들여쓰기) 직렬화한다. */
function beautifyDocument(doc: Document): string {
  const lines: string[] = [];
  for (let index = 0; index < doc.childNodes.length; index += 1) {
    const node = doc.childNodes[index];
    if (
      node.nodeType === Node.TEXT_NODE &&
      (node.textContent ?? '').trim().length === 0
    ) {
      continue;
    }
    serializeNode(node, 0, lines);
  }
  return lines.join('\n');
}

/**
 * 압축: 표준 XMLSerializer 로 직렬화한 뒤 태그 사이의 공백·줄바꿈을 제거한다.
 * 텍스트 노드 내부 공백은 보존하기 위해 태그 경계(`>`...`<`)의 공백만 제거.
 */
function minifyDocument(doc: Document): string {
  const serialized = new XMLSerializer().serializeToString(doc);
  return serialized.replace(/>\s+</g, '><').trim();
}

export default function XmlFormatPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('beautify');
  const [copied, setCopied] = useState(false);

  const result = useMemo<FormatResult>(() => {
    if (!input.trim()) {
      return { text: '', error: null };
    }
    const parsed = parseXml(input);
    if (typeof parsed === 'string') {
      return { text: '', error: parsed };
    }
    try {
      const text =
        mode === 'beautify'
          ? beautifyDocument(parsed)
          : minifyDocument(parsed);
      return { text, error: null };
    } catch (err) {
      console.error('XML format failed:', err);
      return {
        text: '',
        error: 'XML 처리 중 오류가 발생했습니다. 입력을 확인해 주세요.',
      };
    }
  }, [input, mode]);

  function copy() {
    if (!result.text) return;
    navigator.clipboard?.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!result.text) return;
    const blob = new Blob([result.text], { type: 'application/xml;charset=utf-8' });
    triggerDownload(blob, mode === 'beautify' ? 'formatted.xml' : 'minified.xml');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="XML 정리·미화" widthClass="max-w-3xl" />
    <main className="mx-auto max-w-3xl space-y-4 p-4">

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          XML 을 들여쓰기로 정리하거나 한 줄로 압축합니다.
        </p>

      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setMode('beautify')}
            className={`h-9 px-4 text-xs rounded-md border ${
              mode === 'beautify'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            미화 (들여쓰기)
          </button>
          <button
            type="button"
            onClick={() => setMode('minify')}
            className={`h-9 px-4 text-xs rounded-md border ${
              mode === 'minify'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            압축 (한 줄)
          </button>
        </div>
      </div>

      {result.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive whitespace-pre-line"
        >
          {result.error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-64 rounded-xl border bg-card p-3 font-mono text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 XML 을 붙여넣으세요"
          aria-label="입력"
          spellCheck={false}
        />
        <textarea
          className="min-h-64 rounded-xl border bg-muted/40 p-3 font-mono text-sm"
          value={result.text}
          readOnly
          placeholder="결과"
          aria-label="결과"
          spellCheck={false}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={copy} disabled={!result.text}>
          {copied ? (
            <>
              <Check className="mr-1 h-4 w-4" /> 복사됨
            </>
          ) : (
            <>
              <Copy className="mr-1 h-4 w-4" /> 복사
            </>
          )}
        </Button>
        <Button variant="outline" onClick={download} disabled={!result.text}>
          <Download className="mr-1 h-4 w-4" /> 다운로드
        </Button>
      </div>
    </main>
    </div>
  );
}

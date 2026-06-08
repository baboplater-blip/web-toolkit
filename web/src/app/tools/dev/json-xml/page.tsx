'use client';

import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';
import { triggerDownload } from '@/lib/tools/file-utils';

type Direction = 'json-to-xml' | 'xml-to-json';

const SAMPLE_JSON = `{
  "book": {
    "title": "Moby Dick",
    "author": "Herman Melville",
    "year": 1851,
    "tags": ["classic", "novel"]
  }
}`;

export default function JsonXmlPage() {
  const [direction, setDirection] = useState<Direction>('json-to-xml');
  const [input, setInput] = useState(SAMPLE_JSON);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pretty, setPretty] = useState(true);
  const [rootName, setRootName] = useState('root');
  const [copied, setCopied] = useState(false);

  function handleConvert() {
    setError(null);
    try {
      if (direction === 'json-to-xml') {
        const obj = JSON.parse(input);
        setOutput(jsonToXml(obj, rootName, pretty));
      } else {
        setOutput(JSON.stringify(xmlToJson(input), null, pretty ? 2 : 0));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '변환 실패');
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function handleReset() {
    setDirection('json-to-xml');
    setInput(SAMPLE_JSON);
    setOutput('');
    setError(null);
    setPretty(true);
    setRootName('root');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="JSON ↔ XML" widthClass="max-w-2xl" onReset={handleReset} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          JSON 과 XML 을 상호 변환합니다.
        </p>

      <div className="rounded-xl border bg-card p-3 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button variant={direction === 'json-to-xml' ? 'default' : 'outline'} size="sm" onClick={() => setDirection('json-to-xml')}>JSON → XML</Button>
          <Button variant={direction === 'xml-to-json' ? 'default' : 'outline'} size="sm" onClick={() => setDirection('xml-to-json')}>XML → JSON</Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" className="h-4 w-4" checked={pretty} onChange={(e) => setPretty(e.target.checked)} />
            예쁘게 정렬
          </label>
          {direction === 'json-to-xml' && (
            <div className="flex items-center gap-2 text-xs">
              <span>루트 태그:</span>
              <input
                value={rootName}
                onChange={(e) => setRootName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '') || 'root')}
                className="flex-1 rounded-md border bg-background px-2 py-0.5 text-xs font-mono" aria-label="예쁘게 정렬" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">입력</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border bg-background p-3 text-xs font-mono min-h-48 resize-y leading-relaxed" aria-label="입력" />
      </div>

      <Button onClick={handleConvert}>변환</Button>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">결과</label>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const isXml = direction === 'json-to-xml';
                  triggerDownload(
                    new Blob([output], {
                      type: isXml
                        ? 'application/xml;charset=utf-8'
                        : 'application/json;charset=utf-8',
                    }),
                    isXml ? 'converted.xml' : 'converted.json',
                  );
                }}
                disabled={!output}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {direction === 'json-to-xml' ? 'XML' : 'JSON'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
          </div>
          <textarea readOnly value={output} className="w-full rounded-md border bg-card p-3 text-xs font-mono min-h-48 resize-y leading-relaxed" aria-label="결과" />
        </div>
      )}
      </main>
    </div>
  );
}

/* ============================================================
 * JSON → XML
 * ============================================================ */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function jsonToXml(obj: unknown, rootName = 'root', pretty = true): string {
  const xml = nodeToXml(obj, rootName, pretty ? 0 : -1);
  return `<?xml version="1.0" encoding="UTF-8"?>${pretty ? '\n' : ''}${xml}`;
}

function nodeToXml(value: unknown, tag: string, indent: number): string {
  const pad = indent >= 0 ? '  '.repeat(indent) : '';
  const nl = indent >= 0 ? '\n' : '';
  const safeTag = tag.replace(/[^a-zA-Z0-9_:.-]/g, '_') || 'item';

  if (value === null || value === undefined) {
    return `${pad}<${safeTag}/>`;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return `${pad}<${safeTag}>${escapeXml(String(value))}</${safeTag}>`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}<${safeTag}/>`;
    return value
      .map((v) => nodeToXml(v, safeTag, indent))
      .join(nl);
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return `${pad}<${safeTag}/>`;
    const inner = entries
      .map(([k, v]) => {
        if (Array.isArray(v)) {
          return v.map((item) => nodeToXml(item, k, indent + 1)).join(nl);
        }
        return nodeToXml(v, k, indent + 1);
      })
      .join(nl);
    return `${pad}<${safeTag}>${nl}${inner}${nl}${pad}</${safeTag}>`;
  }
  return `${pad}<${safeTag}/>`;
}

/* ============================================================
 * XML → JSON (간단한 파서)
 * ============================================================ */

interface XmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: Array<XmlNode | string>;
}

function tokenizeXml(xml: string): Array<{ type: 'open' | 'close' | 'self' | 'text'; raw: string; tag?: string; attrs?: Record<string, string>; text?: string }> {
  const tokens: ReturnType<typeof tokenizeXml> = [];
  let i = 0;
  const stripped = xml.replace(/<\?[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  while (i < stripped.length) {
    if (stripped[i] === '<') {
      const end = stripped.indexOf('>', i);
      if (end < 0) throw new Error('XML: 닫히지 않은 태그');
      const inner = stripped.slice(i + 1, end);
      if (inner.startsWith('/')) {
        tokens.push({ type: 'close', raw: stripped.slice(i, end + 1), tag: inner.slice(1).trim() });
      } else if (inner.endsWith('/')) {
        const parsed = parseTag(inner.slice(0, -1).trim());
        tokens.push({ type: 'self', raw: stripped.slice(i, end + 1), ...parsed });
      } else {
        const parsed = parseTag(inner);
        tokens.push({ type: 'open', raw: stripped.slice(i, end + 1), ...parsed });
      }
      i = end + 1;
    } else {
      const next = stripped.indexOf('<', i);
      const text = stripped.slice(i, next < 0 ? stripped.length : next);
      if (text.trim()) tokens.push({ type: 'text', raw: text, text: decodeEntities(text) });
      if (next < 0) break;
      i = next;
    }
  }
  return tokens;
}

function parseTag(inner: string): { tag: string; attrs: Record<string, string> } {
  const match = inner.match(/^([a-zA-Z_:][a-zA-Z0-9_:.-]*)([\s\S]*)$/);
  if (!match) return { tag: inner.trim(), attrs: {} };
  const tag = match[1];
  const attrs: Record<string, string> = {};
  const attrRe = /([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*=\s*"([^"]*)"|([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*=\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(match[2]))) {
    if (m[1]) attrs[m[1]] = decodeEntities(m[2]);
    else if (m[3]) attrs[m[3]] = decodeEntities(m[4]);
  }
  return { tag, attrs };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function buildXmlTree(tokens: ReturnType<typeof tokenizeXml>): XmlNode {
  const root: XmlNode = { tag: '#root', attrs: {}, children: [] };
  const stack: XmlNode[] = [root];
  for (const t of tokens) {
    const top = stack[stack.length - 1];
    if (t.type === 'open') {
      const node: XmlNode = { tag: t.tag!, attrs: t.attrs ?? {}, children: [] };
      top.children.push(node);
      stack.push(node);
    } else if (t.type === 'self') {
      const node: XmlNode = { tag: t.tag!, attrs: t.attrs ?? {}, children: [] };
      top.children.push(node);
    } else if (t.type === 'close') {
      if (top.tag !== t.tag) throw new Error(`XML: <${top.tag}> 가 </${t.tag}> 로 닫힘`);
      stack.pop();
    } else {
      top.children.push(t.text ?? '');
    }
  }
  return root;
}

function xmlNodeToJson(node: XmlNode): unknown {
  if (node.children.length === 1 && typeof node.children[0] === 'string' && Object.keys(node.attrs).length === 0) {
    const text = node.children[0].trim();
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    if (text === 'true') return true;
    if (text === 'false') return false;
    return text;
  }
  const obj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node.attrs)) obj[`@${k}`] = v;
  const groups: Record<string, unknown[]> = {};
  for (const ch of node.children) {
    if (typeof ch === 'string') {
      const t = ch.trim();
      if (t) obj['#text'] = obj['#text'] ? `${obj['#text']} ${t}` : t;
    } else {
      const v = xmlNodeToJson(ch);
      if (!groups[ch.tag]) groups[ch.tag] = [];
      groups[ch.tag].push(v);
    }
  }
  for (const [k, arr] of Object.entries(groups)) {
    obj[k] = arr.length === 1 ? arr[0] : arr;
  }
  return obj;
}

function xmlToJson(xml: string): unknown {
  const tokens = tokenizeXml(xml.trim());
  const tree = buildXmlTree(tokens);
  if (tree.children.length === 1 && typeof tree.children[0] !== 'string') {
    const root = tree.children[0];
    return { [root.tag]: xmlNodeToJson(root) };
  }
  return xmlNodeToJson(tree);
}

'use client';

import { useMemo, useState } from 'react';
import { Tags, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToolHeader } from '@/components/tools/ToolHeader';

type OgType = 'website' | 'article' | 'product' | 'profile' | 'video.movie';
type TwitterCard = 'summary' | 'summary_large_image';

const OG_TYPES: OgType[] = ['website', 'article', 'product', 'profile', 'video.movie'];
const TWITTER_CARDS: TwitterCard[] = ['summary_large_image', 'summary'];

/** HTML 속성 값에 들어갈 위험 문자를 이스케이프한다. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface MetaFields {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
  ogType: OgType;
  twitterCard: TwitterCard;
}

/** 입력 필드에서 <meta>/<title> 태그 문자열을 생성한다. 빈 필드는 건너뛴다. */
function buildTags(fields: MetaFields): string {
  const lines: string[] = [];
  const { title, description, url, image, siteName, ogType, twitterCard } = fields;

  if (title) {
    lines.push(`<title>${escapeAttr(title)}</title>`);
    lines.push(`<meta name="title" content="${escapeAttr(title)}" />`);
  }
  if (description) {
    lines.push(`<meta name="description" content="${escapeAttr(description)}" />`);
  }

  // Open Graph
  lines.push(`<meta property="og:type" content="${escapeAttr(ogType)}" />`);
  if (title) lines.push(`<meta property="og:title" content="${escapeAttr(title)}" />`);
  if (description) lines.push(`<meta property="og:description" content="${escapeAttr(description)}" />`);
  if (url) lines.push(`<meta property="og:url" content="${escapeAttr(url)}" />`);
  if (image) lines.push(`<meta property="og:image" content="${escapeAttr(image)}" />`);
  if (siteName) lines.push(`<meta property="og:site_name" content="${escapeAttr(siteName)}" />`);

  // Twitter Card
  lines.push(`<meta name="twitter:card" content="${escapeAttr(twitterCard)}" />`);
  if (title) lines.push(`<meta name="twitter:title" content="${escapeAttr(title)}" />`);
  if (description) lines.push(`<meta name="twitter:description" content="${escapeAttr(description)}" />`);
  if (image) lines.push(`<meta name="twitter:image" content="${escapeAttr(image)}" />`);

  return lines.join('\n');
}

const EMPTY: MetaFields = {
  title: '',
  description: '',
  url: '',
  image: '',
  siteName: '',
  ogType: 'website',
  twitterCard: 'summary_large_image',
};

export default function MetaTagsPage() {
  const [fields, setFields] = useState<MetaFields>(EMPTY);
  const [copied, setCopied] = useState(false);

  const setField = <K extends keyof MetaFields>(key: K, value: MetaFields[K]) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const hasContent = fields.title.trim() !== '' || fields.description.trim() !== '' || fields.url.trim() !== '';
  const output = useMemo(() => buildTags(fields), [fields]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('clipboard write failed', err);
    }
  }

  function reset() {
    setFields(EMPTY);
    setCopied(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="메타 태그 생성기" widthClass="max-w-2xl" onReset={hasContent ? reset : undefined} />
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Tags className="h-4 w-4 text-primary" aria-hidden />
          Open Graph · Twitter 카드 등 SEO 메타 태그를 생성합니다.
        </p>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">제목 (title)</span>
            <Input
              value={fields.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="페이지 제목"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">설명 (description)</span>
            <textarea
              className="min-h-16 w-full rounded-lg border bg-transparent p-2.5 text-sm"
              value={fields.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="페이지 요약 설명"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">URL</span>
            <Input
              inputMode="url"
              value={fields.url}
              onChange={(e) => setField('url', e.target.value)}
              placeholder="https://example.com/page"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">이미지 URL</span>
            <Input
              inputMode="url"
              value={fields.image}
              onChange={(e) => setField('image', e.target.value)}
              placeholder="https://example.com/og.png"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">사이트 이름</span>
            <Input
              value={fields.siteName}
              onChange={(e) => setField('siteName', e.target.value)}
              placeholder="예: 내 블로그"
            />
          </label>
          <div className="flex gap-2">
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">og:type</span>
              <select
                value={fields.ogType}
                onChange={(e) => setField('ogType', e.target.value as OgType)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                aria-label="og:type"
              >
                {OG_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block flex-1 space-y-1">
              <span className="text-sm font-medium">twitter:card</span>
              <select
                value={fields.twitterCard}
                onChange={(e) => setField('twitterCard', e.target.value as TwitterCard)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                aria-label="twitter:card"
              >
                {TWITTER_CARDS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {!hasContent && (
          <p className="text-xs text-muted-foreground">
            제목·설명·URL 중 하나 이상을 입력하면 태그가 채워집니다.
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">결과</span>
            <Button variant="outline" size="sm" onClick={copy} disabled={!output}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '복사됨' : '복사'}
            </Button>
          </div>
          <textarea
            className="min-h-64 w-full rounded-xl border bg-muted/40 p-3 font-mono text-xs"
            value={output}
            readOnly
            aria-label="생성된 메타 태그"
          />
        </div>
      </main>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ListChecks, XCircle } from 'lucide-react';
import { ToolHeader } from '@/components/tools/ToolHeader';

type Group = 'security' | 'cache' | 'cors' | 'content' | 'other';

const GROUP_LABELS: Record<Group, string> = {
  security: '보안',
  cache: '캐시',
  cors: 'CORS',
  content: '콘텐츠',
  other: '기타',
};

const GROUP_ORDER: readonly Group[] = ['security', 'cache', 'cors', 'content', 'other'];

/** 헤더명(소문자) → 분류 그룹. */
const GROUP_MAP: Record<string, Group> = {
  'strict-transport-security': 'security',
  'content-security-policy': 'security',
  'content-security-policy-report-only': 'security',
  'x-frame-options': 'security',
  'x-content-type-options': 'security',
  'referrer-policy': 'security',
  'permissions-policy': 'security',
  'cross-origin-opener-policy': 'security',
  'cross-origin-embedder-policy': 'security',
  'cross-origin-resource-policy': 'security',
  'x-xss-protection': 'security',
  'cache-control': 'cache',
  expires: 'cache',
  etag: 'cache',
  'last-modified': 'cache',
  age: 'cache',
  pragma: 'cache',
  vary: 'cache',
  'access-control-allow-origin': 'cors',
  'access-control-allow-methods': 'cors',
  'access-control-allow-headers': 'cors',
  'access-control-allow-credentials': 'cors',
  'access-control-expose-headers': 'cors',
  'access-control-max-age': 'cors',
  'content-type': 'content',
  'content-length': 'content',
  'content-encoding': 'content',
  'content-disposition': 'content',
  'content-language': 'content',
};

/** 헤더 한 줄 설명(소문자 키). */
const HEADER_DESCRIPTIONS: Record<string, string> = {
  'strict-transport-security': 'HTTPS 연결을 강제해 다운그레이드·중간자 공격을 방지합니다.',
  'content-security-policy': '리소스 출처를 제한해 XSS·데이터 삽입을 완화합니다.',
  'content-security-policy-report-only': 'CSP 위반을 차단하지 않고 보고만 합니다(테스트용).',
  'x-frame-options': '다른 사이트의 iframe 삽입을 막아 클릭재킹을 방지합니다.',
  'x-content-type-options': 'MIME 스니핑을 막습니다(nosniff).',
  'referrer-policy': '외부로 전송되는 Referer 정보량을 제어합니다.',
  'permissions-policy': '카메라·위치 등 브라우저 기능 사용 권한을 제어합니다.',
  'cross-origin-opener-policy': '교차 출처 창과의 격리를 설정합니다.',
  'cross-origin-embedder-policy': '교차 출처 리소스 임베드 조건을 설정합니다.',
  'cross-origin-resource-policy': '리소스를 임베드할 수 있는 출처를 제한합니다.',
  'x-xss-protection': '구형 브라우저의 XSS 필터(현재는 비권장).',
  'cache-control': '캐싱 동작과 신선도를 지시합니다.',
  expires: '응답이 만료되는 절대 시각입니다.',
  etag: '리소스 버전 식별자(조건부 요청에 사용).',
  'last-modified': '리소스가 마지막으로 변경된 시각입니다.',
  age: '캐시에 저장된 후 경과 시간(초)입니다.',
  pragma: '구형 캐시 제어 헤더(no-cache).',
  vary: '캐시 키에 영향을 주는 요청 헤더를 명시합니다.',
  'access-control-allow-origin': '응답에 접근 가능한 출처를 지정합니다.',
  'access-control-allow-methods': '교차 출처 요청에 허용되는 메서드입니다.',
  'access-control-allow-headers': '교차 출처 요청에 허용되는 헤더입니다.',
  'access-control-allow-credentials': '자격 증명 포함 요청 허용 여부입니다.',
  'access-control-expose-headers': '스크립트에 노출되는 응답 헤더입니다.',
  'access-control-max-age': 'preflight 결과 캐시 시간(초)입니다.',
  'content-type': '응답 본문의 MIME 타입과 인코딩입니다.',
  'content-length': '응답 본문의 바이트 길이입니다.',
  'content-encoding': '본문에 적용된 압축 방식입니다.',
  'content-disposition': '본문 표시 방식(인라인/다운로드)을 지정합니다.',
  'content-language': '본문의 자연 언어입니다.',
  server: '서버 소프트웨어 정보입니다(노출 최소화 권장).',
  'set-cookie': '클라이언트에 쿠키를 설정합니다.',
  'x-powered-by': '백엔드 기술 정보입니다(노출 최소화 권장).',
};

/** 누락 점검 대상 핵심 보안 헤더. */
const SECURITY_CHECKS: readonly { key: string; label: string; hint: string }[] = [
  { key: 'strict-transport-security', label: 'Strict-Transport-Security', hint: 'HSTS로 HTTPS를 강제하세요.' },
  { key: 'content-security-policy', label: 'Content-Security-Policy', hint: 'CSP로 리소스 출처를 제한하세요.' },
  { key: 'x-frame-options', label: 'X-Frame-Options', hint: '클릭재킹 방지를 위해 DENY/SAMEORIGIN을 설정하세요.' },
  { key: 'x-content-type-options', label: 'X-Content-Type-Options', hint: 'nosniff를 설정하세요.' },
  { key: 'referrer-policy', label: 'Referrer-Policy', hint: 'Referer 노출을 제한하세요.' },
  { key: 'permissions-policy', label: 'Permissions-Policy', hint: '불필요한 브라우저 기능을 차단하세요.' },
];

interface ParsedHeader {
  name: string;
  value: string;
  group: Group;
  description: string;
}

/**
 * 붙여넣은 응답 헤더 텍스트를 파싱한다.
 * - `이름: 값` 형식의 줄만 헤더로 취급한다.
 * - HTTP 상태 라인(`HTTP/1.1 200 OK`)이나 빈 줄은 건너뛴다.
 * - 접힌 헤더(다음 줄이 공백으로 시작)는 이전 값에 이어 붙인다.
 */
function parseHeaders(raw: string): ParsedHeader[] {
  const lines = raw.split(/\r?\n/);
  const headers: ParsedHeader[] = [];

  for (const line of lines) {
    if (line.trim() === '') continue;

    // 접힌(folded) 헤더 연속 줄 — 이전 헤더 값에 이어 붙인다.
    if (/^\s/.test(line) && headers.length > 0) {
      headers[headers.length - 1].value += ` ${line.trim()}`;
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) continue; // 상태 라인 등 콜론 없는 줄은 무시.

    const name = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    if (!name) continue;

    const lower = name.toLowerCase();
    headers.push({
      name,
      value,
      group: GROUP_MAP[lower] ?? 'other',
      description: HEADER_DESCRIPTIONS[lower] ?? '',
    });
  }

  return headers;
}

export default function HttpHeaderAnalyzerPage() {
  const [input, setInput] = useState('');

  const headers = useMemo(() => parseHeaders(input), [input]);

  const presentKeys = useMemo(() => new Set(headers.map((h) => h.name.toLowerCase())), [headers]);

  const grouped = useMemo(() => {
    const map = new Map<Group, ParsedHeader[]>();
    for (const group of GROUP_ORDER) map.set(group, []);
    for (const header of headers) map.get(header.group)!.push(header);
    return map;
  }, [headers]);

  const handleReset = () => setInput('');

  const hasInput = input.trim() !== '';

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="HTTP 헤더 분석" onReset={handleReset} />
      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListChecks className="h-4 w-4 text-primary" aria-hidden />
          응답 헤더 텍스트를 붙여넣으면 보안·캐시·CORS·콘텐츠로 분류하고 핵심 보안 헤더 누락을 점검합니다.
        </p>

        <label className="block space-y-1">
          <span className="text-sm font-medium">응답 헤더 붙여넣기</span>
          <textarea
            className="min-h-48 w-full rounded-xl border bg-card p-3 font-mono text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'예:\nHTTP/2 200\ncontent-type: text/html; charset=utf-8\nstrict-transport-security: max-age=63072000\ncache-control: no-cache'}
            spellCheck={false}
            aria-label="응답 헤더 입력"
          />
          <span className="text-xs text-muted-foreground">
            브라우저 개발자도구 Network 탭의 Response Headers를 그대로 붙여넣으세요.
          </span>
        </label>

        {hasInput && headers.length === 0 && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            해석할 수 있는 헤더(<code>이름: 값</code> 형식)가 없습니다.
          </div>
        )}

        {headers.length > 0 && (
          <>
            <section className="space-y-3 rounded-xl border bg-card p-4">
              <h2 className="text-sm font-semibold">보안 헤더 점검</h2>
              <ul className="space-y-2">
                {SECURITY_CHECKS.map((check) => {
                  const present = presentKeys.has(check.key);
                  return (
                    <li key={check.key} className="flex items-start gap-2 text-sm">
                      {present ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                      )}
                      <span className="min-w-0">
                        <span className="font-mono font-medium">{check.label}</span>
                        <span className={present ? 'ml-2 text-emerald-600 dark:text-emerald-400' : 'ml-2 text-destructive'}>
                          {present ? '설정됨' : '누락'}
                        </span>
                        {!present && <span className="block text-xs text-muted-foreground">{check.hint}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {GROUP_ORDER.map((group) => {
              const items = grouped.get(group) ?? [];
              if (items.length === 0) return null;
              return (
                <section key={group} className="space-y-2 rounded-xl border bg-card p-4">
                  <h2 className="text-sm font-semibold">
                    {GROUP_LABELS[group]} <span className="text-muted-foreground">({items.length})</span>
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="py-1 pr-3 font-medium">헤더</th>
                          <th className="py-1 pr-3 font-medium">값</th>
                          <th className="py-1 font-medium">설명</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((header, index) => (
                          <tr key={`${header.name}-${index}`} className="border-b last:border-0 align-top">
                            <td className="py-2 pr-3 font-mono font-medium break-all">{header.name}</td>
                            <td className="py-2 pr-3 font-mono break-all text-muted-foreground">{header.value || '—'}</td>
                            <td className="py-2 text-xs text-muted-foreground">{header.description || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}

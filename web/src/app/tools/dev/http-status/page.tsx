'use client';

import { useMemo, useState } from 'react';
import { Server } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToolHeader } from '@/components/tools/ToolHeader';

interface StatusCode {
  code: number;
  name: string;
  description: string;
}

const STATUS_CODES: readonly StatusCode[] = [
  { code: 100, name: 'Continue', description: '요청의 초기 부분을 받았으며 클라이언트가 계속 진행해도 됩니다.' },
  { code: 101, name: 'Switching Protocols', description: '서버가 프로토콜 전환 요청을 수락했습니다.' },
  { code: 103, name: 'Early Hints', description: '본문 응답 전에 일부 헤더를 미리 보냅니다.' },
  { code: 200, name: 'OK', description: '요청이 성공했습니다.' },
  { code: 201, name: 'Created', description: '요청이 성공했고 새 리소스가 생성되었습니다.' },
  { code: 202, name: 'Accepted', description: '요청을 받았으나 아직 처리하지 않았습니다.' },
  { code: 204, name: 'No Content', description: '요청은 성공했지만 반환할 본문이 없습니다.' },
  { code: 206, name: 'Partial Content', description: 'Range 요청에 따라 일부 콘텐츠만 반환합니다.' },
  { code: 301, name: 'Moved Permanently', description: '리소스가 새 URL 로 영구 이동했습니다.' },
  { code: 302, name: 'Found', description: '리소스가 일시적으로 다른 URL 에 있습니다.' },
  { code: 303, name: 'See Other', description: 'GET 으로 다른 URL 에서 결과를 받으라는 응답입니다.' },
  { code: 304, name: 'Not Modified', description: '캐시된 버전을 그대로 사용해도 됩니다.' },
  { code: 307, name: 'Temporary Redirect', description: '메서드를 유지한 채 일시적으로 다른 URL 로 이동합니다.' },
  { code: 308, name: 'Permanent Redirect', description: '메서드를 유지한 채 영구적으로 다른 URL 로 이동합니다.' },
  { code: 400, name: 'Bad Request', description: '잘못된 문법 등으로 요청을 처리할 수 없습니다.' },
  { code: 401, name: 'Unauthorized', description: '인증이 필요합니다.' },
  { code: 402, name: 'Payment Required', description: '결제가 필요합니다(예약된 코드).' },
  { code: 403, name: 'Forbidden', description: '권한이 없어 접근이 거부되었습니다.' },
  { code: 404, name: 'Not Found', description: '요청한 리소스를 찾을 수 없습니다.' },
  { code: 405, name: 'Method Not Allowed', description: '허용되지 않은 HTTP 메서드입니다.' },
  { code: 406, name: 'Not Acceptable', description: '요청한 콘텐츠 형식을 제공할 수 없습니다.' },
  { code: 408, name: 'Request Timeout', description: '요청 대기 시간이 초과되었습니다.' },
  { code: 409, name: 'Conflict', description: '리소스의 현재 상태와 충돌합니다.' },
  { code: 410, name: 'Gone', description: '리소스가 영구적으로 삭제되었습니다.' },
  { code: 411, name: 'Length Required', description: 'Content-Length 헤더가 필요합니다.' },
  { code: 413, name: 'Payload Too Large', description: '요청 본문이 너무 큽니다.' },
  { code: 414, name: 'URI Too Long', description: '요청 URI 가 너무 깁니다.' },
  { code: 415, name: 'Unsupported Media Type', description: '지원하지 않는 미디어 타입입니다.' },
  { code: 422, name: 'Unprocessable Entity', description: '문법은 맞으나 의미상 처리할 수 없습니다.' },
  { code: 429, name: 'Too Many Requests', description: '단시간에 너무 많은 요청을 보냈습니다.' },
  { code: 451, name: 'Unavailable For Legal Reasons', description: '법적 사유로 제공할 수 없습니다.' },
  { code: 500, name: 'Internal Server Error', description: '서버 내부 오류가 발생했습니다.' },
  { code: 501, name: 'Not Implemented', description: '서버가 요청 메서드를 지원하지 않습니다.' },
  { code: 502, name: 'Bad Gateway', description: '게이트웨이가 잘못된 응답을 받았습니다.' },
  { code: 503, name: 'Service Unavailable', description: '서버가 일시적으로 요청을 처리할 수 없습니다.' },
  { code: 504, name: 'Gateway Timeout', description: '게이트웨이 응답 대기 시간이 초과되었습니다.' },
  { code: 505, name: 'HTTP Version Not Supported', description: '지원하지 않는 HTTP 버전입니다.' },
  { code: 507, name: 'Insufficient Storage', description: '저장 공간이 부족해 요청을 완료할 수 없습니다.' },
  { code: 511, name: 'Network Authentication Required', description: '네트워크 접근을 위한 인증이 필요합니다.' },
];

interface Category {
  prefix: number;
  label: string;
  badge: string;
}

const CATEGORIES: readonly Category[] = [
  { prefix: 1, label: '정보', badge: 'bg-sky-500/15 text-sky-500' },
  { prefix: 2, label: '성공', badge: 'bg-green-500/15 text-green-500' },
  { prefix: 3, label: '리다이렉션', badge: 'bg-amber-500/15 text-amber-500' },
  { prefix: 4, label: '클라이언트 오류', badge: 'bg-orange-500/15 text-orange-500' },
  { prefix: 5, label: '서버 오류', badge: 'bg-red-500/15 text-red-500' },
];

function categoryOf(code: number): Category {
  const prefix = Math.floor(code / 100);
  return CATEGORIES.find((item) => item.prefix === prefix) ?? CATEGORIES[CATEGORIES.length - 1];
}

export default function HttpStatusPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return STATUS_CODES;
    return STATUS_CODES.filter(
      (item) =>
        String(item.code).includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term),
    );
  }, [query]);

  function reset() {
    setQuery('');
  }

  return (
    <div className="min-h-dvh bg-background">
      <ToolHeader title="HTTP 상태 코드" onReset={reset} />
      <main className="mx-auto max-w-xl space-y-5 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Server className="h-4 w-4 text-primary" aria-hidden />
          HTTP 상태 코드의 의미와 용도를 검색합니다.
        </p>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="코드 또는 이름으로 검색 (예: 404, Not Found)"
          aria-label="상태 코드 검색"
        />

        {filtered.length === 0 ? (
          <p className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
            일치하는 상태 코드가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const category = categoryOf(item.code);
              return (
                <div key={item.code} className="rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 font-mono text-sm font-bold ${category.badge}`}>
                      {item.code}
                    </span>
                    <span className="text-sm font-semibold">{item.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{category.label}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

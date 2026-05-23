import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2">
            <Compass className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold">이 페이지는 없어요</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              링크가 바뀌었거나 삭제된 화면일 수 있습니다.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <a
            href="/tools"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            도구 허브로 이동
          </a>
        </div>
      </div>
    </div>
  );
}

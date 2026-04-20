import Link from 'next/link';

export default function SharedNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <h1 className="text-2xl font-semibold">대화를 찾을 수 없습니다</h1>
      <p className="text-sm text-muted-foreground">
        링크가 만료되었거나 공유가 회수되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        홈으로
      </Link>
    </div>
  );
}

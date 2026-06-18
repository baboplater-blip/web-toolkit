'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareLinkButtonProps {
  /** 버튼 라벨(기본 "링크 복사"). */
  label?: string;
  /** 복사 후 표시할 라벨(기본 "복사됨"). */
  copiedLabel?: string;
  /** 버튼 스타일. */
  variant?: 'outline' | 'ghost' | 'secondary';
  /** 버튼 크기. */
  size?: 'sm' | 'xs' | 'default';
  className?: string;
}

/**
 * 현재 페이지 URL(쿼리 포함)을 클립보드에 복사하는 공유 버튼.
 *
 * `useToolUrlState` 가 입력·옵션을 URL 쿼리에 반영해 두므로, 이 버튼으로
 * 복사한 링크를 열면 같은 입력 상태가 그대로 복원된다. 파일·바이너리는
 * 애초에 쿼리에 담기지 않으므로(훅의 길이 제한) 공유 링크는 항상 가볍다.
 *
 * 클립보드 API 가 없거나 차단된 환경(비-HTTPS·구형 브라우저)에서는 조용히
 * 실패하지 않고 콘솔에 영문 로그를 남긴다.
 */
export function ShareLinkButton({
  label = '링크 복사',
  copiedLabel = '복사됨',
  variant = 'outline',
  size = 'sm',
  className,
}: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // 폴백: 임시 textarea + execCommand (비보안 컨텍스트 대응).
        const area = document.createElement('textarea');
        area.value = url;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('share link copy failed', err);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
      aria-label="현재 설정이 담긴 링크 복사"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}

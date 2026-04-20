/**
 * Claude / 에이전트가 남긴 error_message + content 를 원인별로 분류한다.
 * Dashboard 에서 빈도 집계용.
 */

export type ErrorCategory =
  | 'token_limit'
  | 'rate_limit_tpm'
  | 'rate_limit_rpm'
  | 'rate_limit'
  | 'timeout'
  | 'permission_windows'
  | 'permission'
  | 'network'
  | 'auth'
  | 'cancelled'
  | 'cli_missing'
  | 'cli_error'
  | 'disk_full'
  | 'unknown';

export interface ClassifiedError {
  category: ErrorCategory;
  label: string;
  hint: string;
}

export function classifyError(
  errorMessage: string | null | undefined,
  content?: string | null,
): ClassifiedError {
  const text = `${errorMessage ?? ''}\n${content ?? ''}`.toLowerCase();

  if (/사용자 요청으로 중단|중단됨|cancel/.test(text)) {
    return {
      category: 'cancelled',
      label: '사용자 중단',
      hint: '사용자가 수동으로 취소한 작업입니다.',
    };
  }
  if (/token|context.*length|context.*window|maximum.*context|too many tokens/.test(text)) {
    return {
      category: 'token_limit',
      label: '토큰 한도 초과',
      hint: '대화가 너무 길거나 입력이 큽니다. 요약으로 컨텍스트를 줄여보세요.',
    };
  }
  if (/tokens?.?per.?min|tpm|tokens per minute/.test(text)) {
    return {
      category: 'rate_limit_tpm',
      label: 'Rate limit (TPM)',
      hint: '분당 토큰 수 한도 초과. 응답 길이를 줄이거나 잠시 기다려주세요.',
    };
  }
  if (/requests?.?per.?min|rpm|requests per minute/.test(text)) {
    return {
      category: 'rate_limit_rpm',
      label: 'Rate limit (RPM)',
      hint: '분당 요청 수 한도 초과. 호출 빈도를 줄여주세요.',
    };
  }
  if (/rate.?limit|429|too many requests|quota/.test(text)) {
    return {
      category: 'rate_limit',
      label: 'Rate limit',
      hint: 'API 호출 빈도 제한에 걸렸습니다. 잠시 후 다시 시도해주세요.',
    };
  }
  if (/timeout|timed out|타임아웃|시간 초과/.test(text)) {
    return {
      category: 'timeout',
      label: '타임아웃',
      hint: '실행이 길어져 종료되었습니다. TASK_TIMEOUT_MS 를 늘리거나 작업을 쪼개보세요.',
    };
  }
  if (/eacces|uac|administrator|eperm|windowsprotected/.test(text) || /access is denied/.test(text)) {
    return {
      category: 'permission_windows',
      label: 'Windows 권한 거부',
      hint: 'Windows 사용자 계정 컨트롤(UAC) 에 막혔을 수 있습니다. PowerShell 을 관리자 권한으로 실행하거나 폴더 권한을 확인하세요.',
    };
  }
  if (/permission|403|forbidden|denied|권한/.test(text)) {
    return {
      category: 'permission',
      label: '권한 거부',
      hint: '파일·명령 권한이 부족합니다. 에이전트 프로세스 권한을 확인해주세요.',
    };
  }
  if (/enospc|disk.*full|no space/.test(text)) {
    return {
      category: 'disk_full',
      label: '디스크 공간 부족',
      hint: 'PC 디스크 공간이 부족합니다. 최소 1GB 이상 확보 후 재시도하세요.',
    };
  }
  if (/econn|enotfound|network|fetch failed|connection reset|socket hang up/.test(text)) {
    return {
      category: 'network',
      label: '네트워크 오류',
      hint: '외부 API 나 Claude 서버와의 통신 실패입니다.',
    };
  }
  if (/401|unauthorized|invalid.*key|authentication|auth.*failed/.test(text)) {
    return {
      category: 'auth',
      label: '인증 실패',
      hint: 'Anthropic API 키 또는 Claude 로그인 상태를 확인해주세요.',
    };
  }
  if (/command not found|claude.*not.*installed|no such file|enoent/.test(text)) {
    return {
      category: 'cli_missing',
      label: 'Claude CLI 누락',
      hint: 'Claude Code CLI 가 설치되어 있지 않거나 PATH 에 없습니다.',
    };
  }
  if (/exit code \d|error:|exception|stack trace|traceback/.test(text)) {
    return {
      category: 'cli_error',
      label: 'CLI 실행 오류',
      hint: 'Claude CLI 가 비정상 종료했습니다. 로그를 확인해주세요.',
    };
  }
  return {
    category: 'unknown',
    label: '기타',
    hint: '분류되지 않은 오류. 로그 원문을 확인해주세요.',
  };
}

export function classifyMany(
  rows: Array<{ error_message: string | null; content: string }>,
): Map<ErrorCategory, number> {
  const counts = new Map<ErrorCategory, number>();
  for (const row of rows) {
    const { category } = classifyError(row.error_message, row.content);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return counts;
}

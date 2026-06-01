/**
 * 도구별 사용 가이드 콘텐츠를 registry 메타에서 자동 생성.
 *
 * 목적:
 *   - long-tail 검색어 ("PDF 합치는 법", "이미지 압축 무료") 도달
 *   - HowTo JSON-LD 와 정합되는 실제 가이드 본문 제공
 *   - 사용자 평균 체류 시간 향상
 *
 * 카테고리별 표준 패턴:
 *   file-processing : Upload → Configure → Download
 *   generator       : Configure → Generate → Copy/Save
 *   text-analysis   : Input → Analyze → Copy/Save
 *
 * 도구별 한글 가이드 본문 + 공통 FAQ 를 반환. CSR 없이 server component
 * 에서 사용해 정적 HTML 에 박힌다.
 */

import type { ToolMeta } from '@/lib/tools/registry';

export type GuidePattern = 'file' | 'generator' | 'text';

const GENERATOR_KEYS = new Set([
  'qr-code',
  'barcode',
  'color-palette',
  'uuid-gen',
  'password-gen',
  'lorem-ipsum',
  'totp',
  'rsa-keypair',
  'random-pick',
  // 오피스 생성기 (Configure → Generate → Save)
  'seal-stamp',
  'vcard-qr',
]);

const TEXT_ANALYSIS_KEYS = new Set([
  'text-diff',
  'text-count',
  'regex-tester',
  'jwt-decoder',
  'json-format',
  'base64',
  'cron-explainer',
  'markdown-stats',
  'url-parser',
  'url-encoder',
  'jsonpath',
  'sql-format',
  'percentage',
  'age-calc',
  'dday',
  'timer-stopwatch',
  'unit-converter',
  'color-converter',
  'timestamp-converter',
  'html-entities',
  // 오피스 입력형 도구 (Input → Result → Copy)
  'vat-calc',
  'redact',
  'excel-formula',
]);

export function getPattern(tool: ToolMeta): GuidePattern {
  if (GENERATOR_KEYS.has(tool.id)) return 'generator';
  if (TEXT_ANALYSIS_KEYS.has(tool.id)) return 'text';
  // text 카테고리 + 자체 입력형 도구는 대부분 text-analysis
  if (tool.category === 'text' || tool.category === 'dev' || tool.category === 'util') {
    // hash·file-hash 처럼 파일 입력 받는 일부는 file 패턴
    if (tool.id === 'file-hash') return 'file';
    return 'text';
  }
  return 'file';
}

export interface GuideStep {
  title: string;
  body: string;
}

export interface GuideContent {
  /** 메타 title (35자 이내) */
  metaTitle: string;
  /** 메타 description (150자 이내) */
  metaDescription: string;
  /** H1 + 도입 한 줄 요약 */
  intro: string;
  /** 핵심 기능 bullet 3~5개 */
  features: string[];
  /** 단계별 사용법 */
  steps: GuideStep[];
  /** 도구별 FAQ */
  faqs: Array<{ q: string; a: string }>;
}

const CATEGORY_NOUN: Record<string, string> = {
  pdf: 'PDF',
  image: '이미지',
  video: '비디오',
  gif: 'GIF',
  audio: '오디오',
  docs: '문서',
  text: '텍스트',
  dev: '개발',
  util: '유틸리티',
  security: '보안',
  ai: 'AI',
};

export function buildGuide(tool: ToolMeta): GuideContent {
  const pattern = getPattern(tool);
  const cat = CATEGORY_NOUN[tool.category] ?? tool.category;
  const longTailKeywords = (tool.keywords ?? [])
    .filter((k) => k.length >= 2)
    .slice(0, 5)
    .join(', ');

  const metaTitle = `${tool.title} 사용법 — 무료 ${cat} 도구 가이드`;
  const metaDescription = `${tool.title}: ${tool.description} 회원가입·설치 없이 브라우저 안에서 ${cat} 처리. ${
    longTailKeywords ? `키워드: ${longTailKeywords}.` : ''
  } 파일이 서버로 전송되지 않습니다.`.slice(0, 155);

  const intro = `${tool.title}은(는) ${tool.description.replace(/\.$/, '')}. Web Toolkit 의 ${cat} 카테고리 도구로, 회원가입·설치·업로드 없이 브라우저 안에서 즉시 동작합니다.`;

  const features = buildFeatures(tool, pattern, cat);
  const steps = buildSteps(tool, pattern, cat);
  const faqs = buildFaqs(tool, pattern, cat);

  return {
    metaTitle,
    metaDescription,
    intro,
    features,
    steps,
    faqs,
  };
}

function buildFeatures(
  tool: ToolMeta,
  pattern: GuidePattern,
  cat: string,
): string[] {
  const base = [
    '파일이 서버로 전송되지 않습니다 — 모든 처리가 브라우저 안에서 완결됩니다.',
    '회원가입·로그인 불필요. URL 을 열기만 하면 즉시 사용 가능합니다.',
  ];
  if (pattern === 'file') {
    return [
      ...base,
      `${cat} 파일을 드래그·드롭 또는 클릭으로 업로드하면 옵션 화면이 표시됩니다.`,
      '여러 파일을 한 번에 처리할 수 있는 일괄 모드를 지원합니다 (도구에 따라).',
      'PWA 로 홈 화면에 추가해 오프라인에서도 동작합니다.',
    ];
  }
  if (pattern === 'generator') {
    return [
      ...base,
      'Web Crypto API 기반의 안전한 무작위 / 해시 / 키 생성 — 예측 불가능.',
      '결과는 클립보드 복사·파일 저장·URL 공유 등 다양한 출력 형식을 지원합니다.',
      '모바일에서도 풀 기능. 키보드 단축키로 빠른 작업.',
    ];
  }
  return [
    ...base,
    '입력하면 결과가 실시간으로 갱신됩니다 — 별도 "변환" 버튼이 없어도 됩니다.',
    '결과를 한 번의 클릭으로 클립보드에 복사하거나 파일로 저장.',
    '한·영 키워드 양쪽 검색 지원, 키보드 단축키로 도구 간 빠른 이동.',
  ];
}

function buildSteps(
  tool: ToolMeta,
  pattern: GuidePattern,
  cat: string,
): GuideStep[] {
  if (pattern === 'file') {
    return [
      {
        title: `${cat} 파일 업로드`,
        body: `도구 페이지를 열고 ${cat} 파일을 드롭존에 끌어다 놓거나 파일 선택 버튼을 누릅니다. 모바일에서는 갤러리·문서함에서 직접 선택할 수 있습니다. 파일은 브라우저 메모리에만 올라가며 어디로도 전송되지 않습니다.`,
      },
      {
        title: '옵션 설정 & 미리보기',
        body: `${tool.title}에 필요한 옵션(품질·크기·포맷 등)을 화면에서 선택합니다. 대부분 도구는 미리보기를 제공하므로 결과를 확인하면서 옵션을 조정할 수 있습니다.`,
      },
      {
        title: '결과 다운로드',
        body: '"다운로드" 또는 "저장" 버튼을 눌러 처리된 파일을 기기에 저장합니다. 큰 파일은 처리에 시간이 걸릴 수 있고, 진행률이 표시됩니다. 작업을 취소하면 즉시 중단됩니다.',
      },
    ];
  }
  if (pattern === 'generator') {
    return [
      {
        title: '옵션 선택',
        body: '필요한 형식·길이·강도·알고리즘 등 옵션을 선택합니다. 보안용 결과(키·OTP·랜덤)는 옵션을 보수적으로 — 일반 용도는 기본값으로 시작.',
      },
      {
        title: '즉시 생성',
        body: '"생성" 버튼을 누르면 브라우저 내장 Web Crypto / Canvas API 로 즉시 결과가 만들어집니다. 옵션을 바꾸고 다시 생성해 비교할 수 있습니다.',
      },
      {
        title: '복사·저장',
        body: '결과를 한 번의 클릭으로 클립보드에 복사하거나, PEM·PNG·SVG·TXT 등 도구에 맞는 형식으로 파일 저장할 수 있습니다. 보안 키는 안전한 위치에 보관하세요.',
      },
    ];
  }
  return [
    {
      title: '텍스트 입력',
      body: '입력 영역에 변환·분석할 텍스트나 데이터를 붙여넣거나 직접 입력합니다. 큰 텍스트도 즉시 처리됩니다 (최대 수십 MB 까지 검증).',
    },
    {
      title: '실시간 결과 확인',
      body: '입력하는 동안 결과가 자동으로 갱신됩니다. 옵션이 있는 도구는 옵션을 조정하면 결과가 즉시 다시 계산됩니다.',
    },
    {
      title: '복사 또는 내려받기',
      body: '결과 영역의 "복사" 버튼으로 클립보드에 담거나, "다운로드" 로 파일 저장. 큰 결과는 .txt·.json·.csv 형식을 지원합니다.',
    },
  ];
}

function buildFaqs(
  tool: ToolMeta,
  pattern: GuidePattern,
  cat: string,
): Array<{ q: string; a: string }> {
  const common = [
    {
      q: '파일이 서버로 전송되나요?',
      a: '전송되지 않습니다. Web Worker · WebAssembly · Canvas API 만 사용해 브라우저 안에서 모든 처리가 완결됩니다. 네트워크 탭을 열어 직접 확인할 수 있습니다.',
    },
    {
      q: '무료인가요?',
      a: '네. 회원가입·결제·사용량 제한 없이 무료입니다. 사이트는 광고로 운영비를 충당하며, 사용자 데이터를 수집하거나 거래하지 않습니다.',
    },
    {
      q: '모바일에서도 사용 가능한가요?',
      a: '네. 모든 도구가 모바일 우선으로 설계됐고 iOS Safari · Android Chrome 양쪽에서 검증됐습니다. 홈 화면에 추가하면 앱처럼 사용 가능합니다.',
    },
  ];

  if (pattern === 'file') {
    return [
      ...common,
      {
        q: '파일 크기 제한이 있나요?',
        a: `브라우저 메모리 한도 안에서 동작합니다. ${cat} 파일은 일반적으로 ${
          tool.category === 'video' ? '500MB' : tool.category === 'pdf' ? '100MB' : '50MB'
        } 까지 검증돼 있고, 그 이상은 처리 시간이 길거나 메모리 부족이 발생할 수 있습니다.`,
      },
      {
        q: '여러 파일을 한 번에 처리할 수 있나요?',
        a: '대부분의 도구가 일괄(batch) 모드를 지원합니다. 폴더째 드래그하면 자동으로 인식되며, 결과는 ZIP 으로 묶여 다운로드됩니다.',
      },
    ];
  }
  if (pattern === 'generator') {
    return [
      ...common,
      {
        q: '생성된 결과가 안전한가요?',
        a: 'Web Crypto API 의 안전한 난수원(crypto.getRandomValues / SubtleCrypto) 을 사용합니다. Math.random 보다 균등성이 높고 예측 불가능합니다. 다만 생성된 비밀키·시드는 반드시 사용자가 안전한 위치에 보관해야 합니다.',
      },
      {
        q: '생성 결과가 어디에 저장되나요?',
        a: '아무 데도 저장되지 않습니다. 화면을 새로고침하면 결과가 사라지므로, 필요하다면 복사하거나 파일로 저장하세요.',
      },
    ];
  }
  return [
    ...common,
    {
      q: '큰 텍스트도 처리 가능한가요?',
      a: '수십 MB 까지 검증됐습니다. 다만 정규식 평가·diff 같은 복잡한 연산은 입력이 클수록 시간이 늘어납니다. 일반 문서·코드는 즉시 처리됩니다.',
    },
    {
      q: '결과 형식을 바꿀 수 있나요?',
      a: `${tool.title}은(는) 도구별로 .txt · .json · .csv · .md 등 적절한 형식의 출력을 지원합니다. 옵션이 있는 경우 화면에서 선택 가능합니다.`,
    },
  ];
}

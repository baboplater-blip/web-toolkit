/**
 * 변환 매트릭스 — 프로그래매틱 SEO 엔진 (마스터플랜 Phase γ).
 *
 * "png to jpg", "heic to jpg", "webp to png" 같은 고볼륨 롱테일 변환 검색어를
 * 잡는 페이지를 자동 생성한다. 핵심 원칙: **얇은 양산 페이지 금지**.
 * 각 페이지는 두 포맷의 풍부한 사실(strengths/weaknesses/특성)을 조합해
 * 페이지마다 고유한 본문·"무엇이 바뀌나"·FAQ 를 생성하고, CTA 는 실제로
 * 동작하는 브라우저 도구로 연결한다(죽은 링크 없음).
 *
 * 라우트: /convert/{slug} (ko) · /en/convert/{slug} (en) — hreflang 연결.
 */

import type { ToolCategory } from '@/lib/tools/registry';

export type Lang = 'ko' | 'en';

/* ───────────────────────── 포맷 사실(facts) ───────────────────────── */

interface Bi {
  ko: string;
  en: string;
}
interface BiList {
  ko: string[];
  en: string[];
}

export interface FormatFact {
  key: string;
  label: string; // 표기 (대문자)
  ext: string; // 확장자
  kind: 'image' | 'document' | 'audio' | 'video';
  lossy: boolean;
  transparency: boolean;
  animation: boolean;
  vector: boolean;
  /** 동일 화질 기준 상대 용량: 'small' | 'medium' | 'large' */
  weight: 'small' | 'medium' | 'large';
  /** 범용 호환(거의 모든 기기/앱에서 열림) */
  universal: boolean;
  summary: Bi;
  strengths: BiList;
  weaknesses: BiList;
}

export const FORMATS: Record<string, FormatFact> = {
  jpg: {
    key: 'jpg', label: 'JPG', ext: 'jpg', kind: 'image',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: {
      ko: '사진에 최적화된 손실 압축 포맷으로, 거의 모든 곳에서 열립니다.',
      en: 'A lossy format tuned for photographs that opens virtually everywhere.',
    },
    strengths: {
      ko: ['사진에서 매우 작은 용량', '모든 기기·앱·웹·프린터 지원', '품질 대비 용량 조절 가능'],
      en: ['Tiny files for photographs', 'Supported by every device, app, web and printer', 'Adjustable quality vs size'],
    },
    weaknesses: {
      ko: ['손실 압축 — 텍스트·경계가 뭉개짐', '투명 배경 미지원', '반복 저장 시 화질 누적 저하'],
      en: ['Lossy — smears text and sharp edges', 'No transparency', 'Quality degrades on repeated saves'],
    },
  },
  png: {
    key: 'png', label: 'PNG', ext: 'png', kind: 'image',
    lossy: false, transparency: true, animation: false, vector: false,
    weight: 'large', universal: true,
    summary: {
      ko: '투명도를 지원하는 무손실 포맷으로, 로고·스크린샷·아이콘에 적합합니다.',
      en: 'A lossless format with transparency, ideal for logos, screenshots and icons.',
    },
    strengths: {
      ko: ['무손실 — 압축 아티팩트 없음', '투명 배경(알파) 지원', '텍스트·경계가 선명'],
      en: ['Lossless — no compression artifacts', 'Supports transparency (alpha)', 'Crisp edges and text'],
    },
    weaknesses: {
      ko: ['사진은 용량이 매우 큼', 'WebP·AVIF보다 비효율', '애니메이션 미지원(APNG 예외)'],
      en: ['Very large for photographs', 'Less efficient than WebP/AVIF', 'No animation (except APNG)'],
    },
  },
  webp: {
    key: 'webp', label: 'WebP', ext: 'webp', kind: 'image',
    lossy: true, transparency: true, animation: true, vector: false,
    weight: 'small', universal: false,
    summary: {
      ko: '투명도·애니메이션을 지원하면서 PNG·JPG보다 작은 현대 웹 포맷입니다.',
      en: 'A modern web format that is smaller than PNG/JPG while supporting transparency and animation.',
    },
    strengths: {
      ko: ['같은 화질에 더 작은 용량', '투명도·애니메이션 지원', '모든 최신 브라우저 지원'],
      en: ['Smaller files at the same quality', 'Supports transparency and animation', 'Supported by all modern browsers'],
    },
    weaknesses: {
      ko: ['아주 오래된 소프트웨어 미지원', '일부 인쇄 워크플로와 비호환', '편집 툴 호환이 PNG보다 좁음'],
      en: ['Unsupported by very old software', 'Not ideal for some print workflows', 'Narrower editor support than PNG'],
    },
  },
  avif: {
    key: 'avif', label: 'AVIF', ext: 'avif', kind: 'image',
    lossy: true, transparency: true, animation: true, vector: false,
    weight: 'small', universal: false,
    summary: {
      ko: 'AV1 기반의 차세대 포맷으로, 동일 화질에서 가장 작은 용량을 냅니다.',
      en: 'An AV1-based next-gen format that produces the smallest files at a given quality.',
    },
    strengths: {
      ko: ['최고 수준의 압축 효율', '넓은 색영역·HDR', '투명도 지원'],
      en: ['Best-in-class compression', 'Wide color gamut and HDR', 'Supports transparency'],
    },
    weaknesses: {
      ko: ['구형 브라우저·앱 미지원', '인코딩이 느릴 수 있음', '편집 도구 지원이 제한적'],
      en: ['Unsupported on older browsers/apps', 'Encoding can be slow', 'Limited editor support'],
    },
  },
  gif: {
    key: 'gif', label: 'GIF', ext: 'gif', kind: 'image',
    lossy: false, transparency: true, animation: true, vector: false,
    weight: 'large', universal: true,
    summary: {
      ko: '256색 한정의 오래된 애니메이션 포맷으로, 짧은 루프 영상에 흔히 쓰입니다.',
      en: 'An old 256-color animation format commonly used for short looping clips.',
    },
    strengths: {
      ko: ['어디서나 재생되는 애니메이션', '단순 투명도 지원', '폭넓은 호환'],
      en: ['Animation that plays anywhere', 'Simple transparency', 'Broad compatibility'],
    },
    weaknesses: {
      ko: ['256색 한정 — 사진에 부적합', '같은 영상이 WebP·MP4보다 큼', '경계 색번짐'],
      en: ['Limited to 256 colors — poor for photos', 'Larger than WebP/MP4 for the same clip', 'Color banding'],
    },
  },
  bmp: {
    key: 'bmp', label: 'BMP', ext: 'bmp', kind: 'image',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'large', universal: true,
    summary: {
      ko: '비압축 비트맵 포맷으로 용량이 매우 크며, 보통 다른 포맷으로 바꿔 씁니다.',
      en: 'An uncompressed bitmap format with very large files, usually converted to something else.',
    },
    strengths: {
      ko: ['완전 무손실', '구조가 단순', '구형 윈도우 호환'],
      en: ['Fully lossless', 'Simple structure', 'Legacy Windows compatibility'],
    },
    weaknesses: {
      ko: ['용량이 비효율적으로 큼', '투명도·애니메이션 미지원', '웹에서 거의 안 씀'],
      en: ['Inefficiently large', 'No transparency or animation', 'Rarely used on the web'],
    },
  },
  heic: {
    key: 'heic', label: 'HEIC', ext: 'heic', kind: 'image',
    lossy: true, transparency: true, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: {
      ko: '아이폰 기본 고효율 포맷으로 용량은 작지만 다른 환경에서 호환이 약합니다.',
      en: "The iPhone's default high-efficiency format — small files but poor support elsewhere.",
    },
    strengths: {
      ko: ['JPG의 약 절반 용량', '높은 비트심도·HDR', '최신 아이폰 기본값'],
      en: ['Roughly half the size of JPG', 'High bit depth and HDR', 'Default on modern iPhones'],
    },
    weaknesses: {
      ko: ['윈도우·웹·구형 앱 호환 약함', '공유하려면 변환 필요', '편집 지원 제한적'],
      en: ['Poor support on Windows, web and old apps', 'Needs converting to share', 'Limited editor support'],
    },
  },
  svg: {
    key: 'svg', label: 'SVG', ext: 'svg', kind: 'image',
    lossy: false, transparency: true, animation: false, vector: true,
    weight: 'small', universal: false,
    summary: {
      ko: '해상도에 무관하게 선명한 벡터 포맷으로, 로고·아이콘·도형에 적합합니다.',
      en: 'A resolution-independent vector format ideal for logos, icons and shapes.',
    },
    strengths: {
      ko: ['어떤 크기로도 무한 선명', '용량이 작음(단순 도형)', '코드로 편집 가능'],
      en: ['Infinitely sharp at any size', 'Small files for simple shapes', 'Editable as code'],
    },
    weaknesses: {
      ko: ['사진 표현 불가', '일부 앱·문서에서 미지원', '복잡한 그래픽은 무거움'],
      en: ['Cannot represent photographs', 'Unsupported in some apps/documents', 'Heavy for complex graphics'],
    },
  },
  pdf: {
    key: 'pdf', label: 'PDF', ext: 'pdf', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: true,
    summary: {
      ko: '레이아웃을 고정해 어디서나 동일하게 보이는 문서 포맷입니다.',
      en: 'A document format that locks layout so it looks identical everywhere.',
    },
    strengths: {
      ko: ['모든 기기에서 동일한 레이아웃', '여러 페이지를 한 파일로', '공유·인쇄·보관에 표준'],
      en: ['Identical layout on every device', 'Many pages in one file', 'Standard for sharing, printing, archiving'],
    },
    weaknesses: {
      ko: ['이미지처럼 바로 편집 어려움', '낱장 이미지로 쓰려면 변환 필요', '텍스트 추출이 까다로울 수 있음'],
      en: ['Hard to edit like an image', 'Needs converting to use as standalone images', 'Text extraction can be tricky'],
    },
  },

  /* ── 오디오 ── */
  mp3: {
    key: 'mp3', label: 'MP3', ext: 'mp3', kind: 'audio',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '가장 널리 쓰이는 손실 오디오 포맷으로, 어디서나 재생됩니다.', en: 'The most widely used lossy audio format that plays everywhere.' },
    strengths: { ko: ['모든 기기·앱에서 재생', '작은 용량', '비트레이트 조절 가능'], en: ['Plays on every device and app', 'Small files', 'Adjustable bitrate'] },
    weaknesses: { ko: ['손실 압축 — 원본보다 음질 저하', '무손실 보관에 부적합', '메타데이터가 제한적'], en: ['Lossy — quality below the original', 'Not for lossless archiving', 'Limited metadata'] },
  },
  wav: {
    key: 'wav', label: 'WAV', ext: 'wav', kind: 'audio',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'large', universal: true,
    summary: { ko: '비압축 무손실 오디오 포맷으로, 편집·마스터링에 적합합니다.', en: 'An uncompressed lossless audio format ideal for editing and mastering.' },
    strengths: { ko: ['완전 무손실 원음', '편집 워크플로 표준', '폭넓은 호환'], en: ['Fully lossless audio', 'Standard for editing workflows', 'Broad compatibility'] },
    weaknesses: { ko: ['용량이 매우 큼', '스트리밍·공유엔 비효율', '메타데이터 빈약'], en: ['Very large files', 'Inefficient for streaming/sharing', 'Sparse metadata'] },
  },
  m4a: {
    key: 'm4a', label: 'M4A', ext: 'm4a', kind: 'audio',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: 'AAC 기반 애플 생태계 오디오 포맷으로, MP3보다 효율적입니다.', en: "An AAC-based audio format from Apple's ecosystem, more efficient than MP3." },
    strengths: { ko: ['MP3보다 같은 용량에 좋은 음질', '아이튠즈·애플 기기 기본', '챕터·메타데이터 지원'], en: ['Better quality than MP3 at the same size', 'Default on iTunes/Apple devices', 'Supports chapters and metadata'] },
    weaknesses: { ko: ['일부 구형 기기 비호환', 'MP3만큼 범용은 아님', '편집 도구 지원이 좁음'], en: ['Incompatible with some old devices', 'Less universal than MP3', 'Narrower editor support'] },
  },
  aac: {
    key: 'aac', label: 'AAC', ext: 'aac', kind: 'audio',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: 'MP3의 후속 손실 포맷으로, 낮은 비트레이트에서 음질이 좋습니다.', en: 'A successor to MP3 with better quality at low bitrates.' },
    strengths: { ko: ['낮은 비트레이트에서 우수한 음질', '스트리밍·방송 표준', '효율적 압축'], en: ['Great quality at low bitrates', 'Standard for streaming/broadcast', 'Efficient compression'] },
    weaknesses: { ko: ['손실 압축', '맨 AAC는 컨테이너가 단순', '구형 기기 호환 편차'], en: ['Lossy', 'Raw AAC has a bare container', 'Patchy on old devices'] },
  },
  ogg: {
    key: 'ogg', label: 'OGG', ext: 'ogg', kind: 'audio',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: '오픈소스 Vorbis 손실 포맷으로, 게임·웹에서 흔히 쓰입니다.', en: 'An open-source Vorbis lossy format common in games and on the web.' },
    strengths: { ko: ['로열티 프리·오픈', '같은 용량에 좋은 음질', '웹·게임에서 인기'], en: ['Royalty-free and open', 'Good quality per size', 'Popular on web/games'] },
    weaknesses: { ko: ['애플 기본 미지원', '일부 기기 비호환', '인지도가 MP3보다 낮음'], en: ['Not supported by Apple by default', 'Incompatible with some devices', 'Less known than MP3'] },
  },
  flac: {
    key: 'flac', label: 'FLAC', ext: 'flac', kind: 'audio',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: false,
    summary: { ko: '무손실 압축 오디오 포맷으로, 원음을 보존하면서 WAV보다 작습니다.', en: 'A lossless compressed format that preserves the original while being smaller than WAV.' },
    strengths: { ko: ['무손실인데 WAV보다 작음', '풍부한 메타데이터·태그', '음원 보관에 이상적'], en: ['Lossless yet smaller than WAV', 'Rich metadata and tags', 'Ideal for archiving music'] },
    weaknesses: { ko: ['손실 포맷보다는 큼', '일부 기기·앱 미지원', '블루투스 스트리밍 제약'], en: ['Larger than lossy formats', 'Unsupported on some devices/apps', 'Limited over Bluetooth'] },
  },

  /* ── 비디오 ── */
  mp4: {
    key: 'mp4', label: 'MP4', ext: 'mp4', kind: 'video',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '가장 범용적인 영상 컨테이너로, 거의 모든 기기·플랫폼에서 재생됩니다.', en: 'The most universal video container, playable on virtually every device and platform.' },
    strengths: { ko: ['모든 기기·SNS·웹에서 재생', '좋은 압축 효율', '업로드 표준'], en: ['Plays on every device, social and web', 'Good compression', 'The upload standard'] },
    weaknesses: { ko: ['투명 영상 미지원', '편집보다 배포용', '코덱에 따라 호환 편차'], en: ['No transparent video', 'For delivery, not editing', 'Codec-dependent compatibility'] },
  },
  webm: {
    key: 'webm', label: 'WebM', ext: 'webm', kind: 'video',
    lossy: true, transparency: true, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: '웹 최적화 오픈 영상 포맷으로, 작은 용량과 투명 영상을 지원합니다.', en: 'A web-optimized open video format with small files and transparency support.' },
    strengths: { ko: ['웹에서 가볍고 빠름', '투명 영상(알파) 지원', '로열티 프리'], en: ['Light and fast on the web', 'Supports transparent (alpha) video', 'Royalty-free'] },
    weaknesses: { ko: ['일부 기기·편집기 미지원', 'SNS 업로드 호환 편차', '사파리 구버전 제약'], en: ['Unsupported on some devices/editors', 'Patchy social upload support', 'Older Safari limits'] },
  },
  mov: {
    key: 'mov', label: 'MOV', ext: 'mov', kind: 'video',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: false,
    summary: { ko: '애플 QuickTime 영상 포맷으로, 아이폰·편집 환경에서 흔합니다.', en: "Apple's QuickTime video format, common on iPhone and in editing." },
    strengths: { ko: ['고품질 편집에 적합', '아이폰 녹화 기본', '맥 생태계 호환'], en: ['Good for high-quality editing', 'Default for iPhone recording', 'Mac ecosystem support'] },
    weaknesses: { ko: ['윈도우·웹 호환 약함', '용량이 큼', '공유엔 MP4 변환 권장'], en: ['Weak Windows/web support', 'Large files', 'Convert to MP4 to share'] },
  },
  avi: {
    key: 'avi', label: 'AVI', ext: 'avi', kind: 'video',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'large', universal: true,
    summary: { ko: '오래된 윈도우 영상 컨테이너로, 호환은 넓지만 용량이 큽니다.', en: 'An old Windows video container — broadly compatible but large.' },
    strengths: { ko: ['구형 환경 호환', '단순한 구조', '오래된 영상 보관'], en: ['Compatible with legacy systems', 'Simple structure', 'Holds older footage'] },
    weaknesses: { ko: ['용량이 비효율적으로 큼', '스트리밍 부적합', '현대 코덱 기능 부족'], en: ['Inefficiently large', 'Poor for streaming', 'Lacks modern codec features'] },
  },
  mkv: {
    key: 'mkv', label: 'MKV', ext: 'mkv', kind: 'video',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: false,
    summary: { ko: '다중 트랙·자막을 담는 유연한 오픈 컨테이너로, 고화질 보관에 인기입니다.', en: 'A flexible open container for multiple tracks and subtitles, popular for high-quality archives.' },
    strengths: { ko: ['다중 오디오·자막 트랙', '거의 모든 코덱 수용', '고화질 보관에 적합'], en: ['Multiple audio/subtitle tracks', 'Holds almost any codec', 'Great for HD archives'] },
    weaknesses: { ko: ['SNS·기기 호환 약함', '브라우저 직접 재생 제한', '공유엔 MP4 변환 권장'], en: ['Weak social/device support', 'Limited direct browser playback', 'Convert to MP4 to share'] },
  },

  /* ── 문서 ── */
  docx: {
    key: 'docx', label: 'DOCX', ext: 'docx', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: true,
    summary: { ko: '마이크로소프트 워드 문서 포맷으로, 편집 가능한 서식 문서의 표준입니다.', en: 'The Microsoft Word format — the standard for editable formatted documents.' },
    strengths: { ko: ['풍부한 서식·편집', '오피스 표준', '협업·검토에 적합'], en: ['Rich formatting and editing', 'Office standard', 'Good for collaboration'] },
    weaknesses: { ko: ['뷰어마다 레이아웃 차이', '워드 없으면 편집 제약', '배포엔 PDF가 안정적'], en: ['Layout varies by viewer', 'Needs Word to edit fully', 'PDF is safer for distribution'] },
  },
  md: {
    key: 'md', label: 'Markdown', ext: 'md', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: '경량 텍스트 서식 포맷으로, 깃허브·문서 작성에 널리 쓰입니다.', en: 'A lightweight text markup widely used on GitHub and for docs.' },
    strengths: { ko: ['읽기 쉬운 평문', '버전관리 친화', '어디서나 변환 가능'], en: ['Human-readable plain text', 'Version-control friendly', 'Converts anywhere'] },
    weaknesses: { ko: ['복잡한 레이아웃 한계', '렌더러마다 차이', '서식 표현이 제한적'], en: ['Limited for complex layout', 'Renderer differences', 'Limited formatting'] },
  },
  html: {
    key: 'html', label: 'HTML', ext: 'html', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '웹 표준 마크업으로, 브라우저에서 바로 열리는 문서 포맷입니다.', en: 'The web-standard markup that opens directly in any browser.' },
    strengths: { ko: ['모든 브라우저에서 열림', '링크·스타일·미디어 포함', '웹 게시에 최적'], en: ['Opens in every browser', 'Links, styles and media', 'Best for web publishing'] },
    weaknesses: { ko: ['인쇄·배포는 PDF가 안정적', '외부 자원 의존', '오프라인 서식 깨질 수 있음'], en: ['PDF is safer for print/share', 'Depends on external assets', 'Formatting can break offline'] },
  },
  csv: {
    key: 'csv', label: 'CSV', ext: 'csv', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '쉼표로 구분된 표 데이터 포맷으로, 거의 모든 도구가 읽습니다.', en: 'A comma-separated table format that nearly every tool can read.' },
    strengths: { ko: ['모든 스프레드시트·DB 호환', '가볍고 단순', '가져오기·내보내기 표준'], en: ['Works with every spreadsheet/DB', 'Light and simple', 'Standard for import/export'] },
    weaknesses: { ko: ['서식·수식 미보존', '중첩 데이터 표현 불가', '인코딩 이슈 가능'], en: ['No formatting/formulas', 'No nested data', 'Encoding pitfalls'] },
  },
  json: {
    key: 'json', label: 'JSON', ext: 'json', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '중첩 구조를 표현하는 데이터 포맷으로, API·설정에 표준입니다.', en: 'A data format for nested structures, standard for APIs and config.' },
    strengths: { ko: ['중첩·계층 데이터 표현', '모든 언어가 파싱', 'API·설정 표준'], en: ['Represents nested/hierarchical data', 'Parsed by every language', 'API/config standard'] },
    weaknesses: { ko: ['표 형태로 보기 불편', '용량이 CSV보다 큼', '사람이 대량 편집 어려움'], en: ['Awkward as a table', 'Larger than CSV', 'Hard to bulk-edit by hand'] },
  },
  yaml: {
    key: 'yaml', label: 'YAML', ext: 'yaml', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: '들여쓰기로 구조를 표현하는 사람이 읽기 쉬운 설정 포맷입니다.', en: 'A human-readable config format that uses indentation for structure.' },
    strengths: { ko: ['가독성이 매우 좋음', '주석 지원', 'JSON과 상호 변환'], en: ['Very readable', 'Supports comments', 'Interconverts with JSON'] },
    weaknesses: { ko: ['들여쓰기 오류에 민감', '일부 환경 미지원', '복잡해지면 모호함'], en: ['Sensitive to indentation', 'Unsupported in some stacks', 'Ambiguous when complex'] },
  },
  txt: {
    key: 'txt', label: 'TXT', ext: 'txt', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '서식 없는 평문 텍스트로, 어떤 기기에서도 열립니다.', en: 'Plain text with no formatting that opens on any device.' },
    strengths: { ko: ['완전 범용', '가볍고 단순', '깨질 일이 없음'], en: ['Universally compatible', 'Light and simple', 'Never breaks'] },
    weaknesses: { ko: ['서식·이미지 없음', '구조 표현 불가', '문서용으론 단조로움'], en: ['No formatting/images', 'No structure', 'Bare for documents'] },
  },
  epub: {
    key: 'epub', label: 'EPUB', ext: 'epub', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: false,
    summary: { ko: '전자책 표준 포맷으로, 화면 크기에 맞춰 글이 재배치됩니다.', en: 'The e-book standard whose text reflows to fit any screen size.' },
    strengths: { ko: ['화면에 맞춘 가변 레이아웃', '전자책 리더 표준', '글꼴·크기 조절'], en: ['Reflows to fit the screen', 'E-reader standard', 'Adjustable font/size'] },
    weaknesses: { ko: ['고정 레이아웃엔 부적합', '리더마다 렌더 차이', '인쇄엔 PDF가 나음'], en: ['Poor for fixed layouts', 'Renders differ by reader', 'PDF is better for print'] },
  },
};

/* ───────────────────────── 변환 정의 ───────────────────────── */

export interface Conversion {
  from: string; // FORMATS key
  to: string; // FORMATS key
  /** registry 도구 id (참고용) */
  toolId: string;
  /** 실제 도구 경로 (+ 선택적 프리필 쿼리) */
  toolHref: string;
}

const IMG_CONVERT = '/tools/image/convert';

/** image-convert 가 출력 가능한 포맷(?to= 프리필 키) */
const CONVERT_OUT: Record<string, string> = {
  jpg: 'jpeg', png: 'png', webp: 'webp', avif: 'avif',
};

function imgConvert(from: string, to: string): Conversion {
  return {
    from, to, toolId: 'image-convert',
    toolHref: `${IMG_CONVERT}?from=${from}&to=${CONVERT_OUT[to] ?? to}`,
  };
}

function audioConvert(from: string, to: string): Conversion {
  return {
    from, to, toolId: 'audio-convert',
    toolHref: `/tools/audio/convert?from=${from}&to=${to}`,
  };
}

function videoConvert(from: string, to: string): Conversion {
  return {
    from, to, toolId: 'video-convert',
    toolHref: `/tools/video/convert?from=${from}&to=${to}`,
  };
}

export const CONVERSIONS: Conversion[] = [
  // image-convert (jpg/png/webp/avif 상호 + bmp/gif 입력)
  imgConvert('png', 'jpg'),
  imgConvert('jpg', 'png'),
  imgConvert('webp', 'png'),
  imgConvert('webp', 'jpg'),
  imgConvert('png', 'webp'),
  imgConvert('jpg', 'webp'),
  imgConvert('avif', 'jpg'),
  imgConvert('avif', 'png'),
  imgConvert('jpg', 'avif'),
  imgConvert('png', 'avif'),
  imgConvert('gif', 'png'),
  imgConvert('gif', 'jpg'),
  imgConvert('bmp', 'jpg'),
  imgConvert('bmp', 'png'),
  // HEIC (전용 도구)
  { from: 'heic', to: 'jpg', toolId: 'image-heic-to-jpg', toolHref: '/tools/image/heic-to-jpg' },
  { from: 'heic', to: 'png', toolId: 'image-heic-to-jpg', toolHref: '/tools/image/heic-to-jpg' },
  // SVG 래스터화
  { from: 'svg', to: 'png', toolId: 'image-svg-to-png', toolHref: '/tools/image/svg-to-png' },
  // PDF ↔ 이미지
  { from: 'pdf', to: 'jpg', toolId: 'pdf-to-jpg', toolHref: '/tools/pdf/to-jpg' },
  { from: 'pdf', to: 'png', toolId: 'pdf-to-jpg', toolHref: '/tools/pdf/to-jpg' },
  { from: 'jpg', to: 'pdf', toolId: 'pdf-from-jpg', toolHref: '/tools/pdf/from-jpg' },
  { from: 'png', to: 'pdf', toolId: 'pdf-from-jpg', toolHref: '/tools/pdf/from-jpg' },

  // 오디오 (audio-convert, ?to= 프리필)
  audioConvert('m4a', 'mp3'),
  audioConvert('wav', 'mp3'),
  audioConvert('flac', 'mp3'),
  audioConvert('aac', 'mp3'),
  audioConvert('ogg', 'mp3'),
  audioConvert('mp3', 'wav'),
  audioConvert('m4a', 'wav'),
  audioConvert('flac', 'wav'),
  audioConvert('wav', 'flac'),
  audioConvert('mp3', 'm4a'),
  // 영상에서 오디오 추출
  { from: 'mp4', to: 'mp3', toolId: 'audio-from-video', toolHref: '/tools/audio/from-video' },

  // 비디오 (video-convert, ?to= 프리필)
  videoConvert('mov', 'mp4'),
  videoConvert('mkv', 'mp4'),
  videoConvert('avi', 'mp4'),
  videoConvert('webm', 'mp4'),
  videoConvert('mp4', 'webm'),
  videoConvert('mp4', 'mov'),
  // 영상 → GIF
  { from: 'mp4', to: 'gif', toolId: 'video-to-gif', toolHref: '/tools/video/to-gif' },
  { from: 'webm', to: 'gif', toolId: 'video-to-gif', toolHref: '/tools/video/to-gif' },

  // 문서
  { from: 'docx', to: 'pdf', toolId: 'docx-to-pdf', toolHref: '/tools/docs/docx-to-pdf' },
  { from: 'docx', to: 'md', toolId: 'docx-to-md', toolHref: '/tools/docs/docx-to-md' },
  { from: 'md', to: 'html', toolId: 'md-html', toolHref: '/tools/docs/md-html' },
  { from: 'html', to: 'pdf', toolId: 'html-to-pdf', toolHref: '/tools/docs/html-to-pdf' },
  { from: 'epub', to: 'pdf', toolId: 'epub-to-pdf', toolHref: '/tools/docs/epub-to-pdf' },
  { from: 'md', to: 'epub', toolId: 'md-to-epub', toolHref: '/tools/docs/md-to-epub' },
  { from: 'csv', to: 'json', toolId: 'csv-json', toolHref: '/tools/docs/csv-json' },
  { from: 'json', to: 'csv', toolId: 'csv-json', toolHref: '/tools/docs/csv-json' },
  { from: 'yaml', to: 'json', toolId: 'yaml-json', toolHref: '/tools/docs/yaml-json' },
];

export function conversionSlug(c: Conversion): string {
  return `${c.from}-to-${c.to}`;
}

export const CONVERT_SLUGS: string[] = CONVERSIONS.map(conversionSlug);

export function getConversion(slug: string): Conversion | undefined {
  return CONVERSIONS.find((c) => conversionSlug(c) === slug);
}

/** 같은 from 또는 같은 to 를 공유하는 관련 변환(내부 링크용). */
export function relatedConversions(c: Conversion, limit = 6): Conversion[] {
  const self = conversionSlug(c);
  return CONVERSIONS.filter((o) => {
    if (conversionSlug(o) === self) return false;
    return o.from === c.from || o.to === c.to || o.from === c.to || o.to === c.from;
  }).slice(0, limit);
}

/** 특정 도구 id 를 CTA 로 쓰는 변환들 (도구 페이지 → 변환 페이지 역링크). */
export function convertsForTool(toolId: string): Conversion[] {
  return CONVERSIONS.filter((c) => c.toolId === toolId);
}

/** 변환의 대표 카테고리 (OG 이미지·사이트맵 우선순위용). */
export function conversionCategory(from: FormatFact, to: FormatFact): ToolCategory {
  if (from.kind === 'video' || to.kind === 'video') return 'video';
  if (from.kind === 'audio' || to.kind === 'audio') return 'audio';
  if (from.key === 'pdf' || to.key === 'pdf') return 'pdf';
  if (from.kind === 'document' || to.kind === 'document') return 'docs';
  return 'image';
}

/* ───────────────────────── 콘텐츠 생성기 ───────────────────────── */

export interface ConversionContent {
  category: ToolCategory;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  intro: string;
  fromFact: FormatFact;
  toFact: FormatFact;
  /** "무엇이 바뀌나" 항목 */
  changes: string[];
  ctaLabel: string;
  faqs: Array<{ q: string; a: string }>;
}

const T = {
  ko: {
    titleSuffix: '변환 — 무료, 브라우저에서',
    h1: (f: string, t: string) => `${f} → ${t} 변환`,
    cta: (f: string, t: string) => `${f}를 ${t}로 변환하기`,
    aboutFrom: '원본 포맷',
    aboutTo: '대상 포맷',
    whatChanges: '변환하면 무엇이 바뀌나',
    privacyQ: '파일이 서버로 전송되나요?',
    privacyA:
      '아니요. 변환은 전부 브라우저 안에서 처리되며, 올린 파일은 기기를 벗어나지 않습니다. 민감한 사진·문서도 안전합니다.',
    batchQ: '여러 파일을 한 번에 변환할 수 있나요?',
    batchA: '네. 여러 파일을 한 번에 올려 일괄 변환하고 결과를 묶어 내려받을 수 있습니다.',
    freeQ: '무료인가요? 설치가 필요한가요?',
    freeA: '완전 무료이며 회원가입·설치가 필요 없습니다. 브라우저에서 바로 동작합니다.',
  },
  en: {
    titleSuffix: 'Converter — Free, in Your Browser',
    h1: (f: string, t: string) => `Convert ${f} to ${t}`,
    cta: (f: string, t: string) => `Convert ${f} to ${t}`,
    aboutFrom: 'Source format',
    aboutTo: 'Target format',
    whatChanges: 'What changes when you convert',
    privacyQ: 'Are my files uploaded to a server?',
    privacyA:
      'No. The conversion runs entirely in your browser, and your files never leave your device — safe even for private photos and documents.',
    batchQ: 'Can I convert multiple files at once?',
    batchA: 'Yes. Drop several files to batch-convert them and download the results together.',
    freeQ: 'Is it free? Do I need to install anything?',
    freeA: 'Completely free with no sign-up or installation. It works right in your browser.',
  },
} as const;

/** 두 포맷의 차이에서 "무엇이 바뀌나" 항목을 도출. */
function deriveChanges(from: FormatFact, to: FormatFact, lang: Lang): string[] {
  const out: string[] = [];
  const ko = lang === 'ko';

  // 영상 → 오디오: 트랙 추출
  if (from.kind === 'video' && to.kind === 'audio') {
    out.push(ko
      ? '영상에서 소리(오디오 트랙)만 추출되고 화면은 제거됩니다.'
      : 'Only the audio track is extracted; the video is discarded.');
  }
  // 영상 → GIF
  if (from.kind === 'video' && to.key === 'gif') {
    out.push(ko
      ? '소리는 사라지고 짧은 무음 애니메이션(GIF)으로 바뀝니다. 길이·해상도를 줄여야 용량이 작습니다.'
      : 'Audio is dropped and it becomes a short silent animation (GIF). Trim length and size to keep it small.');
  }
  // 문서 → PDF: 레이아웃 고정
  if (to.key === 'pdf' && from.kind === 'document') {
    out.push(ko
      ? '편집 가능한 문서가 레이아웃이 고정된 PDF가 되어 어디서나 똑같이 보입니다.'
      : 'An editable document becomes a fixed-layout PDF that looks identical everywhere.');
  }

  if (from.transparency && !to.transparency) {
    out.push(ko
      ? `투명 배경이 ${to.label}에서 흰색(또는 단색)으로 채워집니다.`
      : `Transparency is filled with white (or a solid color) in ${to.label}.`);
  }
  if (from.animation && !to.animation) {
    out.push(ko
      ? '애니메이션은 첫 프레임의 정지 이미지로 바뀝니다.'
      : 'Animation collapses to a single still frame.');
  }
  if (from.vector && !to.vector) {
    out.push(ko
      ? '벡터가 지정한 해상도의 픽셀로 래스터화됩니다 — 더 키우려면 높은 해상도로 내보내세요.'
      : 'The vector is rasterized to fixed pixels — export at a higher resolution if you need to scale up.');
  }
  if (!from.lossy && to.lossy) {
    out.push(ko
      ? '재인코딩으로 약간의 손실이 생길 수 있으나, 높은 품질 설정에선 거의 눈에 띄지 않습니다.'
      : 'Re-encoding adds a small quality loss that is hard to notice at high quality settings.');
  }
  if (from.lossy && !to.lossy) {
    out.push(ko
      ? `${to.label}는 무손실이라 이후 추가 손실은 없지만, 이미 손실된 ${from.label}의 데이터가 복원되진 않습니다.`
      : `${to.label} is lossless so there is no further loss, though it cannot restore data already lost in ${from.label}.`);
  }
  // 용량 변화
  const wOrder = { small: 0, medium: 1, large: 2 } as const;
  if (wOrder[to.weight] < wOrder[from.weight]) {
    out.push(ko ? '대체로 파일 용량이 줄어듭니다.' : 'Files usually get smaller.');
  } else if (wOrder[to.weight] > wOrder[from.weight]) {
    out.push(ko ? '대체로 파일 용량이 커집니다.' : 'Files usually get larger.');
  }
  // 호환성 변화
  if (!from.universal && to.universal) {
    out.push(ko
      ? `${to.label}는 거의 모든 기기·앱·웹에서 열려 공유·업로드가 쉬워집니다.`
      : `${to.label} opens on virtually every device, app and website, making sharing and uploading easy.`);
  }
  if (from.universal && !to.universal) {
    out.push(ko
      ? `${to.label}는 호환 범위가 좁아 구형 환경에선 안 열릴 수 있습니다.`
      : `${to.label} has narrower support and may not open in older environments.`);
  }
  if (out.length === 0) {
    out.push(ko
      ? '두 포맷의 특성이 비슷해 큰 변화 없이 포맷만 바뀝니다.'
      : 'The two formats are similar, so only the container changes with little visible difference.');
  }
  return out;
}

export function buildConversionContent(c: Conversion, lang: Lang): ConversionContent {
  const from = FORMATS[c.from];
  const to = FORMATS[c.to];
  const t = T[lang];
  const ko = lang === 'ko';
  const F = from.label;
  const To = to.label;
  const category: ToolCategory = conversionCategory(from, to);

  const title = ko
    ? `${F} → ${To} ${t.titleSuffix}`
    : `${F} to ${To} ${t.titleSuffix}`;

  const description = ko
    ? `${F}를 ${To}로 무료 변환하세요. ${to.summary.ko} 업로드 없이 브라우저에서 처리됩니다.`
    : `Convert ${F} to ${To} for free. ${to.summary.en} Runs in your browser with no upload.`;

  const intro = ko
    ? `${from.summary.ko} ${to.summary.ko} ${F}를 ${To}로 바꾸면 ${
        !from.universal && to.universal
          ? '호환성이 크게 넓어져 어디서나 열 수 있습니다.'
          : to.weight === 'small' && from.weight !== 'small'
            ? '파일이 가벼워져 업로드·공유가 빨라집니다.'
            : '용도에 맞는 포맷으로 정리됩니다.'
      } 모든 변환은 브라우저 안에서 끝나 파일이 서버로 올라가지 않습니다.`
    : `${from.summary.en} ${to.summary.en} Converting ${F} to ${To} ${
        !from.universal && to.universal
          ? 'greatly widens compatibility so it opens anywhere.'
          : to.weight === 'small' && from.weight !== 'small'
            ? 'makes files lighter and faster to upload or share.'
            : 'gives you the right format for the job.'
      } Every conversion finishes inside your browser — files are never uploaded.`;

  const keywords = ko
    ? [`${c.from} ${c.to} 변환`, `${F} ${To}`, `${c.from} to ${c.to}`, `${F} 변환`, '무료 변환', '온라인 변환', '업로드 없음']
    : [`${c.from} to ${c.to}`, `convert ${c.from} to ${c.to}`, `${F} to ${To} converter`, `${c.from}2${c.to}`, 'free', 'online', 'no upload'];

  const faqs: Array<{ q: string; a: string }> = [];
  // 1) 품질
  if (!from.lossy && to.lossy) {
    faqs.push({
      q: ko ? `${F}를 ${To}로 바꾸면 품질이 떨어지나요?` : `Does converting ${F} to ${To} lose quality?`,
      a: ko
        ? `${To}는 손실 압축이라 약간의 품질 저하가 있을 수 있지만, 높은 품질 설정에선 차이를 알아채기 어렵습니다.`
        : `${To} uses lossy compression so there is a slight drop, but at high quality settings it is hard to notice.`,
    });
  } else if (from.lossy && !to.lossy) {
    faqs.push({
      q: ko ? `${To}로 바꾸면 화질이 좋아지나요?` : `Does converting to ${To} improve quality?`,
      a: ko
        ? `이미 손실된 데이터는 복원되지 않습니다. 다만 ${To}는 무손실이라 이후 저장에서 추가 손실은 없습니다.`
        : `It cannot restore data already lost, but ${To} is lossless so no further quality is lost on save.`,
    });
  } else {
    faqs.push({
      q: ko ? `${F}를 ${To}로 바꾸면 품질이 유지되나요?` : `Is quality preserved from ${F} to ${To}?`,
      a: ko
        ? `네. 두 포맷 모두 ${from.lossy ? '동일 수준의 압축' : '무손실'}이라 눈에 띄는 품질 변화 없이 변환됩니다.`
        : `Yes. Both are ${from.lossy ? 'similarly compressed' : 'lossless'}, so it converts with no noticeable change.`,
    });
  }
  // 2) 투명/특성 FAQ (해당 시)
  if (from.transparency && !to.transparency) {
    faqs.push({
      q: ko ? '투명 배경은 어떻게 되나요?' : 'What happens to the transparent background?',
      a: ko
        ? `${To}는 투명도를 지원하지 않아 투명 영역이 단색(기본 흰색)으로 채워집니다. 투명도가 필요하면 PNG·WebP를 쓰세요.`
        : `${To} does not support transparency, so transparent areas are filled with a solid color (white by default). Use PNG or WebP if you need transparency.`,
    });
  }
  // 3) 프라이버시 + 4) 무료/일괄
  faqs.push({ q: t.privacyQ, a: t.privacyA });
  const BATCH_TOOLS = new Set(['image-convert', 'audio-convert', 'image-heic-to-jpg']);
  faqs.push(BATCH_TOOLS.has(c.toolId)
    ? { q: t.batchQ, a: t.batchA }
    : { q: t.freeQ, a: t.freeA });

  return {
    category,
    title,
    h1: t.h1(F, To),
    description,
    keywords,
    intro,
    fromFact: from,
    toFact: to,
    changes: deriveChanges(from, to, lang),
    ctaLabel: t.cta(F, To),
    faqs,
  };
}

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

export type Lang = 'ko' | 'en' | 'ja' | 'zh';

/* ───────────────────────── 포맷 사실(facts) ───────────────────────── */

interface Bi {
  ko: string;
  en: string;
  ja: string;
  zh: string;
}
interface BiList {
  ko: string[];
  en: string[];
  ja: string[];
  zh: string[];
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
      ja: '写真に最適化された非可逆圧縮フォーマットで、ほぼあらゆる環境で開けます。',
      zh: '针对照片优化的有损压缩格式，几乎可在任何环境中打开。',
    },
    strengths: {
      ko: ['사진에서 매우 작은 용량', '모든 기기·앱·웹·프린터 지원', '품질 대비 용량 조절 가능'],
      en: ['Tiny files for photographs', 'Supported by every device, app, web and printer', 'Adjustable quality vs size'],
      ja: ['写真ならファイルが非常に小さい', 'あらゆる端末・アプリ・Web・プリンターに対応', '画質と容量のバランスを調整可能'],
      zh: ['照片文件非常小', '支持所有设备、应用、网页和打印机', '可调节画质与体积的平衡'],
    },
    weaknesses: {
      ko: ['손실 압축 — 텍스트·경계가 뭉개짐', '투명 배경 미지원', '반복 저장 시 화질 누적 저하'],
      en: ['Lossy — smears text and sharp edges', 'No transparency', 'Quality degrades on repeated saves'],
      ja: ['非可逆圧縮 — 文字や輪郭がにじむ', '透明背景に非対応', '繰り返し保存で画質が劣化する'],
      zh: ['有损压缩 — 文字和边缘会发糊', '不支持透明背景', '反复保存会累积画质下降'],
    },
  },
  png: {
    key: 'png', label: 'PNG', ext: 'png', kind: 'image',
    lossy: false, transparency: true, animation: false, vector: false,
    weight: 'large', universal: true,
    summary: {
      ko: '투명도를 지원하는 무손실 포맷으로, 로고·스크린샷·아이콘에 적합합니다.',
      en: 'A lossless format with transparency, ideal for logos, screenshots and icons.',
      ja: '透明度に対応した可逆圧縮フォーマットで、ロゴ・スクリーンショット・アイコンに最適です。',
      zh: '支持透明度的无损压缩格式，最适合徽标、截图和图标。',
    },
    strengths: {
      ko: ['무손실 — 압축 아티팩트 없음', '투명 배경(알파) 지원', '텍스트·경계가 선명'],
      en: ['Lossless — no compression artifacts', 'Supports transparency (alpha)', 'Crisp edges and text'],
      ja: ['可逆圧縮 — 圧縮ノイズが出ない', '透明背景(アルファ)に対応', '文字や輪郭がくっきり'],
      zh: ['无损压缩 — 没有压缩噪点', '支持透明背景（Alpha）', '文字和边缘清晰锐利'],
    },
    weaknesses: {
      ko: ['사진은 용량이 매우 큼', 'WebP·AVIF보다 비효율', '애니메이션 미지원(APNG 예외)'],
      en: ['Very large for photographs', 'Less efficient than WebP/AVIF', 'No animation (except APNG)'],
      ja: ['写真ではファイルが非常に大きい', 'WebP・AVIFより非効率', 'アニメーション非対応(APNGを除く)'],
      zh: ['照片文件非常大', '效率不如 WebP·AVIF', '不支持动画（APNG 除外）'],
    },
  },
  webp: {
    key: 'webp', label: 'WebP', ext: 'webp', kind: 'image',
    lossy: true, transparency: true, animation: true, vector: false,
    weight: 'small', universal: false,
    summary: {
      ko: '투명도·애니메이션을 지원하면서 PNG·JPG보다 작은 현대 웹 포맷입니다.',
      en: 'A modern web format that is smaller than PNG/JPG while supporting transparency and animation.',
      ja: '透明度やアニメーションに対応しつつ、PNG・JPGより小さい最新のWeb向けフォーマットです。',
      zh: '在支持透明度和动画的同时，比 PNG·JPG 更小的现代 Web 格式。',
    },
    strengths: {
      ko: ['같은 화질에 더 작은 용량', '투명도·애니메이션 지원', '모든 최신 브라우저 지원'],
      en: ['Smaller files at the same quality', 'Supports transparency and animation', 'Supported by all modern browsers'],
      ja: ['同じ画質でより小さい容量', '透明度・アニメーションに対応', '最新ブラウザすべてに対応'],
      zh: ['同等画质下文件更小', '支持透明度和动画', '所有现代浏览器都支持'],
    },
    weaknesses: {
      ko: ['아주 오래된 소프트웨어 미지원', '일부 인쇄 워크플로와 비호환', '편집 툴 호환이 PNG보다 좁음'],
      en: ['Unsupported by very old software', 'Not ideal for some print workflows', 'Narrower editor support than PNG'],
      ja: ['ごく古いソフトでは非対応', '一部の印刷ワークフローに不向き', '対応する編集ツールがPNGより少ない'],
      zh: ['极旧的软件不支持', '不适合部分印刷工作流', '编辑工具支持比 PNG 少'],
    },
  },
  avif: {
    key: 'avif', label: 'AVIF', ext: 'avif', kind: 'image',
    lossy: true, transparency: true, animation: true, vector: false,
    weight: 'small', universal: false,
    summary: {
      ko: 'AV1 기반의 차세대 포맷으로, 동일 화질에서 가장 작은 용량을 냅니다.',
      en: 'An AV1-based next-gen format that produces the smallest files at a given quality.',
      ja: 'AV1ベースの次世代フォーマットで、同じ画質なら最も小さいファイルになります。',
      zh: '基于 AV1 的新一代格式，同等画质下文件最小。',
    },
    strengths: {
      ko: ['최고 수준의 압축 효율', '넓은 색영역·HDR', '투명도 지원'],
      en: ['Best-in-class compression', 'Wide color gamut and HDR', 'Supports transparency'],
      ja: ['最高水準の圧縮効率', '広色域・HDRに対応', '透明度に対応'],
      zh: ['顶尖的压缩效率', '广色域和 HDR', '支持透明度'],
    },
    weaknesses: {
      ko: ['구형 브라우저·앱 미지원', '인코딩이 느릴 수 있음', '편집 도구 지원이 제한적'],
      en: ['Unsupported on older browsers/apps', 'Encoding can be slow', 'Limited editor support'],
      ja: ['古いブラウザ・アプリでは非対応', 'エンコードが遅いことがある', '対応する編集ツールが限られる'],
      zh: ['旧浏览器和应用不支持', '编码可能较慢', '编辑工具支持有限'],
    },
  },
  gif: {
    key: 'gif', label: 'GIF', ext: 'gif', kind: 'image',
    lossy: false, transparency: true, animation: true, vector: false,
    weight: 'large', universal: true,
    summary: {
      ko: '256색 한정의 오래된 애니메이션 포맷으로, 짧은 루프 영상에 흔히 쓰입니다.',
      en: 'An old 256-color animation format commonly used for short looping clips.',
      ja: '256色に限られた古いアニメーション形式で、短いループ動画によく使われます。',
      zh: '限于 256 色的老式动画格式，常用于短循环动图。',
    },
    strengths: {
      ko: ['어디서나 재생되는 애니메이션', '단순 투명도 지원', '폭넓은 호환'],
      en: ['Animation that plays anywhere', 'Simple transparency', 'Broad compatibility'],
      ja: ['どこでも再生できるアニメーション', '単純な透明度に対応', '幅広い互換性'],
      zh: ['随处可播放的动画', '支持简单透明度', '兼容性广泛'],
    },
    weaknesses: {
      ko: ['256색 한정 — 사진에 부적합', '같은 영상이 WebP·MP4보다 큼', '경계 색번짐'],
      en: ['Limited to 256 colors — poor for photos', 'Larger than WebP/MP4 for the same clip', 'Color banding'],
      ja: ['256色まで — 写真には不向き', '同じ動画でもWebP・MP4より大きい', '色の段差(バンディング)が出る'],
      zh: ['仅限 256 色 — 不适合照片', '同样的动图比 WebP·MP4 更大', '出现色带'],
    },
  },
  bmp: {
    key: 'bmp', label: 'BMP', ext: 'bmp', kind: 'image',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'large', universal: true,
    summary: {
      ko: '비압축 비트맵 포맷으로 용량이 매우 크며, 보통 다른 포맷으로 바꿔 씁니다.',
      en: 'An uncompressed bitmap format with very large files, usually converted to something else.',
      ja: '無圧縮のビットマップ形式でファイルが非常に大きく、通常は別の形式に変換して使います。',
      zh: '无压缩的位图格式，文件非常大，通常会转换为其他格式使用。',
    },
    strengths: {
      ko: ['완전 무손실', '구조가 단순', '구형 윈도우 호환'],
      en: ['Fully lossless', 'Simple structure', 'Legacy Windows compatibility'],
      ja: ['完全に可逆(無劣化)', '構造がシンプル', '古いWindowsと互換'],
      zh: ['完全无损（无劣化）', '结构简单', '兼容旧版 Windows'],
    },
    weaknesses: {
      ko: ['용량이 비효율적으로 큼', '투명도·애니메이션 미지원', '웹에서 거의 안 씀'],
      en: ['Inefficiently large', 'No transparency or animation', 'Rarely used on the web'],
      ja: ['容量が無駄に大きい', '透明度・アニメーション非対応', 'Webではほとんど使われない'],
      zh: ['体积冗余庞大', '不支持透明度和动画', 'Web 上几乎不使用'],
    },
  },
  heic: {
    key: 'heic', label: 'HEIC', ext: 'heic', kind: 'image',
    lossy: true, transparency: true, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: {
      ko: '아이폰 기본 고효율 포맷으로 용량은 작지만 다른 환경에서 호환이 약합니다.',
      en: "The iPhone's default high-efficiency format — small files but poor support elsewhere.",
      ja: 'iPhone標準の高効率フォーマットで、容量は小さいものの他環境での互換性が弱いです。',
      zh: 'iPhone 默认的高效格式，体积虽小但在其他环境中兼容性较弱。',
    },
    strengths: {
      ko: ['JPG의 약 절반 용량', '높은 비트심도·HDR', '최신 아이폰 기본값'],
      en: ['Roughly half the size of JPG', 'High bit depth and HDR', 'Default on modern iPhones'],
      ja: ['JPGの約半分の容量', '高ビット深度・HDRに対応', '最新iPhoneの標準形式'],
      zh: ['约为 JPG 一半的体积', '高位深和 HDR', '新款 iPhone 的默认格式'],
    },
    weaknesses: {
      ko: ['윈도우·웹·구형 앱 호환 약함', '공유하려면 변환 필요', '편집 지원 제한적'],
      en: ['Poor support on Windows, web and old apps', 'Needs converting to share', 'Limited editor support'],
      ja: ['Windows・Web・古いアプリで互換性が弱い', '共有には変換が必要', '対応する編集環境が限られる'],
      zh: ['在 Windows、Web 和旧应用上兼容性弱', '分享前需要转换', '编辑支持有限'],
    },
  },
  svg: {
    key: 'svg', label: 'SVG', ext: 'svg', kind: 'image',
    lossy: false, transparency: true, animation: false, vector: true,
    weight: 'small', universal: false,
    summary: {
      ko: '해상도에 무관하게 선명한 벡터 포맷으로, 로고·아이콘·도형에 적합합니다.',
      en: 'A resolution-independent vector format ideal for logos, icons and shapes.',
      ja: '解像度に依存せず鮮明なベクター形式で、ロゴ・アイコン・図形に最適です。',
      zh: '与分辨率无关、始终清晰的矢量格式，最适合徽标、图标和图形。',
    },
    strengths: {
      ko: ['어떤 크기로도 무한 선명', '용량이 작음(단순 도형)', '코드로 편집 가능'],
      en: ['Infinitely sharp at any size', 'Small files for simple shapes', 'Editable as code'],
      ja: ['どんなサイズでも無限に鮮明', '単純な図形ならファイルが小さい', 'コードとして編集できる'],
      zh: ['任意尺寸都无限清晰', '简单图形文件很小', '可作为代码编辑'],
    },
    weaknesses: {
      ko: ['사진 표현 불가', '일부 앱·문서에서 미지원', '복잡한 그래픽은 무거움'],
      en: ['Cannot represent photographs', 'Unsupported in some apps/documents', 'Heavy for complex graphics'],
      ja: ['写真は表現できない', '一部のアプリ・文書で非対応', '複雑な図は重くなる'],
      zh: ['无法表现照片', '部分应用和文档不支持', '复杂图形会变得很重'],
    },
  },
  pdf: {
    key: 'pdf', label: 'PDF', ext: 'pdf', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: true,
    summary: {
      ko: '레이아웃을 고정해 어디서나 동일하게 보이는 문서 포맷입니다.',
      en: 'A document format that locks layout so it looks identical everywhere.',
      ja: 'レイアウトを固定し、どこで開いても同じ見た目になる文書フォーマットです。',
      zh: '固定版式、在任何地方打开都呈现相同外观的文档格式。',
    },
    strengths: {
      ko: ['모든 기기에서 동일한 레이아웃', '여러 페이지를 한 파일로', '공유·인쇄·보관에 표준'],
      en: ['Identical layout on every device', 'Many pages in one file', 'Standard for sharing, printing, archiving'],
      ja: ['あらゆる端末で同じレイアウト', '複数ページを1ファイルに', '共有・印刷・保管の標準'],
      zh: ['在所有设备上版式一致', '多页合为一个文件', '分享、打印、归档的标准'],
    },
    weaknesses: {
      ko: ['이미지처럼 바로 편집 어려움', '낱장 이미지로 쓰려면 변환 필요', '텍스트 추출이 까다로울 수 있음'],
      en: ['Hard to edit like an image', 'Needs converting to use as standalone images', 'Text extraction can be tricky'],
      ja: ['画像のように直接編集しにくい', '個別画像として使うには変換が必要', 'テキスト抽出が難しいことがある'],
      zh: ['不像图片那样可直接编辑', '作为单张图片使用需先转换', '文字提取可能比较麻烦'],
    },
  },

  /* ── 오디오 ── */
  mp3: {
    key: 'mp3', label: 'MP3', ext: 'mp3', kind: 'audio',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '가장 널리 쓰이는 손실 오디오 포맷으로, 어디서나 재생됩니다.', en: 'The most widely used lossy audio format that plays everywhere.', ja: '最も広く使われる非可逆オーディオ形式で、どこでも再生できます。', zh: '使用最广泛的有损音频格式，随处可播放。' },
    strengths: { ko: ['모든 기기·앱에서 재생', '작은 용량', '비트레이트 조절 가능'], en: ['Plays on every device and app', 'Small files', 'Adjustable bitrate'], ja: ['あらゆる端末・アプリで再生', '小さい容量', 'ビットレートを調整可能'], zh: ['所有设备和应用都能播放', '体积小', '可调节比特率'] },
    weaknesses: { ko: ['손실 압축 — 원본보다 음질 저하', '무손실 보관에 부적합', '메타데이터가 제한적'], en: ['Lossy — quality below the original', 'Not for lossless archiving', 'Limited metadata'], ja: ['非可逆 — 原音より音質が落ちる', '可逆保存には不向き', 'メタデータが限られる'], zh: ['有损 — 音质低于原始音频', '不适合无损归档', '元数据有限'] },
  },
  wav: {
    key: 'wav', label: 'WAV', ext: 'wav', kind: 'audio',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'large', universal: true,
    summary: { ko: '비압축 무손실 오디오 포맷으로, 편집·마스터링에 적합합니다.', en: 'An uncompressed lossless audio format ideal for editing and mastering.', ja: '無圧縮・可逆のオーディオ形式で、編集やマスタリングに適しています。', zh: '无压缩无损音频格式，适合编辑和母带处理。' },
    strengths: { ko: ['완전 무손실 원음', '편집 워크플로 표준', '폭넓은 호환'], en: ['Fully lossless audio', 'Standard for editing workflows', 'Broad compatibility'], ja: ['完全に可逆な原音', '編集ワークフローの標準', '幅広い互換性'], zh: ['完全无损的原始音频', '编辑工作流的标准', '兼容性广泛'] },
    weaknesses: { ko: ['용량이 매우 큼', '스트리밍·공유엔 비효율', '메타데이터 빈약'], en: ['Very large files', 'Inefficient for streaming/sharing', 'Sparse metadata'], ja: ['容量が非常に大きい', 'ストリーミング・共有には非効率', 'メタデータが乏しい'], zh: ['文件非常大', '不适合流媒体和分享', '元数据稀少'] },
  },
  m4a: {
    key: 'm4a', label: 'M4A', ext: 'm4a', kind: 'audio',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: 'AAC 기반 애플 생태계 오디오 포맷으로, MP3보다 효율적입니다.', en: "An AAC-based audio format from Apple's ecosystem, more efficient than MP3.", ja: 'AACベースのApple系オーディオ形式で、MP3より効率的です。', zh: '基于 AAC 的苹果生态音频格式，比 MP3 更高效。' },
    strengths: { ko: ['MP3보다 같은 용량에 좋은 음질', '아이튠즈·애플 기기 기본', '챕터·메타데이터 지원'], en: ['Better quality than MP3 at the same size', 'Default on iTunes/Apple devices', 'Supports chapters and metadata'], ja: ['同じ容量でMP3より良い音質', 'iTunes・Apple端末の標準', 'チャプター・メタデータに対応'], zh: ['同等体积下音质优于 MP3', 'iTunes 和苹果设备的默认格式', '支持章节和元数据'] },
    weaknesses: { ko: ['일부 구형 기기 비호환', 'MP3만큼 범용은 아님', '편집 도구 지원이 좁음'], en: ['Incompatible with some old devices', 'Less universal than MP3', 'Narrower editor support'], ja: ['一部の古い端末で非互換', 'MP3ほど汎用的ではない', '対応する編集ツールが少ない'], zh: ['部分旧设备不兼容', '不如 MP3 通用', '编辑工具支持较少'] },
  },
  aac: {
    key: 'aac', label: 'AAC', ext: 'aac', kind: 'audio',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: 'MP3의 후속 손실 포맷으로, 낮은 비트레이트에서 음질이 좋습니다.', en: 'A successor to MP3 with better quality at low bitrates.', ja: 'MP3の後継となる非可逆形式で、低ビットレートでも音質が良好です。', zh: 'MP3 的后继有损格式，在低比特率下音质良好。' },
    strengths: { ko: ['낮은 비트레이트에서 우수한 음질', '스트리밍·방송 표준', '효율적 압축'], en: ['Great quality at low bitrates', 'Standard for streaming/broadcast', 'Efficient compression'], ja: ['低ビットレートでも優れた音質', 'ストリーミング・放送の標準', '効率的な圧縮'], zh: ['低比特率下音质优秀', '流媒体和广播的标准', '压缩高效'] },
    weaknesses: { ko: ['손실 압축', '맨 AAC는 컨테이너가 단순', '구형 기기 호환 편차'], en: ['Lossy', 'Raw AAC has a bare container', 'Patchy on old devices'], ja: ['非可逆圧縮', '生のAACはコンテナが簡素', '古い端末では互換性にばらつき'], zh: ['有损压缩', '裸 AAC 容器较简陋', '旧设备兼容性参差不齐'] },
  },
  ogg: {
    key: 'ogg', label: 'OGG', ext: 'ogg', kind: 'audio',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: '오픈소스 Vorbis 손실 포맷으로, 게임·웹에서 흔히 쓰입니다.', en: 'An open-source Vorbis lossy format common in games and on the web.', ja: 'オープンソースのVorbis系非可逆形式で、ゲームやWebでよく使われます。', zh: '开源的 Vorbis 有损格式，常用于游戏和 Web。' },
    strengths: { ko: ['로열티 프리·오픈', '같은 용량에 좋은 음질', '웹·게임에서 인기'], en: ['Royalty-free and open', 'Good quality per size', 'Popular on web/games'], ja: ['ロイヤリティフリーでオープン', '同じ容量で良い音質', 'Web・ゲームで人気'], zh: ['免版税且开放', '同等体积下音质好', '在 Web 和游戏中流行'] },
    weaknesses: { ko: ['애플 기본 미지원', '일부 기기 비호환', '인지도가 MP3보다 낮음'], en: ['Not supported by Apple by default', 'Incompatible with some devices', 'Less known than MP3'], ja: ['Apple標準では非対応', '一部の端末で非互換', 'MP3より知名度が低い'], zh: ['苹果默认不支持', '部分设备不兼容', '知名度低于 MP3'] },
  },
  flac: {
    key: 'flac', label: 'FLAC', ext: 'flac', kind: 'audio',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: false,
    summary: { ko: '무손실 압축 오디오 포맷으로, 원음을 보존하면서 WAV보다 작습니다.', en: 'A lossless compressed format that preserves the original while being smaller than WAV.', ja: '可逆圧縮のオーディオ形式で、原音を保ちながらWAVより小さくなります。', zh: '无损压缩音频格式，在保留原音的同时比 WAV 更小。' },
    strengths: { ko: ['무손실인데 WAV보다 작음', '풍부한 메타데이터·태그', '음원 보관에 이상적'], en: ['Lossless yet smaller than WAV', 'Rich metadata and tags', 'Ideal for archiving music'], ja: ['可逆なのにWAVより小さい', '豊富なメタデータ・タグ', '音源の保管に最適'], zh: ['无损却比 WAV 更小', '元数据和标签丰富', '最适合归档音乐'] },
    weaknesses: { ko: ['손실 포맷보다는 큼', '일부 기기·앱 미지원', '블루투스 스트리밍 제약'], en: ['Larger than lossy formats', 'Unsupported on some devices/apps', 'Limited over Bluetooth'], ja: ['非可逆形式よりは大きい', '一部の端末・アプリで非対応', 'Bluetooth再生に制約'], zh: ['比有损格式大', '部分设备和应用不支持', '蓝牙播放受限'] },
  },

  /* ── 비디오 ── */
  mp4: {
    key: 'mp4', label: 'MP4', ext: 'mp4', kind: 'video',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '가장 범용적인 영상 컨테이너로, 거의 모든 기기·플랫폼에서 재생됩니다.', en: 'The most universal video container, playable on virtually every device and platform.', ja: '最も汎用的な動画コンテナで、ほぼあらゆる端末・プラットフォームで再生できます。', zh: '最通用的视频容器，几乎可在所有设备和平台上播放。' },
    strengths: { ko: ['모든 기기·SNS·웹에서 재생', '좋은 압축 효율', '업로드 표준'], en: ['Plays on every device, social and web', 'Good compression', 'The upload standard'], ja: ['あらゆる端末・SNS・Webで再生', '良好な圧縮効率', 'アップロードの標準'], zh: ['所有设备、社交平台和 Web 都能播放', '压缩效率好', '上传的标准格式'] },
    weaknesses: { ko: ['투명 영상 미지원', '편집보다 배포용', '코덱에 따라 호환 편차'], en: ['No transparent video', 'For delivery, not editing', 'Codec-dependent compatibility'], ja: ['透明動画は非対応', '編集より配信向け', 'コーデック次第で互換性に差'], zh: ['不支持透明视频', '适合分发而非编辑', '兼容性因编解码器而异'] },
  },
  webm: {
    key: 'webm', label: 'WebM', ext: 'webm', kind: 'video',
    lossy: true, transparency: true, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: '웹 최적화 오픈 영상 포맷으로, 작은 용량과 투명 영상을 지원합니다.', en: 'A web-optimized open video format with small files and transparency support.', ja: 'Web向けに最適化されたオープン動画形式で、小さい容量と透明動画に対応します。', zh: '面向 Web 优化的开放视频格式，体积小且支持透明视频。' },
    strengths: { ko: ['웹에서 가볍고 빠름', '투명 영상(알파) 지원', '로열티 프리'], en: ['Light and fast on the web', 'Supports transparent (alpha) video', 'Royalty-free'], ja: ['Webで軽くて速い', '透明動画(アルファ)に対応', 'ロイヤリティフリー'], zh: ['在 Web 上轻快', '支持透明（Alpha）视频', '免版税'] },
    weaknesses: { ko: ['일부 기기·편집기 미지원', 'SNS 업로드 호환 편차', '사파리 구버전 제약'], en: ['Unsupported on some devices/editors', 'Patchy social upload support', 'Older Safari limits'], ja: ['一部の端末・編集ソフトで非対応', 'SNSアップロードで互換性に差', '古いSafariで制約'], zh: ['部分设备和编辑器不支持', '社交平台上传兼容性参差不齐', '旧版 Safari 受限'] },
  },
  mov: {
    key: 'mov', label: 'MOV', ext: 'mov', kind: 'video',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: false,
    summary: { ko: '애플 QuickTime 영상 포맷으로, 아이폰·편집 환경에서 흔합니다.', en: "Apple's QuickTime video format, common on iPhone and in editing.", ja: 'AppleのQuickTime動画形式で、iPhoneや編集環境でよく使われます。', zh: '苹果 QuickTime 视频格式，常见于 iPhone 和编辑环境。' },
    strengths: { ko: ['고품질 편집에 적합', '아이폰 녹화 기본', '맥 생태계 호환'], en: ['Good for high-quality editing', 'Default for iPhone recording', 'Mac ecosystem support'], ja: ['高品質な編集に向く', 'iPhone録画の標準', 'Mac環境と互換'], zh: ['适合高质量编辑', 'iPhone 录制的默认格式', '兼容 Mac 生态'] },
    weaknesses: { ko: ['윈도우·웹 호환 약함', '용량이 큼', '공유엔 MP4 변환 권장'], en: ['Weak Windows/web support', 'Large files', 'Convert to MP4 to share'], ja: ['Windows・Webでの互換性が弱い', '容量が大きい', '共有にはMP4への変換を推奨'], zh: ['Windows 和 Web 兼容性弱', '文件大', '分享建议转为 MP4'] },
  },
  avi: {
    key: 'avi', label: 'AVI', ext: 'avi', kind: 'video',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'large', universal: true,
    summary: { ko: '오래된 윈도우 영상 컨테이너로, 호환은 넓지만 용량이 큽니다.', en: 'An old Windows video container — broadly compatible but large.', ja: '古いWindows系の動画コンテナで、互換性は広いものの容量が大きいです。', zh: '老式 Windows 视频容器，兼容性广但体积大。' },
    strengths: { ko: ['구형 환경 호환', '단순한 구조', '오래된 영상 보관'], en: ['Compatible with legacy systems', 'Simple structure', 'Holds older footage'], ja: ['古い環境と互換', 'シンプルな構造', '古い映像の保管に'], zh: ['兼容旧环境', '结构简单', '可保存旧素材'] },
    weaknesses: { ko: ['용량이 비효율적으로 큼', '스트리밍 부적합', '현대 코덱 기능 부족'], en: ['Inefficiently large', 'Poor for streaming', 'Lacks modern codec features'], ja: ['容量が無駄に大きい', 'ストリーミングに不向き', '最新コーデック機能が乏しい'], zh: ['体积冗余庞大', '不适合流媒体', '缺少现代编解码器功能'] },
  },
  mkv: {
    key: 'mkv', label: 'MKV', ext: 'mkv', kind: 'video',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: false,
    summary: { ko: '다중 트랙·자막을 담는 유연한 오픈 컨테이너로, 고화질 보관에 인기입니다.', en: 'A flexible open container for multiple tracks and subtitles, popular for high-quality archives.', ja: '複数トラックや字幕を収められる柔軟なオープンコンテナで、高画質保管に人気です。', zh: '可容纳多轨道和字幕的灵活开放容器，常用于高画质归档。' },
    strengths: { ko: ['다중 오디오·자막 트랙', '거의 모든 코덱 수용', '고화질 보관에 적합'], en: ['Multiple audio/subtitle tracks', 'Holds almost any codec', 'Great for HD archives'], ja: ['複数の音声・字幕トラック', 'ほぼあらゆるコーデックを収容', '高画質の保管に最適'], zh: ['多条音频和字幕轨道', '可容纳几乎所有编解码器', '适合高清归档'] },
    weaknesses: { ko: ['SNS·기기 호환 약함', '브라우저 직접 재생 제한', '공유엔 MP4 변환 권장'], en: ['Weak social/device support', 'Limited direct browser playback', 'Convert to MP4 to share'], ja: ['SNS・端末での互換性が弱い', 'ブラウザでの直接再生に制約', '共有にはMP4への変換を推奨'], zh: ['社交平台和设备兼容性弱', '浏览器直接播放受限', '分享建议转为 MP4'] },
  },

  /* ── 문서 ── */
  docx: {
    key: 'docx', label: 'DOCX', ext: 'docx', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: true,
    summary: { ko: '마이크로소프트 워드 문서 포맷으로, 편집 가능한 서식 문서의 표준입니다.', en: 'The Microsoft Word format — the standard for editable formatted documents.', ja: 'Microsoft Wordの文書形式で、編集できる書式付き文書の標準です。', zh: 'Microsoft Word 文档格式，是可编辑带格式文档的标准。' },
    strengths: { ko: ['풍부한 서식·편집', '오피스 표준', '협업·검토에 적합'], en: ['Rich formatting and editing', 'Office standard', 'Good for collaboration'], ja: ['豊富な書式と編集', 'Officeの標準', '共同作業・校閲に向く'], zh: ['丰富的格式与编辑', 'Office 标准', '适合协作与审阅'] },
    weaknesses: { ko: ['뷰어마다 레이아웃 차이', '워드 없으면 편집 제약', '배포엔 PDF가 안정적'], en: ['Layout varies by viewer', 'Needs Word to edit fully', 'PDF is safer for distribution'], ja: ['ビューアごとにレイアウトが変わる', 'Wordがないと編集に制約', '配布にはPDFが安全'], zh: ['不同查看器版式不同', '没有 Word 编辑受限', '分发用 PDF 更稳妥'] },
  },
  md: {
    key: 'md', label: 'Markdown', ext: 'md', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: '경량 텍스트 서식 포맷으로, 깃허브·문서 작성에 널리 쓰입니다.', en: 'A lightweight text markup widely used on GitHub and for docs.', ja: '軽量なテキスト記法で、GitHubや文書作成で広く使われます。', zh: '轻量级文本标记格式，广泛用于 GitHub 和文档撰写。' },
    strengths: { ko: ['읽기 쉬운 평문', '버전관리 친화', '어디서나 변환 가능'], en: ['Human-readable plain text', 'Version-control friendly', 'Converts anywhere'], ja: ['読みやすいプレーンテキスト', 'バージョン管理に向く', 'どこへでも変換できる'], zh: ['易读的纯文本', '适合版本管理', '可随处转换'] },
    weaknesses: { ko: ['복잡한 레이아웃 한계', '렌더러마다 차이', '서식 표현이 제한적'], en: ['Limited for complex layout', 'Renderer differences', 'Limited formatting'], ja: ['複雑なレイアウトには限界', 'レンダラーごとに差が出る', '表現できる書式が限られる'], zh: ['复杂版式有局限', '不同渲染器有差异', '可表现的格式有限'] },
  },
  html: {
    key: 'html', label: 'HTML', ext: 'html', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '웹 표준 마크업으로, 브라우저에서 바로 열리는 문서 포맷입니다.', en: 'The web-standard markup that opens directly in any browser.', ja: 'Web標準のマークアップで、ブラウザでそのまま開ける文書形式です。', zh: 'Web 标准标记格式，可在浏览器中直接打开的文档格式。' },
    strengths: { ko: ['모든 브라우저에서 열림', '링크·스타일·미디어 포함', '웹 게시에 최적'], en: ['Opens in every browser', 'Links, styles and media', 'Best for web publishing'], ja: ['あらゆるブラウザで開ける', 'リンク・スタイル・メディアを含む', 'Web公開に最適'], zh: ['所有浏览器都能打开', '包含链接、样式和媒体', '最适合 Web 发布'] },
    weaknesses: { ko: ['인쇄·배포는 PDF가 안정적', '외부 자원 의존', '오프라인 서식 깨질 수 있음'], en: ['PDF is safer for print/share', 'Depends on external assets', 'Formatting can break offline'], ja: ['印刷・配布にはPDFが安全', '外部リソースに依存', 'オフラインで書式が崩れることがある'], zh: ['打印和分发用 PDF 更稳妥', '依赖外部资源', '离线时格式可能错乱'] },
  },
  csv: {
    key: 'csv', label: 'CSV', ext: 'csv', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '쉼표로 구분된 표 데이터 포맷으로, 거의 모든 도구가 읽습니다.', en: 'A comma-separated table format that nearly every tool can read.', ja: 'カンマ区切りの表形式データで、ほぼあらゆるツールで読み込めます。', zh: '逗号分隔的表格数据格式，几乎所有工具都能读取。' },
    strengths: { ko: ['모든 스프레드시트·DB 호환', '가볍고 단순', '가져오기·내보내기 표준'], en: ['Works with every spreadsheet/DB', 'Light and simple', 'Standard for import/export'], ja: ['あらゆる表計算・DBと互換', '軽くてシンプル', 'インポート・エクスポートの標準'], zh: ['兼容所有电子表格和数据库', '轻量简单', '导入导出的标准'] },
    weaknesses: { ko: ['서식·수식 미보존', '중첩 데이터 표현 불가', '인코딩 이슈 가능'], en: ['No formatting/formulas', 'No nested data', 'Encoding pitfalls'], ja: ['書式・数式は保持されない', '入れ子データは表現できない', '文字コードの問題が起きやすい'], zh: ['不保留格式和公式', '无法表现嵌套数据', '可能出现编码问题'] },
  },
  json: {
    key: 'json', label: 'JSON', ext: 'json', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '중첩 구조를 표현하는 데이터 포맷으로, API·설정에 표준입니다.', en: 'A data format for nested structures, standard for APIs and config.', ja: '入れ子構造を表現できるデータ形式で、APIや設定の標準です。', zh: '可表现嵌套结构的数据格式，是 API 和配置的标准。' },
    strengths: { ko: ['중첩·계층 데이터 표현', '모든 언어가 파싱', 'API·설정 표준'], en: ['Represents nested/hierarchical data', 'Parsed by every language', 'API/config standard'], ja: ['入れ子・階層データを表現', 'あらゆる言語で解析可能', 'API・設定の標準'], zh: ['表现嵌套和层级数据', '所有语言都能解析', 'API 和配置的标准'] },
    weaknesses: { ko: ['표 형태로 보기 불편', '용량이 CSV보다 큼', '사람이 대량 편집 어려움'], en: ['Awkward as a table', 'Larger than CSV', 'Hard to bulk-edit by hand'], ja: ['表として見るには不便', 'CSVより容量が大きい', '人手での大量編集が難しい'], zh: ['作为表格查看不便', '体积比 CSV 大', '人工批量编辑困难'] },
  },
  yaml: {
    key: 'yaml', label: 'YAML', ext: 'yaml', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: false,
    summary: { ko: '들여쓰기로 구조를 표현하는 사람이 읽기 쉬운 설정 포맷입니다.', en: 'A human-readable config format that uses indentation for structure.', ja: 'インデントで構造を表す、人が読みやすい設定向けフォーマットです。', zh: '用缩进表现结构、便于人阅读的配置格式。' },
    strengths: { ko: ['가독성이 매우 좋음', '주석 지원', 'JSON과 상호 변환'], en: ['Very readable', 'Supports comments', 'Interconverts with JSON'], ja: ['可読性が非常に高い', 'コメントに対応', 'JSONと相互変換できる'], zh: ['可读性极佳', '支持注释', '可与 JSON 互转'] },
    weaknesses: { ko: ['들여쓰기 오류에 민감', '일부 환경 미지원', '복잡해지면 모호함'], en: ['Sensitive to indentation', 'Unsupported in some stacks', 'Ambiguous when complex'], ja: ['インデントのミスに弱い', '一部の環境で非対応', '複雑になると曖昧になりやすい'], zh: ['对缩进错误敏感', '部分环境不支持', '复杂时容易产生歧义'] },
  },
  txt: {
    key: 'txt', label: 'TXT', ext: 'txt', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '서식 없는 평문 텍스트로, 어떤 기기에서도 열립니다.', en: 'Plain text with no formatting that opens on any device.', ja: '書式のないプレーンテキストで、どんな端末でも開けます。', zh: '无格式的纯文本，可在任何设备上打开。' },
    strengths: { ko: ['완전 범용', '가볍고 단순', '깨질 일이 없음'], en: ['Universally compatible', 'Light and simple', 'Never breaks'], ja: ['完全に汎用的', '軽くてシンプル', '壊れることがない'], zh: ['完全通用', '轻量简单', '永不损坏'] },
    weaknesses: { ko: ['서식·이미지 없음', '구조 표현 불가', '문서용으론 단조로움'], en: ['No formatting/images', 'No structure', 'Bare for documents'], ja: ['書式・画像がない', '構造を表現できない', '文書としては素っ気ない'], zh: ['没有格式和图片', '无法表现结构', '作为文档显得单调'] },
  },
  epub: {
    key: 'epub', label: 'EPUB', ext: 'epub', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: false,
    summary: { ko: '전자책 표준 포맷으로, 화면 크기에 맞춰 글이 재배치됩니다.', en: 'The e-book standard whose text reflows to fit any screen size.', ja: '電子書籍の標準形式で、画面サイズに合わせて文章が再配置されます。', zh: '电子书标准格式，文字会根据屏幕尺寸自动重排。' },
    strengths: { ko: ['화면에 맞춘 가변 레이아웃', '전자책 리더 표준', '글꼴·크기 조절'], en: ['Reflows to fit the screen', 'E-reader standard', 'Adjustable font/size'], ja: ['画面に合わせて流動するレイアウト', '電子書籍リーダーの標準', 'フォント・サイズを調整可能'], zh: ['随屏幕自适应的流式布局', '电子书阅读器的标准', '可调整字体和字号'] },
    weaknesses: { ko: ['고정 레이아웃엔 부적합', '리더마다 렌더 차이', '인쇄엔 PDF가 나음'], en: ['Poor for fixed layouts', 'Renders differ by reader', 'PDF is better for print'], ja: ['固定レイアウトには不向き', 'リーダーごとに表示が異なる', '印刷にはPDFが向く'], zh: ['不适合固定版式', '不同阅读器渲染有差异', '打印用 PDF 更好'] },
  },
  word: {
    key: 'word', label: 'Word', ext: 'docx', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: true,
    summary: { ko: '마이크로소프트 워드(.docx) 문서로, 자유롭게 편집할 수 있습니다.', en: 'A Microsoft Word (.docx) document you can freely edit.', ja: 'Microsoft Word(.docx)文書で、自由に編集できます。', zh: 'Microsoft Word（.docx）文档，可自由编辑。' },
    strengths: { ko: ['텍스트·서식 편집 자유로움', '오피스 표준', '협업·재사용에 적합'], en: ['Freely edit text and formatting', 'Office standard', 'Good for reuse/collaboration'], ja: ['テキスト・書式を自由に編集', 'Officeの標準', '再利用・共同作業に向く'], zh: ['可自由编辑文本和格式', 'Office 标准', '适合复用与协作'] },
    weaknesses: { ko: ['뷰어마다 레이아웃 차이', '복잡한 PDF는 완벽 재현 어려움', '워드/호환 앱 필요'], en: ['Layout varies by viewer', 'Complex PDFs may not convert perfectly', 'Needs Word or a compatible app'], ja: ['ビューアごとにレイアウトが変わる', '複雑なPDFは完全には再現しにくい', 'Wordや互換アプリが必要'], zh: ['不同查看器版式不同', '复杂 PDF 难以完美还原', '需要 Word 或兼容应用'] },
  },
  xlsx: {
    key: 'xlsx', label: 'XLSX', ext: 'xlsx', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: true,
    summary: { ko: '엑셀 스프레드시트 포맷으로, 표·수식·여러 시트를 담습니다.', en: 'The Excel spreadsheet format that holds tables, formulas and multiple sheets.', ja: 'Excelの表計算形式で、表・数式・複数シートを収められます。', zh: 'Excel 电子表格格式，可容纳表格、公式和多个工作表。' },
    strengths: { ko: ['표·수식·서식 보존', '여러 시트를 한 파일에', '오피스·구글시트 표준'], en: ['Keeps tables, formulas and formatting', 'Many sheets in one file', 'Office/Google Sheets standard'], ja: ['表・数式・書式を保持', '複数シートを1ファイルに', 'Office・Googleスプレッドシートの標準'], zh: ['保留表格、公式和格式', '多个工作表合为一个文件', 'Office 和 Google 表格的标准'] },
    weaknesses: { ko: ['단순 데이터엔 과함', '프로그램 처리는 CSV·JSON이 편함', '엑셀/호환 앱 필요'], en: ['Overkill for plain data', 'CSV/JSON are easier to process programmatically', 'Needs Excel or a compatible app'], ja: ['単純なデータには過剰', 'プログラム処理にはCSV・JSONが楽', 'Excelや互換アプリが必要'], zh: ['对简单数据过于复杂', '程序处理用 CSV·JSON 更方便', '需要 Excel 或兼容应用'] },
  },
  xml: {
    key: 'xml', label: 'XML', ext: 'xml', kind: 'document',
    lossy: false, transparency: false, animation: false, vector: false,
    weight: 'small', universal: true,
    summary: { ko: '태그로 구조를 표현하는 데이터 포맷으로, 설정·문서 교환에 쓰입니다.', en: 'A tag-based data format used for config and document exchange.', ja: 'タグで構造を表すデータ形式で、設定や文書交換に使われます。', zh: '用标签表现结构的数据格式，用于配置和文档交换。' },
    strengths: { ko: ['엄격한 구조·스키마 검증', '속성·중첩 표현', '광범위한 레거시 호환'], en: ['Strict structure and schema validation', 'Attributes and nesting', 'Broad legacy compatibility'], ja: ['厳格な構造・スキーマ検証', '属性や入れ子を表現', '広範なレガシー互換'], zh: ['严格的结构和模式校验', '可表现属性和嵌套', '广泛兼容旧系统'] },
    weaknesses: { ko: ['JSON보다 장황함', '파싱이 무거움', '사람이 읽기 번거로움'], en: ['More verbose than JSON', 'Heavier to parse', 'Tedious to read by hand'], ja: ['JSONより冗長', '解析が重い', '人が読むのが面倒'], zh: ['比 JSON 冗长', '解析较重', '人工阅读繁琐'] },
  },

  /* ── 비디오(입력 전용) ── */
  flv: {
    key: 'flv', label: 'FLV', ext: 'flv', kind: 'video',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: false,
    summary: { ko: '옛 플래시 영상 포맷으로, 현대 환경에선 재생이 어려워 변환이 필요합니다.', en: 'An old Flash video format that modern players struggle with, so it needs converting.', ja: '古いFlash動画形式で、現在の環境では再生が難しく変換が必要です。', zh: '老式 Flash 视频格式，现代环境难以播放，需要转换。' },
    strengths: { ko: ['과거 웹 스트리밍에 흔함', '오래된 영상 보관'], en: ['Common in legacy web streaming', 'Holds older footage'], ja: ['かつてのWeb配信でよく使われた', '古い映像の保管に'], zh: ['过去 Web 流媒体常用', '可保存旧素材'] },
    weaknesses: { ko: ['브라우저·기기 재생 거의 불가', '플래시 종료로 사장', 'MP4 변환 권장'], en: ['Barely plays on browsers/devices', 'Obsolete since Flash ended', 'Convert to MP4'], ja: ['ブラウザ・端末でほぼ再生不可', 'Flash終了で廃れた', 'MP4への変換を推奨'], zh: ['浏览器和设备几乎无法播放', '随 Flash 停用而淘汰', '建议转为 MP4'] },
  },
  wmv: {
    key: 'wmv', label: 'WMV', ext: 'wmv', kind: 'video',
    lossy: true, transparency: false, animation: false, vector: false,
    weight: 'medium', universal: false,
    summary: { ko: '윈도우 미디어 영상 포맷으로, 비윈도우 환경 호환이 약합니다.', en: 'A Windows Media video format with weak support outside Windows.', ja: 'Windows Mediaの動画形式で、Windows以外での互換性が弱いです。', zh: 'Windows Media 视频格式，在非 Windows 环境兼容性弱。' },
    strengths: { ko: ['윈도우 환경 호환', '적당한 압축'], en: ['Works on Windows', 'Reasonable compression'], ja: ['Windows環境と互換', 'そこそこの圧縮'], zh: ['兼容 Windows 环境', '压缩适中'] },
    weaknesses: { ko: ['맥·모바일·웹 호환 약함', 'SNS 업로드 제약', 'MP4 변환 권장'], en: ['Weak on Mac/mobile/web', 'Limited social upload', 'Convert to MP4'], ja: ['Mac・モバイル・Webで互換性が弱い', 'SNSアップロードに制約', 'MP4への変換を推奨'], zh: ['Mac、移动端和 Web 兼容性弱', '社交平台上传受限', '建议转为 MP4'] },
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

  // ── 콘텐츠 확장 2026-06 ──
  // 이미지 (image-convert)
  imgConvert('webp', 'avif'),
  imgConvert('avif', 'webp'),
  imgConvert('gif', 'webp'),
  imgConvert('bmp', 'webp'),
  // 오디오 (audio-convert)
  audioConvert('wav', 'm4a'),
  audioConvert('flac', 'aac'),
  audioConvert('aac', 'wav'),
  audioConvert('ogg', 'm4a'),
  // 비디오 (video-convert; flv·wmv 입력)
  videoConvert('flv', 'mp4'),
  videoConvert('wmv', 'mp4'),
  videoConvert('mkv', 'mov'),
  videoConvert('mkv', 'webm'),
  // 문서
  { from: 'pdf', to: 'word', toolId: 'pdf-to-word', toolHref: '/tools/pdf/to-word' },
  { from: 'pdf', to: 'txt', toolId: 'pdf-to-txt', toolHref: '/tools/pdf/to-txt' },
  { from: 'pdf', to: 'md', toolId: 'pdf-to-md', toolHref: '/tools/pdf/to-md' },
  { from: 'epub', to: 'txt', toolId: 'epub-to-txt', toolHref: '/tools/docs/epub-to-txt' },
  { from: 'epub', to: 'md', toolId: 'epub-to-md', toolHref: '/tools/docs/epub-to-md' },
  { from: 'txt', to: 'epub', toolId: 'txt-to-epub', toolHref: '/tools/docs/txt-to-epub' },

  // ── 콘텐츠 확장 2026-06 (2차) ──
  // 이미지 (image-convert; avif 출력 확장)
  imgConvert('gif', 'avif'),
  imgConvert('bmp', 'avif'),
  // 오디오 (audio-convert)
  audioConvert('ogg', 'wav'),
  audioConvert('mp3', 'aac'),
  // 스프레드시트·데이터 (xlsx-convert / json-xml / yaml-json)
  { from: 'csv', to: 'xlsx', toolId: 'xlsx-convert', toolHref: '/tools/docs/xlsx-convert' },
  { from: 'xlsx', to: 'csv', toolId: 'xlsx-convert', toolHref: '/tools/docs/xlsx-convert' },
  { from: 'xlsx', to: 'json', toolId: 'xlsx-convert', toolHref: '/tools/docs/xlsx-convert' },
  { from: 'json', to: 'xlsx', toolId: 'xlsx-convert', toolHref: '/tools/docs/xlsx-convert' },
  { from: 'json', to: 'xml', toolId: 'json-xml', toolHref: '/tools/dev/json-xml' },
  { from: 'xml', to: 'json', toolId: 'json-xml', toolHref: '/tools/dev/json-xml' },
  { from: 'json', to: 'yaml', toolId: 'yaml-json', toolHref: '/tools/docs/yaml-json' },
  // 문서 (pdf-to-html / pdf-to-epub / epub-to-html / pdf-to-excel)
  { from: 'pdf', to: 'html', toolId: 'pdf-to-html', toolHref: '/tools/pdf/to-html' },
  { from: 'pdf', to: 'epub', toolId: 'pdf-to-epub', toolHref: '/tools/pdf/to-epub' },
  { from: 'epub', to: 'html', toolId: 'epub-to-html', toolHref: '/tools/docs/epub-to-html' },
  { from: 'pdf', to: 'xlsx', toolId: 'pdf-to-excel', toolHref: '/tools/pdf/to-excel' },
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
  ja: {
    titleSuffix: '変換 — 無料・ブラウザだけで',
    h1: (f: string, t: string) => `${f}を${t}に変換`,
    cta: (f: string, t: string) => `${f}を${t}に変換する`,
    aboutFrom: '元のフォーマット',
    aboutTo: '変換先のフォーマット',
    whatChanges: '変換すると何が変わるか',
    privacyQ: 'ファイルはサーバーにアップロードされますか？',
    privacyA:
      'いいえ。変換はすべてブラウザ内で行われ、ファイルが端末の外に出ることはありません。プライベートな写真や書類でも安心です。',
    batchQ: '複数のファイルをまとめて変換できますか？',
    batchA: 'はい。複数ファイルをドロップして一括変換し、結果をまとめてダウンロードできます。',
    freeQ: '無料ですか？インストールは必要ですか？',
    freeA: '完全に無料で、登録もインストールも不要です。ブラウザですぐに動作します。',
  },
  zh: {
    titleSuffix: '转换 — 免费，在浏览器中完成',
    h1: (f: string, t: string) => `${f}转${t}`,
    cta: (f: string, t: string) => `将${f}转换为${t}`,
    aboutFrom: '源格式',
    aboutTo: '目标格式',
    whatChanges: '转换后会有什么变化',
    privacyQ: '文件会上传到服务器吗？',
    privacyA:
      '不会。转换全部在浏览器中完成，文件不会离开您的设备。即使是私密的照片和文档也很安全。',
    batchQ: '可以一次转换多个文件吗？',
    batchA: '可以。拖入多个文件即可批量转换，并将结果一起下载。',
    freeQ: '免费吗？需要安装什么吗？',
    freeA: '完全免费，无需注册或安装。在浏览器中即可直接使用。',
  },
} as const;

/** 언어별 문자열을 고르는 헬퍼 (ko/en/ja/zh 4-way). */
function pick(lang: Lang, ko: string, en: string, ja: string, zh: string): string {
  return lang === 'ko' ? ko : lang === 'ja' ? ja : lang === 'zh' ? zh : en;
}

/** 두 포맷의 차이에서 "무엇이 바뀌나" 항목을 도출. */
function deriveChanges(from: FormatFact, to: FormatFact, lang: Lang): string[] {
  const out: string[] = [];

  // 영상 → 오디오: 트랙 추출
  if (from.kind === 'video' && to.kind === 'audio') {
    out.push(pick(lang,
      '영상에서 소리(오디오 트랙)만 추출되고 화면은 제거됩니다.',
      'Only the audio track is extracted; the video is discarded.',
      '映像から音声(オーディオトラック)だけが抽出され、映像は取り除かれます。',
      '仅从视频中提取声音（音频轨道），画面被丢弃。'));
  }
  // 영상 → GIF
  if (from.kind === 'video' && to.key === 'gif') {
    out.push(pick(lang,
      '소리는 사라지고 짧은 무음 애니메이션(GIF)으로 바뀝니다. 길이·해상도를 줄여야 용량이 작습니다.',
      'Audio is dropped and it becomes a short silent animation (GIF). Trim length and size to keep it small.',
      '音声は失われ、短い無音アニメーション(GIF)になります。長さと解像度を抑えると容量が小さくなります。',
      '声音被去除，变成一段简短的无声动画（GIF）。缩短时长和分辨率才能让体积更小。'));
  }
  // 문서 → PDF: 레이아웃 고정
  if (to.key === 'pdf' && from.kind === 'document') {
    out.push(pick(lang,
      '편집 가능한 문서가 레이아웃이 고정된 PDF가 되어 어디서나 똑같이 보입니다.',
      'An editable document becomes a fixed-layout PDF that looks identical everywhere.',
      '編集できる文書がレイアウト固定のPDFになり、どこで開いても同じ見た目になります。',
      '可编辑的文档变成版式固定的 PDF，在任何地方都呈现相同外观。'));
  }

  if (from.transparency && !to.transparency) {
    out.push(pick(lang,
      `투명 배경이 ${to.label}에서 흰색(또는 단색)으로 채워집니다.`,
      `Transparency is filled with white (or a solid color) in ${to.label}.`,
      `透明な背景は${to.label}では白(または単色)で塗りつぶされます。`,
      `透明背景在${to.label}中会被填充为白色（或单色）。`));
  }
  if (from.animation && !to.animation) {
    out.push(pick(lang,
      '애니메이션은 첫 프레임의 정지 이미지로 바뀝니다.',
      'Animation collapses to a single still frame.',
      'アニメーションは最初のフレームの静止画になります。',
      '动画会被压缩为第一帧的静态图像。'));
  }
  if (from.vector && !to.vector) {
    out.push(pick(lang,
      '벡터가 지정한 해상도의 픽셀로 래스터화됩니다 — 더 키우려면 높은 해상도로 내보내세요.',
      'The vector is rasterized to fixed pixels — export at a higher resolution if you need to scale up.',
      'ベクターが指定解像度のピクセルにラスタライズされます。大きくしたい場合は高い解像度で書き出してください。',
      '矢量会被光栅化为指定分辨率的像素 — 若需放大，请以更高分辨率导出。'));
  }
  if (!from.lossy && to.lossy) {
    out.push(pick(lang,
      '재인코딩으로 약간의 손실이 생길 수 있으나, 높은 품질 설정에선 거의 눈에 띄지 않습니다.',
      'Re-encoding adds a small quality loss that is hard to notice at high quality settings.',
      '再エンコードでわずかな劣化が生じますが、高品質設定ではほとんど気づきません。',
      '重新编码会带来轻微的质量损失，但在高质量设置下几乎察觉不到。'));
  }
  if (from.lossy && !to.lossy) {
    out.push(pick(lang,
      `${to.label}는 무손실이라 이후 추가 손실은 없지만, 이미 손실된 ${from.label}의 데이터가 복원되진 않습니다.`,
      `${to.label} is lossless so there is no further loss, though it cannot restore data already lost in ${from.label}.`,
      `${to.label}は可逆なので以降の劣化はありませんが、すでに失われた${from.label}のデータは復元できません。`,
      `${to.label}是无损的，因此之后不会再有损失，但无法恢复${from.label}中已经丢失的数据。`));
  }
  // 용량 변화
  const wOrder = { small: 0, medium: 1, large: 2 } as const;
  if (wOrder[to.weight] < wOrder[from.weight]) {
    out.push(pick(lang, '대체로 파일 용량이 줄어듭니다.', 'Files usually get smaller.', 'たいていファイル容量が小さくなります。', '文件体积通常会变小。'));
  } else if (wOrder[to.weight] > wOrder[from.weight]) {
    out.push(pick(lang, '대체로 파일 용량이 커집니다.', 'Files usually get larger.', 'たいていファイル容量が大きくなります。', '文件体积通常会变大。'));
  }
  // 호환성 변화
  if (!from.universal && to.universal) {
    out.push(pick(lang,
      `${to.label}는 거의 모든 기기·앱·웹에서 열려 공유·업로드가 쉬워집니다.`,
      `${to.label} opens on virtually every device, app and website, making sharing and uploading easy.`,
      `${to.label}はほぼあらゆる端末・アプリ・Webで開けるため、共有やアップロードが簡単になります。`,
      `${to.label}几乎可在所有设备、应用和网页上打开，分享和上传更方便。`));
  }
  if (from.universal && !to.universal) {
    out.push(pick(lang,
      `${to.label}는 호환 범위가 좁아 구형 환경에선 안 열릴 수 있습니다.`,
      `${to.label} has narrower support and may not open in older environments.`,
      `${to.label}は対応範囲が狭く、古い環境では開けないことがあります。`,
      `${to.label}的兼容范围较窄，在旧环境中可能无法打开。`));
  }
  if (out.length === 0) {
    out.push(pick(lang,
      '두 포맷의 특성이 비슷해 큰 변화 없이 포맷만 바뀝니다.',
      'The two formats are similar, so only the container changes with little visible difference.',
      '2つのフォーマットは特性が近いため、目立った変化なくフォーマットだけが変わります。',
      '两种格式特性相近，几乎没有明显变化，只是格式发生改变。'));
  }
  return out;
}

export function buildConversionContent(c: Conversion, lang: Lang): ConversionContent {
  const from = FORMATS[c.from];
  const to = FORMATS[c.to];
  const t = T[lang];
  const ko = lang === 'ko';
  const ja = lang === 'ja';
  const zh = lang === 'zh';
  const F = from.label;
  const To = to.label;
  const category: ToolCategory = conversionCategory(from, to);

  const title = ko
    ? `${F} → ${To} ${t.titleSuffix}`
    : ja
      ? `${F}→${To} ${t.titleSuffix}`
      : zh
        ? `${F}转${To} ${t.titleSuffix}`
        : `${F} to ${To} ${t.titleSuffix}`;

  const description = pick(lang,
    `${F}를 ${To}로 무료 변환하세요. ${to.summary.ko} 업로드 없이 브라우저에서 처리됩니다.`,
    `Convert ${F} to ${To} for free. ${to.summary.en} Runs in your browser with no upload.`,
    `${F}を${To}に無料で変換できます。${to.summary.ja} アップロードなしでブラウザ内で処理されます。`,
    `免费将${F}转换为${To}。${to.summary.zh} 无需上传，在浏览器中处理。`);

  const introTailKo =
    !from.universal && to.universal
      ? '호환성이 크게 넓어져 어디서나 열 수 있습니다.'
      : to.weight === 'small' && from.weight !== 'small'
        ? '파일이 가벼워져 업로드·공유가 빨라집니다.'
        : '용도에 맞는 포맷으로 정리됩니다.';
  const introTailEn =
    !from.universal && to.universal
      ? 'greatly widens compatibility so it opens anywhere.'
      : to.weight === 'small' && from.weight !== 'small'
        ? 'makes files lighter and faster to upload or share.'
        : 'gives you the right format for the job.';
  const introTailJa =
    !from.universal && to.universal
      ? '互換性が大きく広がり、どこでも開けるようになります。'
      : to.weight === 'small' && from.weight !== 'small'
        ? 'ファイルが軽くなり、アップロードや共有が速くなります。'
        : '用途に合ったフォーマットに整理されます。';
  const introTailZh =
    !from.universal && to.universal
      ? '兼容性大幅提升，可在任何地方打开。'
      : to.weight === 'small' && from.weight !== 'small'
        ? '文件变得更轻，上传和分享更快。'
        : '整理为适合用途的格式。';
  const intro = pick(lang,
    `${from.summary.ko} ${to.summary.ko} ${F}를 ${To}로 바꾸면 ${introTailKo} 모든 변환은 브라우저 안에서 끝나 파일이 서버로 올라가지 않습니다.`,
    `${from.summary.en} ${to.summary.en} Converting ${F} to ${To} ${introTailEn} Every conversion finishes inside your browser — files are never uploaded.`,
    `${from.summary.ja} ${to.summary.ja} ${F}を${To}に変換すると${introTailJa} すべての変換はブラウザ内で完結し、ファイルがサーバーに送られることはありません。`,
    `${from.summary.zh} ${to.summary.zh} 将${F}转换为${To}后，${introTailZh} 所有转换都在浏览器内完成，文件不会上传到服务器。`);

  const keywords = ko
    ? [`${c.from} ${c.to} 변환`, `${F} ${To}`, `${c.from} to ${c.to}`, `${F} 변환`, '무료 변환', '온라인 변환', '업로드 없음']
    : ja
      ? [`${c.from} ${c.to} 変換`, `${F} ${To} 変換`, `${c.from} to ${c.to}`, `${F}を${To}に`, '無料 変換', 'オンライン 変換', 'アップロード不要']
      : zh
        ? [`${c.from} ${c.to} 转换`, `${F} ${To} 转换`, `${c.from} to ${c.to}`, `${F}转${To}`, '免费转换', '在线转换', '无需上传']
        : [`${c.from} to ${c.to}`, `convert ${c.from} to ${c.to}`, `${F} to ${To} converter`, `${c.from}2${c.to}`, 'free', 'online', 'no upload'];

  const faqs: Array<{ q: string; a: string }> = [];
  // 1) 품질
  if (!from.lossy && to.lossy) {
    faqs.push({
      q: pick(lang, `${F}를 ${To}로 바꾸면 품질이 떨어지나요?`, `Does converting ${F} to ${To} lose quality?`, `${F}を${To}に変換すると画質は落ちますか？`, `将${F}转换为${To}会损失画质吗？`),
      a: pick(lang,
        `${To}는 손실 압축이라 약간의 품질 저하가 있을 수 있지만, 높은 품질 설정에선 차이를 알아채기 어렵습니다.`,
        `${To} uses lossy compression so there is a slight drop, but at high quality settings it is hard to notice.`,
        `${To}は非可逆圧縮のためわずかに画質が落ちることがありますが、高品質設定では違いはほとんど分かりません。`,
        `${To}采用有损压缩，可能会有轻微画质下降，但在高质量设置下几乎察觉不到差异。`),
    });
  } else if (from.lossy && !to.lossy) {
    faqs.push({
      q: pick(lang, `${To}로 바꾸면 화질이 좋아지나요?`, `Does converting to ${To} improve quality?`, `${To}に変換すると画質は良くなりますか？`, `转换为${To}会让画质变好吗？`),
      a: pick(lang,
        `이미 손실된 데이터는 복원되지 않습니다. 다만 ${To}는 무손실이라 이후 저장에서 추가 손실은 없습니다.`,
        `It cannot restore data already lost, but ${To} is lossless so no further quality is lost on save.`,
        `すでに失われたデータは復元できません。ただし${To}は可逆なので、以降の保存で画質がさらに落ちることはありません。`,
        `已经丢失的数据无法恢复。不过${To}是无损的，后续保存不会再损失画质。`),
    });
  } else {
    faqs.push({
      q: pick(lang, `${F}를 ${To}로 바꾸면 품질이 유지되나요?`, `Is quality preserved from ${F} to ${To}?`, `${F}を${To}に変換しても品質は保たれますか？`, `将${F}转换为${To}能保持质量吗？`),
      a: pick(lang,
        `네. 두 포맷 모두 ${from.lossy ? '동일 수준의 압축' : '무손실'}이라 눈에 띄는 품질 변화 없이 변환됩니다.`,
        `Yes. Both are ${from.lossy ? 'similarly compressed' : 'lossless'}, so it converts with no noticeable change.`,
        `はい。どちらも${from.lossy ? '同等の圧縮' : '可逆'}なので、目立った品質変化なく変換されます。`,
        `可以。两种格式都是${from.lossy ? '同等程度的压缩' : '无损'}，因此转换时没有明显的质量变化。`),
    });
  }
  // 2) 투명/특성 FAQ (해당 시)
  if (from.transparency && !to.transparency) {
    faqs.push({
      q: pick(lang, '투명 배경은 어떻게 되나요?', 'What happens to the transparent background?', '透明な背景はどうなりますか？', '透明背景会怎样处理？'),
      a: pick(lang,
        `${To}는 투명도를 지원하지 않아 투명 영역이 단색(기본 흰색)으로 채워집니다. 투명도가 필요하면 PNG·WebP를 쓰세요.`,
        `${To} does not support transparency, so transparent areas are filled with a solid color (white by default). Use PNG or WebP if you need transparency.`,
        `${To}は透明度に対応していないため、透明な部分は単色(既定は白)で塗りつぶされます。透明度が必要ならPNGやWebPを使ってください。`,
        `${To}不支持透明度，因此透明区域会被填充为单色（默认白色）。如需透明度，请使用 PNG 或 WebP。`),
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

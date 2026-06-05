/**
 * 유스케이스 페이지 — 작업 의도(task intent) SEO + 온보딩 (마스터플랜 Phase γ).
 *
 * "이력서 사진 만들기", "단체사진 얼굴 모자이크"처럼 사용자가 "무엇을 하려는가"로
 * 검색하는 의도를 잡는다. 각 유스케이스는 여러 도구를 단계로 묶어 안내하고
 * (HowTo 스키마), 관련 변환·비교로 연결되는 링크 허브 역할을 한다.
 *
 * 모든 step.href 는 실제 ready 도구 경로여야 한다(죽은 링크 금지).
 * 라우트: /use/{slug} (ko) · /en/use/{slug} (en) — hreflang 연결.
 */

import type { ToolCategory } from '@/lib/tools/registry';

export type Lang = 'ko' | 'en';

interface Bi {
  ko: string;
  en: string;
}

export interface UseStep {
  /** 실제 도구 경로 */
  href: string;
  name: Bi;
  text: Bi;
}

export interface UseCase {
  slug: string;
  category: ToolCategory;
  title: Bi;
  h1: Bi;
  description: Bi;
  intro: Bi;
  steps: UseStep[];
  /** 변환 매트릭스 slug */
  relatedConverts?: string[];
  /** 비교 slug */
  relatedCompares?: string[];
  faqs: Array<{ q: Bi; a: Bi }>;
  keywords: { ko: string[]; en: string[] };
}

export const USE_CASES: UseCase[] = [
  {
    slug: 'resume-id-photo',
    category: 'image',
    title: { ko: '이력서·증명사진 직접 만들기', en: 'Make a Resume / ID Photo Yourself' },
    h1: { ko: '이력서·증명사진 만들기', en: 'Make a resume / ID photo' },
    description: {
      ko: '사진관 없이 이력서·여권·반명함 규격 증명사진을 직접 만드세요. 규격 크롭·배경색·용량까지 브라우저에서 무료로.',
      en: 'Make resume, passport or ID photos without a studio. Crop to spec, set the background and shrink the size — free, in your browser.',
    },
    intro: {
      ko: '증명사진은 규격(크기·배경)만 맞추면 직접 만들 수 있습니다. 얼굴이 잘 나온 사진 한 장이면 규격에 맞춰 자르고 배경을 바꾼 뒤, 제출처 용량 제한에 맞게 줄이면 끝입니다. 모든 과정이 브라우저에서 처리돼 사진이 업로드되지 않습니다.',
      en: 'An ID photo just needs the right size and background. Take one good photo of your face, crop it to spec, swap the background, then shrink it to fit upload limits. Everything runs in your browser, so the photo is never uploaded.',
    },
    steps: [
      {
        href: '/tools/image/id-photo',
        name: { ko: '규격에 맞춰 크롭 + 배경색', en: 'Crop to spec + background' },
        text: {
          ko: '이력서·여권·반명함 규격을 골라 얼굴을 맞추고 배경색을 지정합니다.',
          en: 'Pick the resume/passport/ID spec, fit your face and set the background color.',
        },
      },
      {
        href: '/tools/image/batch-compress',
        name: { ko: '제출 용량에 맞게 줄이기', en: 'Shrink to the upload limit' },
        text: {
          ko: '제출처의 용량 제한(예: 200KB)에 맞춰 압축합니다.',
          en: 'Compress to the site’s size limit (e.g. 200KB).',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '배경을 흰색으로 바꿀 수 있나요?', en: 'Can I change the background to white?' },
        a: {
          ko: '네. 증명사진 규격 도구에서 배경색을 흰색·파란색 등으로 지정할 수 있습니다.',
          en: 'Yes. The ID photo tool lets you set the background to white, blue and more.',
        },
      },
      {
        q: { ko: '사진이 서버로 올라가나요?', en: 'Is my photo uploaded?' },
        a: {
          ko: '아니요. 모든 처리가 브라우저 안에서 끝나 사진이 기기를 벗어나지 않습니다.',
          en: 'No. Everything happens in your browser and the photo never leaves your device.',
        },
      },
    ],
    keywords: {
      ko: ['이력서 사진 만들기', '증명사진 직접', '여권사진 규격', '반명함', '증명사진 배경'],
      en: ['make id photo', 'resume photo', 'passport photo size', 'id photo background'],
    },
  },
  {
    slug: 'blur-group-photo-faces',
    category: 'image',
    title: { ko: '단체사진 얼굴 모자이크 일괄 처리', en: 'Blur Faces in Group Photos (Batch)' },
    h1: { ko: '단체사진 얼굴 모자이크', en: 'Blur faces in group photos' },
    description: {
      ko: 'SNS·블로그에 올리기 전 단체사진 속 모든 얼굴을 자동 감지해 모자이크·블러 처리하세요. 폴더 일괄 지원, 업로드 없음.',
      en: 'Auto-detect and blur every face in group photos before posting. Batch a whole folder — no upload.',
    },
    intro: {
      ko: 'AI가 사진 속 얼굴을 자동으로 찾아 모자이크·블러·이모지로 가립니다. 여러 장이면 폴더째 한 번에 처리하고, 가림 강도와 스타일은 미리보기로 맞출 수 있습니다. 사진은 브라우저를 벗어나지 않습니다.',
      en: 'AI finds faces automatically and covers them with mosaic, blur or emoji. Drop a whole folder to process many photos at once, and tune the strength and style with a live preview. Photos never leave your browser.',
    },
    steps: [
      {
        href: '/tools/image/blur-face',
        name: { ko: '얼굴 자동 감지 + 가림', en: 'Auto-detect + cover faces' },
        text: {
          ko: '사진(또는 폴더)을 올리면 얼굴을 자동 감지합니다. 모자이크/블러/이모지와 강도를 고릅니다.',
          en: 'Drop a photo (or folder) to auto-detect faces, then pick mosaic/blur/emoji and strength.',
        },
      },
    ],
    relatedConverts: ['png-to-jpg'],
    faqs: [
      {
        q: { ko: '여러 장을 한 번에 처리할 수 있나요?', en: 'Can I process many photos at once?' },
        a: {
          ko: '네. 폴더 모드로 전체 이미지를 일괄 처리하고 결과를 ZIP으로 내려받습니다.',
          en: 'Yes. Folder mode batch-processes every image and bundles the results as a ZIP.',
        },
      },
      {
        q: { ko: '측면 얼굴도 잡히나요?', en: 'Does it catch side-facing faces?' },
        a: {
          ko: '민감도를 "최고"로 올리면 측면·작은 얼굴 회수율이 높아집니다. 놓친 얼굴은 직접 영역을 추가할 수도 있습니다.',
          en: 'Raising sensitivity to “max” improves recall for side and small faces. You can also add missed regions manually.',
        },
      },
    ],
    keywords: {
      ko: ['단체사진 얼굴 모자이크', '얼굴 가리기', '사진 모자이크 일괄', '초상권 블러'],
      en: ['blur faces group photo', 'mosaic faces', 'batch face blur', 'anonymize photo'],
    },
  },
  {
    slug: 'scan-paper-to-pdf',
    category: 'pdf',
    title: { ko: '종이 서류 스캔해서 PDF로 묶기', en: 'Scan Paper Documents into a PDF' },
    h1: { ko: '종이 서류를 PDF로', en: 'Turn paper documents into a PDF' },
    description: {
      ko: '스캐너 없이 휴대폰 사진으로 찍은 서류를 명암 보정해 한 개의 PDF로 묶으세요. 제출용 용량까지 무료로.',
      en: 'No scanner needed — turn phone photos of documents into one clean PDF with contrast fixed, then shrink it. Free.',
    },
    intro: {
      ko: '휴대폰으로 찍은 서류 사진을 스캔본처럼 명암 보정해 한 개의 PDF로 묶을 수 있습니다. 여러 장이면 순서대로 합쳐지고, 제출 용량이 크면 압축으로 줄입니다. 모든 처리가 브라우저에서 끝납니다.',
      en: 'Phone photos of documents can be cleaned up like scans and combined into one PDF. Multiple pages merge in order, and you can compress if the file is too big to submit. It all happens in your browser.',
    },
    steps: [
      {
        href: '/tools/pdf/scan',
        name: { ko: '사진을 명암 보정해 PDF로', en: 'Clean up photos into a PDF' },
        text: {
          ko: '찍은 서류 사진을 올려 명암을 보정하고 한 개의 PDF로 묶습니다.',
          en: 'Upload your document photos, fix the contrast and combine them into one PDF.',
        },
      },
      {
        href: '/tools/compress',
        name: { ko: '용량 줄이기(선택)', en: 'Shrink the size (optional)' },
        text: {
          ko: '제출 용량 제한이 있으면 PDF를 압축합니다.',
          en: 'Compress the PDF if there is an upload size limit.',
        },
      },
    ],
    relatedConverts: ['jpg-to-pdf', 'png-to-pdf'],
    relatedCompares: ['jpg-to-pdf-vs-pdf-to-jpg'],
    faqs: [
      {
        q: { ko: '여러 장을 한 PDF로 묶을 수 있나요?', en: 'Can I combine several pages into one PDF?' },
        a: {
          ko: '네. 여러 사진을 올리면 순서대로 한 개의 PDF로 묶입니다.',
          en: 'Yes. Upload multiple photos and they merge into a single PDF in order.',
        },
      },
      {
        q: { ko: '글자가 선택 가능한 텍스트가 되나요?', en: 'Does the text become selectable?' },
        a: {
          ko: '사진 기반이라 기본은 이미지입니다. 텍스트 추출이 필요하면 OCR 도구를 함께 쓰세요.',
          en: 'It is photo-based, so pages are images by default. Use the OCR tool if you need selectable text.',
        },
      },
    ],
    keywords: {
      ko: ['서류 스캔 pdf', '휴대폰 스캔', '사진 pdf 변환', '문서 스캔'],
      en: ['scan document to pdf', 'phone scanner', 'photo to pdf', 'paper to pdf'],
    },
  },
  {
    slug: 'shrink-pdf-for-email',
    category: 'pdf',
    title: { ko: 'PDF 용량 줄여 이메일 첨부', en: 'Shrink a PDF for Email' },
    h1: { ko: 'PDF 용량 줄이기', en: 'Shrink a PDF for email' },
    description: {
      ko: '첨부 용량 제한에 걸리는 큰 PDF를 화질을 지키며 줄이세요. 업로드 없이 브라우저에서 무료로.',
      en: 'Shrink a PDF that is too big to attach while keeping it readable. Free, in your browser, no upload.',
    },
    intro: {
      ko: '이메일·게시판은 첨부 용량 제한이 있어 큰 PDF는 거절되곤 합니다. 압축으로 이미지 해상도와 품질을 조절해 용량을 크게 줄이면서도 읽기 좋은 상태를 유지할 수 있습니다. 파일은 브라우저를 벗어나지 않습니다.',
      en: 'Email and forums cap attachment size, so large PDFs get rejected. Compression tunes image resolution and quality to cut the size dramatically while keeping it readable. The file never leaves your browser.',
    },
    steps: [
      {
        href: '/tools/compress',
        name: { ko: 'PDF 압축', en: 'Compress the PDF' },
        text: {
          ko: 'PDF를 올리고 압축 강도를 조절해 용량을 줄입니다.',
          en: 'Upload the PDF and adjust the compression level to reduce its size.',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '압축하면 글자가 흐려지나요?', en: 'Does compression blur the text?' },
        a: {
          ko: '텍스트는 보통 그대로 유지되고 이미지 위주로 용량이 줄어듭니다. 강도를 조절해 균형을 맞추세요.',
          en: 'Text usually stays intact; size is saved mainly from images. Adjust the level to balance quality and size.',
        },
      },
      {
        q: { ko: '얼마나 줄일 수 있나요?', en: 'How much smaller can it get?' },
        a: {
          ko: '이미지가 많은 PDF일수록 효과가 큽니다. 스캔본은 절반 이하로도 줄어드는 경우가 많습니다.',
          en: 'Image-heavy PDFs shrink the most — scanned files often drop below half their size.',
        },
      },
    ],
    keywords: {
      ko: ['pdf 용량 줄이기', 'pdf 압축', 'pdf 첨부 용량', '큰 pdf 메일'],
      en: ['shrink pdf', 'compress pdf for email', 'reduce pdf size', 'pdf too big'],
    },
  },
  {
    slug: 'optimize-photo-for-web',
    category: 'image',
    title: { ko: '사진 웹·블로그용으로 최적화', en: 'Optimize Photos for the Web' },
    h1: { ko: '웹·블로그용 사진 최적화', en: 'Optimize photos for the web' },
    description: {
      ko: '큰 사진을 적당한 크기로 줄이고 WebP로 바꿔 페이지를 가볍고 빠르게. 업로드 없이 브라우저에서.',
      en: 'Resize big photos and convert to WebP to keep pages light and fast. In your browser, no upload.',
    },
    intro: {
      ko: '카메라 원본은 웹에 쓰기엔 너무 큽니다. 필요한 크기로 리사이즈한 뒤 WebP로 바꾸면 화질은 지키면서 용량을 크게 줄여 페이지 로딩이 빨라집니다. 모든 처리가 브라우저 안에서 끝납니다.',
      en: 'Camera originals are too large for the web. Resize to the dimensions you need, then convert to WebP to keep quality while slashing size and speeding up page loads. It all runs in your browser.',
    },
    steps: [
      {
        href: '/tools/image/resize',
        name: { ko: '필요한 크기로 리사이즈', en: 'Resize to the size you need' },
        text: {
          ko: '예: 가로 1200px 등 실제 필요한 크기로 줄입니다.',
          en: 'Shrink to the dimensions you actually need (e.g. 1200px wide).',
        },
      },
      {
        href: '/tools/image/convert?to=webp',
        name: { ko: 'WebP로 변환', en: 'Convert to WebP' },
        text: {
          ko: 'WebP로 바꿔 같은 화질에 더 작은 용량으로 만듭니다.',
          en: 'Convert to WebP for a smaller file at the same quality.',
        },
      },
    ],
    relatedConverts: ['png-to-webp', 'jpg-to-webp'],
    relatedCompares: ['webp-vs-png', 'compress-vs-resize-image'],
    faqs: [
      {
        q: { ko: '리사이즈와 압축 중 뭘 먼저?', en: 'Resize or compress first?' },
        a: {
          ko: '필요한 크기로 먼저 리사이즈한 뒤 변환·압축하세요. 리사이즈가 가장 많은 용량을 줄입니다.',
          en: 'Resize first, then convert/compress. Resizing removes the most data.',
        },
      },
      {
        q: { ko: 'WebP를 모든 브라우저가 지원하나요?', en: 'Do all browsers support WebP?' },
        a: {
          ko: '현재 주요 브라우저는 모두 지원합니다. 아주 오래된 환경만 예외입니다.',
          en: 'All current major browsers support it; only very old environments do not.',
        },
      },
    ],
    keywords: {
      ko: ['사진 웹 최적화', '이미지 용량 줄이기', 'webp 변환', '블로그 사진 크기'],
      en: ['optimize photo for web', 'resize image web', 'convert to webp', 'blog image size'],
    },
  },
  {
    slug: 'make-gif-from-video',
    category: 'gif',
    title: { ko: '영상으로 GIF 만들기', en: 'Make a GIF from a Video' },
    h1: { ko: '영상으로 GIF 만들기', en: 'Make a GIF from a video' },
    description: {
      ko: 'MP4·WebM 영상의 원하는 구간을 잘라 움짤(GIF)로 만드세요. 길이·해상도 조절로 용량까지. 업로드 없음.',
      en: 'Turn a clip of an MP4/WebM video into a GIF. Control length and size for a small file. No upload.',
    },
    intro: {
      ko: '영상의 짧은 구간을 GIF로 만들면 자동 재생되는 움짤로 어디서나 공유할 수 있습니다. 길이와 해상도를 줄이면 용량이 작아집니다. 변환은 브라우저 안(FFmpeg)에서 처리됩니다.',
      en: 'A short clip turned into a GIF auto-plays everywhere you share it. Trimming length and lowering resolution keeps the file small. Conversion runs in your browser (FFmpeg).',
    },
    steps: [
      {
        href: '/tools/video/to-gif',
        name: { ko: '구간 잘라 GIF로 변환', en: 'Trim and convert to GIF' },
        text: {
          ko: '영상을 올려 GIF로 만들 구간과 해상도를 정합니다.',
          en: 'Upload the video and choose the clip range and resolution for the GIF.',
        },
      },
    ],
    relatedConverts: ['mp4-to-gif', 'webm-to-gif'],
    faqs: [
      {
        q: { ko: 'GIF에 소리가 들어가나요?', en: 'Does the GIF include sound?' },
        a: {
          ko: '아니요. GIF는 무음이라 소리는 빠집니다. 소리가 필요하면 영상 포맷을 유지하세요.',
          en: 'No. GIFs are silent, so audio is dropped. Keep a video format if you need sound.',
        },
      },
      {
        q: { ko: 'GIF 용량이 너무 커요.', en: 'My GIF is too large.' },
        a: {
          ko: '길이를 짧게, 해상도를 낮추면 크게 줄어듭니다. 정말 작아야 하면 영상(MP4·WebM)이 더 효율적입니다.',
          en: 'Shorten the clip and lower the resolution. If it must be tiny, a video (MP4/WebM) is more efficient.',
        },
      },
    ],
    keywords: {
      ko: ['영상 gif 변환', '움짤 만들기', 'mp4 gif', '동영상 gif'],
      en: ['video to gif', 'make a gif', 'mp4 to gif', 'gif from video'],
    },
  },
  {
    slug: 'sign-and-stamp-contract',
    category: 'pdf',
    title: { ko: '계약서 전자서명·도장 찍기', en: 'Sign and Stamp a Contract' },
    h1: { ko: '계약서 서명·도장', en: 'Sign and stamp a contract' },
    description: {
      ko: '출력·스캔 없이 PDF 계약서에 직접 서명하고 직인을 찍으세요. 필요하면 암호까지. 업로드 없이 브라우저에서.',
      en: 'Sign a PDF contract and add a seal without printing or scanning — and password-protect it if needed. In your browser.',
    },
    intro: {
      ko: '계약서를 출력해 서명·날인한 뒤 다시 스캔할 필요가 없습니다. PDF에 직접 서명을 그려 넣고, 회사 직인 이미지를 만들어 얹은 뒤, 필요하면 암호를 걸어 보낼 수 있습니다. 문서는 브라우저를 벗어나지 않습니다.',
      en: 'No need to print, sign, stamp and re-scan. Draw your signature onto the PDF, generate a company seal to place on it, and optionally password-protect it before sending. The document never leaves your browser.',
    },
    steps: [
      {
        href: '/tools/image/seal',
        name: { ko: '직인·도장 이미지 만들기', en: 'Create a seal/stamp image' },
        text: {
          ko: '회사명·이름으로 투명배경 직인 PNG를 만듭니다(선택).',
          en: 'Generate a transparent-background seal PNG from a name (optional).',
        },
      },
      {
        href: '/tools/pdf/sign',
        name: { ko: 'PDF에 서명·직인 삽입', en: 'Add signature/seal to the PDF' },
        text: {
          ko: '마우스·터치로 서명을 그리고 직인 이미지를 원하는 위치에 얹습니다.',
          en: 'Draw your signature and place the seal image where you want it.',
        },
      },
      {
        href: '/tools/pdf/protect',
        name: { ko: '암호 걸기(선택)', en: 'Password-protect (optional)' },
        text: {
          ko: '민감한 계약서면 열람 암호를 설정해 내보냅니다.',
          en: 'Set an open password for sensitive contracts before exporting.',
        },
      },
    ],
    relatedCompares: ['merge-vs-split-pdf'],
    faqs: [
      {
        q: { ko: '전자서명이 법적 효력이 있나요?', en: 'Is an e-signature legally valid?' },
        a: {
          ko: '많은 국가에서 당사자 합의가 있으면 효력이 인정되지만, 사안·관할에 따라 다릅니다. 중요한 계약은 전문가 확인을 권합니다.',
          en: 'In many countries it is valid with mutual consent, but it depends on the matter and jurisdiction. Seek advice for important contracts.',
        },
      },
      {
        q: { ko: '문서가 서버로 올라가나요?', en: 'Is the document uploaded?' },
        a: {
          ko: '아니요. 서명·날인·암호화 모두 브라우저 안에서 처리됩니다.',
          en: 'No. Signing, stamping and encryption all happen in your browser.',
        },
      },
    ],
    keywords: {
      ko: ['계약서 전자서명', 'pdf 서명', '직인 찍기', 'pdf 도장'],
      en: ['sign contract pdf', 'esign pdf', 'add stamp pdf', 'pdf seal'],
    },
  },
  {
    slug: 'redact-before-sharing',
    category: 'security',
    title: { ko: '개인정보 가리고 안전하게 공유', en: 'Redact Personal Info Before Sharing' },
    h1: { ko: '개인정보 가리고 공유', en: 'Redact personal info before sharing' },
    description: {
      ko: '문서의 주민번호·계좌 등 민감정보와 사진 속 얼굴을 가린 뒤 공유하세요. 업로드 없이 브라우저에서.',
      en: 'Mask sensitive info (IDs, accounts) in documents and faces in photos before sharing. In your browser, no upload.',
    },
    intro: {
      ko: '캡처·서류를 그대로 올리면 주민번호·계좌·얼굴 같은 개인정보가 노출됩니다. 문서의 민감정보는 마스킹으로, 사진 속 얼굴은 모자이크로 가린 뒤 공유하면 안전합니다. 원본은 브라우저를 벗어나지 않습니다.',
      en: 'Posting screenshots or documents as-is can expose IDs, account numbers and faces. Mask sensitive text in documents and blur faces in photos before sharing. The originals never leave your browser.',
    },
    steps: [
      {
        href: '/tools/security/redact',
        name: { ko: '문서 민감정보 마스킹', en: 'Mask sensitive text' },
        text: {
          ko: '주민번호·계좌 등 민감정보를 찾아 가립니다.',
          en: 'Find and cover IDs, account numbers and other sensitive text.',
        },
      },
      {
        href: '/tools/image/blur-face',
        name: { ko: '사진 속 얼굴 가리기', en: 'Blur faces in photos' },
        text: {
          ko: '사진이라면 얼굴을 자동 감지해 모자이크·블러로 가립니다.',
          en: 'For photos, auto-detect faces and cover them with mosaic or blur.',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '가린 정보를 복구할 수 있나요?', en: 'Can the masked info be recovered?' },
        a: {
          ko: '내보낸 결과물에는 가림이 픽셀로 적용돼 원본이 남지 않습니다. 원본 파일은 따로 보관하세요.',
          en: 'The exported file bakes the cover into pixels, leaving no original underneath. Keep the source file separately.',
        },
      },
      {
        q: { ko: '데이터가 서버로 전송되나요?', en: 'Is any data sent to a server?' },
        a: {
          ko: '아니요. 마스킹·블러 모두 브라우저 안에서 처리됩니다.',
          en: 'No. Masking and blurring all happen in your browser.',
        },
      },
    ],
    keywords: {
      ko: ['개인정보 가리기', '민감정보 마스킹', '주민번호 가림', '캡처 모자이크'],
      en: ['redact personal info', 'mask sensitive data', 'blur before sharing', 'hide info screenshot'],
    },
  },
  {
    slug: 'extract-audio-from-video',
    category: 'audio',
    title: { ko: '영상에서 오디오(MP3) 추출하기', en: 'Extract Audio (MP3) from a Video' },
    h1: { ko: '영상에서 오디오 추출', en: 'Extract audio from a video' },
    description: {
      ko: '강의·회의·음악 영상에서 소리만 MP3로 뽑고, 필요한 구간만 잘라내세요. 업로드 없이 브라우저에서.',
      en: 'Pull just the sound from a lecture, meeting or music video as MP3 and trim the part you need. In your browser.',
    },
    intro: {
      ko: '영상에서 화면은 빼고 소리만 필요할 때가 많습니다. 오디오 트랙을 MP3로 추출한 뒤 원하는 구간만 잘라내면 강의 복습·회의 기록·음원으로 쓰기 좋습니다. 모든 처리가 브라우저(FFmpeg) 안에서 끝납니다.',
      en: 'Often you only need the sound, not the picture. Extract the audio track to MP3, then trim to the part you want — handy for revising lectures, keeping meeting records or saving music. It all runs in your browser (FFmpeg).',
    },
    steps: [
      {
        href: '/tools/audio/from-video',
        name: { ko: '영상 → MP3 추출', en: 'Extract video → MP3' },
        text: { ko: '영상을 올려 오디오 트랙을 MP3로 추출합니다.', en: 'Upload the video and extract its audio track as MP3.' },
      },
      {
        href: '/tools/audio/trim',
        name: { ko: '필요한 구간만 자르기(선택)', en: 'Trim to the part you need (optional)' },
        text: { ko: '필요한 부분만 남기고 앞뒤를 잘라냅니다.', en: 'Cut the start/end to keep only the part you need.' },
      },
    ],
    relatedConverts: ['mp4-to-mp3'],
    faqs: [
      {
        q: { ko: '화질·음질이 떨어지나요?', en: 'Does quality drop?' },
        a: { ko: '오디오는 원본 트랙을 그대로 추출하므로 음질 손실이 거의 없습니다. 비트레이트도 조절할 수 있습니다.', en: 'The audio track is extracted as-is, so there is little to no loss. You can also set the bitrate.' },
      },
      {
        q: { ko: '파일이 서버로 올라가나요?', en: 'Is the file uploaded?' },
        a: { ko: '아니요. 추출·자르기 모두 브라우저 안에서 처리됩니다.', en: 'No. Extraction and trimming all happen in your browser.' },
      },
    ],
    keywords: {
      ko: ['영상 음원 추출', 'mp4 mp3', '동영상 소리 추출', '강의 mp3'],
      en: ['extract audio from video', 'mp4 to mp3', 'video to audio', 'rip audio'],
    },
  },
  {
    slug: 'add-subtitles-to-video',
    category: 'video',
    title: { ko: '영상에 자막 입히기(굽기)', en: 'Add Subtitles to a Video (Burn-in)' },
    h1: { ko: '영상에 자막 굽기', en: 'Burn subtitles into a video' },
    description: {
      ko: 'SRT·VTT 자막을 영상에 영구 결합해 어디서나 자막이 보이게 만드세요. 업로드 없이 브라우저에서.',
      en: 'Permanently burn SRT/VTT subtitles into a video so they show everywhere. In your browser, no upload.',
    },
    intro: {
      ko: '플랫폼에 따라 별도 자막 파일을 못 읽는 경우가 많습니다. 자막을 영상에 직접 구워 넣으면(하드섭) 어떤 플레이어·SNS에서도 자막이 그대로 보입니다. 변환은 브라우저(FFmpeg)에서 처리됩니다.',
      en: 'Many platforms can’t load a separate subtitle file. Burning subtitles into the video (hard-subbing) means they appear in any player or social app. Conversion runs in your browser (FFmpeg).',
    },
    steps: [
      {
        href: '/tools/video/burn-subtitle',
        name: { ko: '자막 파일 + 영상 결합', en: 'Combine subtitle file + video' },
        text: { ko: 'SRT/VTT/ASS 자막과 영상을 올려 자막을 영구 결합합니다.', en: 'Upload your SRT/VTT/ASS subtitles and the video to burn them in permanently.' },
      },
    ],
    faqs: [
      {
        q: { ko: '자막을 나중에 끌 수 있나요?', en: 'Can I turn the subtitles off later?' },
        a: { ko: '아니요. 구운 자막은 화면에 영구 결합되어 끌 수 없습니다. 끄고 켜야 하면 자막 파일을 따로 두세요.', en: 'No. Burned-in subtitles are permanent and can’t be toggled. Keep a separate subtitle file if you need that.' },
      },
      {
        q: { ko: '글꼴·위치를 바꿀 수 있나요?', en: 'Can I change the font or position?' },
        a: { ko: 'ASS 자막은 스타일(글꼴·색·위치)을 지정할 수 있습니다. SRT는 기본 스타일로 표시됩니다.', en: 'ASS subtitles support styling (font, color, position). SRT shows with a default style.' },
      },
    ],
    keywords: {
      ko: ['영상 자막 굽기', '하드섭', 'srt 영상 결합', '자막 입히기'],
      en: ['burn subtitles', 'hardcode subtitles', 'add srt to video', 'hardsub'],
    },
  },
  {
    slug: 'extract-text-from-image',
    category: 'ai',
    title: { ko: '사진 속 글자 추출하기 (OCR)', en: 'Extract Text from an Image (OCR)' },
    h1: { ko: '사진 속 글자 추출 (OCR)', en: 'Extract text from an image (OCR)' },
    description: {
      ko: '캡처·문서 사진 속 글자를 인식해 편집 가능한 텍스트로 뽑으세요. 한국어·영어 지원, 업로드 없음.',
      en: 'Recognize text in screenshots or document photos and pull it out as editable text. Korean/English, no upload.',
    },
    intro: {
      ko: '사진이나 캡처에 있는 글자는 복사할 수 없어 다시 타이핑하기 번거롭습니다. OCR로 인식하면 편집·검색 가능한 텍스트로 바뀝니다. 인식은 브라우저(Tesseract) 안에서 처리돼 이미지가 업로드되지 않습니다.',
      en: 'Text inside a photo or screenshot can’t be copied, so retyping is a pain. OCR turns it into editable, searchable text. Recognition runs in your browser (Tesseract) — the image is never uploaded.',
    },
    steps: [
      {
        href: '/tools/ocr',
        name: { ko: '이미지에서 텍스트 인식', en: 'Recognize text from the image' },
        text: { ko: '이미지를 올리고 언어를 골라 텍스트를 추출합니다.', en: 'Upload the image, pick the language and extract the text.' },
      },
    ],
    faqs: [
      {
        q: { ko: '한국어도 인식되나요?', en: 'Does it recognize Korean?' },
        a: { ko: '네. 한국어·영어를 지원하며 언어를 선택해 정확도를 높일 수 있습니다.', en: 'Yes. Korean and English are supported; choose the language for better accuracy.' },
      },
      {
        q: { ko: '인식 정확도를 높이려면?', en: 'How to improve accuracy?' },
        a: { ko: '선명하고 반듯한 고해상도 이미지일수록 정확합니다. 기울거나 흐린 사진은 정확도가 떨어집니다.', en: 'Sharp, straight, high-resolution images work best. Skewed or blurry photos reduce accuracy.' },
      },
    ],
    keywords: {
      ko: ['사진 글자 추출', 'ocr 무료', '이미지 텍스트 변환', '캡처 글자 복사'],
      en: ['extract text from image', 'free ocr', 'image to text', 'photo text copy'],
    },
  },
  {
    slug: 'remove-photo-background',
    category: 'ai',
    title: { ko: '사진 배경 제거하기', en: 'Remove a Photo Background' },
    h1: { ko: '사진 배경 제거', en: 'Remove a photo background' },
    description: {
      ko: '인물·상품 사진의 배경을 자동으로 지워 투명 PNG로 만드세요. 증명사진·쇼핑몰·로고에 활용. 업로드 없음.',
      en: 'Auto-erase the background of people or product photos into a transparent PNG. Great for IDs, shops, logos. No upload.',
    },
    intro: {
      ko: 'AI가 피사체와 배경을 분리해 배경을 깔끔히 지웁니다. 투명 PNG로 저장하면 증명사진 배경 교체, 쇼핑몰 상품컷, 로고 제작 등에 바로 쓸 수 있습니다. 처리는 브라우저(ONNX) 안에서 끝납니다.',
      en: 'AI separates the subject from the background and erases it cleanly. Save as a transparent PNG to swap ID-photo backgrounds, make product cutouts or build logos. Processing runs in your browser (ONNX).',
    },
    steps: [
      {
        href: '/tools/image/remove-background',
        name: { ko: '배경 자동 제거', en: 'Auto-remove the background' },
        text: { ko: '사진을 올리면 배경을 자동으로 지워 투명 PNG로 만듭니다.', en: 'Upload the photo to auto-erase the background into a transparent PNG.' },
      },
      {
        href: '/tools/image/id-photo',
        name: { ko: '증명사진 배경색 적용(선택)', en: 'Apply an ID background (optional)' },
        text: { ko: '증명사진이면 흰색·파란색 배경을 새로 입힙니다.', en: 'For an ID photo, add a new white/blue background.' },
      },
    ],
    relatedConverts: ['png-to-jpg'],
    faqs: [
      {
        q: { ko: '머리카락처럼 복잡한 경계도 되나요?', en: 'Does it handle hair edges?' },
        a: { ko: 'AI 매팅으로 머리카락 경계도 비교적 자연스럽게 처리하지만, 복잡한 배경에선 약간의 보정이 필요할 수 있습니다.', en: 'AI matting handles hair edges fairly well, though busy backgrounds may need minor touch-ups.' },
      },
      {
        q: { ko: '결과를 흰 배경 JPG로 저장할 수 있나요?', en: 'Can I save it as a white-background JPG?' },
        a: { ko: '네. 투명 PNG로 받은 뒤 증명사진 도구나 변환으로 흰 배경 JPG를 만들 수 있습니다.', en: 'Yes. Save the transparent PNG, then use the ID-photo tool or a converter for a white-background JPG.' },
      },
    ],
    keywords: {
      ko: ['사진 배경 제거', '누끼 따기', '투명배경 png', '배경 지우기'],
      en: ['remove background', 'transparent png', 'background eraser', 'cutout photo'],
    },
  },
  {
    slug: 'make-ebook-from-text',
    category: 'docs',
    title: { ko: '텍스트로 전자책(EPUB) 만들기', en: 'Make an E-book (EPUB) from Text' },
    h1: { ko: '텍스트로 전자책 만들기', en: 'Make an e-book from text' },
    description: {
      ko: '원고 텍스트(TXT)를 전자책 리더용 EPUB으로 만들고, 필요하면 PDF로도. 업로드 없이 브라우저에서.',
      en: 'Turn a text manuscript (TXT) into a reader-ready EPUB, and optionally a PDF. In your browser, no upload.',
    },
    intro: {
      ko: '직접 쓴 글을 전자책으로 배포하려면 EPUB 형식이 표준입니다. 텍스트 원고를 EPUB으로 변환하면 글자 크기·줄바꿈이 화면에 맞춰 재배치되어 어떤 리더에서도 읽기 좋습니다. 변환은 브라우저 안에서 처리됩니다.',
      en: 'EPUB is the standard for distributing your own writing as an e-book. Converting a text manuscript to EPUB lets the type reflow to any screen, so it reads well on any reader. Conversion runs in your browser.',
    },
    steps: [
      {
        href: '/tools/docs/txt-to-epub',
        name: { ko: 'TXT → EPUB 변환', en: 'Convert TXT → EPUB' },
        text: { ko: '텍스트 원고를 올려 제목·저자를 넣고 EPUB으로 만듭니다.', en: 'Upload your text, add a title/author and build the EPUB.' },
      },
      {
        href: '/tools/docs/epub-to-pdf',
        name: { ko: 'EPUB → PDF(선택)', en: 'EPUB → PDF (optional)' },
        text: { ko: '인쇄·고정 레이아웃이 필요하면 PDF로도 변환합니다.', en: 'Also convert to PDF if you need print or a fixed layout.' },
      },
    ],
    relatedConverts: ['txt-to-epub', 'epub-to-pdf'],
    relatedCompares: ['epub-vs-pdf'],
    faqs: [
      {
        q: { ko: '표지 이미지를 넣을 수 있나요?', en: 'Can I add a cover image?' },
        a: { ko: 'EPUB 표지 도구로 표지를 교체·삽입할 수 있습니다. 변환 후 표지를 추가하세요.', en: 'Use the EPUB cover tool to add or replace a cover after converting.' },
      },
      {
        q: { ko: '챕터를 나눌 수 있나요?', en: 'Can I split chapters?' },
        a: { ko: '원고의 제목/구분에 따라 챕터가 구성됩니다. 세부 편집은 EPUB 편집 도구를 함께 쓰세요.', en: 'Chapters form from your manuscript’s headings. Use the EPUB editing tools for finer control.' },
      },
    ],
    keywords: {
      ko: ['전자책 만들기', 'txt epub', 'epub 변환', '전자출판'],
      en: ['make ebook', 'txt to epub', 'create epub', 'self publish'],
    },
  },
  {
    slug: 'watermark-photos',
    category: 'image',
    title: { ko: '사진에 워터마크 넣기', en: 'Add a Watermark to Photos' },
    h1: { ko: '사진 워터마크', en: 'Watermark your photos' },
    description: {
      ko: '도용 방지를 위해 사진에 텍스트·로고 워터마크를 넣으세요. 위치·투명도 조절, 업로드 없이 브라우저에서.',
      en: 'Add a text or logo watermark to deter theft. Adjust position and opacity — in your browser, no upload.',
    },
    intro: {
      ko: '온라인에 올린 사진은 쉽게 도용됩니다. 텍스트나 로고 워터마크를 넣으면 출처를 표시하고 무단 사용을 줄일 수 있습니다. 위치·크기·투명도를 조절해 자연스럽게 넣으세요. 처리는 브라우저 안에서 끝납니다.',
      en: 'Photos posted online are easily reused. A text or logo watermark marks ownership and discourages misuse. Tune position, size and opacity for a natural look. Processing happens in your browser.',
    },
    steps: [
      {
        href: '/tools/image/watermark',
        name: { ko: '텍스트·로고 워터마크 합성', en: 'Composite a text/logo watermark' },
        text: { ko: '사진을 올려 텍스트나 로고를 얹고 위치·투명도를 조절합니다.', en: 'Upload the photo, add text or a logo, and adjust position/opacity.' },
      },
    ],
    faqs: [
      {
        q: { ko: '여러 장에 같은 워터마크를 넣을 수 있나요?', en: 'Can I watermark many photos the same way?' },
        a: { ko: '폴더 일괄 모드로 동일한 워터마크를 여러 장에 적용하고 묶어 받을 수 있습니다.', en: 'Folder mode applies the same watermark to many photos and bundles them.' },
      },
      {
        q: { ko: '워터마크가 사진을 가리지 않게 하려면?', en: 'How to keep it from covering the photo?' },
        a: { ko: '투명도를 낮추고 모서리에 배치하면 내용은 살리면서 출처만 표시됩니다.', en: 'Lower the opacity and place it in a corner to mark ownership without hiding content.' },
      },
    ],
    keywords: {
      ko: ['사진 워터마크', '로고 삽입', '도용 방지', '이미지 워터마크'],
      en: ['watermark photo', 'add logo', 'prevent theft', 'image watermark'],
    },
  },

  /* ── 콘텐츠 확장 2026-06 (2차) ── */
  {
    slug: 'photos-into-one-pdf',
    category: 'pdf',
    title: { ko: '여러 사진을 PDF 한 권으로 묶기', en: 'Combine Many Photos into One PDF' },
    h1: { ko: '사진 여러 장을 PDF로', en: 'Many photos into one PDF' },
    description: {
      ko: '영수증·문서·사진 여러 장을 순서대로 묶어 하나의 PDF로 만드세요. 용량까지 줄여 메일·제출에 딱. 업로드 없음.',
      en: 'Bundle receipts, documents or photos in order into a single PDF, then shrink it for email and uploads. No upload.',
    },
    intro: {
      ko: '사진을 한 장씩 보내는 대신 한 권의 PDF로 묶으면 정리·제출이 훨씬 쉽습니다. 먼저 너무 큰 사진은 가볍게 줄이고, 원하는 순서로 PDF에 합친 뒤, 페이지를 재배열하면 끝입니다. 모든 처리는 브라우저 안에서 이뤄져 파일이 업로드되지 않습니다.',
      en: 'Instead of sending photos one by one, bundling them into a single PDF makes them easy to organize and submit. Shrink oversized photos first, combine them into a PDF in the order you want, then reorder pages. Everything runs in your browser — files are never uploaded.',
    },
    steps: [
      {
        href: '/tools/image/batch-compress',
        name: { ko: '큰 사진 미리 줄이기', en: 'Shrink large photos first' },
        text: { ko: '용량이 큰 사진들을 일괄 압축해 최종 PDF를 가볍게 만듭니다.', en: 'Batch-compress heavy photos so the final PDF stays light.' },
      },
      {
        href: '/tools/pdf/from-jpg',
        name: { ko: '사진을 순서대로 PDF에 묶기', en: 'Combine photos into a PDF' },
        text: { ko: 'JPG·PNG·HEIC 여러 장을 원하는 순서로 하나의 PDF로 만듭니다.', en: 'Merge several JPG/PNG/HEIC images into one PDF in the order you want.' },
      },
      {
        href: '/tools/pdf/organize',
        name: { ko: '페이지 순서 다듬기', en: 'Fine-tune page order' },
        text: { ko: '썸네일을 보며 페이지를 재정렬·삭제해 마무리합니다.', en: 'Reorder or delete pages with thumbnails to finish.' },
      },
    ],
    relatedConverts: ['jpg-to-pdf', 'png-to-pdf'],
    relatedCompares: ['jpg-to-pdf-vs-pdf-to-jpg'],
    faqs: [
      {
        q: { ko: '사진 순서를 바꿀 수 있나요?', en: 'Can I change the photo order?' },
        a: { ko: '네. PDF로 묶을 때 순서를 정하고, 이후 페이지 정리 도구로 다시 재배열할 수 있습니다.', en: 'Yes. Set the order when combining, then rearrange again with the page-organize tool.' },
      },
      {
        q: { ko: '아이폰 HEIC 사진도 되나요?', en: 'Does it work with iPhone HEIC photos?' },
        a: { ko: '네. HEIC를 포함해 JPG·PNG·WebP를 그대로 PDF로 묶을 수 있습니다.', en: 'Yes. HEIC, JPG, PNG and WebP can all be bundled into a PDF directly.' },
      },
    ],
    keywords: {
      ko: ['사진 pdf로 묶기', '여러 사진 pdf', '이미지 pdf 합치기', '영수증 pdf'],
      en: ['photos to pdf', 'combine images pdf', 'jpg to pdf multiple', 'receipts to pdf'],
    },
  },
  {
    slug: 'password-protect-pdf',
    category: 'pdf',
    title: { ko: 'PDF에 암호 걸어 안전하게 보내기', en: 'Password-Protect a PDF Before Sending' },
    h1: { ko: 'PDF 암호 설정', en: 'Password-protect a PDF' },
    description: {
      ko: '계약서·명세서 PDF에 열람 암호와 인쇄·편집 권한을 설정해 안전하게 공유하세요. 업로드 없이 브라우저에서.',
      en: 'Add an open password and print/edit permissions to contracts and statements before sharing. In your browser, no upload.',
    },
    intro: {
      ko: '민감한 PDF를 메일로 보낼 때는 열람 암호를 걸어 두는 것이 안전합니다. 필요하면 먼저 서명을 넣고, 암호와 인쇄·편집·복사 권한을 설정한 뒤 공유하세요. 암호 설정은 브라우저 안에서 처리되어 원본 파일이 서버로 올라가지 않습니다.',
      en: 'When emailing a sensitive PDF, an open password keeps it safe. Sign it first if needed, then set a password and print/edit/copy permissions before sharing. Protection happens in your browser — the original file is never uploaded.',
    },
    steps: [
      {
        href: '/tools/pdf/sign',
        name: { ko: '필요하면 서명 먼저', en: 'Sign first if needed' },
        text: { ko: '계약서라면 마우스·터치로 서명을 넣어 둡니다.', en: 'For a contract, add your signature by mouse or touch.' },
      },
      {
        href: '/tools/pdf/protect',
        name: { ko: '암호·권한 설정', en: 'Set password and permissions' },
        text: { ko: '열람 암호와 인쇄·편집·복사 권한을 지정해 저장합니다.', en: 'Set an open password and print/edit/copy permissions, then save.' },
      },
    ],
    relatedCompares: ['merge-vs-split-pdf'],
    faqs: [
      {
        q: { ko: '암호를 잊으면 풀 수 있나요?', en: 'Can I unlock it if I forget the password?' },
        a: { ko: '본인이 아는 암호로 보호된 PDF는 잠금 해제 도구로 풀 수 있지만, 모르는 암호는 복구할 수 없습니다.', en: 'A PDF you protected can be unlocked with the unlock tool if you know the password, but a forgotten password cannot be recovered.' },
      },
      {
        q: { ko: '인쇄만 막고 열람은 허용할 수 있나요?', en: 'Can I block printing but allow viewing?' },
        a: { ko: '네. 권한 암호로 인쇄·편집·복사를 개별로 제한하면서 열람은 허용할 수 있습니다.', en: 'Yes. A permissions password can restrict printing/editing/copying individually while still allowing viewing.' },
      },
    ],
    keywords: {
      ko: ['pdf 암호 설정', 'pdf 비밀번호', 'pdf 보호', 'pdf 권한'],
      en: ['password protect pdf', 'pdf password', 'secure pdf', 'pdf permissions'],
    },
  },
  {
    slug: 'iphone-photos-for-windows',
    category: 'image',
    title: { ko: '아이폰 HEIC 사진 윈도우에서 열기', en: 'Open iPhone HEIC Photos on Windows' },
    h1: { ko: '아이폰 사진 변환', en: 'Convert iPhone photos' },
    description: {
      ko: '윈도우·웹에서 안 열리는 아이폰 HEIC 사진을 JPG로 일괄 변환하고, 위치정보(EXIF)까지 지워 안전하게 공유하세요.',
      en: 'Batch-convert iPhone HEIC photos that won’t open on Windows/web to JPG, and strip location (EXIF) data for safe sharing.',
    },
    intro: {
      ko: '아이폰은 사진을 HEIC로 저장해 용량을 아끼지만, 윈도우·일부 웹·구형 앱은 이를 열지 못합니다. JPG로 일괄 변환하면 어디서나 열리고, 공유 전 GPS·촬영정보를 지우면 위치 노출도 막을 수 있습니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'iPhones save photos as HEIC to save space, but Windows, some websites and old apps can’t open them. Batch-convert to JPG so they open anywhere, and strip GPS/EXIF before sharing to avoid leaking your location. Everything runs in your browser.',
    },
    steps: [
      {
        href: '/tools/image/heic-to-jpg',
        name: { ko: 'HEIC → JPG 일괄 변환', en: 'Batch HEIC → JPG' },
        text: { ko: 'HEIC 사진을 여러 장 올려 한 번에 JPG로 변환합니다.', en: 'Drop several HEIC photos to convert them to JPG at once.' },
      },
      {
        href: '/tools/image/exif-batch',
        name: { ko: '위치정보(EXIF) 일괄 제거', en: 'Strip location (EXIF)' },
        text: { ko: '공유 전 GPS·촬영정보를 여러 장에서 한꺼번에 지웁니다.', en: 'Remove GPS/EXIF from many photos at once before sharing.' },
      },
    ],
    relatedConverts: ['heic-to-jpg', 'heic-to-png'],
    relatedCompares: ['heic-vs-jpg'],
    faqs: [
      {
        q: { ko: '여러 장을 한 번에 변환하나요?', en: 'Can I convert many at once?' },
        a: { ko: '네. HEIC 여러 장을 올려 일괄 변환하고 ZIP으로 받을 수 있습니다.', en: 'Yes. Drop multiple HEIC files to batch-convert and download as a ZIP.' },
      },
      {
        q: { ko: '화질이 떨어지나요?', en: 'Does quality drop?' },
        a: { ko: 'JPG로 재인코딩하며 작은 손실이 생기지만 높은 품질 설정에선 거의 알아챌 수 없습니다.', en: 'Re-encoding to JPG adds a small loss that is hard to notice at high quality settings.' },
      },
    ],
    keywords: {
      ko: ['heic jpg 변환', '아이폰 사진 윈도우', 'heic 안열림', '아이폰 사진 변환'],
      en: ['heic to jpg windows', 'open iphone photos', 'convert heic', 'heic not opening'],
    },
  },
  {
    slug: 'compress-video-for-upload',
    category: 'video',
    title: { ko: '영상 용량 줄여 업로드하기', en: 'Compress a Video for Upload' },
    h1: { ko: '영상 압축해서 올리기', en: 'Compress a video to upload' },
    description: {
      ko: '용량 제한에 걸리는 영상을 필요한 구간만 잘라내고 압축해 가볍게 만드세요. 업로드 없이 브라우저에서.',
      en: 'Trim to the part you need and compress videos that hit upload limits. In your browser, no upload.',
    },
    intro: {
      ko: '메신저·게시판·메일은 영상 용량에 제한이 있습니다. 먼저 필요 없는 앞뒤 구간을 잘라내 길이를 줄이고, 해상도·비트레이트를 낮춰 압축하면 화질을 크게 해치지 않고 용량을 줄일 수 있습니다. 모든 처리는 브라우저 안에서 끝나 영상이 업로드되지 않습니다.',
      en: 'Messengers, forums and email cap video size. Trim the unneeded head and tail to shorten it, then lower the resolution/bitrate to compress — cutting size without ruining quality. Everything runs in your browser, so the video is never uploaded.',
    },
    steps: [
      {
        href: '/tools/video/trim',
        name: { ko: '필요한 구간만 자르기', en: 'Trim to what you need' },
        text: { ko: '시작·종료 시각을 지정해 필요한 구간만 남깁니다.', en: 'Set start/end times to keep only the part you need.' },
      },
      {
        href: '/tools/video/compress',
        name: { ko: '해상도·비트레이트 낮춰 압축', en: 'Compress by resolution/bitrate' },
        text: { ko: '해상도와 비트레이트를 조정해 용량 제한에 맞춥니다.', en: 'Adjust resolution and bitrate to fit the size limit.' },
      },
    ],
    relatedConverts: ['mov-to-mp4', 'mkv-to-mp4'],
    relatedCompares: ['mp4-vs-webm'],
    faqs: [
      {
        q: { ko: '화질을 최대한 지키며 줄이려면?', en: 'How to shrink while keeping quality?' },
        a: { ko: '먼저 불필요한 구간을 잘라 길이를 줄이고, 해상도는 그대로 두되 비트레이트만 낮추면 화질 손실을 줄일 수 있습니다.', en: 'Trim first to shorten length, then keep the resolution but lower only the bitrate to minimize quality loss.' },
      },
      {
        q: { ko: 'MOV·MKV 영상도 되나요?', en: 'Does it work with MOV/MKV?' },
        a: { ko: '네. 다양한 포맷을 다루며, 업로드 호환을 위해 MP4로 변환해 두면 더 안전합니다.', en: 'Yes. It handles many formats; converting to MP4 first makes uploads more compatible.' },
      },
    ],
    keywords: {
      ko: ['영상 용량 줄이기', '동영상 압축', '영상 업로드 용량', 'mp4 압축'],
      en: ['compress video upload', 'reduce video size', 'shrink mp4', 'video too large'],
    },
  },
  {
    slug: 'read-pdf-on-ereader',
    category: 'docs',
    title: { ko: 'PDF를 전자책 리더에서 편하게 읽기', en: 'Read a PDF Comfortably on an E-reader' },
    h1: { ko: 'PDF를 EPUB으로', en: 'PDF to e-reader EPUB' },
    description: {
      ko: '작은 화면에서 확대·축소가 불편한 PDF를 EPUB으로 바꿔 글자가 화면에 맞춰 흐르게 만드세요. 업로드 없이 브라우저에서.',
      en: 'Turn a pinch-and-zoom PDF into an EPUB whose text reflows to fit any screen. In your browser, no upload.',
    },
    intro: {
      ko: 'PDF는 레이아웃이 고정돼 작은 폰·전자책 단말에서는 확대·축소를 반복해야 합니다. EPUB으로 변환하면 글자가 화면 크기에 맞춰 재배치되어 글꼴·크기를 조절하며 편하게 읽을 수 있습니다. 변환 후 제목·저자 정보를 정리하면 서재 정렬도 깔끔해집니다.',
      en: 'A PDF’s fixed layout forces constant pinch-and-zoom on phones and e-readers. Converting to EPUB reflows the text to the screen so you can adjust font and size and read comfortably. Tidying the title/author afterward keeps your library organized.',
    },
    steps: [
      {
        href: '/tools/pdf/to-epub',
        name: { ko: 'PDF → EPUB 변환', en: 'Convert PDF → EPUB' },
        text: { ko: 'PDF 텍스트를 추출해 챕터가 나뉜 EPUB 전자책으로 만듭니다.', en: 'Extract the PDF text into a chaptered EPUB e-book.' },
      },
      {
        href: '/tools/docs/epub-metadata',
        name: { ko: '제목·저자 정보 정리', en: 'Tidy title/author' },
        text: { ko: '제목·저자·언어를 채워 리더 서재에서 깔끔하게 정렬되게 합니다.', en: 'Fill in title/author/language so it sorts neatly in your reader.' },
      },
      {
        href: '/tools/docs/epub-reader',
        name: { ko: '브라우저에서 바로 확인', en: 'Preview in the browser' },
        text: { ko: '변환 결과를 EPUB 리더로 열어 목차·글자 크기를 확인합니다.', en: 'Open the result in the EPUB reader to check the table of contents and font size.' },
      },
    ],
    relatedConverts: ['pdf-to-epub', 'epub-to-pdf'],
    relatedCompares: ['epub-vs-pdf'],
    faqs: [
      {
        q: { ko: '표·이미지가 많은 PDF도 잘 되나요?', en: 'Does it handle PDFs with many tables/images?' },
        a: { ko: 'EPUB은 글이 흐르는 책에 가장 적합합니다. 도표가 정확히 고정돼야 한다면 PDF가 더 낫습니다.', en: 'EPUB suits flowing text best. If charts must stay exactly placed, PDF is better.' },
      },
      {
        q: { ko: '다시 PDF로 되돌릴 수 있나요?', en: 'Can I convert it back to PDF?' },
        a: { ko: '네. EPUB→PDF 변환으로 다시 고정 레이아웃 문서로 만들 수 있습니다.', en: 'Yes. An EPUB→PDF conversion turns it back into a fixed-layout document.' },
      },
    ],
    keywords: {
      ko: ['pdf epub 변환', 'pdf 전자책', '전자책 리더 pdf', 'pdf 흐름 읽기'],
      en: ['pdf to epub', 'read pdf ereader', 'pdf reflow', 'pdf ebook'],
    },
  },
  {
    slug: 'pdf-table-to-spreadsheet',
    category: 'pdf',
    title: { ko: 'PDF 표를 엑셀로 뽑아내기', en: 'Pull a PDF Table into a Spreadsheet' },
    h1: { ko: 'PDF 표 → 엑셀', en: 'PDF table to spreadsheet' },
    description: {
      ko: '명세서·보고서 PDF 속 표를 인식해 엑셀(XLSX)·CSV로 추출하세요. 다시 타이핑할 필요 없이, 업로드 없이 브라우저에서.',
      en: 'Detect tables inside statements and reports and extract them to Excel (XLSX)/CSV — no retyping, in your browser.',
    },
    intro: {
      ko: 'PDF에 박힌 표를 손으로 다시 옮겨 적는 건 번거롭고 실수가 잦습니다. 표 인식 도구로 행·열을 그대로 XLSX·CSV로 뽑아내면, 바로 계산·정렬·필터를 적용할 수 있습니다. 필요하면 CSV를 JSON 등 다른 데이터 포맷으로 다시 변환하세요. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'Retyping a table locked inside a PDF is tedious and error-prone. A table-detection tool pulls the rows and columns straight into XLSX/CSV so you can calculate, sort and filter right away. Convert the CSV to JSON or other data formats if needed. Everything runs in your browser.',
    },
    steps: [
      {
        href: '/tools/pdf/to-excel',
        name: { ko: 'PDF 표 인식 → 엑셀 추출', en: 'Detect PDF tables → Excel' },
        text: { ko: 'PDF 속 표를 인식해 XLSX·CSV로 추출합니다.', en: 'Detect tables in the PDF and extract them to XLSX/CSV.' },
      },
      {
        href: '/tools/docs/csv-json',
        name: { ko: '필요하면 JSON으로 변환', en: 'Convert to JSON if needed' },
        text: { ko: '추출한 CSV를 프로그램에서 쓰기 좋은 JSON으로 바꿉니다.', en: 'Turn the extracted CSV into program-friendly JSON.' },
      },
    ],
    relatedConverts: ['pdf-to-xlsx', 'csv-to-json'],
    relatedCompares: ['csv-vs-json'],
    faqs: [
      {
        q: { ko: '복잡한 표도 정확히 추출되나요?', en: 'Does it handle complex tables accurately?' },
        a: { ko: '단순한 격자 표일수록 정확합니다. 병합 셀이 많으면 추출 후 약간의 정리가 필요할 수 있습니다.', en: 'Plain grid tables extract most accurately. Heavily merged cells may need a little cleanup afterward.' },
      },
      {
        q: { ko: '스캔한 이미지 PDF도 되나요?', en: 'What about scanned image PDFs?' },
        a: { ko: '텍스트가 들어 있는 PDF에서 가장 잘 동작합니다. 스캔 이미지라면 먼저 OCR로 텍스트화하는 것이 좋습니다.', en: 'It works best on PDFs that contain real text. For scans, run OCR to extract text first.' },
      },
    ],
    keywords: {
      ko: ['pdf 표 엑셀', 'pdf 표 추출', 'pdf 엑셀 변환', '명세서 엑셀'],
      en: ['pdf table to excel', 'extract pdf table', 'pdf to xlsx', 'statement to excel'],
    },
  },

  /* ── EN 활용법·비교 확대 2026-06 (3차) ── */
  {
    slug: 'anonymize-video-before-posting',
    category: 'video',
    title: { ko: '영상 올리기 전 얼굴 가리기', en: 'Blur Faces in a Video Before Posting' },
    h1: { ko: '영상 속 얼굴 모자이크', en: 'Anonymize faces in a video' },
    description: {
      ko: 'SNS·유튜브에 올리기 전 영상 속 지나가는 사람들 얼굴을 추적해 블러·모자이크하세요. 필요한 구간만 잘라서, 업로드 없이 브라우저에서.',
      en: 'Track and blur bystanders’ faces in a video before posting to social or YouTube, and trim to just the part you need. In your browser, no upload.',
    },
    intro: {
      ko: 'AI가 영상 속 얼굴을 프레임마다 추적해 블러·모자이크·이모지로 가립니다. 먼저 필요 없는 앞뒤를 잘라 길이를 줄이면 처리도 빨라집니다. 오디오는 그대로 유지되며, 모든 처리는 브라우저 안에서 끝나 영상이 업로드되지 않습니다.',
      en: 'AI tracks faces frame by frame and covers them with blur, mosaic or emoji. Trim the unneeded head and tail first to shorten it and speed up processing. The audio stays intact, and everything runs in your browser so the video is never uploaded.',
    },
    steps: [
      {
        href: '/tools/video/trim',
        name: { ko: '필요한 구간만 자르기', en: 'Trim to what you need' },
        text: { ko: '시작·종료 시각을 지정해 필요한 부분만 남깁니다.', en: 'Set start/end times to keep only the part you need.' },
      },
      {
        href: '/tools/video/blur-face',
        name: { ko: '얼굴 추적 + 가림', en: 'Track + cover faces' },
        text: { ko: '영상 속 얼굴을 자동 추적해 블러·모자이크·이모지로 가립니다.', en: 'Auto-track faces and cover them with blur, mosaic or emoji.' },
      },
    ],
    relatedConverts: ['mov-to-mp4', 'mkv-to-mp4'],
    relatedCompares: ['mp4-vs-webm'],
    faqs: [
      {
        q: { ko: '측면·뒷모습 얼굴도 가려지나요?', en: 'Does it cover side and back-facing faces?' },
        a: { ko: '정면 얼굴이 가장 잘 잡힙니다. 놓친 구간은 영역을 직접 추가해 보완할 수 있습니다.', en: 'Front-facing faces are caught best. You can add regions manually to cover any that are missed.' },
      },
      {
        q: { ko: '오디오는 유지되나요?', en: 'Is the audio kept?' },
        a: { ko: '네. 화면의 얼굴만 가리고 원본 오디오는 그대로 남습니다.', en: 'Yes. Only the on-screen faces are covered; the original audio is preserved.' },
      },
    ],
    keywords: {
      ko: ['영상 얼굴 모자이크', '동영상 얼굴 블러', '영상 익명화', '행인 얼굴 가리기'],
      en: ['blur faces in video', 'anonymize video', 'video face blur', 'hide faces video'],
    },
  },
  {
    slug: 'make-meme-gif-with-caption',
    category: 'gif',
    title: { ko: '자막 넣은 밈 GIF 만들기', en: 'Make a Captioned Meme GIF' },
    h1: { ko: '자막 GIF 만들기', en: 'Make a captioned GIF' },
    description: {
      ko: '영상 한 구간을 GIF로 만들고 위에 자막을 얹은 뒤 용량까지 줄이세요. 업로드 없이 브라우저에서.',
      en: 'Turn a clip into a GIF, add a caption on top, then shrink the file. In your browser, no upload.',
    },
    intro: {
      ko: '밈 GIF는 세 단계면 됩니다. 영상에서 원하는 짧은 구간을 GIF로 뽑고, 텍스트 자막을 얹은 뒤, 팔레트·프레임 최적화로 용량을 줄여 어디든 올리기 좋게 만듭니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'A meme GIF takes three steps: pull a short clip from a video as a GIF, add a text caption, then optimize the palette and frames to shrink it for posting anywhere. Everything runs in your browser.',
    },
    steps: [
      {
        href: '/tools/video/to-gif',
        name: { ko: '영상 → GIF', en: 'Clip → GIF' },
        text: { ko: '영상에서 원하는 구간을 골라 GIF로 변환합니다.', en: 'Pick a section of the video and convert it to a GIF.' },
      },
      {
        href: '/tools/gif/text',
        name: { ko: '자막 얹기', en: 'Add a caption' },
        text: { ko: 'GIF 위에 표시될 텍스트·자막을 추가합니다.', en: 'Add text that shows across the GIF.' },
      },
      {
        href: '/tools/gif/optimize',
        name: { ko: '용량 줄이기', en: 'Shrink the file' },
        text: { ko: '팔레트·프레임을 최적화해 용량을 줄입니다.', en: 'Optimize palette and frames to reduce the size.' },
      },
    ],
    relatedConverts: ['mp4-to-gif', 'webm-to-gif'],
    relatedCompares: ['gif-vs-mp4'],
    faqs: [
      {
        q: { ko: 'GIF가 너무 커요.', en: 'My GIF is too large.' },
        a: { ko: '길이를 줄이고 크기·색을 낮추세요. 정교한 영상이면 GIF 대신 MP4가 훨씬 작습니다.', en: 'Trim length and lower size/colors. For detailed clips, MP4 is far smaller than GIF.' },
      },
      {
        q: { ko: '자막 위치를 바꿀 수 있나요?', en: 'Can I move the caption?' },
        a: { ko: '네. 텍스트 위치·크기를 조절해 상단·하단 어디든 배치할 수 있습니다.', en: 'Yes. Adjust the text position and size to place it top, bottom or anywhere.' },
      },
    ],
    keywords: {
      ko: ['밈 gif 만들기', 'gif 자막', '영상 gif 자막', 'gif 텍스트'],
      en: ['make meme gif', 'caption gif', 'gif with text', 'video to gif caption'],
    },
  },
  {
    slug: 'split-pdf-into-chapters',
    category: 'pdf',
    title: { ko: '큰 PDF를 챕터·부분으로 나누기', en: 'Split a Big PDF into Chapters' },
    h1: { ko: 'PDF 챕터로 나누기', en: 'Split a PDF into parts' },
    description: {
      ko: '두꺼운 PDF에서 필요한 페이지 범위만 따로 빼내거나 챕터별로 쪼개세요. 페이지 정리까지, 업로드 없이 브라우저에서.',
      en: 'Pull a page range out of a thick PDF or break it into per-chapter files, then tidy the pages. In your browser, no upload.',
    },
    intro: {
      ko: '큰 PDF는 통째로 다루기 불편합니다. 나누기 도구로 원하는 페이지 범위를 별도 PDF로 추출하거나 챕터 단위로 쪼갠 뒤, 페이지 정리 도구로 순서를 다듬으면 작고 다루기 쉬운 파일이 됩니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'A big PDF is awkward to handle whole. Use the split tool to extract a page range into its own PDF or break it into chapters, then tidy the order with the organize tool for smaller, manageable files. Everything runs in your browser.',
    },
    steps: [
      {
        href: '/tools/pdf/split',
        name: { ko: '페이지 범위·챕터로 분할', en: 'Split by range or chapter' },
        text: { ko: '원하는 페이지 범위를 별도 PDF로 추출하거나 여러 파일로 쪼갭니다.', en: 'Extract a page range into its own PDF or break it into several files.' },
      },
      {
        href: '/tools/pdf/organize',
        name: { ko: '페이지 순서 정리', en: 'Tidy the page order' },
        text: { ko: '썸네일로 페이지를 재정렬·삭제해 마무리합니다.', en: 'Reorder or delete pages with thumbnails to finish.' },
      },
    ],
    relatedCompares: ['merge-vs-split-pdf'],
    faqs: [
      {
        q: { ko: '특정 페이지만 빼낼 수 있나요?', en: 'Can I pull out just specific pages?' },
        a: { ko: '네. 페이지 범위를 지정해 그 부분만 새 PDF로 추출할 수 있습니다.', en: 'Yes. Specify a page range to extract just that part into a new PDF.' },
      },
      {
        q: { ko: '나누면 화질이 떨어지나요?', en: 'Does splitting reduce quality?' },
        a: { ko: '아니요. 기존 페이지를 재인코딩 없이 다루므로 텍스트·이미지가 원본 그대로입니다.', en: 'No. It handles existing pages without re-encoding, so text and images stay original.' },
      },
    ],
    keywords: {
      ko: ['pdf 나누기', 'pdf 분할', 'pdf 페이지 추출', 'pdf 챕터 분리'],
      en: ['split pdf', 'extract pdf pages', 'divide pdf', 'pdf into chapters'],
    },
  },
  {
    slug: 'clean-up-podcast-audio',
    category: 'audio',
    title: { ko: '팟캐스트·녹음 음성 다듬기', en: 'Clean Up Podcast / Recorded Audio' },
    h1: { ko: '녹음 음성 정리', en: 'Clean up recorded audio' },
    description: {
      ko: '녹음에서 무음 구간을 자동으로 잘라내고 볼륨을 고르게 맞춘 뒤 용량을 줄이세요. 업로드 없이 브라우저에서.',
      en: 'Auto-cut silent gaps, even out the volume, then shrink the file of a recording. In your browser, no upload.',
    },
    intro: {
      ko: '말소리 녹음은 세 단계로 깔끔해집니다. 말 없는 긴 구간을 자동으로 잘라 늘어짐을 없애고, 볼륨을 일정하게 맞추거나 라우드니스를 정규화한 뒤, 비트레이트를 낮춰 공유하기 좋은 용량으로 줄입니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'A spoken recording cleans up in three steps: auto-cut long silent gaps to tighten it, even out or normalize the loudness, then lower the bitrate for a share-friendly size. Everything runs in your browser.',
    },
    steps: [
      {
        href: '/tools/audio/silence-trim',
        name: { ko: '무음 자동 제거', en: 'Auto-remove silence' },
        text: { ko: '말 없는 긴 구간을 자동으로 잘라냅니다.', en: 'Automatically cut long silent gaps.' },
      },
      {
        href: '/tools/audio/volume',
        name: { ko: '볼륨·라우드니스 정규화', en: 'Normalize loudness' },
        text: { ko: 'dB로 볼륨을 조정하거나 LUFS 라우드니스로 정규화합니다.', en: 'Adjust volume in dB or normalize to a LUFS target.' },
      },
      {
        href: '/tools/audio/compress',
        name: { ko: '용량 줄이기', en: 'Shrink the file' },
        text: { ko: '비트레이트를 낮춰 공유하기 좋은 용량으로 만듭니다.', en: 'Lower the bitrate for a share-friendly size.' },
      },
    ],
    relatedConverts: ['wav-to-mp3', 'm4a-to-mp3'],
    relatedCompares: ['mp3-vs-wav'],
    faqs: [
      {
        q: { ko: '무음 제거로 말이 잘리진 않나요?', en: 'Will silence removal cut into speech?' },
        a: { ko: '임계값을 조절해 자연스러운 숨소리는 남기고 긴 공백만 줄일 수 있습니다.', en: 'Tune the threshold to keep natural breaths while trimming only long gaps.' },
      },
      {
        q: { ko: '라우드니스 정규화가 왜 필요한가요?', en: 'Why normalize loudness?' },
        a: { ko: '구간별 볼륨 편차를 줄여 듣는 사람이 볼륨을 계속 조절하지 않아도 되게 합니다.', en: 'It evens out volume swings so listeners aren’t constantly adjusting the level.' },
      },
    ],
    keywords: {
      ko: ['팟캐스트 음성 정리', '녹음 무음 제거', '오디오 볼륨 정규화', '음성 압축'],
      en: ['clean podcast audio', 'remove silence', 'normalize audio', 'podcast cleanup'],
    },
  },
  {
    slug: 'convert-spreadsheet-formats',
    category: 'docs',
    title: { ko: '엑셀·CSV·JSON 자유 변환', en: 'Convert Between Excel, CSV and JSON' },
    h1: { ko: '스프레드시트 포맷 변환', en: 'Convert spreadsheet formats' },
    description: {
      ko: '엑셀(XLSX)·CSV·JSON 사이를 자유롭게 변환하세요. 시트 선택부터 프로그램용 JSON까지, 업로드 없이 브라우저에서.',
      en: 'Convert freely between Excel (XLSX), CSV and JSON — pick a sheet, get program-friendly JSON. In your browser, no upload.',
    },
    intro: {
      ko: '표 데이터는 쓰임에 따라 포맷이 다릅니다. 엑셀은 사람이 보기 좋고, CSV는 어디서나 가져오기 좋고, JSON은 프로그램이 쓰기 좋습니다. 엑셀에서 원하는 시트를 골라 CSV·JSON으로 변환하거나, CSV를 다시 JSON으로 바꿔 API·코드에 넣으세요. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'Tabular data needs different formats for different jobs: Excel for people, CSV for importing anywhere, JSON for programs. Pick a sheet from Excel and convert it to CSV/JSON, or turn a CSV into JSON for an API or code. Everything runs in your browser.',
    },
    steps: [
      {
        href: '/tools/docs/xlsx-convert',
        name: { ko: 'XLSX ↔ CSV ↔ JSON', en: 'XLSX ↔ CSV ↔ JSON' },
        text: { ko: '엑셀에서 시트를 골라 CSV·JSON으로, 또는 그 반대로 변환합니다.', en: 'Pick a sheet from Excel and convert to CSV/JSON, or back.' },
      },
      {
        href: '/tools/docs/csv-json',
        name: { ko: 'CSV ↔ JSON 정밀 변환', en: 'Fine CSV ↔ JSON' },
        text: { ko: 'CSV를 프로그램에서 쓰기 좋은 JSON으로(또는 반대로) 변환합니다.', en: 'Convert CSV into program-friendly JSON (or back).' },
      },
    ],
    relatedConverts: ['csv-to-xlsx', 'xlsx-to-csv', 'csv-to-json'],
    relatedCompares: ['xlsx-vs-csv', 'csv-vs-json'],
    faqs: [
      {
        q: { ko: '여러 시트 중 하나만 변환할 수 있나요?', en: 'Can I convert just one of several sheets?' },
        a: { ko: '네. 엑셀 변환기에서 원하는 시트를 골라 변환할 수 있습니다.', en: 'Yes. The Excel converter lets you select which sheet to convert.' },
      },
      {
        q: { ko: 'CSV를 JSON으로 바꾸면 구조가 어떻게 되나요?', en: 'How is a CSV structured as JSON?' },
        a: { ko: '각 행이 헤더를 키로 갖는 객체가 됩니다. 중첩이 필요하면 변환 후 가공하세요.', en: 'Each row becomes an object keyed by the header. Post-process if you need nesting.' },
      },
    ],
    keywords: {
      ko: ['엑셀 csv 변환', 'xlsx json 변환', 'csv json 변환', '스프레드시트 변환'],
      en: ['excel to csv', 'xlsx to json', 'csv to json', 'convert spreadsheet'],
    },
  },
  {
    slug: 'fix-and-convert-subtitles',
    category: 'video',
    title: { ko: '자막 싱크 맞추고 포맷 변환·굽기', en: 'Fix Subtitle Timing, Convert & Burn In' },
    h1: { ko: '자막 정리·변환·굽기', en: 'Fix, convert & burn subtitles' },
    description: {
      ko: '어긋난 자막 시간을 일괄 보정하고 플랫폼에 맞는 포맷으로 바꾼 뒤, 필요하면 영상에 영구로 구우세요. 업로드 없이 브라우저에서.',
      en: 'Bulk-fix shifted subtitle timings, convert to the right format, then optionally burn them into the video. In your browser, no upload.',
    },
    intro: {
      ko: '자막은 시간 어긋남과 포맷 호환이 흔한 문제입니다. 편집 도구로 전체 자막의 시간을 일괄 보정하고, 플랫폼이 요구하는 포맷(SRT·VTT·ASS·LRC)으로 변환한 뒤, 자막을 영상에 영구로 굽고 싶으면 마지막 단계에서 결합합니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'Subtitles commonly suffer from timing drift and format mismatches. Bulk-shift all cues with the editor, convert to the format a platform needs (SRT/VTT/ASS/LRC), then burn them permanently into the video as a final step if you want. Everything runs in your browser.',
    },
    steps: [
      {
        href: '/tools/text/subtitle-edit',
        name: { ko: '시간 일괄 보정·편집', en: 'Bulk re-time & edit' },
        text: { ko: '어긋난 자막 시간을 일괄로 당기거나 밀고 텍스트를 다듬습니다.', en: 'Shift all cues earlier/later in bulk and tidy the text.' },
      },
      {
        href: '/tools/text/subtitle-convert',
        name: { ko: '포맷 변환', en: 'Convert format' },
        text: { ko: 'SRT ↔ VTT ↔ ASS ↔ LRC ↔ TXT 로 변환합니다.', en: 'Convert between SRT, VTT, ASS, LRC and TXT.' },
      },
      {
        href: '/tools/video/burn-subtitle',
        name: { ko: '영상에 자막 굽기(선택)', en: 'Burn into video (optional)' },
        text: { ko: '자막을 영상에 영구로 결합해 어디서나 보이게 합니다.', en: 'Permanently embed the subtitles so they always show.' },
      },
    ],
    relatedCompares: ['mp4-vs-webm'],
    faqs: [
      {
        q: { ko: '자막이 영상보다 빠르거나 느려요.', en: 'My subtitles are ahead of or behind the video.' },
        a: { ko: '편집 도구에서 전체 자막을 한꺼번에 +/− 초만큼 이동해 싱크를 맞출 수 있습니다.', en: 'Shift every cue by +/− seconds at once in the editor to re-sync.' },
      },
      {
        q: { ko: '구운 자막은 끌 수 있나요?', en: 'Can burned-in subtitles be turned off?' },
        a: { ko: '아니요. 영상에 영구 결합되므로, 켜고 끄려면 별도 자막 파일로 두세요.', en: 'No. They’re permanent. Keep a separate subtitle file if you need them toggleable.' },
      },
    ],
    keywords: {
      ko: ['자막 싱크', '자막 시간 보정', '자막 변환', '자막 굽기'],
      en: ['fix subtitle timing', 'subtitle sync', 'convert subtitles', 'burn subtitles'],
    },
  },
  {
    slug: 'make-animated-sticker',
    category: 'gif',
    title: { ko: '움직이는 스티커 만들기', en: 'Make an Animated Sticker' },
    h1: { ko: '애니메이션 스티커', en: 'Animated sticker' },
    description: {
      ko: '영상 한 구간을 GIF로 만들고 스티커 크기로 줄인 뒤 용량을 최적화하세요. 업로드 없이 브라우저에서.',
      en: 'Turn a clip into a GIF, scale it to sticker size, then optimize the file. In your browser, no upload.',
    },
    intro: {
      ko: '움직이는 스티커는 작은 GIF면 충분합니다. 영상에서 짧은 구간을 GIF로 뽑고, 스티커에 맞게 크기를 줄인 뒤, 팔레트·프레임 최적화로 용량을 작게 만들면 메신저·SNS에 올리기 좋습니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'An animated sticker is just a small GIF. Pull a short clip as a GIF, scale it down to sticker size, then optimize the palette and frames to keep it tiny for messengers and social. Everything runs in your browser.',
    },
    steps: [
      {
        href: '/tools/video/to-gif',
        name: { ko: '영상 → GIF', en: 'Clip → GIF' },
        text: { ko: '영상에서 짧은 구간을 골라 GIF로 변환합니다.', en: 'Pick a short section of a video and convert it to GIF.' },
      },
      {
        href: '/tools/gif/resize',
        name: { ko: '스티커 크기로 줄이기', en: 'Scale to sticker size' },
        text: { ko: 'GIF 크기를 스티커에 맞게 줄입니다.', en: 'Resize the GIF down to sticker dimensions.' },
      },
      {
        href: '/tools/gif/optimize',
        name: { ko: '용량 최적화', en: 'Optimize the file' },
        text: { ko: '팔레트·프레임을 최적화해 용량을 작게 만듭니다.', en: 'Optimize palette and frames to keep it small.' },
      },
    ],
    relatedConverts: ['mp4-to-gif', 'gif-to-webp'],
    relatedCompares: ['gif-vs-mp4'],
    faqs: [
      {
        q: { ko: '스티커 용량 제한에 맞추려면?', en: 'How to fit a sticker size limit?' },
        a: { ko: '크기를 더 줄이고 프레임 수·색을 낮추세요. 길이를 짧게 자르는 것도 효과적입니다.', en: 'Scale down further and lower frame count/colors; trimming the length helps too.' },
      },
      {
        q: { ko: '투명 배경 스티커도 되나요?', en: 'Can I make transparent stickers?' },
        a: { ko: 'GIF는 단순 투명만 지원합니다. 더 깔끔한 투명이 필요하면 WebP로 변환하세요.', en: 'GIF supports only simple transparency. Convert to WebP for cleaner transparency.' },
      },
    ],
    keywords: {
      ko: ['움직이는 스티커', 'gif 스티커', '애니메이션 스티커', 'gif 만들기'],
      en: ['animated sticker', 'gif sticker', 'make sticker gif', 'create animated sticker'],
    },
  },
  {
    slug: 'extract-images-from-documents',
    category: 'pdf',
    title: { ko: 'PDF·전자책에서 이미지 추출하기', en: 'Extract Images from PDFs & E-books' },
    h1: { ko: '문서에서 이미지 추출', en: 'Extract images from documents' },
    description: {
      ko: 'PDF나 EPUB 안에 박힌 사진·삽화를 원본 그대로 꺼내 ZIP으로 받으세요. 업로드 없이 브라우저에서.',
      en: 'Pull the photos and illustrations embedded in a PDF or EPUB and download them as a ZIP. In your browser, no upload.',
    },
    intro: {
      ko: '문서에 들어 있는 이미지를 일일이 캡처할 필요가 없습니다. PDF면 페이지에 삽입된 이미지를 PNG로, EPUB이면 표지·삽화를 통째로 꺼내 ZIP으로 받을 수 있습니다. 원본 화질 그대로 추출되며, 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'No need to screenshot images one by one. For a PDF, extract the embedded images as PNGs; for an EPUB, pull the cover and illustrations into a ZIP. They come out at original quality, and everything runs in your browser.',
    },
    steps: [
      {
        href: '/tools/pdf/image-extract',
        name: { ko: 'PDF 이미지 추출', en: 'Extract PDF images' },
        text: { ko: 'PDF 페이지에 삽입된 이미지를 PNG로 추출해 ZIP으로 받습니다.', en: 'Extract images embedded in PDF pages as PNGs in a ZIP.' },
      },
      {
        href: '/tools/docs/epub-images-extract',
        name: { ko: 'EPUB 이미지 추출', en: 'Extract EPUB images' },
        text: { ko: 'EPUB 안의 표지·삽화를 모두 꺼내 ZIP으로 받습니다.', en: 'Pull every cover and illustration from an EPUB into a ZIP.' },
      },
    ],
    relatedConverts: ['pdf-to-jpg'],
    faqs: [
      {
        q: { ko: '원본 화질 그대로 나오나요?', en: 'Do images come out at original quality?' },
        a: { ko: '네. 문서에 저장된 이미지를 재인코딩 없이 그대로 꺼냅니다.', en: 'Yes. The stored images are extracted as-is, without re-encoding.' },
      },
      {
        q: { ko: '스캔 이미지 PDF도 되나요?', en: 'What about scanned image PDFs?' },
        a: { ko: '페이지 자체가 이미지라면 PDF→이미지(페이지 렌더) 도구가 더 적합할 수 있습니다.', en: 'If pages are themselves images, the PDF-to-image (page render) tool may suit better.' },
      },
    ],
    keywords: {
      ko: ['pdf 이미지 추출', 'epub 이미지 추출', '문서 이미지 꺼내기', '전자책 삽화 추출'],
      en: ['extract images from pdf', 'extract epub images', 'get images from document', 'pdf image extractor'],
    },
  },
];

export const USE_CASE_SLUGS: string[] = USE_CASES.map((u) => u.slug);

export function getUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}

/** 특정 도구 경로를 단계로 포함하는 유스케이스 (도구 → 유스케이스 역링크용). */
export function useCasesForHref(href: string): UseCase[] {
  const base = href.split('?')[0];
  return USE_CASES.filter((u) => u.steps.some((s) => s.href.split('?')[0] === base));
}

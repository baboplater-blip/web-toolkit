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

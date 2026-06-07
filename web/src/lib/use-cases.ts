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

export type Lang = 'ko' | 'en' | 'ja' | 'zh';

interface Bi {
  ko: string;
  en: string;
  ja: string;
  zh: string;
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
  keywords: { ko: string[]; en: string[]; ja: string[]; zh: string[] };
}

export const USE_CASES: UseCase[] = [
  {
    slug: 'resume-id-photo',
    category: 'image',
    title: { ko: '이력서·증명사진 직접 만들기', en: 'Make a Resume / ID Photo Yourself', ja: '履歴書・証明写真を自分で作成', zh: '自己制作简历照・证件照' },
    h1: { ko: '이력서·증명사진 만들기', en: 'Make a resume / ID photo', ja: '履歴書・証明写真を作成', zh: '制作简历照・证件照' },
    description: {
      ko: '사진관 없이 이력서·여권·반명함 규격 증명사진을 직접 만드세요. 규격 크롭·배경색·용량까지 브라우저에서 무료로.',
      en: 'Make resume, passport or ID photos without a studio. Crop to spec, set the background and shrink the size — free, in your browser.', ja: '写真館に行かずに履歴書・パスポート・証明写真を自分で作成。規格に合わせた切り抜き・背景色・容量まで、ブラウザだけで無料で。', zh: '不用去照相馆，自己制作简历、护照、证件照。规格裁剪、背景色、文件大小，全部在浏览器中免费完成。',
    },
    intro: {
      ko: '증명사진은 규격(크기·배경)만 맞추면 직접 만들 수 있습니다. 얼굴이 잘 나온 사진 한 장이면 규격에 맞춰 자르고 배경을 바꾼 뒤, 제출처 용량 제한에 맞게 줄이면 끝입니다. 모든 과정이 브라우저에서 처리돼 사진이 업로드되지 않습니다.',
      en: 'An ID photo just needs the right size and background. Take one good photo of your face, crop it to spec, swap the background, then shrink it to fit upload limits. Everything runs in your browser, so the photo is never uploaded.', ja: '証明写真は規格(サイズ・背景)さえ合えば自分で作れます。顔がきれいに写った1枚を規格どおりに切り抜き、背景を替え、提出先の容量制限に合わせて縮小すれば完成です。すべてブラウザ内で処理されるため、写真がアップロードされることはありません。', zh: '证件照只要规格(尺寸、背景)合适，就能自己做。准备一张脸部清晰的照片，按规格裁剪、替换背景，再压缩到符合提交方的大小限制即可。整个过程都在浏览器中完成，照片不会被上传。',
    },
    steps: [
      {
        href: '/tools/image/id-photo',
        name: { ko: '규격에 맞춰 크롭 + 배경색', en: 'Crop to spec + background', ja: '規格に合わせて切り抜き+背景色', zh: '按规格裁剪+背景色' },
        text: {
          ko: '이력서·여권·반명함 규격을 골라 얼굴을 맞추고 배경색을 지정합니다.',
          en: 'Pick the resume/passport/ID spec, fit your face and set the background color.', ja: '履歴書・パスポート・証明写真の規格を選び、顔の位置を合わせて背景色を指定します。', zh: '选择简历、护照、证件照规格，对准脸部位置并指定背景色。',
        },
      },
      {
        href: '/tools/image/batch-compress',
        name: { ko: '제출 용량에 맞게 줄이기', en: 'Shrink to the upload limit', ja: '提出容量に合わせて縮小', zh: '压缩到提交所需大小' },
        text: {
          ko: '제출처의 용량 제한(예: 200KB)에 맞춰 압축합니다.',
          en: 'Compress to the site’s size limit (e.g. 200KB).', ja: '提出先の容量制限(例: 200KB)に合わせて圧縮します。', zh: '按提交方的大小限制(例: 200KB)进行压缩。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '배경을 흰색으로 바꿀 수 있나요?', en: 'Can I change the background to white?', ja: '背景を白に変えられますか？', zh: '可以把背景换成白色吗？' },
        a: {
          ko: '네. 증명사진 규격 도구에서 배경색을 흰색·파란색 등으로 지정할 수 있습니다.',
          en: 'Yes. The ID photo tool lets you set the background to white, blue and more.', ja: 'はい。証明写真ツールで背景を白や青などに指定できます。', zh: '可以。在证件照工具中可以把背景色指定为白色、蓝色等。',
        },
      },
      {
        q: { ko: '사진이 서버로 올라가나요?', en: 'Is my photo uploaded?', ja: '写真はアップロードされますか？', zh: '照片会被上传吗？' },
        a: {
          ko: '아니요. 모든 처리가 브라우저 안에서 끝나 사진이 기기를 벗어나지 않습니다.',
          en: 'No. Everything happens in your browser and the photo never leaves your device.', ja: 'いいえ。すべてブラウザ内で処理され、写真が端末の外に出ることはありません。', zh: '不会。所有处理都在浏览器中完成，照片不会离开您的设备。',
        },
      },
    ],
    keywords: {
      ko: ['이력서 사진 만들기', '증명사진 직접', '여권사진 규격', '반명함', '증명사진 배경'],
      en: ['make id photo', 'resume photo', 'passport photo size', 'id photo background'], ja: ['証明写真 作成', '履歴書 写真', 'パスポート 写真 サイズ', '証明写真 背景'], zh: ['证件照制作', '简历照片', '护照照片尺寸', '证件照背景'],
    },
  },
  {
    slug: 'blur-group-photo-faces',
    category: 'image',
    title: { ko: '단체사진 얼굴 모자이크 일괄 처리', en: 'Blur Faces in Group Photos (Batch)', ja: '集合写真の顔を一括モザイク', zh: '批量给合影中的人脸打码' },
    h1: { ko: '단체사진 얼굴 모자이크', en: 'Blur faces in group photos', ja: '集合写真の顔をモザイク', zh: '给合影中的人脸打码' },
    description: {
      ko: 'SNS·블로그에 올리기 전 단체사진 속 모든 얼굴을 자동 감지해 모자이크·블러 처리하세요. 폴더 일괄 지원, 업로드 없음.',
      en: 'Auto-detect and blur every face in group photos before posting. Batch a whole folder — no upload.', ja: 'SNS・ブログに載せる前に、集合写真のすべての顔を自動検出してモザイク・ぼかし処理。フォルダ一括対応、アップロードなし。', zh: '发布到社交媒体、博客前，自动检测合影中的所有人脸并打码、模糊处理。支持文件夹批量，无需上传。',
    },
    intro: {
      ko: 'AI가 사진 속 얼굴을 자동으로 찾아 모자이크·블러·이모지로 가립니다. 여러 장이면 폴더째 한 번에 처리하고, 가림 강도와 스타일은 미리보기로 맞출 수 있습니다. 사진은 브라우저를 벗어나지 않습니다.',
      en: 'AI finds faces automatically and covers them with mosaic, blur or emoji. Drop a whole folder to process many photos at once, and tune the strength and style with a live preview. Photos never leave your browser.', ja: 'AIが写真の顔を自動で見つけ、モザイク・ぼかし・絵文字で隠します。複数枚ならフォルダごと一括処理でき、隠し方の強さやスタイルはプレビューで調整できます。写真はブラウザの外に出ません。', zh: 'AI 自动找出照片中的人脸，用马赛克、模糊或表情符号遮挡。多张照片可以整个文件夹一次处理，遮挡的强度和样式可以通过预览调整。照片不会离开浏览器。',
    },
    steps: [
      {
        href: '/tools/image/blur-face',
        name: { ko: '얼굴 자동 감지 + 가림', en: 'Auto-detect + cover faces', ja: '顔を自動検出+隠す', zh: '自动检测+遮挡人脸' },
        text: {
          ko: '사진(또는 폴더)을 올리면 얼굴을 자동 감지합니다. 모자이크/블러/이모지와 강도를 고릅니다.',
          en: 'Drop a photo (or folder) to auto-detect faces, then pick mosaic/blur/emoji and strength.', ja: '写真(またはフォルダ)を入れると顔を自動検出します。モザイク・ぼかし・絵文字と強さを選びます。', zh: '上传照片(或文件夹)后自动检测人脸。选择马赛克／模糊／表情符号及强度。',
        },
      },
    ],
    relatedConverts: ['png-to-jpg'],
    faqs: [
      {
        q: { ko: '여러 장을 한 번에 처리할 수 있나요?', en: 'Can I process many photos at once?', ja: '複数枚をまとめて処理できますか？', zh: '可以一次处理多张照片吗？' },
        a: {
          ko: '네. 폴더 모드로 전체 이미지를 일괄 처리하고 결과를 ZIP으로 내려받습니다.',
          en: 'Yes. Folder mode batch-processes every image and bundles the results as a ZIP.', ja: 'はい。フォルダモードで全画像を一括処理し、結果をZIPでまとめてダウンロードできます。', zh: '可以。文件夹模式会批量处理所有图片，并将结果打包成 ZIP 下载。',
        },
      },
      {
        q: { ko: '측면 얼굴도 잡히나요?', en: 'Does it catch side-facing faces?', ja: '横顔も検出できますか？', zh: '侧脸也能检测到吗？' },
        a: {
          ko: '민감도를 "최고"로 올리면 측면·작은 얼굴 회수율이 높아집니다. 놓친 얼굴은 직접 영역을 추가할 수도 있습니다.',
          en: 'Raising sensitivity to “max” improves recall for side and small faces. You can also add missed regions manually.', ja: '感度を「最高」にすると横顔や小さい顔の検出率が上がります。見逃した顔は手動で範囲を追加することもできます。', zh: '把灵敏度调到「最高」可以提高侧脸和小脸的检出率。漏掉的人脸也可以手动添加区域。',
        },
      },
    ],
    keywords: {
      ko: ['단체사진 얼굴 모자이크', '얼굴 가리기', '사진 모자이크 일괄', '초상권 블러'],
      en: ['blur faces group photo', 'mosaic faces', 'batch face blur', 'anonymize photo'], ja: ['集合写真 顔 モザイク', '顔 隠す', '写真 モザイク 一括', '顔 ぼかし'], zh: ['合影 人脸 打码', '人脸 遮挡', '照片 马赛克 批量', '人脸 模糊'],
    },
  },
  {
    slug: 'scan-paper-to-pdf',
    category: 'pdf',
    title: { ko: '종이 서류 스캔해서 PDF로 묶기', en: 'Scan Paper Documents into a PDF', ja: '紙の書類をスキャンしてPDFにまとめる', zh: '扫描纸质文件并合并成 PDF' },
    h1: { ko: '종이 서류를 PDF로', en: 'Turn paper documents into a PDF', ja: '紙の書類をPDFに', zh: '把纸质文件变成 PDF' },
    description: {
      ko: '스캐너 없이 휴대폰 사진으로 찍은 서류를 명암 보정해 한 개의 PDF로 묶으세요. 제출용 용량까지 무료로.',
      en: 'No scanner needed — turn phone photos of documents into one clean PDF with contrast fixed, then shrink it. Free.', ja: 'スキャナーなしで、スマホで撮った書類を明暗補正して1つのPDFにまとめます。提出用の容量まで無料で。', zh: '不用扫描仪，把手机拍的文件经明暗校正后合并成一个 PDF。连提交所需的大小也免费搞定。',
    },
    intro: {
      ko: '휴대폰으로 찍은 서류 사진을 스캔본처럼 명암 보정해 한 개의 PDF로 묶을 수 있습니다. 여러 장이면 순서대로 합쳐지고, 제출 용량이 크면 압축으로 줄입니다. 모든 처리가 브라우저에서 끝납니다.',
      en: 'Phone photos of documents can be cleaned up like scans and combined into one PDF. Multiple pages merge in order, and you can compress if the file is too big to submit. It all happens in your browser.', ja: 'スマホで撮った書類写真をスキャンのように明暗補正し、1つのPDFにまとめられます。複数枚は順番どおりに結合され、提出容量が大きければ圧縮で抑えられます。すべてブラウザ内で完結します。', zh: '把手机拍的文件照片像扫描件一样做明暗校正，合并成一个 PDF。多张会按顺序合并，提交大小过大时可用压缩减小。所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/pdf/scan',
        name: { ko: '사진을 명암 보정해 PDF로', en: 'Clean up photos into a PDF', ja: '写真を明暗補正してPDFに', zh: '把照片明暗校正后转成 PDF' },
        text: {
          ko: '찍은 서류 사진을 올려 명암을 보정하고 한 개의 PDF로 묶습니다.',
          en: 'Upload your document photos, fix the contrast and combine them into one PDF.', ja: '撮った書類写真をアップロードし、明暗を補正して1つのPDFにまとめます。', zh: '上传拍好的文件照片，校正明暗后合并成一个 PDF。',
        },
      },
      {
        href: '/tools/compress',
        name: { ko: '용량 줄이기(선택)', en: 'Shrink the size (optional)', ja: '容量を縮小(任意)', zh: '减小大小(可选)' },
        text: {
          ko: '제출 용량 제한이 있으면 PDF를 압축합니다.',
          en: 'Compress the PDF if there is an upload size limit.', ja: '提出容量の制限があればPDFを圧縮します。', zh: '如果有提交大小限制，就压缩 PDF。',
        },
      },
    ],
    relatedConverts: ['jpg-to-pdf', 'png-to-pdf'],
    relatedCompares: ['jpg-to-pdf-vs-pdf-to-jpg'],
    faqs: [
      {
        q: { ko: '여러 장을 한 PDF로 묶을 수 있나요?', en: 'Can I combine several pages into one PDF?', ja: '複数ページを1つのPDFにまとめられますか？', zh: '可以把多页合并成一个 PDF 吗？' },
        a: {
          ko: '네. 여러 사진을 올리면 순서대로 한 개의 PDF로 묶입니다.',
          en: 'Yes. Upload multiple photos and they merge into a single PDF in order.', ja: 'はい。複数の写真をアップロードすると、順番どおりに1つのPDFへ結合されます。', zh: '可以。上传多张照片后，会按顺序合并成一个 PDF。',
        },
      },
      {
        q: { ko: '글자가 선택 가능한 텍스트가 되나요?', en: 'Does the text become selectable?', ja: '文字は選択できるテキストになりますか？', zh: '文字会变成可选中的文本吗？' },
        a: {
          ko: '사진 기반이라 기본은 이미지입니다. 텍스트 추출이 필요하면 OCR 도구를 함께 쓰세요.',
          en: 'It is photo-based, so pages are images by default. Use the OCR tool if you need selectable text.', ja: '写真ベースのため、初期状態では画像になります。選択可能なテキストが必要ならOCRツールを併用してください。', zh: '由于基于照片，默认是图片。如需提取文本，请配合使用 OCR 工具。',
        },
      },
    ],
    keywords: {
      ko: ['서류 스캔 pdf', '휴대폰 스캔', '사진 pdf 변환', '문서 스캔'],
      en: ['scan document to pdf', 'phone scanner', 'photo to pdf', 'paper to pdf'], ja: ['書類 スキャン pdf', 'スマホ スキャン', '写真 pdf 変換', '紙 pdf'], zh: ['文件 扫描 pdf', '手机 扫描', '照片 pdf 转换', '纸质 pdf'],
    },
  },
  {
    slug: 'shrink-pdf-for-email',
    category: 'pdf',
    title: { ko: 'PDF 용량 줄여 이메일 첨부', en: 'Shrink a PDF for Email', ja: 'PDFの容量を減らしてメール添付', zh: '减小 PDF 大小以便邮件附件' },
    h1: { ko: 'PDF 용량 줄이기', en: 'Shrink a PDF for email', ja: 'PDFの容量を減らす', zh: '减小 PDF 大小' },
    description: {
      ko: '첨부 용량 제한에 걸리는 큰 PDF를 화질을 지키며 줄이세요. 업로드 없이 브라우저에서 무료로.',
      en: 'Shrink a PDF that is too big to attach while keeping it readable. Free, in your browser, no upload.', ja: '添付容量の制限に引っかかる大きなPDFを、読みやすさを保ったまま縮小。アップロードなし、ブラウザで無料。', zh: '把超出附件大小限制的大 PDF 在保持清晰度的同时减小。无需上传，浏览器中免费完成。',
    },
    intro: {
      ko: '이메일·게시판은 첨부 용량 제한이 있어 큰 PDF는 거절되곤 합니다. 압축으로 이미지 해상도와 품질을 조절해 용량을 크게 줄이면서도 읽기 좋은 상태를 유지할 수 있습니다. 파일은 브라우저를 벗어나지 않습니다.',
      en: 'Email and forums cap attachment size, so large PDFs get rejected. Compression tunes image resolution and quality to cut the size dramatically while keeping it readable. The file never leaves your browser.', ja: 'メールや掲示板には添付容量の制限があり、大きなPDFは弾かれがちです。圧縮で画像の解像度や品質を調整すれば、読みやすさを保ちながら容量を大きく減らせます。ファイルはブラウザの外に出ません。', zh: '邮箱、论坛都有附件大小限制，大 PDF 常常被拒。通过压缩调整图片分辨率和质量，可以在保持易读的同时大幅减小体积。文件不会离开浏览器。',
    },
    steps: [
      {
        href: '/tools/compress',
        name: { ko: 'PDF 압축', en: 'Compress the PDF', ja: 'PDFを圧縮', zh: '压缩 PDF' },
        text: {
          ko: 'PDF를 올리고 압축 강도를 조절해 용량을 줄입니다.',
          en: 'Upload the PDF and adjust the compression level to reduce its size.', ja: 'PDFをアップロードし、圧縮の強さを調整して容量を減らします。', zh: '上传 PDF，调整压缩强度来减小体积。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '압축하면 글자가 흐려지나요?', en: 'Does compression blur the text?', ja: '圧縮すると文字がぼやけますか？', zh: '压缩后文字会变模糊吗？' },
        a: {
          ko: '텍스트는 보통 그대로 유지되고 이미지 위주로 용량이 줄어듭니다. 강도를 조절해 균형을 맞추세요.',
          en: 'Text usually stays intact; size is saved mainly from images. Adjust the level to balance quality and size.', ja: 'テキストは通常そのまま保たれ、主に画像から容量が削減されます。強さを調整して品質と容量のバランスを取ってください。', zh: '文字通常会保持原样，体积主要从图片中节省。调整强度可以在质量和大小之间取得平衡。',
        },
      },
      {
        q: { ko: '얼마나 줄일 수 있나요?', en: 'How much smaller can it get?', ja: 'どのくらい小さくできますか？', zh: '能减小多少？' },
        a: {
          ko: '이미지가 많은 PDF일수록 효과가 큽니다. 스캔본은 절반 이하로도 줄어드는 경우가 많습니다.',
          en: 'Image-heavy PDFs shrink the most — scanned files often drop below half their size.', ja: '画像の多いPDFほど効果が大きく、スキャン書類は半分以下になることもよくあります。', zh: '图片越多的 PDF 效果越明显。扫描件常常能减小到一半以下。',
        },
      },
    ],
    keywords: {
      ko: ['pdf 용량 줄이기', 'pdf 압축', 'pdf 첨부 용량', '큰 pdf 메일'],
      en: ['shrink pdf', 'compress pdf for email', 'reduce pdf size', 'pdf too big'], ja: ['pdf 容量 圧縮', 'pdf 軽くする', 'pdf サイズ 縮小', 'pdf 添付 容量'], zh: ['pdf 压缩', 'pdf 减小体积', 'pdf 缩小大小', 'pdf 附件 太大'],
    },
  },
  {
    slug: 'optimize-photo-for-web',
    category: 'image',
    title: { ko: '사진 웹·블로그용으로 최적화', en: 'Optimize Photos for the Web', ja: '写真をWeb・ブログ用に最適化', zh: '为网页・博客优化照片' },
    h1: { ko: '웹·블로그용 사진 최적화', en: 'Optimize photos for the web', ja: '写真をWeb用に最適化', zh: '为网页优化照片' },
    description: {
      ko: '큰 사진을 적당한 크기로 줄이고 WebP로 바꿔 페이지를 가볍고 빠르게. 업로드 없이 브라우저에서.',
      en: 'Resize big photos and convert to WebP to keep pages light and fast. In your browser, no upload.', ja: '大きな写真を適切なサイズに縮小しWebPに変換して、ページを軽く速く。ブラウザ内で、アップロードなし。', zh: '把大照片缩到合适尺寸并转成 WebP，让页面更轻更快。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '카메라 원본은 웹에 쓰기엔 너무 큽니다. 필요한 크기로 리사이즈한 뒤 WebP로 바꾸면 화질은 지키면서 용량을 크게 줄여 페이지 로딩이 빨라집니다. 모든 처리가 브라우저 안에서 끝납니다.',
      en: 'Camera originals are too large for the web. Resize to the dimensions you need, then convert to WebP to keep quality while slashing size and speeding up page loads. It all runs in your browser.', ja: 'カメラの元データはWebに使うには大きすぎます。必要なサイズにリサイズしてからWebPに変換すれば、画質を保ちつつ容量を大きく減らし、ページ表示が速くなります。すべてブラウザ内で完結します。', zh: '相机原图用在网页上太大了。先缩到所需尺寸，再转成 WebP，就能在保持画质的同时大幅减小体积，让页面加载更快。所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/image/resize',
        name: { ko: '필요한 크기로 리사이즈', en: 'Resize to the size you need', ja: '必要なサイズにリサイズ', zh: '调整到所需尺寸' },
        text: {
          ko: '예: 가로 1200px 등 실제 필요한 크기로 줄입니다.',
          en: 'Shrink to the dimensions you actually need (e.g. 1200px wide).', ja: '実際に必要なサイズ(例: 横1200px)に縮小します。', zh: '缩到实际需要的尺寸(例: 宽 1200px)。',
        },
      },
      {
        href: '/tools/image/convert?to=webp',
        name: { ko: 'WebP로 변환', en: 'Convert to WebP', ja: 'WebPに変換', zh: '转换为 WebP' },
        text: {
          ko: 'WebP로 바꿔 같은 화질에 더 작은 용량으로 만듭니다.',
          en: 'Convert to WebP for a smaller file at the same quality.', ja: 'WebPに変換し、同じ画質でより小さい容量にします。', zh: '转成 WebP，在同等画质下获得更小的文件。',
        },
      },
    ],
    relatedConverts: ['png-to-webp', 'jpg-to-webp'],
    relatedCompares: ['webp-vs-png', 'compress-vs-resize-image'],
    faqs: [
      {
        q: { ko: '리사이즈와 압축 중 뭘 먼저?', en: 'Resize or compress first?', ja: 'リサイズと圧縮はどちらが先？', zh: '调整尺寸和压缩，先做哪个？' },
        a: {
          ko: '필요한 크기로 먼저 리사이즈한 뒤 변환·압축하세요. 리사이즈가 가장 많은 용량을 줄입니다.',
          en: 'Resize first, then convert/compress. Resizing removes the most data.', ja: 'まず必要なサイズにリサイズし、その後に変換・圧縮を。リサイズが最も多く容量を減らします。', zh: '先调整到所需尺寸，再转换、压缩。调整尺寸能减少最多的数据量。',
        },
      },
      {
        q: { ko: 'WebP를 모든 브라우저가 지원하나요?', en: 'Do all browsers support WebP?', ja: 'WebPはすべてのブラウザで対応していますか？', zh: '所有浏览器都支持 WebP 吗？' },
        a: {
          ko: '현재 주요 브라우저는 모두 지원합니다. 아주 오래된 환경만 예외입니다.',
          en: 'All current major browsers support it; only very old environments do not.', ja: '現在の主要ブラウザはすべて対応しています。ごく古い環境のみ例外です。', zh: '目前主流浏览器都支持，只有非常老旧的环境例外。',
        },
      },
    ],
    keywords: {
      ko: ['사진 웹 최적화', '이미지 용량 줄이기', 'webp 변환', '블로그 사진 크기'],
      en: ['optimize photo for web', 'resize image web', 'convert to webp', 'blog image size'], ja: ['写真 web 最適化', '画像 リサイズ web', 'webp 変換', 'ブログ 画像 サイズ'], zh: ['照片 网页 优化', '图片 调整尺寸 网页', 'webp 转换', '博客 图片 大小'],
    },
  },
  {
    slug: 'make-gif-from-video',
    category: 'gif',
    title: { ko: '영상으로 GIF 만들기', en: 'Make a GIF from a Video', ja: '動画からGIFを作成', zh: '用视频制作 GIF' },
    h1: { ko: '영상으로 GIF 만들기', en: 'Make a GIF from a video', ja: '動画からGIFを作成', zh: '用视频制作 GIF' },
    description: {
      ko: 'MP4·WebM 영상의 원하는 구간을 잘라 움짤(GIF)로 만드세요. 길이·해상도 조절로 용량까지. 업로드 없음.',
      en: 'Turn a clip of an MP4/WebM video into a GIF. Control length and size for a small file. No upload.', ja: 'MP4・WebM動画の好きな区間を切り出してGIF(動く画像)に。長さ・解像度の調整で容量も。アップロードなし。', zh: '截取 MP4、WebM 视频的某段做成 GIF 动图。调整时长、分辨率控制大小。无需上传。',
    },
    intro: {
      ko: '영상의 짧은 구간을 GIF로 만들면 자동 재생되는 움짤로 어디서나 공유할 수 있습니다. 길이와 해상도를 줄이면 용량이 작아집니다. 변환은 브라우저 안(FFmpeg)에서 처리됩니다.',
      en: 'A short clip turned into a GIF auto-plays everywhere you share it. Trimming length and lowering resolution keeps the file small. Conversion runs in your browser (FFmpeg).', ja: '動画の短い区間をGIFにすると、共有先のどこでも自動再生される動く画像になります。長さと解像度を抑えると容量が小さくなります。変換はブラウザ内(FFmpeg)で処理されます。', zh: '把视频的一小段做成 GIF，就成了到处都能自动播放的动图。缩短时长、降低分辨率可以让文件更小。转换在浏览器中(FFmpeg)处理。',
    },
    steps: [
      {
        href: '/tools/video/to-gif',
        name: { ko: '구간 잘라 GIF로 변환', en: 'Trim and convert to GIF', ja: '区間を切り出してGIFに変換', zh: '截取片段并转成 GIF' },
        text: {
          ko: '영상을 올려 GIF로 만들 구간과 해상도를 정합니다.',
          en: 'Upload the video and choose the clip range and resolution for the GIF.', ja: '動画をアップロードし、GIFにする区間と解像度を決めます。', zh: '上传视频，确定要做成 GIF 的片段和分辨率。',
        },
      },
    ],
    relatedConverts: ['mp4-to-gif', 'webm-to-gif'],
    faqs: [
      {
        q: { ko: 'GIF에 소리가 들어가나요?', en: 'Does the GIF include sound?', ja: 'GIFに音は入りますか？', zh: 'GIF 会带声音吗？' },
        a: {
          ko: '아니요. GIF는 무음이라 소리는 빠집니다. 소리가 필요하면 영상 포맷을 유지하세요.',
          en: 'No. GIFs are silent, so audio is dropped. Keep a video format if you need sound.', ja: 'いいえ。GIFは無音なので音声は失われます。音が必要なら動画形式のままにしてください。', zh: '不会。GIF 是无声的，声音会丢失。需要声音请保留视频格式。',
        },
      },
      {
        q: { ko: 'GIF 용량이 너무 커요.', en: 'My GIF is too large.', ja: 'GIFの容量が大きすぎます。', zh: 'GIF 文件太大了。' },
        a: {
          ko: '길이를 짧게, 해상도를 낮추면 크게 줄어듭니다. 정말 작아야 하면 영상(MP4·WebM)이 더 효율적입니다.',
          en: 'Shorten the clip and lower the resolution. If it must be tiny, a video (MP4/WebM) is more efficient.', ja: '長さを短く、解像度を下げると大きく減ります。どうしても小さくしたい場合は動画(MP4・WebM)の方が効率的です。', zh: '缩短时长、降低分辨率可以大幅减小。如果必须很小，视频(MP4、WebM)更高效。',
        },
      },
    ],
    keywords: {
      ko: ['영상 gif 변환', '움짤 만들기', 'mp4 gif', '동영상 gif'],
      en: ['video to gif', 'make a gif', 'mp4 to gif', 'gif from video'], ja: ['動画 gif 変換', 'gif 作成', 'mp4 gif', '動画 gif'], zh: ['视频 gif 转换', '制作 gif', 'mp4 gif', '视频 gif'],
    },
  },
  {
    slug: 'sign-and-stamp-contract',
    category: 'pdf',
    title: { ko: '계약서 전자서명·도장 찍기', en: 'Sign and Stamp a Contract', ja: '契約書に電子署名・押印', zh: '给合同电子签名・盖章' },
    h1: { ko: '계약서 서명·도장', en: 'Sign and stamp a contract', ja: '契約書に署名・押印', zh: '给合同签名・盖章' },
    description: {
      ko: '출력·스캔 없이 PDF 계약서에 직접 서명하고 직인을 찍으세요. 필요하면 암호까지. 업로드 없이 브라우저에서.',
      en: 'Sign a PDF contract and add a seal without printing or scanning — and password-protect it if needed. In your browser.', ja: '印刷・スキャンなしでPDF契約書に署名し、印鑑を押せます。必要ならパスワードまで。ブラウザ内で。', zh: '无需打印、扫描，直接在 PDF 合同上签名盖章。需要的话还能加密码。浏览器中完成。',
    },
    intro: {
      ko: '계약서를 출력해 서명·날인한 뒤 다시 스캔할 필요가 없습니다. PDF에 직접 서명을 그려 넣고, 회사 직인 이미지를 만들어 얹은 뒤, 필요하면 암호를 걸어 보낼 수 있습니다. 문서는 브라우저를 벗어나지 않습니다.',
      en: 'No need to print, sign, stamp and re-scan. Draw your signature onto the PDF, generate a company seal to place on it, and optionally password-protect it before sending. The document never leaves your browser.', ja: '契約書を印刷して署名・押印し、再スキャンする必要はありません。PDFに直接署名を描き込み、会社印の画像を作って配置し、必要ならパスワードをかけて送れます。書類はブラウザの外に出ません。', zh: '不必把合同打印出来签字盖章再扫描。直接在 PDF 上手绘签名，生成公司印章图片叠加上去，需要时再加密码发送。文档不会离开浏览器。',
    },
    steps: [
      {
        href: '/tools/image/seal',
        name: { ko: '직인·도장 이미지 만들기', en: 'Create a seal/stamp image', ja: '印鑑・社印の画像を作成', zh: '制作印章图片' },
        text: {
          ko: '회사명·이름으로 투명배경 직인 PNG를 만듭니다(선택).',
          en: 'Generate a transparent-background seal PNG from a name (optional).', ja: '会社名・氏名から背景透過の印鑑PNGを作成します(任意)。', zh: '用公司名、姓名生成透明背景的印章 PNG(可选)。',
        },
      },
      {
        href: '/tools/pdf/sign',
        name: { ko: 'PDF에 서명·직인 삽입', en: 'Add signature/seal to the PDF', ja: 'PDFに署名・印鑑を挿入', zh: '在 PDF 中插入签名・印章' },
        text: {
          ko: '마우스·터치로 서명을 그리고 직인 이미지를 원하는 위치에 얹습니다.',
          en: 'Draw your signature and place the seal image where you want it.', ja: 'マウス・タッチで署名を描き、印鑑画像を好きな位置に重ねます。', zh: '用鼠标或触屏手绘签名，把印章图片叠加到想要的位置。',
        },
      },
      {
        href: '/tools/pdf/protect',
        name: { ko: '암호 걸기(선택)', en: 'Password-protect (optional)', ja: 'パスワードをかける(任意)', zh: '设置密码(可选)' },
        text: {
          ko: '민감한 계약서면 열람 암호를 설정해 내보냅니다.',
          en: 'Set an open password for sensitive contracts before exporting.', ja: '重要な契約書なら閲覧パスワードを設定して書き出します。', zh: '若是重要合同，设置查看密码后再导出。',
        },
      },
    ],
    relatedCompares: ['merge-vs-split-pdf'],
    faqs: [
      {
        q: { ko: '전자서명이 법적 효력이 있나요?', en: 'Is an e-signature legally valid?', ja: '電子署名に法的効力はありますか？', zh: '电子签名有法律效力吗？' },
        a: {
          ko: '많은 국가에서 당사자 합의가 있으면 효력이 인정되지만, 사안·관할에 따라 다릅니다. 중요한 계약은 전문가 확인을 권합니다.',
          en: 'In many countries it is valid with mutual consent, but it depends on the matter and jurisdiction. Seek advice for important contracts.', ja: '多くの国では当事者の合意があれば有効ですが、内容や管轄によって異なります。重要な契約は専門家に確認してください。', zh: '在很多国家，只要双方同意就有效，但要视具体事项和司法管辖区而定。重要合同建议咨询专业人士。',
        },
      },
      {
        q: { ko: '문서가 서버로 올라가나요?', en: 'Is the document uploaded?', ja: '書類はアップロードされますか？', zh: '文档会被上传吗？' },
        a: {
          ko: '아니요. 서명·날인·암호화 모두 브라우저 안에서 처리됩니다.',
          en: 'No. Signing, stamping and encryption all happen in your browser.', ja: 'いいえ。署名・押印・暗号化はすべてブラウザ内で処理されます。', zh: '不会。签名、盖章、加密都在浏览器中处理。',
        },
      },
    ],
    keywords: {
      ko: ['계약서 전자서명', 'pdf 서명', '직인 찍기', 'pdf 도장'],
      en: ['sign contract pdf', 'esign pdf', 'add stamp pdf', 'pdf seal'], ja: ['契約書 電子署名', 'pdf 署名', 'pdf 印鑑', 'pdf 押印'], zh: ['合同 电子签名', 'pdf 签名', 'pdf 盖章', 'pdf 印章'],
    },
  },
  {
    slug: 'redact-before-sharing',
    category: 'security',
    title: { ko: '개인정보 가리고 안전하게 공유', en: 'Redact Personal Info Before Sharing', ja: '個人情報を隠して安全に共有', zh: '遮挡个人信息后安全分享' },
    h1: { ko: '개인정보 가리고 공유', en: 'Redact personal info before sharing', ja: '個人情報を隠して共有', zh: '遮挡个人信息后分享' },
    description: {
      ko: '문서의 주민번호·계좌 등 민감정보와 사진 속 얼굴을 가린 뒤 공유하세요. 업로드 없이 브라우저에서.',
      en: 'Mask sensitive info (IDs, accounts) in documents and faces in photos before sharing. In your browser, no upload.', ja: '書類のマイナンバー・口座などの機微情報や写真の顔を隠してから共有。ブラウザ内で、アップロードなし。', zh: '把文档中的身份证号、账号等敏感信息和照片中的人脸遮挡后再分享。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '캡처·서류를 그대로 올리면 주민번호·계좌·얼굴 같은 개인정보가 노출됩니다. 문서의 민감정보는 마스킹으로, 사진 속 얼굴은 모자이크로 가린 뒤 공유하면 안전합니다. 원본은 브라우저를 벗어나지 않습니다.',
      en: 'Posting screenshots or documents as-is can expose IDs, account numbers and faces. Mask sensitive text in documents and blur faces in photos before sharing. The originals never leave your browser.', ja: 'スクショや書類をそのまま載せると、ID・口座番号・顔などの個人情報が露出します。書類の機微情報はマスキングで、写真の顔はモザイクで隠してから共有すれば安全です。元データはブラウザの外に出ません。', zh: '把截图、文件原样发出去，会暴露身份证号、账号、人脸等个人信息。文档的敏感信息用打码遮挡、照片中的人脸用马赛克遮挡后再分享才安全。原件不会离开浏览器。',
    },
    steps: [
      {
        href: '/tools/security/redact',
        name: { ko: '문서 민감정보 마스킹', en: 'Mask sensitive text', ja: '書類の機微情報をマスキング', zh: '给文档敏感信息打码' },
        text: {
          ko: '주민번호·계좌 등 민감정보를 찾아 가립니다.',
          en: 'Find and cover IDs, account numbers and other sensitive text.', ja: 'ID・口座番号などの機微情報を見つけて隠します。', zh: '找出身份证号、账号等敏感信息并遮挡。',
        },
      },
      {
        href: '/tools/image/blur-face',
        name: { ko: '사진 속 얼굴 가리기', en: 'Blur faces in photos', ja: '写真の顔を隠す', zh: '遮挡照片中的人脸' },
        text: {
          ko: '사진이라면 얼굴을 자동 감지해 모자이크·블러로 가립니다.',
          en: 'For photos, auto-detect faces and cover them with mosaic or blur.', ja: '写真なら顔を自動検出してモザイク・ぼかしで隠します。', zh: '如果是照片，自动检测人脸并用马赛克或模糊遮挡。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '가린 정보를 복구할 수 있나요?', en: 'Can the masked info be recovered?', ja: '隠した情報は復元できますか？', zh: '被遮挡的信息能恢复吗？' },
        a: {
          ko: '내보낸 결과물에는 가림이 픽셀로 적용돼 원본이 남지 않습니다. 원본 파일은 따로 보관하세요.',
          en: 'The exported file bakes the cover into pixels, leaving no original underneath. Keep the source file separately.', ja: '書き出した結果は隠しがピクセルとして焼き込まれ、下に元データは残りません。元ファイルは別に保管してください。', zh: '导出的结果会把遮挡以像素方式烧入，下面不会残留原始数据。原始文件请另行保存。',
        },
      },
      {
        q: { ko: '데이터가 서버로 전송되나요?', en: 'Is any data sent to a server?', ja: 'データはサーバーに送られますか？', zh: '数据会发送到服务器吗？' },
        a: {
          ko: '아니요. 마스킹·블러 모두 브라우저 안에서 처리됩니다.',
          en: 'No. Masking and blurring all happen in your browser.', ja: 'いいえ。マスキング・ぼかしはすべてブラウザ内で処理されます。', zh: '不会。打码和模糊都在浏览器中处理。',
        },
      },
    ],
    keywords: {
      ko: ['개인정보 가리기', '민감정보 마스킹', '주민번호 가림', '캡처 모자이크'],
      en: ['redact personal info', 'mask sensitive data', 'blur before sharing', 'hide info screenshot'], ja: ['個人情報 隠す', '機微情報 マスキング', '共有前 ぼかし', 'スクショ モザイク'], zh: ['遮挡 个人信息', '敏感信息 打码', '分享前 模糊', '截图 马赛克'],
    },
  },
  {
    slug: 'extract-audio-from-video',
    category: 'audio',
    title: { ko: '영상에서 오디오(MP3) 추출하기', en: 'Extract Audio (MP3) from a Video', ja: '動画から音声(MP3)を抽出', zh: '从视频提取音频(MP3)' },
    h1: { ko: '영상에서 오디오 추출', en: 'Extract audio from a video', ja: '動画から音声を抽出', zh: '从视频提取音频' },
    description: {
      ko: '강의·회의·음악 영상에서 소리만 MP3로 뽑고, 필요한 구간만 잘라내세요. 업로드 없이 브라우저에서.',
      en: 'Pull just the sound from a lecture, meeting or music video as MP3 and trim the part you need. In your browser.', ja: '講義・会議・音楽動画から音だけをMP3で取り出し、必要な区間だけ切り出し。ブラウザ内で。', zh: '从讲座、会议、音乐视频中只提取声音为 MP3，并截取需要的片段。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '영상에서 화면은 빼고 소리만 필요할 때가 많습니다. 오디오 트랙을 MP3로 추출한 뒤 원하는 구간만 잘라내면 강의 복습·회의 기록·음원으로 쓰기 좋습니다. 모든 처리가 브라우저(FFmpeg) 안에서 끝납니다.',
      en: 'Often you only need the sound, not the picture. Extract the audio track to MP3, then trim to the part you want — handy for revising lectures, keeping meeting records or saving music. It all runs in your browser (FFmpeg).', ja: '映像はいらず音だけ欲しいことはよくあります。音声トラックをMP3で抽出し、必要な区間だけ切り出せば、講義の復習・会議記録・音源として便利です。すべてブラウザ内(FFmpeg)で処理されます。', zh: '很多时候只需要声音、不需要画面。把音轨提取成 MP3，再截取需要的片段，用来复习讲座、保留会议记录或当音源都很方便。所有处理都在浏览器中(FFmpeg)完成。',
    },
    steps: [
      {
        href: '/tools/audio/from-video',
        name: { ko: '영상 → MP3 추출', en: 'Extract video → MP3', ja: '動画→MP3を抽出', zh: '视频→MP3 提取' },
        text: { ko: '영상을 올려 오디오 트랙을 MP3로 추출합니다.', en: 'Upload the video and extract its audio track as MP3.', ja: '動画をアップロードし、音声トラックをMP3で抽出します。', zh: '上传视频，把音轨提取成 MP3。' },
      },
      {
        href: '/tools/audio/trim',
        name: { ko: '필요한 구간만 자르기(선택)', en: 'Trim to the part you need (optional)', ja: '必要な区間だけ切り出す(任意)', zh: '只截取需要的片段(可选)' },
        text: { ko: '필요한 부분만 남기고 앞뒤를 잘라냅니다.', en: 'Cut the start/end to keep only the part you need.', ja: '前後を切り取り、必要な部分だけ残します。', zh: '剪掉前后，只保留需要的部分。' },
      },
    ],
    relatedConverts: ['mp4-to-mp3'],
    faqs: [
      {
        q: { ko: '화질·음질이 떨어지나요?', en: 'Does quality drop?', ja: '音質・画質は落ちますか？', zh: '音质会下降吗？' },
        a: { ko: '오디오는 원본 트랙을 그대로 추출하므로 음질 손실이 거의 없습니다. 비트레이트도 조절할 수 있습니다.', en: 'The audio track is extracted as-is, so there is little to no loss. You can also set the bitrate.', ja: '音声トラックをそのまま抽出するため、ほとんど劣化しません。ビットレートも調整できます。', zh: '音轨是原样提取的，几乎没有音质损失。比特率也可以调整。' },
      },
      {
        q: { ko: '파일이 서버로 올라가나요?', en: 'Is the file uploaded?', ja: 'ファイルはアップロードされますか？', zh: '文件会被上传吗？' },
        a: { ko: '아니요. 추출·자르기 모두 브라우저 안에서 처리됩니다.', en: 'No. Extraction and trimming all happen in your browser.', ja: 'いいえ。抽出も切り出しもすべてブラウザ内で処理されます。', zh: '不会。提取和剪切都在浏览器中处理。' },
      },
    ],
    keywords: {
      ko: ['영상 음원 추출', 'mp4 mp3', '동영상 소리 추출', '강의 mp3'],
      en: ['extract audio from video', 'mp4 to mp3', 'video to audio', 'rip audio'], ja: ['動画 音声 抽出', 'mp4 mp3', '動画 音 抽出', '音源 抽出'], zh: ['视频 音频 提取', 'mp4 mp3', '视频 声音 提取', '讲座 mp3'],
    },
  },
  {
    slug: 'add-subtitles-to-video',
    category: 'video',
    title: { ko: '영상에 자막 입히기(굽기)', en: 'Add Subtitles to a Video (Burn-in)', ja: '動画に字幕を焼き込む', zh: '给视频压制字幕(烧录)' },
    h1: { ko: '영상에 자막 굽기', en: 'Burn subtitles into a video', ja: '動画に字幕を焼き込む', zh: '给视频烧录字幕' },
    description: {
      ko: 'SRT·VTT 자막을 영상에 영구 결합해 어디서나 자막이 보이게 만드세요. 업로드 없이 브라우저에서.',
      en: 'Permanently burn SRT/VTT subtitles into a video so they show everywhere. In your browser, no upload.', ja: 'SRT・VTT字幕を動画に永久に結合し、どこでも字幕が表示されるように。ブラウザ内で、アップロードなし。', zh: '把 SRT、VTT 字幕永久合并进视频，让字幕到处都能显示。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '플랫폼에 따라 별도 자막 파일을 못 읽는 경우가 많습니다. 자막을 영상에 직접 구워 넣으면(하드섭) 어떤 플레이어·SNS에서도 자막이 그대로 보입니다. 변환은 브라우저(FFmpeg)에서 처리됩니다.',
      en: 'Many platforms can’t load a separate subtitle file. Burning subtitles into the video (hard-subbing) means they appear in any player or social app. Conversion runs in your browser (FFmpeg).', ja: 'プラットフォームによっては別の字幕ファイルを読み込めないことが多くあります。字幕を動画に焼き込む(ハードサブ)と、どのプレイヤーやSNSでもそのまま字幕が表示されます。変換はブラウザ内(FFmpeg)で処理されます。', zh: '很多平台读不了单独的字幕文件。把字幕直接烧录进视频(硬字幕)后，在任何播放器或社交平台上字幕都能照常显示。转换在浏览器中(FFmpeg)处理。',
    },
    steps: [
      {
        href: '/tools/video/burn-subtitle',
        name: { ko: '자막 파일 + 영상 결합', en: 'Combine subtitle file + video', ja: '字幕ファイル+動画を結合', zh: '合并字幕文件+视频' },
        text: { ko: 'SRT/VTT/ASS 자막과 영상을 올려 자막을 영구 결합합니다.', en: 'Upload your SRT/VTT/ASS subtitles and the video to burn them in permanently.', ja: 'SRT・VTT・ASS字幕と動画をアップロードし、字幕を永久に結合します。', zh: '上传 SRT／VTT／ASS 字幕和视频，把字幕永久合并进去。' },
      },
    ],
    faqs: [
      {
        q: { ko: '자막을 나중에 끌 수 있나요?', en: 'Can I turn the subtitles off later?', ja: '字幕を後から消せますか？', zh: '字幕之后能关掉吗？' },
        a: { ko: '아니요. 구운 자막은 화면에 영구 결합되어 끌 수 없습니다. 끄고 켜야 하면 자막 파일을 따로 두세요.', en: 'No. Burned-in subtitles are permanent and can’t be toggled. Keep a separate subtitle file if you need that.', ja: 'いいえ。焼き込んだ字幕は永久に結合され、オフにできません。切り替えたい場合は字幕ファイルを別に保管してください。', zh: '不能。烧录的字幕永久合并在画面上，无法关闭。需要切换的话请单独保留字幕文件。' },
      },
      {
        q: { ko: '글꼴·위치를 바꿀 수 있나요?', en: 'Can I change the font or position?', ja: 'フォントや位置を変えられますか？', zh: '可以改字体或位置吗？' },
        a: { ko: 'ASS 자막은 스타일(글꼴·색·위치)을 지정할 수 있습니다. SRT는 기본 스타일로 표시됩니다.', en: 'ASS subtitles support styling (font, color, position). SRT shows with a default style.', ja: 'ASS字幕ならスタイル(フォント・色・位置)を指定できます。SRTは既定のスタイルで表示されます。', zh: 'ASS 字幕可以指定样式(字体、颜色、位置)。SRT 以默认样式显示。' },
      },
    ],
    keywords: {
      ko: ['영상 자막 굽기', '하드섭', 'srt 영상 결합', '자막 입히기'],
      en: ['burn subtitles', 'hardcode subtitles', 'add srt to video', 'hardsub'], ja: ['字幕 焼き込み', 'ハードサブ', 'srt 動画 結合', '字幕 埋め込み'], zh: ['视频 字幕 烧录', '硬字幕', 'srt 视频 合并', '字幕 压制'],
    },
  },
  {
    slug: 'extract-text-from-image',
    category: 'ai',
    title: { ko: '사진 속 글자 추출하기 (OCR)', en: 'Extract Text from an Image (OCR)', ja: '画像の文字を抽出(OCR)', zh: '提取图片中的文字(OCR)' },
    h1: { ko: '사진 속 글자 추출 (OCR)', en: 'Extract text from an image (OCR)', ja: '画像の文字を抽出(OCR)', zh: '提取图片中的文字(OCR)' },
    description: {
      ko: '캡처·문서 사진 속 글자를 인식해 편집 가능한 텍스트로 뽑으세요. 한국어·영어 지원, 업로드 없음.',
      en: 'Recognize text in screenshots or document photos and pull it out as editable text. Korean/English, no upload.', ja: 'スクショや書類写真の文字を認識し、編集できるテキストとして取り出します。日本語・英語対応、アップロードなし。', zh: '识别截图、文件照片中的文字，提取成可编辑的文本。支持中文、英文，无需上传。',
    },
    intro: {
      ko: '사진이나 캡처에 있는 글자는 복사할 수 없어 다시 타이핑하기 번거롭습니다. OCR로 인식하면 편집·검색 가능한 텍스트로 바뀝니다. 인식은 브라우저(Tesseract) 안에서 처리돼 이미지가 업로드되지 않습니다.',
      en: 'Text inside a photo or screenshot can’t be copied, so retyping is a pain. OCR turns it into editable, searchable text. Recognition runs in your browser (Tesseract) — the image is never uploaded.', ja: '写真やスクショの中の文字はコピーできず、打ち直すのは面倒です。OCRで認識すれば、編集・検索できるテキストになります。認識はブラウザ内(Tesseract)で処理され、画像はアップロードされません。', zh: '照片或截图里的文字无法复制，重新打字很麻烦。用 OCR 识别后，就能变成可编辑、可搜索的文本。识别在浏览器中(Tesseract)处理，图片不会被上传。',
    },
    steps: [
      {
        href: '/tools/ocr',
        name: { ko: '이미지에서 텍스트 인식', en: 'Recognize text from the image', ja: '画像から文字を認識', zh: '从图片中识别文字' },
        text: { ko: '이미지를 올리고 언어를 골라 텍스트를 추출합니다.', en: 'Upload the image, pick the language and extract the text.', ja: '画像をアップロードし、言語を選んでテキストを抽出します。', zh: '上传图片，选择语言后提取文字。' },
      },
    ],
    faqs: [
      {
        q: { ko: '한국어도 인식되나요?', en: 'Does it recognize Korean?', ja: '日本語も認識できますか？', zh: '中文也能识别吗？' },
        a: { ko: '네. 한국어·영어를 지원하며 언어를 선택해 정확도를 높일 수 있습니다.', en: 'Yes. Korean and English are supported; choose the language for better accuracy.', ja: 'はい。日本語・英語に対応しており、言語を選ぶと精度が上がります。', zh: '可以。支持中文、英文，选择对应语言可以提高准确度。' },
      },
      {
        q: { ko: '인식 정확도를 높이려면?', en: 'How to improve accuracy?', ja: '精度を上げるには？', zh: '怎样提高识别准确度？' },
        a: { ko: '선명하고 반듯한 고해상도 이미지일수록 정확합니다. 기울거나 흐린 사진은 정확도가 떨어집니다.', en: 'Sharp, straight, high-resolution images work best. Skewed or blurry photos reduce accuracy.', ja: '鮮明でまっすぐな高解像度の画像ほど正確です。傾いた写真やぼやけた写真は精度が落ちます。', zh: '图像越清晰、越端正、分辨率越高，识别越准确。倾斜或模糊的照片会降低准确度。' },
      },
    ],
    keywords: {
      ko: ['사진 글자 추출', 'ocr 무료', '이미지 텍스트 변환', '캡처 글자 복사'],
      en: ['extract text from image', 'free ocr', 'image to text', 'photo text copy'], ja: ['画像 文字 抽出', 'ocr 無料', '画像 テキスト 変換', '写真 文字 コピー'], zh: ['图片 文字 提取', 'ocr 免费', '图片 文本 转换', '截图 文字 复制'],
    },
  },
  {
    slug: 'remove-photo-background',
    category: 'ai',
    title: { ko: '사진 배경 제거하기', en: 'Remove a Photo Background', ja: '写真の背景を削除', zh: '去除照片背景' },
    h1: { ko: '사진 배경 제거', en: 'Remove a photo background', ja: '写真の背景を削除', zh: '去除照片背景' },
    description: {
      ko: '인물·상품 사진의 배경을 자동으로 지워 투명 PNG로 만드세요. 증명사진·쇼핑몰·로고에 활용. 업로드 없음.',
      en: 'Auto-erase the background of people or product photos into a transparent PNG. Great for IDs, shops, logos. No upload.', ja: '人物・商品写真の背景を自動で消して透過PNGに。証明写真・ネットショップ・ロゴに。アップロードなし。', zh: '自动抠掉人物、商品照片的背景，做成透明 PNG。可用于证件照、网店、Logo。无需上传。',
    },
    intro: {
      ko: 'AI가 피사체와 배경을 분리해 배경을 깔끔히 지웁니다. 투명 PNG로 저장하면 증명사진 배경 교체, 쇼핑몰 상품컷, 로고 제작 등에 바로 쓸 수 있습니다. 처리는 브라우저(ONNX) 안에서 끝납니다.',
      en: 'AI separates the subject from the background and erases it cleanly. Save as a transparent PNG to swap ID-photo backgrounds, make product cutouts or build logos. Processing runs in your browser (ONNX).', ja: 'AIが被写体と背景を分離し、背景をきれいに消します。透過PNGで保存すれば、証明写真の背景差し替え・商品の切り抜き・ロゴ作成にそのまま使えます。処理はブラウザ内(ONNX)で完結します。', zh: 'AI 把主体和背景分离，干净地抠掉背景。保存为透明 PNG，就能直接用于替换证件照背景、网店商品图、制作 Logo 等。处理在浏览器中(ONNX)完成。',
    },
    steps: [
      {
        href: '/tools/image/remove-background',
        name: { ko: '배경 자동 제거', en: 'Auto-remove the background', ja: '背景を自動削除', zh: '自动去除背景' },
        text: { ko: '사진을 올리면 배경을 자동으로 지워 투명 PNG로 만듭니다.', en: 'Upload the photo to auto-erase the background into a transparent PNG.', ja: '写真をアップロードすると背景を自動で消し、透過PNGにします。', zh: '上传照片后自动抠掉背景，做成透明 PNG。' },
      },
      {
        href: '/tools/image/id-photo',
        name: { ko: '증명사진 배경색 적용(선택)', en: 'Apply an ID background (optional)', ja: '証明写真の背景色を適用(任意)', zh: '应用证件照背景色(可选)' },
        text: { ko: '증명사진이면 흰색·파란색 배경을 새로 입힙니다.', en: 'For an ID photo, add a new white/blue background.', ja: '証明写真なら白・青の背景を新たに入れます。', zh: '如果是证件照，重新加上白色或蓝色背景。' },
      },
    ],
    relatedConverts: ['png-to-jpg'],
    faqs: [
      {
        q: { ko: '머리카락처럼 복잡한 경계도 되나요?', en: 'Does it handle hair edges?', ja: '髪の毛のような複雑な境界も処理できますか？', zh: '头发这样复杂的边缘也能处理吗？' },
        a: { ko: 'AI 매팅으로 머리카락 경계도 비교적 자연스럽게 처리하지만, 복잡한 배경에선 약간의 보정이 필요할 수 있습니다.', en: 'AI matting handles hair edges fairly well, though busy backgrounds may need minor touch-ups.', ja: 'AIマッティングで髪の境界も比較的自然に処理しますが、複雑な背景では少し補正が必要なことがあります。', zh: 'AI 抠图能比较自然地处理头发边缘，但背景复杂时可能需要稍作修正。' },
      },
      {
        q: { ko: '결과를 흰 배경 JPG로 저장할 수 있나요?', en: 'Can I save it as a white-background JPG?', ja: '白背景のJPGとして保存できますか？', zh: '可以保存成白底 JPG 吗？' },
        a: { ko: '네. 투명 PNG로 받은 뒤 증명사진 도구나 변환으로 흰 배경 JPG를 만들 수 있습니다.', en: 'Yes. Save the transparent PNG, then use the ID-photo tool or a converter for a white-background JPG.', ja: 'はい。透過PNGで保存した後、証明写真ツールや変換で白背景のJPGにできます。', zh: '可以。先保存为透明 PNG，再用证件照工具或转换功能做成白底 JPG。' },
      },
    ],
    keywords: {
      ko: ['사진 배경 제거', '누끼 따기', '투명배경 png', '배경 지우기'],
      en: ['remove background', 'transparent png', 'background eraser', 'cutout photo'], ja: ['背景 削除', '背景透過 png', '切り抜き', '背景 消す'], zh: ['照片 去背景', '抠图', '透明背景 png', '去除 背景'],
    },
  },
  {
    slug: 'make-ebook-from-text',
    category: 'docs',
    title: { ko: '텍스트로 전자책(EPUB) 만들기', en: 'Make an E-book (EPUB) from Text', ja: 'テキストから電子書籍(EPUB)を作成', zh: '用文本制作电子书(EPUB)' },
    h1: { ko: '텍스트로 전자책 만들기', en: 'Make an e-book from text', ja: 'テキストから電子書籍を作成', zh: '用文本制作电子书' },
    description: {
      ko: '원고 텍스트(TXT)를 전자책 리더용 EPUB으로 만들고, 필요하면 PDF로도. 업로드 없이 브라우저에서.',
      en: 'Turn a text manuscript (TXT) into a reader-ready EPUB, and optionally a PDF. In your browser, no upload.', ja: '原稿テキスト(TXT)を電子書籍リーダー向けのEPUBに、必要ならPDFにも。ブラウザ内で、アップロードなし。', zh: '把文稿文本(TXT)做成电子书阅读器用的 EPUB，需要的话还能转成 PDF。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '직접 쓴 글을 전자책으로 배포하려면 EPUB 형식이 표준입니다. 텍스트 원고를 EPUB으로 변환하면 글자 크기·줄바꿈이 화면에 맞춰 재배치되어 어떤 리더에서도 읽기 좋습니다. 변환은 브라우저 안에서 처리됩니다.',
      en: 'EPUB is the standard for distributing your own writing as an e-book. Converting a text manuscript to EPUB lets the type reflow to any screen, so it reads well on any reader. Conversion runs in your browser.', ja: '自分の文章を電子書籍として配布するなら、EPUB形式が標準です。テキスト原稿をEPUBに変換すると、文字サイズや改行が画面に合わせて再配置され、どのリーダーでも読みやすくなります。変換はブラウザ内で処理されます。', zh: '想把自己写的内容作为电子书发布，EPUB 是标准格式。把文本文稿转成 EPUB 后，字号和换行会随屏幕重新排版，在任何阅读器上都好读。转换在浏览器中处理。',
    },
    steps: [
      {
        href: '/tools/docs/txt-to-epub',
        name: { ko: 'TXT → EPUB 변환', en: 'Convert TXT → EPUB', ja: 'TXT→EPUBに変換', zh: 'TXT→EPUB 转换' },
        text: { ko: '텍스트 원고를 올려 제목·저자를 넣고 EPUB으로 만듭니다.', en: 'Upload your text, add a title/author and build the EPUB.', ja: 'テキスト原稿をアップロードし、タイトル・著者を入れてEPUBを作ります。', zh: '上传文本文稿，填写标题、作者后制作成 EPUB。' },
      },
      {
        href: '/tools/docs/epub-to-pdf',
        name: { ko: 'EPUB → PDF(선택)', en: 'EPUB → PDF (optional)', ja: 'EPUB→PDF(任意)', zh: 'EPUB→PDF(可选)' },
        text: { ko: '인쇄·고정 레이아웃이 필요하면 PDF로도 변환합니다.', en: 'Also convert to PDF if you need print or a fixed layout.', ja: '印刷や固定レイアウトが必要ならPDFにも変換します。', zh: '如果需要打印或固定版式，也可以转成 PDF。' },
      },
    ],
    relatedConverts: ['txt-to-epub', 'epub-to-pdf'],
    relatedCompares: ['epub-vs-pdf'],
    faqs: [
      {
        q: { ko: '표지 이미지를 넣을 수 있나요?', en: 'Can I add a cover image?', ja: '表紙画像を入れられますか？', zh: '可以加封面图片吗？' },
        a: { ko: 'EPUB 표지 도구로 표지를 교체·삽입할 수 있습니다. 변환 후 표지를 추가하세요.', en: 'Use the EPUB cover tool to add or replace a cover after converting.', ja: 'EPUB表紙ツールで、変換後に表紙を追加・差し替えできます。', zh: '可以用 EPUB 封面工具，在转换后添加或替换封面。' },
      },
      {
        q: { ko: '챕터를 나눌 수 있나요?', en: 'Can I split chapters?', ja: '章を分けられますか？', zh: '可以分章节吗？' },
        a: { ko: '원고의 제목/구분에 따라 챕터가 구성됩니다. 세부 편집은 EPUB 편집 도구를 함께 쓰세요.', en: 'Chapters form from your manuscript’s headings. Use the EPUB editing tools for finer control.', ja: '原稿の見出し・区切りに沿って章が構成されます。細かい編集はEPUB編集ツールを併用してください。', zh: '章节会根据文稿的标题、分隔来构成。需要细致编辑时请配合使用 EPUB 编辑工具。' },
      },
    ],
    keywords: {
      ko: ['전자책 만들기', 'txt epub', 'epub 변환', '전자출판'],
      en: ['make ebook', 'txt to epub', 'create epub', 'self publish'], ja: ['電子書籍 作成', 'txt epub', 'epub 変換', '電子出版'], zh: ['制作电子书', 'txt epub', 'epub 转换', '电子出版'],
    },
  },
  {
    slug: 'watermark-photos',
    category: 'image',
    title: { ko: '사진에 워터마크 넣기', en: 'Add a Watermark to Photos', ja: '写真にウォーターマークを入れる', zh: '给照片添加水印' },
    h1: { ko: '사진 워터마크', en: 'Watermark your photos', ja: '写真にウォーターマーク', zh: '给照片加水印' },
    description: {
      ko: '도용 방지를 위해 사진에 텍스트·로고 워터마크를 넣으세요. 위치·투명도 조절, 업로드 없이 브라우저에서.',
      en: 'Add a text or logo watermark to deter theft. Adjust position and opacity — in your browser, no upload.', ja: '盗用防止のため写真にテキスト・ロゴのウォーターマークを。位置・透明度を調整、ブラウザ内で、アップロードなし。', zh: '为防盗用，给照片加上文字或 Logo 水印。可调整位置和透明度，浏览器中完成，无需上传。',
    },
    intro: {
      ko: '온라인에 올린 사진은 쉽게 도용됩니다. 텍스트나 로고 워터마크를 넣으면 출처를 표시하고 무단 사용을 줄일 수 있습니다. 위치·크기·투명도를 조절해 자연스럽게 넣으세요. 처리는 브라우저 안에서 끝납니다.',
      en: 'Photos posted online are easily reused. A text or logo watermark marks ownership and discourages misuse. Tune position, size and opacity for a natural look. Processing happens in your browser.', ja: 'ネットに載せた写真は簡単に盗用されます。テキストやロゴのウォーターマークを入れれば出所を示し、無断使用を抑えられます。位置・サイズ・透明度を調整して自然に入れましょう。処理はブラウザ内で完結します。', zh: '发到网上的照片很容易被盗用。加上文字或 Logo 水印，可以标明出处并减少未经授权的使用。调整位置、大小、透明度让它自然融入。处理在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/image/watermark',
        name: { ko: '텍스트·로고 워터마크 합성', en: 'Composite a text/logo watermark', ja: 'テキスト・ロゴのウォーターマークを合成', zh: '合成文字／Logo 水印' },
        text: { ko: '사진을 올려 텍스트나 로고를 얹고 위치·투명도를 조절합니다.', en: 'Upload the photo, add text or a logo, and adjust position/opacity.', ja: '写真をアップロードし、テキストやロゴを重ねて位置・透明度を調整します。', zh: '上传照片，叠加文字或 Logo，调整位置和透明度。' },
      },
    ],
    faqs: [
      {
        q: { ko: '여러 장에 같은 워터마크를 넣을 수 있나요?', en: 'Can I watermark many photos the same way?', ja: '複数枚に同じウォーターマークを入れられますか？', zh: '可以给多张照片加同样的水印吗？' },
        a: { ko: '폴더 일괄 모드로 동일한 워터마크를 여러 장에 적용하고 묶어 받을 수 있습니다.', en: 'Folder mode applies the same watermark to many photos and bundles them.', ja: 'フォルダ一括モードで同じウォーターマークを複数枚に適用し、まとめてダウンロードできます。', zh: '文件夹批量模式可以给多张照片应用同样的水印，并打包下载。' },
      },
      {
        q: { ko: '워터마크가 사진을 가리지 않게 하려면?', en: 'How to keep it from covering the photo?', ja: 'ウォーターマークで写真を隠さないようにするには？', zh: '怎样让水印不遮挡照片？' },
        a: { ko: '투명도를 낮추고 모서리에 배치하면 내용은 살리면서 출처만 표시됩니다.', en: 'Lower the opacity and place it in a corner to mark ownership without hiding content.', ja: '透明度を下げて隅に配置すれば、内容を生かしつつ出所だけを示せます。', zh: '降低透明度并放在角落，就能在不遮挡内容的情况下只标明出处。' },
      },
    ],
    keywords: {
      ko: ['사진 워터마크', '로고 삽입', '도용 방지', '이미지 워터마크'],
      en: ['watermark photo', 'add logo', 'prevent theft', 'image watermark'], ja: ['写真 ウォーターマーク', 'ロゴ 挿入', '盗用 防止', '画像 透かし'], zh: ['照片 水印', 'logo 添加', '防盗用', '图片 水印'],
    },
  },

  /* ── 콘텐츠 확장 2026-06 (2차) ── */
  {
    slug: 'photos-into-one-pdf',
    category: 'pdf',
    title: { ko: '여러 사진을 PDF 한 권으로 묶기', en: 'Combine Many Photos into One PDF', ja: '複数の写真を1つのPDFにまとめる', zh: '把多张照片合并成一个 PDF' },
    h1: { ko: '사진 여러 장을 PDF로', en: 'Many photos into one PDF', ja: '複数の写真を1つのPDFに', zh: '多张照片合成一个 PDF' },
    description: {
      ko: '영수증·문서·사진 여러 장을 순서대로 묶어 하나의 PDF로 만드세요. 용량까지 줄여 메일·제출에 딱. 업로드 없음.',
      en: 'Bundle receipts, documents or photos in order into a single PDF, then shrink it for email and uploads. No upload.', ja: '領収書・書類・写真を順番どおり1つのPDFにまとめ、メール・提出用に容量も縮小。アップロードなし。', zh: '把多张收据、文件、照片按顺序合并成一个 PDF，还能减小体积，适合邮件、提交。无需上传。',
    },
    intro: {
      ko: '사진을 한 장씩 보내는 대신 한 권의 PDF로 묶으면 정리·제출이 훨씬 쉽습니다. 먼저 너무 큰 사진은 가볍게 줄이고, 원하는 순서로 PDF에 합친 뒤, 페이지를 재배열하면 끝입니다. 모든 처리는 브라우저 안에서 이뤄져 파일이 업로드되지 않습니다.',
      en: 'Instead of sending photos one by one, bundling them into a single PDF makes them easy to organize and submit. Shrink oversized photos first, combine them into a PDF in the order you want, then reorder pages. Everything runs in your browser — files are never uploaded.', ja: '写真を1枚ずつ送る代わりに1つのPDFにまとめると、整理も提出もぐっと楽になります。まず大きすぎる写真を軽くし、好きな順番でPDFに結合し、ページを並べ替えれば完成です。すべてブラウザ内で処理され、ファイルがアップロードされることはありません。', zh: '与其一张张发照片，不如合并成一个 PDF，整理和提交都方便得多。先把过大的照片压小，按想要的顺序合并进 PDF，再重新排列页面即可。所有处理都在浏览器中完成，文件不会被上传。',
    },
    steps: [
      {
        href: '/tools/image/batch-compress',
        name: { ko: '큰 사진 미리 줄이기', en: 'Shrink large photos first', ja: '大きい写真を先に縮小', zh: '先压小大照片' },
        text: { ko: '용량이 큰 사진들을 일괄 압축해 최종 PDF를 가볍게 만듭니다.', en: 'Batch-compress heavy photos so the final PDF stays light.', ja: '容量の大きい写真を一括圧縮し、最終的なPDFを軽くします。', zh: '批量压缩体积大的照片，让最终的 PDF 更轻。' },
      },
      {
        href: '/tools/pdf/from-jpg',
        name: { ko: '사진을 순서대로 PDF에 묶기', en: 'Combine photos into a PDF', ja: '写真を順番どおりPDFにまとめる', zh: '把照片按顺序合并成 PDF' },
        text: { ko: 'JPG·PNG·HEIC 여러 장을 원하는 순서로 하나의 PDF로 만듭니다.', en: 'Merge several JPG/PNG/HEIC images into one PDF in the order you want.', ja: 'JPG・PNG・HEICの複数枚を好きな順番で1つのPDFにまとめます。', zh: '把多张 JPG、PNG、HEIC 按想要的顺序合并成一个 PDF。' },
      },
      {
        href: '/tools/pdf/organize',
        name: { ko: '페이지 순서 다듬기', en: 'Fine-tune page order', ja: 'ページ順を整える', zh: '调整页面顺序' },
        text: { ko: '썸네일을 보며 페이지를 재정렬·삭제해 마무리합니다.', en: 'Reorder or delete pages with thumbnails to finish.', ja: 'サムネイルを見ながらページを並べ替え・削除して仕上げます。', zh: '对照缩略图重新排列、删除页面来收尾。' },
      },
    ],
    relatedConverts: ['jpg-to-pdf', 'png-to-pdf'],
    relatedCompares: ['jpg-to-pdf-vs-pdf-to-jpg'],
    faqs: [
      {
        q: { ko: '사진 순서를 바꿀 수 있나요?', en: 'Can I change the photo order?', ja: '写真の順番を変えられますか？', zh: '可以改照片顺序吗？' },
        a: { ko: '네. PDF로 묶을 때 순서를 정하고, 이후 페이지 정리 도구로 다시 재배열할 수 있습니다.', en: 'Yes. Set the order when combining, then rearrange again with the page-organize tool.', ja: 'はい。まとめる際に順番を決め、その後ページ整理ツールで再度並べ替えられます。', zh: '可以。合并时确定顺序，之后还能用页面整理工具重新排列。' },
      },
      {
        q: { ko: '아이폰 HEIC 사진도 되나요?', en: 'Does it work with iPhone HEIC photos?', ja: 'iPhoneのHEIC写真も使えますか？', zh: 'iPhone 的 HEIC 照片也行吗？' },
        a: { ko: '네. HEIC를 포함해 JPG·PNG·WebP를 그대로 PDF로 묶을 수 있습니다.', en: 'Yes. HEIC, JPG, PNG and WebP can all be bundled into a PDF directly.', ja: 'はい。HEICを含めJPG・PNG・WebPをそのままPDFにまとめられます。', zh: '可以。包括 HEIC 在内，JPG、PNG、WebP 都能直接合并成 PDF。' },
      },
    ],
    keywords: {
      ko: ['사진 pdf로 묶기', '여러 사진 pdf', '이미지 pdf 합치기', '영수증 pdf'],
      en: ['photos to pdf', 'combine images pdf', 'jpg to pdf multiple', 'receipts to pdf'], ja: ['写真 pdf まとめる', '複数 画像 pdf', '画像 pdf 結合', '領収書 pdf'], zh: ['照片 合并 pdf', '多张 照片 pdf', '图片 pdf 合并', '收据 pdf'],
    },
  },
  {
    slug: 'password-protect-pdf',
    category: 'pdf',
    title: { ko: 'PDF에 암호 걸어 안전하게 보내기', en: 'Password-Protect a PDF Before Sending', ja: 'PDFにパスワードをかけて安全に送る', zh: '给 PDF 加密码后安全发送' },
    h1: { ko: 'PDF 암호 설정', en: 'Password-protect a PDF', ja: 'PDFにパスワードを設定', zh: '为 PDF 设置密码' },
    description: {
      ko: '계약서·명세서 PDF에 열람 암호와 인쇄·편집 권한을 설정해 안전하게 공유하세요. 업로드 없이 브라우저에서.',
      en: 'Add an open password and print/edit permissions to contracts and statements before sharing. In your browser, no upload.', ja: '契約書・明細PDFに閲覧パスワードと印刷・編集権限を設定して安全に共有。ブラウザ内で、アップロードなし。', zh: '为合同、明细 PDF 设置查看密码和打印、编辑权限，安全地分享。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '민감한 PDF를 메일로 보낼 때는 열람 암호를 걸어 두는 것이 안전합니다. 필요하면 먼저 서명을 넣고, 암호와 인쇄·편집·복사 권한을 설정한 뒤 공유하세요. 암호 설정은 브라우저 안에서 처리되어 원본 파일이 서버로 올라가지 않습니다.',
      en: 'When emailing a sensitive PDF, an open password keeps it safe. Sign it first if needed, then set a password and print/edit/copy permissions before sharing. Protection happens in your browser — the original file is never uploaded.', ja: '機微なPDFをメールで送るときは、閲覧パスワードをかけておくと安全です。必要ならまず署名を入れ、パスワードと印刷・編集・コピー権限を設定してから共有します。保護はブラウザ内で行われ、元ファイルがアップロードされることはありません。', zh: '把敏感的 PDF 用邮件发送时，加上查看密码会更安全。需要的话先加签名，再设置密码和打印、编辑、复制权限后分享。加密在浏览器中进行，原文件不会上传到服务器。',
    },
    steps: [
      {
        href: '/tools/pdf/sign',
        name: { ko: '필요하면 서명 먼저', en: 'Sign first if needed', ja: '必要なら先に署名', zh: '需要的话先签名' },
        text: { ko: '계약서라면 마우스·터치로 서명을 넣어 둡니다.', en: 'For a contract, add your signature by mouse or touch.', ja: '契約書ならマウス・タッチで署名を入れておきます。', zh: '如果是合同，先用鼠标或触屏签好名。' },
      },
      {
        href: '/tools/pdf/protect',
        name: { ko: '암호·권한 설정', en: 'Set password and permissions', ja: 'パスワード・権限を設定', zh: '设置密码和权限' },
        text: { ko: '열람 암호와 인쇄·편집·복사 권한을 지정해 저장합니다.', en: 'Set an open password and print/edit/copy permissions, then save.', ja: '閲覧パスワードと印刷・編集・コピー権限を指定して保存します。', zh: '指定查看密码以及打印、编辑、复制权限后保存。' },
      },
    ],
    relatedCompares: ['merge-vs-split-pdf'],
    faqs: [
      {
        q: { ko: '암호를 잊으면 풀 수 있나요?', en: 'Can I unlock it if I forget the password?', ja: 'パスワードを忘れたら解除できますか？', zh: '忘记密码还能解锁吗？' },
        a: { ko: '본인이 아는 암호로 보호된 PDF는 잠금 해제 도구로 풀 수 있지만, 모르는 암호는 복구할 수 없습니다.', en: 'A PDF you protected can be unlocked with the unlock tool if you know the password, but a forgotten password cannot be recovered.', ja: '自分が知っているパスワードで保護したPDFは解除ツールで外せますが、忘れたパスワードは復元できません。', zh: '知道密码的话，受保护的 PDF 可以用解锁工具解开，但忘记的密码无法恢复。' },
      },
      {
        q: { ko: '인쇄만 막고 열람은 허용할 수 있나요?', en: 'Can I block printing but allow viewing?', ja: '印刷だけ禁止して閲覧は許可できますか？', zh: '可以只禁止打印但允许查看吗？' },
        a: { ko: '네. 권한 암호로 인쇄·편집·복사를 개별로 제한하면서 열람은 허용할 수 있습니다.', en: 'Yes. A permissions password can restrict printing/editing/copying individually while still allowing viewing.', ja: 'はい。権限パスワードで印刷・編集・コピーを個別に制限しつつ、閲覧は許可できます。', zh: '可以。用权限密码可以分别限制打印、编辑、复制，同时仍允许查看。' },
      },
    ],
    keywords: {
      ko: ['pdf 암호 설정', 'pdf 비밀번호', 'pdf 보호', 'pdf 권한'],
      en: ['password protect pdf', 'pdf password', 'secure pdf', 'pdf permissions'], ja: ['pdf パスワード 設定', 'pdf パスワード', 'pdf 保護', 'pdf 権限'], zh: ['pdf 密码 设置', 'pdf 密码', 'pdf 加密 保护', 'pdf 权限'],
    },
  },
  {
    slug: 'iphone-photos-for-windows',
    category: 'image',
    title: { ko: '아이폰 HEIC 사진 윈도우에서 열기', en: 'Open iPhone HEIC Photos on Windows', ja: 'iPhoneのHEIC写真をWindowsで開く', zh: '在 Windows 上打开 iPhone HEIC 照片' },
    h1: { ko: '아이폰 사진 변환', en: 'Convert iPhone photos', ja: 'iPhone写真を変換', zh: '转换 iPhone 照片' },
    description: {
      ko: '윈도우·웹에서 안 열리는 아이폰 HEIC 사진을 JPG로 일괄 변환하고, 위치정보(EXIF)까지 지워 안전하게 공유하세요.',
      en: 'Batch-convert iPhone HEIC photos that won’t open on Windows/web to JPG, and strip location (EXIF) data for safe sharing.', ja: 'Windows・Webで開けないiPhoneのHEIC写真をJPGに一括変換し、位置情報(EXIF)も消して安全に共有。', zh: '把在 Windows、网页上打不开的 iPhone HEIC 照片批量转成 JPG，并清除位置信息(EXIF)，安全分享。',
    },
    intro: {
      ko: '아이폰은 사진을 HEIC로 저장해 용량을 아끼지만, 윈도우·일부 웹·구형 앱은 이를 열지 못합니다. JPG로 일괄 변환하면 어디서나 열리고, 공유 전 GPS·촬영정보를 지우면 위치 노출도 막을 수 있습니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'iPhones save photos as HEIC to save space, but Windows, some websites and old apps can’t open them. Batch-convert to JPG so they open anywhere, and strip GPS/EXIF before sharing to avoid leaking your location. Everything runs in your browser.', ja: 'iPhoneは容量を抑えるため写真をHEICで保存しますが、Windowsや一部のWeb・古いアプリでは開けません。JPGに一括変換すればどこでも開け、共有前にGPS・撮影情報を消せば位置の流出も防げます。すべてブラウザ内で完結します。', zh: 'iPhone 为了省空间把照片存为 HEIC，但 Windows、部分网页和老旧应用打不开。批量转成 JPG 后到处都能打开，分享前清除 GPS、拍摄信息还能防止位置泄露。所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/image/heic-to-jpg',
        name: { ko: 'HEIC → JPG 일괄 변환', en: 'Batch HEIC → JPG', ja: 'HEIC→JPGを一括変換', zh: 'HEIC→JPG 批量转换' },
        text: { ko: 'HEIC 사진을 여러 장 올려 한 번에 JPG로 변환합니다.', en: 'Drop several HEIC photos to convert them to JPG at once.', ja: 'HEIC写真を複数枚入れて、一度にJPGへ変換します。', zh: '上传多张 HEIC 照片，一次性转成 JPG。' },
      },
      {
        href: '/tools/image/exif-batch',
        name: { ko: '위치정보(EXIF) 일괄 제거', en: 'Strip location (EXIF)', ja: '位置情報(EXIF)を一括削除', zh: '批量删除位置信息(EXIF)' },
        text: { ko: '공유 전 GPS·촬영정보를 여러 장에서 한꺼번에 지웁니다.', en: 'Remove GPS/EXIF from many photos at once before sharing.', ja: '共有前にGPS・撮影情報を複数枚から一度に消します。', zh: '分享前一次性从多张照片中清除 GPS、拍摄信息。' },
      },
    ],
    relatedConverts: ['heic-to-jpg', 'heic-to-png'],
    relatedCompares: ['heic-vs-jpg'],
    faqs: [
      {
        q: { ko: '여러 장을 한 번에 변환하나요?', en: 'Can I convert many at once?', ja: '複数枚を一度に変換できますか？', zh: '可以一次转换多张吗？' },
        a: { ko: '네. HEIC 여러 장을 올려 일괄 변환하고 ZIP으로 받을 수 있습니다.', en: 'Yes. Drop multiple HEIC files to batch-convert and download as a ZIP.', ja: 'はい。複数のHEICを入れて一括変換し、ZIPでダウンロードできます。', zh: '可以。上传多个 HEIC 文件批量转换，并打包成 ZIP 下载。' },
      },
      {
        q: { ko: '화질이 떨어지나요?', en: 'Does quality drop?', ja: '音質・画質は落ちますか？', zh: '画质会下降吗？' },
        a: { ko: 'JPG로 재인코딩하며 작은 손실이 생기지만 높은 품질 설정에선 거의 알아챌 수 없습니다.', en: 'Re-encoding to JPG adds a small loss that is hard to notice at high quality settings.', ja: 'JPGへの再エンコードでわずかに劣化しますが、高品質設定ではほとんど気づきません。', zh: '转成 JPG 时会重新编码，产生少许损失，但在高质量设置下几乎察觉不到。' },
      },
    ],
    keywords: {
      ko: ['heic jpg 변환', '아이폰 사진 윈도우', 'heic 안열림', '아이폰 사진 변환'],
      en: ['heic to jpg windows', 'open iphone photos', 'convert heic', 'heic not opening'], ja: ['heic jpg 変換', 'iphone 写真 windows', 'heic 開けない', 'iphone 写真 変換'], zh: ['heic jpg 转换', 'iphone 照片 windows', 'heic 打不开', 'iphone 照片 转换'],
    },
  },
  {
    slug: 'compress-video-for-upload',
    category: 'video',
    title: { ko: '영상 용량 줄여 업로드하기', en: 'Compress a Video for Upload', ja: '動画の容量を減らしてアップロード', zh: '压缩视频后上传' },
    h1: { ko: '영상 압축해서 올리기', en: 'Compress a video to upload', ja: '動画を圧縮してアップロード', zh: '压缩视频再上传' },
    description: {
      ko: '용량 제한에 걸리는 영상을 필요한 구간만 잘라내고 압축해 가볍게 만드세요. 업로드 없이 브라우저에서.',
      en: 'Trim to the part you need and compress videos that hit upload limits. In your browser, no upload.', ja: '容量制限に引っかかる動画を、必要な区間だけ切り出して圧縮し軽くします。ブラウザ内で、アップロードなし。', zh: '把超出大小限制的视频只截取需要的片段并压缩变轻。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '메신저·게시판·메일은 영상 용량에 제한이 있습니다. 먼저 필요 없는 앞뒤 구간을 잘라내 길이를 줄이고, 해상도·비트레이트를 낮춰 압축하면 화질을 크게 해치지 않고 용량을 줄일 수 있습니다. 모든 처리는 브라우저 안에서 끝나 영상이 업로드되지 않습니다.',
      en: 'Messengers, forums and email cap video size. Trim the unneeded head and tail to shorten it, then lower the resolution/bitrate to compress — cutting size without ruining quality. Everything runs in your browser, so the video is never uploaded.', ja: 'メッセンジャー・掲示板・メールには動画の容量制限があります。まず不要な前後を切り取って短くし、解像度・ビットレートを下げて圧縮すれば、画質を大きく損なわずに容量を減らせます。すべてブラウザ内で処理され、動画がアップロードされることはありません。', zh: '即时通讯、论坛、邮件都有视频大小限制。先剪掉不需要的前后片段缩短时长，再降低分辨率、比特率压缩，就能在不大幅损害画质的前提下减小体积。所有处理都在浏览器中完成，视频不会被上传。',
    },
    steps: [
      {
        href: '/tools/video/trim',
        name: { ko: '필요한 구간만 자르기', en: 'Trim to what you need', ja: '必要な区間だけ切り出す', zh: '只截取需要的片段' },
        text: { ko: '시작·종료 시각을 지정해 필요한 구간만 남깁니다.', en: 'Set start/end times to keep only the part you need.', ja: '開始・終了時刻を指定し、必要な区間だけ残します。', zh: '指定开始、结束时间，只保留需要的片段。' },
      },
      {
        href: '/tools/video/compress',
        name: { ko: '해상도·비트레이트 낮춰 압축', en: 'Compress by resolution/bitrate', ja: '解像度・ビットレートを下げて圧縮', zh: '降低分辨率／比特率压缩' },
        text: { ko: '해상도와 비트레이트를 조정해 용량 제한에 맞춥니다.', en: 'Adjust resolution and bitrate to fit the size limit.', ja: '解像度とビットレートを調整して容量制限に合わせます。', zh: '调整分辨率和比特率以符合大小限制。' },
      },
    ],
    relatedConverts: ['mov-to-mp4', 'mkv-to-mp4'],
    relatedCompares: ['mp4-vs-webm'],
    faqs: [
      {
        q: { ko: '화질을 최대한 지키며 줄이려면?', en: 'How to shrink while keeping quality?', ja: '画質を保ったまま容量を減らすには？', zh: '怎样在保持画质的同时减小体积？' },
        a: { ko: '먼저 불필요한 구간을 잘라 길이를 줄이고, 해상도는 그대로 두되 비트레이트만 낮추면 화질 손실을 줄일 수 있습니다.', en: 'Trim first to shorten length, then keep the resolution but lower only the bitrate to minimize quality loss.', ja: 'まず不要な区間を切って短くし、解像度はそのままにビットレートだけ下げると画質の劣化を抑えられます。', zh: '先剪掉不必要的片段缩短时长，保持分辨率不变、只降低比特率，可以减少画质损失。' },
      },
      {
        q: { ko: 'MOV·MKV 영상도 되나요?', en: 'Does it work with MOV/MKV?', ja: 'MOV・MKV動画も使えますか？', zh: 'MOV、MKV 视频也行吗？' },
        a: { ko: '네. 다양한 포맷을 다루며, 업로드 호환을 위해 MP4로 변환해 두면 더 안전합니다.', en: 'Yes. It handles many formats; converting to MP4 first makes uploads more compatible.', ja: 'はい。さまざまな形式に対応しており、アップロード互換のためMP4に変換しておくとより安全です。', zh: '可以。支持多种格式，为了上传兼容性，先转成 MP4 会更稳妥。' },
      },
    ],
    keywords: {
      ko: ['영상 용량 줄이기', '동영상 압축', '영상 업로드 용량', 'mp4 압축'],
      en: ['compress video upload', 'reduce video size', 'shrink mp4', 'video too large'], ja: ['動画 容量 圧縮', '動画 軽くする', 'mp4 圧縮', '動画 サイズ 縮小'], zh: ['视频 压缩', '视频 减小体积', 'mp4 压缩', '视频 太大'],
    },
  },
  {
    slug: 'read-pdf-on-ereader',
    category: 'docs',
    title: { ko: 'PDF를 전자책 리더에서 편하게 읽기', en: 'Read a PDF Comfortably on an E-reader', ja: 'PDFを電子書籍リーダーで快適に読む', zh: '在电子书阅读器上舒适地阅读 PDF' },
    h1: { ko: 'PDF를 EPUB으로', en: 'PDF to e-reader EPUB', ja: 'PDFをEPUBに', zh: '把 PDF 转成 EPUB' },
    description: {
      ko: '작은 화면에서 확대·축소가 불편한 PDF를 EPUB으로 바꿔 글자가 화면에 맞춰 흐르게 만드세요. 업로드 없이 브라우저에서.',
      en: 'Turn a pinch-and-zoom PDF into an EPUB whose text reflows to fit any screen. In your browser, no upload.', ja: '拡大・縮小が面倒なPDFをEPUBに変換し、文字が画面に合わせて流れるように。ブラウザ内で、アップロードなし。', zh: '把在小屏幕上缩放很麻烦的 PDF 转成 EPUB，让文字随屏幕重新排版。浏览器中完成，无需上传。',
    },
    intro: {
      ko: 'PDF는 레이아웃이 고정돼 작은 폰·전자책 단말에서는 확대·축소를 반복해야 합니다. EPUB으로 변환하면 글자가 화면 크기에 맞춰 재배치되어 글꼴·크기를 조절하며 편하게 읽을 수 있습니다. 변환 후 제목·저자 정보를 정리하면 서재 정렬도 깔끔해집니다.',
      en: 'A PDF’s fixed layout forces constant pinch-and-zoom on phones and e-readers. Converting to EPUB reflows the text to the screen so you can adjust font and size and read comfortably. Tidying the title/author afterward keeps your library organized.', ja: 'PDFはレイアウトが固定されているため、スマホや電子書籍端末では拡大・縮小を繰り返す必要があります。EPUBに変換すると文字が画面サイズに合わせて再配置され、フォントやサイズを調整して快適に読めます。変換後にタイトル・著者を整えると、ライブラリの並びもすっきりします。', zh: 'PDF 版式固定，在小手机或电子书设备上得反复缩放。转成 EPUB 后，文字会随屏幕大小重新排版，可以调整字体和字号舒适阅读。转换后整理好标题、作者信息，书架排列也会更整齐。',
    },
    steps: [
      {
        href: '/tools/pdf/to-epub',
        name: { ko: 'PDF → EPUB 변환', en: 'Convert PDF → EPUB', ja: 'PDF→EPUBに変換', zh: 'PDF→EPUB 转换' },
        text: { ko: 'PDF 텍스트를 추출해 챕터가 나뉜 EPUB 전자책으로 만듭니다.', en: 'Extract the PDF text into a chaptered EPUB e-book.', ja: 'PDFのテキストを抽出し、章で区切られたEPUB電子書籍にします。', zh: '提取 PDF 文字，做成分章节的 EPUB 电子书。' },
      },
      {
        href: '/tools/docs/epub-metadata',
        name: { ko: '제목·저자 정보 정리', en: 'Tidy title/author', ja: 'タイトル・著者を整える', zh: '整理标题・作者信息' },
        text: { ko: '제목·저자·언어를 채워 리더 서재에서 깔끔하게 정렬되게 합니다.', en: 'Fill in title/author/language so it sorts neatly in your reader.', ja: 'タイトル・著者・言語を入れ、リーダーのライブラリできれいに並ぶようにします。', zh: '填好标题、作者、语言，让它在阅读器书架上整齐排列。' },
      },
      {
        href: '/tools/docs/epub-reader',
        name: { ko: '브라우저에서 바로 확인', en: 'Preview in the browser', ja: 'ブラウザでそのまま確認', zh: '在浏览器中直接预览' },
        text: { ko: '변환 결과를 EPUB 리더로 열어 목차·글자 크기를 확인합니다.', en: 'Open the result in the EPUB reader to check the table of contents and font size.', ja: '変換結果をEPUBリーダーで開き、目次や文字サイズを確認します。', zh: '用 EPUB 阅读器打开转换结果，确认目录和字号。' },
      },
    ],
    relatedConverts: ['pdf-to-epub', 'epub-to-pdf'],
    relatedCompares: ['epub-vs-pdf'],
    faqs: [
      {
        q: { ko: '표·이미지가 많은 PDF도 잘 되나요?', en: 'Does it handle PDFs with many tables/images?', ja: '表・画像の多いPDFもうまくいきますか？', zh: '表格、图片多的 PDF 也行吗？' },
        a: { ko: 'EPUB은 글이 흐르는 책에 가장 적합합니다. 도표가 정확히 고정돼야 한다면 PDF가 더 낫습니다.', en: 'EPUB suits flowing text best. If charts must stay exactly placed, PDF is better.', ja: 'EPUBは文章が流れる本に最も向いています。図表を正確に固定したい場合はPDFの方が適しています。', zh: 'EPUB 最适合文字流式的书。如果图表必须精确固定，PDF 更合适。' },
      },
      {
        q: { ko: '다시 PDF로 되돌릴 수 있나요?', en: 'Can I convert it back to PDF?', ja: 'またPDFに戻せますか？', zh: '可以再转回 PDF 吗？' },
        a: { ko: '네. EPUB→PDF 변환으로 다시 고정 레이아웃 문서로 만들 수 있습니다.', en: 'Yes. An EPUB→PDF conversion turns it back into a fixed-layout document.', ja: 'はい。EPUB→PDF変換で、再び固定レイアウトの文書にできます。', zh: '可以。通过 EPUB→PDF 转换，能再变回固定版式的文档。' },
      },
    ],
    keywords: {
      ko: ['pdf epub 변환', 'pdf 전자책', '전자책 리더 pdf', 'pdf 흐름 읽기'],
      en: ['pdf to epub', 'read pdf ereader', 'pdf reflow', 'pdf ebook'], ja: ['pdf epub 変換', 'pdf 電子書籍', '電子書籍 リーダー pdf', 'pdf リフロー'], zh: ['pdf epub 转换', 'pdf 电子书', '电子书阅读器 pdf', 'pdf 重排'],
    },
  },
  {
    slug: 'pdf-table-to-spreadsheet',
    category: 'pdf',
    title: { ko: 'PDF 표를 엑셀로 뽑아내기', en: 'Pull a PDF Table into a Spreadsheet', ja: 'PDFの表をExcelに取り出す', zh: '把 PDF 表格提取到 Excel' },
    h1: { ko: 'PDF 표 → 엑셀', en: 'PDF table to spreadsheet', ja: 'PDFの表→Excel', zh: 'PDF 表格→Excel' },
    description: {
      ko: '명세서·보고서 PDF 속 표를 인식해 엑셀(XLSX)·CSV로 추출하세요. 다시 타이핑할 필요 없이, 업로드 없이 브라우저에서.',
      en: 'Detect tables inside statements and reports and extract them to Excel (XLSX)/CSV — no retyping, in your browser.', ja: '明細・報告書PDFの表を認識し、Excel(XLSX)・CSVに抽出。打ち直し不要で、ブラウザ内で。', zh: '识别明细、报告 PDF 中的表格，提取成 Excel(XLSX)、CSV。无需重新打字，浏览器中完成。',
    },
    intro: {
      ko: 'PDF에 박힌 표를 손으로 다시 옮겨 적는 건 번거롭고 실수가 잦습니다. 표 인식 도구로 행·열을 그대로 XLSX·CSV로 뽑아내면, 바로 계산·정렬·필터를 적용할 수 있습니다. 필요하면 CSV를 JSON 등 다른 데이터 포맷으로 다시 변환하세요. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'Retyping a table locked inside a PDF is tedious and error-prone. A table-detection tool pulls the rows and columns straight into XLSX/CSV so you can calculate, sort and filter right away. Convert the CSV to JSON or other data formats if needed. Everything runs in your browser.', ja: 'PDFに埋め込まれた表を手で打ち直すのは面倒で、ミスも起きがちです。表認識ツールで行・列をそのままXLSX・CSVに取り出せば、すぐに計算・並べ替え・絞り込みができます。必要ならCSVをJSONなど別のデータ形式に変換しましょう。すべてブラウザ内で完結します。', zh: '把 PDF 里的表格手动重新誊抄既麻烦又容易出错。用表格识别工具把行列直接提取成 XLSX、CSV，就能立刻进行计算、排序、筛选。需要的话再把 CSV 转成 JSON 等其他数据格式。所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/pdf/to-excel',
        name: { ko: 'PDF 표 인식 → 엑셀 추출', en: 'Detect PDF tables → Excel', ja: 'PDFの表を認識→Excelに抽出', zh: '识别 PDF 表格→提取到 Excel' },
        text: { ko: 'PDF 속 표를 인식해 XLSX·CSV로 추출합니다.', en: 'Detect tables in the PDF and extract them to XLSX/CSV.', ja: 'PDF内の表を認識してXLSX・CSVに抽出します。', zh: '识别 PDF 中的表格，提取成 XLSX、CSV。' },
      },
      {
        href: '/tools/docs/csv-json',
        name: { ko: '필요하면 JSON으로 변환', en: 'Convert to JSON if needed', ja: '必要ならJSONに変換', zh: '需要的话转成 JSON' },
        text: { ko: '추출한 CSV를 프로그램에서 쓰기 좋은 JSON으로 바꿉니다.', en: 'Turn the extracted CSV into program-friendly JSON.', ja: '抽出したCSVを、プログラムで扱いやすいJSONに変換します。', zh: '把提取出的 CSV 转成便于程序使用的 JSON。' },
      },
    ],
    relatedConverts: ['pdf-to-xlsx', 'csv-to-json'],
    relatedCompares: ['csv-vs-json'],
    faqs: [
      {
        q: { ko: '복잡한 표도 정확히 추출되나요?', en: 'Does it handle complex tables accurately?', ja: '複雑な表も正確に抽出できますか？', zh: '复杂的表格也能准确提取吗？' },
        a: { ko: '단순한 격자 표일수록 정확합니다. 병합 셀이 많으면 추출 후 약간의 정리가 필요할 수 있습니다.', en: 'Plain grid tables extract most accurately. Heavily merged cells may need a little cleanup afterward.', ja: '単純な格子状の表ほど正確です。結合セルが多いと、抽出後に少し整理が必要なことがあります。', zh: '越是简单的网格表格越准确。如果合并单元格很多，提取后可能需要稍作整理。' },
      },
      {
        q: { ko: '스캔한 이미지 PDF도 되나요?', en: 'What about scanned image PDFs?', ja: 'スキャン画像のPDFも使えますか？', zh: '扫描成图片的 PDF 也行吗？' },
        a: { ko: '텍스트가 들어 있는 PDF에서 가장 잘 동작합니다. 스캔 이미지라면 먼저 OCR로 텍스트화하는 것이 좋습니다.', en: 'It works best on PDFs that contain real text. For scans, run OCR to extract text first.', ja: 'テキストを含むPDFで最もよく動作します。スキャン画像ならまずOCRでテキスト化するとよいでしょう。', zh: '在含有真实文字的 PDF 上效果最好。如果是扫描图片，建议先用 OCR 转成文字。' },
      },
    ],
    keywords: {
      ko: ['pdf 표 엑셀', 'pdf 표 추출', 'pdf 엑셀 변환', '명세서 엑셀'],
      en: ['pdf table to excel', 'extract pdf table', 'pdf to xlsx', 'statement to excel'], ja: ['pdf 表 excel', 'pdf 表 抽出', 'pdf excel 変換', '明細 excel'], zh: ['pdf 表格 excel', 'pdf 表格 提取', 'pdf excel 转换', '明细 excel'],
    },
  },

  /* ── EN 활용법·비교 확대 2026-06 (3차) ── */
  {
    slug: 'anonymize-video-before-posting',
    category: 'video',
    title: { ko: '영상 올리기 전 얼굴 가리기', en: 'Blur Faces in a Video Before Posting', ja: '投稿前に動画の顔を隠す', zh: '发布前遮挡视频中的人脸' },
    h1: { ko: '영상 속 얼굴 모자이크', en: 'Anonymize faces in a video', ja: '動画の顔をモザイク', zh: '给视频中的人脸打码' },
    description: {
      ko: 'SNS·유튜브에 올리기 전 영상 속 지나가는 사람들 얼굴을 추적해 블러·모자이크하세요. 필요한 구간만 잘라서, 업로드 없이 브라우저에서.',
      en: 'Track and blur bystanders’ faces in a video before posting to social or YouTube, and trim to just the part you need. In your browser, no upload.', ja: 'SNS・YouTubeに載せる前に、動画に映る通行人の顔を追跡してぼかし・モザイク。必要な区間だけ切り出して、ブラウザ内で、アップロードなし。', zh: '发布到社交媒体、YouTube 前，追踪视频中路过的人脸并模糊、打码。只截取需要的片段，浏览器中完成，无需上传。',
    },
    intro: {
      ko: 'AI가 영상 속 얼굴을 프레임마다 추적해 블러·모자이크·이모지로 가립니다. 먼저 필요 없는 앞뒤를 잘라 길이를 줄이면 처리도 빨라집니다. 오디오는 그대로 유지되며, 모든 처리는 브라우저 안에서 끝나 영상이 업로드되지 않습니다.',
      en: 'AI tracks faces frame by frame and covers them with blur, mosaic or emoji. Trim the unneeded head and tail first to shorten it and speed up processing. The audio stays intact, and everything runs in your browser so the video is never uploaded.', ja: 'AIが動画の顔をフレームごとに追跡し、ぼかし・モザイク・絵文字で隠します。まず不要な前後を切って短くすると処理も速くなります。音声はそのまま保たれ、すべてブラウザ内で処理されるため、動画がアップロードされることはありません。', zh: 'AI 逐帧追踪视频中的人脸，用模糊、马赛克或表情符号遮挡。先剪掉不需要的前后缩短时长，处理也会更快。音频保持不变，所有处理都在浏览器中完成，视频不会被上传。',
    },
    steps: [
      {
        href: '/tools/video/trim',
        name: { ko: '필요한 구간만 자르기', en: 'Trim to what you need', ja: '必要な区間だけ切り出す', zh: '只截取需要的片段' },
        text: { ko: '시작·종료 시각을 지정해 필요한 부분만 남깁니다.', en: 'Set start/end times to keep only the part you need.', ja: '開始・終了時刻を指定し、必要な区間だけ残します。', zh: '指定开始、结束时间，只保留需要的部分。' },
      },
      {
        href: '/tools/video/blur-face',
        name: { ko: '얼굴 추적 + 가림', en: 'Track + cover faces', ja: '顔を追跡+隠す', zh: '追踪+遮挡人脸' },
        text: { ko: '영상 속 얼굴을 자동 추적해 블러·모자이크·이모지로 가립니다.', en: 'Auto-track faces and cover them with blur, mosaic or emoji.', ja: '動画の顔を自動追跡し、ぼかし・モザイク・絵文字で隠します。', zh: '自动追踪视频中的人脸，用模糊、马赛克或表情符号遮挡。' },
      },
    ],
    relatedConverts: ['mov-to-mp4', 'mkv-to-mp4'],
    relatedCompares: ['mp4-vs-webm'],
    faqs: [
      {
        q: { ko: '측면·뒷모습 얼굴도 가려지나요?', en: 'Does it cover side and back-facing faces?', ja: '横顔や後ろ姿の顔も隠せますか？', zh: '侧脸、背影的脸也能遮挡吗？' },
        a: { ko: '정면 얼굴이 가장 잘 잡힙니다. 놓친 구간은 영역을 직접 추가해 보완할 수 있습니다.', en: 'Front-facing faces are caught best. You can add regions manually to cover any that are missed.', ja: '正面の顔が最もよく検出されます。見逃した区間は手動で範囲を追加して補えます。', zh: '正面人脸检测得最好。漏掉的片段可以手动添加区域来补充。' },
      },
      {
        q: { ko: '오디오는 유지되나요?', en: 'Is the audio kept?', ja: '音声は残りますか？', zh: '音频会保留吗？' },
        a: { ko: '네. 화면의 얼굴만 가리고 원본 오디오는 그대로 남습니다.', en: 'Yes. Only the on-screen faces are covered; the original audio is preserved.', ja: 'はい。画面の顔だけを隠し、元の音声はそのまま残ります。', zh: '会。只遮挡画面中的人脸，原始音频保持不变。' },
      },
    ],
    keywords: {
      ko: ['영상 얼굴 모자이크', '동영상 얼굴 블러', '영상 익명화', '행인 얼굴 가리기'],
      en: ['blur faces in video', 'anonymize video', 'video face blur', 'hide faces video'], ja: ['動画 顔 モザイク', '動画 顔 ぼかし', '動画 匿名化', '通行人 顔 隠す'], zh: ['视频 人脸 打码', '视频 人脸 模糊', '视频 匿名化', '路人 人脸 遮挡'],
    },
  },
  {
    slug: 'make-meme-gif-with-caption',
    category: 'gif',
    title: { ko: '자막 넣은 밈 GIF 만들기', en: 'Make a Captioned Meme GIF', ja: '字幕入りミームGIFを作成', zh: '制作带字幕的表情包 GIF' },
    h1: { ko: '자막 GIF 만들기', en: 'Make a captioned GIF', ja: '字幕入りGIFを作成', zh: '制作带字幕的 GIF' },
    description: {
      ko: '영상 한 구간을 GIF로 만들고 위에 자막을 얹은 뒤 용량까지 줄이세요. 업로드 없이 브라우저에서.',
      en: 'Turn a clip into a GIF, add a caption on top, then shrink the file. In your browser, no upload.', ja: '動画の区間をGIFにし、上に字幕を重ねて容量も縮小。ブラウザ内で、アップロードなし。', zh: '把视频的一段做成 GIF，叠上字幕，再减小体积。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '밈 GIF는 세 단계면 됩니다. 영상에서 원하는 짧은 구간을 GIF로 뽑고, 텍스트 자막을 얹은 뒤, 팔레트·프레임 최적화로 용량을 줄여 어디든 올리기 좋게 만듭니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'A meme GIF takes three steps: pull a short clip from a video as a GIF, add a text caption, then optimize the palette and frames to shrink it for posting anywhere. Everything runs in your browser.', ja: 'ミームGIFは3ステップ。動画から短い区間をGIFで取り出し、テキスト字幕を重ね、パレットとフレームを最適化して容量を抑えれば、どこにでも投稿しやすくなります。すべてブラウザ内で処理されます。', zh: '表情包 GIF 三步搞定。从视频里取出想要的短片段做成 GIF，叠上文字字幕，再通过调色板、帧优化减小体积，就能方便地发到各处。所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/video/to-gif',
        name: { ko: '영상 → GIF', en: 'Clip → GIF', ja: '区間→GIF', zh: '片段→GIF' },
        text: { ko: '영상에서 원하는 구간을 골라 GIF로 변환합니다.', en: 'Pick a section of the video and convert it to a GIF.', ja: '動画から好きな区間を選んでGIFに変換します。', zh: '从视频中选择想要的片段，转成 GIF。' },
      },
      {
        href: '/tools/gif/text',
        name: { ko: '자막 얹기', en: 'Add a caption', ja: '字幕を重ねる', zh: '叠加字幕' },
        text: { ko: 'GIF 위에 표시될 텍스트·자막을 추가합니다.', en: 'Add text that shows across the GIF.', ja: 'GIFに表示されるテキスト・字幕を追加します。', zh: '添加显示在 GIF 上的文字、字幕。' },
      },
      {
        href: '/tools/gif/optimize',
        name: { ko: '용량 줄이기', en: 'Shrink the file', ja: '容量を縮小', zh: '减小体积' },
        text: { ko: '팔레트·프레임을 최적화해 용량을 줄입니다.', en: 'Optimize palette and frames to reduce the size.', ja: 'パレットとフレームを最適化して容量を減らします。', zh: '优化调色板和帧来减小体积。' },
      },
    ],
    relatedConverts: ['mp4-to-gif', 'webm-to-gif'],
    relatedCompares: ['gif-vs-mp4'],
    faqs: [
      {
        q: { ko: 'GIF가 너무 커요.', en: 'My GIF is too large.', ja: 'GIFの容量が大きすぎます。', zh: 'GIF 太大了。' },
        a: { ko: '길이를 줄이고 크기·색을 낮추세요. 정교한 영상이면 GIF 대신 MP4가 훨씬 작습니다.', en: 'Trim length and lower size/colors. For detailed clips, MP4 is far smaller than GIF.', ja: '長さを短く、サイズ・色数を下げてください。緻密な映像ならGIFよりMP4の方がはるかに小さくなります。', zh: '缩短时长，降低尺寸和色数。画面精细的视频用 MP4 会比 GIF 小得多。' },
      },
      {
        q: { ko: '자막 위치를 바꿀 수 있나요?', en: 'Can I move the caption?', ja: '字幕の位置を変えられますか？', zh: '可以移动字幕位置吗？' },
        a: { ko: '네. 텍스트 위치·크기를 조절해 상단·하단 어디든 배치할 수 있습니다.', en: 'Yes. Adjust the text position and size to place it top, bottom or anywhere.', ja: 'はい。テキストの位置・サイズを調整して、上・下など好きな場所に配置できます。', zh: '可以。调整文字的位置和大小，放在上方、下方等任意位置。' },
      },
    ],
    keywords: {
      ko: ['밈 gif 만들기', 'gif 자막', '영상 gif 자막', 'gif 텍스트'],
      en: ['make meme gif', 'caption gif', 'gif with text', 'video to gif caption'], ja: ['ミーム gif 作成', 'gif 字幕', '動画 gif 字幕', 'gif テキスト'], zh: ['表情包 gif 制作', 'gif 字幕', '视频 gif 字幕', 'gif 文字'],
    },
  },
  {
    slug: 'split-pdf-into-chapters',
    category: 'pdf',
    title: { ko: '큰 PDF를 챕터·부분으로 나누기', en: 'Split a Big PDF into Chapters', ja: '大きなPDFを章・部分に分ける', zh: '把大 PDF 拆分成章节・部分' },
    h1: { ko: 'PDF 챕터로 나누기', en: 'Split a PDF into parts', ja: 'PDFを分割', zh: '拆分 PDF' },
    description: {
      ko: '두꺼운 PDF에서 필요한 페이지 범위만 따로 빼내거나 챕터별로 쪼개세요. 페이지 정리까지, 업로드 없이 브라우저에서.',
      en: 'Pull a page range out of a thick PDF or break it into per-chapter files, then tidy the pages. In your browser, no upload.', ja: '分厚いPDFから必要なページ範囲だけ取り出したり章ごとに分割したり。ページ整理まで、ブラウザ内で、アップロードなし。', zh: '从厚厚的 PDF 中单独取出需要的页面范围，或按章节拆分。连页面整理一起，浏览器中完成，无需上传。',
    },
    intro: {
      ko: '큰 PDF는 통째로 다루기 불편합니다. 나누기 도구로 원하는 페이지 범위를 별도 PDF로 추출하거나 챕터 단위로 쪼갠 뒤, 페이지 정리 도구로 순서를 다듬으면 작고 다루기 쉬운 파일이 됩니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'A big PDF is awkward to handle whole. Use the split tool to extract a page range into its own PDF or break it into chapters, then tidy the order with the organize tool for smaller, manageable files. Everything runs in your browser.', ja: '大きなPDFは丸ごと扱うのが不便です。分割ツールで必要なページ範囲を別PDFに取り出したり章単位に分けたりし、整理ツールで順番を整えれば、小さく扱いやすいファイルになります。すべてブラウザ内で処理されます。', zh: '大 PDF 整个处理起来很不方便。用拆分工具把需要的页面范围提取成单独的 PDF，或按章节拆开，再用整理工具理顺顺序，就能得到小而好管理的文件。所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/pdf/split',
        name: { ko: '페이지 범위·챕터로 분할', en: 'Split by range or chapter', ja: 'ページ範囲・章で分割', zh: '按页面范围或章节拆分' },
        text: { ko: '원하는 페이지 범위를 별도 PDF로 추출하거나 여러 파일로 쪼갭니다.', en: 'Extract a page range into its own PDF or break it into several files.', ja: '必要なページ範囲を別PDFに取り出したり、複数ファイルに分けたりします。', zh: '把需要的页面范围提取成单独的 PDF，或拆成多个文件。' },
      },
      {
        href: '/tools/pdf/organize',
        name: { ko: '페이지 순서 정리', en: 'Tidy the page order', ja: 'ページ順を整える', zh: '整理页面顺序' },
        text: { ko: '썸네일로 페이지를 재정렬·삭제해 마무리합니다.', en: 'Reorder or delete pages with thumbnails to finish.', ja: 'サムネイルを見ながらページを並べ替え・削除して仕上げます。', zh: '对照缩略图重新排列、删除页面来收尾。' },
      },
    ],
    relatedCompares: ['merge-vs-split-pdf'],
    faqs: [
      {
        q: { ko: '특정 페이지만 빼낼 수 있나요?', en: 'Can I pull out just specific pages?', ja: '特定のページだけ取り出せますか？', zh: '可以只取出特定页面吗？' },
        a: { ko: '네. 페이지 범위를 지정해 그 부분만 새 PDF로 추출할 수 있습니다.', en: 'Yes. Specify a page range to extract just that part into a new PDF.', ja: 'はい。ページ範囲を指定して、その部分だけ新しいPDFに取り出せます。', zh: '可以。指定页面范围，只把那部分提取成新的 PDF。' },
      },
      {
        q: { ko: '나누면 화질이 떨어지나요?', en: 'Does splitting reduce quality?', ja: '分割すると画質は落ちますか？', zh: '拆分会降低画质吗？' },
        a: { ko: '아니요. 기존 페이지를 재인코딩 없이 다루므로 텍스트·이미지가 원본 그대로입니다.', en: 'No. It handles existing pages without re-encoding, so text and images stay original.', ja: 'いいえ。既存のページを再エンコードせず扱うため、テキストも画像も元のままです。', zh: '不会。它不重新编码现有页面，所以文字和图片都保持原样。' },
      },
    ],
    keywords: {
      ko: ['pdf 나누기', 'pdf 분할', 'pdf 페이지 추출', 'pdf 챕터 분리'],
      en: ['split pdf', 'extract pdf pages', 'divide pdf', 'pdf into chapters'], ja: ['pdf 分割', 'pdf ページ 抽出', 'pdf 章 分割', 'pdf 分ける'], zh: ['pdf 拆分', 'pdf 页面 提取', 'pdf 章节 拆分', 'pdf 分割'],
    },
  },
  {
    slug: 'clean-up-podcast-audio',
    category: 'audio',
    title: { ko: '팟캐스트·녹음 음성 다듬기', en: 'Clean Up Podcast / Recorded Audio', ja: 'ポッドキャスト・録音音声を整える', zh: '整理播客・录音音频' },
    h1: { ko: '녹음 음성 정리', en: 'Clean up recorded audio', ja: '録音音声を整える', zh: '整理录音音频' },
    description: {
      ko: '녹음에서 무음 구간을 자동으로 잘라내고 볼륨을 고르게 맞춘 뒤 용량을 줄이세요. 업로드 없이 브라우저에서.',
      en: 'Auto-cut silent gaps, even out the volume, then shrink the file of a recording. In your browser, no upload.', ja: '録音の無音区間を自動でカットし、音量を均一にして容量も縮小。ブラウザ内で、アップロードなし。', zh: '自动剪掉录音中的静音段，把音量调均匀后再减小体积。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '말소리 녹음은 세 단계로 깔끔해집니다. 말 없는 긴 구간을 자동으로 잘라 늘어짐을 없애고, 볼륨을 일정하게 맞추거나 라우드니스를 정규화한 뒤, 비트레이트를 낮춰 공유하기 좋은 용량으로 줄입니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'A spoken recording cleans up in three steps: auto-cut long silent gaps to tighten it, even out or normalize the loudness, then lower the bitrate for a share-friendly size. Everything runs in your browser.', ja: '話し声の録音は3ステップできれいになります。無音の長い区間を自動でカットして締まりを出し、音量を均一化またはラウドネスを正規化し、ビットレートを下げて共有しやすい容量にします。すべてブラウザ内で処理されます。', zh: '说话录音三步就能整理干净。自动剪掉没说话的长静音段让节奏紧凑，把音量调均匀或对响度做标准化，再降低比特率减小到方便分享的体积。所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/audio/silence-trim',
        name: { ko: '무음 자동 제거', en: 'Auto-remove silence', ja: '無音を自動削除', zh: '自动去除静音' },
        text: { ko: '말 없는 긴 구간을 자동으로 잘라냅니다.', en: 'Automatically cut long silent gaps.', ja: '話していない長い区間を自動で切り取ります。', zh: '自动剪掉没说话的长静音段。' },
      },
      {
        href: '/tools/audio/volume',
        name: { ko: '볼륨·라우드니스 정규화', en: 'Normalize loudness', ja: '音量・ラウドネスを正規化', zh: '音量・响度标准化' },
        text: { ko: 'dB로 볼륨을 조정하거나 LUFS 라우드니스로 정규화합니다.', en: 'Adjust volume in dB or normalize to a LUFS target.', ja: 'dBで音量を調整したり、LUFSのラウドネスに正規化したりします。', zh: '用 dB 调整音量，或按 LUFS 响度进行标准化。' },
      },
      {
        href: '/tools/audio/compress',
        name: { ko: '용량 줄이기', en: 'Shrink the file', ja: '容量を縮小', zh: '减小体积' },
        text: { ko: '비트레이트를 낮춰 공유하기 좋은 용량으로 만듭니다.', en: 'Lower the bitrate for a share-friendly size.', ja: 'ビットレートを下げて共有しやすい容量にします。', zh: '降低比特率，做成方便分享的体积。' },
      },
    ],
    relatedConverts: ['wav-to-mp3', 'm4a-to-mp3'],
    relatedCompares: ['mp3-vs-wav'],
    faqs: [
      {
        q: { ko: '무음 제거로 말이 잘리진 않나요?', en: 'Will silence removal cut into speech?', ja: '無音削除で話し声まで切れませんか？', zh: '去除静音会不会把说话也剪掉？' },
        a: { ko: '임계값을 조절해 자연스러운 숨소리는 남기고 긴 공백만 줄일 수 있습니다.', en: 'Tune the threshold to keep natural breaths while trimming only long gaps.', ja: 'しきい値を調整すれば、自然な息づかいは残しつつ長い空白だけを削れます。', zh: '调整阈值就能保留自然的呼吸声，只削掉长时间的空白。' },
      },
      {
        q: { ko: '라우드니스 정규화가 왜 필요한가요?', en: 'Why normalize loudness?', ja: 'ラウドネス正規化はなぜ必要ですか？', zh: '为什么需要响度标准化？' },
        a: { ko: '구간별 볼륨 편차를 줄여 듣는 사람이 볼륨을 계속 조절하지 않아도 되게 합니다.', en: 'It evens out volume swings so listeners aren’t constantly adjusting the level.', ja: '区間ごとの音量差をならし、聞く人が音量を調整し続けずに済むようにします。', zh: '它能拉平各段之间的音量差异，让听众不用一直调整音量。' },
      },
    ],
    keywords: {
      ko: ['팟캐스트 음성 정리', '녹음 무음 제거', '오디오 볼륨 정규화', '음성 압축'],
      en: ['clean podcast audio', 'remove silence', 'normalize audio', 'podcast cleanup'], ja: ['ポッドキャスト 音声 整える', '無音 削除', '音量 正規化', '音声 圧縮'], zh: ['播客 音频 整理', '去除 静音', '音量 标准化', '音频 压缩'],
    },
  },
  {
    slug: 'convert-spreadsheet-formats',
    category: 'docs',
    title: { ko: '엑셀·CSV·JSON 자유 변환', en: 'Convert Between Excel, CSV and JSON', ja: 'Excel・CSV・JSONを自由に変換', zh: 'Excel・CSV・JSON 自由互转' },
    h1: { ko: '스프레드시트 포맷 변환', en: 'Convert spreadsheet formats', ja: '表計算フォーマットを変換', zh: '转换表格格式' },
    description: {
      ko: '엑셀(XLSX)·CSV·JSON 사이를 자유롭게 변환하세요. 시트 선택부터 프로그램용 JSON까지, 업로드 없이 브라우저에서.',
      en: 'Convert freely between Excel (XLSX), CSV and JSON — pick a sheet, get program-friendly JSON. In your browser, no upload.', ja: 'Excel(XLSX)・CSV・JSONの間を自由に変換。シート選択からプログラム向けJSONまで、ブラウザ内で、アップロードなし。', zh: '在 Excel(XLSX)、CSV、JSON 之间自由转换。从选择工作表到生成程序用的 JSON，浏览器中完成，无需上传。',
    },
    intro: {
      ko: '표 데이터는 쓰임에 따라 포맷이 다릅니다. 엑셀은 사람이 보기 좋고, CSV는 어디서나 가져오기 좋고, JSON은 프로그램이 쓰기 좋습니다. 엑셀에서 원하는 시트를 골라 CSV·JSON으로 변환하거나, CSV를 다시 JSON으로 바꿔 API·코드에 넣으세요. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'Tabular data needs different formats for different jobs: Excel for people, CSV for importing anywhere, JSON for programs. Pick a sheet from Excel and convert it to CSV/JSON, or turn a CSV into JSON for an API or code. Everything runs in your browser.', ja: '表データは用途ごとに適した形式が違います。Excelは人が見やすく、CSVはどこへでも取り込みやすく、JSONはプログラムで扱いやすい形式です。Excelから好きなシートを選んでCSV・JSONに変換したり、CSVをJSONにしてAPIやコードに渡したりできます。すべてブラウザ内で処理されます。', zh: '表格数据按用途适合的格式各不相同。Excel 适合人看，CSV 适合到处导入，JSON 适合程序使用。从 Excel 选择想要的工作表转成 CSV、JSON，或把 CSV 转成 JSON 放进 API、代码里。所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/docs/xlsx-convert',
        name: { ko: 'XLSX ↔ CSV ↔ JSON', en: 'XLSX ↔ CSV ↔ JSON', ja: 'XLSX ↔ CSV ↔ JSON', zh: 'XLSX ↔ CSV ↔ JSON' },
        text: { ko: '엑셀에서 시트를 골라 CSV·JSON으로, 또는 그 반대로 변환합니다.', en: 'Pick a sheet from Excel and convert to CSV/JSON, or back.', ja: 'Excelからシートを選んでCSV・JSONに、またはその逆に変換します。', zh: '从 Excel 选择工作表转成 CSV、JSON，或反过来转换。' },
      },
      {
        href: '/tools/docs/csv-json',
        name: { ko: 'CSV ↔ JSON 정밀 변환', en: 'Fine CSV ↔ JSON', ja: 'CSV ↔ JSON 精密変換', zh: 'CSV ↔ JSON 精确转换' },
        text: { ko: 'CSV를 프로그램에서 쓰기 좋은 JSON으로(또는 반대로) 변환합니다.', en: 'Convert CSV into program-friendly JSON (or back).', ja: 'CSVをプログラムで扱いやすいJSONに(または逆に)変換します。', zh: '把 CSV 转成便于程序使用的 JSON(或反向转换)。' },
      },
    ],
    relatedConverts: ['csv-to-xlsx', 'xlsx-to-csv', 'csv-to-json'],
    relatedCompares: ['xlsx-vs-csv', 'csv-vs-json'],
    faqs: [
      {
        q: { ko: '여러 시트 중 하나만 변환할 수 있나요?', en: 'Can I convert just one of several sheets?', ja: '複数シートのうち1つだけ変換できますか？', zh: '可以只转换多个工作表中的一个吗？' },
        a: { ko: '네. 엑셀 변환기에서 원하는 시트를 골라 변환할 수 있습니다.', en: 'Yes. The Excel converter lets you select which sheet to convert.', ja: 'はい。Excel変換ツールで変換するシートを選べます。', zh: '可以。在 Excel 转换工具中可以选择要转换的工作表。' },
      },
      {
        q: { ko: 'CSV를 JSON으로 바꾸면 구조가 어떻게 되나요?', en: 'How is a CSV structured as JSON?', ja: 'CSVをJSONにすると構造はどうなりますか？', zh: 'CSV 转成 JSON 后是什么结构？' },
        a: { ko: '각 행이 헤더를 키로 갖는 객체가 됩니다. 중첩이 필요하면 변환 후 가공하세요.', en: 'Each row becomes an object keyed by the header. Post-process if you need nesting.', ja: '各行がヘッダーをキーに持つオブジェクトになります。入れ子が必要なら変換後に加工してください。', zh: '每一行会变成以表头为键的对象。需要嵌套结构的话，请在转换后再加工。' },
      },
    ],
    keywords: {
      ko: ['엑셀 csv 변환', 'xlsx json 변환', 'csv json 변환', '스프레드시트 변환'],
      en: ['excel to csv', 'xlsx to json', 'csv to json', 'convert spreadsheet'], ja: ['excel csv 変換', 'xlsx json 変換', 'csv json 変換', '表計算 変換'], zh: ['excel csv 转换', 'xlsx json 转换', 'csv json 转换', '表格 转换'],
    },
  },
  {
    slug: 'fix-and-convert-subtitles',
    category: 'video',
    title: { ko: '자막 싱크 맞추고 포맷 변환·굽기', en: 'Fix Subtitle Timing, Convert & Burn In', ja: '字幕の時間補正・変換・焼き込み', zh: '校正字幕时间、转换格式并烧录' },
    h1: { ko: '자막 정리·변환·굽기', en: 'Fix, convert & burn subtitles', ja: '字幕の補正・変換・焼き込み', zh: '字幕校正・转换・烧录' },
    description: {
      ko: '어긋난 자막 시간을 일괄 보정하고 플랫폼에 맞는 포맷으로 바꾼 뒤, 필요하면 영상에 영구로 구우세요. 업로드 없이 브라우저에서.',
      en: 'Bulk-fix shifted subtitle timings, convert to the right format, then optionally burn them into the video. In your browser, no upload.', ja: 'ずれた字幕の時間を一括補正し、必要な形式に変換して、任意で動画に焼き込み。ブラウザ内で、アップロードなし。', zh: '批量校正错位的字幕时间，转成符合平台的格式，需要的话再永久烧录进视频。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '자막은 시간 어긋남과 포맷 호환이 흔한 문제입니다. 편집 도구로 전체 자막의 시간을 일괄 보정하고, 플랫폼이 요구하는 포맷(SRT·VTT·ASS·LRC)으로 변환한 뒤, 자막을 영상에 영구로 굽고 싶으면 마지막 단계에서 결합합니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'Subtitles commonly suffer from timing drift and format mismatches. Bulk-shift all cues with the editor, convert to the format a platform needs (SRT/VTT/ASS/LRC), then burn them permanently into the video as a final step if you want. Everything runs in your browser.', ja: '字幕は時間のずれと形式の不一致がよくある問題です。編集ツールで全字幕の時間を一括補正し、プラットフォームが求める形式(SRT・VTT・ASS・LRC)に変換し、字幕を動画に永久に焼き込みたい場合は最後の手順で結合します。すべてブラウザ内で処理されます。', zh: '字幕常遇到时间错位和格式不兼容的问题。用编辑工具批量校正所有字幕的时间，转成平台要求的格式(SRT、VTT、ASS、LRC)，如果想把字幕永久烧录进视频，就在最后一步合并。所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/text/subtitle-edit',
        name: { ko: '시간 일괄 보정·편집', en: 'Bulk re-time & edit', ja: '時間を一括補正・編集', zh: '批量校正时间・编辑' },
        text: { ko: '어긋난 자막 시간을 일괄로 당기거나 밀고 텍스트를 다듬습니다.', en: 'Shift all cues earlier/later in bulk and tidy the text.', ja: 'ずれた字幕の時間を一括で前後にずらし、テキストを整えます。', zh: '把错位的字幕时间整体前移或后移，并整理文字。' },
      },
      {
        href: '/tools/text/subtitle-convert',
        name: { ko: '포맷 변환', en: 'Convert format', ja: '形式を変換', zh: '转换格式' },
        text: { ko: 'SRT ↔ VTT ↔ ASS ↔ LRC ↔ TXT 로 변환합니다.', en: 'Convert between SRT, VTT, ASS, LRC and TXT.', ja: 'SRT・VTT・ASS・LRC・TXTの間で変換します。', zh: '在 SRT ↔ VTT ↔ ASS ↔ LRC ↔ TXT 之间转换。' },
      },
      {
        href: '/tools/video/burn-subtitle',
        name: { ko: '영상에 자막 굽기(선택)', en: 'Burn into video (optional)', ja: '動画に字幕を焼き込む(任意)', zh: '把字幕烧录进视频(可选)' },
        text: { ko: '자막을 영상에 영구로 결합해 어디서나 보이게 합니다.', en: 'Permanently embed the subtitles so they always show.', ja: '字幕を動画に永久に結合し、常に表示されるようにします。', zh: '把字幕永久合并进视频，让它始终显示。' },
      },
    ],
    relatedCompares: ['mp4-vs-webm'],
    faqs: [
      {
        q: { ko: '자막이 영상보다 빠르거나 느려요.', en: 'My subtitles are ahead of or behind the video.', ja: '字幕が動画より早い・遅いです。', zh: '字幕比视频快或慢。' },
        a: { ko: '편집 도구에서 전체 자막을 한꺼번에 +/− 초만큼 이동해 싱크를 맞출 수 있습니다.', en: 'Shift every cue by +/− seconds at once in the editor to re-sync.', ja: '編集ツールで全字幕を一括で±秒だけずらして同期を合わせられます。', zh: '在编辑工具中把所有字幕一次性 +/− 若干秒，即可对齐同步。' },
      },
      {
        q: { ko: '구운 자막은 끌 수 있나요?', en: 'Can burned-in subtitles be turned off?', ja: '焼き込んだ字幕は消せますか？', zh: '烧录的字幕能关掉吗？' },
        a: { ko: '아니요. 영상에 영구 결합되므로, 켜고 끄려면 별도 자막 파일로 두세요.', en: 'No. They’re permanent. Keep a separate subtitle file if you need them toggleable.', ja: 'いいえ。動画に永久に結合されます。切り替えたい場合は字幕ファイルを別に保管してください。', zh: '不能。它永久合并在视频里，需要切换的话请单独保留字幕文件。' },
      },
    ],
    keywords: {
      ko: ['자막 싱크', '자막 시간 보정', '자막 변환', '자막 굽기'],
      en: ['fix subtitle timing', 'subtitle sync', 'convert subtitles', 'burn subtitles'], ja: ['字幕 同期', '字幕 時間 補正', '字幕 変換', '字幕 焼き込み'], zh: ['字幕 同步', '字幕 时间 校正', '字幕 转换', '字幕 烧录'],
    },
  },
  {
    slug: 'make-animated-sticker',
    category: 'gif',
    title: { ko: '움직이는 스티커 만들기', en: 'Make an Animated Sticker', ja: '動くスタンプを作成', zh: '制作动态贴纸' },
    h1: { ko: '애니메이션 스티커', en: 'Animated sticker', ja: 'アニメーションスタンプ', zh: '动态贴纸' },
    description: {
      ko: '영상 한 구간을 GIF로 만들고 스티커 크기로 줄인 뒤 용량을 최적화하세요. 업로드 없이 브라우저에서.',
      en: 'Turn a clip into a GIF, scale it to sticker size, then optimize the file. In your browser, no upload.', ja: '動画の区間をGIFにし、スタンプサイズに縮小して容量を最適化。ブラウザ内で、アップロードなし。', zh: '把视频的一段做成 GIF，缩到贴纸尺寸，再优化体积。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '움직이는 스티커는 작은 GIF면 충분합니다. 영상에서 짧은 구간을 GIF로 뽑고, 스티커에 맞게 크기를 줄인 뒤, 팔레트·프레임 최적화로 용량을 작게 만들면 메신저·SNS에 올리기 좋습니다. 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'An animated sticker is just a small GIF. Pull a short clip as a GIF, scale it down to sticker size, then optimize the palette and frames to keep it tiny for messengers and social. Everything runs in your browser.', ja: '動くスタンプは小さなGIFで十分です。動画から短い区間をGIFで取り出し、スタンプ向けにサイズを縮め、パレットとフレームを最適化して容量を小さくすれば、メッセンジャーやSNSに載せやすくなります。すべてブラウザ内で処理されます。', zh: '动态贴纸只要一个小 GIF 就够了。从视频取出短片段做成 GIF，按贴纸尺寸缩小，再通过调色板、帧优化把体积压小，就方便发到即时通讯和社交平台。所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/video/to-gif',
        name: { ko: '영상 → GIF', en: 'Clip → GIF', ja: '区間→GIF', zh: '片段→GIF' },
        text: { ko: '영상에서 짧은 구간을 골라 GIF로 변환합니다.', en: 'Pick a short section of a video and convert it to GIF.', ja: '動画から短い区間を選んでGIFに変換します。', zh: '从视频中选一小段，转成 GIF。' },
      },
      {
        href: '/tools/gif/resize',
        name: { ko: '스티커 크기로 줄이기', en: 'Scale to sticker size', ja: 'スタンプサイズに縮小', zh: '缩到贴纸尺寸' },
        text: { ko: 'GIF 크기를 스티커에 맞게 줄입니다.', en: 'Resize the GIF down to sticker dimensions.', ja: 'GIFのサイズをスタンプに合わせて縮めます。', zh: '把 GIF 尺寸缩到贴纸大小。' },
      },
      {
        href: '/tools/gif/optimize',
        name: { ko: '용량 최적화', en: 'Optimize the file', ja: '容量を最適化', zh: '优化体积' },
        text: { ko: '팔레트·프레임을 최적화해 용량을 작게 만듭니다.', en: 'Optimize palette and frames to keep it small.', ja: 'パレットとフレームを最適化して容量を小さくします。', zh: '优化调色板和帧，把体积压小。' },
      },
    ],
    relatedConverts: ['mp4-to-gif', 'gif-to-webp'],
    relatedCompares: ['gif-vs-mp4'],
    faqs: [
      {
        q: { ko: '스티커 용량 제한에 맞추려면?', en: 'How to fit a sticker size limit?', ja: 'スタンプの容量制限に収めるには？', zh: '怎样符合贴纸的大小限制？' },
        a: { ko: '크기를 더 줄이고 프레임 수·색을 낮추세요. 길이를 짧게 자르는 것도 효과적입니다.', en: 'Scale down further and lower frame count/colors; trimming the length helps too.', ja: 'さらにサイズを縮め、フレーム数・色数を下げてください。長さを短く切るのも効果的です。', zh: '进一步缩小尺寸，降低帧数和色数。把时长剪短也很有效。' },
      },
      {
        q: { ko: '투명 배경 스티커도 되나요?', en: 'Can I make transparent stickers?', ja: '透明背景のスタンプも作れますか？', zh: '可以做透明背景的贴纸吗？' },
        a: { ko: 'GIF는 단순 투명만 지원합니다. 더 깔끔한 투명이 필요하면 WebP로 변환하세요.', en: 'GIF supports only simple transparency. Convert to WebP for cleaner transparency.', ja: 'GIFは単純な透明のみ対応です。よりきれいな透明が必要ならWebPに変換してください。', zh: 'GIF 只支持简单透明。需要更干净的透明效果请转成 WebP。' },
      },
    ],
    keywords: {
      ko: ['움직이는 스티커', 'gif 스티커', '애니메이션 스티커', 'gif 만들기'],
      en: ['animated sticker', 'gif sticker', 'make sticker gif', 'create animated sticker'], ja: ['動く スタンプ', 'gif スタンプ', 'アニメ スタンプ 作成', 'gif 作成'], zh: ['动态 贴纸', 'gif 贴纸', '动画 贴纸 制作', 'gif 制作'],
    },
  },
  {
    slug: 'extract-images-from-documents',
    category: 'pdf',
    title: { ko: 'PDF·전자책에서 이미지 추출하기', en: 'Extract Images from PDFs & E-books', ja: 'PDF・電子書籍から画像を抽出', zh: '从 PDF・电子书提取图片' },
    h1: { ko: '문서에서 이미지 추출', en: 'Extract images from documents', ja: '文書から画像を抽出', zh: '从文档提取图片' },
    description: {
      ko: 'PDF나 EPUB 안에 박힌 사진·삽화를 원본 그대로 꺼내 ZIP으로 받으세요. 업로드 없이 브라우저에서.',
      en: 'Pull the photos and illustrations embedded in a PDF or EPUB and download them as a ZIP. In your browser, no upload.', ja: 'PDFやEPUBに埋め込まれた写真・挿絵を元のまま取り出してZIPでダウンロード。ブラウザ内で、アップロードなし。', zh: '把 PDF 或 EPUB 中嵌入的照片、插图原样取出，打包成 ZIP 下载。浏览器中完成，无需上传。',
    },
    intro: {
      ko: '문서에 들어 있는 이미지를 일일이 캡처할 필요가 없습니다. PDF면 페이지에 삽입된 이미지를 PNG로, EPUB이면 표지·삽화를 통째로 꺼내 ZIP으로 받을 수 있습니다. 원본 화질 그대로 추출되며, 모든 처리는 브라우저 안에서 끝납니다.',
      en: 'No need to screenshot images one by one. For a PDF, extract the embedded images as PNGs; for an EPUB, pull the cover and illustrations into a ZIP. They come out at original quality, and everything runs in your browser.', ja: '文書の中の画像を一枚ずつスクショする必要はありません。PDFならページに埋め込まれた画像をPNGで、EPUBなら表紙・挿絵をまとめてZIPで取り出せます。元の画質のまま抽出され、すべてブラウザ内で処理されます。', zh: '不用一张张地把文档里的图片截图下来。PDF 可以把页面中嵌入的图片提取成 PNG，EPUB 可以把封面、插图整体取出打包成 ZIP。提取后保持原画质，所有处理都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/pdf/image-extract',
        name: { ko: 'PDF 이미지 추출', en: 'Extract PDF images', ja: 'PDFの画像を抽出', zh: '提取 PDF 图片' },
        text: { ko: 'PDF 페이지에 삽입된 이미지를 PNG로 추출해 ZIP으로 받습니다.', en: 'Extract images embedded in PDF pages as PNGs in a ZIP.', ja: 'PDFのページに埋め込まれた画像をPNGで抽出し、ZIPで受け取ります。', zh: '把 PDF 页面中嵌入的图片提取成 PNG，打包成 ZIP。' },
      },
      {
        href: '/tools/docs/epub-images-extract',
        name: { ko: 'EPUB 이미지 추출', en: 'Extract EPUB images', ja: 'EPUBの画像を抽出', zh: '提取 EPUB 图片' },
        text: { ko: 'EPUB 안의 표지·삽화를 모두 꺼내 ZIP으로 받습니다.', en: 'Pull every cover and illustration from an EPUB into a ZIP.', ja: 'EPUB内の表紙・挿絵をすべて取り出してZIPで受け取ります。', zh: '把 EPUB 中的封面、插图全部取出，打包成 ZIP。' },
      },
    ],
    relatedConverts: ['pdf-to-jpg'],
    faqs: [
      {
        q: { ko: '원본 화질 그대로 나오나요?', en: 'Do images come out at original quality?', ja: '元の画質のまま出てきますか？', zh: '会保持原画质吗？' },
        a: { ko: '네. 문서에 저장된 이미지를 재인코딩 없이 그대로 꺼냅니다.', en: 'Yes. The stored images are extracted as-is, without re-encoding.', ja: 'はい。文書に保存された画像を再エンコードせずそのまま取り出します。', zh: '会。把文档中保存的图片不重新编码、原样取出。' },
      },
      {
        q: { ko: '스캔 이미지 PDF도 되나요?', en: 'What about scanned image PDFs?', ja: 'スキャン画像のPDFも使えますか？', zh: '扫描成图片的 PDF 也行吗？' },
        a: { ko: '페이지 자체가 이미지라면 PDF→이미지(페이지 렌더) 도구가 더 적합할 수 있습니다.', en: 'If pages are themselves images, the PDF-to-image (page render) tool may suit better.', ja: 'ページ自体が画像なら、PDF→画像(ページ描画)ツールの方が適していることがあります。', zh: '如果页面本身就是图片，用 PDF→图片(页面渲染)工具可能更合适。' },
      },
    ],
    keywords: {
      ko: ['pdf 이미지 추출', 'epub 이미지 추출', '문서 이미지 꺼내기', '전자책 삽화 추출'],
      en: ['extract images from pdf', 'extract epub images', 'get images from document', 'pdf image extractor'], ja: ['pdf 画像 抽出', 'epub 画像 抽出', '文書 画像 取り出し', '電子書籍 挿絵 抽出'], zh: ['pdf 图片 提取', 'epub 图片 提取', '文档 图片 取出', '电子书 插图 提取'],
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

/** 특정 변환 slug 를 relatedConverts 로 참조하는 유스케이스 (변환 → 유스케이스 역링크). */
export function useCasesForConvert(convertSlug: string): UseCase[] {
  return USE_CASES.filter((u) => u.relatedConverts?.includes(convertSlug));
}

/** 특정 비교 slug 를 relatedCompares 로 참조하는 유스케이스 (비교 → 유스케이스 역링크). */
export function useCasesForCompare(compareSlug: string): UseCase[] {
  return USE_CASES.filter((u) => u.relatedCompares?.includes(compareSlug));
}

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
  {
    slug: 'prepare-page-seo-tags',
    category: 'dev',
    title: { ko: '웹페이지 SEO 메타 태그와 크롤 규칙 준비', en: 'Prepare a Page’s SEO Meta Tags & Crawl Rules', ja: 'ページのSEOメタタグとクロール規則を準備', zh: '准备网页的 SEO 元标签与抓取规则' },
    h1: { ko: '페이지 SEO 태그 준비하기', en: 'Prepare a page’s SEO tags', ja: 'ページのSEOタグを準備', zh: '准备网页的 SEO 标签' },
    description: {
      ko: '페이지의 Open Graph·메타 태그를 만들고 robots.txt로 크롤 규칙까지 정리하세요. 코드 한 벌이면 검색·공유 미리보기가 깔끔해집니다.',
      en: 'Generate a page’s Open Graph and meta tags, then set crawl rules with robots.txt. One block of code makes search and share previews clean.', ja: 'ページのOpen Graph・メタタグを作り、robots.txtでクロール規則まで整えます。コード一式で検索・共有プレビューがきれいになります。', zh: '生成网页的 Open Graph 与元标签，再用 robots.txt 设定抓取规则。一套代码让搜索和分享预览更整洁。',
    },
    intro: {
      ko: '검색 노출과 SNS 공유 미리보기는 페이지 <head>의 메타 태그가 좌우합니다. 제목·설명·OG 이미지를 채워 태그를 생성하고, robots.txt로 크롤러가 어디를 보고 어디를 건너뛸지 정하면 됩니다. 모든 생성이 브라우저에서 처리돼 입력값이 서버로 전송되지 않습니다.',
      en: 'Search snippets and social share previews are driven by the meta tags in a page’s <head>. Fill in the title, description and OG image to generate the tags, then use robots.txt to tell crawlers what to read and what to skip. Everything is generated in your browser, so your inputs are never sent to a server.', ja: '検索結果やSNS共有プレビューは、ページの<head>にあるメタタグで決まります。タイトル・説明・OG画像を入力してタグを生成し、robots.txtでクローラーが見る場所と飛ばす場所を指定します。すべてブラウザ内で生成されるため、入力内容がサーバーに送られることはありません。', zh: '搜索摘要和社交分享预览由页面 <head> 中的元标签决定。填入标题、描述和 OG 图片来生成标签，再用 robots.txt 告诉爬虫该读哪里、跳过哪里。所有生成都在浏览器中完成，输入内容不会发送到服务器。',
    },
    steps: [
      {
        href: '/tools/dev/meta-tags',
        name: { ko: 'Open Graph·메타 태그 생성', en: 'Generate Open Graph & meta tags', ja: 'Open Graph・メタタグを生成', zh: '生成 Open Graph 与元标签' },
        text: {
          ko: '제목·설명·OG 이미지·트위터 카드를 입력하면 <head>에 붙여넣을 태그가 만들어집니다.',
          en: 'Enter the title, description, OG image and Twitter card to get tags you can paste into <head>.', ja: 'タイトル・説明・OG画像・Twitterカードを入力すると、<head>に貼り付けるタグが生成されます。', zh: '输入标题、描述、OG 图片和 Twitter 卡片，即可得到可粘贴进 <head> 的标签。',
        },
      },
      {
        href: '/tools/dev/robots-txt',
        name: { ko: 'robots.txt 크롤 규칙 작성', en: 'Build robots.txt crawl rules', ja: 'robots.txtのクロール規則を作成', zh: '编写 robots.txt 抓取规则' },
        text: {
          ko: 'Allow·Disallow와 사이트맵 경로를 지정해 robots.txt를 만듭니다.',
          en: 'Set Allow/Disallow paths and your sitemap URL to build robots.txt.', ja: 'Allow・Disallowとサイトマップのパスを指定してrobots.txtを作成します。', zh: '设定 Allow/Disallow 路径与站点地图地址来生成 robots.txt。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: 'OG 이미지는 어떤 크기가 좋나요?', en: 'What size should the OG image be?', ja: 'OG画像はどのサイズが良いですか？', zh: 'OG 图片用什么尺寸好？' },
        a: {
          ko: '가로형 1200×630이 가장 무난합니다. 대부분의 SNS가 이 비율로 미리보기를 보여줍니다.',
          en: 'A landscape 1200×630 is the safest choice — most networks preview at that ratio.', ja: '横長の1200×630が無難です。多くのSNSがこの比率でプレビューを表示します。', zh: '横版 1200×630 最稳妥，大多数社交平台都按这个比例显示预览。',
        },
      },
      {
        q: { ko: 'robots.txt로 페이지를 확실히 숨길 수 있나요?', en: 'Does robots.txt fully hide a page?', ja: 'robots.txtでページを確実に隠せますか？', zh: 'robots.txt 能彻底隐藏页面吗？' },
        a: {
          ko: 'robots.txt는 크롤 요청만 막습니다. 색인에서 완전히 빼려면 noindex 메타 태그를 함께 쓰세요.',
          en: 'robots.txt only blocks crawling. To keep a page out of the index entirely, also add a noindex meta tag.', ja: 'robots.txtはクロールを止めるだけです。インデックスから完全に外すにはnoindexメタタグも併用してください。', zh: 'robots.txt 只阻止抓取。要彻底不被收录，请同时加上 noindex 元标签。',
        },
      },
    ],
    keywords: {
      ko: ['메타 태그 생성', 'open graph 태그', 'robots.txt 만들기', 'seo 태그', '검색 미리보기'],
      en: ['meta tag generator', 'open graph tags', 'robots.txt generator', 'seo meta tags', 'social preview'], ja: ['メタタグ 生成', 'open graph タグ', 'robots.txt 作成', 'seo タグ', '検索 プレビュー'], zh: ['元标签 生成', 'open graph 标签', 'robots.txt 生成', 'seo 标签', '搜索 预览'],
    },
  },
  {
    slug: 'build-responsive-design-system',
    category: 'dev',
    title: { ko: 'CSS 반응형 크기·색상 시스템 만들기', en: 'Build a Responsive Sizing & Color System', ja: 'CSSのレスポンシブなサイズ・カラー体系を作成', zh: '构建响应式尺寸与配色系统' },
    h1: { ko: '반응형 디자인 시스템 만들기', en: 'Build a responsive design system', ja: 'レスポンシブなデザイン体系を作成', zh: '构建响应式设计系统' },
    description: {
      ko: '50–950 색상 스케일, 유동적인 clamp() 크기, px·rem·em 변환까지 한 흐름으로 CSS 디자인 시스템을 갖추세요.',
      en: 'Build a CSS design system in one flow: a 50–950 color scale, fluid clamp() sizes and px/rem/em conversions.', ja: '50–950のカラースケール、流動的なclamp()サイズ、px・rem・em変換まで、一つの流れでCSSデザイン体系を整えます。', zh: '一气呵成搭建 CSS 设计系统：50–950 配色梯度、流动的 clamp() 尺寸，以及 px/rem/em 换算。',
    },
    intro: {
      ko: '일관된 UI는 색상 단계와 간격 규칙에서 시작됩니다. 브랜드 색 하나로 50부터 950까지 명도 단계를 뽑고, 화면 폭에 따라 부드럽게 커지는 clamp() 크기를 만든 뒤, 단위를 px·rem·em으로 자유롭게 변환하면 됩니다. 모든 계산이 브라우저에서 즉시 처리됩니다.',
      en: 'A consistent UI starts with a color ramp and spacing rules. Generate a 50-to-950 brightness scale from one brand color, make clamp() sizes that grow smoothly with the viewport, then convert freely between px, rem and em. Every calculation happens instantly in your browser.', ja: '一貫したUIは、カラーの段階と余白のルールから始まります。ブランドカラー1つから50〜950の明度段階を作り、画面幅に応じてなめらかに変わるclamp()サイズを生成し、単位をpx・rem・emで自由に変換します。すべての計算はブラウザ内で即座に行われます。', zh: '一致的界面始于配色梯度与间距规则。用一个品牌色生成 50 到 950 的明度梯度，做出随视口平滑变化的 clamp() 尺寸，再在 px、rem、em 之间自由换算。所有计算都在浏览器中即时完成。',
    },
    steps: [
      {
        href: '/tools/dev/tailwind-shades',
        name: { ko: '50–950 색상 스케일 생성', en: 'Generate a 50–950 color scale', ja: '50–950のカラースケールを生成', zh: '生成 50–950 配色梯度' },
        text: {
          ko: '브랜드 색을 입력해 Tailwind식 50–950 명도 단계를 뽑습니다.',
          en: 'Enter a brand color to produce a Tailwind-style 50–950 brightness ramp.', ja: 'ブランドカラーを入力してTailwind風の50–950明度段階を作ります。', zh: '输入品牌色，生成 Tailwind 风格的 50–950 明度梯度。',
        },
      },
      {
        href: '/tools/dev/css-clamp',
        name: { ko: '유동적 clamp() 크기 만들기', en: 'Make fluid clamp() sizes', ja: '流動的なclamp()サイズを作成', zh: '制作流动的 clamp() 尺寸' },
        text: {
          ko: '최소·최대값과 뷰포트 범위를 지정해 부드럽게 스케일되는 clamp() 값을 만듭니다.',
          en: 'Set min/max values and a viewport range to get a clamp() value that scales smoothly.', ja: '最小・最大値とビューポート範囲を指定し、なめらかに変化するclamp()値を作ります。', zh: '设定最小/最大值与视口范围，生成平滑缩放的 clamp() 值。',
        },
      },
      {
        href: '/tools/dev/css-units',
        name: { ko: 'px ↔ rem ↔ em 변환', en: 'Convert px ↔ rem ↔ em', ja: 'px ↔ rem ↔ em 変換', zh: 'px ↔ rem ↔ em 换算' },
        text: {
          ko: '루트 폰트 크기를 기준으로 px·rem·em 값을 서로 변환합니다.',
          en: 'Convert between px, rem and em based on your root font size.', ja: 'ルートフォントサイズを基準にpx・rem・em値を相互変換します。', zh: '以根字号为基准，在 px、rem、em 之间相互换算。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: 'clamp()는 미디어 쿼리를 대체하나요?', en: 'Does clamp() replace media queries?', ja: 'clamp()はメディアクエリの代わりになりますか？', zh: 'clamp() 能替代媒体查询吗？' },
        a: {
          ko: '폰트 크기·간격처럼 연속적으로 변하는 값엔 clamp()가 더 간결합니다. 레이아웃 구조 전환은 미디어 쿼리가 여전히 필요합니다.',
          en: 'For continuously scaling values like font size or spacing, clamp() is cleaner. You still need media queries to switch layout structure.', ja: 'フォントサイズや余白のように連続的に変わる値にはclamp()が簡潔です。レイアウト構造の切り替えには依然メディアクエリが必要です。', zh: '对字号、间距这类连续变化的值，clamp() 更简洁。切换布局结构仍然需要媒体查询。',
        },
      },
      {
        q: { ko: 'rem과 em은 무엇이 다른가요?', en: 'What’s the difference between rem and em?', ja: 'remとemは何が違いますか？', zh: 'rem 和 em 有什么区别？' },
        a: {
          ko: 'rem은 루트(html) 폰트 크기, em은 해당 요소의 폰트 크기를 기준으로 합니다. 변환 도구에서 기준 크기를 바꿔 확인할 수 있습니다.',
          en: 'rem is relative to the root (html) font size; em is relative to the element’s own font size. The converter lets you change the base to see both.', ja: 'remはルート(html)のフォントサイズ、emはその要素のフォントサイズが基準です。変換ツールで基準サイズを変えて確認できます。', zh: 'rem 相对根（html）字号，em 相对元素自身字号。在换算工具中可更改基准查看两者。',
        },
      },
    ],
    keywords: {
      ko: ['tailwind 색상 스케일', 'css clamp 생성', 'px rem 변환', '반응형 폰트', '디자인 시스템'],
      en: ['tailwind color scale', 'css clamp generator', 'px to rem', 'fluid typography', 'design system'], ja: ['tailwind カラースケール', 'css clamp 生成', 'px rem 変換', '可変フォント', 'デザインシステム'], zh: ['tailwind 配色梯度', 'css clamp 生成', 'px rem 换算', '流式字体', '设计系统'],
    },
  },
  {
    slug: 'api-json-to-types',
    category: 'dev',
    title: { ko: 'API JSON 응답을 스키마와 타입으로', en: 'Turn an API JSON Response into a Schema & Types', ja: 'APIのJSONレスポンスをスキーマと型に', zh: '把 API JSON 响应转成 Schema 和类型' },
    h1: { ko: 'JSON 응답을 타입으로', en: 'Turn an API response into types', ja: 'JSONレスポンスを型に', zh: '把 JSON 响应转成类型' },
    description: {
      ko: 'API 응답 JSON 한 덩어리에서 JSON Schema를 추론하고 TypeScript 타입까지 뽑아내세요. 손으로 타입 쓰는 수고를 없애줍니다.',
      en: 'Infer a JSON Schema from a sample API response, then generate TypeScript types — no more hand-writing interfaces.', ja: 'APIレスポンスのJSONからJSON Schemaを推論し、TypeScript型まで生成します。型を手書きする手間がなくなります。', zh: '从一段 API 响应 JSON 推断出 JSON Schema，再生成 TypeScript 类型，省去手写接口的工夫。',
    },
    intro: {
      ko: 'API 응답 구조를 코드로 안전하게 다루려면 스키마와 타입이 필요합니다. 실제 응답 샘플을 붙여넣어 JSON Schema(draft-07)를 추론하고, 그 구조에서 TypeScript 인터페이스를 자동 생성하면 됩니다. JSON은 브라우저 안에서만 분석돼 외부로 전송되지 않습니다.',
      en: 'To handle an API response safely in code you need a schema and types. Paste a real sample response to infer a JSON Schema (draft-07), then generate TypeScript interfaces from that shape. The JSON is analyzed only in your browser and never sent anywhere.', ja: 'APIレスポンスをコードで安全に扱うにはスキーマと型が必要です。実際のレスポンス例を貼り付けてJSON Schema(draft-07)を推論し、その構造からTypeScriptのインターフェースを自動生成します。JSONはブラウザ内だけで解析され、外部に送信されません。', zh: '要在代码中安全处理 API 响应，需要 Schema 和类型。粘贴一段真实响应来推断 JSON Schema（draft-07），再据此自动生成 TypeScript 接口。JSON 仅在浏览器中解析，不会发送到任何地方。',
    },
    steps: [
      {
        href: '/tools/dev/json-schema',
        name: { ko: '샘플 JSON에서 스키마 추론', en: 'Infer a JSON Schema from sample JSON', ja: 'サンプルJSONからスキーマを推論', zh: '从示例 JSON 推断 Schema' },
        text: {
          ko: '응답 JSON을 붙여넣으면 필드 타입과 필수 여부를 추론한 JSON Schema가 나옵니다.',
          en: 'Paste the response JSON to get a JSON Schema with inferred field types and required flags.', ja: 'レスポンスJSONを貼り付けると、フィールドの型と必須かどうかを推論したJSON Schemaが得られます。', zh: '粘贴响应 JSON，即可得到推断出字段类型与必填项的 JSON Schema。',
        },
      },
      {
        href: '/tools/dev/json-to-ts',
        name: { ko: 'TypeScript 타입 생성', en: 'Generate TypeScript types', ja: 'TypeScript型を生成', zh: '生成 TypeScript 类型' },
        text: {
          ko: '같은 JSON에서 중첩 객체까지 반영한 TypeScript 인터페이스를 만듭니다.',
          en: 'Generate TypeScript interfaces from the same JSON, including nested objects.', ja: '同じJSONから、ネストしたオブジェクトまで反映したTypeScriptインターフェースを作ります。', zh: '从同一段 JSON 生成包含嵌套对象的 TypeScript 接口。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '중첩된 객체와 배열도 처리되나요?', en: 'Does it handle nested objects and arrays?', ja: 'ネストしたオブジェクトや配列も処理できますか？', zh: '嵌套对象和数组也能处理吗？' },
        a: {
          ko: '네. 중첩 구조를 따라 내려가며 타입을 추론하고, 배열은 요소 타입을 통일해 표현합니다.',
          en: 'Yes. It walks nested structures to infer types and represents arrays by their unified element type.', ja: 'はい。ネスト構造をたどって型を推論し、配列は要素型をまとめて表現します。', zh: '可以。会沿嵌套结构推断类型，并以统一的元素类型表示数组。',
        },
      },
      {
        q: { ko: 'null이나 비어 있는 값은 어떻게 되나요?', en: 'How are null or empty values handled?', ja: 'nullや空の値はどうなりますか？', zh: 'null 或空值如何处理？' },
        a: {
          ko: '샘플에 null이 있으면 해당 필드를 옵셔널·nullable로 표현합니다. 가능하면 값이 채워진 샘플을 쓰면 정확도가 높아집니다.',
          en: 'If the sample contains null, that field is marked optional/nullable. Using a fully populated sample improves accuracy.', ja: 'サンプルにnullがあると、そのフィールドはオプショナル・nullableとして表現されます。値が埋まったサンプルを使うと精度が上がります。', zh: '若示例中含 null，该字段会标记为可选/可空。使用填满值的示例可提高准确度。',
        },
      },
    ],
    keywords: {
      ko: ['json 스키마 추론', 'json to typescript', 'api 타입 생성', 'json 타입 변환', 'typescript 인터페이스'],
      en: ['json schema generator', 'json to typescript', 'api types', 'infer types from json', 'typescript interface'], ja: ['json スキーマ 推論', 'json typescript 変換', 'api 型 生成', 'json 型 変換', 'typescript インターフェース'], zh: ['json schema 推断', 'json 转 typescript', 'api 类型 生成', 'json 类型 转换', 'typescript 接口'],
    },
  },
  {
    slug: 'schedule-cron-job',
    category: 'dev',
    title: { ko: 'cron 스케줄 식 만들고 검증하기', en: 'Build & Verify a Cron Schedule', ja: 'cronスケジュール式を作成して検証', zh: '构建并验证 cron 调度表达式' },
    h1: { ko: 'cron 스케줄 식 만들기', en: 'Build a cron schedule', ja: 'cronスケジュール式を作成', zh: '构建 cron 调度表达式' },
    description: {
      ko: '클릭만으로 cron 식을 조립하고, 그 식이 언제 실행되는지 사람 말로 풀어 확인하세요. 오타로 인한 잘못된 스케줄을 막아줍니다.',
      en: 'Assemble a cron expression by clicking, then read back in plain words exactly when it runs. Catch typos before they break a schedule.', ja: 'クリックだけでcron式を組み立て、その式がいつ実行されるかを言葉で確認します。タイプミスによる誤ったスケジュールを防げます。', zh: '点击即可拼出 cron 表达式，再用人话读出它何时执行，避免因笔误而出错的调度。',
    },
    intro: {
      ko: 'cron 식은 다섯 칸의 의미를 외우기 어려워 실수가 잦습니다. 분·시·일·월·요일을 시각적으로 골라 식을 조립한 뒤, 그 식이 실제로 언제 실행되는지 설명과 다음 실행 시각으로 검증하면 안심입니다. 모든 계산이 브라우저에서 처리됩니다.',
      en: 'Cron expressions are easy to get wrong because the five fields are hard to memorize. Pick minute, hour, day, month and weekday visually to assemble the expression, then verify it with a plain-language explanation and the next run times. Everything is computed in your browser.', ja: 'cron式は5つのフィールドの意味を覚えにくく、間違えがちです。分・時・日・月・曜日を視覚的に選んで式を組み立て、その式が実際にいつ実行されるかを説明と次回実行時刻で検証すれば安心です。すべての計算はブラウザ内で行われます。', zh: 'cron 表达式因五个字段含义难记而容易出错。可视化选择分、时、日、月、星期来拼出表达式，再用通俗解释和下次执行时间来验证，便能放心。所有计算都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/dev/crontab-builder',
        name: { ko: 'cron 식 시각적으로 조립', en: 'Build the cron expression visually', ja: 'cron式を視覚的に組み立て', zh: '可视化拼出 cron 表达式' },
        text: {
          ko: '분·시·일·월·요일을 클릭으로 선택해 cron 식을 만듭니다.',
          en: 'Pick minute, hour, day, month and weekday by clicking to build the cron expression.', ja: '分・時・日・月・曜日をクリックで選んでcron式を作ります。', zh: '点击选择分、时、日、月、星期来生成 cron 表达式。',
        },
      },
      {
        href: '/tools/dev/cron',
        name: { ko: '무엇이 실행되는지 설명·검증', en: 'Explain & verify what it runs', ja: '何が実行されるか説明・検証', zh: '解释并验证执行内容' },
        text: {
          ko: '만든 식을 붙여넣어 사람 말 설명과 다음 실행 시각을 확인합니다.',
          en: 'Paste the expression to read a plain-language explanation and the next run times.', ja: '作った式を貼り付けて、言葉での説明と次回実行時刻を確認します。', zh: '粘贴表达式，查看通俗解释和下次执行时间。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '요일은 0과 7 중 무엇이 일요일인가요?', en: 'For weekdays, is Sunday 0 or 7?', ja: '曜日は0と7のどちらが日曜ですか？', zh: '星期里 0 和 7 哪个是周日？' },
        a: {
          ko: '대부분의 cron에서 0과 7 모두 일요일로 인식합니다. 검증 도구가 해석 결과를 알려주니 헷갈리면 확인하세요.',
          en: 'In most cron implementations both 0 and 7 mean Sunday. The verify tool shows how it’s interpreted if you’re unsure.', ja: '多くのcronでは0と7のどちらも日曜です。迷ったら検証ツールが解釈結果を示します。', zh: '在多数 cron 实现中 0 和 7 都表示周日。不确定时，验证工具会显示其解释结果。',
        },
      },
      {
        q: { ko: '"매주 평일 오전 9시"는 어떻게 쓰나요?', en: 'How do I write “9am every weekday”?', ja: '「平日の午前9時」はどう書きますか？', zh: '“每个工作日上午 9 点”怎么写？' },
        a: {
          ko: '조립 도구에서 시=9, 분=0, 요일=월–금을 고르면 0 9 * * 1-5가 만들어집니다. 검증 도구로 다음 실행 시각도 확인할 수 있습니다.',
          en: 'In the builder set hour 9, minute 0 and weekdays Mon–Fri to get 0 9 * * 1-5, then confirm the next run times in the verifier.', ja: '組み立てツールで時=9、分=0、曜日=月〜金を選ぶと0 9 * * 1-5になります。検証ツールで次回実行時刻も確認できます。', zh: '在拼装工具中选时=9、分=0、星期=周一至周五，得到 0 9 * * 1-5，再用验证工具确认下次执行时间。',
        },
      },
    ],
    keywords: {
      ko: ['cron 식 만들기', 'crontab 생성기', 'cron 설명', '스케줄 식', '다음 실행 시각'],
      en: ['cron expression builder', 'crontab generator', 'cron explainer', 'cron schedule', 'next run time'], ja: ['cron 式 作成', 'crontab 生成', 'cron 説明', 'スケジュール式', '次回実行時刻'], zh: ['cron 表达式 生成', 'crontab 生成器', 'cron 解释', '调度表达式', '下次执行时间'],
    },
  },
  {
    slug: 'style-social-bio-text',
    category: 'text',
    title: { ko: 'SNS 프로필·게시물용 멋진 유니코드 글자', en: 'Fancy Unicode Text for Social Bios & Posts', ja: 'SNSプロフィール・投稿用のおしゃれな文字', zh: '社交简介与帖子用的花式文字' },
    h1: { ko: 'SNS용 멋진 글자 만들기', en: 'Make fancy text for social', ja: 'SNS用のおしゃれな文字を作成', zh: '制作社交用花式文字' },
    description: {
      ko: '인스타·X 프로필과 게시물에 쓸 굵은·필기체 유니코드 글자에 취소선·위첨자까지 더해 눈에 띄게 꾸미세요.',
      en: 'Dress up Instagram or X bios and posts with bold/script Unicode text, plus strikethrough and superscript flourishes.', ja: 'インスタやXのプロフィール・投稿に使う太字・筆記体のUnicode文字に、取り消し線や上付きまで加えて目立たせます。', zh: '用粗体、花体 Unicode 文字，再加上删除线和上标，为 Instagram、X 的简介和帖子增色。',
    },
    intro: {
      ko: 'SNS는 폰트를 직접 바꿀 수 없지만, 유니코드의 특수 글자를 쓰면 굵은체·필기체처럼 보이게 할 수 있습니다. 기본 글자를 멋진 스타일로 바꾸고, 취소선·밑줄이나 위·아래 첨자를 더해 한 줄 소개를 개성 있게 꾸미면 됩니다. 변환은 브라우저에서 즉시 이뤄집니다.',
      en: 'Social apps don’t let you change fonts directly, but Unicode’s special letters can look bold or script. Convert your text into a fancy style, then add strikethrough, underline or super/subscript to give your bio personality. The conversion happens instantly in your browser.', ja: 'SNSはフォントを直接変えられませんが、Unicodeの特殊文字を使えば太字や筆記体のように見せられます。文字をおしゃれなスタイルに変換し、取り消し線・下線や上付き・下付きを加えて、ひとこと紹介を個性的に飾れます。変換はブラウザ内で即座に行われます。', zh: '社交应用无法直接改字体，但用 Unicode 的特殊字符就能呈现粗体、花体效果。把文字转成花式样式，再加上删除线、下划线或上下标，让简介更有个性。转换在浏览器中即时完成。',
    },
    steps: [
      {
        href: '/tools/text/fancy',
        name: { ko: '멋진·굵은 유니코드 글자 생성', en: 'Generate fancy/bold Unicode text', ja: 'おしゃれ・太字のUnicode文字を生成', zh: '生成花式/粗体 Unicode 文字' },
        text: {
          ko: '글자를 입력하면 굵은체·필기체 등 여러 유니코드 스타일로 변환됩니다.',
          en: 'Type your text and get it in several Unicode styles like bold and script.', ja: '文字を入力すると、太字や筆記体などのUnicodeスタイルに変換されます。', zh: '输入文字，即可转换为粗体、花体等多种 Unicode 样式。',
        },
      },
      {
        href: '/tools/text/strikethrough',
        name: { ko: '취소선·밑줄 추가', en: 'Add strikethrough/underline', ja: '取り消し線・下線を追加', zh: '添加删除线/下划线' },
        text: {
          ko: '글자에 취소선이나 밑줄을 입혀 강조합니다.',
          en: 'Overlay a strikethrough or underline to emphasize text.', ja: '文字に取り消し線や下線を重ねて強調します。', zh: '为文字叠加删除线或下划线以示强调。',
        },
      },
      {
        href: '/tools/text/superscript',
        name: { ko: '위·아래 첨자 추가', en: 'Add superscript/subscript', ja: '上付き・下付きを追加', zh: '添加上标/下标' },
        text: {
          ko: '글자를 작은 위첨자·아래첨자 형태로 바꿉니다.',
          en: 'Turn text into small superscript or subscript characters.', ja: '文字を小さな上付き・下付きの形に変えます。', zh: '把文字变成小号的上标或下标形式。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '어디에 붙여넣어도 똑같이 보이나요?', en: 'Does it look the same everywhere I paste it?', ja: 'どこに貼っても同じに見えますか？', zh: '粘贴到任何地方都一样吗？' },
        a: {
          ko: '유니코드 글자라 대부분의 앱에서 보이지만, 일부 글꼴·플랫폼에선 일부 스타일이 네모로 표시될 수 있습니다. 붙여넣기 전에 미리보기로 확인하세요.',
          en: 'These are Unicode characters, so they show in most apps — but some fonts or platforms may render certain styles as boxes. Check the preview before pasting.', ja: 'Unicode文字なので多くのアプリで表示されますが、一部のフォントやプラットフォームでは□で表示されることがあります。貼り付ける前にプレビューで確認してください。', zh: '这些是 Unicode 字符，多数应用都能显示，但部分字体或平台可能把某些样式显示为方块。粘贴前请用预览确认。',
        },
      },
      {
        q: { ko: '검색이나 스크린리더에 영향이 있나요?', en: 'Does it affect search or screen readers?', ja: '検索やスクリーンリーダーに影響しますか？', zh: '会影响搜索或屏幕阅读器吗？' },
        a: {
          ko: '멋진 글자는 일반 글자와 코드가 달라 검색·접근성에 불리할 수 있습니다. 닉네임 장식 정도로 가볍게 쓰는 것을 권합니다.',
          en: 'Fancy characters have different code points than normal letters, which can hurt search and accessibility. Use them lightly, mainly to decorate a handle.', ja: 'おしゃれな文字は通常の文字とコードが異なり、検索やアクセシビリティに不利なことがあります。ニックネームの装飾程度に軽く使うのがおすすめです。', zh: '花式字符与普通字母的码点不同，可能不利于搜索和无障碍。建议仅用于点缀昵称等轻度场景。',
        },
      },
    ],
    keywords: {
      ko: ['멋진 글씨', '유니코드 폰트', 'sns 닉네임 꾸미기', '취소선 글자', '위첨자 글자'],
      en: ['fancy text generator', 'unicode fonts', 'instagram bio fonts', 'strikethrough text', 'superscript text'], ja: ['おしゃれ 文字', 'unicode フォント', 'sns ニックネーム 装飾', '取り消し線 文字', '上付き 文字'], zh: ['花式文字', 'unicode 字体', '社交 昵称 装饰', '删除线 文字', '上标 文字'],
    },
  },
  {
    slug: 'improve-writing-readability',
    category: 'text',
    title: { ko: '글의 가독성 점검하고 다듬기', en: 'Check & Improve Your Writing’s Readability', ja: '文章の読みやすさを点検して整える', zh: '检查并改善文章的可读性' },
    h1: { ko: '글 가독성 다듬기', en: 'Improve your writing’s readability', ja: '文章の読みやすさを整える', zh: '改善文章可读性' },
    description: {
      ko: 'Flesch 읽기 쉬움 점수와 학년 수준으로 글의 난이도를 진단하고, 음절·단어 수까지 확인해 더 쉽게 다듬으세요.',
      en: 'Diagnose your writing with the Flesch reading ease score and grade level, then check syllables and word counts to make it clearer.', ja: 'Fleschの読みやすさスコアと学年レベルで文章の難易度を診断し、音節・単語数まで確認してより読みやすく整えます。', zh: '用 Flesch 易读度评分和年级水平诊断文章难度，再核对音节与字数，让表达更易懂。',
    },
    intro: {
      ko: '글이 어렵게 느껴지는 데는 긴 문장과 어려운 단어가 큰 몫을 합니다. Flesch 점수와 학년 수준으로 현재 난이도를 객관적으로 보고, 음절 수와 단어·글자 수를 확인하며 문장을 줄이고 쉬운 말로 바꾸면 됩니다. 분석은 브라우저에서만 이뤄지고 글이 외부로 나가지 않습니다.',
      en: 'Long sentences and hard words are what make writing feel difficult. See the current difficulty objectively with a Flesch score and grade level, then count syllables and words to shorten sentences and simplify wording. The analysis runs only in your browser, so your text never leaves it.', ja: '文章が難しく感じる主な原因は、長い文と難しい単語です。Fleschスコアと学年レベルで現在の難易度を客観的に把握し、音節数や単語・文字数を確認しながら文を短く、平易な言葉に直します。分析はブラウザ内だけで行われ、文章が外部に出ることはありません。', zh: '让文章显得难懂的主因是长句和生僻词。用 Flesch 评分和年级水平客观了解当前难度，再核对音节数与词数、字数，缩短句子、改用浅显措辞。分析只在浏览器中进行，文章不会外流。',
    },
    steps: [
      {
        href: '/tools/text/readability',
        name: { ko: 'Flesch 점수·학년 수준 측정', en: 'Score Flesch reading ease & grade', ja: 'Fleschスコア・学年レベルを測定', zh: '测算 Flesch 易读度与年级' },
        text: {
          ko: '글을 붙여넣어 읽기 쉬움 점수와 대략의 학년 수준을 확인합니다.',
          en: 'Paste your text to see its reading-ease score and approximate grade level.', ja: '文章を貼り付けて、読みやすさスコアとおおよその学年レベルを確認します。', zh: '粘贴文章，查看其易读度评分和大致年级水平。',
        },
      },
      {
        href: '/tools/text/syllable',
        name: { ko: '음절 수 세기(시·하이쿠)', en: 'Count syllables (poems/haiku)', ja: '音節を数える(詩・俳句)', zh: '统计音节（诗/俳句）' },
        text: {
          ko: '단어·행의 음절 수를 세어 운율이나 5-7-5 구조를 맞춥니다.',
          en: 'Count syllables per word or line to fit a meter or a 5-7-5 structure.', ja: '単語・行の音節数を数えて、韻律や5-7-5の構造を整えます。', zh: '统计每个词或每行的音节数，以契合格律或 5-7-5 结构。',
        },
      },
      {
        href: '/tools/text/count',
        name: { ko: '단어·글자 수 세기', en: 'Count words & characters', ja: '単語・文字数を数える', zh: '统计字数与字符数' },
        text: {
          ko: '단어·글자·문장 수를 확인해 분량을 가늠합니다.',
          en: 'Check word, character and sentence counts to gauge length.', ja: '単語・文字・文の数を確認して分量を把握します。', zh: '查看词数、字符数与句数，掌握篇幅。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: 'Flesch 점수는 몇 점이 좋은 건가요?', en: 'What Flesch score is good?', ja: 'Fleschスコアは何点が良いですか？', zh: 'Flesch 评分多少算好？' },
        a: {
          ko: '60–70이면 일반 성인이 무난히 읽는 수준입니다. 점수가 높을수록 쉽고, 낮을수록 전문적·어려운 글입니다.',
          en: '60–70 reads comfortably for most adults. Higher is easier; lower means more technical, harder text.', ja: '60〜70なら一般的な成人が無理なく読めるレベルです。高いほど易しく、低いほど専門的で難しい文章です。', zh: '60–70 适合大多数成年人轻松阅读。分数越高越易读，越低则越专业、越难。',
        },
      },
      {
        q: { ko: '한국어 글에도 정확한가요?', en: 'Is it accurate for non-English text?', ja: '日本語の文章でも正確ですか？', zh: '对非英文文章准确吗？' },
        a: {
          ko: 'Flesch·음절 공식은 영어 기준으로 설계돼 영어 글에서 가장 정확합니다. 다른 언어에서는 단어·글자 수를 참고 지표로 활용하세요.',
          en: 'The Flesch and syllable formulas are designed for English and are most accurate there. For other languages, use the word/character counts as a guide.', ja: 'Fleschや音節の公式は英語向けに設計されており、英語で最も正確です。他言語では単語・文字数を参考指標として使ってください。', zh: 'Flesch 和音节公式针对英文设计，对英文最准确。其他语言可把词数、字符数作为参考指标。',
        },
      },
    ],
    keywords: {
      ko: ['가독성 점수', 'flesch 읽기 쉬움', '음절 수 세기', '단어 수 세기', '글 난이도'],
      en: ['readability score', 'flesch reading ease', 'syllable counter', 'word counter', 'reading level'], ja: ['読みやすさ スコア', 'flesch リーダビリティ', '音節 カウント', '単語数 カウント', '文章 難易度'], zh: ['可读性 评分', 'flesch 易读度', '音节 统计', '字数 统计', '阅读难度'],
    },
  },
  {
    slug: 'split-the-bill',
    category: 'util',
    title: { ko: '세금·팁 포함 단체 계산서 나누기', en: 'Split a Group Bill with Tax & Tip', ja: '税・チップ込みでグループの会計を割り勘', zh: '含税与小费的多人账单分摊' },
    h1: { ko: '단체 계산서 나누기', en: 'Split a group bill', ja: 'グループの会計を割り勘', zh: '分摊多人账单' },
    description: {
      ko: '세금과 팁까지 더한 총액을 인원수로 공평하게 나누세요. 팁 금액만 따로 계산하는 것도 한 번에 됩니다.',
      en: 'Split a total that includes tax and tip fairly among everyone — and figure the tip amount on its own, too.', ja: '税とチップを含めた総額を人数で公平に分けます。チップ額だけを別に計算することもできます。', zh: '把含税与小费的总额公平地按人数分摊，也可单独算出小费金额。',
    },
    intro: {
      ko: '여럿이 함께 먹은 자리에서 계산서를 나눌 땐 세금과 팁을 빠뜨리기 쉽습니다. 총액에 팁을 더한 뒤 인원수로 나누면 한 사람당 낼 금액이 깔끔하게 떨어지고, 팁만 따로 계산해 비율을 확인할 수도 있습니다. 모든 계산이 브라우저에서 즉시 처리됩니다.',
      en: 'When several people share a meal, it’s easy to forget tax and tip while splitting the bill. Add the tip to the total and divide by the number of people for a clean per-person amount, or calculate the tip alone to check the rate. Every calculation happens instantly in your browser.', ja: '大勢で食事をした席では、割り勘の際に税やチップを忘れがちです。総額にチップを足して人数で割れば一人当たりの金額がきれいに出ますし、チップだけを別に計算して割合を確認することもできます。すべての計算はブラウザ内で即座に行われます。', zh: '多人聚餐分账时，很容易漏掉税和小费。把小费加到总额后按人数平分，每人金额一目了然；也可单独算小费来核对比例。所有计算都在浏览器中即时完成。',
    },
    steps: [
      {
        href: '/tools/util/bill-split',
        name: { ko: '세금·팁 포함해 균등 분배', en: 'Split the bill evenly with tax/tip', ja: '税・チップ込みで均等に分割', zh: '含税与小费均分账单' },
        text: {
          ko: '총액·세금·팁·인원수를 입력하면 한 사람당 낼 금액이 나옵니다.',
          en: 'Enter the total, tax, tip and number of people to get the per-person amount.', ja: '総額・税・チップ・人数を入力すると、一人当たりの金額が出ます。', zh: '输入总额、税、小费和人数，得出每人应付金额。',
        },
      },
      {
        href: '/tools/util/tip-calc',
        name: { ko: '팁 금액 계산', en: 'Calculate the tip amount', ja: 'チップ額を計算', zh: '计算小费金额' },
        text: {
          ko: '식대와 팁 비율을 입력해 팁 금액과 합계를 확인합니다.',
          en: 'Enter the bill and tip percentage to see the tip amount and the grand total.', ja: '飲食代とチップ率を入力して、チップ額と合計を確認します。', zh: '输入餐费和小费比例，查看小费金额与合计。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '팁은 세금 전 금액으로 계산하나요?', en: 'Is the tip figured before or after tax?', ja: 'チップは税抜きで計算しますか？', zh: '小费按税前还是税后算？' },
        a: {
          ko: '관례는 지역마다 다릅니다. 도구에서 기준 금액을 직접 정할 수 있어 세전·세후 어느 쪽이든 맞출 수 있습니다.',
          en: 'The custom varies by region. The tool lets you choose the base amount, so you can tip on the pre-tax or post-tax figure.', ja: '慣習は地域によって異なります。ツールで基準額を選べるので、税抜き・税込みのどちらにも対応できます。', zh: '惯例因地区而异。工具允许自选计费基数，税前或税后均可。',
        },
      },
      {
        q: { ko: '나눈 금액이 딱 떨어지지 않으면요?', en: 'What if the split doesn’t divide evenly?', ja: '割り切れない場合はどうなりますか？', zh: '分不开整数怎么办？' },
        a: {
          ko: '한 사람당 금액을 올림으로 보여줘 합계가 부족하지 않게 합니다. 남는 잔돈은 한 명이 더 내는 식으로 조정하면 됩니다.',
          en: 'It rounds the per-person amount up so the total isn’t short; one person can cover the small remainder.', ja: '一人当たりの金額を切り上げて表示し、合計が不足しないようにします。余りは誰か一人が多めに負担して調整できます。', zh: '会向上取整每人金额以免总额不足，零头可由某一人多付来调整。',
        },
      },
    ],
    keywords: {
      ko: ['더치페이 계산', '계산서 나누기', '팁 계산기', '세금 팁 분배', 'n분의 1'],
      en: ['bill splitter', 'split the bill', 'tip calculator', 'divide bill with tax', 'cost per person'], ja: ['割り勘 計算', '会計 分割', 'チップ 計算機', '税 チップ 分担', '一人当たり 金額'], zh: ['账单 分摊', '均分 账单', '小费 计算器', '含税 小费 分摊', '人均 金额'],
    },
  },
  {
    slug: 'track-time-across-timezones',
    category: 'util',
    title: { ko: '시간대 넘어 회의 시간 맞추기', en: 'Coordinate Meeting Times Across Time Zones', ja: 'タイムゾーンをまたいで会議時間を調整', zh: '跨时区协调会议时间' },
    h1: { ko: '여러 시간대 회의 맞추기', en: 'Coordinate times across time zones', ja: '複数のタイムゾーンで時間を調整', zh: '跨时区协调会议' },
    description: {
      ko: '여러 도시의 현재 시각을 한눈에 보고, 특정 시간을 시간대별로 변환한 뒤 회의까지 남은 시간을 카운트다운하세요.',
      en: 'See many cities’ current times at a glance, convert a specific time across zones, then count down to the meeting.', ja: '複数都市の現在時刻を一目で確認し、特定の時間をタイムゾーン別に変換して、会議までをカウントダウンします。', zh: '一眼看清多座城市的当前时间，把某个时间按时区换算，再倒数到会议开始。',
    },
    intro: {
      ko: '시차가 있는 팀과 일정을 잡으려면 상대 도시의 시각을 정확히 알아야 합니다. 여러 도시의 현재 시각을 한 화면에서 보고, 회의 후보 시간을 각 시간대로 변환해 누구에게도 너무 이르거나 늦지 않은지 확인한 뒤, 시작까지 카운트다운을 걸면 됩니다. 모든 계산이 브라우저에서 처리됩니다.',
      en: 'Scheduling with a team in another time zone means knowing exactly what time it is there. View several cities’ current times on one screen, convert a candidate meeting time into each zone to check it isn’t too early or late for anyone, then set a countdown to the start. Every calculation runs in your browser.', ja: '時差のあるチームと予定を組むには、相手の都市の時刻を正確に知る必要があります。複数都市の現在時刻を一画面で確認し、会議候補の時間を各タイムゾーンに変換して誰にとっても早すぎ・遅すぎないかを確認し、開始までカウントダウンを設定します。すべての計算はブラウザ内で行われます。', zh: '与异时区团队排程，需要准确知道对方城市的时间。在一个屏幕上查看多座城市的当前时间，把候选会议时间换算到各时区，确认对谁都不算太早或太晚，再设置倒计时到开始。所有计算都在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/util/world-clock',
        name: { ko: '여러 도시 현재 시각 보기', en: 'See current time in many cities', ja: '複数都市の現在時刻を表示', zh: '查看多座城市当前时间' },
        text: {
          ko: '관심 있는 도시들을 추가해 현재 시각을 한눈에 비교합니다.',
          en: 'Add the cities you care about to compare their current times at a glance.', ja: '気になる都市を追加して、現在時刻を一目で比較します。', zh: '添加关注的城市，一眼对比它们的当前时间。',
        },
      },
      {
        href: '/tools/util/timezone',
        name: { ko: '특정 시간을 시간대별로 변환', en: 'Convert a specific time across zones', ja: '特定の時間をタイムゾーン別に変換', zh: '把特定时间按时区换算' },
        text: {
          ko: '한 도시의 회의 시간을 입력해 다른 시간대의 해당 시각을 확인합니다.',
          en: 'Enter the meeting time in one city to see the matching time in other zones.', ja: 'ある都市の会議時間を入力して、他のタイムゾーンでの時刻を確認します。', zh: '输入某城市的会议时间，查看其他时区对应的时刻。',
        },
      },
      {
        href: '/tools/util/countdown',
        name: { ko: '회의까지 카운트다운', en: 'Count down to the meeting', ja: '会議までカウントダウン', zh: '倒数到会议' },
        text: {
          ko: '회의 시작 시각을 정해 남은 시간을 실시간으로 셉니다.',
          en: 'Set the meeting start time and count down the remaining time live.', ja: '会議の開始時刻を設定して、残り時間をリアルタイムで数えます。', zh: '设定会议开始时间，实时倒数剩余时间。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '서머타임도 반영되나요?', en: 'Does it account for daylight saving time?', ja: 'サマータイムも反映されますか？', zh: '会考虑夏令时吗？' },
        a: {
          ko: '네. 브라우저의 시간대 데이터를 사용해 서머타임 적용 여부를 자동으로 반영합니다.',
          en: 'Yes. It uses your browser’s time zone data, so daylight saving is applied automatically.', ja: 'はい。ブラウザのタイムゾーンデータを用いるため、サマータイムの有無が自動で反映されます。', zh: '会。它使用浏览器的时区数据，自动反映是否处于夏令时。',
        },
      },
      {
        q: { ko: '내 시간대는 어떻게 정해지나요?', en: 'How is my time zone determined?', ja: '自分のタイムゾーンはどう決まりますか？', zh: '我的时区如何确定？' },
        a: {
          ko: '기기 설정의 시간대를 기준으로 합니다. 다른 기준이 필요하면 도시를 직접 골라 비교할 수 있습니다.',
          en: 'It uses your device’s time zone setting. If you need a different baseline, pick cities manually to compare.', ja: '端末設定のタイムゾーンを基準にします。別の基準が必要なら、都市を手動で選んで比較できます。', zh: '以设备设置的时区为准。如需其他基准，可手动选择城市进行对比。',
        },
      },
    ],
    keywords: {
      ko: ['세계 시간', '시간대 변환', '회의 시간 조율', '시차 계산', '카운트다운'],
      en: ['world clock', 'time zone converter', 'meeting time across zones', 'time difference', 'countdown timer'], ja: ['世界時計', 'タイムゾーン 変換', '会議時間 調整', '時差 計算', 'カウントダウン'], zh: ['世界时钟', '时区 换算', '会议时间 协调', '时差 计算', '倒计时'],
    },
  },
  {
    slug: 'generate-test-card-numbers',
    category: 'security',
    title: { ko: '결제 테스트용 Luhn 유효 번호 생성', en: 'Generate Luhn-Valid Test Numbers for Payments', ja: '決済テスト用のLuhn有効な番号を生成', zh: '生成支付测试用的 Luhn 有效号码' },
    h1: { ko: '결제 테스트용 번호 생성', en: 'Generate test numbers for payments', ja: '決済テスト用の番号を生成', zh: '生成支付测试号码' },
    description: {
      ko: '결제 폼 테스트에 쓸 Luhn 검사 통과 번호를 만들고, 체크섬과 IBAN까지 검증하세요. 모두 테스트용 가짜 번호입니다.',
      en: 'Make Luhn-passing numbers for payment-form testing, then validate the checksum and an IBAN. These are fake test numbers only.', ja: '決済フォームのテストに使うLuhn検査を通る番号を作り、チェックサムやIBANまで検証します。すべてテスト用の架空番号です。', zh: '生成可通过 Luhn 校验的号码用于支付表单测试，再验证校验位和 IBAN。这些都是仅供测试的虚构号码。',
    },
    intro: {
      ko: '결제 폼의 입력 검증을 테스트하려면 형식이 올바른 가짜 카드번호가 필요합니다. Luhn 알고리즘을 통과하는 번호를 생성해 검증 로직이 잘 작동하는지 확인하고, 체크섬과 IBAN까지 점검하면 됩니다. 이 번호들은 실제 계좌가 아닌 순수 테스트용이며, 모든 처리는 브라우저에서만 이뤄집니다.',
      en: 'Testing a payment form’s validation needs format-correct fake card numbers. Generate numbers that pass the Luhn algorithm to confirm your validation works, then check the checksum and an IBAN as well. These are purely test numbers — never real accounts — and all processing happens only in your browser.', ja: '決済フォームの入力検証をテストするには、形式が正しい架空のカード番号が必要です。Luhnアルゴリズムを通る番号を生成して検証ロジックが機能するか確認し、チェックサムやIBANも点検します。これらは実在の口座ではなく純粋なテスト用で、すべての処理はブラウザ内だけで行われます。', zh: '测试支付表单的输入校验，需要格式正确的虚构卡号。生成可通过 Luhn 算法的号码来确认校验逻辑是否正常，再核对校验位和 IBAN。这些纯属测试号码，绝非真实账户，且所有处理仅在浏览器中完成。',
    },
    steps: [
      {
        href: '/tools/security/luhn-generator',
        name: { ko: 'Luhn 유효 번호 생성', en: 'Generate Luhn-valid numbers', ja: 'Luhn有効な番号を生成', zh: '生成 Luhn 有效号码' },
        text: {
          ko: '자릿수와 발급사 접두사를 골라 Luhn 검사를 통과하는 테스트 번호를 만듭니다.',
          en: 'Pick the length and issuer prefix to make test numbers that pass the Luhn check.', ja: '桁数と発行会社のプレフィックスを選び、Luhn検査を通るテスト番号を作ります。', zh: '选择位数和发卡机构前缀，生成可通过 Luhn 校验的测试号码。',
        },
      },
      {
        href: '/tools/security/cc-validate',
        name: { ko: 'Luhn 체크섬 검증', en: 'Validate the Luhn checksum', ja: 'Luhnチェックサムを検証', zh: '验证 Luhn 校验位' },
        text: {
          ko: '번호를 붙여넣어 Luhn 체크섬 통과 여부와 추정 발급사를 확인합니다.',
          en: 'Paste a number to check whether it passes the Luhn checksum and its likely issuer.', ja: '番号を貼り付けて、Luhnチェックサムを通るかと推定発行会社を確認します。', zh: '粘贴号码，查看是否通过 Luhn 校验及其可能的发卡机构。',
        },
      },
      {
        href: '/tools/security/iban-validator',
        name: { ko: 'IBAN 검증(mod-97)', en: 'Validate an IBAN (mod-97)', ja: 'IBANを検証(mod-97)', zh: '验证 IBAN（mod-97）' },
        text: {
          ko: 'IBAN을 입력해 mod-97 검사로 형식과 체크 숫자를 확인합니다.',
          en: 'Enter an IBAN to verify its format and check digits with the mod-97 test.', ja: 'IBANを入力し、mod-97検査で形式とチェック数字を確認します。', zh: '输入 IBAN，用 mod-97 检验其格式与校验数字。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '이 번호로 실제 결제가 되나요?', en: 'Can these numbers make a real payment?', ja: 'この番号で実際に決済できますか？', zh: '这些号码能完成真实支付吗？' },
        a: {
          ko: '아니요. Luhn 형식만 맞춘 가짜 번호라 실제 계좌·카드가 아니며 결제가 일어나지 않습니다. 오직 폼 검증 테스트용입니다.',
          en: 'No. They only satisfy the Luhn format — they’re fake, not real cards or accounts, and cannot make a payment. They’re strictly for testing form validation.', ja: 'いいえ。Luhn形式を満たすだけの架空番号で、実在のカード・口座ではなく決済は発生しません。あくまでフォーム検証テスト用です。', zh: '不能。它们只满足 Luhn 格式，是虚构号码，并非真实卡片或账户，无法完成支付。仅用于表单校验测试。',
        },
      },
      {
        q: { ko: 'Luhn 검사는 무엇을 보장하나요?', en: 'What does the Luhn check guarantee?', ja: 'Luhn検査は何を保証しますか？', zh: 'Luhn 校验保证什么？' },
        a: {
          ko: '입력 오타 같은 단순 오류를 걸러줄 뿐, 그 번호가 실제로 발급된 유효한 카드라는 뜻은 아닙니다.',
          en: 'It catches simple errors like typos, but it doesn’t mean the number is a real, issued card.', ja: '入力ミスのような単純な誤りを検出するだけで、その番号が実在の有効なカードであることを意味しません。', zh: '它能拦截打字等简单错误，但并不代表该号码是真实已发行的卡片。',
        },
      },
    ],
    keywords: {
      ko: ['테스트 카드번호 생성', 'luhn 번호', '카드번호 검증', 'iban 검증', '결제 테스트'],
      en: ['test card number generator', 'luhn number', 'card number validator', 'iban validator', 'payment testing'], ja: ['テスト カード番号 生成', 'luhn 番号', 'カード番号 検証', 'iban 検証', '決済 テスト'], zh: ['测试卡号 生成', 'luhn 号码', '卡号 验证', 'iban 验证', '支付 测试'],
    },
  },
  {
    slug: 'identify-unknown-hash',
    category: 'security',
    title: { ko: '알 수 없는 해시 식별하고 비교하기', en: 'Identify an Unknown Hash & Compare It', ja: '不明なハッシュを識別して比較', zh: '识别未知哈希并进行比对' },
    h1: { ko: '해시 식별하고 비교하기', en: 'Identify and compare a hash', ja: 'ハッシュを識別して比較', zh: '识别并比对哈希' },
    description: {
      ko: '정체 모를 해시 문자열의 알고리즘을 추정하고, 원본 텍스트를 같은 방식으로 해싱해 일치하는지 비교하세요.',
      en: 'Guess the algorithm of a mystery hash string, then hash the source text the same way to compare for a match.', ja: '正体不明のハッシュ文字列のアルゴリズムを推定し、元のテキストを同じ方式でハッシュして一致するか比較します。', zh: '推测一段未知哈希字符串的算法，再用同样方式哈希原文进行比对。',
    },
    intro: {
      ko: '로그나 DB에서 마주친 해시가 어떤 알고리즘인지 모를 때가 있습니다. 길이와 형식으로 알고리즘 후보를 추정한 뒤, 원본 텍스트를 MD5·SHA 등으로 해싱해 그 결과가 일치하는지 비교하면 됩니다. 모든 해싱이 브라우저에서 처리돼 입력이 외부로 나가지 않습니다.',
      en: 'Sometimes you find a hash in a log or database and don’t know which algorithm made it. Guess candidate algorithms from its length and format, then hash the source text with MD5, SHA and others to compare for a match. All hashing happens in your browser, so your input never leaves it.', ja: 'ログやDBで見つけたハッシュが、どのアルゴリズムのものか分からないことがあります。長さや形式からアルゴリズム候補を推定し、元のテキストをMD5・SHAなどでハッシュして一致するか比較します。すべてのハッシュ処理はブラウザ内で行われ、入力が外部に出ることはありません。', zh: '有时在日志或数据库中遇到一段哈希，却不知它由哪种算法生成。可根据长度和格式推测候选算法，再用 MD5、SHA 等对原文进行哈希以比对是否匹配。所有哈希计算都在浏览器中完成，输入不会外流。',
    },
    steps: [
      {
        href: '/tools/security/hash-identifier',
        name: { ko: '해시 알고리즘 추정', en: 'Guess the hash algorithm', ja: 'ハッシュアルゴリズムを推定', zh: '推测哈希算法' },
        text: {
          ko: '해시 문자열을 붙여넣으면 길이·형식으로 가능한 알고리즘 후보를 알려줍니다.',
          en: 'Paste a hash string to get candidate algorithms based on its length and format.', ja: 'ハッシュ文字列を貼り付けると、長さ・形式から可能なアルゴリズム候補が分かります。', zh: '粘贴哈希字符串，依据长度和格式给出可能的算法候选。',
        },
      },
      {
        href: '/tools/security/text-hash',
        name: { ko: '텍스트 해싱해 비교(MD5/SHA)', en: 'Hash text to compare (MD5/SHA)', ja: 'テキストをハッシュして比較(MD5/SHA)', zh: '哈希文本以比对（MD5/SHA）' },
        text: {
          ko: '원본 텍스트를 추정한 알고리즘으로 해싱해 같은 값이 나오는지 확인합니다.',
          en: 'Hash the source text with the guessed algorithm to see if it produces the same value.', ja: '元のテキストを推定したアルゴリズムでハッシュし、同じ値になるか確認します。', zh: '用推测的算法对原文进行哈希，查看是否得到相同的值。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '해시를 원래 텍스트로 되돌릴 수 있나요?', en: 'Can a hash be reversed to the original text?', ja: 'ハッシュを元のテキストに戻せますか？', zh: '哈希能还原成原文吗？' },
        a: {
          ko: '아니요. 해시는 단방향이라 복원할 수 없습니다. 원본 후보를 같은 방식으로 해싱해 결과가 일치하는지 비교하는 방식만 가능합니다.',
          en: 'No. Hashing is one-way and can’t be reversed. You can only hash a candidate input the same way and compare the result for a match.', ja: 'いいえ。ハッシュは一方向で復元できません。候補となる入力を同じ方式でハッシュし、結果が一致するか比較する方法のみ可能です。', zh: '不能。哈希是单向的，无法还原。只能用同样方式哈希候选原文，再比对结果是否一致。',
        },
      },
      {
        q: { ko: '식별 결과가 항상 정확한가요?', en: 'Is the identification always correct?', ja: '識別結果は常に正確ですか？', zh: '识别结果总是准确吗？' },
        a: {
          ko: '길이가 같은 알고리즘이 여럿이라 추정은 후보 목록입니다. 원본을 실제로 해싱해 비교하는 단계로 확정하는 것이 안전합니다.',
          en: 'Several algorithms share the same length, so the guess is a list of candidates. Confirm it by actually hashing the source and comparing.', ja: '長さが同じアルゴリズムが複数あるため、推定は候補リストです。実際に元データをハッシュして比較する手順で確定するのが安全です。', zh: '多种算法长度相同，因此推测是一份候选列表。通过实际哈希原文并比对来确认更稳妥。',
        },
      },
    ],
    keywords: {
      ko: ['해시 식별', '해시 종류 추정', 'md5 sha 해시', '해시 비교', '텍스트 해시'],
      en: ['hash identifier', 'identify hash type', 'md5 sha hash', 'compare hash', 'text hash'], ja: ['ハッシュ 識別', 'ハッシュ 種類 推定', 'md5 sha ハッシュ', 'ハッシュ 比較', 'テキスト ハッシュ'], zh: ['哈希 识别', '哈希 类型 推测', 'md5 sha 哈希', '哈希 比对', '文本 哈希'],
    },
  },
  {
    slug: 'polish-screenshot-for-post',
    category: 'image',
    title: { ko: '게시물·문서용으로 스크린샷 다듬기', en: 'Polish a Screenshot for Posts & Docs', ja: '投稿・資料用にスクリーンショットを整える', zh: '为帖子与文档美化截图' },
    h1: { ko: '스크린샷 보기 좋게 다듬기', en: 'Polish a screenshot', ja: 'スクリーンショットを整える', zh: '美化截图' },
    description: {
      ko: '밋밋한 스크린샷에 배경·여백·그림자를 더하고 깔끔한 테두리까지 입혀 게시물이나 문서에 어울리게 만드세요.',
      en: 'Add a background, padding and shadow to a plain screenshot, then a clean border so it fits posts and docs.', ja: '味気ないスクリーンショットに背景・余白・影を加え、きれいな枠線まで付けて投稿や資料になじませます。', zh: '为平淡的截图加上背景、留白和阴影，再加一道干净的边框，让它更契合帖子和文档。',
    },
    intro: {
      ko: '그냥 찍은 스크린샷은 게시물이나 문서에 넣으면 어딘가 허전해 보입니다. 배경과 여백, 부드러운 그림자를 더하면 입체감이 생기고, 여기에 깔끔한 테두리를 두르면 화면 경계가 또렷해져 훨씬 정돈된 느낌을 줍니다. 모든 편집이 브라우저에서 처리돼 이미지가 업로드되지 않습니다.',
      en: 'A raw screenshot often looks bare inside a post or document. Adding a background, padding and a soft shadow gives it depth, and a clean border makes the edge crisp for a much tidier look. All editing happens in your browser, so the image is never uploaded.', ja: 'そのまま撮ったスクリーンショットは、投稿や資料に入れると物足りなく見えがちです。背景・余白・柔らかい影を加えると立体感が出て、さらにきれいな枠線を付けると画面の境界がはっきりして整った印象になります。すべての編集はブラウザ内で行われ、画像がアップロードされることはありません。', zh: '直接截取的截图放进帖子或文档常显得单调。加上背景、留白和柔和阴影会增加层次感，再配一道干净的边框让画面边缘更分明，整体更整洁。所有编辑都在浏览器中完成，图片不会被上传。',
    },
    steps: [
      {
        href: '/tools/image/screenshot-shadow',
        name: { ko: '배경·여백·그림자 추가', en: 'Add background, padding & shadow', ja: '背景・余白・影を追加', zh: '添加背景、留白与阴影' },
        text: {
          ko: '스크린샷을 올려 배경색·여백·그림자를 조절해 입체감을 줍니다.',
          en: 'Upload the screenshot and tune the background, padding and shadow for depth.', ja: 'スクリーンショットをアップロードし、背景色・余白・影を調整して立体感を出します。', zh: '上传截图，调整背景色、留白和阴影以增加立体感。',
        },
      },
      {
        href: '/tools/image/border',
        name: { ko: '깔끔한 테두리 추가', en: 'Add a clean border', ja: 'きれいな枠線を追加', zh: '添加干净的边框' },
        text: {
          ko: '색·두께를 골라 이미지에 또렷한 테두리를 두릅니다.',
          en: 'Pick a color and thickness to add a crisp border around the image.', ja: '色・太さを選んで画像にくっきりした枠線を付けます。', zh: '选择颜色与粗细，为图片添加清晰的边框。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '투명 배경으로 내보낼 수 있나요?', en: 'Can I export with a transparent background?', ja: '透明な背景で書き出せますか？', zh: '可以导出透明背景吗？' },
        a: {
          ko: '그림자·테두리를 PNG로 내보내면 투명도가 유지됩니다. 단색 배경을 넣었다면 그 색이 함께 저장됩니다.',
          en: 'Exporting to PNG preserves transparency for the shadow and border. If you added a solid background, that color is saved with it.', ja: 'PNGで書き出せば影や枠線の透明度が保たれます。単色背景を入れた場合はその色も一緒に保存されます。', zh: '导出为 PNG 可保留阴影和边框的透明度。若加了纯色背景，则该颜色会一并保存。',
        },
      },
      {
        q: { ko: '여백을 추가해도 화질이 떨어지나요?', en: 'Does adding padding reduce quality?', ja: '余白を加えると画質が落ちますか？', zh: '加留白会降低画质吗？' },
        a: {
          ko: '여백·그림자는 원본 픽셀 주위에 더해질 뿐이라 스크린샷 내용 자체의 화질은 그대로 유지됩니다.',
          en: 'Padding and shadow are added around the original pixels, so the screenshot’s own quality stays intact.', ja: '余白や影は元のピクセルの周りに加わるだけなので、スクリーンショットの内容自体の画質はそのまま保たれます。', zh: '留白和阴影只是加在原始像素周围，截图内容本身的画质保持不变。',
        },
      },
    ],
    keywords: {
      ko: ['스크린샷 꾸미기', '배경 그림자 추가', '이미지 테두리', '캡처 보기 좋게', '게시물 이미지'],
      en: ['polish screenshot', 'add shadow to screenshot', 'image border', 'pretty screenshot', 'screenshot background'], ja: ['スクリーンショット 装飾', '背景 影 追加', '画像 枠線', 'キャプチャ きれい', '投稿 画像'], zh: ['截图 美化', '添加 背景 阴影', '图片 边框', '截图 好看', '帖子 配图'],
    },
  },
  {
    slug: 'make-data-table-for-web',
    category: 'docs',
    title: { ko: '데이터를 웹·마크다운 표로 만들기', en: 'Turn Data into a Web / Markdown Table', ja: 'データをWeb・Markdownの表に変換', zh: '把数据转成网页/Markdown 表格' },
    h1: { ko: '데이터를 표로 만들기', en: 'Turn data into a table', ja: 'データを表に変換', zh: '把数据转成表格' },
    description: {
      ko: 'CSV 데이터를 바로 붙여넣을 수 있는 HTML 표로 바꾸거나, 손으로 깔끔한 마크다운 표를 만들어 문서에 넣으세요.',
      en: 'Convert CSV data into a paste-ready HTML table, or build a clean Markdown table by hand for your docs.', ja: 'CSVデータをそのまま貼れるHTMLの表に変換したり、手できれいなMarkdownの表を作って文書に入れたりできます。', zh: '把 CSV 数据转成可直接粘贴的 HTML 表格，或手动制作整洁的 Markdown 表格放进文档。',
    },
    intro: {
      ko: '표 데이터를 블로그나 README에 넣을 때 형식을 일일이 맞추긴 번거롭습니다. 가진 CSV를 HTML 표로 바로 변환하거나, 행·열을 채워 깔끔한 마크다운 표를 만들면 그대로 붙여넣을 수 있습니다. 모든 변환이 브라우저에서 처리돼 데이터가 외부로 전송되지 않습니다.',
      en: 'Formatting table data by hand for a blog or README is tedious. Convert your CSV straight into an HTML table, or fill in rows and columns to build a clean Markdown table you can paste as-is. Every conversion happens in your browser, so your data is never sent anywhere.', ja: '表データをブログやREADMEに入れる際、形式を一つずつ整えるのは面倒です。手元のCSVをHTMLの表に直接変換したり、行・列を埋めてきれいなMarkdownの表を作れば、そのまま貼り付けられます。すべての変換はブラウザ内で行われ、データが外部に送信されることはありません。', zh: '把表格数据放进博客或 README 时，逐一调整格式很麻烦。可把手头的 CSV 直接转成 HTML 表格，或填写行列做出整洁的 Markdown 表格直接粘贴。所有转换都在浏览器中完成，数据不会发送到任何地方。',
    },
    steps: [
      {
        href: '/tools/docs/csv-to-html',
        name: { ko: 'CSV를 HTML 표로 변환', en: 'Convert CSV to an HTML table', ja: 'CSVをHTMLの表に変換', zh: '把 CSV 转成 HTML 表格' },
        text: {
          ko: 'CSV를 붙여넣으면 헤더·행을 갖춘 HTML 표 코드가 만들어집니다.',
          en: 'Paste CSV to get HTML table markup with headers and rows.', ja: 'CSVを貼り付けると、ヘッダー・行を備えたHTMLの表コードが生成されます。', zh: '粘贴 CSV，即可生成带表头和行的 HTML 表格代码。',
        },
      },
      {
        href: '/tools/docs/markdown-table',
        name: { ko: '마크다운 표 작성', en: 'Build a Markdown table', ja: 'Markdownの表を作成', zh: '制作 Markdown 表格' },
        text: {
          ko: '행·열과 정렬을 지정해 README에 쓸 마크다운 표를 만듭니다.',
          en: 'Set rows, columns and alignment to build a Markdown table for your README.', ja: '行・列と配置を指定して、READMEに使うMarkdownの表を作ります。', zh: '设定行、列与对齐方式，制作可用于 README 的 Markdown 表格。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '첫 줄을 헤더로 인식하나요?', en: 'Is the first row treated as a header?', ja: '1行目はヘッダーとして扱われますか？', zh: '第一行会当作表头吗？' },
        a: {
          ko: '네. CSV의 첫 줄을 표 헤더로 처리하며, 필요하면 헤더 사용 여부를 끌 수도 있습니다.',
          en: 'Yes. The first CSV row becomes the table header, and you can turn that off if needed.', ja: 'はい。CSVの1行目を表のヘッダーとして扱い、必要ならヘッダー使用をオフにもできます。', zh: '会。CSV 第一行作为表头，必要时也可关闭表头识别。',
        },
      },
      {
        q: { ko: '쉼표가 들어간 값은 어떻게 처리되나요?', en: 'How are values containing commas handled?', ja: 'カンマを含む値はどう処理されますか？', zh: '含逗号的值如何处理？' },
        a: {
          ko: '따옴표로 감싼 필드를 인식해 값 안의 쉼표를 구분자로 오해하지 않습니다. 표준 CSV 규칙을 따릅니다.',
          en: 'Quoted fields are recognized, so commas inside a value aren’t mistaken for separators. It follows standard CSV rules.', ja: '引用符で囲まれたフィールドを認識するため、値の中のカンマを区切り文字と誤認しません。標準的なCSVルールに従います。', zh: '会识别用引号包裹的字段，因此值内的逗号不会被误判为分隔符，遵循标准 CSV 规则。',
        },
      },
    ],
    keywords: {
      ko: ['csv html 표 변환', '마크다운 표 만들기', '표 생성기', 'readme 표', '데이터 표'],
      en: ['csv to html table', 'markdown table generator', 'table maker', 'readme table', 'data table'], ja: ['csv html 表 変換', 'markdown 表 作成', '表 生成', 'readme 表', 'データ 表'], zh: ['csv html 表格 转换', 'markdown 表格 制作', '表格 生成器', 'readme 表格', '数据 表格'],
    },
  },
  {
    slug: 'apply-vintage-photo-filter',
    category: 'image',
    title: { ko: '사진에 빈티지 필름 느낌 입히기', en: 'Give a Photo a Vintage Film Look', ja: '写真にヴィンテージなフィルム調を加える', zh: '为照片营造复古胶片质感' },
    h1: { ko: '사진 빈티지 필터', en: 'Vintage film look for photos', ja: '写真にヴィンテージ調を', zh: '照片复古滤镜' },
    description: {
      ko: '따뜻한 세피아 톤과 가장자리 비네팅, 색 틴트를 차례로 더해 평범한 사진을 빈티지 필름 느낌으로 바꾸세요.',
      en: 'Layer a warm sepia tone, edge vignette and color tint to turn an ordinary photo into a vintage film look.', ja: '温かみのあるセピア、周辺のビネット、色のティントを順に重ねて、普通の写真をヴィンテージなフィルム調に変えます。', zh: '依次叠加暖色棕褐调、边缘暗角和色彩着色，把普通照片变成复古胶片质感。',
    },
    intro: {
      ko: '빈티지한 분위기는 한 가지 효과가 아니라 여러 톤이 겹쳐 만들어집니다. 먼저 따뜻한 세피아로 색감을 옛 사진처럼 바꾸고, 가장자리를 어둡게 하는 비네팅으로 시선을 가운데로 모은 뒤, 은은한 색 틴트를 덧입히면 필름 특유의 분위기가 완성됩니다. 모든 효과가 브라우저에서 처리돼 사진이 업로드되지 않습니다.',
      en: 'A vintage mood comes from layering several tones, not one effect. Start with a warm sepia to age the colors, darken the edges with a vignette to pull the eye to the center, then add a subtle color tint to finish that film feel. Every effect runs in your browser, so the photo is never uploaded.', ja: 'ヴィンテージな雰囲気は一つの効果ではなく、複数のトーンを重ねて生まれます。まず温かいセピアで色合いを古写真風にし、周辺を暗くするビネットで視線を中央に集め、さりげない色ティントを重ねるとフィルム特有の雰囲気が完成します。すべての効果はブラウザ内で処理され、写真がアップロードされることはありません。', zh: '复古氛围并非单一效果，而是多种色调叠加而成。先用暖色棕褐让色彩泛旧，再用暗角压暗边缘把视线引向中央，最后叠一层淡淡的色彩着色，便有了胶片特有的味道。所有效果都在浏览器中完成，照片不会被上传。',
    },
    steps: [
      {
        href: '/tools/image/sepia',
        name: { ko: '따뜻한 세피아 톤 적용', en: 'Apply a warm sepia tone', ja: '温かいセピアを適用', zh: '应用暖色棕褐调' },
        text: {
          ko: '사진을 올려 세피아 강도를 조절하며 옛 사진 같은 색감을 입힙니다.',
          en: 'Upload a photo and adjust the sepia strength for an aged color cast.', ja: '写真をアップロードし、セピアの強さを調整して古写真のような色合いにします。', zh: '上传照片，调整棕褐强度，营造泛旧的色调。',
        },
      },
      {
        href: '/tools/image/vignette',
        name: { ko: '가장자리 어둡게(비네팅)', en: 'Darken the edges (vignette)', ja: '周辺を暗く(ビネット)', zh: '压暗边缘（暗角）' },
        text: {
          ko: '비네팅 범위와 강도를 조절해 시선을 가운데로 모읍니다.',
          en: 'Tune the vignette size and strength to draw the eye to the center.', ja: 'ビネットの範囲と強さを調整して、視線を中央に集めます。', zh: '调整暗角范围与强度，把视线引向中央。',
        },
      },
      {
        href: '/tools/image/tint',
        name: { ko: '색 틴트 덧입히기', en: 'Overlay a color tint', ja: '色ティントを重ねる', zh: '叠加色彩着色' },
        text: {
          ko: '은은한 색을 전체에 덧입혀 통일된 분위기를 만듭니다.',
          en: 'Overlay a subtle color across the image for a unified mood.', ja: 'さりげない色を全体に重ねて、統一感のある雰囲気を作ります。', zh: '为整张图叠一层淡色，营造统一氛围。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '효과를 적용하면 원본이 사라지나요?', en: 'Does applying effects overwrite the original?', ja: '効果を適用すると元画像は失われますか？', zh: '应用效果会覆盖原图吗？' },
        a: {
          ko: '아니요. 결과는 새 이미지로 내려받게 되어 원본 파일은 그대로 남습니다. 강도가 마음에 안 들면 다시 조절하면 됩니다.',
          en: 'No. The result downloads as a new image, leaving your original file untouched. Just readjust if the strength isn’t right.', ja: 'いいえ。結果は新しい画像としてダウンロードされ、元のファイルはそのまま残ります。強さが気に入らなければ調整し直せます。', zh: '不会。结果会作为新图片下载，原文件保持不变。强度不满意可重新调整。',
        },
      },
      {
        q: { ko: '효과 순서를 바꿔도 되나요?', en: 'Can I change the order of the effects?', ja: '効果の順番を変えてもいいですか？', zh: '可以更改效果顺序吗？' },
        a: {
          ko: '됩니다. 다만 세피아 → 비네팅 → 틴트 순서가 가장 자연스러운 결과를 주는 편입니다. 각 단계의 결과를 다음 도구에 넣어 이어가세요.',
          en: 'You can. That said, sepia → vignette → tint tends to give the most natural result. Feed each step’s output into the next tool.', ja: '構いません。ただしセピア→ビネット→ティントの順が最も自然な仕上がりになりやすいです。各段階の結果を次のツールに入れて続けてください。', zh: '可以。不过棕褐 → 暗角 → 着色的顺序往往效果最自然。把每一步的结果送入下一个工具继续即可。',
        },
      },
    ],
    keywords: {
      ko: ['빈티지 필터', '세피아 효과', '비네팅', '필름 느낌 사진', '레트로 사진'],
      en: ['vintage filter', 'sepia effect', 'vignette', 'film look photo', 'retro photo'], ja: ['ヴィンテージ フィルター', 'セピア 効果', 'ビネット', 'フィルム調 写真', 'レトロ 写真'], zh: ['复古 滤镜', '棕褐 效果', '暗角', '胶片感 照片', '复古 照片'],
    },
  },
  {
    slug: 'clean-up-pdf-pages',
    category: 'pdf',
    title: { ko: 'PDF 불필요한 페이지 삭제하고 재정렬', en: 'Delete Unwanted Pages & Reorder a PDF', ja: 'PDFの不要なページを削除して並べ替え', zh: '删除多余页面并重排 PDF' },
    h1: { ko: 'PDF 페이지 정리하기', en: 'Clean up PDF pages', ja: 'PDFのページを整理', zh: '整理 PDF 页面' },
    description: {
      ko: '빈 페이지나 필요 없는 페이지를 골라 지우고, 남은 페이지의 순서를 보기 좋게 재정렬하세요. 업로드 없이 브라우저에서.',
      en: 'Pick out blank or unwanted pages to delete, then reorder the remaining pages neatly — in your browser, no upload.', ja: '空白や不要なページを選んで削除し、残ったページの順番を見やすく並べ替えます。アップロードなし、ブラウザで。', zh: '挑出空白或多余页面删除，再把剩余页面整齐重排。无需上传，在浏览器中完成。',
    },
    intro: {
      ko: '스캔하거나 합쳐 만든 PDF에는 빈 페이지나 중복 페이지가 끼어 있곤 합니다. 먼저 필요 없는 페이지를 골라 삭제하고, 남은 페이지를 끌어다 순서를 바로잡으면 깔끔한 문서가 됩니다. 모든 편집이 브라우저에서 처리돼 파일이 업로드되지 않습니다.',
      en: 'PDFs you scan or merge often end up with blank or duplicate pages. Delete the ones you don’t need first, then drag the remaining pages into the right order for a clean document. All editing happens in your browser, so the file is never uploaded.', ja: 'スキャンや結合で作ったPDFには、空白ページや重複ページが紛れ込みがちです。まず不要なページを選んで削除し、残ったページをドラッグして順番を整えれば、すっきりした文書になります。すべての編集はブラウザ内で行われ、ファイルがアップロードされることはありません。', zh: '扫描或合并得到的 PDF 常夹杂空白页或重复页。先挑出不需要的页面删除，再拖动剩余页面调整顺序，就能得到整洁的文档。所有编辑都在浏览器中完成，文件不会被上传。',
    },
    steps: [
      {
        href: '/tools/pdf/delete-pages',
        name: { ko: '특정 페이지 삭제', en: 'Delete specific pages', ja: '特定のページを削除', zh: '删除指定页面' },
        text: {
          ko: 'PDF를 올려 삭제할 페이지 번호나 범위를 지정합니다.',
          en: 'Upload the PDF and specify the page numbers or ranges to delete.', ja: 'PDFをアップロードし、削除するページ番号や範囲を指定します。', zh: '上传 PDF，指定要删除的页码或范围。',
        },
      },
      {
        href: '/tools/pdf/organize',
        name: { ko: '남은 페이지 재정렬', en: 'Reorder the remaining pages', ja: '残ったページを並べ替え', zh: '重排剩余页面' },
        text: {
          ko: '남은 페이지를 끌어다 놓아 원하는 순서로 정렬합니다.',
          en: 'Drag the remaining pages to arrange them in the order you want.', ja: '残ったページをドラッグして、好みの順番に並べ替えます。', zh: '拖动剩余页面，按需要的顺序排列。',
        },
      },
    ],
    faqs: [
      {
        q: { ko: '한 번에 여러 페이지를 지울 수 있나요?', en: 'Can I delete several pages at once?', ja: '一度に複数ページを削除できますか？', zh: '可以一次删除多页吗？' },
        a: {
          ko: '네. 2,5,8처럼 쉼표로 나열하거나 3-7처럼 범위로 지정해 여러 페이지를 한 번에 삭제할 수 있습니다.',
          en: 'Yes. List them with commas like 2,5,8 or give a range like 3-7 to delete several pages at once.', ja: 'はい。2,5,8のようにカンマで列挙したり、3-7のように範囲で指定して、複数ページを一度に削除できます。', zh: '可以。用逗号列出如 2,5,8，或用范围如 3-7，即可一次删除多页。',
        },
      },
      {
        q: { ko: '편집 후 원본 PDF가 바뀌나요?', en: 'Does editing change the original PDF?', ja: '編集すると元のPDFは変わりますか？', zh: '编辑会改动原始 PDF 吗？' },
        a: {
          ko: '아니요. 결과는 새 PDF로 저장되고 원본 파일은 그대로 남습니다. 마음에 들지 않으면 다시 시작하면 됩니다.',
          en: 'No. The result is saved as a new PDF and your original file stays as-is. Just start over if you’re not happy.', ja: 'いいえ。結果は新しいPDFとして保存され、元のファイルはそのまま残ります。気に入らなければやり直せます。', zh: '不会。结果会另存为新的 PDF，原文件保持不变。不满意可重新开始。',
        },
      },
    ],
    keywords: {
      ko: ['pdf 페이지 삭제', 'pdf 페이지 정리', 'pdf 순서 변경', '빈 페이지 제거', 'pdf 재정렬'],
      en: ['delete pdf pages', 'remove pages from pdf', 'reorder pdf pages', 'organize pdf', 'pdf page cleanup'], ja: ['pdf ページ 削除', 'pdf ページ 整理', 'pdf 順番 変更', '空白ページ 削除', 'pdf 並べ替え'], zh: ['pdf 删除 页面', 'pdf 页面 整理', 'pdf 重排 顺序', '删除 空白页', 'pdf 重新排列'],
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

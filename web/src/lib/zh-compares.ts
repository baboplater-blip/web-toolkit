/**
 * 简体中文「X vs Y」比较页面数据。
 *
 * 与英文比较(en-compares.ts)使用相同的 slug 与结构,仅正文为简体中文。
 * 路由 /zh/compare/{slug} 使用本数据,并通过 hreflang 与 /compare、/en/compare、/ja/compare 互联。
 * relatedConverts(转换矩阵互链)按 slug 引用 en-compares。
 *
 * COMPARE_SLUGS / relatedCompares / comparesForTool 与语言无关,
 * 因此直接从 en-compares 再导出。
 */

import { COMPARE_SLUGS, comparesForTool, relatedCompares } from '@/lib/en-compares';
import type { Compare } from '@/lib/en-compares';

export { COMPARE_SLUGS, comparesForTool, relatedCompares };

export const COMPARES_ZH: Compare[] = [
  {
    slug: 'merge-vs-split-pdf',
    category: 'pdf',
    title: 'PDF 合并 vs 拆分 — 你需要哪个?',
    h1: 'PDF 合并 vs 拆分',
    description:
      '合并把多个 PDF 合成一个,拆分把一个 PDF 分成多页或多个部分。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '合并与拆分是相反的操作。合并把多个 PDF 连成一个文档,拆分则从一个 PDF 中提取页面或分成多个文件。两者都在浏览器内处理,文件不会被上传。',
    options: [
      {
        label: 'PDF 合并',
        toolId: 'pdf-merge',
        best: '需要把多个 PDF 合成一个文档时。',
        pros: ['把扫描件、章节、报告合到一个文件', '导出前调整页面与文件顺序', '便于共享与归档'],
        cons: ['不适合从大 PDF 中只取出几页'],
      },
      {
        label: 'PDF 拆分',
        toolId: 'pdf-split',
        best: '需要从大 PDF 中取出特定页面或部分时。',
        pros: ['把页面范围提取为单独的 PDF', '按页或按章拆分大 PDF', '较小的文件更利于上传和邮件'],
        cons: ['不适合把多个文档合到一起'],
      },
    ],
    verdict:
      '多个变一个用合并,一个变多个(或提取页面)用拆分。也可以先合并再拆分结果,从而整体重组文档。',
    faqs: [
      {
        q: '可以在同一次会话里合并又拆分吗?',
        a: '可以。先把 PDF 合并成一个文件并下载,再打开拆分工具来提取或分割。一切都在浏览器内完成。',
      },
      {
        q: '合并或拆分会降低画质吗?',
        a: '不会。两者都在已有的 PDF 页面上操作而不重新编码,因此文字和图像保持原样。',
      },
    ],
    keywords: ['pdf 合并 拆分', 'pdf 合并 分割', 'pdf merge split', 'pdf 合并 vs 拆分'],
  },
  {
    slug: 'heic-vs-jpg',
    category: 'image',
    title: 'HEIC vs JPG — 该用哪种图片格式?',
    h1: 'HEIC vs JPG',
    description:
      'HEIC 在 iPhone 上更省空间但在其他环境兼容性差,JPG 哪里都能打开。何时把 HEIC 转成 JPG — 免费,在浏览器中完成。',
    intro:
      'HEIC 是 iPhone 默认使用的高效格式,JPG(JPEG)是通用的照片格式。HEIC 在相近画质下文件更小,但 Windows、网页和许多应用无法打开,因此经常需要转成 JPG。',
    options: [
      {
        label: 'HEIC',
        toolId: 'image-heic-to-jpg',
        best: '在注重容量的苹果设备上保存照片时。',
        pros: ['同等画质下约为 JPG 一半的体积', '支持更高位深与透明度', '现代 iPhone 的默认格式'],
        cons: ['在 Windows、旧软件和网页上支持弱', '不转换就难以共享'],
      },
      {
        label: 'JPG',
        toolId: 'image-convert',
        best: '注重兼容性的共享、上传或打印时。',
        pros: ['几乎所有设备和应用都能打开', '任何网站和打印机都接受', '随处可编辑'],
        cons: ['同等画质下文件比 HEIC 大'],
      },
    ],
    verdict:
      '在苹果设备上本地保存可以保留 HEIC。一旦需要共享、上传或在 Windows、网页上打开,就把 HEIC 转成 JPG。转换在浏览器内进行,私密照片不会离开你的设备。',
    faqs: [
      {
        q: '把 HEIC 转成 JPG 会损失画质吗?',
        a: '由于 JPG 会重新编码,会有轻微、通常不易察觉的画质下降。在高质量设置下几乎看不出差别。',
      },
      {
        q: '可以一次批量转换多个 HEIC 吗?',
        a: '可以。HEIC 转 JPG 支持批量转换,并把结果打包为 ZIP 下载,全部在浏览器内处理。',
      },
    ],
    keywords: ['heic jpg 区别', 'heic jpeg', 'heic 转换', 'iphone 照片 格式'],
    relatedConverts: ['heic-to-jpg', 'heic-to-png'],
  },
  {
    slug: 'png-vs-jpg',
    category: 'image',
    title: 'PNG vs JPG — 该选哪个?',
    h1: 'PNG vs JPG',
    description:
      'PNG 无损且支持透明,适合图形与截图;JPG 更小,最适合照片。如何选择 — 在浏览器中免费转换。',
    intro:
      'PNG 与 JPG 解决不同的问题。PNG 采用无损压缩并支持透明,最适合徽标、截图以及边缘或文字清晰的图形。JPG 采用有损压缩,擅长照片,在轻微损失不易察觉的场景下文件小得多。',
    options: [
      {
        label: 'PNG',
        toolId: 'image-convert',
        best: '徽标、截图、图标,以及需要透明或文字的内容。',
        pros: ['无损 — 没有压缩噪点', '支持透明(alpha)', '边缘与文字清晰锐利'],
        cons: ['照片的文件相当大'],
      },
      {
        label: 'JPG',
        toolId: 'image-convert',
        best: '注重体积的照片或色彩丰富的图像。',
        pros: ['照片的体积非常小', '随处可用', '可调节画质与体积'],
        cons: ['有损 — 边缘发虚、不支持透明、文字有噪点'],
      },
    ],
    verdict:
      '照片用 JPG。徽标、截图、图标,或需要透明、锐利文字的内容用 PNG。用浏览器内的图片转换工具几秒即可双向转换。',
    faqs: [
      {
        q: '截图用哪个更好?',
        a: 'PNG。截图包含文字和锐利的 UI 边缘,JPG 压缩会让它们发糊,而 PNG 能保持清晰。',
      },
      {
        q: '可以把 PNG 转成 JPG 来省空间吗?',
        a: '可以。照片型 PNG 往往会显著缩小。只是要记住 JPG 不支持透明,背景会变成纯色。',
      },
    ],
    keywords: ['png jpg 区别', 'jpg png', 'png jpeg 区别', '图片 格式 推荐'],
    relatedConverts: ['png-to-jpg', 'jpg-to-png'],
  },
  {
    slug: 'webp-vs-png',
    category: 'image',
    title: 'WebP vs PNG — 更小的体积还是最大兼容?',
    h1: 'WebP vs PNG',
    description:
      'WebP 支持透明且体积小得多,适合网页;PNG 兼容性极佳。如何选择 — 在浏览器中免费转换。',
    intro:
      'WebP 是同时支持有损与无损以及透明的现代格式,通常比 PNG 小 25〜35%。PNG 较老,但几乎在任何环境都受支持。权衡在于体积与通用兼容性。',
    options: [
      {
        label: 'WebP',
        toolId: 'image-convert',
        best: '注重页面体积与加载速度的网页图像。',
        pros: ['同等画质下比 PNG 更小', '支持透明与动画', '所有现代浏览器都支持'],
        cons: ['不适合极旧软件或部分印刷流程'],
      },
      {
        label: 'PNG',
        toolId: 'image-convert',
        best: '需要最大兼容性与无损归档时。',
        pros: ['新旧工具都能打开', '无损且行为可预期', '编辑流程中的安全选择'],
        cons: ['文件比 WebP 大'],
      },
    ],
    verdict:
      '要做快速网站就用 WebP 来减轻图像体积。需要任何软件(包括旧软件)都能打开的文件,或需要继续编辑的无损母版,就用 PNG。可在浏览器中瞬间双向转换。',
    faqs: [
      {
        q: 'WebP 像 PNG 一样无损吗?',
        a: 'WebP 有可与 PNG 媲美的无损模式,也有更小的有损模式。转换时可以选择画质。',
      },
      {
        q: '所有浏览器都支持 WebP 吗?',
        a: '是的,当前主流浏览器都支持。极旧软件可能不支持,这时 PNG 更稳妥。',
      },
    ],
    keywords: ['webp png 区别', 'webp png', 'webp 转换', 'webp png 对比'],
    relatedConverts: ['webp-to-png', 'png-to-webp'],
  },
  {
    slug: 'jpg-to-pdf-vs-pdf-to-jpg',
    category: 'pdf',
    title: 'JPG 转 PDF vs PDF 转 JPG — 该往哪个方向?',
    h1: 'JPG 转 PDF vs PDF 转 JPG',
    description:
      'JPG 转 PDF 把图片合成一个文档,PDF 转 JPG 把 PDF 页面还原成图片。如何选方向 — 免费,在浏览器中完成。',
    intro:
      '这两者在图片与 PDF 之间反方向来回。JPG 转 PDF 把一张或多张图片打包成一个 PDF 文档,PDF 转 JPG 则把每个 PDF 页面渲染成独立图片。两者都在设备内完成。',
    options: [
      {
        label: 'JPG 转 PDF',
        toolId: 'pdf-from-jpg',
        best: '把扫描照片或收据做成一个可共享文档时。',
        pros: ['把多张图片合成一个 PDF', '调整页面大小与顺序', '适合扫描件、收据、作品集'],
        cons: ['输出是文档,不是可编辑图片'],
      },
      {
        label: 'PDF 转 JPG',
        toolId: 'pdf-to-jpg',
        best: '为幻灯片或缩略图从 PDF 取出页面图片时。',
        pros: ['每页得到一张 JPG/PNG', '把页面用作预览或社交图片', '可选择分辨率'],
        cons: ['文字变成图片的一部分,无法再选中'],
      },
    ],
    verdict:
      '有图片想合成一个文档就用 JPG 转 PDF。有 PDF 想得到各页的图片文件就用 PDF 转 JPG。两者都在本地运行,敏感扫描件不会离开浏览器。',
    faqs: [
      {
        q: 'PDF 转 JPG 后文字还能选中吗?',
        a: '不能。把页面转成 JPG 后一切都变成像素,文字无法再选中。需要文字就保留 PDF。',
      },
      {
        q: '从 JPG 转换时可以指定 PDF 页面大小吗?',
        a: '可以。JPG 转 PDF 工具支持选择页面大小与适配方式,图片不会被拉伸或裁切。',
      },
    ],
    keywords: ['jpg pdf pdf jpg', '图片 pdf', 'pdf 图片', 'pdf 图片 转换'],
    relatedConverts: ['jpg-to-pdf', 'pdf-to-jpg'],
  },
  {
    slug: 'compress-vs-resize-image',
    category: 'image',
    title: '图片压缩 vs 缩放 — 哪个能减小文件?',
    h1: '图片压缩 vs 缩放',
    description:
      '压缩在尺寸不变下降低画质以减小体积,缩放改变像素尺寸。该用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者都能减小文件,但方式不同。压缩保持宽高不变而降低画质(数据量),缩放则改变实际像素尺寸。很多情况下最好的做法是先缩放到所需尺寸,再压缩。',
    options: [
      {
        label: '压缩',
        toolId: 'image-batch-compress',
        best: '尺寸不变但想减小体积时。',
        pros: ['同样宽高下缩小体积', '可批量处理多张图片', '可调节画质与体积'],
        cons: ['压缩过度会出现可见噪点'],
      },
      {
        label: '缩放',
        toolId: 'image-resize',
        best: '图片比实际需要的大很多时。',
        pros: ['匹配精确像素尺寸或百分比', '大幅缩小尺寸会让体积骤减', '可锁定宽高比'],
        cons: ['缩小后丢失的细节无法找回'],
      },
    ],
    verdict:
      '尺寸合适但文件偏重就压缩。6000px 的照片只需 1200px 宽就先缩放,再压缩以得到最小文件。两者都在浏览器中运行。',
    faqs: [
      {
        q: '应该先缩放还是先压缩?',
        a: '先缩放到你真正需要的尺寸,再压缩。缩放去掉的数据最多,压缩再处理剩下的部分。',
      },
      {
        q: '压缩会改变图片尺寸吗?',
        a: '不会。压缩保持宽高不变,只有缩放才改变像素尺寸。',
      },
    ],
    keywords: ['图片 压缩 缩放', '图片 减小 体积', '图片 缩小', '图片 尺寸 画质'],
  },
  {
    slug: 'md5-vs-sha256',
    category: 'security',
    title: 'MD5 vs SHA-256 — 该用哪种校验和?',
    h1: 'MD5 vs SHA-256',
    description:
      'MD5 快但在安全上已被攻破,SHA-256 是现代标准。如何取舍 — 在浏览器中免费计算两者。',
    intro:
      'MD5 与 SHA-256 都为文件生成定长指纹。MD5 更快,在简单的非安全文件校验中仍常见,但在密码学上已被攻破。SHA-256 是任何涉及篡改场景的现代标准。',
    options: [
      {
        label: 'MD5',
        toolId: 'file-hash',
        best: '不涉及安全的快速完整性校验。',
        pros: ['非常快', '哈希短、便于使用', '下载页仍常公布'],
        cons: ['密码学上已被攻破,碰撞已可实现', '绝不可用于证明文件未被篡改'],
      },
      {
        label: 'SHA-256',
        toolId: 'file-hash',
        best: '校验下载、签名等与安全相关的场景。',
        pros: ['抗碰撞且受信任', '软件发布的标准', '任何完整性保证都推荐使用'],
        cons: ['略慢且哈希更长(几乎不成问题)'],
      },
    ],
    verdict:
      '默认用 SHA-256,它是校验下载或检测篡改的正确选择。仅当你只需要一个快速的一次性指纹且与安全无关时才用 MD5。哈希工具会同时计算两者。',
    faqs: [
      {
        q: 'MD5 用于密码安全吗?',
        a: '不安全。MD5 绝不应用于密码或安全。即使单独的 SHA-256 也不够,密码需要 bcrypt 或 Argon2 这类慢速、带盐的算法。',
      },
      {
        q: '为什么内容不同的两个文件 MD5 相同?',
        a: '那是 MD5 碰撞,正是 MD5 不可用于安全的原因。SHA-256 没有可实现的碰撞。',
      },
    ],
    keywords: ['md5 sha256 区别', 'md5 sha256', '校验和 算法', '哈希 如何选择'],
  },
  {
    slug: 'base64-vs-url-encoding',
    category: 'dev',
    title: 'Base64 vs URL 编码 — 有什么区别?',
    h1: 'Base64 vs URL 编码',
    description:
      'Base64 把二进制转成安全的 ASCII,URL 编码转换在 URL 中不安全的字符。如何取舍 — 在浏览器中用免费工具。',
    intro:
      '名字相似但解决的问题不同。Base64 把任意二进制数据转成安全的 ASCII 字符串(用于嵌入图片、令牌、附件)。URL(百分号)编码则转义在 URL 中不安全的单个字符,如空格和与号。',
    options: [
      {
        label: 'Base64',
        toolId: 'base64',
        best: '把二进制(图片、文件、令牌)以文本形式嵌入。',
        pros: ['可安全地用 ASCII 表示任意二进制', '用于 data URL、JWT、邮件附件', '无损可逆'],
        cons: ['体积增大约 33%', '并非用于让文本变得 URL 安全'],
      },
      {
        label: 'URL 编码',
        toolId: 'url-encoder',
        best: '把文本安全地放进 URL 或查询字符串。',
        pros: ['只转义不安全字符', '保持 URL 与查询参数有效', '体积变化极小'],
        cons: ['无法用于编码二进制文件'],
      },
    ],
    verdict:
      '把文件或令牌以文本形式嵌入用 Base64。把值放进 URL 或查询字符串用 URL 编码。两者有时会组合使用(Base64url),但要按你是在处理二进制还是在构造 URL 来选择。',
    faqs: [
      {
        q: '什么是 Base64url?',
        a: 'Base64 的 URL 安全变体,把「+」和「/」换成「-」和「_」,无需额外转义即可放进 URL。JWT 使用它。',
      },
      {
        q: 'Base64 会加密数据吗?',
        a: '不会。Base64 是编码而非加密,任何人都能解码。需要保密请使用真正的加密工具。',
      },
    ],
    keywords: ['base64 url 编码 区别', '百分号 编码', 'base64 url safe', '编码 区别'],
  },
  {
    slug: 'mp4-vs-webm',
    category: 'video',
    title: 'MP4 vs WebM — 该用哪种视频格式?',
    h1: 'MP4 vs WebM',
    description:
      'MP4 哪里都能播,WebM 更小且开放,适合网页。该用哪个 — 在浏览器中免费转换。',
    intro:
      'MP4 是几乎在任何设备和平台上都能播放的通用视频容器。WebM 是更小、支持透明的现代免版税格式,但支持面没那么广。这是兼容性与轻量、面向网页优化文件之间的取舍。',
    options: [
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: '共享、上传与最大的设备兼容。',
        pros: ['在任何设备、社交应用、播放器上播放', '上传的默认选择', '压缩效果好'],
        cons: ['不支持透明视频', '非免版税'],
      },
      {
        label: 'WebM',
        toolId: 'video-convert',
        best: '注重体积与开放性的网页。',
        pros: ['面向网页体积更小', '开放且免版税', '支持透明'],
        cons: ['部分设备/编辑软件不支持', '社交上传支持参差'],
      },
    ],
    verdict:
      '要随处播放或上传社交平台就用 MP4。要嵌入快速网站或需要透明就用 WebM。可在浏览器中双向转换。',
    faqs: [
      { q: 'YouTube 或 Instagram 用哪个更好?', a: 'MP4。社交平台普遍接受 MP4,而对 WebM 的支持并不一致。' },
      { q: 'WebM 比 MP4 画质更高吗?', a: '相同码率下两者相当;WebM(VP9/AV1)更高效,因此相近画质下体积更小。' },
    ],
    keywords: ['mp4 webm 区别', 'webm mp4', '视频 格式 推荐', 'mp4 webm 转换'],
    relatedConverts: ['webm-to-mp4', 'mp4-to-webm'],
  },
  {
    slug: 'mp3-vs-wav',
    category: 'audio',
    title: 'MP3 vs WAV — 该用哪种音频格式?',
    h1: 'MP3 vs WAV',
    description:
      'MP3 小而通用,WAV 无损且大、适合编辑。如何取舍 — 在浏览器中免费转换。',
    intro:
      'MP3 是通用的有损格式,文件小、随处可播,最适合共享与收听。WAV 无压缩且无损,完整保留原始音频,适合编辑与母带处理,但文件非常大。',
    options: [
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: '共享、流媒体与日常收听。',
        pros: ['文件极小', '任何设备和应用都能播', '可调节码率'],
        cons: ['有损 — 音质低于原始', '不适合归档或繁重编辑'],
      },
      {
        label: 'WAV',
        toolId: 'audio-convert',
        best: '编辑、母带处理与无损归档。',
        pros: ['完全无损的原始音频', '编辑的标准', '兼容性广'],
        cons: ['文件非常大', '不利于共享/流媒体'],
      },
    ],
    verdict:
      '共享或收听用 MP3。编辑音频或保留无损母版用 WAV,完成后再导出为 MP3。可在浏览器中双向转换。',
    faqs: [
      { q: '把 WAV 转成 MP3 会损失音质吗?', a: '会,有轻微损失 — MP3 是有损的。在较高码率(256〜320kbps)下差别很难听出。' },
      { q: '能从 MP3 找回原始音质吗?', a: '不能。把 MP3 转成 WAV 只是得到无损容器,无法恢复 MP3 已丢失的细节。' },
    ],
    keywords: ['mp3 wav 区别', 'wav mp3', '音频 格式 音质', 'wav mp3 转换'],
    relatedConverts: ['wav-to-mp3', 'mp3-to-wav'],
  },
  {
    slug: 'jpg-vs-webp',
    category: 'image',
    title: 'JPG vs WebP — 网页照片用哪个?',
    h1: 'JPG vs WebP',
    description:
      'WebP 在相近画质下比 JPG 更小且支持透明,JPG 哪里都能用。在浏览器中免费转换。',
    intro:
      'JPG 是通用的照片格式,任何设备、应用和打印机都支持。WebP 是现代格式,在相近画质下明显更小,并增加透明与动画,最适合网页(不适合极旧软件)。',
    options: [
      {
        label: 'JPG',
        toolId: 'image-convert',
        best: '最大兼容、打印与通用共享。',
        pros: ['任何设备和应用都能打开', '任何打印机和网站都接受', '可调节画质'],
        cons: ['同等画质下比 WebP 大', '不支持透明'],
      },
      {
        label: 'WebP',
        toolId: 'image-convert',
        best: '注重页面体积与速度的网页照片。',
        pros: ['相近画质下比 JPG 更小', '支持透明与动画', '所有现代浏览器都支持'],
        cons: ['不适合极旧软件', '部分印刷流程偏好 JPG'],
      },
    ],
    verdict:
      '要做快速网站就用 WebP 减轻图像体积。需要随处打开、随处打印的照片就用 JPG。可在浏览器中瞬间双向转换。',
    faqs: [
      { q: 'WebP 总是比 JPG 小吗?', a: '通常相近画质下 WebP 小 25〜35%。某些图像差距较小,但 WebP 很少会输。' },
      { q: '应该把整个网站都换成 WebP 吗?', a: '对照片来说,带 JPG 回退的 WebP 是常见且稳妥的选择。现代浏览器都支持 WebP。' },
    ],
    keywords: ['jpg webp 区别', 'webp jpg', '网页 图片 格式', 'jpg webp 转换'],
    relatedConverts: ['jpg-to-webp', 'webp-to-jpg'],
  },
  {
    slug: 'epub-vs-pdf',
    category: 'docs',
    title: 'EPUB vs PDF — 电子书用哪个?',
    h1: 'EPUB vs PDF',
    description:
      'EPUB 可在任何屏幕上重排,PDF 保持固定版式。电子书与文档如何取舍 — 在浏览器中免费转换。',
    intro:
      'EPUB 与 PDF 解决不同的阅读问题。EPUB 让文字在任何屏幕上重排,读者可调整字号,最适合电子阅读器和手机上的小说与长文。PDF 保持与打印一致的固定版式,适合版式不可改变的表单、报告和图文书。',
    options: [
      {
        label: 'EPUB',
        toolId: 'pdf-to-epub',
        best: '电子阅读器和手机上的重排阅读(小说、长文)。',
        pros: ['文字在任何屏幕上重排', '读者可调整字体与字号', '体积小,是电子阅读器标准'],
        cons: ['不适合固定版式', '不同阅读器显示有差异'],
      },
      {
        label: 'PDF',
        toolId: 'epub-to-pdf',
        best: '打印、表单与图文文档的固定版式。',
        pros: ['任何地方版式一致', '最适合打印', '通用查看'],
        cons: ['在小屏幕上难读', '不能重排或调整字号'],
      },
    ],
    verdict:
      '在手机或电子阅读器上读小说用 EPUB。打印、共享表单或需要精确保留版式用 PDF。可在浏览器中双向转换。',
    faqs: [
      { q: '手机上用哪个更好?', a: 'EPUB。文字会随屏幕重排,无需像固定 PDF 那样捏合缩放。' },
      { q: '把 EPUB 转成 PDF 会保留版式吗?', a: '会从 EPUB 内容生成固定版式的 PDF。精确分页取决于源数据,但文字与图像都会保留。' },
    ],
    keywords: ['epub pdf 区别', 'pdf epub', '电子书 格式', 'epub pdf 转换'],
    relatedConverts: ['epub-to-pdf'],
  },
  {
    slug: 'csv-vs-json',
    category: 'docs',
    title: 'CSV vs JSON — 该用哪种数据格式?',
    h1: 'CSV vs JSON',
    description:
      'CSV 是任何表格软件都能读的扁平表,JSON 是面向 API 与配置的嵌套结构。如何取舍 — 在浏览器中免费转换。',
    intro:
      'CSV 与 JSON 以不同形态存储数据。CSV 是扁平的逗号分隔表,最适合表格软件和简单的行列数据。JSON 可嵌套对象与数组,最适合 API、配置和层级数据。按数据是表还是树来选择。',
    options: [
      {
        label: 'CSV',
        toolId: 'csv-json',
        best: '面向表格软件、导入导出的扁平表数据。',
        pros: ['任何表格软件和数据库都能打开', '小而简单', '便于按行对比'],
        cons: ['无法表达嵌套/层级数据', '没有类型或格式', '存在编码/分隔符陷阱'],
      },
      {
        label: 'JSON',
        toolId: 'csv-json',
        best: 'API、配置、应用状态等嵌套数据。',
        pros: ['可表达嵌套的对象与数组', '任何语言都能原生解析', '具备基本类型(数字、布尔、null)'],
        cons: ['作为表格不易查看', '比 CSV 大', '手工批量编辑繁琐'],
      },
    ],
    verdict:
      '简单的行列表用 CSV。嵌套数据、API 负载或配置用 JSON。可在浏览器中瞬间双向转换 — 无需上传。',
    faqs: [
      { q: '任何 CSV 都能转成 JSON 吗?', a: '可以。每一行变成以表头为键的对象。从深度嵌套的 JSON 转回 CSV 可能需要先扁平化。' },
      { q: 'Excel 用哪个更好?', a: 'CSV。Excel 可直接作为工作表打开。JSON 需要先导入或转换。' },
    ],
    keywords: ['csv json 区别', 'json csv', '数据 格式', 'csv json 转换'],
    relatedConverts: ['csv-to-json', 'json-to-csv'],
  },
  {
    slug: 'mp4-vs-mov',
    category: 'video',
    title: 'MP4 vs MOV — 该用哪种视频格式?',
    h1: 'MP4 vs MOV',
    description:
      'MOV 最适合在苹果设备上编辑,MP4 哪里都能播放和上传。如何取舍 — 在浏览器中免费转换。',
    intro:
      'MOV 与 MP4 是近亲,常装入相同的 H.264/H.265 视频。MOV 是苹果的 QuickTime 容器,是 iPhone 录制的默认格式,也便于在 Mac 上编辑。MP4 是通用的分发容器,任何设备都能播放,并能干净地上传到任何平台。',
    options: [
      {
        label: 'MOV',
        toolId: 'video-convert',
        best: '在苹果生态中录制与编辑。',
        pros: ['iPhone 录制的默认格式', '便于在 Mac 编辑应用中处理', '可装入高画质素材'],
        cons: ['在 Windows、网页上支持弱', '文件较大', '社交上传支持参差'],
      },
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: '共享、上传与随处播放。',
        pros: ['任何设备和平台都能播放', '社交与网页上传的标准', '压缩效果好'],
        cons: ['更偏向分发而非编辑', '不支持透明'],
      },
    ],
    verdict:
      '在 Mac 或直接从 iPhone 编辑用 MOV 即可。要共享、上传或跨设备播放就转成 MP4。在浏览器中可快速切换。',
    faqs: [
      { q: '把 MOV 转成 MP4 会损失画质吗?', a: '若只是重新封装相同编码,画质几乎不变。重新编码会带来轻微、通常不易察觉的损失。' },
      { q: '为什么我的 MOV 无法上传?', a: '部分平台拒绝 MOV 或其编码。转成 MP4(H.264)是最兼容的解决办法。' },
    ],
    keywords: ['mp4 mov 区别', 'mov mp4', '视频 格式 推荐', 'mov mp4 转换'],
    relatedConverts: ['mov-to-mp4', 'mp4-to-mov'],
  },
  {
    slug: 'docx-vs-pdf',
    category: 'docs',
    title: 'DOCX vs PDF — 该发哪个?',
    h1: 'DOCX vs PDF',
    description:
      'DOCX 可编辑,PDF 锁定版式、随处显示一致。发送时如何选择 — 在浏览器中免费转换。',
    intro:
      'DOCX 与 PDF 处于文档生命周期的两端。DOCX(Word)面向写作与协作,完全可编辑,支持修订与批注。PDF 面向分发,采用固定版式,在任何设备上显示一致,不易被误改。许多文档以 DOCX 开始、以 PDF 送达。',
    options: [
      {
        label: 'DOCX',
        toolId: 'docx-to-pdf',
        best: '文档的写作、编辑与协作。',
        pros: ['可完全编辑文字与格式', '支持批注与修订', '草稿阶段的 Office 标准'],
        cons: ['不同查看器版式会变', '需要 Word 或兼容应用', '容易被误改'],
      },
      {
        label: 'PDF',
        toolId: 'pdf-to-word',
        best: '发送需随处显示一致的最终文档。',
        pros: ['任何设备版式一致', '共享、打印、签署的标准', '不易被误改'],
        cons: ['不适合自由编辑', '再次编辑需要转换'],
      },
    ],
    verdict:
      '还在写作或协作就保持 DOCX。发送供审阅、打印或签署的最终版就转成 PDF。想再次编辑 PDF,可在浏览器中转回 Word。',
    faqs: [
      { q: 'DOCX 转 PDF 会保留格式吗?', a: '会。PDF 冻结当前版式,因此随处显示一致。这正是它适合发送的原因。' },
      { q: '能把 PDF 转回 Word 吗?', a: '可以。PDF 转 Word 工具把文字提取为可在 Word 或兼容应用中打开的可编辑 .doc。' },
    ],
    keywords: ['docx pdf 区别', 'word pdf', '文档 发送 格式', 'docx pdf 转换'],
    relatedConverts: ['docx-to-pdf', 'pdf-to-word'],
  },
  {
    slug: 'aac-vs-mp3',
    category: 'audio',
    title: 'AAC vs MP3 — 该用哪种音频格式?',
    h1: 'AAC vs MP3',
    description:
      'AAC 在低码率下音质更好,MP3 几乎随处都能播。如何取舍 — 在浏览器中免费转换。',
    intro:
      'AAC 与 MP3 都是有损音频,但 AAC 是更新的后继者。相同码率下 AAC 通常音质更好,尤其在低码率时更明显,因此成为流媒体与苹果设备的默认。MP3 较老,却能在迄今为止的任何设备、应用和车载音响上播放。',
    options: [
      {
        label: 'AAC',
        toolId: 'audio-convert',
        best: '流媒体、苹果设备与低码率音频。',
        pros: ['同等体积下音质比 MP3 好', '流媒体/广播的标准', '低码率下高效'],
        cons: ['通用性略逊于 MP3', '裸 AAC 的容器较简陋', '极旧设备支持参差'],
      },
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: '在任何设备上的最大兼容。',
        pros: ['几乎随处都能播', '可调节码率', '文件小且广为人知'],
        cons: ['同等体积下音质略逊于 AAC', '在极低码率下较弱'],
      },
    ],
    verdict:
      '看重每兆字节的音质,或身处苹果生态就用 AAC。需要新旧设备都能播放的文件就用 MP3。可在浏览器中双向转换。',
    faqs: [
      { q: 'AAC 明显比 MP3 好吗?', a: '在低码率下是的 — AAC 能保留 MP3 丢失的细节。在高码率下两者都很好,差别难以听出。' },
      { q: '把 MP3 转成 AAC 会提升音质吗?', a: '不会。两者都是有损,转换无法找回已丢失的细节。请尽量从最高质量的源转换。' },
    ],
    keywords: ['aac mp3 区别', 'mp3 aac', '音频 格式 推荐', 'aac mp3 转换'],
    relatedConverts: ['mp3-to-aac', 'aac-to-mp3'],
  },
  {
    slug: 'webp-vs-avif',
    category: 'image',
    title: 'WebP vs AVIF — 该用哪种次世代图片格式?',
    h1: 'WebP vs AVIF',
    description:
      'AVIF 压缩得更小,WebP 支持面更广。该用哪种次世代格式 — 在浏览器中免费转换。',
    intro:
      'WebP 与 AVIF 都是在体积上胜过 JPG、PNG 的现代格式。AVIF(基于 AV1)在相同画质下通常更小并支持 HDR,但编码更慢且尚未全面支持。WebP 早几年,几乎当前所有浏览器和许多编辑软件都支持。',
    options: [
      {
        label: 'WebP',
        toolId: 'image-convert',
        best: '现在就需要广泛可靠支持的网页图像。',
        pros: ['比 JPG/PNG 更小', '当前所有浏览器都支持', '支持透明与动画'],
        cons: ['比 AVIF 略大', '不适合极旧软件'],
      },
      {
        label: 'AVIF',
        toolId: 'image-convert',
        best: '在高画质下榨出尽可能最小的文件。',
        pros: ['顶级压缩', '宽色域与 HDR', '支持透明'],
        cons: ['编码更慢', '旧浏览器/应用不支持', '支持的编辑工具较少'],
      },
    ],
    verdict:
      '想要最小文件且受众使用现代浏览器就用 AVIF。想要现在就安全、广泛的支持就用 WebP。可在浏览器中双向转换。',
    faqs: [
      { q: 'AVIF 总是比 WebP 小吗?', a: '通常相同画质下 AVIF 更小,在细节丰富的照片上尤为明显。简单图形上差距会缩小。' },
      { q: '所有浏览器都能打开 AVIF 吗?', a: '当前多数浏览器都能,但支持比 WebP 新。为最大覆盖,带 JPG 回退的 WebP 仍最稳妥。' },
    ],
    keywords: ['webp avif 区别', 'avif webp', '次世代 图片 格式', 'webp avif 转换'],
    relatedConverts: ['webp-to-avif', 'avif-to-webp'],
  },
  {
    slug: 'svg-vs-png',
    category: 'image',
    title: 'SVG vs PNG — 徽标与图标用哪个?',
    h1: 'SVG vs PNG',
    description:
      'SVG 任意放大都不模糊,PNG 是固定像素的位图。徽标与图标如何取舍 — 在浏览器中免费转换。',
    intro:
      'SVG 与 PNG 解决不同问题。SVG 是矢量,由数学描述绘制,任何尺寸都保持清晰,并可作为代码编辑,最适合徽标、图标和简单图形。PNG 是固定像素的位图,具备无损画质与透明,适合截图、细节丰富的图形以及 SVG 无法表达的照片类内容。',
    options: [
      {
        label: 'SVG',
        toolId: 'image-svg-to-png',
        best: '需要清晰缩放的徽标、图标与图形。',
        pros: ['任何尺寸都无限清晰', '简单图形体积极小', '可作为代码编辑'],
        cons: ['无法表现照片', '部分应用/文档不支持', '复杂图画时较重'],
      },
      {
        label: 'PNG',
        toolId: 'image-convert',
        best: '带透明的截图或细节丰富的图形。',
        pros: ['无损、无噪点', '支持透明', '随处可打开'],
        cons: ['放大会模糊', '大图体积大', '不是矢量'],
      },
    ],
    verdict:
      '需要任何尺寸都清晰的徽标、图标用 SVG。截图、细节丰富的图像,或需要随处打开就用 PNG。需要固定图像时,可在浏览器中把 SVG 栅格化为 PNG。',
    faqs: [
      { q: '能把 PNG 转回 SVG 吗?', a: '真正意义上不能 — PNG 是像素,只能近似描摹。如果有原始矢量请保留。' },
      { q: '为什么我的 SVG 徽标转成 PNG 后模糊?', a: '请以更高分辨率导出 PNG。位图是固定像素,要按你将使用的最大场景来定尺寸。' },
    ],
    keywords: ['svg png 区别', 'png svg', '徽标 图片 格式', 'svg png 转换'],
    relatedConverts: ['svg-to-png'],
  },
  {
    slug: 'flac-vs-mp3',
    category: 'audio',
    title: 'FLAC vs MP3 — 无损还是小巧?',
    h1: 'FLAC vs MP3',
    description:
      'FLAC 无损、适合归档,MP3 小巧且随处可播。如何取舍 — 在浏览器中免费转换。',
    intro:
      'FLAC 与 MP3 处于两个极端。FLAC 无损,完整保留原始音频,最适合归档与编辑,但文件较大。MP3 有损,丢弃听不见的细节以做成迄今任何设备都能播放的极小文件,最适合共享与便携收听。',
    options: [
      {
        label: 'FLAC',
        toolId: 'audio-convert',
        best: '需保留原始的归档与编辑。',
        pros: ['无损 — 原始音频原样保留', '比 WAV 小', '丰富的元数据与标签'],
        cons: ['比 MP3 大得多', '部分设备不支持', '蓝牙下受限'],
      },
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: '在任何设备上共享与便携收听。',
        pros: ['几乎随处都能播', '文件极小', '可调节码率'],
        cons: ['有损 — 低于原始', '不适合归档母版'],
      },
    ],
    verdict:
      '保留母版或编辑音频用 FLAC。要共享或把手机装满音乐用 MP3。需要变小时,可在浏览器中把 FLAC 转成 MP3。',
    faqs: [
      { q: '能听出 FLAC 与 MP3 的区别吗?', a: '在高码率 MP3(256〜320kbps)下,日常收听中大多数人听不出。FLAC 主要在归档与编辑时才重要。' },
      { q: '把 MP3 转成 FLAC 会提升音质吗?', a: '不会。FLAC 无法找回 MP3 已丢弃的细节。请只从无损源转成 FLAC。' },
    ],
    keywords: ['flac mp3 区别', 'mp3 flac', '无损 有损 音频', 'flac mp3 转换'],
    relatedConverts: ['flac-to-mp3', 'wav-to-flac'],
  },
  {
    slug: 'm4a-vs-mp3',
    category: 'audio',
    title: 'M4A vs MP3 — 该用哪种音频格式?',
    h1: 'M4A vs MP3',
    description:
      'M4A(AAC)每兆字节音质更好,MP3 几乎随处可播。如何取舍 — 在浏览器中免费转换。',
    intro:
      'M4A 与 MP3 都是有损,但 M4A 封装的是更新的 AAC 编码。相同体积下 M4A 通常音质略好,是苹果生态的默认,并支持章节与元数据。MP3 较老,却能在迄今为止的任何设备、应用和车载音响上播放,是共享的稳妥选择。',
    options: [
      {
        label: 'M4A',
        toolId: 'audio-convert',
        best: '苹果设备与每兆字节的音质。',
        pros: ['同等体积下音质比 MP3 好', 'iTunes/苹果的默认', '支持章节与丰富元数据'],
        cons: ['部分旧设备不兼容', '通用性不如 MP3', '支持的编辑工具较少'],
      },
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: '在任何设备上的最大兼容。',
        pros: ['几乎随处都能播', '文件极小', '可调节码率'],
        cons: ['每体积音质略逊', '在极低码率下较弱'],
      },
    ],
    verdict:
      '身处苹果生态,或看重每兆字节的音质就用 M4A。需要新旧设备都能打开的文件就用 MP3。可在浏览器中把 M4A 转成 MP3。',
    faqs: [
      { q: '为什么我的 M4A 在某些设备上无法播放?', a: '旧设备或非苹果设备可能不支持 AAC/M4A。转成 MP3 可在任何地方获得兼容。' },
      { q: 'M4A 转 MP3 会损失音质吗?', a: '两者都是有损,重新编码会有轻微损失。高码率下不易察觉,请从最佳源转换。' },
    ],
    keywords: ['m4a mp3 区别', 'mp3 m4a', '音频 格式 推荐', 'm4a mp3 转换'],
    relatedConverts: ['m4a-to-mp3', 'm4a-to-wav'],
  },
  {
    slug: 'mkv-vs-mp4',
    category: 'video',
    title: 'MKV vs MP4 — 该用哪种视频容器?',
    h1: 'MKV vs MP4',
    description:
      'MKV 适合多轨道的高画质归档,MP4 哪里都能播放和上传。如何取舍 — 在浏览器中免费转换。',
    intro:
      'MKV 与 MP4 都是可装入相同视频的容器。MKV 是灵活的开放容器,可装多条音轨、字幕轨和几乎任意编码,在高画质归档中很受欢迎。MP4 是通用的分发容器,任何设备都能播放,并能干净地上传到任何平台。',
    options: [
      {
        label: 'MKV',
        toolId: 'video-convert',
        best: '带多条音轨/字幕轨的高画质归档。',
        pros: ['多条音轨与字幕轨', '可装入几乎任意编码', '最适合高画质归档'],
        cons: ['设备/社交支持弱', '浏览器直接播放受限', '共享需要转换'],
      },
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: '共享、上传与随处播放。',
        pros: ['任何设备和平台都能播放', '上传的标准', '压缩效果好'],
        cons: ['轨道功能少于 MKV', '更偏向分发而非归档'],
      },
    ],
    verdict:
      '归档带多条音轨与字幕轨的影片用 MKV。要共享、上传或在设备上播放就转成 MP4。在浏览器中可快速切换。',
    faqs: [
      { q: 'MKV 转 MP4 会损失画质吗?', a: '若只是重新封装相同编码,画质不变。重新编码会带来轻微、通常不易察觉的损失。' },
      { q: '为什么我的 MKV 无法播放或上传?', a: '很多设备和平台不支持 MKV。转成 MP4(H.264)是最兼容的解决办法。' },
    ],
    keywords: ['mkv mp4 区别', 'mp4 mkv', '视频 容器 推荐', 'mkv mp4 转换'],
    relatedConverts: ['mkv-to-mp4', 'mkv-to-webm'],
  },
  {
    slug: 'gif-vs-mp4',
    category: 'video',
    title: 'GIF vs MP4 — 短片用哪个?',
    h1: 'GIF vs MP4',
    description:
      'MP4 小得多且更流畅,GIF 哪里都能内联自动播放。短循环如何取舍 — 在浏览器中免费转换。',
    intro:
      'GIF 与 MP4 都展示短动态,但方式大不相同。GIF 是 256 色的老式动画,无声、无控件、随处内联自动播放,最适合小型表情和贴纸,但细节丰富时体积膨胀。MP4 是真正的视频,小得多、全彩且流畅,但它更像视频播放器而非内联图片。',
    options: [
      {
        label: 'GIF',
        toolId: 'video-to-gif',
        best: '小型内联表情、贴纸与梗图。',
        pros: ['随处内联自动播放', '无需播放器或控件', '便于嵌入'],
        cons: ['细节丰富的片段体积巨大', '256 色、有色带', '无声'],
      },
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: '更长、更细致或带声音的内容。',
        pros: ['比 GIF 小得多', '全彩、流畅播放', '支持音频'],
        cons: ['需要视频播放器', '不太适合当「内联图片」'],
      },
    ],
    verdict:
      '小型循环表情或贴纸用 GIF 就够。更长、更多彩或更细致的内容用 MP4 — 体积小得多。可在浏览器中把片段转成 GIF(或保留为 MP4)。',
    faqs: [
      { q: '为什么我的 GIF 这么大?', a: 'GIF 处理细节丰富的动态效率低。裁短时长、减小尺寸与色数,或保留为 MP4 — 往往能小到十分之一。' },
      { q: '能把 MP4 转成 GIF 吗?', a: '可以。使用视频转 GIF 工具。先裁剪并缩小,可让 GIF 保持小巧。' },
    ],
    keywords: ['gif mp4 区别', 'mp4 gif', 'gif 视频', '视频 gif 转换'],
    relatedConverts: ['mp4-to-gif', 'webm-to-gif'],
  },
  {
    slug: 'yaml-vs-json',
    category: 'docs',
    title: 'YAML vs JSON — 该用哪种配置格式?',
    h1: 'YAML vs JSON',
    description:
      'YAML 面向配置、对人友好,JSON 严格且通用、适合数据交换。如何取舍 — 在浏览器中免费转换。',
    intro:
      'YAML 与 JSON 以不同优先级描述同类结构化数据。YAML 使用缩进并支持注释,便于阅读手工编辑的配置文件。JSON 使用花括号、严格且通用 — 任何语言都能原生解析,因此是 API 与数据交换的标准。',
    options: [
      {
        label: 'YAML',
        toolId: 'yaml-json',
        best: '人工编辑的配置文件(CI、Docker、应用设置)。',
        pros: ['非常易读', '支持注释', '符号噪声少'],
        cons: ['对缩进敏感、易出错', '部分环境不支持', '复杂时含义模糊'],
      },
      {
        label: 'JSON',
        toolId: 'yaml-json',
        best: 'API、数据交换与程序间数据。',
        pros: ['随处可原生解析', '严格且无歧义', 'API/数据的标准'],
        cons: ['不支持注释', '符号冗长', '手工编辑不够舒适'],
      },
    ],
    verdict:
      '带注释手工编辑配置用 YAML。在程序间或 API 间交换数据用 JSON。可在浏览器中瞬间双向转换。',
    faqs: [
      { q: 'YAML 是 JSON 的超集吗?', a: '实际上是 — 有效的 JSON 就是有效的 YAML,因此任何 JSON 都能干净地转成 YAML 再转回。' },
      { q: '哪个更不容易出错?', a: 'JSON,因为它的花括号是显式的。YAML 的缩进更易读,但一个多余空格就可能破坏它。' },
    ],
    keywords: ['yaml json 区别', 'json yaml', '配置 格式', 'yaml json 转换'],
    relatedConverts: ['yaml-to-json', 'json-to-yaml'],
  },
  {
    slug: 'markdown-vs-html',
    category: 'docs',
    title: 'Markdown vs HTML — 该用哪个来写?',
    h1: 'Markdown vs HTML',
    description:
      'Markdown 是快速易读的纯文本,HTML 提供完全控制并在任何浏览器中显示。如何取舍 — 在浏览器中免费转换。',
    intro:
      'Markdown 与 HTML 往往最终成为同一个网页。Markdown 是轻量纯文本,写得快、易读、便于版本管理,并能直接转成 HTML。HTML 是 Web 标准,可完全控制结构、样式与媒体,但手写冗长。许多人用 Markdown 写作并导出为 HTML。',
    options: [
      {
        label: 'Markdown',
        toolId: 'md-html',
        best: '快速撰写文档、README 与笔记。',
        pros: ['易读的纯文本', '便于版本管理', '随处可转成 HTML'],
        cons: ['复杂版式有限', '不同渲染器有差异', '样式控制弱'],
      },
      {
        label: 'HTML',
        toolId: 'md-html',
        best: '在网页上完全控制版式、样式与媒体。',
        pros: ['任何浏览器都能打开', '完整的结构与样式', '链接、媒体、脚本'],
        cons: ['手写冗长', '更易出错', '作为源代码不易阅读'],
      },
    ],
    verdict:
      '快速撰写内容并保持易读用 Markdown。需要精确版式或网页功能用 HTML。可在浏览器中把 Markdown 转成 HTML(也可转回)。',
    faqs: [
      { q: '可以在 Markdown 中混用 HTML 吗?', a: '可以。多数 Markdown 渲染器会原样传递 HTML,因此可在需要额外控制处插入 HTML。' },
      { q: 'Markdown 转 HTML 会保留格式吗?', a: '会。标题、列表、链接、代码与强调都会映射到对应的 HTML,并提供实时预览。' },
    ],
    keywords: ['markdown html 区别', 'html markdown', 'markdown html 转换', '写作 格式'],
    relatedConverts: ['md-to-html'],
  },
  {
    slug: 'xlsx-vs-csv',
    category: 'docs',
    title: 'XLSX vs CSV — 该用哪种表格格式?',
    h1: 'XLSX vs CSV',
    description:
      'XLSX 保留公式、格式与多个工作表,CSV 是任何工具都能读的扁平表。如何取舍 — 在浏览器中免费转换。',
    intro:
      'XLSX 与 CSV 都保存表格,但丰富度不同。XLSX 是完整的 Excel 格式,在一个文件中容纳多个工作表、公式、格式与类型。CSV 是逗号分隔的单个扁平表,没有格式,小巧、简单,几乎任何表格软件、数据库和程序都能读取。',
    options: [
      {
        label: 'XLSX',
        toolId: 'xlsx-convert',
        best: '带公式、格式与多个工作表的真正表格。',
        pros: ['保留公式与格式', '一个文件多个工作表', '类型与样式'],
        cons: ['对简单数据过于复杂', '不便于程序处理', '需要 Excel/兼容应用'],
      },
      {
        label: 'CSV',
        toolId: 'xlsx-convert',
        best: '面向导入、导出与程序的表格数据。',
        pros: ['任何工具都能打开', '小巧、简单', '易于生成与解析'],
        cons: ['无公式或格式', '仅单个工作表', '存在编码/分隔符陷阱'],
      },
    ],
    verdict:
      '处理公式、格式或多个工作表用 XLSX。导入、导出或把数据交给程序用 CSV。可在浏览器中相互转换(并可与 JSON 互转)。',
    faqs: [
      { q: '把 XLSX 存成 CSV 会丢失什么吗?', a: '会。CSV 只保留一个工作表的值。公式、格式与其他工作表都会丢失。' },
      { q: '用 Excel 给别人发哪个?', a: '需要公式/格式就发 XLSX;只需要可导入的原始数据就发 CSV。' },
    ],
    keywords: ['xlsx csv 区别', 'excel csv', '表格 格式', 'xlsx csv 转换'],
    relatedConverts: ['csv-to-xlsx', 'xlsx-to-csv'],
  },
];

export function getCompareZh(slug: string): Compare | undefined {
  return COMPARES_ZH.find((c) => c.slug === slug);
}

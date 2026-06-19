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
  {
    slug: 'crontab-builder-vs-cron-explainer',
    category: 'dev',
    title: 'Crontab 生成器 vs Cron 解读器 — 你需要哪个?',
    h1: 'Crontab 生成器 vs Cron 解读器',
    description:
      '生成器按可视化选项帮你写出一条全新的 cron 表达式,解读器把已有表达式翻译成它会在何时运行。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者方向相反。Crontab 生成器面向"我想新建一个定时任务但记不住语法"的场景,让你从下拉选项拼出表达式;Cron 解读器面向"我手里有一条 cron 想确认它到底什么时候跑"的场景。全部在浏览器内解析,表达式不会上传。',
    options: [
      {
        label: 'Crontab 生成器',
        toolId: 'crontab-builder',
        best: '不熟悉语法、想从零搭一个新调度时。',
        pros: ['按分/时/日/月/周选项可视化生成', '无需记忆 cron 的五段语法', '即时预览接下来几次运行时间'],
        cons: ['不适合解读别人写好的复杂表达式'],
      },
      {
        label: 'Cron 解读器',
        toolId: 'cron-explainer',
        best: '已有一条 cron 想读懂并核对它的运行时刻时。',
        pros: ['把表达式翻译成自然语言', '列出接下来的实际触发时间', '帮你核对线上任务是否如预期'],
        cons: ['不会替你从选项生成新表达式'],
      },
    ],
    verdict:
      '从零搭建新调度、又不想记语法,用生成器;手里已有一条表达式、想确认它何时运行,用解读器。常见做法是先用生成器写好,再用解读器复核。',
    faqs: [
      {
        q: '我已经有一条 cron,该用哪个?',
        a: '用 Cron 解读器。把现成的表达式粘进去,它会说明含义并列出接下来的运行时间。生成器是用来从零写新表达式的。',
      },
      {
        q: '两者都支持 5 段标准 cron 语法吗?',
        a: '是的,都按分、时、日、月、周五个字段处理。生成器帮你拼出来,解读器帮你读出来,全部在浏览器本地完成。',
      },
    ],
    keywords: ['crontab 生成器 解读器', 'cron 生成 解释', 'cron 表达式', 'crontab vs cron explainer'],
  },
  {
    slug: 'hash-identifier-vs-text-hash',
    category: 'security',
    title: '哈希识别器 vs 文本哈希生成器 — 你需要哪个?',
    h1: '哈希识别器 vs 文本哈希生成器',
    description:
      '识别器面向"我手里有一段哈希、想猜出它是哪种算法",生成器面向"我有文本、想算出它的哈希"。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者方向相反。哈希识别器从一串已有的哈希出发,根据长度与格式推测它由 MD5、SHA-1、SHA-256 还是 bcrypt 等算法产生;文本哈希生成器则从你的输入文本出发,产出对应的哈希值。全部在浏览器内计算,内容不会上传。',
    options: [
      {
        label: '哈希识别器',
        toolId: 'hash-identifier',
        best: '只有一段哈希、想判断它出自哪种算法时。',
        pros: ['按长度与前缀推测算法', '一次列出多个可能的候选', '帮你在校验前确认哈希类型'],
        cons: ['只是推测,无法反推出原始明文', '相同长度的算法可能难以区分'],
      },
      {
        label: '文本哈希生成器',
        toolId: 'text-hash',
        best: '有文本、想生成 MD5/SHA 等哈希时。',
        pros: ['一次产出多种算法的哈希', '适合做完整性校验与对比', '即时计算、复制即用'],
        cons: ['不会识别外部给定的未知哈希'],
      },
    ],
    verdict:
      '手里只有一段未知哈希、想知道它是什么,用识别器;想为自己的文本生成哈希,用生成器。可以先用生成器算出已知文本的哈希,再用识别器熟悉各算法的长度特征。',
    faqs: [
      {
        q: '识别器能告诉我哈希前的原文吗?',
        a: '不能。哈希是单向的,无法还原原文。识别器只根据长度与格式推测可能的算法。',
      },
      {
        q: '识别结果一定准确吗?',
        a: '它给出的是按长度与前缀做的最可能推测。MD5 与某些算法长度相同,可能需要结合上下文判断。全部在浏览器本地完成。',
      },
    ],
    keywords: ['哈希识别 生成', '哈希算法 判断', 'md5 sha256 识别', 'hash identifier vs text hash'],
  },
  {
    slug: 'css-clamp-vs-css-units',
    category: 'dev',
    title: 'CSS clamp() vs CSS 单位转换器 — 你需要哪个?',
    h1: 'CSS clamp() vs CSS 单位转换器',
    description:
      'clamp() 生成随视口在最小值与最大值之间平滑伸缩的流式尺寸,单位转换器只是把一个固定数值在 px/rem/em/pt 之间换算。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者解决不同问题。CSS clamp() 面向响应式排版,产出一个会随视口宽度在下限与上限之间流动伸缩的值;CSS 单位转换器只做静态换算,把单个固定值在 px、rem、em、pt 之间转换。全部在浏览器内计算,无需上传任何内容。',
    options: [
      {
        label: 'CSS clamp()',
        toolId: 'css-clamp',
        best: '想让字号或间距随视口流式伸缩时。',
        pros: ['一行实现流式响应式尺寸', '设定最小与最大边界更安全', '减少媒体查询断点'],
        cons: ['不适合只想做一次性单位换算的场景'],
      },
      {
        label: 'CSS 单位转换器',
        toolId: 'css-units',
        best: '只需把一个固定值在 px/rem/em/pt 间换算时。',
        pros: ['即时换算 px↔rem↔em↔pt', '按根字号准确对照', '适合统一设计稿数值'],
        cons: ['产出的是静态值,不会随视口变化'],
      },
    ],
    verdict:
      '想要随屏幕尺寸平滑伸缩的响应式值,用 clamp();只想把一个固定数值换成另一种单位,用单位转换器。两者可以配合:先换算出 min/max,再交给 clamp() 生成流式公式。',
    faqs: [
      {
        q: 'clamp() 和单位转换器有什么区别?',
        a: 'clamp() 产出会随视口伸缩的流式尺寸,单位转换器只把一个固定值在 px/rem/em/pt 间换算,结果是静态的。',
      },
      {
        q: '我可以先换算再放进 clamp() 吗?',
        a: '可以。常见做法是用单位转换器确定最小、最大边界,再用 clamp() 把它们组合成流式公式。全部在浏览器本地完成。',
      },
    ],
    keywords: ['css clamp 单位', '响应式 尺寸 换算', 'px rem em pt', 'css clamp vs css units'],
  },
  {
    slug: 'luhn-generator-vs-cc-validate',
    category: 'security',
    title: 'Luhn 测试号码生成器 vs 卡号校验器 — 你需要哪个?',
    h1: 'Luhn 生成器 vs 卡号校验器',
    description:
      '生成器产出符合 Luhn 校验的测试号码供 QA 与表单使用,校验器则核对一个已有号码的 Luhn 校验位。这些都是测试专用号码,并非真实有效账户。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者方向相反,但都仅用于测试。Luhn 生成器为 QA、表单与示例产出能通过 Luhn 算法的占位号码;卡号校验器则检查一个已有号码的校验位是否合法。务必注意:两者都只针对 Luhn 数学,生成或通过校验都不代表是真实、可用的账户。全部在浏览器内计算,不会上传。',
    options: [
      {
        label: 'Luhn 测试号码生成器',
        toolId: 'luhn-generator',
        best: '需要能通过校验的测试号码来填表单或写用例时。',
        pros: ['批量生成符合 Luhn 的测试号码', '适合 QA、表单与演示填充', '纯随机生成,不对应任何真实账户'],
        cons: ['仅供测试,绝不可当作真实支付凭据'],
      },
      {
        label: '卡号校验器',
        toolId: 'cc-validate',
        best: '想核对一个号码的 Luhn 校验位是否合法时。',
        pros: ['即时校验 Luhn 校验位', '识别常见发卡机构号段', '帮你在提交前提前发现录入错误'],
        cons: ['通过校验只说明格式合法,不代表账户真实存在'],
      },
    ],
    verdict:
      '需要拿来测试的占位号码,用生成器;想检查一个号码格式是否合法,用校验器。请记住:这些都是测试专用号码,既不对应也不暗示任何真实、可用的账户。',
    faqs: [
      {
        q: '生成的号码能用来真正付款吗?',
        a: '不能。它们只是满足 Luhn 算法的随机测试号码,并不对应任何真实账户,严禁用于实际支付。',
      },
      {
        q: '号码通过校验器就代表它有效吗?',
        a: '只代表它通过了 Luhn 校验、格式合法,并不代表背后存在真实、可用的账户。一切都在浏览器本地完成。',
      },
    ],
    keywords: ['luhn 测试 卡号', '信用卡 校验 luhn', '测试 卡号 生成', 'luhn generator vs cc validate'],
  },
  {
    slug: 'json-schema-vs-json-to-ts',
    category: 'dev',
    title: 'JSON Schema 生成器 vs JSON 转 TypeScript — 你需要哪个?',
    h1: 'JSON Schema vs JSON 转 TypeScript',
    description:
      'JSON Schema 用于运行时校验数据,JSON 转 TypeScript 产出编译期的类型与接口。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者都从 JSON 推导结构,但用途在不同阶段。JSON Schema 生成器产出可在运行时校验数据的 schema,适合接口边界与表单验证;JSON 转 TypeScript 产出编译期的 type/interface,让编辑器与 tsc 在写代码时就帮你抓错。全部在浏览器内推导,数据不会上传。',
    options: [
      {
        label: 'JSON Schema 生成器',
        toolId: 'json-schema',
        best: '需要在运行时校验进来的数据时。',
        pros: ['产出可校验的 draft schema', '适合 API、表单与配置验证', '语言无关,任何端都能用'],
        cons: ['不直接提供编辑器里的类型提示'],
      },
      {
        label: 'JSON 转 TypeScript',
        toolId: 'json-to-ts',
        best: '需要编译期类型安全与编辑器提示时。',
        pros: ['产出 type/interface 定义', '让 tsc 与 IDE 提前抓错', '直接贴进 TS 项目即可用'],
        cons: ['只在编译期生效,不校验运行时数据'],
      },
    ],
    verdict:
      '想在运行时拦住非法数据,用 JSON Schema;想在写代码时获得类型提示与编译检查,用 JSON 转 TypeScript。两者常配合使用:用 TS 类型写代码,用 schema 在边界校验输入。',
    faqs: [
      {
        q: '运行时校验和编译期类型有什么区别?',
        a: 'JSON Schema 在程序运行时检查实际数据是否合法,TypeScript 类型只在编译/编辑阶段帮你抓错,运行时并不会校验数据。',
      },
      {
        q: '可以两个都用吗?',
        a: '可以,而且推荐。用 TS 类型获得编辑器与编译检查,再用 JSON Schema 在 API 或表单边界校验真实输入。全部在浏览器本地完成。',
      },
    ],
    keywords: ['json schema typescript', '运行时 编译 校验', 'json 类型 生成', 'json schema vs json to ts'],
  },
  {
    slug: 'markdown-table-vs-html-table',
    category: 'docs',
    title: 'Markdown 表格 vs HTML 表格 — 你需要哪个?',
    h1: 'Markdown 表格 vs HTML 表格',
    description:
      'Markdown 表格生成 GitHub 风格的纯文本表格,适合 README 与文档;CSV 转 HTML 表格产出 HTML <table> 标签,适合网页与邮件。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者输出不同的标记。Markdown 表格生成器产出 GitHub 风格的 Markdown 表格,适合放进 README、文档和 wiki;CSV 转 HTML 表格则产出 HTML <table> 标签,适合直接嵌入网页或邮件。全部在浏览器内生成,数据不会上传。',
    options: [
      {
        label: 'Markdown 表格生成器',
        toolId: 'markdown-table-gen',
        best: '为 README、文档或 wiki 制作表格时。',
        pros: ['产出 GitHub 风格 Markdown 表格', '纯文本、便于版本管理', '可读性好、易于手动微调'],
        cons: ['不能直接当成 HTML 嵌入网页'],
      },
      {
        label: 'CSV 转 HTML 表格',
        toolId: 'csv-to-html',
        best: '需要可嵌入网页或邮件的表格时。',
        pros: ['产出标准 HTML <table> 标签', '可直接粘进页面或邮件模板', '便于用 CSS 进一步样式化'],
        cons: ['对纯文档场景而言过于冗长'],
      },
    ],
    verdict:
      '写 README、文档或 wiki,用 Markdown 表格;要嵌进网页或邮件,用 CSV 转 HTML。许多 Markdown 在渲染时也会转成 HTML,但源文件的可读性与可维护性正是两者取舍的关键。',
    faqs: [
      {
        q: 'Markdown 表格能直接放进网页吗?',
        a: '需要先经过 Markdown 渲染才会变成 HTML。如果想要可直接嵌入的标签,用 CSV 转 HTML 表格更直接。',
      },
      {
        q: '哪种更便于手动编辑?',
        a: 'Markdown 表格是纯文本,改起来和读起来都更轻松;HTML 表格更冗长,但能直接嵌入页面并用 CSS 样式化。全部在浏览器本地完成。',
      },
    ],
    keywords: ['markdown html 表格', '表格 标记 区别', 'readme 网页 表格', 'markdown table vs html table'],
  },
  {
    slug: 'world-clock-vs-timezone-converter',
    category: 'util',
    title: '世界时钟 vs 时区转换器 — 你需要哪个?',
    h1: '世界时钟 vs 时区转换器',
    description:
      '世界时钟让你一眼看到多个城市的当前时间,时区转换器把某个具体时间在两个时区之间换算。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者侧重不同。世界时钟把多个城市的当前时间并排显示,适合随时扫一眼;时区转换器则针对某个具体的日期时间,在两个时区之间精确换算。全部在浏览器本地计算,无需联网上传。',
    options: [
      {
        label: '世界时钟',
        toolId: 'world-clock',
        best: '想一眼看到多个城市此刻几点时。',
        pros: ['同屏并排显示多地当前时间', '适合跨地区团队随时参照', '直观掌握时差关系'],
        cons: ['不擅长换算某个未来的具体时间点'],
      },
      {
        label: '时区转换器',
        toolId: 'timezone',
        best: '想把某个具体时间在两个时区间换算时。',
        pros: ['精确换算指定日期与时间', '适合安排会议与跨时区约定', '清楚显示两端对应时刻'],
        cons: ['一次只方便对照两个时区'],
      },
    ],
    verdict:
      '想随时扫一眼多地此刻几点,用世界时钟;要把某个具体时间在两地之间换算清楚,用时区转换器。安排跨时区会议时,常先用世界时钟选个合适时段,再用转换器敲定准确时间。',
    faqs: [
      {
        q: '我要安排跨时区会议,该用哪个?',
        a: '先用世界时钟扫一眼各地此刻几点选个合适窗口,再用时区转换器把那个具体时间换算到每个参会者的时区。',
      },
      {
        q: '它们会自动处理夏令时吗?',
        a: '两者都基于浏览器的时区数据计算,会按各地规则反映夏令时。全部在浏览器本地完成。',
      },
    ],
    keywords: ['世界时钟 时区转换', '多地 时间 时差', '时区 换算', 'world clock vs timezone converter'],
  },
  {
    slug: 'readability-vs-word-count',
    category: 'text',
    title: '可读性评分 vs 字数统计 — 你需要哪个?',
    h1: '可读性评分 vs 字数统计',
    description:
      '可读性评分衡量文本读起来有多容易(Flesch 易读度/年级),字数统计只数字数、字符数与长度。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者测量不同维度。可读性评分用 Flesch 易读度或年级等指标衡量文本的阅读难度,告诉你"读起来累不累";字数统计则只给出字数、字符数与长度等原始数量指标。全部在浏览器本地分析,内容不会上传。',
    options: [
      {
        label: '可读性评分',
        toolId: 'readability-score',
        best: '想知道文本读起来有多难时。',
        pros: ['给出 Flesch 易读度与年级', '帮你判断是否需要简化句子', '适合面向大众的文案打磨'],
        cons: ['不替代精确的字数/长度统计'],
      },
      {
        label: '字数与字符统计',
        toolId: 'text-count',
        best: '只想知道篇幅、字数与字符数时。',
        pros: ['即时统计字数、字符数与长度', '适合卡字数限制的场景', '简单直接、无需配置'],
        cons: ['不衡量文本的阅读难度'],
      },
    ],
    verdict:
      '想评估并改善阅读难度,用可读性评分;只关心篇幅与字数限制,用字数统计。打磨文案时常两者并用:先用字数控制篇幅,再用可读性确认它好不好读。',
    faqs: [
      {
        q: '可读性评分和字数统计有什么区别?',
        a: '可读性评分衡量文本读起来有多容易,字数统计只给出字数、字符数与长度等数量指标,不评估难度。',
      },
      {
        q: '我能同时优化篇幅和易读度吗?',
        a: '可以。先用字数统计把篇幅控制在限制内,再用可读性评分确认表达是否清晰易读。全部在浏览器本地完成。',
      },
    ],
    keywords: ['可读性 字数 统计', '阅读难度 篇幅', 'flesch 字数', 'readability vs word count'],
  },
  {
    slug: 'bill-split-vs-tip-calculator',
    category: 'util',
    title: '账单分摊 vs 小费计算器 — 你需要哪个?',
    h1: '账单分摊 vs 小费计算器',
    description:
      '账单分摊把含税含小费的总额在多人之间平摊,小费计算器只算一笔账单该给多少小费。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者解决聚餐结账的不同环节。账单分摊把包含税费和小费的总额按人数平均分配,告诉每人该付多少;小费计算器则只负责算出某个小费比例对应的金额。全部在浏览器本地计算,无需上传任何信息。',
    options: [
      {
        label: '账单分摊',
        toolId: 'bill-split',
        best: '多人聚餐想把总额平摊到每个人时。',
        pros: ['把含税含小费的总额按人数平分', '一步算出每人应付金额', '适合 AA 制结账'],
        cons: ['只算小费时显得多余'],
      },
      {
        label: '小费计算器',
        toolId: 'tip-calc',
        best: '只想算某笔账单该给多少小费时。',
        pros: ['按比例快速算出小费金额', '即时显示含小费的总额', '简单直接、单人即可用'],
        cons: ['不负责把账单分摊到多人'],
      },
    ],
    verdict:
      '多人一起结账、想平摊总额,用账单分摊;只想算清一笔账单该给多少小费,用小费计算器。两者常配合:先用小费计算器定下小费,再用账单分摊把含小费的总额平分到每个人。',
    faqs: [
      {
        q: '账单分摊里已经包含小费吗?',
        a: '账单分摊会把含税含小费的总额按人数平分。如果你只想单独算小费金额,用小费计算器更合适。',
      },
      {
        q: '我可以先算小费再分摊吗?',
        a: '可以。常见做法是先用小费计算器确定小费,再用账单分摊把含小费的总额平均分给每个人。全部在浏览器本地完成。',
      },
    ],
    keywords: ['账单 分摊 小费', 'aa 结账 平摊', '小费 计算', 'bill split vs tip calculator'],
  },
  {
    slug: 'ideal-weight-vs-bmi',
    category: 'util',
    title: '理想体重 vs BMI 计算器 — 你需要哪个?',
    h1: '理想体重 vs BMI 计算器',
    description:
      '理想体重根据身高估算一个目标体重区间(Devine/BMI-22),BMI 计算器则用你当前的身高体重评估胖瘦状态。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '两者方向相反。理想体重从身高出发,用 Devine 公式或 BMI-22 估算一个目标体重区间,告诉你"该往哪个范围努力";BMI 计算器则从你当前的身高与体重出发,算出身体质量指数来评估现状。全部在浏览器本地计算,数据不会上传。',
    options: [
      {
        label: '理想体重',
        toolId: 'ideal-weight',
        best: '想知道按身高该达到的目标体重区间时。',
        pros: ['按身高估算目标体重范围', '提供 Devine 与 BMI-22 等参考', '适合设定健身目标'],
        cons: ['是基于身高的估算,不代表个人最佳值'],
      },
      {
        label: 'BMI 计算器',
        toolId: 'bmi-calc',
        best: '想用当前身高体重评估胖瘦状态时。',
        pros: ['用当前身高体重算出 BMI', '对照 WHO 区间判断现状', '快速了解偏轻/正常/偏重'],
        cons: ['不区分肌肉与脂肪,仅供参考'],
      },
    ],
    verdict:
      '想知道按身高该瞄准的目标范围,用理想体重;想评估当前体重处于什么状态,用 BMI 计算器。两者可配合:先用 BMI 看现状,再用理想体重定一个目标区间。两者都是参考估算,不替代专业医疗建议。',
    faqs: [
      {
        q: '理想体重和 BMI 有什么区别?',
        a: '理想体重根据身高估算一个目标体重区间,BMI 则用你当前的身高体重评估现在的胖瘦状态。',
      },
      {
        q: '这些数字能当医疗建议吗?',
        a: '不能。两者都是基于通用公式的参考估算,不区分肌肉与脂肪,具体请咨询专业人士。全部在浏览器本地完成。',
      },
    ],
    keywords: ['理想体重 bmi', '目标体重 身高', 'bmi 体重 评估', 'ideal weight vs bmi'],
  },
  {
    slug: 'ovulation-vs-due-date',
    category: 'util',
    title: '排卵期计算器 vs 预产期计算器 — 你该用哪个?',
    h1: '排卵期计算器 vs 预产期计算器',
    description:
      '排卵期计算器帮你找出备孕的易孕窗口,预产期计算器在已怀孕后估算生产日期。两者都只是估算、并非医疗建议 — 免费,在浏览器中完成。',
    intro:
      '这两个工具对应怀孕旅程的不同阶段。排卵期计算器从末次月经和周期长度推算易孕窗口与排卵日,用于备孕;预产期计算器在已经怀孕后,按内格勒法则(末次月经 +280 天)估算预计生产日期。两者都只是基于通用公式的估算,不能替代医生或助产士的专业判断,所有计算都在浏览器本地完成。',
    options: [
      {
        label: '排卵期计算器',
        toolId: 'ovulation-calc',
        best: '正在备孕、想知道何时最易受孕时。',
        pros: ['从末次月经和周期长度推算易孕窗口', '标出可能的排卵日,便于安排', '帮助计划备孕时机'],
        cons: ['只是估算,排卵会因身体状况而波动', '不是医疗建议,也不能用于避孕'],
      },
      {
        label: '预产期计算器',
        toolId: 'pregnancy-due-date',
        best: '已经怀孕、想估算大致生产日期时。',
        pros: ['按内格勒法则估算预计生产日期', '从末次月经快速算出 280 天后日期', '便于规划产检与待产安排'],
        cons: ['只是估算,真实生产日期常有出入,以医生判断为准'],
      },
    ],
    verdict:
      '还在备孕、想找易孕窗口,用排卵期计算器;已经怀孕、想知道大致生产日期,用预产期计算器。两者都只是基于通用公式的估算,并非医疗建议,具体请以医生或助产士的判断为准。全部在浏览器本地完成。',
    faqs: [
      {
        q: '排卵期计算器和预产期计算器有什么区别?',
        a: '排卵期计算器用于备孕,从末次月经和周期长度推算最易受孕的窗口;预产期计算器用于已怀孕后,估算大致的生产日期。',
      },
      {
        q: '这些日期准确吗、能当医疗建议吗?',
        a: '不能。两者都是基于通用公式的估算,排卵和生产日期都会因个体差异而波动,具体请咨询专业医生。全部在浏览器本地完成。',
      },
    ],
    keywords: ['排卵期 预产期', '易孕窗口 计算', '怀孕 预产期 估算', 'ovulation vs due date'],
  },
  {
    slug: 'date-add-vs-date-diff',
    category: 'util',
    title: '日期加减 vs 日期间隔 — 你该用哪个?',
    h1: '日期加减 vs 日期间隔',
    description:
      '日期加减把某个日期向前或向后推算若干天/周/月/年,日期间隔计算两个日期之间相差多少。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '这两个工具方向相反。日期加减以一个日期为起点,加上或减去若干天、周、月、年,得到未来或过去的某一天;日期间隔则给定两个日期,算出它们之间相差的天数或时长。两者都在浏览器本地计算,不上传任何数据。',
    options: [
      {
        label: '日期加减',
        toolId: 'date-add',
        best: '想从某天推算出未来或过去的日期时。',
        pros: ['按天/周/月/年向前或向后推算', '适合算截止日、到期日、纪念日', '自动处理月末与闰年'],
        cons: ['不能用来测量两个已知日期的间隔'],
      },
      {
        label: '日期间隔',
        toolId: 'date-diff',
        best: '想知道两个日期之间相差多久时。',
        pros: ['算出两个日期之间的天数或时长', '适合计算工龄、倒数、年龄', '直接输入起止日期即可'],
        cons: ['不能从一个日期推算出另一个日期'],
      },
    ],
    verdict:
      '想从一个日期推算出另一天,用日期加减;想测量两个已知日期之间的间隔,用日期间隔。两者都在浏览器本地完成。',
    faqs: [
      {
        q: '日期加减和日期间隔有什么区别?',
        a: '日期加减是从一个日期推算出另一个日期(如「90 天后是哪天」),日期间隔是测量两个日期相差多少(如「这两天之间有几天」)。',
      },
      {
        q: '会自动处理月末和闰年吗?',
        a: '会。日期加减在跨月、跨年和闰年时会自动校正,计算全部在浏览器本地完成,不上传日期。',
      },
    ],
    keywords: ['日期加减 间隔', '日期 推算 相差', '日期计算 天数', 'date add vs date diff'],
  },
  {
    slug: 'csv-to-sql-vs-csv-to-html',
    category: 'docs',
    title: 'CSV 转 SQL vs CSV 转 HTML 表格 — 你该用哪个?',
    h1: 'CSV 转 SQL vs CSV 转 HTML 表格',
    description:
      'CSV 转 SQL 生成 INSERT 语句把数据导入数据库,CSV 转 HTML 表格生成可放进网页的 <table>。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '这两个工具把同一份 CSV 变成不同的目标格式。CSV 转 SQL 生成一条条 INSERT 语句,用于把数据加载进数据库;CSV 转 HTML 表格则生成一个 HTML <table>,直接展示在网页上。两者都在浏览器本地解析,数据不会被上传。',
    options: [
      {
        label: 'CSV 转 SQL',
        toolId: 'csv-to-sql',
        best: '想把表格数据导入数据库时。',
        pros: ['生成可直接执行的 INSERT 语句', '自动处理列名与引号转义', '适合建表初始化或批量导入'],
        cons: ['输出是 SQL,不能直接显示在网页上'],
      },
      {
        label: 'CSV 转 HTML 表格',
        toolId: 'csv-to-html',
        best: '想把数据展示在网页上时。',
        pros: ['生成现成的 HTML <table> 标签', '可直接粘贴进页面或文章', '保留表头与行列结构'],
        cons: ['只是展示用标记,不能导入数据库'],
      },
    ],
    verdict:
      '想把数据装进数据库,用 CSV 转 SQL;想把数据放到网页上展示,用 CSV 转 HTML 表格。两者都在浏览器本地处理,数据不会离开你的设备。',
    faqs: [
      {
        q: 'CSV 转 SQL 和 CSV 转 HTML 表格有什么区别?',
        a: 'CSV 转 SQL 生成 INSERT 语句,用于把数据写入数据库;CSV 转 HTML 表格生成 <table> 标记,用于在网页上展示。',
      },
      {
        q: '我的 CSV 数据会被上传吗?',
        a: '不会。两个工具都在浏览器本地解析 CSV 并生成结果,数据不会上传到服务器。',
      },
    ],
    keywords: ['csv sql html', 'csv 导入 数据库', 'csv 转 表格', 'csv to sql vs csv to html'],
  },
  {
    slug: 'image-threshold-vs-black-white',
    category: 'image',
    title: '图像阈值 vs 黑白滤镜 — 你该用哪个?',
    h1: '图像阈值 vs 黑白滤镜',
    description:
      '图像阈值按亮度临界值把图片变成纯黑白两色(二值化),黑白滤镜则做平滑的灰度去色。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '这两个工具都去掉颜色,但结果截然不同。图像阈值按一个亮度临界值把每个像素判为纯黑或纯白,只有两种颜色(二值化),适合扫描件、线稿、镂空模板;黑白滤镜则保留明暗层次,做平滑的灰度去色,适合照片。两者都在浏览器本地处理,图片不会被上传。',
    options: [
      {
        label: '图像阈值',
        toolId: 'image-threshold',
        best: '想把图片变成纯黑白两色时。',
        pros: ['按亮度临界值二值化,只有黑白两色', '适合扫描件、线稿、镂空模板', '可调阈值控制黑白比例'],
        cons: ['丢失所有灰度层次,照片会失真'],
      },
      {
        label: '黑白滤镜',
        toolId: 'image-black-white',
        best: '想把照片变成有层次的灰度时。',
        pros: ['平滑去色,保留明暗层次', '照片看起来自然不生硬', '适合人像、风景等普通照片'],
        cons: ['不会变成纯黑白两色,不适合做线稿'],
      },
    ],
    verdict:
      '想要纯黑白两色(扫描件、线稿、镂空模板),用图像阈值;想要保留层次的灰度照片,用黑白滤镜。两者都在浏览器本地处理。',
    faqs: [
      {
        q: '图像阈值和黑白滤镜有什么区别?',
        a: '图像阈值把图片二值化成纯黑白两色,黑白滤镜做平滑灰度去色、保留明暗层次。前者适合线稿与扫描件,后者适合照片。',
      },
      {
        q: '哪个更适合处理照片?',
        a: '黑白滤镜。它保留明暗层次,照片看起来自然;阈值会丢失所有灰度。处理全部在浏览器本地完成。',
      },
    ],
    keywords: ['图像阈值 黑白', '二值化 灰度', '图片 黑白 处理', 'threshold vs black white'],
  },
  {
    slug: 'markdown-to-text-vs-markdown-preview',
    category: 'docs',
    title: 'Markdown 转纯文本 vs Markdown 预览 — 你该用哪个?',
    h1: 'Markdown 转纯文本 vs Markdown 预览',
    description:
      'Markdown 转纯文本去掉所有格式得到干净的纯文本,Markdown 预览把 Markdown 渲染成带格式的 HTML 供查看。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '这两个工具对 Markdown 的处理目标相反。Markdown 转纯文本剥离所有标记,得到可直接粘贴的干净纯文本;Markdown 预览则把标记渲染成带格式的 HTML,让你看到最终排版效果。两者都在浏览器本地处理,内容不会被上传。',
    options: [
      {
        label: 'Markdown 转纯文本',
        toolId: 'markdown-to-text',
        best: '想得到去掉格式的纯文本时。',
        pros: ['剥离标题、链接、强调等所有标记', '输出可直接粘贴的干净纯文本', '适合统计字数或喂给其他工具'],
        cons: ['丢失所有排版,只剩文字本身'],
      },
      {
        label: 'Markdown 预览',
        toolId: 'markdown-preview',
        best: '想看到渲染后的排版效果时。',
        pros: ['实时渲染成带格式的 HTML', '直观确认标题、列表、链接的效果', '边写边看,所见即所得'],
        cons: ['用于查看效果,不输出纯文本'],
      },
    ],
    verdict:
      '想把格式拿掉、得到纯文本,用 Markdown 转纯文本;想看到渲染后的样子,用 Markdown 预览。两者都在浏览器本地处理。',
    faqs: [
      {
        q: 'Markdown 转纯文本和 Markdown 预览有什么区别?',
        a: 'Markdown 转纯文本去掉所有标记、输出干净纯文本;Markdown 预览把标记渲染成带格式的 HTML 供你查看效果。',
      },
      {
        q: '我的 Markdown 内容会被上传吗?',
        a: '不会。两个工具都在浏览器本地解析和渲染,内容不会上传到服务器。',
      },
    ],
    keywords: ['markdown 纯文本 预览', 'markdown 去格式', 'markdown 渲染 查看', 'markdown to text vs preview'],
  },
  {
    slug: 'regex-escape-vs-string-escape',
    category: 'dev',
    title: '正则转义 vs 字符串转义 — 你该用哪个?',
    h1: '正则转义 vs 字符串转义',
    description:
      '正则转义为正则表达式转义元字符让文本按字面匹配,字符串转义为 JSON/JS/HTML/SQL 等上下文转义字符串。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '这两个工具都在做「转义」,但目标上下文不同。正则转义把 . * + ? 等正则元字符加上反斜杠,让文本在正则表达式里按字面意思匹配;字符串转义则把字符串处理成可安全嵌入 JSON、JavaScript、HTML 或 SQL 的形式。两者都在浏览器本地处理,文本不会被上传。',
    options: [
      {
        label: '正则转义',
        toolId: 'regex-escape',
        best: '想在正则里按字面匹配一段文本时。',
        pros: ['转义所有正则元字符', '让特殊符号按字面意思匹配', '避免把用户输入误当成正则语法'],
        cons: ['只针对正则上下文,不适用于代码或标记'],
      },
      {
        label: '字符串转义',
        toolId: 'string-escape',
        best: '想把字符串安全嵌入代码或标记时。',
        pros: ['支持 JSON/JS/HTML/SQL 多种上下文', '处理引号、反斜杠、特殊字符', '避免语法错误与注入风险'],
        cons: ['不处理正则元字符'],
      },
    ],
    verdict:
      '要把文本用进正则表达式,用正则转义;要把字符串安全嵌入代码或标记,用字符串转义。两者都在浏览器本地完成。',
    faqs: [
      {
        q: '正则转义和字符串转义有什么区别?',
        a: '正则转义为正则表达式转义元字符,让文本按字面匹配;字符串转义为 JSON/JS/HTML/SQL 等代码或标记上下文转义字符串。',
      },
      {
        q: '能用字符串转义来处理正则吗?',
        a: '不建议。字符串转义针对代码和标记上下文,不会处理正则元字符;正则匹配请用正则转义。两者都在浏览器本地完成。',
      },
    ],
    keywords: ['正则转义 字符串转义', 'regex 元字符 转义', 'json js html 转义', 'regex escape vs string escape'],
  },
  {
    slug: 'bpm-tap-vs-metronome',
    category: 'audio',
    title: 'BPM 打拍计数 vs 节拍器 — 你该用哪个?',
    h1: 'BPM 打拍计数 vs 节拍器',
    description:
      'BPM 打拍计数让你跟着歌曲点击来测出未知曲目的速度,节拍器按你设定的速度播放稳定的咔嗒声。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '这两个工具方向相反。BPM 打拍计数让你跟着一首歌的节奏点击,从你点击的间隔算出这首歌的速度(BPM),用于测量未知的速度;节拍器则相反,你设定一个速度,它按这个速度播放稳定的咔嗒声,用于按已知速度练习。两者都在浏览器本地运行。',
    options: [
      {
        label: 'BPM 打拍计数',
        toolId: 'bpm-tap',
        best: '想测出一首歌速度是多少时。',
        pros: ['跟着歌曲点击即可算出 BPM', '适合找未知曲目的速度', '点击越多结果越稳'],
        cons: ['只测量速度,不会播放节拍'],
      },
      {
        label: '节拍器',
        toolId: 'metronome',
        best: '想按设定速度稳定练习时。',
        pros: ['按你设定的 BPM 播放稳定咔嗒声', '适合练琴、练唱、卡节奏', '速度可随时调整'],
        cons: ['需要你先知道目标速度,不能测量歌曲'],
      },
    ],
    verdict:
      '想测出一首歌的速度,用 BPM 打拍计数;想按已知速度稳定练习,用节拍器。两者都在浏览器本地运行。',
    faqs: [
      {
        q: 'BPM 打拍计数和节拍器有什么区别?',
        a: 'BPM 打拍计数让你跟着歌点击来测出它的速度;节拍器则按你设定的速度播放稳定的咔嗒声供练习。一个测量,一个播放。',
      },
      {
        q: '怎样让 BPM 测得更准?',
        a: '跟着稳定的节拍多点几下,点击次数越多,平均出来的 BPM 越稳定。计算在浏览器本地完成。',
      },
    ],
    keywords: ['bpm 节拍器', '测量 速度 bpm', '打拍 节奏 练习', 'bpm tap vs metronome'],
  },
  {
    slug: 'random-team-vs-random-pick',
    category: 'util',
    title: '随机分组 vs 随机抽取 — 你该用哪个?',
    h1: '随机分组 vs 随机抽取',
    description:
      '随机分组把一份名单平均分成多个队伍,随机抽取从名单里抽出一个或几个中签者。何时用哪个 — 免费,在浏览器中完成。',
    intro:
      '这两个工具都对名单做随机处理,但结果不同。随机分组把所有人平均分配到若干个队伍里,让每个人都进组;随机抽取则只从名单里挑出一个或几个中签者,其余不入选。两者都在浏览器本地用随机算法完成,名单不会被上传。',
    options: [
      {
        label: '随机分组',
        toolId: 'random-team-generator',
        best: '想把一群人平均分成几个队时。',
        pros: ['把名单平均分成多个队伍', '每个人都会被分到某一组', '适合分队比赛、小组活动'],
        cons: ['用于全员分组,不适合只抽一两个人'],
      },
      {
        label: '随机抽取',
        toolId: 'random-pick',
        best: '想从名单里抽中签者时。',
        pros: ['从名单随机抽出一个或几个', '适合抽奖、点名、选值日', '可设定抽取数量'],
        cons: ['只挑出少数人,不会给所有人分组'],
      },
    ],
    verdict:
      '想把所有人分成几个队,用随机分组;想从名单里抽出中签者,用随机抽取。两者都在浏览器本地用随机算法完成。',
    faqs: [
      {
        q: '随机分组和随机抽取有什么区别?',
        a: '随机分组把所有人平均分到几个队里、人人入组;随机抽取只从名单挑出一个或几个中签者,其余不入选。',
      },
      {
        q: '抽取或分组是真随机吗、名单会上传吗?',
        a: '工具使用浏览器内置的随机算法,且全部在本地完成,名单不会上传到服务器。',
      },
    ],
    keywords: ['随机分组 抽取', '名单 分队 抽奖', '随机 点名 分组', 'random team vs random pick'],
  },
];

export function getCompareZh(slug: string): Compare | undefined {
  return COMPARES_ZH.find((c) => c.slug === slug);
}

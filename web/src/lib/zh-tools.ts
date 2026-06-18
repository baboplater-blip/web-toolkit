/**
 * Curated Simplified-Chinese (简体中文) copy for the tool catalog.
 *
 * Mirrors en-tools.ts / ja-tools.ts. Powers the /zh surface:
 *   - /zh/tools/{id}  — transactional landing
 *   - /zh/guide/{id}  — how-to guide (guide-content-zh.ts)
 *
 * Expand by adding entries here — pages, sitemap, catalog and hreflang pick
 * them up automatically.
 */

export interface ZhToolCopy {
  /** Chinese display name — H1 / <title> seed. */
  name: string;
  /** One-line tagline (under the H1). */
  tagline: string;
  /** Meta description seed. */
  description: string;
  /** Chinese (+ pinyin/English) search keywords. */
  keywords: string[];
}

export const ZH_TOOLS: Record<string, ZhToolCopy> = {
  compress: {
    name: '文件压缩（图片和PDF）',
    tagline: '在浏览器中压缩图片和PDF，减小文件体积。',
    description:
      '在浏览器本地压缩图片和PDF，缩小文件体积，方便上传和发邮件，文件不上传服务器。',
    keywords: ['文件压缩', 'compress file', '图片压缩', 'PDF压缩', '减小体积', 'compress pdf'],
  },
  'pdf-merge': {
    name: 'PDF合并',
    tagline: '将多个PDF文件合并成一个，文件不上传。',
    description:
      '在浏览器中将多个PDF合并并重新排序为一个文档，文件全程不离开你的设备。',
    keywords: ['PDF合并', 'merge pdf', '合并PDF', 'PDF拼接', 'combine pdf', '多个PDF合一'],
  },
  'pdf-split': {
    name: 'PDF拆分',
    tagline: '提取页面或将PDF拆分为多个文件。',
    description:
      '在本地提取指定页面或将PDF拆分成多个独立文件，全程不上传到任何服务器。',
    keywords: ['PDF拆分', 'split pdf', '拆分PDF', '提取PDF页面', 'PDF分割', 'separate pdf'],
  },
  'pdf-to-jpg': {
    name: 'PDF转JPG',
    tagline: '将PDF页面转换为JPG或PNG图片。',
    description:
      '将PDF每一页转换为JPG或PNG图片并下载，使用PDF.js本地渲染，文件不上传。',
    keywords: ['PDF转JPG', 'pdf to jpg', 'PDF转图片', 'PDF转PNG', 'pdf to image', 'PDF转图像'],
  },
  'pdf-from-jpg': {
    name: 'JPG转PDF',
    tagline: '将多张图片合并为一个PDF。',
    description:
      '将JPG、PNG等图片合并成一个PDF，可控制页面尺寸和排序，全程在浏览器中处理。',
    keywords: ['JPG转PDF', 'jpg to pdf', '图片转PDF', 'image to pdf', 'PNG转PDF', '照片转PDF'],
  },
  'pdf-rotate': {
    name: 'PDF页面旋转',
    tagline: '将选定页面旋转90/180/270度。',
    description:
      '将PDF指定页面旋转90、180或270度并保存，在浏览器中修正横向扫描件和方向混乱的页面。',
    keywords: ['PDF旋转', 'rotate pdf', '旋转PDF页面', 'PDF页面方向', 'rotate pdf pages', '翻转PDF'],
  },
  'pdf-organize': {
    name: 'PDF页面整理',
    tagline: '用缩略图重新排序、删除和复制页面。',
    description:
      '通过缩略图可视化地重新排序、删除和复制PDF页面后导出，文件不上传，全程在浏览器中完成。',
    keywords: ['PDF整理', 'organize pdf', 'PDF页面排序', '删除PDF页面', 'reorder pdf', '重排PDF'],
  },
  'pdf-unlock': {
    name: 'PDF解密（移除密码）',
    tagline: '移除已知密码的PDF密码保护。',
    description:
      '移除你能打开的PDF的密码，使其打开时不再提示输入密码，全程在浏览器中处理。',
    keywords: ['PDF解密', 'unlock pdf', '移除PDF密码', 'PDF去密码', 'remove pdf password', 'PDF密码移除'],
  },
  'pdf-protect': {
    name: 'PDF加密（密码保护）',
    tagline: '为PDF添加密码和加密保护。',
    description:
      '为PDF添加密码保护，只有知道密码的人才能打开，本地加密，文件不上传。',
    keywords: ['PDF加密', 'encrypt pdf', 'PDF密码保护', 'PDF加密码', 'password protect pdf', 'PDF锁定'],
  },
  'image-resize': {
    name: '图片尺寸调整',
    tagline: '按精确像素或百分比调整图片大小。',
    description:
      '按像素或百分比调整JPG、PNG、WebP和GIF图片尺寸，可锁定宽高比，全程在浏览器中处理。',
    keywords: ['图片调整大小', 'resize image', '图片尺寸', '修改图片大小', 'image resizer', '缩放图片'],
  },
  'image-crop': {
    name: '图片裁剪',
    tagline: '按区域或固定宽高比裁剪照片。',
    description:
      '将JPG、PNG和WebP图片裁剪到任意区域或固定宽高比，带实时预览，全程在浏览器中处理。',
    keywords: ['图片裁剪', 'crop image', '裁剪照片', '图片剪裁', 'image cropper', '宽高比裁剪'],
  },
  'image-convert': {
    name: '图片格式转换（PNG/JPG/WebP）',
    tagline: '在PNG、JPG、WebP等格式间转换。',
    description:
      '在本地将图片在PNG、JPG、WebP等格式间转换，速度快、支持批量，文件不上传。',
    keywords: ['图片格式转换', 'image converter', 'PNG转JPG', 'png to jpg', 'WebP转换', 'jpg to webp'],
  },
  'image-rotate': {
    name: '图片旋转和翻转',
    tagline: '按任意角度旋转或翻转图片。',
    description:
      '将图片旋转90度、任意自定义角度，或进行水平和垂直翻转，本地快速处理，文件不上传。',
    keywords: ['图片旋转', 'rotate image', '翻转图片', '旋转照片', 'flip image', '图片角度'],
  },
  'image-heic-to-jpg': {
    name: 'HEIC转JPG',
    tagline: '将iPhone的HEIC照片转换为通用JPG。',
    description:
      '在浏览器中将iPhone的HEIC/HEIF照片转换为通用的JPG图片，支持批量，文件不上传。',
    keywords: ['HEIC转JPG', 'heic to jpg', 'HEIC转换', 'iPhone照片转换', 'heic converter', 'HEIC转JPEG'],
  },
  'remove-background': {
    name: '图片抠图（移除背景）',
    tagline: '用AI自动擦除照片背景。',
    description:
      '用浏览器内置的AI模型自动移除照片背景并下载透明PNG，文件不上传。',
    keywords: ['抠图', 'remove background', '去背景', '背景移除', '透明PNG', 'remove bg'],
  },
  'image-upscale': {
    name: 'AI图片高清放大',
    tagline: '放大图片而不损失清晰度。',
    description:
      '使用浏览器内置的AI超分辨率模型放大并锐化图片，在保留细节的同时提升分辨率，全程本地处理。',
    keywords: ['图片放大', 'image upscaler', 'AI放大', '高清放大', '无损放大', 'ai upscale'],
  },
  'favicon-gen': {
    name: 'Favicon生成器',
    tagline: '将任意图片生成favicon.ico及全套PWA图标尺寸。',
    description:
      '上传图片即可下载完整favicon图标包（16/32/48/180/512px及favicon.ico）的ZIP，纯浏览器处理。',
    keywords: ['favicon生成', 'favicon generator', '网站图标', 'ICO生成', 'ico generator', 'PWA图标'],
  },
  'meme-gen': {
    name: '表情包生成器',
    tagline: '为图片添加上下文字制作梗图。',
    description:
      '上传图片，用经典的Impact字体输入上下文字，即可下载你的表情包，文件不上传。',
    keywords: ['表情包生成', 'meme generator', '梗图制作', '图片加字', 'caption image', '做表情包'],
  },
  'image-flip': {
    name: '图片翻转',
    tagline: '水平或垂直翻转图片。',
    description:
      '将图片进行左右或上下镜像翻转并下载结果，全程在浏览器中运行。',
    keywords: ['图片翻转', 'flip image', '镜像图片', '水平翻转', 'mirror image', '垂直翻转'],
  },
  'video-compress': {
    name: '视频压缩',
    tagline: '通过分辨率和码率减小视频体积。',
    description:
      '使用浏览器内置的FFmpeg调整分辨率和码率来减小视频文件体积，满足上传限制，文件不上传。',
    keywords: ['视频压缩', 'compress video', '减小视频体积', '压缩MP4', 'reduce video size', '视频瘦身'],
  },
  'video-trim': {
    name: '视频裁剪（剪辑时长）',
    tagline: '快速将视频剪辑到起止时间段。',
    description:
      '设置起止时间，从视频中剪出所需片段，无需重新编码即可快速分割，全程在浏览器中处理。',
    keywords: ['视频剪辑', 'trim video', '视频裁剪', '剪切视频', 'cut video', '视频截取'],
  },
  'video-convert': {
    name: '视频格式转换',
    tagline: '在MP4、WebM、MOV等格式间转换视频。',
    description:
      '使用浏览器内置的FFmpeg在MP4、WebM、MOV等格式间转换视频，文件不离开你的设备。',
    keywords: ['视频格式转换', 'video converter', '转换MP4', 'convert mp4', 'MOV转MP4', 'WebM转换'],
  },
  'video-to-gif': {
    name: '视频转GIF',
    tagline: '将视频片段转换为优化的动图GIF。',
    description:
      '将MP4等视频片段转换为优化的动图GIF，可自定义帧率和尺寸，由浏览器内置FFmpeg驱动，文件不上传。',
    keywords: ['视频转GIF', 'video to gif', 'MP4转GIF', 'mp4 to gif', '视频转动图', 'GIF制作'],
  },
  'video-crop': {
    name: '视频画面裁剪',
    tagline: '在浏览器中将视频裁剪为矩形区域。',
    description:
      '选择一个矩形区域，只保留视频中的该部分画面，由FFmpeg.wasm驱动，文件不上传。',
    keywords: ['视频画面裁剪', 'crop video', '视频裁剪画面', '裁剪视频区域', 'cut video area', '视频构图'],
  },
  'video-mute': {
    name: '视频静音（去音轨）',
    tagline: '移除视频的音频轨道。',
    description:
      '去除视频中的声音并导出无声片段，由FFmpeg.wasm驱动，全程在浏览器中完成。',
    keywords: ['视频静音', 'mute video', '去除视频声音', '移除音轨', 'remove audio from video', '无声视频'],
  },
  'screen-record': {
    name: '屏幕录制',
    tagline: '将屏幕、标签页或窗口录制为webm文件。',
    description:
      '录制屏幕并可选录入麦克风声音，下载webm文件，无需上传、无需安装，纯浏览器处理。',
    keywords: ['屏幕录制', 'screen recorder', '录屏', '屏幕录像', 'record screen', '免费录屏'],
  },
  'audio-convert': {
    name: '音频格式转换',
    tagline: '在MP3、WAV、OGG等格式间转换音频。',
    description:
      '使用浏览器内置的FFmpeg在MP3、WAV、OGG、M4A等格式间转换音频文件，文件不上传。',
    keywords: ['音频格式转换', 'audio converter', '转换MP3', 'convert mp3', 'WAV转MP3', '音频转换'],
  },
  'audio-trim': {
    name: '音频剪辑',
    tagline: '将音频文件剪切到指定时间段。',
    description:
      '设置起止时间，从音频文件中剪出所需片段，支持MP3、WAV、OGG等格式，全程在浏览器中处理。',
    keywords: ['音频剪辑', 'trim audio', '剪切MP3', 'cut mp3', '音频裁剪', 'audio cutter'],
  },
  'mic-record': {
    name: '麦克风录音',
    tagline: '录制麦克风音频并下载。',
    description:
      '用麦克风录制语音并保存为音频文件，无需上传、无需安装，全程在浏览器中运行。',
    keywords: ['麦克风录音', 'microphone recorder', '在线录音', '录音机', 'voice recorder', '语音录制'],
  },
  'gif-maker': {
    name: 'GIF制作',
    tagline: '从图片或视频片段创建动图GIF。',
    description:
      '用一组图片或视频片段制作动图GIF，可控制帧时长和尺寸，全程在浏览器中完成。',
    keywords: ['GIF制作', 'gif maker', '创建GIF', '制作动图', 'make gif', '图片转GIF'],
  },
  'qr-code': {
    name: '二维码生成与识别',
    tagline: '从文本或网址生成二维码，并即时解码二维码图片。',
    description:
      '从任意文本或网址生成二维码，或上传图片解码现有二维码，全程在浏览器中运行。',
    keywords: ['二维码生成', 'qr code generator', '二维码识别', '生成二维码', '扫描二维码', 'qr code reader'],
  },
  barcode: {
    name: '条形码生成器',
    tagline: '生成EAN、UPC、Code128和Code39条形码，导出PNG或SVG。',
    description:
      '创建EAN-13、UPC、Code128和Code39条形码并下载为PNG或SVG，本地生成，文件不上传。',
    keywords: ['条形码生成', 'barcode generator', '条码生成', 'EAN条形码', 'code128', 'UPC条码'],
  },
  base64: {
    name: 'Base64编码/解码',
    tagline: '本地编码和解码Base64文本和文件。',
    description:
      '在浏览器中即时将文本或文件与Base64互相转换，不上传、无大小限制、无跟踪。',
    keywords: ['Base64编码', 'base64 encode', 'Base64解码', 'base64 decode', 'Base64转换', 'base64 converter'],
  },
  'file-hash': {
    name: '文件哈希校验（MD5/SHA）',
    tagline: '计算任意文件的MD5、SHA-1和SHA-256校验值。',
    description:
      '计算任意文件的MD5、SHA-1、SHA-256和SHA-512校验值以验证完整性，本地处理，文件不上传。',
    keywords: ['文件哈希', 'file hash', 'MD5校验', 'md5 checksum', 'SHA256', '校验值计算'],
  },
  'json-format': {
    name: 'JSON格式化与校验',
    tagline: '实时美化、压缩和校验JSON。',
    description:
      '美化、压缩和校验JSON并即时提示错误，全程在浏览器中处理，数据不上传。',
    keywords: ['JSON格式化', 'json formatter', 'JSON校验', '格式化JSON', 'json validator', 'JSON美化'],
  },
  'color-palette': {
    name: '配色方案生成器',
    tagline: '从基准色或图片生成并导出配色方案。',
    description:
      '从基准色或上传的图片生成和谐的配色方案并导出色板，全程在浏览器中完成。',
    keywords: ['配色方案', 'color palette generator', '调色板', '配色生成', 'color scheme', '颜色搭配'],
  },
  'password-gen': {
    name: '密码生成器',
    tagline: '用浏览器安全加密技术生成强随机密码。',
    description:
      '使用Web Crypto API生成自定义长度和字符集的强随机密码，所有数据都不离开你的浏览器。',
    keywords: ['密码生成', 'password generator', '强密码', '随机密码', 'random password', '安全密码'],
  },
  'uuid-gen': {
    name: 'UUID生成器',
    tagline: '批量生成v4和v7 UUID并一键复制。',
    description:
      '批量生成加密安全的v4和时间有序的v7 UUID并即时复制，完全离线运行。',
    keywords: ['UUID生成', 'uuid generator', 'GUID生成', '唯一标识符', 'v4 uuid', '随机UUID'],
  },
  'jwt-decoder': {
    name: 'JWT解码器',
    tagline: '解码并查看JWT的头部、载荷和声明。',
    description:
      '粘贴JSON Web Token即可查看其头部、载荷和过期时间，本地解码，令牌不离开浏览器。',
    keywords: ['JWT解码', 'jwt decoder', '解析JWT', 'JSON Web Token', 'jwt parser', 'JWT调试'],
  },
  'unit-converter': {
    name: '单位换算器',
    tagline: '长度、重量、温度、数据容量等一键换算。',
    description:
      '即时换算长度、重量、温度、面积、体积、速度和数据容量，可离线使用，数据不上传。',
    keywords: ['单位换算', '单位转换器', '长度换算', '温度换算', '度量衡转换', 'unit converter'],
  },
  'base-converter': {
    name: '进制转换器',
    tagline: '二进制、八进制、十进制、十六进制互转。',
    description:
      '在二进制、八进制、十进制、十六进制之间相互转换，支持大整数，全程在浏览器本地完成。',
    keywords: ['进制转换', '二进制转十进制', '十六进制转换', 'binary', 'hex converter', '数制转换'],
  },
  'color-contrast': {
    name: '颜色对比度检测',
    tagline: '检测文字与背景的 WCAG 对比度。',
    description:
      '计算前景色与背景色的对比度，按 WCAG AA/AAA 标准判定可读性，帮你做出无障碍配色。',
    keywords: ['颜色对比度', '对比度检测', 'WCAG', '无障碍配色', 'contrast checker', '可读性'],
  },
  'text-hash': {
    name: '文本哈希计算',
    tagline: '为文本生成 MD5、SHA 等哈希值。',
    description:
      '为任意文本生成 MD5、SHA-1、SHA-256、SHA-512 哈希值，全程本地计算，内容不上传。',
    keywords: ['文本哈希', 'MD5', 'SHA256', '哈希计算', 'hash generator', '校验'],
  },
  'regex-tester': {
    name: '正则表达式测试',
    tagline: '实时测试正则并高亮匹配结果。',
    description:
      '编写和调试正则表达式，实时高亮匹配项、捕获组与标志，全程在浏览器中运行。',
    keywords: ['正则表达式', '正则测试', 'regex tester', 'regex', '在线正则', '匹配测试'],
  },
  'url-encoder': {
    name: 'URL 编码/解码',
    tagline: '对 URL 及查询参数进行百分号编解码。',
    description:
      '即时对完整 URL 或查询字符串进行百分号编码与解码，本地处理，无大小限制。',
    keywords: ['URL编码', 'URL解码', '百分号编码', 'url encode', 'url decode', '网址转码'],
  },
  'color-converter': {
    name: '颜色格式转换',
    tagline: 'HEX、RGB、HSL、HSV 互转并实时预览。',
    description:
      '在 HEX、RGB、HSL、HSV 之间相互转换颜色，附带实时色块预览，全程在浏览器中完成。',
    keywords: ['颜色转换', 'HEX转RGB', 'RGB转HEX', 'HSL转换', 'color converter', '颜色代码'],
  },
  'lorem-ipsum': {
    name: 'Lorem Ipsum 占位文本',
    tagline: '生成占位段落、句子或单词。',
    description:
      '为排版与设计稿生成 Lorem Ipsum 占位段落、句子或单词，一键复制即可使用。',
    keywords: ['占位文本', '假文生成', 'Lorem Ipsum', '填充文本', 'placeholder text', '乱数假文'],
  },
  'timestamp-converter': {
    name: 'Unix 时间戳转换',
    tagline: 'Unix 时间与日期互转，支持任意时区。',
    description:
      '将秒或毫秒级时间戳转换为可读日期并反向转换，支持多时区，在浏览器中即时完成。',
    keywords: ['时间戳转换', 'Unix时间戳', 'epoch转换', '时间戳转日期', 'timestamp converter', '时区'],
  },
  'text-diff': {
    name: '文本差异对比',
    tagline: '对比两段文本并高亮所有差异。',
    description:
      '将两段文本或代码并排对比，高亮新增、删除和修改的行，全程本地处理。',
    keywords: ['文本对比', '差异对比', 'diff工具', '比较文本', 'text diff', '代码对比'],
  },
  'text-count': {
    name: '字数字符统计',
    tagline: '实时统计字数、字符、句子与阅读时间。',
    description:
      '边输入边统计字数、字符数、句子数、段落数及预计阅读时间，内容不上传。',
    keywords: ['字数统计', '字符统计', '字数计算器', 'word counter', '字符计数', '文字统计'],
  },
  'sql-format': {
    name: 'SQL 格式化',
    tagline: '美化并统一各方言的 SQL 语句。',
    description:
      '一键美化并规范化主流方言的 SQL 查询语句，全程在浏览器中完成。',
    keywords: ['SQL格式化', 'SQL美化', '格式化SQL', 'sql formatter', 'sql beautifier', 'SQL排版'],
  },
  'cron-explainer': {
    name: 'Cron 表达式解析',
    tagline: '将 cron 调度翻译成通俗说明。',
    description:
      '粘贴 cron 表达式即可用通俗中文解释它何时运行，并列出接下来的执行时间，本地处理。',
    keywords: ['cron表达式', 'cron解析', '定时任务', 'crontab', 'cron explainer', '调度表达式'],
  },
  'html-entities': {
    name: 'HTML 实体编解码',
    tagline: '安全地编码和解码 HTML 实体。',
    description:
      '在特殊字符与 HTML 实体之间相互转换，防止渲染异常和注入问题，全程在浏览器中处理。',
    keywords: ['HTML实体', 'HTML编码', 'HTML解码', '转义HTML', 'html entities', '实体转换'],
  },
  jsonpath: {
    name: 'JSONPath 测试',
    tagline: '实时对 JSON 求值 JSONPath 表达式。',
    description:
      '用 JSONPath 表达式查询 JSON 数据并即时查看匹配结果，全程在浏览器中运行。',
    keywords: ['JSONPath', 'JSONPath测试', '查询JSON', 'json path', 'jsonpath tester', 'JSON取值'],
  },
  'json-xml': {
    name: 'JSON ↔ XML 转换',
    tagline: 'JSON 与 XML 双向互转。',
    description:
      '在浏览器中即时将 JSON 转 XML、XML 转 JSON，并自动格式化，不上传、无限制。',
    keywords: ['JSON转XML', 'XML转JSON', 'json xml转换', '数据转换', 'json to xml', '格式互转'],
  },
  'md-table': {
    name: 'Markdown 表格生成',
    tagline: '可视化制作 Markdown 表格并复制源码。',
    description:
      '在可视化网格中创建和编辑 Markdown 表格，再复制整洁的 Markdown 源码，可完全离线使用。',
    keywords: ['Markdown表格', 'md表格生成', '表格生成器', 'markdown table', '表格制作', 'md table'],
  },
  'text-case': {
    name: '文本大小写转换',
    tagline: '一键转大写、小写、标题、驼峰等。',
    description:
      '在大写、小写、标题式、句首大写、驼峰、下划线、连字符等命名风格间即时转换文本。',
    keywords: ['大小写转换', '命名转换', '驼峰转换', '标题大写', 'text case', '格式转换'],
  },
  'text-sort': {
    name: '文本行排序去重',
    tagline: '排序、反转并去除重复行。',
    description:
      '按字母或数字排序文本行，支持反转、随机打乱和去重，全程在浏览器本地完成。',
    keywords: ['文本排序', '行排序', '字母排序', '去除重复行', 'sort lines', '去重'],
  },
  percentage: {
    name: '百分比计算器',
    tagline: '计算百分比、增减幅度与差值。',
    description:
      '通过简单输入计算百分比、百分比增减以及百分比差值，即时免费使用。',
    keywords: ['百分比计算', '百分比计算器', '百分数', '增长率', 'percentage calculator', '占比计算'],
  },
  'file-encrypt': {
    name: '文件加密 (AES)',
    tagline: '在本地用 AES 加解密文件。',
    description:
      '使用 Web Crypto 以 AES-GCM 和口令加密或解密任意文件，文件始终不离开你的设备。',
    keywords: ['文件加密', 'AES加密', '文件解密', '加密文件', 'encrypt file', '口令保护'],
  },
  'text-encrypt': {
    name: '文本加密 (AES)',
    tagline: '用口令加密和解密文本。',
    description:
      '在浏览器中用 AES-GCM 和口令加密或解密文本，安全分享秘密信息，内容不上传。',
    keywords: ['文本加密', 'AES加密', '加密文字', '文本解密', 'encrypt text', '口令加密'],
  },
  totp: {
    name: 'TOTP 动态口令生成',
    tagline: '根据密钥生成两步验证动态口令。',
    description:
      '根据密钥生成 TOTP 两步验证动态口令，附带实时倒计时，全程本地计算，绝不上传。',
    keywords: ['TOTP', '两步验证', '动态口令', '2FA验证码', 'totp generator', '身份验证器'],
  },
  'rsa-keypair': {
    name: 'RSA 密钥对生成',
    tagline: '在浏览器中生成 RSA 公私钥对。',
    description:
      '用 Web Crypto 在浏览器中生成 PEM 格式的 RSA 公钥和私钥对，密钥始终不离开你的设备。',
    keywords: ['RSA密钥', 'RSA密钥对', '公钥私钥', 'rsa key generator', 'PEM生成', '密钥生成'],
  },
  'pdf-to-word': {
    name: 'PDF 转 Word',
    tagline: '将 PDF 提取为可编辑的 Word 文档。',
    description:
      '在浏览器中将 PDF 转换为可编辑的 Word (DOCX) 文档，文件绝不上传到任何服务器。',
    keywords: ['PDF转Word', 'PDF转DOCX', 'pdf to word', 'PDF转文档', '可编辑PDF', '格式转换'],
  },
  'pdf-watermark': {
    name: 'PDF 添加水印',
    tagline: '为 PDF 各页加盖文字或图片水印。',
    description:
      '为 PDF 每一页添加文字或图片水印，可调整透明度和位置，全程本地处理。',
    keywords: ['PDF水印', '添加水印', 'PDF加水印', 'pdf watermark', '文档水印', '图片水印'],
  },
  'image-watermark': {
    name: '图片添加水印',
    tagline: '为图片叠加文字或 Logo 水印。',
    description:
      '为图片添加文字或 Logo 水印，可调整透明度、大小和位置，全程在浏览器中处理。',
    keywords: ['图片水印', '添加水印', '照片水印', 'image watermark', 'Logo水印', '加水印'],
  },
  'image-svg-to-png': {
    name: 'SVG 转 PNG',
    tagline: '将 SVG 文件按任意尺寸栅格化为 PNG。',
    description:
      '将 SVG 矢量文件按指定分辨率转换为 PNG 位图，支持透明背景，全程在浏览器中完成。',
    keywords: ['SVG转PNG', '矢量转位图', 'svg converter', 'svg to png', 'SVG转换', '栅格化'],
  },
  'image-batch-compress': {
    name: '图片批量压缩',
    tagline: '一次性压缩多张图片且尽量保质。',
    description:
      '批量压缩 JPG、PNG、WebP 图片以缩小体积，可控制质量，再打包为 ZIP 下载，纯本地处理。',
    keywords: ['图片压缩', '批量压缩', '图片压缩器', '缩小图片', 'compress image', '图片瘦身'],
  },
  'csv-json': {
    name: 'CSV 转 JSON',
    tagline: 'CSV 与 JSON 互转，可控制表头。',
    description:
      '在 CSV 与 JSON 之间相互转换，支持自定义分隔符和表头选项，即时本地处理，不上传。',
    keywords: ['CSV转JSON', 'JSON转CSV', 'csv json转换', 'csv to json', 'CSV解析', '数据转换'],
  },
  'yaml-json': {
    name: 'YAML ↔ JSON 转换',
    tagline: 'YAML 与 JSON 双向互转。',
    description:
      '在浏览器中将 YAML 转 JSON、JSON 转 YAML，并自动校验和格式化。',
    keywords: ['YAML转JSON', 'JSON转YAML', 'yaml json转换', 'yaml to json', '配置转换', '数据转换'],
  },
  'docx-to-pdf': {
    name: 'Word 转 PDF',
    tagline: '在本地将 Word 文档转换为 PDF。',
    description:
      '在浏览器中将 Word DOCX 文档转换为 PDF 文件并保留排版，文件绝不上传。',
    keywords: ['Word转PDF', 'DOCX转PDF', 'docx to pdf', 'doc转pdf', '文档转PDF', '格式转换'],
  },
  'epub-to-pdf': {
    name: 'EPUB 转 PDF',
    tagline: '将 EPUB 电子书转换为 PDF 文件。',
    description:
      '在本地将 EPUB 电子书转换为分页的 PDF 文件，适合打印或归档，内容不离开浏览器。',
    keywords: ['EPUB转PDF', '电子书转PDF', 'epub to pdf', 'epub转换', 'ebook转pdf', '电子书转换'],
  },
  'video-to-audio': {
    name: '视频提取音频',
    tagline: '从视频中提取音轨并保存为 MP3。',
    description:
      '借助浏览器内 FFmpeg 从视频中提取音频并保存为 MP3 等格式，内容不上传。',
    keywords: ['视频转音频', '视频转MP3', '提取音频', 'video to mp3', 'mp4转mp3', '音频提取'],
  },
  ocr: {
    name: '图片文字识别 (OCR)',
    tagline: '从图片和扫描件中提取文字。',
    description:
      '用 Tesseract OCR（中英文）识别并提取图片和扫描文档中的文字，全程本地处理。',
    keywords: ['文字识别', 'OCR', '图片转文字', '提取文字', 'image to text', '扫描识别'],
  },
  'vat-calc': {
    name: '增值税计算器',
    tagline: '按任意税率为金额加算或反算增值税。',
    description:
      '按你设定的任意税率，为净额加算增值税，或从含税总额中反算出税额，在浏览器中即时完成。',
    keywords: ['增值税计算', '增值税计算器', '税额计算', '含税价', 'vat calculator', '销售税'],
  },
  'seal-stamp': {
    name: '印章生成器',
    tagline: '生成圆形公章或印章并导出透明 PNG。',
    description:
      '根据公司名称或缩写生成圆形公章或印章，导出透明 PNG 用于文件和签署。',
    keywords: ['印章生成', '公章制作', '电子印章', '圆形印章', 'stamp generator', '公司印章'],
  },
  'vcard-qr': {
    name: 'vCard 名片二维码',
    tagline: '将联系信息生成可扫描的名片二维码。',
    description:
      '根据姓名、电话、邮箱和公司生成 vCard 二维码，扫码即可保存联系人，适合名片和邮件签名。',
    keywords: ['名片二维码', 'vCard二维码', '联系人二维码', 'vcard qr', '二维码生成', '电子名片'],
  },
  'id-photo': {
    name: '证件照制作',
    tagline: '按护照或证件规格裁剪和调整照片。',
    description:
      '按护照、签证或证件规格裁剪并调整照片至打印质量（300dpi），可设背景色，全程在浏览器中完成。',
    keywords: ['证件照', '证件照制作', '护照照片', '签证照片', 'id photo', '一寸照'],
  },
  redact: {
    name: '敏感信息打码',
    tagline: '自动识别并涂黑邮箱、卡号和电话号码。',
    description:
      '粘贴文本后自动识别并打码邮箱、银行卡号、手机号和身份证号，分享或截图前保护隐私，全程本地处理。',
    keywords: ['敏感信息打码', '隐私涂黑', '脱敏工具', '隐藏个人信息', 'redact text', 'mask sensitive data'],
  },
  'excel-formula': {
    name: 'Excel 公式生成与解释',
    tagline: '生成 VLOOKUP/SUMIFS 公式，或解释任意公式。',
    description:
      '填空即可生成常用 Excel 公式（VLOOKUP、SUMIFS、IFERROR 等），也可粘贴公式逐个函数查看含义解释。',
    keywords: ['Excel公式生成', 'VLOOKUP生成', '公式解释', 'SUMIFS公式', 'excel formula generator', 'vlookup'],
  },
  'scan-to-pdf': {
    name: '拍照扫描转 PDF',
    tagline: '把文档照片合成为一份清晰 PDF。',
    description:
      '把文档照片转成单份清晰 PDF 并增强对比度，相当于浏览器里的手机扫描仪，无需上传。',
    keywords: ['扫描转PDF', '照片转PDF', '文档扫描', '图片转PDF', 'scan to pdf', 'photo to pdf'],
  },
  'pdf-to-excel': {
    name: 'PDF 表格转 Excel',
    tagline: '把 PDF 中的表格提取为 xlsx 或 CSV。',
    description:
      '识别行列结构，把文本型 PDF 中的表格提取为 Excel（xlsx）或 CSV，全程在浏览器本地处理。',
    keywords: ['PDF转Excel', 'PDF表格提取', 'PDF转xlsx', 'PDF转CSV', 'pdf to excel', 'extract pdf table'],
  },
  'html-to-pdf': {
    name: 'HTML 转 PDF',
    tagline: '把 HTML 代码转成带 CSS 和图片的 PDF。',
    description:
      '在浏览器本地把 HTML 代码渲染成 PDF，保留 CSS 样式和内嵌图片，无需上传。',
    keywords: ['HTML转PDF', '网页转PDF', '代码转PDF', 'html to pdf', 'webpage to pdf', 'html pdf converter'],
  },
  'pdf-background': {
    name: '为 PDF 添加背景',
    tagline: '在每一页后铺上颜色或图片。',
    description:
      '为 PDF 每一页添加背景颜色或图片，制作水印或信纸样式，本地处理无需上传。',
    keywords: ['PDF背景', '添加PDF背景', 'PDF水印背景', 'PDF信纸', 'pdf background', 'pdf watermark'],
  },
  'pdf-bookmarks': {
    name: 'PDF 书签查看器',
    tagline: '查看大纲目录树并导出为 Markdown。',
    description:
      '显示 PDF 的书签/大纲目录树并导出为 Markdown，在浏览器中一眼读懂全文目录。',
    keywords: ['PDF书签', 'PDF大纲', 'PDF目录', '查看书签', 'pdf bookmarks', 'pdf outline'],
  },
  'pdf-compare': {
    name: 'PDF 文本对比',
    tagline: '逐行比对两份 PDF 的差异。',
    description:
      '提取两份 PDF 的文字并高亮新增、删除和修改的行，相当于文档版文本 diff，全程在浏览器进行。',
    keywords: ['PDF对比', 'PDF差异', 'PDF文本比对', '比较两份PDF', 'compare pdf', 'pdf diff'],
  },
  'pdf-crop': {
    name: '裁剪 PDF 页边距',
    tagline: '修剪页面边框去除空白边距。',
    description:
      '裁剪 PDF 的页面边框，去除多余的空白边距，让页面更适合阅读和打印，本地处理。',
    keywords: ['裁剪PDF', 'PDF页边距', '修剪PDF', '去除PDF空白', 'crop pdf', 'pdf margins'],
  },
  'pdf-flatten': {
    name: 'PDF 扁平化',
    tagline: '锁定表单字段、移除批注以便打印。',
    description:
      '把表单值固化进页面，去除批注和链接，让 PDF 定稿以便打印或分发，扁平化可编辑字段，无需上传。',
    keywords: ['PDF扁平化', '锁定表单', '固化PDF表单', 'PDF定稿', 'flatten pdf', 'lock pdf fields'],
  },
  'pdf-form-fill': {
    name: '填写 PDF 表单',
    tagline: '填写 AcroForm 文本、复选框和下拉字段。',
    description:
      '填写 PDF 的 AcroForm 文本框、复选框、单选钮和下拉字段并保存结果，全程在浏览器本地处理，无需上传。',
    keywords: ['填写PDF表单', 'PDF表单填充', 'AcroForm', '完成PDF表单', 'fill pdf form', 'pdf form filler'],
  },
  'pdf-image-extract': {
    name: '从 PDF 提取图片',
    tagline: '把内嵌图片导出为 PNG 并打包 ZIP。',
    description:
      '提取 PDF 页面中内嵌的图片，以 PNG 格式打包成 ZIP 下载，全程本地处理无需上传。',
    keywords: ['PDF提取图片', 'PDF图片导出', 'PDF转图片', '保存PDF图片', 'extract images from pdf', 'pdf image extractor'],
  },
  'pdf-insert': {
    name: '向 PDF 插入页面',
    tagline: '在任意位置插入另一份 PDF 的页面。',
    description:
      '把另一份 PDF 的页面插入到开头、结尾或指定页之后，实现选择性合并，全程在浏览器进行。',
    keywords: ['插入PDF页面', 'PDF添加页面', '指定位置合并PDF', 'PDF插页', 'insert pdf pages', 'merge pdf'],
  },
  'pdf-linearize': {
    name: 'PDF 网页优化',
    tagline: '去除重复对象、重建压缩流。',
    description:
      '清理 PDF，去除重复对象并重建压缩流，生成更小、更适合网络加载的文件，本地处理。',
    keywords: ['优化PDF', 'PDF线性化', '压缩PDF网页', 'PDF瘦身', 'optimize pdf', 'linearize pdf'],
  },
  'pdf-metadata': {
    name: '编辑 PDF 元数据',
    tagline: '修改标题、作者、主题和关键词。',
    description:
      '在浏览器中编辑 PDF 的标题、作者、主题和关键词等元数据，分享前整理文档属性，无需上传。',
    keywords: ['PDF元数据', '编辑PDF属性', '修改PDF作者', 'PDF标题编辑', 'pdf metadata', 'edit pdf properties'],
  },
  'pdf-nup': {
    name: 'PDF 多页合一',
    tagline: '把 2/4/6/9 页排到一张纸上。',
    description:
      '把 2、4、6 或 9 个 PDF 页面排到一张纸上，便于省纸打印或制作样张，全程在浏览器进行。',
    keywords: ['PDF多页合一', '每张多页', 'PDF拼版', 'PDF小册子', 'pdf n-up', 'pages per sheet'],
  },
  'pdf-page-numbers': {
    name: '为 PDF 添加页码',
    tagline: '为整份文档统一加盖页码。',
    description:
      '为 PDF 每一页添加页码，可选位置和格式样式，本地处理无需上传。',
    keywords: ['PDF添加页码', 'PDF页码', '给PDF编号', 'PDF分页', 'add page numbers to pdf', 'pdf page numbers'],
  },
  'pdf-previews': {
    name: 'PDF 页面转 PNG',
    tagline: '把每一页渲染成 PNG/JPG 并打包 ZIP。',
    description:
      '把 PDF 所有页面渲染成 PNG 或 JPG 图片并打包成 ZIP 下载，适合做缩略图和预览，全程本地。',
    keywords: ['PDF转PNG', 'PDF页面转图片', 'PDF缩略图', '渲染PDF页面', 'pdf to png', 'pdf thumbnails'],
  },
  'pdf-repair': {
    name: '修复 PDF',
    tagline: '针对损坏 PDF 的两阶段恢复。',
    description:
      '通过结构修复加栅格化重组的备用方案，恢复损坏的 PDF，修好打不开的文件，全程在浏览器进行。',
    keywords: ['修复PDF', '修复损坏PDF', '恢复PDF', 'PDF修复工具', 'repair pdf', 'fix corrupted pdf'],
  },
  'pdf-search': {
    name: '批量搜索 PDF',
    tagline: '在多份 PDF 中一次性查找关键词。',
    description:
      '在多份 PDF 中一次性搜索关键词，并查看每处命中的上下文，快速定位文档，全程本地处理。',
    keywords: ['搜索PDF', '批量搜索PDF', 'PDF关键词搜索', '在PDF中查找文字', 'search pdf', 'find text in pdf'],
  },
  'pdf-sign': {
    name: 'PDF 签名',
    tagline: '手绘签名并放置到 PDF 上。',
    description:
      '用鼠标或触控手绘签名，再拖放到 PDF 上完成签署，在浏览器中签名，无需上传。',
    keywords: ['PDF签名', '电子签名', 'PDF添加签名', '在线签署PDF', 'sign pdf', 'pdf signature'],
  },
  'pdf-stats': {
    name: 'PDF 统计分析',
    tagline: '分析页数、字数、字体和元数据。',
    description:
      '分析 PDF 的页数、字数与字符数、字体、大纲和元数据，生成完整文档报告，全程在浏览器进行。',
    keywords: ['PDF统计', 'PDF字数统计', 'PDF分析', 'PDF信息', 'pdf statistics', 'pdf word count'],
  },
  'pdf-to-epub': {
    name: 'PDF 转 EPUB',
    tagline: '把 PDF 转成可重排的 EPUB 电子书。',
    description:
      '提取 PDF 文字生成分章节的 EPUB，让内容在手机和电子阅读器上自动重排，在浏览器中转换，无需上传。',
    keywords: ['PDF转EPUB', 'PDF转电子书', 'PDF转阅读器', 'pdf to epub', 'pdf to ebook'],
  },
  'pdf-to-html': {
    name: 'PDF 转 HTML',
    tagline: '把 PDF 转成结构化的 HTML 页面。',
    description:
      '把 PDF 的文字转成带标题和段落结构的 HTML 页面，全程在浏览器本地处理。',
    keywords: ['PDF转HTML', 'PDF转网页', 'PDF网页转换', 'pdf to html', 'pdf to webpage'],
  },
  'pdf-to-md': {
    name: 'PDF 转 Markdown',
    tagline: '把 PDF 转成结构化的 Markdown。',
    description:
      '把 PDF 转成 Markdown，依据字号推断 # / ## / ### 标题层级，适合做笔记和文档，全程在浏览器进行。',
    keywords: ['PDF转Markdown', 'PDF转MD', 'PDF转文本', 'pdf to markdown', 'pdf md converter'],
  },
  'pdf-to-txt': {
    name: 'PDF 转文本',
    tagline: '把 PDF 文字提取为纯 .txt 文件。',
    description:
      '提取 PDF 中的全部文字并保存为纯文本文件，方便复制和再利用，本地处理无需上传。',
    keywords: ['PDF转文本', 'PDF转TXT', '从PDF提取文字', 'PDF文字提取', 'pdf to text', 'pdf to txt'],
  },
  'pdf-visual-diff': {
    name: 'PDF 视觉对比',
    tagline: '逐像素比对页面差异。',
    description:
      '逐像素比对两份 PDF 的同一页并高亮视觉差异，捕捉版式变化，全程在浏览器进行。',
    keywords: ['PDF视觉对比', 'PDF页面比对', 'PDF像素对比', 'pdf visual diff', 'compare pdf pages'],
  },
  'blur-face': {
    name: '人脸与车牌模糊',
    tagline: '自动识别人脸并用模糊或马赛克遮挡。',
    description:
      '用 AI 自动识别人脸，并以模糊、马赛克、表情或黑条遮挡，支持批量文件夹、反向和车牌模式，全程本地。',
    keywords: ['人脸模糊', '照片打码', '马赛克人脸', '图片匿名', '车牌模糊', 'blur face', 'blur license plate'],
  },
  'image-ascii-art': {
    name: '图片转字符画',
    tagline: '把照片转成文字字符组成的图案。',
    description:
      '把图片转成由文字字符组成的 ASCII 字符画，可导出为 TXT 或 PNG，复古趣味效果，全程在浏览器进行。',
    keywords: ['图片转字符画', 'ASCII字符画', '照片转ASCII', '字符画生成', 'image to ascii', 'ascii art'],
  },
  'image-batch-watermark': {
    name: '批量图片加水印',
    tagline: '一次为多张照片添加同一水印。',
    description:
      '为多张图片一次性添加相同的文字或 Logo 水印并一并下载，在浏览器中保护整批图片。',
    keywords: ['批量水印', '多图加水印', '批量加水印', '图片加水印', 'batch watermark', 'bulk watermark'],
  },
  'image-collage': {
    name: '图片拼贴制作',
    tagline: '把多张图片合成为一张网格。',
    description:
      '把多张图片排成网格并导出为一张 JPG 拼贴图，快速制作照片九宫格，全程在浏览器处理。',
    keywords: ['拼贴制作', '照片拼贴', '图片网格', '合并图片', '九宫格', 'collage maker', 'photo collage'],
  },
  'image-color-adjust': {
    name: '图片色彩调整',
    tagline: '实时调节亮度、对比度、饱和度等。',
    description:
      '实时预览调节亮度、对比度、饱和度、色相、模糊、怀旧和反色，在浏览器中快速修图。',
    keywords: ['图片色彩调整', '亮度对比度', '照片调色', '图片饱和度', 'adjust image color', 'photo color editor'],
  },
  'image-denoise': {
    name: '图片降噪',
    tagline: '用中值滤波平滑颗粒噪点。',
    description:
      '用中值滤波减少照片中的噪点和颗粒，让画面更干净，全程在浏览器本地处理。',
    keywords: ['图片降噪', '照片去噪', '去除颗粒', '图片噪点消除', 'reduce image noise', 'denoise photo'],
  },
  'image-diff': {
    name: '图片视觉对比',
    tagline: '高亮两张图片之间的像素差异。',
    description:
      '逐像素比对两张图片并用红色标出差异，发现修改和改动，全程在浏览器进行。',
    keywords: ['图片对比', '比较图片', '图片像素对比', '找不同', 'image diff', 'compare images'],
  },
  'image-exif-batch': {
    name: '批量清除 EXIF',
    tagline: '从多张照片中移除 GPS 和相机信息。',
    description:
      '分享前一次性移除多张照片的 GPS 位置和相机 EXIF 信息，保护隐私，全程本地。',
    keywords: ['批量清除EXIF', '批量移除EXIF', '批量去GPS', '清除照片信息', 'batch strip exif', 'remove exif'],
  },
  'image-exif-strip': {
    name: '清除 EXIF 信息',
    tagline: '移除照片中的位置和相机信息。',
    description:
      '发布前移除照片的 GPS 和相机 EXIF 元数据以保护隐私，本地处理无需上传。',
    keywords: ['清除EXIF', '移除EXIF信息', '去除照片GPS', '删除图片元数据', 'remove exif', 'strip exif data'],
  },
  'image-exif-view': {
    name: 'EXIF 查看器',
    tagline: '查看照片的相机、GPS 和拍摄信息。',
    description:
      '查看照片的 EXIF 信息——相机型号、拍摄参数、GPS 位置和拍摄时间，全程在浏览器进行。',
    keywords: ['EXIF查看器', '查看照片信息', '查看图片GPS', '照片EXIF信息', 'exif viewer', 'photo metadata'],
  },
  'image-pixelate': {
    name: '图片马赛克',
    tagline: '对整张图或局部区域打马赛克。',
    description:
      '对整张图片或选定区域应用马赛克/像素化效果，遮挡敏感部分，全程在浏览器进行。',
    keywords: ['图片马赛克', '照片像素化', '图片打码', '局部模糊', 'pixelate image', 'mosaic photo'],
  },
  'image-slideshow': {
    name: '图片转幻灯片视频',
    tagline: '把照片做成 MP4 幻灯片。',
    description:
      '把多张图片合成为带时长控制的 MP4 幻灯片视频，制作照片集锦并分享，在浏览器中生成。',
    keywords: ['图片幻灯片', '照片转视频', '幻灯片制作', '图片转MP4', 'image slideshow', 'photos to video'],
  },
  'gif-crop': {
    name: '裁剪 GIF',
    tagline: '把动图裁剪到指定区域。',
    description:
      '将 GIF 动图的所有帧裁剪到选定区域，只保留你想要的画面，全程在浏览器中完成。',
    keywords: ['裁剪GIF', 'GIF裁剪', 'crop gif', '动图裁剪', 'GIF动图编辑', 'jiancai gif'],
  },
  'gif-effects': {
    name: 'GIF 特效',
    tagline: '倒放、加速或乒乓循环动图。',
    description:
      '为 GIF 动图添加倒放、变速和乒乓循环等特效，制作有趣循环，全程在浏览器中完成。',
    keywords: ['GIF特效', '倒放GIF', 'GIF变速', '乒乓循环', 'gif effects', 'reverse gif', 'dongtu texiao'],
  },
  'gif-optimize': {
    name: '压缩 GIF',
    tagline: '通过优化调色板和抽帧缩小动图。',
    description:
      '优化 GIF 调色板并适当抽帧来减小文件体积，让动图更小且依然流畅播放，本地处理。',
    keywords: ['压缩GIF', 'GIF优化', '缩小GIF', 'GIF瘦身', 'optimize gif', 'compress gif', 'yasuo gif'],
  },
  'gif-resize': {
    name: '调整 GIF 尺寸',
    tagline: '改变动图尺寸，保持循环不变。',
    description:
      '将 GIF 动图缩放到新尺寸，可锁定或解锁宽高比，同时减小文件体积，全程在浏览器中完成。',
    keywords: ['GIF尺寸', '调整GIF大小', '缩放GIF', 'GIF分辨率', 'resize gif', 'scale gif', 'tiaozheng gif'],
  },
  'gif-text': {
    name: '给 GIF 添加文字',
    tagline: '为动图添加字幕或标注。',
    description:
      '在 GIF 动图上添加贯穿全程的文字或字幕，制作表情包标注和说明，全程在浏览器中渲染。',
    keywords: ['GIF加字', 'GIF字幕', '动图文字', '表情包文字', 'add text to gif', 'gif caption', 'gif jiazi'],
  },
  'gif-trim': {
    name: '截取 GIF',
    tagline: '把动图裁剪到指定时间段。',
    description:
      '将 GIF 动图截取到指定起止时间，只保留这一段并去掉多余帧，全程在浏览器中完成。',
    keywords: ['截取GIF', 'GIF剪辑', 'GIF缩短', '裁剪GIF时长', 'trim gif', 'cut gif', 'jiequ gif'],
  },
  'audio-compress': {
    name: '压缩音频',
    tagline: '降低码率以缩小音频文件。',
    description:
      '通过浏览器内的 FFmpeg 降低音频码率来减小文件体积，便于分享，文件不上传服务器。',
    keywords: ['压缩音频', '音频瘦身', '缩小MP3', '降低音频码率', 'compress audio', 'reduce audio size', 'yasuo yinpin'],
  },
  'audio-fade': {
    name: '音频淡入淡出',
    tagline: '为开头和结尾添加平滑渐变。',
    description:
      '在音频轨道的开头和结尾添加平滑的淡入淡出效果，让前奏和尾声更自然，全程在浏览器中完成。',
    keywords: ['音频淡入淡出', '淡入', '淡出', '音频渐变', 'audio fade', 'fade in out', 'yinpin danru'],
  },
  'audio-merge': {
    name: '合并音频',
    tagline: '按顺序拼接音频并可加交叉淡化。',
    description:
      '将多个音频文件按顺序拼接为一个，可选交叉淡化，把曲目和片段合到一起，全程在浏览器中完成。',
    keywords: ['合并音频', '音频拼接', '合并MP3', '音频连接', 'merge audio', 'join audio', 'hebing yinpin'],
  },
  'audio-silence-trim': {
    name: '自动去除静音',
    tagline: '自动剪掉静音间隙。',
    description:
      '自动检测并剪除音频中的静音间隙，让录音更紧凑，适合整理人声和播客，全程在浏览器中完成。',
    keywords: ['去除静音', '剪掉静音', '音频去空白', '自动去静音', 'remove silence', 'trim silence', 'quchu jingyin'],
  },
  'audio-speed': {
    name: '调整音频速度',
    tagline: '0.25 至 4 倍变速且不变调。',
    description:
      '将音频播放速度调整为 0.25 至 4 倍，同时保持音调不变（atempo 滤镜），可加速或放慢，全程在浏览器中完成。',
    keywords: ['音频变速', '音频加速', '音频放慢', '调整音频速度', 'change audio speed', 'audio tempo', 'yinpin biansu'],
  },
  'audio-volume': {
    name: '调整音频音量',
    tagline: '按分贝增益或归一化响度（LUFS）。',
    description:
      '按分贝增大或减小音量，或将响度归一化到目标 LUFS，使音量保持一致，全程在浏览器中完成。',
    keywords: ['调整音量', '增大音量', '音频归一化', '音量调节', 'adjust volume', 'normalize audio', 'tiaozheng yinliang'],
  },
  'video-audio-replace': {
    name: '替换视频音轨',
    tagline: '替换或混合视频的音轨。',
    description:
      '用另一个声音文件替换视频的音轨，或将两者混合，更换背景音乐，全程在浏览器中完成。',
    keywords: ['替换视频音轨', '更换视频声音', '给视频配乐', '替换音轨', 'replace video audio', 'add music to video', 'tihuan yinzhou'],
  },
  'video-blur-face': {
    name: '视频人脸打码',
    tagline: '追踪并模糊视频中的人脸。',
    description:
      '用 AI 在视频中追踪人脸，并以模糊、马赛克或表情贴图遮盖，同时保留原声，全程在浏览器中完成。',
    keywords: ['视频人脸打码', '视频人脸模糊', '视频匿名', '人脸马赛克', 'blur face video', 'anonymize video', 'renlian dama'],
  },
  'video-burn-subtitle': {
    name: '字幕压制',
    tagline: '将 SRT/VTT/ASS 字幕永久嵌入。',
    description:
      '把 SRT、VTT 或 ASS 字幕永久压制进视频，使字幕始终显示（硬字幕），全程在浏览器中完成。',
    keywords: ['字幕压制', '硬字幕', '视频加字幕', '嵌入字幕', 'burn subtitles', 'hardcode subtitles', 'zimu yazhi'],
  },
  'video-extract-frames': {
    name: '提取视频帧',
    tagline: '把每一帧保存为图片。',
    description:
      '从视频中提取帧并保存为图片，可抓取单帧或每一帧，全程在浏览器中完成。',
    keywords: ['提取视频帧', '视频转图片', '保存视频帧', '抓帧', 'extract frames', 'video to images', 'tiqu shipinzhen'],
  },
  'video-merge': {
    name: '合并视频',
    tagline: '按顺序拼接片段并统一编码。',
    description:
      '将多个视频片段按顺序拼接为一个，自动统一编码格式，把素材连接起来，全程在浏览器中完成。',
    keywords: ['合并视频', '视频拼接', '合并片段', '视频连接', 'merge videos', 'join video clips', 'hebing shipin'],
  },
  'video-poster': {
    name: '提取视频封面帧',
    tagline: '从任意时间点抓取静帧。',
    description:
      '从视频选定时刻抓取一帧静态图片，用作缩略图或封面帧，全程在浏览器中完成。',
    keywords: ['视频封面', '视频缩略图', '抓取视频帧', '视频截图', 'video poster', 'video thumbnail', 'shipin fengmian'],
  },
  'video-rotate': {
    name: '旋转视频',
    tagline: '旋转 90/180° 并可水平/垂直翻转。',
    description:
      '将视频旋转 90 或 180 度，并可水平或垂直翻转，修正拍歪的片段，全程在浏览器中完成。',
    keywords: ['旋转视频', '翻转视频', '视频转向', '修正视频方向', 'rotate video', 'flip video', 'xuanzhuan shipin'],
  },
  'epub-compress': {
    name: '压缩 EPUB',
    tagline: '重新编码图片以缩小电子书。',
    description:
      '通过重新编码并缩小 EPUB 中的图片来减小文件体积，让电子书更轻便，全程在浏览器中完成。',
    keywords: ['压缩EPUB', '电子书瘦身', '缩小EPUB', '优化电子书', 'compress epub', 'reduce epub size', 'yasuo epub'],
  },
  'epub-cover-extract': {
    name: '提取 EPUB 封面',
    tagline: '从电子书中提取封面图。',
    description:
      '以原始完整画质提取 EPUB 的封面图片，抓取封面插画，本地处理，文件不上传。',
    keywords: ['提取EPUB封面', '电子书封面', '获取封面图', 'EPUB封面', 'extract epub cover', 'ebook cover', 'tiqu fengmian'],
  },
  'epub-cover-replace': {
    name: '替换 EPUB 封面',
    tagline: '用新图片替换电子书封面。',
    description:
      '用新图片替换 EPUB 的封面，并下载更新后的电子书，全程在浏览器中完成，文件不上传。',
    keywords: ['替换EPUB封面', '更换电子书封面', '新封面', '编辑EPUB封面', 'replace epub cover', 'change ebook cover', 'tihuan fengmian'],
  },
  'epub-images-extract': {
    name: '提取 EPUB 图片',
    tagline: '把电子书中的所有图片打包成 ZIP。',
    description:
      '提取 EPUB 中的全部图片（封面和插图）并打包为 ZIP，收集书中插画，全程在浏览器中完成。',
    keywords: ['提取EPUB图片', '电子书图片', '获取书中插图', 'EPUB插画', 'extract epub images', 'ebook images', 'tiqu tupian'],
  },
  'epub-merge': {
    name: '合并 EPUB',
    tagline: '把多本电子书合并为一本。',
    description:
      '将多个 EPUB 文件按顺序合并为一本电子书，适合合并分卷或章节，全程在浏览器中完成。',
    keywords: ['合并EPUB', '合并电子书', '拼接EPUB', 'EPUB合并', 'merge epub', 'combine epub', 'hebing epub'],
  },
  'epub-metadata': {
    name: '编辑 EPUB 元数据',
    tagline: '修改标题、作者、语言和标签。',
    description:
      '编辑 EPUB 的标题、作者、语言、简介和标签，让它在阅读器中整齐排序，全程在浏览器中完成。',
    keywords: ['EPUB元数据', '编辑电子书信息', '修改EPUB作者', 'EPUB标题', 'epub metadata', 'edit ebook metadata', 'epub yuanshuju'],
  },
  'epub-reader': {
    name: 'EPUB 阅读器',
    tagline: '在浏览器里直接阅读电子书。',
    description:
      '在浏览器中打开并阅读 EPUB 电子书，支持目录、主题和字号调节，文件不上传。',
    keywords: ['EPUB阅读器', '在线读EPUB', '打开EPUB', '电子书阅读器', 'epub reader', 'read epub online', 'epub yueduqi'],
  },
  'epub-split': {
    name: '拆分 EPUB 章节',
    tagline: '把每个章节拆成单独的 EPUB。',
    description:
      '将 EPUB 的各章节拆分为独立的 EPUB 文件并打包成 ZIP，把大部头拆成小份，全程在浏览器中完成。',
    keywords: ['拆分EPUB', 'EPUB分章', '拆分电子书章节', '分割电子书', 'split epub', 'epub chapter split', 'chaifen epub'],
  },
  'epub-stats': {
    name: 'EPUB 统计',
    tagline: '统计字数、章节和图片数量。',
    description:
      '分析 EPUB 的字数、字符数、章节数和图片数，以及每章长度，生成阅读报告，全程在浏览器中完成。',
    keywords: ['EPUB统计', 'EPUB字数', '电子书统计', '统计EPUB字数', 'epub statistics', 'epub word count', 'epub tongji'],
  },
  'epub-to-html': {
    name: 'EPUB 转 HTML',
    tagline: '把电子书导出为 HTML。',
    description:
      '将 EPUB 转换为内嵌图片的单个 HTML 文件，或导出按章节分的 HTML 并打包成 ZIP，全程在浏览器中完成。',
    keywords: ['EPUB转HTML', '电子书转HTML', 'EPUB导出网页', 'EPUB转网页', 'epub to html', 'ebook to html', 'epub zhuan html'],
  },
  'epub-to-md': {
    name: 'EPUB 转 Markdown',
    tagline: '把电子书章节转为 Markdown。',
    description:
      '将 EPUB 的各章节转换为 Markdown，可导出为单个文件或按章节打包成 ZIP，便于复用为笔记，全程在浏览器中完成。',
    keywords: ['EPUB转Markdown', '电子书转MD', 'EPUB转笔记', 'EPUB转markdown', 'epub to markdown', 'ebook to md', 'epub zhuan md'],
  },
  'epub-to-txt': {
    name: 'EPUB 转文本',
    tagline: '把电子书正文提取为纯文本 .txt。',
    description:
      '将 EPUB 的正文转换为纯文本文件，便于快速复制和复用，本地处理，文件不上传。',
    keywords: ['EPUB转文本', 'EPUB转txt', '提取电子书文字', '电子书转文本', 'epub to text', 'epub to txt', 'epub zhuan wenben'],
  },
  'epub-validate': {
    name: '校验 EPUB 结构',
    tagline: '检查 OPF、spine、manifest 和资源。',
    description:
      '检查 EPUB 的结构——OPF、spine、manifest、封面及缺失资源，帮你提前发现问题，全程在浏览器中完成。',
    keywords: ['校验EPUB', 'EPUB检查', 'EPUB结构检查', '修复EPUB错误', 'validate epub', 'epub checker', 'jiaoyan epub'],
  },
  'md-to-epub': {
    name: 'Markdown 转 EPUB',
    tagline: '把 Markdown 制作成分章电子书。',
    description:
      '将 Markdown 转换为 EPUB，按标题拆分章节并可选添加封面，在浏览器里制作电子书。',
    keywords: ['Markdown转EPUB', 'MD转EPUB', 'Markdown做电子书', 'md转电子书', 'markdown to epub', 'md to epub', 'md zhuan epub'],
  },
  'txt-to-epub': {
    name: '文本转 EPUB',
    tagline: '把纯文本制作成 EPUB 电子书。',
    description:
      '将 TXT 文件或粘贴的文本转换为可在任意阅读器中阅读的 EPUB 电子书，全程在浏览器中完成。',
    keywords: ['文本转EPUB', 'txt转EPUB', '文本做电子书', 'txt转电子书', 'text to epub', 'txt to epub', 'wenben zhuan epub'],
  },
  chart: {
    name: '图表生成（导出 PNG）',
    tagline: '制作柱状图、折线图和饼图并导出 PNG。',
    description:
      '输入数据即可生成柱状图、折线图或饼图并导出为 PNG 图片，直接插入报告和幻灯片，本地处理。',
    keywords: ['图表生成', '图表转PNG', '柱状图生成', '做图表', 'chart maker', 'bar chart generator', 'tubiao shengcheng'],
  },
  'csv-diff': {
    name: '对比 CSV 文件',
    tagline: '按关键列做行级差异对比。',
    description:
      '以关键列为基准逐行对比两个 CSV 文件，标出新增、删除和修改的行，全程在浏览器中完成。',
    keywords: ['对比CSV', 'CSV差异', 'CSV比较', '比对CSV文件', 'compare csv', 'csv diff', 'duibi csv'],
  },
  'docx-to-md': {
    name: 'DOCX 转 Markdown',
    tagline: '把 Word 文档转换为 Markdown。',
    description:
      '将 Word DOCX 文档转换为干净的 Markdown，适合笔记、wiki 和版本管理，全程在浏览器中完成。',
    keywords: ['DOCX转Markdown', 'Word转Markdown', 'Word转MD', 'docx转md', 'docx to markdown', 'word to markdown', 'docx zhuan md'],
  },
  'md-html': {
    name: 'Markdown 与 HTML 互转',
    tagline: '在 Markdown 和 HTML 之间互转并预览。',
    description:
      '在 Markdown 和 HTML 之间双向转换并实时预览，便于撰写内容并发布到网页，全程在浏览器中完成。',
    keywords: ['Markdown转HTML', 'HTML转Markdown', 'MD转HTML', 'markdown互转', 'markdown to html', 'html to markdown', 'md html huzhuan'],
  },
  'markdown-stats': {
    name: 'Markdown 统计',
    tagline: '分析字数、标题、链接和图片。',
    description:
      '分析 Markdown 文档的结构——字数、标题、链接、图片和代码块，一目了然，全程在浏览器中完成。',
    keywords: ['Markdown统计', 'Markdown字数', '分析Markdown', 'MD统计', 'markdown stats', 'markdown word count', 'markdown tongji'],
  },
  'markdown-toc': {
    name: 'Markdown 目录生成器',
    tagline: '根据标题自动生成目录。',
    description:
      '从 Markdown 文档的标题自动生成目录，支持插入、编号和链接选项，全程在浏览器中完成。',
    keywords: ['Markdown目录', 'TOC生成', '目录生成器', 'markdown toc', 'table of contents', 'md大纲'],
  },
  'xlsx-convert': {
    name: 'Excel ↔ CSV ↔ JSON 转换器',
    tagline: '在 Excel、CSV 和 JSON 之间自由转换。',
    description:
      '在 Excel（XLSX）、CSV 和 JSON 之间互相转换，支持选择工作表，表格数据随处可用，全程在浏览器中完成。',
    keywords: ['Excel转CSV', 'Excel转JSON', 'CSV转Excel', '表格转换', 'xlsx convert', 'excel to json'],
  },
  'subtitle-convert': {
    name: '字幕格式转换器',
    tagline: '在 SRT、VTT、ASS、LRC 和 TXT 之间转换。',
    description:
      '在 SRT、VTT、ASS、LRC 和 TXT 之间自由转换字幕，解决平台兼容问题，全程在浏览器中完成。',
    keywords: ['字幕转换', 'SRT转VTT', 'VTT转SRT', '字幕格式', 'subtitle converter', 'srt to vtt'],
  },
  'subtitle-edit': {
    name: '字幕编辑与时间轴同步',
    tagline: '编辑并重新校时 SRT/VTT/ASS/LRC 字幕。',
    description:
      '编辑字幕文本、批量平移时间轴或转换 SRT、VTT、ASS、LRC 格式，在浏览器中完成字幕制作。',
    keywords: ['字幕编辑', '字幕同步', '时间轴校正', '字幕平移', 'subtitle editor', '字幕时间'],
  },
  'text-replace': {
    name: '文本查找替换',
    tagline: '支持正则和捕获组的批量替换。',
    description:
      '使用正则表达式和捕获组批量查找替换文本，实时显示匹配数量，在浏览器中整理文本。',
    keywords: ['查找替换', '批量替换', '正则替换', '文本替换', 'find and replace', 'regex replace'],
  },
  'url-parser': {
    name: 'URL 解析器',
    tagline: '拆解并重组 URL 与查询参数。',
    description:
      '将 URL 拆解为各个组成部分，可视化编辑查询参数后重新组合，在浏览器中查看和调整链接。',
    keywords: ['URL解析', '网址解析', '查询参数', '链接拆解', 'url parser', 'query string'],
  },
  'random-pick': {
    name: '随机抽取器',
    tagline: '从名单中公平抽出获奖者。',
    description:
      '基于 Web Crypto 的均匀随机算法，从名单中抽取获奖者，适合公平抽奖和赠品活动，全程在浏览器中完成。',
    keywords: ['随机抽取', '随机抽奖', '随机点名', '抽奖工具', 'random picker', 'random winner'],
  },
  'timer-stopwatch': {
    name: '计时器与秒表',
    tagline: '番茄钟预设、计圈和闹铃。',
    description:
      '集计时器与秒表于一体，提供番茄钟等预设、计圈记录以及到时闹铃，在浏览器中运行。',
    keywords: ['计时器', '秒表', '番茄钟', '倒计时', 'online timer', 'stopwatch'],
  },
  'age-calc': {
    name: '年龄计算器',
    tagline: '精确计算年龄及里程碑天数。',
    description:
      '根据出生日期精确计算几岁几个月几天，并显示里程碑天数，全程在浏览器中即时完成。',
    keywords: ['年龄计算', '周岁计算', '出生日期', '我几岁', 'age calculator', 'calculate age'],
  },
  dday: {
    name: '纪念日倒数',
    tagline: '同时追踪多个事件的倒数日。',
    description:
      '在同一屏幕追踪多个事件的倒数日——距离考试、旅行和截止日期还有多少天，全程在浏览器中完成。',
    keywords: ['纪念日倒数', '倒数日', '倒计时', '距离天数', 'd-day', 'countdown'],
  },
  'json-to-ts': {
    name: 'JSON 转 TypeScript',
    tagline: '从任意 JSON 生成 TypeScript 接口。',
    description:
      '粘贴 JSON 即可生成带类型推断的简洁 TypeScript 接口，全部在本地浏览器中运行，不上传任何数据。',
    keywords: ['JSON转TS', 'JSON转接口', '类型生成', 'TypeScript生成', 'json to typescript', 'interface'],
  },
  'css-gradient': {
    name: 'CSS 渐变生成器',
    tagline: '设计线性和径向渐变并复制代码。',
    description:
      '选取颜色和角度，实时预览渐变效果并复制 CSS 代码，全程在浏览器中完成。',
    keywords: ['CSS渐变', '线性渐变', '径向渐变', '背景渐变', 'css gradient', 'linear gradient'],
  },
  'html-format': {
    name: 'HTML 格式化',
    tagline: '美化或压缩 HTML 并正确缩进。',
    description:
      '粘贴杂乱的 HTML，可美化为整齐缩进的格式，或压缩为单行，全程在本地浏览器中完成。',
    keywords: ['HTML格式化', 'HTML美化', 'HTML压缩', '代码缩进', 'html formatter', 'beautify html'],
  },
  'image-split': {
    name: '图片分割器',
    tagline: '将图片切成 N×M 网格小块。',
    description:
      '将照片按网格分割（例如用于 Instagram 九宫格），并把每个小块打包为 ZIP 下载，全程在本地完成。',
    keywords: ['图片分割', '九宫格切图', '图片切割', '网格分割', 'image splitter', 'instagram grid'],
  },
  'image-base64': {
    name: '图片转 Base64',
    tagline: '图片与 Base64 数据 URI 互转。',
    description:
      '将图片编码为 Base64 数据 URI 以内嵌到 CSS/HTML，或将数据 URI 解码还原为图片，全程在浏览器中完成。',
    keywords: ['图片转Base64', 'Base64转图片', '数据URI', '内嵌图片', 'image to base64', 'data uri'],
  },
  'image-round-corners': {
    name: '图片圆角处理',
    tagline: '为图片添加透明圆角。',
    description:
      '按可调节的半径为图片添加圆角，并导出透明背景 PNG，全程在本地运行。',
    keywords: ['图片圆角', '圆角PNG', '图片倒角', '圆形裁剪', 'round corners', 'rounded png'],
  },
  'video-speed': {
    name: '视频变速',
    tagline: '将视频加速或减速，0.25× 至 4×。',
    description:
      '使用 FFmpeg.wasm 调节播放速度并同步音频音调，在本地制作慢动作或延时视频。',
    keywords: ['视频变速', '视频加速', '慢动作', '延时视频', 'change video speed', 'video speed'],
  },
  'video-watermark': {
    name: '视频添加水印',
    tagline: '为视频叠加 Logo 或文字水印。',
    description:
      '在视频上放置 Logo 图片或文字水印，位置和透明度可调，由 FFmpeg.wasm 驱动，全程在本地完成。',
    keywords: ['视频水印', '添加Logo', '叠加水印', '品牌视频', 'video watermark', 'add logo'],
  },
  'dedupe-lines': {
    name: '删除重复行',
    tagline: '删除重复行并保留原始顺序。',
    description:
      '粘贴列表即可删除重复行，可选择忽略大小写和去除首尾空格，全程在本地运行。',
    keywords: ['删除重复行', '去重', '唯一行', '去除重复', 'remove duplicate lines', 'dedupe'],
  },
  'whitespace-clean': {
    name: '空白字符清理',
    tagline: '去除行尾空格、合并空行并修正制表符。',
    description:
      '清理杂乱文本：去除行尾空白、合并多余空行并规范缩进，全程在本地完成。',
    keywords: ['空白清理', '去除空格', '删除空行', '清理文本', 'whitespace cleaner', 'trim spaces'],
  },
  slugify: {
    name: 'URL别名生成',
    tagline: '将标题转换为简洁的 URL 别名。',
    description:
      '将任意文本转换为 URL 安全的别名（kebab-case），并转写重音字符，适合做固定链接，全程在本地运行。',
    keywords: ['URL别名', 'slug生成', '固定链接', '文本转slug', 'slugify', 'url slug'],
  },
  'word-frequency': {
    name: '词频统计',
    tagline: '统计文本中每个词出现的次数。',
    description:
      '粘贴文本即可按出现频率排序查看词频，可选过滤停用词，所有处理均在本地完成。',
    keywords: ['词频统计', '词频分析', '关键词密度', '单词计数', 'word frequency', 'keyword density'],
  },
  'column-extract': {
    name: '列提取器',
    tagline: '从分隔文本中提取指定的列。',
    description:
      '按分隔符拆分文本，仅提取你选择的列并可重新排序，全程在浏览器中完成。',
    keywords: ['列提取', '提取列', '分隔文本', '列处理', 'column extractor', 'cut columns'],
  },
  'bmi-calc': {
    name: 'BMI计算',
    tagline: '根据身高体重计算身体质量指数。',
    description:
      '输入身高和体重即可得出 BMI 及世卫组织分类，支持公制和英制，全程在本地运行。',
    keywords: ['BMI计算', '身体质量指数', '体重指数', 'BMI计算器', 'bmi calculator', 'body mass index'],
  },
  'loan-calc': {
    name: '贷款计算器',
    tagline: '估算贷款的月供和总利息。',
    description:
      '输入本金、利率和期限，即可得出月供金额和总利息（等额本息），全程在浏览器中完成。',
    keywords: ['贷款计算', '月供计算', '等额本息', '房贷计算', 'loan calculator', 'mortgage'],
  },
  'aspect-ratio': {
    name: '宽高比计算器',
    tagline: '按目标宽高比计算宽度或高度。',
    description:
      '锁定如 16:9 的宽高比，当你修改宽度或高度时自动计算另一边的匹配数值，全程在本地运行。',
    keywords: ['宽高比', '16:9计算', '比例计算', '分辨率计算', 'aspect ratio', 'resolution'],
  },
  pomodoro: {
    name: '番茄钟',
    tagline: '25 分钟专注、5 分钟休息循环。',
    description:
      '简洁的番茄钟，交替进行专注和休息时段并配有提醒通知，浏览器即用，无需注册。',
    keywords: ['番茄钟', '专注计时', '25分钟', '效率计时器', 'pomodoro', 'focus timer'],
  },
  'roman-numeral': {
    name: '罗马数字转换器',
    tagline: '阿拉伯数字与罗马数字互转。',
    description:
      '将数字转换为罗马数字（I、V、X、L、C、D、M）并可反向还原，全程在浏览器中完成。',
    keywords: ['罗马数字', '数字转罗马', '罗马数字转换', '数字转换', 'roman numeral', 'number to roman'],
  },
  'password-strength': {
    name: '密码强度检测',
    tagline: '估算密码熵值和破解时间。',
    description:
      '检测密码强度——显示熵值比特数和预估破解时间，全程不向任何地方发送，仅在本地完成。',
    keywords: ['密码强度', '密码熵', '破解时间', '密码检测', 'password strength', 'entropy'],
  },
  diceware: {
    name: '密码短语生成',
    tagline: '用强随机性生成易记的词组密码。',
    description:
      '使用密码学安全的随机性生成 Diceware 风格的词组密码短语，可自定义词数，全程在浏览器中完成。',
    keywords: ['密码短语', '口令生成', '易记密码', '词组密码', 'diceware', 'passphrase'],
  },
  'jwt-encoder': {
    name: 'JWT 编码器',
    tagline: '构建并签名 HS256 JSON Web Token。',
    description:
      '使用 HMAC-SHA256 从头部、载荷和密钥生成已签名的 JWT，全程在本地浏览器中完成。',
    keywords: ['JWT编码', 'JWT签名', '生成JWT', 'HS256', 'jwt encoder', 'create jwt'],
  },
  'xml-format': {
    name: 'XML 格式化',
    tagline: '美化或压缩 XML 并正确缩进。',
    description:
      '将杂乱的 XML 美化为整齐缩进的格式或压缩处理，格式化时同步校验结构，全程在本地运行。',
    keywords: ['XML格式化', 'XML美化', 'XML压缩', 'XML缩进', 'xml formatter', 'beautify xml'],
  },
  'csv-viewer': {
    name: 'CSV 查看器',
    tagline: '将 CSV 预览为可排序、可搜索的表格。',
    description:
      '在浏览器中打开 CSV 并以表格形式查看，支持列排序和搜索，不上传任何数据。',
    keywords: ['CSV查看', '打开CSV', 'CSV表格', 'CSV预览', 'csv viewer', 'view csv'],
  },
  'ical-gen': {
    name: 'iCal (.ics) 生成器',
    tagline: '生成可下载的 .ics 日历事件文件。',
    description:
      '填写标题、时间和地点即可生成 .ics 文件，将事件添加到任意日历应用，全程在本地完成。',
    keywords: ['ics生成', 'iCal文件', '日历事件', '添加到日历', 'ics generator', 'ical file'],
  },
  'vcard-parse': {
    name: 'vCard (.vcf) 解析器',
    tagline: '读取 .vcf 名片文件并导出为 CSV。',
    description:
      '打开 vCard 文件，以表格形式查看其中的联系人（姓名、电话、邮箱）并导出为 CSV，全程在浏览器中完成。',
    keywords: ['vCard解析', 'vcf转CSV', '名片文件', '联系人导出', 'vcard parser', 'vcf to csv'],
  },
  'audio-reverse': {
    name: '音频倒放',
    tagline: '倒序播放并导出音频。',
    description:
      '将音频片段按时间倒序处理并下载结果，由 FFmpeg.wasm 驱动，全程在浏览器中完成。',
    keywords: ['音频倒放', '倒序播放', 'MP3倒放', '倒放音频', 'reverse audio', 'backwards audio'],
  },
  'audio-normalize': {
    name: '音频响度归一化',
    tagline: '将音频响度调整到一致水平。',
    description:
      '应用响度归一化（EBU R128 loudnorm），使轻响部分音量统一，由 FFmpeg.wasm 驱动，仅在本地完成。',
    keywords: ['音频归一化', '响度均衡', '音量统一', 'loudnorm', 'normalize audio', 'loudness'],
  },
  'tone-gen': {
    name: '音频信号发生器',
    tagline: '生成正弦、方波和三角波测试音。',
    description:
      '按任意频率、波形和时长生成纯音并下载为 WAV，使用 Web Audio API 在本地完成。',
    keywords: ['信号发生器', '频率发生器', '测试音', '正弦波', 'tone generator', 'frequency generator'],
  },
  // ── 补充（en 对齐） ──
  'ascii-banner': {
    name: 'ASCII 横幅生成器',
    tagline: '把文字变成大号 ASCII 艺术字母。',
    description:
      '将文字生成为大号 ASCII 艺术横幅，适合 README、终端和代码注释，全程在浏览器本地完成。',
    keywords: ['ASCII横幅', 'ASCII艺术字', '字符画', 'figlet', 'ascii banner', 'text to ascii'],
  },
  'avatar-crop': {
    name: '圆形头像裁剪',
    tagline: '把图片裁剪成圆形头像。',
    description:
      '将照片裁剪为圆形并导出透明 PNG，非常适合做头像和个人资料图片，全程在浏览器中完成。',
    keywords: ['圆形裁剪', '头像制作', '头像裁剪', '圆形头像', 'circle crop', 'avatar maker'],
  },
  base32: {
    name: 'Base32 编码 / 解码',
    tagline: '按 RFC 4648 对文本进行 Base32 编解码。',
    description:
      '在本地将文本与 Base32（RFC 4648）互相转换，适合 TOTP 密钥和不区分大小写的编码，全程在浏览器中完成。',
    keywords: ['Base32编码', 'Base32解码', 'Base32转换', 'TOTP密钥', 'base32', 'rfc 4648'],
  },
  bcrypt: {
    name: 'bcrypt 哈希与校验',
    tagline: '生成并校验 bcrypt 密码哈希。',
    description:
      '按指定成本因子用 bcrypt 对密码做哈希，或校验密码与哈希是否匹配，全程在浏览器本地计算，不上传。',
    keywords: ['bcrypt', 'bcrypt哈希', '密码哈希', '密码校验', 'bcrypt hash', 'bcrypt verify'],
  },
  'binary-text': {
    name: '文本转二进制',
    tagline: '在文本和二进制之间互相转换。',
    description:
      '将文本编码为二进制（UTF-8），或把二进制解码回文本，全程在浏览器本地完成，不上传。',
    keywords: ['文本转二进制', '二进制转文本', '二进制转换', 'binary', 'text to binary', 'ascii binary'],
  },
  'bionic-reading': {
    name: '仿生阅读转换器',
    tagline: '加粗每个单词的前半部分以加快阅读。',
    description:
      '将任意文本转换为仿生阅读格式，加粗单词开头来引导视线、提升阅读速度，全程在浏览器本地完成。',
    keywords: ['仿生阅读', '速读', '快速阅读', '阅读辅助', 'bionic reading', 'speed reading'],
  },
  'box-shadow': {
    name: 'CSS 阴影生成器',
    tagline: '可视化设计并复制 CSS box-shadow。',
    description:
      '调整偏移、模糊、扩展和颜色来构建 box-shadow，实时预览并复制 CSS 代码，全程在浏览器中完成。',
    keywords: ['阴影生成器', 'CSS阴影', 'box-shadow', '盒子阴影', 'box shadow generator', 'shadow css'],
  },
  'caesar-cipher': {
    name: '凯撒密码 / ROT13',
    tagline: '对文本进行凯撒移位和 ROT13 加解密。',
    description:
      '对文本应用凯撒移位密码或 ROT13 并还原，移位量可调，全程在浏览器本地完成，不上传。',
    keywords: ['凯撒密码', 'ROT13', '移位密码', '文本加密', 'caesar cipher', 'shift cipher'],
  },
  'chmod-calc': {
    name: 'chmod 权限计算器',
    tagline: '在八进制和符号表示之间转换 Unix 权限。',
    description:
      '勾选所有者、组和其他人的读/写/执行权限，得到 chmod 的八进制和符号表示，全程在浏览器中完成。',
    keywords: ['chmod计算', 'Unix权限', '文件权限', '八进制权限', 'chmod calculator', 'chmod 755'],
  },
  'coin-flip': {
    name: '抛硬币',
    tagline: '抛一枚虚拟硬币决定正反面。',
    description:
      '抛一枚或多枚硬币，查看正反面结果和统计，结果随机公正，全程在浏览器本地完成。',
    keywords: ['抛硬币', '掷硬币', '正反面', '随机决定', 'coin flip', 'heads or tails'],
  },
  'color-blind': {
    name: '色盲模拟器',
    tagline: '预览图片在色盲者眼中的样子。',
    description:
      '在图片上模拟红色盲、绿色盲和蓝色盲效果，用于检查配色的无障碍可读性，全程在浏览器中完成。',
    keywords: ['色盲模拟', '色盲测试', '色弱模拟', '无障碍配色', 'color blindness', 'protanopia'],
  },
  'color-name': {
    name: '颜色名称查找',
    tagline: '为任意 HEX 或 RGB 值找最接近的 CSS 颜色名。',
    description:
      '输入 HEX 或 RGB 颜色，找出最接近的 CSS 命名颜色并标记完全匹配项，全程在浏览器本地完成。',
    keywords: ['颜色名称', '颜色名查找', 'CSS颜色名', 'HEX转颜色名', 'color name finder', 'css color names'],
  },
  'css-units': {
    name: 'CSS 单位换算',
    tagline: '在 px、rem、em 和 pt 之间换算。',
    description:
      '基于自定义根字号在 px、rem、em、pt 等 CSS 长度单位之间换算，不上传，全程在浏览器中完成。',
    keywords: ['CSS单位换算', 'px转rem', 'rem转px', 'em转px', 'css unit converter', 'px to rem'],
  },
  'csv-merge': {
    name: 'CSV 合并',
    tagline: '将多个 CSV 文件合并为一个。',
    description:
      '把多个 CSV 文件按表头对齐列合并成一个文件，全程在浏览器本地处理，文件不上传。',
    keywords: ['CSV合并', '合并CSV', 'CSV拼接', '多CSV合一', 'csv merge', 'combine csv'],
  },
  'csv-split': {
    name: 'CSV 拆分',
    tagline: '按行数将大 CSV 拆分为多个小文件。',
    description:
      '把大 CSV 按每 N 行拆成多块，每个文件都保留表头，并打包为 zip 下载，全程在浏览器中完成。',
    keywords: ['CSV拆分', '拆分CSV', '分割CSV', '大文件拆分', 'csv split', 'split csv'],
  },
  'csv-to-md': {
    name: 'CSV 转 Markdown 表格',
    tagline: '把 CSV 转成 GitHub 风格的 Markdown 表格。',
    description:
      '粘贴 CSV 即可生成列对齐的 Markdown 表格，可直接用于 README，全程在浏览器中完成。',
    keywords: ['CSV转Markdown', 'Markdown表格', 'CSV转MD', '表格生成', 'csv to markdown', 'markdown table'],
  },
  'cubic-bezier': {
    name: '三次贝塞尔曲线编辑器',
    tagline: '用可拖动的贝塞尔曲线设计 CSS 缓动。',
    description:
      '拖动控制点为 CSS 过渡设计 cubic-bezier 缓动函数并复制取值，全程在浏览器本地完成。',
    keywords: ['贝塞尔曲线', '缓动编辑器', 'CSS缓动', '过渡曲线', 'cubic bezier', 'easing editor'],
  },
  'curl-to-code': {
    name: 'cURL 转代码',
    tagline: '把 cURL 命令转成 fetch、axios 或 Python requests 代码。',
    description:
      '粘贴 cURL 命令即可生成可用的 JavaScript fetch、axios 或 Python requests 代码，全程在浏览器中完成。',
    keywords: ['cURL转代码', 'curl转fetch', 'curl转Python', 'curl转换', 'curl to code', 'curl to fetch'],
  },
  'date-diff': {
    name: '日期计算器',
    tagline: '计算两日期间隔天数，或加减天数。',
    description:
      '计算两个日期之间相差的天数，或从某个日期加减天数，全程在浏览器本地完成。',
    keywords: ['日期计算', '间隔天数', '日期差', '加减天数', 'date calculator', 'days between dates'],
  },
  'dice-roller': {
    name: '掷骰子',
    tagline: '掷任意数量、任意面数的骰子。',
    description:
      '掷 D4、D6、D20 和自定义骰子，支持总和与修正值，适合桌游，采用密码学随机，全程在浏览器中完成。',
    keywords: ['掷骰子', '骰子', 'D20', '桌游骰子', 'dice roller', 'rpg dice'],
  },
  discount: {
    name: '折扣计算器',
    tagline: '计算折后价和省下的金额。',
    description:
      '输入原价和折扣即可得到最终价格和省下的金额，也可反算折扣率，全程在浏览器本地完成。',
    keywords: ['折扣计算', '折后价', '打折计算', '省钱计算', 'discount calculator', 'sale price'],
  },
  'dotenv-json': {
    name: '.env 转 JSON',
    tagline: '在 .env 文件和 JSON 之间互相转换。',
    description:
      '粘贴 .env 内容得到 JSON，或把 JSON 转回 .env 文件，可处理引号和注释，全程在浏览器中完成。',
    keywords: ['env转JSON', 'dotenv转JSON', 'JSON转env', 'env转换', 'env to json', 'dotenv'],
  },
  'fancy-text': {
    name: '花式文字生成器',
    tagline: '把文字变成时髦的 Unicode 字体。',
    description:
      '将普通文本转换为粗体、斜体、手写体等 Unicode 字体样式，适合社交平台个性签名，全程在浏览器中完成。',
    keywords: ['花式文字', '特殊字体', 'Unicode字体', '艺术字', 'fancy text', 'instagram fonts'],
  },
  'fuel-cost': {
    name: '油费计算器',
    tagline: '按里程、油耗和油价估算行程油费。',
    description:
      '输入行程里程、油耗和油价，估算总油费和油耗量，全程在浏览器本地完成。',
    keywords: ['油费计算', '油耗计算', '行程油费', '加油费用', 'fuel cost', 'gas cost'],
  },
  'gitignore-gen': {
    name: '.gitignore 生成器',
    tagline: '按语言、框架和操作系统生成 .gitignore。',
    description:
      '选择技术栈和平台即可拼装出可直接使用的 .gitignore 文件，全程在浏览器本地生成，不上传。',
    keywords: ['gitignore生成', '生成gitignore', 'git忽略模板', 'gitignore', 'gitignore generator', 'git ignore'],
  },
  gpa: {
    name: 'GPA 计算器',
    tagline: '计算你的平均学分绩点。',
    description:
      '输入课程的学分和成绩，计算加权 GPA（4.0/4.5 制），全程在浏览器本地完成。',
    keywords: ['GPA计算', '平均绩点', '学分绩点', '加权GPA', 'gpa calculator', 'grade point average'],
  },
  'gradient-image': {
    name: '渐变图片生成器',
    tagline: '生成渐变背景图并导出 PNG。',
    description:
      '选择颜色、方向和尺寸即可生成渐变背景图并下载为 PNG，全程在浏览器本地完成。',
    keywords: ['渐变图片', '渐变背景', '渐变壁纸', '生成渐变', 'gradient image', 'gradient background'],
  },
  'hmac-gen': {
    name: 'HMAC 生成器',
    tagline: '用 SHA-1、SHA-256 或 SHA-512 生成 HMAC 签名。',
    description:
      '用 Web Crypto API 从密钥和消息计算 HMAC，输出十六进制或 Base64，全程在浏览器本地完成。',
    keywords: ['HMAC生成', 'HMAC签名', '消息认证码', 'hmac sha256', 'hmac generator', 'hmac'],
  },
  htpasswd: {
    name: '.htpasswd 生成器',
    tagline: '生成 Apache .htpasswd 凭证行。',
    description:
      '根据用户名和密码生成 .htpasswd 条目（bcrypt/APR1-MD5/SHA），全程在浏览器本地完成，不上传。',
    keywords: ['htpasswd生成', 'Apache密码', '基本认证密码', 'htpasswd', 'htpasswd generator', 'basic auth'],
  },
  'http-status': {
    name: 'HTTP 状态码查询',
    tagline: '查询任意 HTTP 状态码的含义。',
    description:
      '搜索 HTTP 状态码（1xx–5xx），查看含义和常见使用场景的快速参考，全程在浏览器本地完成。',
    keywords: ['HTTP状态码', '404含义', '500错误', '响应码', 'http status codes', 'http response codes'],
  },
  'image-blur': {
    name: '图片模糊',
    tagline: '为图片应用高斯模糊。',
    description:
      '以可调半径对整张图片进行模糊处理并下载结果，全程在浏览器本地完成，图片不上传。',
    keywords: ['图片模糊', '高斯模糊', '照片模糊', '模糊处理', 'blur image', 'gaussian blur'],
  },
  'image-border': {
    name: '图片加边框',
    tagline: '为图片添加彩色边框或画框。',
    description:
      '为任意图片添加自定义宽度和颜色的实心边框，全程在浏览器本地完成，不上传。',
    keywords: ['图片边框', '加边框', '照片画框', '相片边框', 'image border', 'photo frame'],
  },
  'image-color-picker': {
    name: '图片取色器',
    tagline: '从任意图片中拾取 HEX/RGB 颜色。',
    description:
      '上传图片后点击任意位置即可读取该像素的 HEX 和 RGB 颜色，全程在浏览器本地完成，不上传。',
    keywords: ['图片取色', '取色器', '吸管工具', '从图片取色', 'image color picker', 'eyedropper'],
  },
  'image-duotone': {
    name: '双色调图片',
    tagline: '把图片映射为双色调风格。',
    description:
      '用两种自定义颜色分别映射阴影和高光，把照片转换为时髦的双色调效果，全程在浏览器本地完成。',
    keywords: ['双色调', '双色图片', '渐变映射', '双色风格', 'duotone', 'two tone photo'],
  },
  'image-filters': {
    name: '图片滤镜',
    tagline: '为照片套用 Instagram 风格滤镜。',
    description:
      '为图片添加黑白、复古、怀旧等滤镜并下载结果，全程在浏览器本地完成，不上传。',
    keywords: ['图片滤镜', '照片滤镜', '复古滤镜', '黑白滤镜', 'image filters', 'photo filter'],
  },
  'image-histogram': {
    name: '图片直方图',
    tagline: '分析图片的 RGB 和亮度分布。',
    description:
      '上传图片查看其红、绿、蓝和亮度直方图，便于分析曝光，全程在浏览器本地完成，不上传。',
    keywords: ['图片直方图', 'RGB直方图', '照片直方图', '亮度直方图', 'image histogram', 'rgb histogram'],
  },
  'image-placeholder': {
    name: '占位图生成器',
    tagline: '生成自定义尺寸和文字的占位图。',
    description:
      '为原型设计生成自定义尺寸、颜色和标注文字的纯色占位图，并在本地导出 PNG，全程在浏览器中完成。',
    keywords: ['占位图', '占位图片', '虚拟图片', '原型图', 'placeholder image', 'dummy image'],
  },
  'image-target-size': {
    name: '压缩图片到指定大小',
    tagline: '将图片压缩到目标文件体积。',
    description:
      '自动调节质量，让 JPEG/WebP 控制在你设定的体积以内（例如 200 KB），全程在浏览器本地完成。',
    keywords: ['压缩到指定大小', '目标体积', '压缩到KB', '指定大小压缩', 'compress to size', 'target size'],
  },
  'ini-json': {
    name: 'INI 转 JSON',
    tagline: '在 INI 配置和 JSON 之间互相转换。',
    description:
      '把 INI 文件解析为 JSON，或把 JSON 序列化回 INI，全程在浏览器本地完成，不上传。',
    keywords: ['INI转JSON', 'JSON转INI', 'INI转换', 'INI解析', 'ini to json', 'json to ini'],
  },
  'json-diff': {
    name: 'JSON 差异比较',
    tagline: '在结构上比较两份 JSON 文档。',
    description:
      '在两个 JSON 对象之间做结构化差异比较，找出新增、删除和修改的键，全程在浏览器本地完成。',
    keywords: ['JSON对比', 'JSON差异', '比较JSON', '结构差异', 'json diff', 'compare json'],
  },
  'json-escape': {
    name: 'JSON 转义 / 反转义',
    tagline: '为 JSON 转义和反转义字符串。',
    description:
      '把文本转义为 JSON 安全字符串（引号、换行、Unicode），或反转义还原，全程在浏览器本地完成。',
    keywords: ['JSON转义', 'JSON反转义', '字符串转义', 'JSON字符串', 'json escape', 'json unescape'],
  },
  'json-flatten': {
    name: 'JSON 扁平化 / 还原',
    tagline: '把嵌套 JSON 拍平为点号键，或重新还原。',
    description:
      '把嵌套 JSON 转换为点号表示的扁平键，或把点号键还原为嵌套对象，全程在浏览器本地完成。',
    keywords: ['JSON扁平化', '拍平JSON', 'JSON还原', '点号键', 'json flatten', 'flatten json'],
  },
  'json-to-go': {
    name: 'JSON 转 Go 结构体',
    tagline: '从 JSON 即时生成 Go struct 类型。',
    description:
      '粘贴 JSON 即可得到带 json tag 的强类型 Go 结构体，全程在浏览器本地完成，不上传。',
    keywords: ['JSON转Go', 'JSON转结构体', 'Go结构体生成', 'golang struct', 'json to go', 'json to struct'],
  },
  'jsonl-viewer': {
    name: 'JSONL 查看器',
    tagline: '以表格查看 JSON Lines 并导出为 JSON 或 CSV。',
    description:
      '打开 JSONL/NDJSON 文件以表格浏览记录，再转换为 JSON 数组或 CSV，全程在浏览器本地完成。',
    keywords: ['JSONL查看', 'NDJSON查看', 'JSON Lines', 'JSONL转CSV', 'jsonl viewer', 'ndjson'],
  },
  'language-detect': {
    name: '语言检测器',
    tagline: '检测一段文字是用什么语言写的。',
    description:
      '基于字符和 n-gram 启发式估计文本所属语言，全程在浏览器本地完成，不上传。',
    keywords: ['语言检测', '检测语言', '识别语言', '判断语言', 'language detector', 'detect language'],
  },
  'line-numbers': {
    name: '添加行号',
    tagline: '为每行文本加上行号，或去除已有行号。',
    description:
      '用自定义起始值、补零位数和分隔符为每行文本添加行号，也可移除行号，全程在浏览器本地完成。',
    keywords: ['添加行号', '行号', '行编号', '去除行号', 'add line numbers', 'number lines'],
  },
  'lottery-number': {
    name: '彩票号码生成器',
    tagline: '生成随机彩票号码组合。',
    description:
      '按自定义范围和数量随机选取彩票号码组合，采用密码学随机，全程在浏览器本地完成。',
    keywords: ['彩票号码', '随机彩票', '选号器', '随机号码', 'lottery number', 'random numbers'],
  },
  'markdown-preview': {
    name: 'Markdown 预览',
    tagline: '一边输入一边实时渲染 Markdown。',
    description:
      '编写 Markdown，实时并排查看渲染效果和 HTML 源码，全程在浏览器本地完成，不上传。',
    keywords: ['Markdown预览', 'Markdown编辑器', '实时Markdown', 'MD转HTML', 'markdown preview', 'md editor'],
  },
  'mock-data': {
    name: '模拟数据生成器',
    tagline: '生成假姓名、邮箱等记录并导出 JSON 或 CSV。',
    description:
      '生成逼真的模拟数据（姓名、邮箱、地址、日期）并导出为 JSON 或 CSV 供测试用，全程在浏览器本地完成。',
    keywords: ['模拟数据', '假数据', '测试数据', '虚拟数据', 'mock data', 'fake data'],
  },
  'morse-code': {
    name: '摩斯电码翻译器',
    tagline: '在文本和摩斯电码间互译，并可发声。',
    description:
      '在文本和摩斯电码之间互相转换，并以音频蜂鸣声播放，全程在浏览器本地完成，不上传。',
    keywords: ['摩斯电码', '摩尔斯电码', '电码翻译', '电码发声', 'morse code', 'text to morse'],
  },
  'nato-phonetic': {
    name: '北约音标字母',
    tagline: '用北约音标字母拼读文本。',
    description:
      '把任意文本转换为北约音标字母（Alfa、Bravo、Charlie……）以便清晰拼读，全程在浏览器本地完成。',
    keywords: ['北约音标', '音标字母', '字母拼读', 'NATO', 'nato phonetic', 'alfa bravo charlie'],
  },
  'number-to-words': {
    name: '数字转大写文字',
    tagline: '把数字写成文字。',
    description:
      '把数字转换为对应的英文文字（及金额写法），例如 1234 → one thousand two hundred thirty-four，全程在浏览器本地完成。',
    keywords: ['数字转文字', '数字转大写', '数字读法', '金额大写', 'number to words', 'spell number'],
  },
  'pdf-booklet': {
    name: 'PDF 小册子拼版',
    tagline: '将 PDF 拼成可打印的 2 合 1 小册子。',
    description:
      '将 PDF 页面重排为骑马钉小册子拼版，便于打印、折叠和装订，全程在浏览器中完成，文件不上传。',
    keywords: ['PDF小册子', '小册子拼版', 'PDF拼版', '骑马钉', 'pdf booklet', 'pdf imposition'],
  },
  'pdf-reverse': {
    name: 'PDF 页面倒序',
    tagline: '反转 PDF 的页面顺序。',
    description:
      '将 PDF 所有页面的顺序反转并下载结果，全程在浏览器中完成，文件不上传。',
    keywords: ['PDF倒序', 'PDF反转页序', 'PDF页序', '反转PDF', 'reverse pdf', 'flip pdf order'],
  },
  'qr-logo': {
    name: '带 Logo 的二维码',
    tagline: '生成中间带 Logo 的二维码。',
    description:
      '从文本或网址生成二维码，并在中间叠加你的 Logo，带纠错能力，全程在浏览器本地完成。',
    keywords: ['Logo二维码', '带标志二维码', '品牌二维码', '自定义二维码', 'qr with logo', 'custom qr'],
  },
  'random-number': {
    name: '随机数生成器',
    tagline: '按范围、数量和唯一性生成随机数。',
    description:
      '在指定范围内生成随机整数，支持数量和不重复选项，采用密码学随机，全程在浏览器本地完成。',
    keywords: ['随机数', '随机数生成', '随机整数', '随机抽取', 'random number', 'rng'],
  },
  'reaction-time': {
    name: '反应时间测试',
    tagline: '测试你的反应速度（毫秒）。',
    description:
      '信号一变化就立刻点击，跨多轮测量你的反应时间，全程在浏览器本地完成，不上传。',
    keywords: ['反应时间', '反应测试', '反应速度', '反射测试', 'reaction time', 'reflex test'],
  },
  'reverse-text': {
    name: '文本反转',
    tagline: '按字符、单词或行反转文本。',
    description:
      '即时按字符、单词或行序反转文本，不上传，全程在浏览器本地完成。',
    keywords: ['文本反转', '倒序文本', '反转字符串', '翻转文字', 'reverse text', 'backwards text'],
  },
  'scientific-calc': {
    name: '科学计算器',
    tagline: '在浏览器里做三角、对数、幂运算等。',
    description:
      '支持三角函数、对数、指数、常量和表达式求值的科学计算器，全程在浏览器本地完成，无需服务器。',
    keywords: ['科学计算器', '在线计算器', '三角函数计算', '表达式计算', 'scientific calculator', 'math calculator'],
  },
  'screen-ruler': {
    name: '屏幕标尺与 PPI',
    tagline: '测量像素并计算屏幕 PPI。',
    description:
      '根据分辨率和对角线尺寸计算显示屏 PPI，并提供屏上像素标尺，全程在浏览器本地完成。',
    keywords: ['屏幕标尺', 'PPI计算', '像素标尺', '屏幕DPI', 'screen ruler', 'ppi calculator'],
  },
  'secret-split': {
    name: '秘密分割（Shamir）',
    tagline: '把秘密分成多份，凑齐若干份即可恢复。',
    description:
      '使用 Shamir 秘密共享把秘密分成 N 份，任意 K 份即可重组还原，全程在浏览器本地完成，不上传。',
    keywords: ['Shamir秘密共享', '秘密分割', '秘密共享', '密钥分割', 'shamir secret sharing', 'split secret'],
  },
  sentiment: {
    name: '情感分析',
    tagline: '把文本打分为正面或负面。',
    description:
      '基于词典的打分器估计文本情感，无需模型、无需上传，并高亮正面和负面词，全程在浏览器本地完成。',
    keywords: ['情感分析', '正负面分析', '情感打分', '文本情感', 'sentiment analysis', 'text sentiment'],
  },
  'subnet-calc': {
    name: '子网计算器',
    tagline: '从 CIDR 计算网络地址、广播地址和主机范围。',
    description:
      '输入 IPv4 地址和 CIDR 前缀，得到子网掩码、网络与广播地址以及可用主机范围，全程在浏览器本地完成。',
    keywords: ['子网计算', 'CIDR计算', 'IP子网', '掩码计算', 'subnet calculator', 'cidr calculator'],
  },
  summarize: {
    name: '文本摘要',
    tagline: '抽取式摘要——挑出关键句子。',
    description:
      '对句子打分并抽取最重要的句子来概括全文，无需模型、无需上传，全程在浏览器本地完成。',
    keywords: ['文本摘要', '自动摘要', '抽取式摘要', '内容概括', 'text summarizer', 'summarize text'],
  },
  'svg-optimize': {
    name: 'SVG 优化器',
    tagline: '剔除冗余内容缩小 SVG 文件。',
    description:
      '移除编辑器元数据、多余空白和过高精度，缩减 SVG 标记体积，全程在浏览器本地完成，不上传。',
    keywords: ['SVG优化', '优化SVG', 'SVG压缩', 'SVG清理', 'svg optimizer', 'minify svg'],
  },
  tdee: {
    name: 'TDEE 与卡路里计算器',
    tagline: '估算基础代谢和每日热量需求。',
    description:
      '输入身高、体重、年龄和活动水平，计算 BMR 和 TDEE（每日热量需求），全程在浏览器本地完成。',
    keywords: ['TDEE计算', '卡路里计算', '基础代谢', '每日热量', 'tdee calculator', 'calorie calculator'],
  },
  'text-repeat': {
    name: '文本重复',
    tagline: '把任意文本重复指定次数。',
    description:
      '将文本重复 N 次，副本之间可选分隔符，适合测试和模板，全程在浏览器本地完成。',
    keywords: ['文本重复', '重复文本', '复制文本', '重复字符串', 'repeat text', 'duplicate text'],
  },
  timezone: {
    name: '时区转换器',
    tagline: '在不同时区之间转换时间。',
    description:
      '选择两个时区来转换时间并查看时差，使用浏览器内置的时区数据，全程在本地完成。',
    keywords: ['时区转换', '时差计算', '世界时钟', 'UTC转换', 'timezone converter', 'world clock'],
  },
  'tip-calc': {
    name: '小费计算器',
    tagline: '计算小费并按人均分摊账单。',
    description:
      '输入账单金额、小费比例和人数，得到小费、总额和人均金额，全程在浏览器本地完成。',
    keywords: ['小费计算', 'AA分摊', '账单分摊', '人均费用', 'tip calculator', 'split bill'],
  },
  'toml-json': {
    name: 'TOML 转 JSON',
    tagline: '在 TOML 和 JSON 之间互相转换。',
    description:
      '把 TOML 配置转换为 JSON 并可转回，便于编辑和查看配置文件，全程在浏览器本地完成。',
    keywords: ['TOML转JSON', 'JSON转TOML', 'TOML转换', 'TOML解析', 'toml to json', 'json to toml'],
  },
  tts: {
    name: '文字转语音',
    tagline: '用浏览器语音朗读文本。',
    description:
      '输入文字，用浏览器内置语音朗读出来，语速和音调可调，全程在浏览器本地完成。',
    keywords: ['文字转语音', '语音朗读', '朗读文本', 'TTS', 'text to speech', 'read aloud'],
  },
  'typing-speed': {
    name: '打字速度测试',
    tagline: '以 WPM 衡量你的打字速度。',
    description:
      '照着提示输入来测量每分钟字数和准确率，全程在浏览器本地完成，无需注册。',
    keywords: ['打字速度', '打字测试', 'WPM测试', '每分钟字数', 'typing speed', 'wpm test'],
  },
  'user-agent-parser': {
    name: 'User-Agent 解析器',
    tagline: '从 User-Agent 字符串识别浏览器、系统和设备。',
    description:
      '粘贴任意 User-Agent 字符串即可识别浏览器、引擎、操作系统和设备类型，全程在浏览器本地完成。',
    keywords: ['UA解析', 'User-Agent解析', 'UA分析', '识别浏览器', 'user agent parser', 'ua parser'],
  },
  'video-flip': {
    name: '视频翻转',
    tagline: '水平或垂直翻转视频。',
    description:
      '把视频左右或上下镜像翻转并重新编码，由 FFmpeg.wasm 驱动，全程在浏览器中完成。',
    keywords: ['视频翻转', '视频镜像', '水平翻转', '翻转MP4', 'flip video', 'mirror video'],
  },
  'video-loop': {
    name: '视频循环',
    tagline: '把视频重复 N 次合成一个文件。',
    description:
      '将片段自身拼接指定次数，做成无缝循环视频，由 FFmpeg.wasm 驱动，仅在本地完成。',
    keywords: ['视频循环', '重复视频', '循环视频', '循环MP4', 'loop video', 'repeat video'],
  },
  'video-resize': {
    name: '视频分辨率调整',
    tagline: '更改视频分辨率（720p、1080p……）。',
    description:
      '在保持宽高比的同时把视频重新编码到目标分辨率，由 FFmpeg.wasm 驱动，全程在浏览器中完成。',
    keywords: ['视频调整分辨率', '改视频分辨率', '缩放视频', '视频720p1080p', 'resize video', 'change resolution'],
  },
  'video-reverse': {
    name: '视频倒放',
    tagline: '将视频倒序播放并导出。',
    description:
      '用 FFmpeg.wasm 把片段在时间上倒放并下载，全程在浏览器中完成，文件不上传。',
    keywords: ['视频倒放', '倒放视频', '视频倒序', '反向播放', 'reverse video', 'backwards video'],
  },
  'webcam-record': {
    name: '摄像头录制',
    tagline: '用摄像头录制视频。',
    description:
      '采集你的摄像头和麦克风并下载 webm——无需上传、无需安装，全程在浏览器中完成。',
    keywords: ['摄像头录制', '录摄像头', '相机录制', 'webm录制', 'webcam recorder', 'record webcam'],
  },
  'wifi-qr': {
    name: 'WiFi 二维码生成器',
    tagline: '生成可连接 WiFi 的二维码。',
    description:
      '输入 WiFi 名称、密码和加密类型，生成可扫码即连的二维码，全程在浏览器本地完成。',
    keywords: ['WiFi二维码', 'WiFi二维码生成', '扫码连WiFi', '分享WiFi', 'wifi qr code', 'wifi password qr'],
  },
  'zalgo-text': {
    name: 'Zalgo 故障文字',
    tagline: '用组合符号制作诡异的故障文字。',
    description:
      '为文字叠加多层组合附加符号，制造故障感的 zalgo 效果，强度可调，全程在浏览器本地完成。',
    keywords: ['Zalgo文字', '故障文字', '诡异文字', '乱码文字', 'zalgo text', 'glitch text'],
  },
  // ── 补充3（en 对齐） ──
  'ascii-table': {
    name: 'ASCII 码表',
    tagline: '查询 ASCII 字符的十进制、十六进制和八进制编码。',
    description:
      '在线浏览并搜索完整的 ASCII 码表，含十进制、十六进制、八进制编码及控制字符说明，方便随手查阅，全程在浏览器本地完成。',
    keywords: ['ASCII码表', 'ascii table', 'ASCII编码', '字符编码', 'ascii code', '字符码表'],
  },
  'audio-pitch': {
    name: '音频变调',
    tagline: '只改变音高，不改变播放速度。',
    description:
      '将音频按半音升高或降低，同时保持原有节奏不变，使用 FFmpeg 在浏览器本地处理，文件不上传服务器。',
    keywords: ['音频变调', 'audio pitch', '变调', '改变音高', 'pitch shift', '音高调整'],
  },
  'audio-waveform': {
    name: '音频波形图',
    tagline: '将音频文件渲染为波形 PNG 图片。',
    description:
      '从音频文件生成波形图片，可自定义颜色和尺寸，使用 Web Audio 在本地解码，文件全程不离开你的设备。',
    keywords: ['音频波形', 'audio waveform', '波形图', '声波图', 'waveform', '音频可视化'],
  },
  'cc-validate': {
    name: '银行卡号校验（Luhn）',
    tagline: '用 Luhn 算法校验卡号并识别卡组织。',
    description:
      '使用 Luhn 算法校验信用卡或银行卡号是否有效，并识别所属卡组织，全程在浏览器本地完成，数据不上传。',
    keywords: ['卡号校验', 'luhn校验', 'credit card validator', '信用卡校验', 'Luhn算法', '卡号验证'],
  },
  'checksum-verify': {
    name: '校验和核对',
    tagline: '把文件哈希与期望校验值进行比对。',
    description:
      '在本地计算文件的 SHA-256 或 SHA-512 哈希，并与期望的校验值比对以确认文件完整性，文件不上传服务器。',
    keywords: ['校验和', 'checksum', '文件哈希', 'sha256校验', '完整性校验', 'hash compare'],
  },
  'code-case': {
    name: '代码命名格式转换',
    tagline: '在 camelCase、snake_case、kebab-case 等之间转换。',
    description:
      '将变量名和标识符在驼峰、下划线、短横线、帕斯卡和常量大写等命名风格之间互相转换，全程在浏览器本地完成。',
    keywords: ['命名转换', 'camelCase', 'snake_case', 'kebab-case', '驼峰命名', 'case converter'],
  },
  'compound-interest': {
    name: '复利计算器',
    tagline: '测算复利与定期投入下的资产增长。',
    description:
      '输入本金、利率、期限和定期投入金额，估算复利增长与累计利息，结果在浏览器本地计算，数据不上传。',
    keywords: ['复利计算', 'compound interest', '利息计算', '投资计算', '理财计算', '复利计算器'],
  },
  'count-occurrences': {
    name: '出现次数统计',
    tagline: '统计某个词或短语出现的次数。',
    description:
      '统计指定字符串在文本中出现的次数，支持区分大小写和全词匹配选项，全程在浏览器本地完成。',
    keywords: ['出现次数', 'count occurrences', '词频统计', '统计次数', '字符串计数', '文本统计'],
  },
  'css-minify': {
    name: 'CSS 压缩与美化',
    tagline: '一键压缩或格式化 CSS 代码。',
    description:
      '去除空白和注释来压缩 CSS，或按统一缩进重新美化排版，全程在浏览器本地完成，代码不上传。',
    keywords: ['CSS压缩', 'css minify', 'CSS美化', '格式化CSS', 'css beautifier', '压缩样式'],
  },
  'css-specificity': {
    name: 'CSS 优先级计算器',
    tagline: '计算任意 CSS 选择器的优先级。',
    description:
      '输入 CSS 选择器即可计算其优先级（id、类、标签的数量），帮助你判断哪条规则会生效，全程在浏览器本地完成。',
    keywords: ['CSS优先级', 'css specificity', '选择器优先级', '权重计算', 'selector weight', '样式优先级'],
  },
  'csv-stats': {
    name: 'CSV 统计分析',
    tagline: '查看 CSV 各列的统计指标。',
    description:
      '分析 CSV 文件，针对数值列给出每列的计数、求和、均值、最小值、最大值和缺失值，全程在浏览器本地完成。',
    keywords: ['CSV统计', 'csv stats', 'CSV分析', '列统计', 'csv summary', '数据分析'],
  },
  'electricity-cost': {
    name: '电费计算器',
    tagline: '估算任意电器的用电成本。',
    description:
      '输入功率、使用时长和每度电价格，估算电器每天、每月和每年的用电费用，结果在浏览器本地计算。',
    keywords: ['电费计算', 'electricity cost', '用电成本', '度数计算', 'kwh费用', '电费计算器'],
  },
  'extract-emails': {
    name: '提取邮箱地址',
    tagline: '从任意文本中提取所有邮箱地址。',
    description:
      '从粘贴的文本中查找并提取所有电子邮箱地址，自动去重并每行输出一个，全程在浏览器本地完成。',
    keywords: ['提取邮箱', 'extract emails', '邮箱提取', '抓取邮箱', 'email extractor', '邮件地址'],
  },
  'extract-urls': {
    name: '提取网址链接',
    tagline: '从任意文本中提取所有链接。',
    description:
      '从粘贴的文本中查找并提取所有网址 URL，自动去重并每行输出一个，全程在浏览器本地完成。',
    keywords: ['提取网址', 'extract urls', '提取链接', '抓取链接', 'url extractor', '链接提取'],
  },
  'gif-reverse': {
    name: 'GIF 倒放',
    tagline: '让 GIF 反向播放。',
    description:
      '将动图 GIF 的帧顺序倒转，制作反向播放的循环动画，全程在浏览器本地处理，文件不上传。',
    keywords: ['GIF倒放', 'reverse gif', 'GIF反转', '倒放动图', '反向GIF', 'gif reverser'],
  },
  'image-black-white': {
    name: '黑白图片转换',
    tagline: '把图片转为灰度或纯黑白。',
    description:
      '将图片转换为灰度，或按阈值生成纯黑白效果，阈值水平可调，全程在浏览器本地完成，图片不上传。',
    keywords: ['黑白图片', 'black and white', '灰度转换', '图片转黑白', 'grayscale', '单色图片'],
  },
  'image-info': {
    name: '图片信息查看',
    tagline: '查看图片的尺寸、格式、大小和比例。',
    description:
      '拖入图片即可立即查看其宽度、高度、宽高比、文件格式和大小，无需上传，全程在浏览器本地完成。',
    keywords: ['图片信息', 'image info', '图片尺寸', '查看分辨率', 'image dimensions', '图片属性'],
  },
  'json-sort-keys': {
    name: 'JSON 键排序',
    tagline: '按字母顺序排列 JSON 对象的键。',
    description:
      '将 JSON 对象的所有键按字母顺序排序，支持嵌套对象，并可选格式化输出，全程在浏览器本地完成。',
    keywords: ['JSON排序', 'sort json keys', 'JSON键排序', '键排序', 'json sorter', 'JSON整理'],
  },
  'json-stats': {
    name: 'JSON 结构分析',
    tagline: '查看 JSON 文档的键、深度和类型。',
    description:
      '分析 JSON 文档，统计键总数、最大嵌套深度、数组大小，并给出各类值类型的分布，全程在浏览器本地完成。',
    keywords: ['JSON分析', 'json stats', 'JSON结构', '嵌套深度', 'json analyzer', '解析JSON'],
  },
  'json-to-python': {
    name: 'JSON 转 Python',
    tagline: '从 JSON 生成 Python dataclass 或 TypedDict。',
    description:
      '粘贴 JSON 即可生成带类型推断的 Python dataclass 或 TypedDict 定义，全程在浏览器本地完成，数据不上传。',
    keywords: ['JSON转Python', 'json to python', 'dataclass生成', 'TypedDict', 'python类型', 'JSON转换'],
  },
  'lorem-ko': {
    name: '韩文假文生成',
    tagline: '为排版稿生成韩文占位（假文）文本。',
    description:
      '生成自然的韩文填充段落、句子或词语，用于设计稿和原型占位，全程在浏览器本地完成。',
    keywords: ['韩文假文', 'korean lorem', '占位文本', '韩文填充', '假文生成', 'lorem ipsum'],
  },
  'pace-calc': {
    name: '跑步配速计算器',
    tagline: '计算跑步的配速、用时或距离。',
    description:
      '根据距离和用时计算跑步配速，或根据目标配速预测完赛时间，支持公里和英里，全程在浏览器本地完成。',
    keywords: ['配速计算', 'pace calculator', '跑步配速', '马拉松配速', '每公里用时', '完赛时间'],
  },
  'pdf-resize': {
    name: 'PDF 页面尺寸调整',
    tagline: '将 PDF 页面缩放到 A4、Letter 或自定义尺寸。',
    description:
      '把 PDF 每一页调整为标准纸张尺寸（A4、Letter 等），内容自动缩放并居中，全程在浏览器本地完成，文件不上传。',
    keywords: ['PDF调整尺寸', 'resize pdf', 'PDF页面大小', '缩放PDF', 'A4尺寸', 'PDF纸张'],
  },
  'random-bytes': {
    name: '随机字节 / 令牌生成',
    tagline: '生成密码学安全的随机令牌。',
    description:
      '使用 Web Crypto API 生成安全的随机字节，输出为十六进制、Base64 或 UUID，适合密钥和令牌，全程在浏览器本地完成。',
    keywords: ['随机字节', 'random bytes', '令牌生成', '随机十六进制', 'secure token', '密钥生成'],
  },
  'ratio-calc': {
    name: '比例计算器',
    tagline: '求解比例（a:b = c:x）并化简比值。',
    description:
      '求解比例中缺失的项，并将比值化为最简形式，全程在浏览器本地完成，无需上传任何数据。',
    keywords: ['比例计算', 'ratio calculator', '比例求解', '化简比值', '比例换算', '求比例'],
  },
  'remove-accents': {
    name: '去除变音符号',
    tagline: '去掉文字中的重音符号（café → cafe）。',
    description:
      '通过 Unicode 规范化去除文字中的重音和变音符号，生成对 ASCII 友好的纯净文本，全程在浏览器本地完成。',
    keywords: ['去除重音', 'remove accents', '去变音符', 'strip diacritics', '规范化文本', '去音标'],
  },
  'remove-line-breaks': {
    name: '去除换行',
    tagline: '把多行文本并为一行，或将换行替换为空格。',
    description:
      '删除换行符把文本合并为一行，可选将换行折叠为空格并保留段落间隔，全程在浏览器本地完成。',
    keywords: ['去除换行', 'remove line breaks', '合并行', '删除换行', '文本一行', 'join lines'],
  },
  'sleep-calc': {
    name: '睡眠计算器',
    tagline: '按睡眠周期推算最佳入睡与起床时间。',
    description:
      '根据 90 分钟睡眠周期和入睡所需时间，推荐最佳入睡时间或起床时间，全程在浏览器本地计算。',
    keywords: ['睡眠计算', 'sleep calculator', '入睡时间', '起床时间', '睡眠周期', '最佳睡眠'],
  },
  'time-duration': {
    name: '时间间隔计算器',
    tagline: '计算两个时间之差，或加减时长。',
    description:
      '计算两个时间点之间的间隔，或对小时、分钟、秒进行加减运算，全程在浏览器本地完成。',
    keywords: ['时间间隔', 'time duration', '时间差', '加时间', '时长计算', '小时计算'],
  },
  'unit-price': {
    name: '单价比较',
    tagline: '按每单位价格比较多件商品。',
    description:
      '输入多件商品的规格和价格，找出哪件单位价格最划算，购物比价好帮手，全程在浏览器本地完成。',
    keywords: ['单价比较', 'unit price', '每单位价格', '比价', '成本比较', '划算计算'],
  },
  'upside-down': {
    name: '倒置文字',
    tagline: '用 Unicode 字符把文字上下颠倒。',
    description:
      '将文字转换为上下颠倒的 Unicode 字符，适合趣味社交帖文和用户名，全程在浏览器本地完成。',
    keywords: ['倒置文字', 'upside down', '颠倒文字', '翻转文字', 'flip text', '倒写文字'],
  },
  'uuid-namespace': {
    name: 'UUID v5 生成器',
    tagline: '根据命名空间生成确定性 UUID（v5）。',
    description:
      '基于命名空间和名称用 SHA-1 生成符合 RFC 4122 的 v5 版 UUID，相同输入始终得到相同结果，全程在浏览器本地完成。',
    keywords: ['UUID v5', '命名空间UUID', '确定性UUID', 'uuid生成', 'rfc 4122', 'UUID生成器'],
  },
  'video-contact-sheet': {
    name: '视频缩略图拼图',
    tagline: '从视频生成缩略图网格。',
    description:
      '从视频中按等间隔提取多帧画面，拼成一张缩略图总览图，全程在浏览器本地处理，文件不上传。',
    keywords: ['视频缩略图', 'contact sheet', '缩略图网格', '视频预览图', '帧拼图', '视频截图'],
  },
  'wrap-text': {
    name: '文本换行',
    tagline: '按指定列宽对文本进行硬换行。',
    description:
      '在设定的字符宽度处对长行硬换行且不拆断单词，适用于邮件、注释和纯文本，全程在浏览器本地完成。',
    keywords: ['文本换行', 'wrap text', '自动换行', '硬换行', '列宽换行', 'word wrap'],
  },
  'bill-split': {
    name: '账单分摊计算器',
    tagline: '将含税和小费的账单在多人之间平均分摊。',
    description:
      '在浏览器本地把含税费和小费的账单在任意人数之间平均分摊，算清每人应付金额。',
    keywords: ['账单分摊', 'bill split', 'AA制', '平摊费用', '小费', 'split the check'],
  },
  countdown: {
    name: '倒计时器',
    tagline: '实时倒数到目标日期。',
    description:
      '在浏览器本地实时倒数到指定的目标日期和时间，显示剩余天数、时分秒。',
    keywords: ['倒计时', 'countdown', '倒数日', 'd-day', '活动计时', 'event timer'],
  },
  'crontab-builder': {
    name: 'Crontab 生成器',
    tagline: '可视化构建 cron 表达式。',
    description:
      '通过简单选项可视化生成 cron 表达式，并预览接下来的执行时间，全程在浏览器本地完成。',
    keywords: ['cron', 'crontab', '定时任务', '计划任务', 'cron表达式', 'schedule'],
  },
  'css-clamp': {
    name: 'CSS clamp() 生成器',
    tagline: '计算用于响应式尺寸的流式 clamp() 值。',
    description:
      '在浏览器本地生成响应式 CSS clamp() 值，实现字号和间距随视口流畅缩放。',
    keywords: ['css clamp', 'clamp函数', '流式排版', '响应式字号', 'fluid typography', 'responsive'],
  },
  'csv-to-html': {
    name: 'CSV 转 HTML 表格',
    tagline: '将 CSV 转换为 HTML 表格。',
    description:
      '在浏览器本地将 CSV 数据转换为 HTML 表格代码，方便直接嵌入网页。',
    keywords: ['CSV转HTML', 'csv to html', 'HTML表格', '表格生成', '数据转换', 'convert table'],
  },
  'decision-wheel': {
    name: '决策转盘',
    tagline: '转动转盘随机选出一个选项。',
    description:
      '输入多个选项，转动转盘随机抽取一个结果，帮你轻松做决定，全程在浏览器本地完成。',
    keywords: ['决策转盘', 'decision wheel', '随机转盘', '随机选择', '抽签', 'random pick'],
  },
  'hash-identifier': {
    name: '哈希类型识别',
    tagline: '根据长度和格式推测哈希类型。',
    description:
      '在浏览器本地根据哈希值的长度和格式，识别可能的算法（MD5、SHA-1/256、bcrypt 等）。',
    keywords: ['哈希识别', 'hash identifier', 'md5', 'sha', '哈希类型', 'detect hash'],
  },
  'iban-validator': {
    name: 'IBAN 校验器',
    tagline: '校验 IBAN 的校验位和格式。',
    description:
      '在浏览器本地校验 IBAN 国际银行账号的校验位和格式是否正确。',
    keywords: ['IBAN校验', 'iban validator', '银行账号', '校验位', 'checksum', 'bank'],
  },
  'ideal-weight': {
    name: '理想体重计算器',
    tagline: '根据身高估算理想体重。',
    description:
      '在浏览器本地根据身高和性别估算理想体重范围，作为健康参考。',
    keywords: ['理想体重', 'ideal weight', '标准体重', '健康体重', 'bmi', 'healthy weight'],
  },
  'image-sepia': {
    name: '怀旧棕褐色',
    tagline: '为图片添加棕褐色调。',
    description:
      '在浏览器本地为图片叠加温暖的棕褐色调，营造复古怀旧效果，图片不上传。',
    keywords: ['棕褐色', 'sepia', '怀旧滤镜', '复古', 'vintage', 'filter'],
  },
  'image-tint': {
    name: '图片色调叠加',
    tagline: '为图片叠加纯色色调。',
    description:
      '在浏览器本地为图片叠加一层纯色色调，统一画面氛围，图片不上传服务器。',
    keywords: ['色调叠加', 'tint', '颜色叠加', '滤镜', 'color overlay', 'filter'],
  },
  'image-vignette': {
    name: '图片暗角效果',
    tagline: '为图片添加四周变暗的暗角效果。',
    description:
      '在浏览器本地为图片添加暗角，使四周边缘变暗、突出中心主体，图片不上传。',
    keywords: ['暗角', 'vignette', '边缘变暗', '滤镜', 'dark edges', 'filter'],
  },
  'json-schema': {
    name: 'JSON Schema 生成器',
    tagline: '从 JSON 样本推断出 JSON Schema。',
    description:
      '在浏览器本地根据示例 JSON 文档推断并生成对应的 JSON Schema，用于校验。',
    keywords: ['JSON Schema', 'json schema', 'JSON校验', '模式生成', 'validation', 'json'],
  },
  'list-shuffle': {
    name: '列表随机打乱',
    tagline: '将一列文本行随机打乱顺序。',
    description:
      '在浏览器本地将多行文本随机打乱顺序，适用于抽签或随机排序，全程不上传。',
    keywords: ['随机打乱', 'shuffle list', '随机排序', '抽签', '乱序', 'random order'],
  },
  'luhn-generator': {
    name: 'Luhn 校验号码生成器',
    tagline: '生成符合 Luhn 校验的测试号码。',
    description:
      '在浏览器本地生成可通过 Luhn 校验算法的号码，仅供测试使用。',
    keywords: ['Luhn生成', 'luhn generator', '测试卡号', '校验位', 'checksum', 'test card number'],
  },
  'magic-8-ball': {
    name: '神奇八号球',
    tagline: '为任何问题随机给出是或否的答案。',
    description:
      '在浏览器本地提出一个是非问题，神奇八号球会随机给出一个有趣的答案。',
    keywords: ['神奇八号球', 'magic 8 ball', '是否', '随机答案', 'yes no', 'decision'],
  },
  'markdown-table-gen': {
    name: 'Markdown 表格生成器',
    tagline: '按行列构建 Markdown 表格。',
    description:
      '在浏览器本地根据你的行列数据生成 GitHub 风格的 Markdown 表格代码。',
    keywords: ['Markdown表格', 'markdown table', '表格生成', 'github', '生成器', 'generator'],
  },
  'meta-tags': {
    name: 'Meta 标签生成器',
    tagline: '生成 Open Graph 和 Twitter 卡片 meta 标签。',
    description:
      '在浏览器本地为你的网页生成 SEO、Open Graph 和 Twitter 卡片所需的 meta 标签。',
    keywords: ['meta标签', 'meta tags', 'open graph', 'twitter card', 'seo', '元标签'],
  },
  metronome: {
    name: '节拍器',
    tagline: '按 BPM 和拍号发出节拍点击声。',
    description:
      '在浏览器本地按你设定的 BPM 和拍号准确打拍，适合练习乐器，无需安装。',
    keywords: ['节拍器', 'metronome', 'bpm', '节拍', '速度', 'tempo'],
  },
  numerology: {
    name: '生命灵数计算器',
    tagline: '计算你的生命灵数。',
    description:
      '在浏览器本地根据出生日期和姓名计算生命灵数与姓名数字。',
    keywords: ['生命灵数', 'numerology', '数字命理', '命数', 'life path number', '占数'],
  },
  'pdf-delete-pages': {
    name: '删除 PDF 页面',
    tagline: '从 PDF 中移除指定页面。',
    description:
      '在浏览器本地从 PDF 文件中删除选定的页面，文件全程不离开你的设备。',
    keywords: ['删除PDF页面', 'delete pdf pages', '移除页面', 'PDF编辑', 'remove pages', 'PDF删页'],
  },
  'random-pin': {
    name: 'PIN 码生成器',
    tagline: '生成安全的随机数字 PIN 码。',
    description:
      '在浏览器本地生成任意长度的安全随机数字 PIN 码，使用加密级随机数。',
    keywords: ['PIN生成', 'pin generator', '随机PIN', '数字密码', 'numeric', '随机密码'],
  },
  'readability-score': {
    name: '可读性评分',
    tagline: '计算 Flesch 易读性和年级水平。',
    description:
      '在浏览器本地计算英文文本的 Flesch 易读性分数和阅读年级水平。',
    keywords: ['可读性', 'readability', 'flesch', '易读性', '年级水平', 'grade level'],
  },
  'robots-txt': {
    name: 'robots.txt 生成器',
    tagline: '构建带抓取规则的 robots.txt。',
    description:
      '在浏览器本地生成带 allow/disallow 规则和 sitemap 的 robots.txt 文件。',
    keywords: ['robots.txt', '爬虫规则', 'crawler', 'seo', 'disallow', '抓取规则'],
  },
  'screenshot-shadow': {
    name: '截图美化',
    tagline: '为截图添加背景、内边距和阴影。',
    description:
      '在浏览器本地为截图加上渐变背景、内边距和阴影，让画面更精致，图片不上传。',
    keywords: ['截图美化', 'screenshot beautifier', '阴影', '背景', 'shadow', 'background'],
  },
  'sort-numbers': {
    name: '数字排序',
    tagline: '排序数字并查看总和与平均值。',
    description:
      '在浏览器本地将一组数字升序或降序排序，并显示总和与平均值。',
    keywords: ['数字排序', 'sort numbers', '升序', '降序', '求和', 'average'],
  },
  'strikethrough-text': {
    name: '删除线文本',
    tagline: '生成 Unicode 删除线和下划线文本。',
    description:
      '在浏览器本地将文本转换为 Unicode 删除线或下划线样式，可用于社交平台发帖。',
    keywords: ['删除线', 'strikethrough text', '下划线', 'unicode', '划线文字', 'underline'],
  },
  'string-escape': {
    name: '字符串转义工具',
    tagline: '为 JSON、JS、HTML、SQL 转义和反转义字符串。',
    description:
      '在浏览器本地为 JSON、JavaScript、HTML 或 SQL 转义或反转义字符串。',
    keywords: ['字符串转义', 'escape', '反转义', 'unescape', 'json', 'html'],
  },
  'superscript-text': {
    name: '上标与下标',
    tagline: '生成 Unicode 上标和下标文本。',
    description:
      '在浏览器本地将文本转换为 Unicode 上标或下标字符，便于在纯文本中使用。',
    keywords: ['上标', 'superscript', '下标', 'subscript', 'unicode', '角标'],
  },
  'syllable-counter': {
    name: '音节计数器',
    tagline: '统计英文文本的音节和单词数。',
    description:
      '在浏览器本地统计英文文本的音节和单词数量，适用于写诗或俳句。',
    keywords: ['音节计数', 'syllable counter', '单词数', '俳句', 'haiku', 'words'],
  },
  'tailwind-shades': {
    name: 'Tailwind 色阶生成器',
    tagline: '从基础色生成 50-950 的色阶。',
    description:
      '在浏览器本地从一个基础色生成 Tailwind 风格的 50-950 色阶配色。',
    keywords: ['tailwind', '色阶', 'color shades', '调色板', 'palette', '配色'],
  },
  'unicode-lookup': {
    name: 'Unicode 字符检查器',
    tagline: '查看码位、名称和 UTF-8 字节。',
    description:
      '在浏览器本地查询任意文本的 Unicode 码位、字符名称和 UTF-8 编码。',
    keywords: ['unicode', '码位', 'code point', 'utf-8', '字符编码', '字符查询'],
  },
  'world-clock': {
    name: '世界时钟',
    tagline: '同时查看各城市的当前时间。',
    description:
      '在浏览器本地同时查看多个城市和时区的当前时间，方便跨时区协作。',
    keywords: ['世界时钟', 'world clock', '时区', 'time zones', '当前时间', 'current time'],
  },
  zodiac: {
    name: '星座查询',
    tagline: '根据生日查出你的星座。',
    description:
      '在浏览器本地根据出生日期查出你的占星星座，全程无需上传任何信息。',
    keywords: ['星座查询', 'zodiac sign', '星座', '占星', 'astrology', 'horoscope'],
  },
};

export const ZH_TOOL_IDS: string[] = Object.keys(ZH_TOOLS);

export function getZhCopy(id: string): ZhToolCopy | undefined {
  return ZH_TOOLS[id];
}

export function hasZhCopy(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(ZH_TOOLS, id);
}

/**
 * Simplified Chinese how-to guide content for curated tools.
 *
 * Mirrors `lib/guide-content-en.ts` but emits Simplified Chinese copy and is
 * driven by the curated Chinese names in `lib/zh-tools.ts`. The category
 * pattern (file / generator / text / calc / viewer) is shared with the Korean
 * builder via getPattern, so all languages stay structurally aligned.
 *
 * Server-component only — the result is baked into static HTML, no CSR.
 */

import type { ToolMeta } from '@/lib/tools/registry';
import { getPattern, type GuidePattern } from '@/lib/guide-content';
import type { ZhToolCopy } from '@/lib/zh-tools';

export interface GuideStepZh {
  title: string;
  body: string;
}

export interface GuideContentZh {
  /** <title> (under ~60 chars). */
  metaTitle: string;
  /** meta description (under ~155 chars). */
  metaDescription: string;
  /** intro paragraph under the H1. */
  intro: string;
  /** 3–5 key feature bullets. */
  features: string[];
  /** step-by-step instructions. */
  steps: GuideStepZh[];
  /** FAQ entries. */
  faqs: Array<{ q: string; a: string }>;
}

const CATEGORY_NOUN_ZH: Record<string, string> = {
  pdf: 'PDF',
  image: '图片',
  video: '视频',
  gif: 'GIF',
  audio: '音频',
  docs: '文档',
  text: '文本',
  dev: '开发者',
  util: '实用工具',
  security: '安全',
  ai: 'AI',
};

export function buildGuideZh(tool: ToolMeta, zh: ZhToolCopy): GuideContentZh {
  const pattern = getPattern(tool);
  const cat = CATEGORY_NOUN_ZH[tool.category] ?? tool.category;

  const metaTitle = `${zh.name}使用方法 — 免费、无需上传`;
  const metaDescription =
    `${zh.description} 无需注册、无需安装。${cat}处理全部在浏览器内完成，文件绝不会离开你的设备。`.slice(
      0,
      155,
    );

  const intro = `${zh.name}是一款用于${zh.tagline.replace(/。$/, '')}的工具。无需注册也无需安装，是一款完全在浏览器内运行的免费 Web Toolkit ${cat}工具。绝不会向服务器上传任何内容。`;

  return {
    metaTitle,
    metaDescription,
    intro,
    features: buildFeatures(pattern, cat),
    steps: buildSteps(tool, pattern, cat, zh),
    faqs: buildFaqs(tool, pattern, cat, zh),
  };
}

function buildFeatures(pattern: GuidePattern, cat: string): string[] {
  const base = [
    '文件不会离开浏览器 ― 所有处理都在客户端完成。',
    '无需账户、无需登录。打开页面即可立即使用。',
  ];
  if (pattern === 'file') {
    return [
      ...base,
      `拖放（或点击选择）${cat}文件后，会立即显示相关选项。`,
      '在支持的工具中，可使用批量模式同时处理多个文件。',
      '安装为 PWA 后，可从主屏幕离线使用。',
    ];
  }
  if (pattern === 'generator') {
    return [
      ...base,
      '基于 Web Crypto API 的安全随机数、哈希与密钥生成 ― 在设计上不可预测。',
      '结果可复制到剪贴板、保存为文件或通过 URL 分享。',
      '在移动端同样功能完整，可用键盘快捷键快速操作。',
    ];
  }
  if (pattern === 'calc') {
    return [
      ...base,
      '输入数值、日期或单位后，无需按钮即可实时计算结果。',
      '不仅显示公式，还显示实际结果，并可一键复制到剪贴板。',
      '在移动端同样功能完整，更改任意字段都会立即重新计算。',
    ];
  }
  if (pattern === 'viewer') {
    return [
      ...base,
      `打开${cat}文件后，直接在屏幕上查看其内容或信息 ― 无需转换或保存。`,
      '文件仅在浏览器内打开，不会上传到任何地方。',
      '部分工具可将文本、元数据或目录导出为文本 / Markdown。',
    ];
  }
  return [
    ...base,
    '输入后结果实时更新 ― 无需「转换」按钮。',
    '一键将输出复制到剪贴板，或保存为文件。',
    '通过中英文关键词搜索和键盘快捷键，可在各工具间快速切换。',
  ];
}

function buildSteps(
  tool: ToolMeta,
  pattern: GuidePattern,
  cat: string,
  zh: ZhToolCopy,
): GuideStepZh[] {
  if (pattern === 'file') {
    return [
      {
        title: `上传${cat}文件`,
        body: `打开工具，将${cat}文件拖到放置区，或使用文件选择器。在移动端可直接从相册或文件中选择。文件仅保留在浏览器内存中，不会发送到任何地方。`,
      },
      {
        title: '设置选项并预览',
        body: `选择${zh.name}所需的选项（画质、尺寸、格式、页面范围等）。大多数工具会显示实时预览，可一边查看结果一边调整设置。`,
      },
      {
        title: '下载结果',
        body: '点击「下载」或「保存」，处理后的文件即会保存到你的设备。较大的文件可能需要时间并显示进度条，但你可以随时取消并立即停止。',
      },
    ];
  }
  if (pattern === 'generator') {
    return [
      {
        title: '选择选项',
        body: '选择所需的格式、长度、强度或算法。对于密钥、OTP、随机数等安全用途，建议使用稳妥的设置；常规用途保持默认即可。',
      },
      {
        title: '立即生成',
        body: '点击「生成」后，将通过 Web Crypto / Canvas API 在浏览器内生成结果。可更改选项重新生成并进行比较。',
      },
      {
        title: '复制或保存',
        body: '一键将结果复制到剪贴板，或按需保存为文件（PEM、PNG、SVG、TXT 等）。请将私钥妥善保存在安全的位置。',
      },
    ];
  }
  if (pattern === 'calc') {
    return [
      {
        title: '输入数值',
        body: `在输入框中填入${zh.name}所需的数值（日期、金额、数字、单位等）。按字段逐项输入而非粘贴文本，因此在移动端也能快速使用。`,
      },
      {
        title: '实时查看结果',
        body: '更改输入的瞬间即会重新计算结果。在同时处理多个字段的工具中，所有结果会汇总显示在同一屏幕上。',
      },
      {
        title: '复制结果加以利用',
        body: '将计算结果复制到剪贴板，即可直接粘贴到备忘录、文档或消息中。刷新页面后输入内容会被清空。',
      },
    ];
  }
  if (pattern === 'viewer') {
    return [
      {
        title: `打开${cat}文件`,
        body: `打开工具，将${cat}文件拖到放置区，或使用文件选择器。文件仅在浏览器内打开，不会发送到服务器。`,
      },
      {
        title: '浏览内容',
        body: `${zh.name}会在屏幕上显示内容、元数据、目录或结构。无需转换并下载的步骤，可直接阅读或确认，找到所需信息。`,
      },
      {
        title: '需要时可导出',
        body: '部分工具可将显示的内容导出为文本、Markdown 或图片。若只是浏览，关闭页面即可，不会留下任何内容。',
      },
    ];
  }
  return [
    {
      title: '粘贴输入',
      body: '将想要转换或分析的文本或数据粘贴或输入到输入区。即使是数十 MB（已验证）的大型输入也能瞬间处理。',
    },
    {
      title: '实时查看结果',
      body: '输入后结果会自动更新。在带有选项的工具中，更改后输出会立即重新计算。',
    },
    {
      title: '复制或下载',
      body: '通过「复制」按钮获取结果，或通过「下载」保存。大型输出支持 .txt、.json、.csv 格式。',
    },
  ];
}

function buildFaqs(
  tool: ToolMeta,
  pattern: GuidePattern,
  cat: string,
  zh: ZhToolCopy,
): Array<{ q: string; a: string }> {
  const common = [
    {
      q: '文件会被上传到服务器吗？',
      a: '不会。仅使用 Web Worker、WebAssembly 和 Canvas API，全部在浏览器内处理。你可以打开网络面板自行确认。',
    },
    {
      q: '是免费的吗？',
      a: '是的。无需注册、无需付费，也没有使用限制。本站靠广告运营，不会收集或出售你的数据。',
    },
    {
      q: '在移动端能正常使用吗？',
      a: '可以。所有工具均采用移动优先设计，并已在 iOS Safari 和 Android Chrome 上验证。添加到主屏幕后即可像应用一样使用。',
    },
  ];

  if (pattern === 'file') {
    return [
      ...common,
      {
        q: '有文件大小上限吗？',
        a: `在浏览器内存范围内运行。${zh.name}大致已验证到${
          tool.category === 'video' ? '500MB' : tool.category === 'pdf' ? '100MB' : '50MB'
        }，超过此大小的文件可能耗时较长或导致内存不足。`,
      },
      {
        q: '可以一次处理多个文件吗？',
        a: '大多数工具都支持批量模式。整个文件夹拖入后会自动加载，结果可打包为 ZIP 一并下载。',
      },
    ];
  }
  if (pattern === 'generator') {
    return [
      ...common,
      {
        q: '生成的结果安全吗？',
        a: '使用 Web Crypto API 的安全随机源（crypto.getRandomValues / SubtleCrypto），比 Math.random 更均匀且更难预测。生成的私钥或种子的安全保管由你自行负责。',
      },
      {
        q: '结果会保存在哪里？',
        a: '不会保存在任何地方。刷新页面后即会消失，需要保留的内容请复制或保存。',
      },
    ];
  }
  if (pattern === 'calc') {
    return [
      ...common,
      {
        q: '结果准确吗？',
        a: `${zh.name}实现了标准计算公式，并在浏览器内计算。对于税费、薪资等依赖可变规则与费率的项目，请确认随结果一同显示的基准（年度、费率）。`,
      },
      {
        q: '输入的内容会被保存吗？',
        a: '不会。输入仅在浏览器内使用，不会发送也不会保存。刷新页面后即会重置。',
      },
    ];
  }
  if (pattern === 'viewer') {
    return [
      ...common,
      {
        q: '文件会被上传到服务器吗？',
        a: '不会。文件仅在浏览器内打开以显示内容，不会被上传。即使是机密文档也可放心使用。',
      },
      {
        q: '可以保存内容吗？',
        a: `${zh.name}可根据具体工具，将显示的文本、元数据或目录导出为文本、Markdown 或图片。若只是浏览，关闭页面即可。`,
      },
    ];
  }
  return [
    ...common,
    {
      q: '可以处理大型文本吗？',
      a: '已验证支持数十 MB 的输入。正则表达式求值、差异比较等复杂处理在输入越大时越慢，但常规文档或代码可瞬间处理。',
    },
    {
      q: '可以更改输出格式吗？',
      a: `${zh.name}会根据各工具支持合适的输出格式（.txt、.json、.csv、.md 等）。若有相关选项，可在界面上选择。`,
    },
  ];
}

/**
 * Japanese how-to guide content for curated tools.
 *
 * Mirrors `lib/guide-content-en.ts` but emits Japanese copy and is driven by
 * the curated Japanese names in `lib/ja-tools.ts`. The category pattern
 * (file / generator / text / calc / viewer) is shared with the Korean builder
 * via getPattern, so all languages stay structurally aligned.
 *
 * Server-component only — the result is baked into static HTML, no CSR.
 */

import type { ToolMeta } from '@/lib/tools/registry';
import { getPattern, type GuidePattern } from '@/lib/guide-content';
import type { JaToolCopy } from '@/lib/ja-tools';

export interface GuideStepJa {
  title: string;
  body: string;
}

export interface GuideContentJa {
  /** <title> (under ~60 chars). */
  metaTitle: string;
  /** meta description (under ~155 chars). */
  metaDescription: string;
  /** intro paragraph under the H1. */
  intro: string;
  /** 3–5 key feature bullets. */
  features: string[];
  /** step-by-step instructions. */
  steps: GuideStepJa[];
  /** FAQ entries. */
  faqs: Array<{ q: string; a: string }>;
}

const CATEGORY_NOUN_JA: Record<string, string> = {
  pdf: 'PDF',
  image: '画像',
  video: '動画',
  gif: 'GIF',
  audio: '音声',
  docs: '文書',
  text: 'テキスト',
  dev: '開発者向け',
  util: 'ユーティリティ',
  security: 'セキュリティ',
  ai: 'AI',
};

export function buildGuideJa(tool: ToolMeta, ja: JaToolCopy): GuideContentJa {
  const pattern = getPattern(tool);
  const cat = CATEGORY_NOUN_JA[tool.category] ?? tool.category;

  const metaTitle = `${ja.name}の使い方 — 無料・アップロード不要`;
  const metaDescription =
    `${ja.description} 登録不要・インストール不要。${cat}の処理はブラウザ内で行われ、ファイルが端末から外に出ることはありません。`.slice(
      0,
      155,
    );

  const intro = `${ja.name}は、${ja.tagline.replace(/。$/, '')}ためのツールです。登録もインストールも不要で、すべてブラウザ内で動作する無料のWeb Toolkit${cat}ツールです。サーバーへのアップロードは一切ありません。`;

  return {
    metaTitle,
    metaDescription,
    intro,
    features: buildFeatures(pattern, cat),
    steps: buildSteps(tool, pattern, cat, ja),
    faqs: buildFaqs(tool, pattern, cat, ja),
  };
}

function buildFeatures(pattern: GuidePattern, cat: string): string[] {
  const base = [
    'ファイルはブラウザの外に出ません ― すべての処理がクライアント側で完結します。',
    'アカウントもログインも不要。ページを開けばすぐに使えます。',
  ];
  if (pattern === 'file') {
    return [
      ...base,
      `${cat}ファイルをドラッグ＆ドロップ（またはクリックで選択）すると、すぐにオプションが表示されます。`,
      '対応ツールでは、一括モードで複数ファイルを同時に処理できます。',
      'PWAとしてインストールすれば、ホーム画面からオフラインでも使えます。',
    ];
  }
  if (pattern === 'generator') {
    return [
      ...base,
      'Web Crypto APIによる安全な乱数・ハッシュ・鍵生成 ― 設計上、予測不可能です。',
      '結果はクリップボードへコピー、ファイル保存、URL共有が可能です。',
      'モバイルでもフル機能。キーボードショートカットで素早く操作できます。',
    ];
  }
  if (pattern === 'calc') {
    return [
      ...base,
      '値・日付・単位を入力すると、ボタンなしでリアルタイムに結果が計算されます。',
      '式だけでなく実際の結果を表示し、ワンクリックでクリップボードへコピーできます。',
      'モバイルでもフル機能。どの項目を変えても即座に再計算されます。',
    ];
  }
  if (pattern === 'viewer') {
    return [
      ...base,
      `${cat}ファイルを開いて、その内容や情報を画面上でそのまま確認 ― 変換も保存も不要です。`,
      'ファイルはブラウザ内だけで開かれ、どこにもアップロードされません。',
      'ツールによっては、テキスト・メタデータ・目次をテキスト/Markdownで書き出せます。',
    ];
  }
  return [
    ...base,
    '入力すると結果がリアルタイムに更新 ―「変換」ボタンは不要です。',
    '出力はワンクリックでクリップボードにコピー、またはファイルとして保存できます。',
    '日英のキーワード検索とキーボードショートカットでツール間を素早く移動できます。',
  ];
}

function buildSteps(
  tool: ToolMeta,
  pattern: GuidePattern,
  cat: string,
  ja: JaToolCopy,
): GuideStepJa[] {
  if (pattern === 'file') {
    return [
      {
        title: `${cat}ファイルをアップロード`,
        body: `ツールを開き、${cat}ファイルをドロップゾーンにドラッグするか、ファイル選択を使います。モバイルではギャラリーやファイルから直接選べます。ファイルはブラウザのメモリ上にだけ保持され、どこにも送信されません。`,
      },
      {
        title: 'オプション設定とプレビュー',
        body: `${ja.name}に必要なオプション（画質・サイズ・形式・ページ範囲など）を選びます。多くのツールはライブプレビューを表示し、結果を見ながら設定を調整できます。`,
      },
      {
        title: '結果をダウンロード',
        body: '「ダウンロード」または「保存」を押すと、処理済みファイルが端末に保存されます。大きいファイルは時間がかかり進捗バーが表示されることがありますが、いつでもキャンセルして即座に停止できます。',
      },
    ];
  }
  if (pattern === 'generator') {
    return [
      {
        title: 'オプションを選ぶ',
        body: '必要な形式・長さ・強度・アルゴリズムを選びます。鍵やOTP、乱数などのセキュリティ用途では控えめな設定に、一般用途では既定値のままで問題ありません。',
      },
      {
        title: '即座に生成',
        body: '「生成」を押すと、Web Crypto / Canvas APIによりブラウザ内で結果が作られます。オプションを変えて再生成し、比較できます。',
      },
      {
        title: 'コピーまたは保存',
        body: 'ワンクリックで結果をクリップボードへコピー、または必要に応じてファイル（PEM・PNG・SVG・TXTなど）として保存します。秘密鍵は安全な場所に保管してください。',
      },
    ];
  }
  if (pattern === 'calc') {
    return [
      {
        title: '値を入力',
        body: `${ja.name}に必要な値（日付・金額・数値・単位など）を入力欄に入れます。テキストを貼り付けるのではなく項目ごとに入力するため、モバイルでも素早く使えます。`,
      },
      {
        title: 'リアルタイムに結果を確認',
        body: '入力を変えた瞬間に結果が再計算されます。複数の項目を一度に扱うツールでは、すべての結果が同じ画面にまとめて表示されます。',
      },
      {
        title: '結果をコピーして活用',
        body: '計算結果をクリップボードへコピーし、メモ・文書・メッセージにそのまま貼り付けられます。ページを更新すると入力はクリアされます。',
      },
    ];
  }
  if (pattern === 'viewer') {
    return [
      {
        title: `${cat}ファイルを開く`,
        body: `ツールを開き、${cat}ファイルをドロップゾーンにドラッグするか、ファイル選択を使います。ファイルはブラウザ内だけで開かれ、サーバーには送信されません。`,
      },
      {
        title: '内容を閲覧',
        body: `${ja.name}が内容・メタデータ・目次・構造を画面に表示します。変換してダウンロードする手順はなく、そのまま読んだり確認したりして必要な情報を見つけられます。`,
      },
      {
        title: '必要なら書き出し',
        body: 'ツールによっては、表示された内容をテキスト・Markdown・画像として書き出せます。閲覧だけならページを閉じるだけで、何も残りません。',
      },
    ];
  }
  return [
    {
      title: '入力を貼り付け',
      body: '変換・分析したいテキストやデータを入力エリアに貼り付けるか入力します。数十MB（検証済み）の大きな入力でも瞬時に処理されます。',
    },
    {
      title: 'リアルタイムに結果を確認',
      body: '入力すると結果が自動的に更新されます。オプションがあるツールでは、変更すると出力がすぐに再計算されます。',
    },
    {
      title: 'コピーまたはダウンロード',
      body: '「コピー」ボタンで結果を取得、または「ダウンロード」で保存します。大きな出力は.txt・.json・.csv形式に対応します。',
    },
  ];
}

function buildFaqs(
  tool: ToolMeta,
  pattern: GuidePattern,
  cat: string,
  ja: JaToolCopy,
): Array<{ q: string; a: string }> {
  const common = [
    {
      q: 'ファイルはサーバーにアップロードされますか？',
      a: 'いいえ。Web Worker・WebAssembly・Canvas APIのみを使用し、すべてブラウザ内で処理されます。ネットワークタブを開けばご自身で確認できます。',
    },
    {
      q: '無料ですか？',
      a: 'はい。登録も支払いも利用制限もありません。本サイトは広告で運営されており、データの収集や販売は行いません。',
    },
    {
      q: 'モバイルでも動作しますか？',
      a: 'はい。すべてのツールはモバイルファーストで設計され、iOS SafariとAndroid Chromeで検証済みです。ホーム画面に追加すればアプリのように使えます。',
    },
  ];

  if (pattern === 'file') {
    return [
      ...common,
      {
        q: 'ファイルサイズの上限はありますか？',
        a: `ブラウザのメモリ範囲内で動作します。${ja.name}はおおよそ${
          tool.category === 'video' ? '500MB' : tool.category === 'pdf' ? '100MB' : '50MB'
        }まで検証済みで、それより大きいファイルは時間がかかったりメモリ不足になることがあります。`,
      },
      {
        q: '複数のファイルを一度に処理できますか？',
        a: 'ほとんどのツールが一括モードに対応しています。フォルダごとドラッグすると自動で読み込まれ、結果はZIPにまとめてダウンロードできます。',
      },
    ];
  }
  if (pattern === 'generator') {
    return [
      ...common,
      {
        q: '生成される結果は安全ですか？',
        a: 'Web Crypto APIの安全な乱数源（crypto.getRandomValues / SubtleCrypto）を使用しており、Math.randomより均一で予測困難です。生成した秘密鍵やシードの安全な保管はご自身の責任です。',
      },
      {
        q: '結果はどこに保存されますか？',
        a: 'どこにも保存されません。ページを更新すると消えるため、残したいものはコピーまたは保存してください。',
      },
    ];
  }
  if (pattern === 'calc') {
    return [
      ...common,
      {
        q: '結果は正確ですか？',
        a: `${ja.name}は標準的な計算式を実装し、ブラウザ内で計算します。税や給与など変動するルール・料率に依存する項目は、結果とともに表示される基準（年度・料率）をご確認ください。`,
      },
      {
        q: '入力した内容は保存されますか？',
        a: 'いいえ。入力はブラウザ内でのみ使用され、送信も保存もされません。ページを更新するとリセットされます。',
      },
    ];
  }
  if (pattern === 'viewer') {
    return [
      ...common,
      {
        q: 'ファイルはサーバーにアップロードされますか？',
        a: 'いいえ。ファイルは内容を表示するためブラウザ内でのみ開かれ、アップロードされません。機密文書でも安心して使えます。',
      },
      {
        q: '内容を保存できますか？',
        a: `${ja.name}はツールに応じて、表示されたテキスト・メタデータ・目次をテキスト・Markdown・画像として書き出せます。閲覧だけならページを閉じるだけです。`,
      },
    ];
  }
  return [
    ...common,
    {
      q: '大きなテキストも処理できますか？',
      a: '数十MBの入力を検証済みです。正規表現の評価や差分などの複雑な処理は入力が大きいほど遅くなりますが、通常の文書やコードは瞬時に処理されます。',
    },
    {
      q: '出力形式は変更できますか？',
      a: `${ja.name}はツールごとに適切な出力形式（.txt・.json・.csv・.mdなど）に対応します。オプションがある場合は画面上で選択できます。`,
    },
  ];
}

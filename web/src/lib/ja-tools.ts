/**
 * Curated Japanese copy for high-value tools.
 *
 * The registry (`lib/tools/registry.ts`) stores Korean titles/descriptions.
 * For the Japanese SEO surface we don't translate all tools — we curate the
 * tools with the strongest Japanese search intent (generators, dev/text
 * utilities, and a few popular file converters) and write bespoke Japanese
 * copy.
 *
 * This single module powers BOTH Japanese surfaces for a tool:
 *   - /ja/tools/{id}  — transactional landing page ("free online X, no upload")
 *   - /ja/guide/{id}  — informational how-to guide (built in guide-content-ja.ts)
 *
 * Mirrors `lib/en-tools.ts`. To expand Japanese coverage in a later round, add
 * entries here — the pages, sitemap, and catalog links pick them up
 * automatically.
 */

export interface JaToolCopy {
  /** Japanese display name — used as H1 / <title> seed. */
  name: string;
  /** One-line transactional tagline (under the H1). */
  tagline: string;
  /** Meta description seed (~140 chars). "free / no upload" handled by pages. */
  description: string;
  /** Japanese (+ romaji/English) search keywords for <meta keywords> and copy. */
  keywords: string[];
}

export const JA_TOOLS: Record<string, JaToolCopy> = {
  // ── ファイル圧縮 ──────────────────────────────────────────────────────────
  compress: {
    name: 'ファイル圧縮（画像・PDF）',
    tagline: '画像とPDFをブラウザ上でそのまま軽量化。',
    description:
      '画像やPDFをブラウザ内で圧縮してファイルサイズを縮小。アップロードや送信が速くなり、ファイルはどこにも送信されません。',
    keywords: ['ファイル圧縮', '画像圧縮', 'pdf 圧縮', 'compress', 'サイズ縮小'],
  },

  // ── PDF ───────────────────────────────────────────────────────────────────
  'pdf-merge': {
    name: 'PDF結合',
    tagline: '複数のPDFを1つにまとめる ― アップロード不要。',
    description:
      '複数のPDFをブラウザ上で結合・並べ替えして1つのファイルに。ファイルが端末から外に出ることはありません。',
    keywords: ['pdf 結合', 'pdf 統合', 'merge pdf', 'pdf まとめる', 'pdf 連結'],
  },
  'pdf-split': {
    name: 'PDF分割',
    tagline: 'ページを抽出、またはPDFを複数ファイルに分割。',
    description:
      '指定したページの抽出やPDFの分割をブラウザ内で実行。どのサーバーにもアップロードされません。',
    keywords: ['pdf 分割', 'pdf ページ 抽出', 'split pdf', 'pdf 切り出し', 'pdf 分ける'],
  },
  'pdf-to-jpg': {
    name: 'PDFをJPGに変換',
    tagline: 'PDFの各ページをJPGまたはPNG画像に。',
    description:
      'PDFの各ページをJPG/PNG画像に変換してダウンロード。PDF.jsでローカル処理し、アップロードしません。',
    keywords: ['pdf jpg 変換', 'pdf 画像', 'pdf png', 'pdf to jpg', 'pdf 画像化'],
  },
  'pdf-from-jpg': {
    name: 'JPGをPDFに変換',
    tagline: '複数の画像を1つのPDFにまとめる。',
    description:
      'JPGやPNGなどの画像を1つのPDFに変換。ページサイズや順序も指定でき、ブラウザ内で処理します。',
    keywords: ['jpg pdf 変換', '画像 pdf', 'png pdf', 'jpg to pdf', '写真 pdf'],
  },
  'pdf-rotate': {
    name: 'PDFページ回転',
    tagline: '選んだページを90/180/270度回転。',
    description:
      'PDFの指定ページを90・180・270度回転して保存。横向きスキャンや向きの混在を直せます。ブラウザ内で完結。',
    keywords: ['pdf 回転', 'pdf ページ 回転', 'rotate pdf', 'pdf 向き 修正', 'pdf 縦横'],
  },
  'pdf-organize': {
    name: 'PDFページ整理',
    tagline: 'サムネイルで並べ替え・削除・複製。',
    description:
      'PDFのページをサムネイルで視覚的に並べ替え・削除・複製してから書き出し。ファイルはアップロードされません。',
    keywords: ['pdf ページ 整理', 'pdf 並べ替え', 'pdf ページ 削除', 'organize pdf', 'pdf 編集'],
  },
  'pdf-unlock': {
    name: 'PDFのロック解除（パスワード除去）',
    tagline: '開けるPDFから既知のパスワードを除去。',
    description:
      'すでに開けるPDFのパスワードを除去し、次回からパスワード入力なしで開けるように。ブラウザ内で処理します。',
    keywords: ['pdf ロック 解除', 'pdf パスワード 解除', 'unlock pdf', 'pdf 制限 解除', 'pdf 暗号 解除'],
  },
  'pdf-protect': {
    name: 'PDFにパスワード設定',
    tagline: 'PDFにパスワードと暗号化を追加。',
    description:
      'PDFにパスワード保護を追加し、パスワードを知る人だけが開けるように。ローカルで暗号化し、アップロードしません。',
    keywords: ['pdf パスワード', 'pdf 暗号化', 'protect pdf', 'pdf ロック', 'pdf 保護'],
  },

  // ── 画像 ─────────────────────────────────────────────────────────────────
  'image-resize': {
    name: '画像のサイズ変更',
    tagline: 'ピクセルまたはパーセントで画像をリサイズ。',
    description:
      'JPG・PNG・WebP・GIFをピクセルや比率でリサイズ。縦横比ロックにも対応し、すべてブラウザ内で処理します。',
    keywords: ['画像 リサイズ', '画像 サイズ 変更', 'resize image', '画像 縮小', '写真 サイズ'],
  },
  'image-crop': {
    name: '画像のトリミング',
    tagline: '範囲指定や固定アスペクト比で写真を切り抜き。',
    description:
      'JPG・PNG・WebPを任意の範囲や固定アスペクト比で切り抜き。ライブプレビューを見ながらブラウザ内で処理します。',
    keywords: ['画像 トリミング', '画像 切り抜き', 'crop image', '写真 トリミング', '画像 カット'],
  },
  'image-convert': {
    name: '画像フォーマット変換（PNG/JPG/WebP）',
    tagline: 'PNG・JPG・WebPなどの形式を相互変換。',
    description:
      '画像をPNG・JPG・WebPなどの形式に変換。複数ファイルの一括処理にも対応し、アップロードはありません。',
    keywords: ['画像 変換', 'png jpg 変換', 'jpg webp', 'image converter', 'webp 変換'],
  },
  'image-rotate': {
    name: '画像の回転・反転',
    tagline: '任意の角度で画像を回転・反転。',
    description:
      '画像を90度や任意の角度で回転、または左右・上下に反転。高速かつローカルで処理し、アップロードしません。',
    keywords: ['画像 回転', '画像 反転', 'rotate image', '写真 回転', '画像 向き'],
  },
  'image-heic-to-jpg': {
    name: 'HEICをJPGに変換',
    tagline: 'iPhoneのHEIC写真を汎用JPGへ。',
    description:
      'iPhoneのHEIC/HEIF写真を汎用のJPG画像にブラウザ内で変換。アップロード不要、一括変換にも対応します。',
    keywords: ['heic jpg 変換', 'heic 変換', 'convert heic', 'iphone 写真 変換', 'heic jpeg'],
  },
  'remove-background': {
    name: '画像の背景除去',
    tagline: 'AIで写真の背景を自動で消去。',
    description:
      'ブラウザ内のAIモデルで写真の背景を自動除去し、透過PNGをダウンロード。アップロードはありません。',
    keywords: ['背景 除去', '背景 透過', 'remove background', '背景 削除', '透過 png'],
  },
  'image-upscale': {
    name: 'AI画像アップスケーラー',
    tagline: '画質を保ったまま画像を拡大。',
    description:
      'ブラウザ内のAI超解像モデルで画像を拡大・シャープ化。ディテールを保ちながら解像度を上げます。ローカル処理。',
    keywords: ['画像 拡大', 'ai アップスケール', 'upscale', '解像度 上げる', '高解像度化'],
  },
  'favicon-gen': {
    name: 'ファビコン生成',
    tagline: '画像1枚からfavicon.icoとPWA各サイズを生成。',
    description:
      '画像をアップロードすると、16/32/48/180/512pxとfavicon.icoのファビコン一式をZIPでダウンロード。ブラウザ内処理。',
    keywords: ['ファビコン 生成', 'favicon 作成', 'ico 生成', 'apple touch icon', 'pwa アイコン'],
  },
  'meme-gen': {
    name: 'ミーム（meme）作成',
    tagline: '画像に上下のテキストを入れてミームを作成。',
    description:
      '画像をアップロードして上下にテキストを入力、クラシックなImactスタイルのミームを作成しダウンロード。アップロードなし。',
    keywords: ['ミーム 作成', 'meme generator', '画像 文字入れ', 'ネタ画像', 'インパクト フォント'],
  },
  'image-flip': {
    name: '画像の反転（ミラー）',
    tagline: '画像を左右または上下に反転。',
    description:
      '画像を左右（ミラー）または上下に反転して保存。すべてブラウザ内で処理します。',
    keywords: ['画像 反転', '画像 ミラー', 'flip image', '左右 反転', '上下 反転'],
  },

  // ── 動画 ─────────────────────────────────────────────────────────────────
  'video-compress': {
    name: '動画の圧縮',
    tagline: '解像度とビットレートで動画を軽量化。',
    description:
      'ブラウザ内のFFmpegで解像度・ビットレートを調整して動画サイズを縮小。アップロード制限に合わせられ、送信はありません。',
    keywords: ['動画 圧縮', '動画 サイズ 縮小', 'compress video', 'mp4 圧縮', '動画 軽量化'],
  },
  'video-trim': {
    name: '動画のカット（トリム）',
    tagline: '開始・終了時刻で動画を素早く切り出し。',
    description:
      '開始・終了時刻を指定して必要な区間だけを切り出し。再エンコードなしで高速に分割でき、ブラウザ内で処理します。',
    keywords: ['動画 カット', '動画 トリミング', 'trim video', '動画 切り出し', '動画 編集'],
  },
  'video-convert': {
    name: '動画フォーマット変換',
    tagline: 'MP4・WebM・MOVなどを相互変換。',
    description:
      'ブラウザ内のFFmpegでMP4・WebM・MOVなどの形式に変換。動画が端末から外に出ることはありません。',
    keywords: ['動画 変換', 'mp4 変換', 'mov mp4', 'webm 変換', 'convert video'],
  },
  'video-to-gif': {
    name: '動画をGIFに変換',
    tagline: '動画クリップを最適化アニメGIFに。',
    description:
      'MP4などのクリップをfpsやサイズを指定して最適化アニメGIFに変換。ブラウザ内のFFmpegで処理し、アップロードなし。',
    keywords: ['動画 gif 変換', 'mp4 gif', 'gif 作成', 'video to gif', '動画 アニメgif'],
  },
  'video-crop': {
    name: '動画のクロップ（範囲切り抜き）',
    tagline: '動画を矩形範囲だけに切り抜き。',
    description:
      '矩形を選んでその範囲だけを残します。FFmpeg.wasm（WebAssembly）で動作し、アップロードはありません。',
    keywords: ['動画 クロップ', '動画 切り抜き', 'crop video', '動画 範囲', '動画 トリミング 枠'],
  },
  'video-mute': {
    name: '動画の音声を消す（ミュート）',
    tagline: '動画から音声トラックを除去。',
    description:
      '動画から音声を取り除いて無音クリップを書き出し。FFmpeg.wasmでブラウザ内処理します。',
    keywords: ['動画 ミュート', '動画 音 消す', 'mute video', '無音 動画', '音声 除去'],
  },
  'screen-record': {
    name: '画面録画',
    tagline: '画面・タブ・ウィンドウをwebmで録画。',
    description:
      'マイク音声も任意で含めて画面を録画し、webmでダウンロード。アップロードもインストールも不要、ブラウザだけで完結。',
    keywords: ['画面 録画', 'スクリーン レコード', 'screen recorder', 'webm 録画', '無料 画面録画'],
  },

  // ── 音声 ─────────────────────────────────────────────────────────────────
  'audio-convert': {
    name: '音声フォーマット変換',
    tagline: 'MP3・WAV・OGGなど音声を相互変換。',
    description:
      'ブラウザ内のFFmpegでMP3・WAV・OGG・M4Aなどの形式に変換。アップロードはありません。',
    keywords: ['音声 変換', 'mp3 変換', 'wav mp3', 'audio converter', '音楽 形式 変換'],
  },
  'audio-trim': {
    name: '音声のカット（トリム）',
    tagline: '音声ファイルを時間範囲で切り出し。',
    description:
      '開始・終了時刻を指定して必要な部分だけを切り出し。MP3・WAV・OGGなど多くの形式に対応し、ブラウザ内で処理します。',
    keywords: ['音声 カット', 'mp3 カット', 'audio cutter', '音声 切り出し', '音声 トリミング'],
  },
  'mic-record': {
    name: 'マイク録音',
    tagline: 'マイクの音声を録音してダウンロード。',
    description:
      'マイクから音声を録音して音声ファイルとして保存。アップロードもインストールも不要、ブラウザで動作します。',
    keywords: ['マイク 録音', 'ボイス レコーダー', 'mic record', '音声 録音', 'ブラウザ 録音'],
  },
  'gif-maker': {
    name: 'GIFメーカー',
    tagline: '画像やクリップからアニメGIFを作成。',
    description:
      '複数の画像や動画クリップからフレーム間隔やサイズを指定してアニメGIFを作成。すべてブラウザ内で処理します。',
    keywords: ['gif 作成', 'gif メーカー', 'gif 作る', 'gif maker', '画像 gif'],
  },

  // ── ユーティリティ / 生成 ─────────────────────────────────────────────────
  'qr-code': {
    name: 'QRコード生成・読み取り',
    tagline: 'テキストやURLからQRを作成、画像からQRを解読。',
    description:
      'テキストやURLからQRコードを生成、または画像をアップロードして既存のQRを解読。すべてブラウザ内で完結します。',
    keywords: ['qr コード 生成', 'qr 読み取り', 'qrコード 作成', 'qr code', 'qr 解読'],
  },
  barcode: {
    name: 'バーコード生成',
    tagline: 'EAN・UPC・Code128・Code39をPNG/SVGで生成。',
    description:
      'EAN-13・UPC・Code128・Code39のバーコードを生成してPNG/SVGでダウンロード。ローカル生成でアップロードなし。',
    keywords: ['バーコード 生成', 'ean バーコード', 'code128', 'upc バーコード', 'barcode'],
  },
  base64: {
    name: 'Base64エンコード / デコード',
    tagline: 'テキストやファイルをローカルでBase64変換。',
    description:
      'テキストやファイルを瞬時にBase64へエンコード・デコード。アップロードもサイズ制限もトラッキングもありません。',
    keywords: ['base64 エンコード', 'base64 デコード', 'base64 変換', 'base64', 'base64 とは'],
  },
  'file-hash': {
    name: 'ファイルハッシュ（MD5/SHA）',
    tagline: '任意のファイルのMD5・SHAチェックサムを計算。',
    description:
      '任意のファイルのMD5・SHA-1・SHA-256・SHA-512チェックサムを計算して整合性を検証。ローカル処理でアップロードなし。',
    keywords: ['ファイル ハッシュ', 'md5 チェックサム', 'sha256 ハッシュ', 'file hash', 'チェックサム 計算'],
  },
  'json-format': {
    name: 'JSONフォーマッター・検証',
    tagline: 'JSONの整形・圧縮・検証をリアルタイムに。',
    description:
      'JSONを整形・圧縮・検証し、エラーをその場で表示。すべてブラウザ内で処理し、データはアップロードされません。',
    keywords: ['json 整形', 'json フォーマッター', 'json 検証', 'json formatter', 'json 圧縮'],
  },
  'color-palette': {
    name: 'カラーパレット生成',
    tagline: 'ベースカラーや画像からパレットを生成・書き出し。',
    description:
      'ベースカラーやアップロードした画像から調和の取れたカラーパレットを生成し、スウォッチを書き出し。ブラウザ内で完結。',
    keywords: ['カラーパレット 生成', '配色', '画像 色 抽出', 'color palette', '色 組み合わせ'],
  },
  'password-gen': {
    name: 'パスワード生成',
    tagline: 'ブラウザのセキュア乱数で強固なパスワードを。',
    description:
      'Web Crypto APIを使い、長さや文字種を指定して強力なランダムパスワードを生成。ブラウザの外には何も出ません。',
    keywords: ['パスワード 生成', '強力 パスワード', 'ランダム パスワード', 'password generator', 'パスワード 作成'],
  },
  'uuid-gen': {
    name: 'UUID生成',
    tagline: 'v4・v7のUUIDを一括生成しワンクリックでコピー。',
    description:
      '暗号学的に安全なv4と時系列順のv7 UUIDを一括生成し、すぐにコピー。完全オフラインで動作します。',
    keywords: ['uuid 生成', 'guid 生成', 'v4 uuid', 'v7 uuid', 'ランダム uuid'],
  },
  'jwt-decoder': {
    name: 'JWTデコーダー',
    tagline: 'JWTのヘッダー・ペイロード・クレームを解析。',
    description:
      'JSON Web Tokenを貼り付けてヘッダー・ペイロード・有効期限を確認。デコードはローカルで行われ、トークンは外部に出ません。',
    keywords: ['jwt デコード', 'jwt 解析', 'json web token', 'jwt decoder', 'jwt パーサー'],
  },
  'unit-converter': {
    name: '単位変換',
    tagline: '長さ・重さ・温度・データ量などを変換。',
    description:
      '長さ・重さ・温度・面積・体積・速度・データ量を瞬時に変換。オフライン対応で、アップロードはありません。',
    keywords: ['単位 変換', '単位 換算', '長さ 変換', '温度 変換', 'unit converter'],
  },
  'base-converter': {
    name: '基数変換（進数変換）',
    tagline: '2進・8進・10進・16進を瞬時に相互変換。',
    description:
      '2・8・10・16進数を相互変換し、ビット表現も確認できます。すべてブラウザ内で動作します。',
    keywords: ['基数 変換', '進数 変換', '2進数 10進数', '16進数 変換', 'base converter'],
  },
  'color-contrast': {
    name: 'カラーコントラストチェッカー',
    tagline: '2色のWCAG AA/AAAコントラスト比を判定。',
    description:
      '前景色と背景色を入力すると、WCAGコントラスト比とAA・AAAの合否を表示。ブラウザのみで動作します。',
    keywords: ['コントラスト チェック', 'wcag コントラスト', 'aa aaa 比', 'color contrast', 'アクセシビリティ 色'],
  },
  'text-hash': {
    name: 'テキストハッシュ生成',
    tagline: '任意テキストのMD5・SHA-1・SHA-256・SHA-512を生成。',
    description:
      'テキストをMD5・SHA-1・SHA-256・SHA-512で瞬時にハッシュ化。すべてブラウザ内のローカル処理です。',
    keywords: ['テキスト ハッシュ', 'md5 生成', 'sha256 ハッシュ', 'text hash', 'sha512'],
  },
  'regex-tester': {
    name: '正規表現テスター',
    tagline: 'マッチをハイライトしながら正規表現をテスト。',
    description:
      'マッチのハイライト、キャプチャグループ、フラグ付きで正規表現を作成・デバッグ。すべてブラウザ内で動作します。',
    keywords: ['正規表現 テスト', 'regex テスター', '正規表現 チェック', 'regex tester', 'regex 確認'],
  },
};

/** IDs that have curated Japanese copy, in insertion order. */
export const JA_TOOL_IDS: string[] = Object.keys(JA_TOOLS);

const JA_TOOL_ID_SET = new Set(JA_TOOL_IDS);

export function getJaCopy(id: string): JaToolCopy | undefined {
  return JA_TOOLS[id];
}

export function hasJaCopy(id: string): boolean {
  return JA_TOOL_ID_SET.has(id);
}

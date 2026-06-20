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

  // ── 拡張（en パリティ 44→194） ──
  'url-encoder': {
    name: 'URL エンコード / デコード',
    tagline: 'URL やクエリ文字列をパーセントエンコード・デコード。',
    description:
      'URL 全体やクエリパラメータをパーセントエンコード（%xx 変換）したり元に戻したりします。日本語などのマルチバイト文字も正しく処理し、結果をすぐにコピーできます。',
    keywords: ['url エンコード', 'url encode', 'パーセントエンコード', 'url デコード', 'url decode', 'クエリ文字列 変換'],
  },
  'color-converter': {
    name: 'カラーコード変換 (HEX / RGB / HSL)',
    tagline: 'HEX・RGB・HSL・HSV を相互変換し、色をプレビュー。',
    description:
      'カラーコードを HEX・RGB・HSL・HSV 形式で相互に変換し、実際の色をスウォッチで確認できます。Web デザインや CSS の色指定に便利です。',
    keywords: ['カラーコード 変換', 'color converter', 'hex rgb 変換', 'rgb to hex', '16進数 カラー', 'css 色 変換'],
  },
  'lorem-ipsum': {
    name: 'ダミーテキスト生成 (Lorem Ipsum)',
    tagline: '段落・文・単語単位でダミーテキストを生成。',
    description:
      'モックアップやレイアウト確認用の Lorem Ipsum ダミーテキストを、段落・文・単語の単位で必要なだけ生成し、ワンクリックでコピーできます。',
    keywords: ['ダミーテキスト', 'lorem ipsum', 'ロレムイプサム', 'ダミー文章 生成', 'placeholder text', 'サンプルテキスト'],
  },
  'timestamp-converter': {
    name: 'UNIXタイムスタンプ変換',
    tagline: 'UNIX時間と日付を相互変換、タイムゾーンも対応。',
    description:
      'エポック秒・ミリ秒を読みやすい日付に、また日付を UNIX タイムスタンプに変換します。タイムゾーンを指定して双方向に即座に変換できます。',
    keywords: ['unixタイム 変換', 'unix timestamp', 'エポック 変換', 'epoch converter', 'タイムスタンプ 日付', 'unix時間'],
  },
  'text-diff': {
    name: 'テキスト差分チェッカー',
    tagline: '2つのテキストを比較し、差分をハイライト。',
    description:
      '2つの文章やコードを左右に並べて比較し、追加・削除・変更された行を色分けで表示します。原稿やソースの変更点をひと目で確認できます。',
    keywords: ['テキスト 差分', 'text diff', 'diff チェッカー', '文章 比較', 'コード 比較', '差分 比較'],
  },
  'text-count': {
    name: '文字数・単語数カウント',
    tagline: '文字数・単語数・文・読了時間をリアルタイム計測。',
    description:
      '入力に合わせて文字数・単語数・文・段落数、推定読了時間をリアルタイムに表示します。原稿の文字数チェックやSNS投稿の確認に便利です。',
    keywords: ['文字数 カウント', 'word counter', '文字数 カウンター', 'character count', '単語数 数える', '文字カウント'],
  },
  'sql-format': {
    name: 'SQL フォーマッター',
    tagline: 'SQLクエリを整形・標準化、各種方言に対応。',
    description:
      '読みにくいSQLクエリをワンクリックで美しく整形し、インデントやキーワードの大文字小文字を統一します。主要なデータベース方言に対応します。',
    keywords: ['sql 整形', 'sql formatter', 'sql フォーマット', 'format sql', 'sql 見やすく', 'クエリ 整形'],
  },
  'cron-explainer': {
    name: 'cron 式の解説ツール',
    tagline: 'cron スケジュールを自然な日本語で説明。',
    description:
      'cron 式を貼り付けると、いつ実行されるかを分かりやすい日本語で説明し、次回以降の実行日時も表示します。crontab の設定確認に便利です。',
    keywords: ['cron 式', 'cron expression', 'crontab 解説', 'cron 確認', 'cron スケジュール', 'クーロン 設定'],
  },
  'html-entities': {
    name: 'HTML エンティティ エンコード / デコード',
    tagline: '特殊文字を HTML エンティティに相互変換。',
    description:
      '< > & などの特殊文字を HTML エンティティに変換、または元に戻します。表示崩れやインジェクションを防ぎ、安全にHTMLへ埋め込めます。',
    keywords: ['html エンティティ', 'html entities', 'html エスケープ', 'html encode', '特殊文字 変換', '実体参照'],
  },
  jsonpath: {
    name: 'JSONPath テスター',
    tagline: 'JSONPath 式を JSON に対して評価して確認。',
    description:
      'JSON データに対して JSONPath 式を入力すると、マッチする要素を即座に抽出して表示します。API レスポンスの値抽出やデバッグに便利です。',
    keywords: ['jsonpath テスター', 'jsonpath tester', 'json 抽出', 'jsonpath 評価', 'json クエリ', 'jsonpath online'],
  },
  'json-xml': {
    name: 'JSON ⇄ XML 変換',
    tagline: 'JSON と XML を双方向に変換。',
    description:
      'JSON を XML に、XML を JSON に整形付きで相互変換します。設定ファイルや API データの形式変換にすぐ使えます。',
    keywords: ['json xml 変換', 'json to xml', 'xml to json', 'json xml converter', 'xml 変換', 'データ形式 変換'],
  },
  'md-table': {
    name: 'Markdown テーブル生成',
    tagline: '表をビジュアルに編集して Markdown を出力。',
    description:
      'セルを直接編集できる表エディタで Markdown テーブルを作成し、整ったソースをコピーできます。GitHub や Notion の表作成に便利です。',
    keywords: ['markdown テーブル', 'markdown table', 'md 表 作成', 'マークダウン 表', 'table generator', '表 markdown'],
  },
  'text-case': {
    name: 'テキスト大文字小文字変換',
    tagline: '大文字・小文字・キャメル・スネークなどに変換。',
    description:
      'テキストを UPPERCASE・lowercase・Title Case・Sentence case・camelCase・snake_case・kebab-case に即座に変換します。変数名や見出しの整形に便利です。',
    keywords: ['大文字 小文字 変換', 'text case', 'キャメルケース 変換', 'camelcase converter', 'スネークケース', 'case 変換'],
  },
  'text-sort': {
    name: '行の並べ替え・重複削除',
    tagline: '行をソート・反転・シャッフル・重複除去。',
    description:
      'テキストの行をアルファベット順・数値順に並べ替え、反転やシャッフル、重複行の削除ができます。リストの整理や整形に便利です。',
    keywords: ['行 並べ替え', 'sort lines', '行 ソート', '重複行 削除', 'remove duplicate lines', 'リスト 並び替え'],
  },
  percentage: {
    name: 'パーセント計算機',
    tagline: '割合・増減率・差分のパーセントを計算。',
    description:
      'ある数値に対する割合、パーセントの増減、2つの値の差分の割合などを、簡単な入力で計算します。日常の計算や割引計算に便利です。',
    keywords: ['パーセント 計算', 'percentage calculator', '割合 計算', '百分率 計算', 'percent calculator', '増減率 計算'],
  },
  'file-encrypt': {
    name: 'ファイル暗号化 (AES)',
    tagline: 'AES でファイルをパスワード暗号化・復号。',
    description:
      'Web Crypto API を使い、AES-GCM とパスフレーズで任意のファイルを暗号化・復号します。ファイルにパスワードを掛けて安全に共有できます。',
    keywords: ['ファイル 暗号化', 'encrypt file', 'aes 暗号化', 'ファイル パスワード', 'file encryption', 'ファイル 復号'],
  },
  'text-encrypt': {
    name: 'テキスト暗号化 (AES)',
    tagline: 'パスフレーズでテキストを暗号化・復号。',
    description:
      'AES-GCM とパスフレーズでテキストを暗号化・復号します。秘密のメッセージを安全にやり取りでき、相手はパスワードで元に戻せます。',
    keywords: ['テキスト 暗号化', 'encrypt text', '文章 暗号化', 'aes テキスト', 'メッセージ 暗号化', 'text encryption'],
  },
  totp: {
    name: 'TOTP / 二段階認証コード生成',
    tagline: 'シークレットから時間ベースのワンタイムコードを生成。',
    description:
      'シークレットキーから TOTP（二段階認証）コードを生成し、残り時間のカウントダウンを表示します。認証アプリの代わりに6桁コードを確認できます。',
    keywords: ['totp 生成', 'totp generator', '二段階認証 コード', '2fa code', 'ワンタイムパスワード', 'authenticator コード'],
  },
  'rsa-keypair': {
    name: 'RSA 鍵ペア生成',
    tagline: 'RSA の公開鍵・秘密鍵ペアをブラウザで生成。',
    description:
      'Web Crypto API を使い、RSA の公開鍵・秘密鍵ペア（PEM 形式）を生成します。署名や暗号化に使う鍵をすぐに用意できます。',
    keywords: ['rsa 鍵 生成', 'rsa key generator', '公開鍵 秘密鍵', 'rsa keypair', 'pem 生成', 'rsa 鍵ペア'],
  },
  'pdf-to-word': {
    name: 'PDF を Word に変換',
    tagline: 'PDF を編集可能な Word 文書に変換。',
    description:
      'PDF を編集できる Word（DOCX）文書に変換します。テキストを抽出して再利用でき、報告書や資料の編集に便利です。',
    keywords: ['pdf word 変換', 'pdf to word', 'pdf docx 変換', 'pdf ワード 変換', 'pdf 編集', 'convert pdf to word'],
  },
  'pdf-watermark': {
    name: 'PDF に透かしを追加',
    tagline: 'PDF 全ページにテキスト・画像の透かしを挿入。',
    description:
      'PDF の各ページにテキストやロゴ画像の透かし（ウォーターマーク）を追加します。透明度や位置を調整でき、文書の保護に役立ちます。',
    keywords: ['pdf 透かし', 'pdf watermark', 'pdf ウォーターマーク', '透かし 追加 pdf', 'pdf ロゴ', 'watermark pdf'],
  },
  'image-watermark': {
    name: '画像に透かしを追加',
    tagline: '画像にテキストやロゴの透かしを重ねる。',
    description:
      '画像にテキストやロゴ画像の透かしを重ねて入れられます。透明度・サイズ・位置を調整でき、写真や作品の無断使用防止に役立ちます。',
    keywords: ['画像 透かし', 'image watermark', '写真 ウォーターマーク', '透かし 画像', 'ロゴ 透かし', 'watermark image'],
  },
  'image-svg-to-png': {
    name: 'SVG を PNG に変換',
    tagline: 'SVG を任意のサイズで PNG にラスタライズ。',
    description:
      'SVG ベクター画像を指定した解像度で PNG ラスター画像に変換します。透過にも対応し、アイコンやロゴの書き出しに便利です。',
    keywords: ['svg png 変換', 'svg to png', 'svg 変換', 'ベクター png', 'svg ラスタライズ', 'convert svg'],
  },
  'image-batch-compress': {
    name: '画像を一括圧縮',
    tagline: '複数の画像をまとめて軽量化。',
    description:
      'JPG・PNG・WebP 画像を一括で圧縮してファイルサイズを削減し、品質も調整できます。まとめて ZIP でダウンロードできます。',
    keywords: ['画像 圧縮', 'image compress', '画像 一括 圧縮', 'batch compress', '画像 軽量化', '写真 サイズ 縮小'],
  },
  'csv-json': {
    name: 'CSV ⇄ JSON 変換',
    tagline: 'CSV と JSON を相互変換、ヘッダー指定も対応。',
    description:
      'CSV データを JSON に、JSON を CSV に変換します。区切り文字やヘッダーの有無を指定でき、データ加工や取り込みに便利です。',
    keywords: ['csv json 変換', 'csv to json', 'json to csv', 'csv json converter', 'csv 変換', 'json csv 変換'],
  },
  'yaml-json': {
    name: 'YAML ⇄ JSON 変換',
    tagline: 'YAML と JSON を双方向に変換。',
    description:
      'YAML を JSON に、JSON を YAML に検証・整形付きで相互変換します。設定ファイルの形式変換に便利です。',
    keywords: ['yaml json 変換', 'yaml to json', 'json to yaml', 'yaml json converter', 'yaml 変換', '設定ファイル 変換'],
  },
  'docx-to-pdf': {
    name: 'Word (DOCX) を PDF に変換',
    tagline: 'Word 文書をレイアウトを保ったまま PDF 化。',
    description:
      'Word の DOCX 文書を、レイアウトを保ったまま PDF ファイルに変換します。配布や印刷用にレイアウトを固定できます。',
    keywords: ['word pdf 変換', 'docx to pdf', 'word to pdf', 'ワード pdf 変換', 'docx pdf', 'doc pdf 変換'],
  },
  'epub-to-pdf': {
    name: 'EPUB を PDF に変換',
    tagline: 'EPUB 電子書籍を PDF ファイルに変換。',
    description:
      'EPUB 形式の電子書籍をページ分割された PDF に変換します。印刷や保存・アーカイブに適しています。',
    keywords: ['epub pdf 変換', 'epub to pdf', '電子書籍 pdf', 'ebook pdf 変換', 'epub 変換', 'イーパブ pdf'],
  },
  'video-to-audio': {
    name: '動画から音声を抽出 (MP3)',
    tagline: '動画の音声トラックを MP3 として抽出。',
    description:
      '動画から音声トラックを取り出し、MP3 などの形式で保存します。ブラウザ内の FFmpeg で処理し、講義や音楽の音声化に便利です。',
    keywords: ['動画 音声 抽出', 'video to audio', '動画 mp3 変換', 'video to mp3', 'mp4 mp3 変換', '音声 抽出'],
  },
  ocr: {
    name: '画像から文字認識 (OCR)',
    tagline: '画像やスキャン文書からテキストを抽出。',
    description:
      'Tesseract OCR（日本語・英語対応）で画像やスキャン文書から文字を認識・抽出します。書類や写真のテキスト化に便利です。',
    keywords: ['画像 文字認識', 'ocr', '画像 テキスト 抽出', 'image to text', '文字 抽出 画像', 'ocr 日本語'],
  },
  'vat-calc': {
    name: '消費税・付加価値税 計算機',
    tagline: '任意の税率で金額に消費税を加算、または総額から税額を抽出。',
    description:
      '税抜金額に消費税を加算したり、税込総額から税額を逆算したり、任意の税率を設定してブラウザ上で即座に計算します。',
    keywords: ['消費税計算', '付加価値税', 'VAT計算', '税込計算', '税抜計算', 'tax calculator', 'VAT'],
  },
  'seal-stamp': {
    name: '丸印・社判ジェネレーター',
    tagline: '会社名やイニシャルから丸い社判・ハンコを透過PNGで作成。',
    description:
      '会社名やイニシャルから丸い印鑑・社判を生成し、書類や署名用に透過PNGとしてダウンロードできます。すべてブラウザ内で処理。',
    keywords: ['印鑑作成', '社判', '丸印', 'ハンコ', '電子印鑑', 'stamp generator', 'seal maker'],
  },
  'vcard-qr': {
    name: 'vCard QRコード ジェネレーター',
    tagline: '連絡先情報を読み取り可能なvCard QRコードに変換。',
    description:
      '名前・電話・メール・会社名からvCard QRコードを作成。読み取るだけで連絡先を即登録できます。名刺やメール署名に最適。',
    keywords: ['vCard QRコード', '連絡先QR', '名刺QR', 'QR名刺', 'vCard作成', 'contact qr', 'business card qr'],
  },
  'id-photo': {
    name: '証明写真リサイザー（パスポート・各種ID）',
    tagline: 'パスポートやID規格に合わせて写真を切り抜き・リサイズ。',
    description:
      'パスポート・ビザ・各種ID規格に合わせて写真を印刷品質（300dpi）で切り抜き・リサイズし、背景色も設定できます。すべてブラウザ内で処理。',
    keywords: ['証明写真', 'パスポート写真', 'ID写真', 'ビザ写真', '履歴書写真', 'passport photo', 'id photo'],
  },
  redact: {
    name: '個人情報マスキング（黒塗り）',
    tagline: 'メール・カード番号・電話番号を自動検出してマスク。',
    description:
      '貼り付けたテキストからメール・カード番号・電話番号・IDを自動検出し、共有やスクショ前に墨消し（黒塗り）します。ローカルで処理。',
    keywords: ['黒塗り', '墨消し', '個人情報マスキング', '機密情報', '情報秘匿', 'redact', 'mask sensitive data'],
  },
  'excel-formula': {
    name: 'Excel数式ジェネレーター・解説',
    tagline: 'VLOOKUPやSUMIFSの数式を作成、または数式を解説。',
    description:
      'VLOOKUP・SUMIFS・IFERRORなどよく使うExcel数式を穴埋めで生成。逆に数式を貼り付けると各関数を分かりやすく解説します。',
    keywords: ['Excel数式', '関数生成', 'VLOOKUP', 'SUMIFS', '数式解説', 'excel formula', '関数の使い方'],
  },
  'scan-to-pdf': {
    name: 'スキャンしてPDF化（写真をPDFに）',
    tagline: '書類の写真を1つのきれいなPDFに変換。',
    description:
      '書類を撮影した写真をコントラスト補正しながら1つのきれいなPDFにまとめます。ブラウザ内のスキャナーアプリ。アップロード不要。',
    keywords: ['スキャンPDF', '写真をPDF', '書類スキャン', '画像PDF化', 'scan to pdf', 'document scanner', 'JPEG to PDF'],
  },
  'pdf-to-excel': {
    name: 'PDFの表をExcelに変換',
    tagline: 'PDFの表をxlsxやCSVに抽出。',
    description:
      'テキストベースのPDFから行と列を検出して表をExcel（xlsx）やCSVに抽出します。すべてブラウザ内で処理し、アップロードしません。',
    keywords: ['PDFをExcel', 'PDF表抽出', 'PDFをxlsx', 'PDFをCSV', 'pdf to excel', '表変換', 'テーブル抽出'],
  },
  'html-to-pdf': {
    name: 'HTMLをPDFに変換',
    tagline: 'CSSや画像を含むHTMLコードをPDFに変換。',
    description:
      'HTMLマークアップをCSSスタイルやインライン画像つきでPDFに変換します。すべてブラウザ内でレンダリングし、アップロードしません。',
    keywords: ['HTMLをPDF', 'HTML PDF変換', 'WebページをPDF', 'コードをPDF', 'html to pdf', 'ウェブページ保存'],
  },
  'pdf-background': {
    name: 'PDFに背景を追加',
    tagline: '全ページの背面に色や画像を敷く。',
    description:
      'PDFの全ページに背景色や背景画像を追加し、透かしやレターヘッド風に仕上げます。ローカルで処理、アップロードなし。',
    keywords: ['PDF背景', '背景追加', 'PDF透かし背景', 'レターヘッド', 'pdf background', 'ページ背景'],
  },
  'pdf-bookmarks': {
    name: 'PDFブックマーク ビューア',
    tagline: 'アウトラインツリーを表示しMarkdownに書き出し。',
    description:
      'PDFのブックマーク（しおり・アウトライン）ツリーを表示し、Markdownとして書き出せます。目次をブラウザ上でひと目で確認。',
    keywords: ['PDFブックマーク', 'PDFアウトライン', 'PDF目次', 'しおり表示', 'pdf bookmarks', 'pdf outline'],
  },
  'pdf-compare': {
    name: 'PDFテキスト比較',
    tagline: '2つのPDFを行単位で差分表示。',
    description:
      '2つのPDFからテキストを抽出し、追加・削除・変更された行をハイライトします。文書向けのテキスト差分ツール。すべてブラウザ内で処理。',
    keywords: ['PDF比較', 'PDF差分', 'PDFテキスト比較', '2つのPDF比較', 'compare pdf', 'pdf diff'],
  },
  'pdf-crop': {
    name: 'PDF余白をトリミング',
    tagline: 'ページボックスを切り詰めて白い余白を除去。',
    description:
      'PDFのページボックスをトリミングして不要な余白や白い部分を取り除き、読みやすく印刷しやすいページにします。ローカルで処理。',
    keywords: ['PDFトリミング', 'PDF余白', 'PDF切り抜き', '余白除去', 'crop pdf', 'pdf margins'],
  },
  'pdf-flatten': {
    name: 'PDFをフラット化',
    tagline: 'フォーム項目を固定し注釈を除去して印刷向けに。',
    description:
      'フォームの入力値をページに焼き込み、注釈やリンクを除去して印刷・配布用にPDFを確定します。編集可能な項目をフラット化。アップロードなし。',
    keywords: ['PDFフラット化', 'フォーム固定', 'PDF項目ロック', 'PDF確定', 'flatten pdf', '印刷用PDF'],
  },
  'pdf-form-fill': {
    name: 'PDFフォーム入力',
    tagline: 'AcroFormのテキスト・チェック・ドロップダウンを入力。',
    description:
      'PDFのAcroFormのテキスト・チェックボックス・ラジオ・ドロップダウン項目を入力して保存できます。すべてブラウザ内で処理、アップロードなし。',
    keywords: ['PDFフォーム入力', 'PDFフォーム記入', 'AcroForm', 'フォーム填写', 'fill pdf form', 'pdf form filler'],
  },
  'pdf-image-extract': {
    name: 'PDFから画像を抽出',
    tagline: '埋め込み画像をPNGとしてZIPで取り出し。',
    description:
      'PDFのページに埋め込まれた画像を抽出し、PNGとしてZIPでダウンロードします。すべてローカルで処理、アップロードなし。',
    keywords: ['PDF画像抽出', 'PDF画像取り出し', 'PDFを画像に', '画像保存', 'extract images from pdf', 'pdf image extractor'],
  },
  'pdf-insert': {
    name: 'PDFにページを挿入',
    tagline: '別のPDFのページを任意の位置に挿入。',
    description:
      '別のPDFのページを先頭・末尾・指定ページの後に挿入できます。必要な部分だけ選んで結合。すべてブラウザ内で処理。',
    keywords: ['PDFページ挿入', 'PDFにページ追加', '位置指定結合', 'PDF挿入', 'insert pdf pages', 'pdf insert'],
  },
  'pdf-linearize': {
    name: 'PDFをWeb向けに最適化',
    tagline: '重複オブジェクトを除去し圧縮を再構築。',
    description:
      '重複オブジェクトを除去し圧縮ストリームを再構築して、小さくWeb表示に適したPDFに整理します。ローカルで処理。',
    keywords: ['PDF最適化', 'PDFリニアライズ', 'PDF軽量化', 'Web最適化PDF', 'optimize pdf', 'linearize pdf'],
  },
  'pdf-metadata': {
    name: 'PDFメタデータ編集',
    tagline: 'タイトル・作成者・サブタイトル・キーワードを変更。',
    description:
      'PDFのタイトル・作成者・サブタイトル・キーワードといったメタデータをブラウザ上で編集します。共有前に文書プロパティを整えられます。アップロードなし。',
    keywords: ['PDFメタデータ', 'PDFプロパティ編集', 'PDF作成者変更', 'PDFタイトル編集', 'pdf metadata', '文書情報'],
  },
  'pdf-nup': {
    name: 'PDF集約（1枚に複数ページ）',
    tagline: '2/4/6/9ページを1枚にまとめて配置。',
    description:
      '2・4・6・9ページのPDFを1枚のシートにまとめて配置し、コンパクトな印刷や校正用シートを作成します。すべてブラウザ内で処理。',
    keywords: ['PDF集約印刷', 'Nアップ', '1枚に複数ページ', 'ページ割付', 'pdf n-up', 'pages per sheet'],
  },
  'pdf-page-numbers': {
    name: 'PDFにページ番号を追加',
    tagline: '文書全体にページ番号を打刻。',
    description:
      'PDFの全ページに位置や書式を選んでページ番号を追加します。ローカルで処理、アップロードなし。',
    keywords: ['PDFページ番号', 'ページ番号追加', 'ノンブル', 'ページ付け', 'add page numbers to pdf', 'pdf pagination'],
  },
  'pdf-previews': {
    name: 'PDFページをPNGに',
    tagline: '全ページをPNG/JPGに変換してZIPで保存。',
    description:
      'PDFの全ページをPNGまたはJPG画像にレンダリングし、ZIPでダウンロードします。サムネイルやプレビュー作成に最適。すべてローカル処理。',
    keywords: ['PDFをPNG', 'PDFを画像に', 'PDFサムネイル', 'ページ画像化', 'pdf to png', 'pdf thumbnails'],
  },
  'pdf-repair': {
    name: 'PDF修復',
    tagline: '破損したPDFを2段階で復旧。',
    description:
      '構造の復元とラスター再構築のフォールバックで破損したPDFを復旧します。開けないファイルを修復。すべてブラウザ内で処理。',
    keywords: ['PDF修復', '破損PDF復旧', 'PDF復元', 'PDF修復ツール', 'repair pdf', 'fix corrupted pdf'],
  },
  'pdf-search': {
    name: '複数PDFをまとめて検索',
    tagline: '多数のPDFを横断してキーワードを一括検索。',
    description:
      '複数のPDFを横断してキーワードを一括検索し、各ヒットを前後の文脈つきで表示します。目的の文書をすばやく発見。すべてローカル処理。',
    keywords: ['PDF検索', '複数PDF検索', 'PDFキーワード検索', 'PDF全文検索', 'search pdf', 'find text in pdf'],
  },
  'pdf-sign': {
    name: 'PDFに署名',
    tagline: '手書きサインを描いてPDFに配置。',
    description:
      'マウスやタッチでサインを描き、PDFの好きな位置に配置できます。ブラウザ上で書類に署名、アップロードなし。',
    keywords: ['PDF署名', 'PDFサイン', '電子署名PDF', '署名追加', 'sign pdf', 'pdf signature'],
  },
  'pdf-stats': {
    name: 'PDF統計情報',
    tagline: 'ページ・単語・フォント・メタデータを分析。',
    description:
      'PDFのページ数、単語・文字数、フォント、アウトライン、メタデータを分析します。文書の総合レポートをすべてブラウザ内で作成。',
    keywords: ['PDF統計', 'PDF文字数', 'PDF分析', 'PDF情報', 'pdf statistics', 'pdf word count'],
  },
  'pdf-to-epub': {
    name: 'PDFをEPUBに変換',
    tagline: 'PDFをリフロー対応のEPUB電子書籍に変換。',
    description:
      'PDFのテキストを章立てされたEPUBに抽出し、スマホや電子書籍リーダーで自動リフローできるようにします。ブラウザ内で変換、アップロードなし。',
    keywords: ['PDFをEPUB', 'PDF EPUB変換', 'PDFを電子書籍', '電子書籍化', 'pdf to epub', 'リフロー'],
  },
  'pdf-to-html': {
    name: 'PDFをHTMLに変換',
    tagline: 'PDFを構造化されたHTMLページに変換。',
    description:
      'PDFのテキストを見出しや段落の構造を持つHTMLページに変換します。すべてブラウザ内で処理。',
    keywords: ['PDFをHTML', 'PDF HTML変換', 'PDFをWebページ', 'html変換', 'pdf to html', 'ウェブページ化'],
  },
  'pdf-to-md': {
    name: 'PDFをMarkdownに変換',
    tagline: 'PDFを構造化されたMarkdownに変換。',
    description:
      'フォントサイズから# / ## / ###の見出しを推定し、PDFをMarkdownに変換します。ノートやドキュメント作成に最適。すべてブラウザ内で処理。',
    keywords: ['PDFをMarkdown', 'PDF md変換', 'PDFをテキスト', 'マークダウン変換', 'pdf to markdown', 'pdf md'],
  },
  'pdf-to-txt': {
    name: 'PDFをテキストに変換',
    tagline: 'PDFのテキストをプレーンな.txtファイルに抽出。',
    description:
      'PDFからすべてのテキストを抽出し、プレーンテキストファイルとして保存します。コピーや再利用がすばやく、ローカル処理でアップロードなし。',
    keywords: ['PDFをテキスト', 'PDFをtxt', 'PDFテキスト抽出', 'テキスト変換', 'pdf to text', 'pdf to txt'],
  },
  'pdf-visual-diff': {
    name: 'PDF画像比較',
    tagline: 'ページをピクセル単位で比較。',
    description:
      '2つのPDFの同じページをピクセル単位で比較し、視覚的な差分をハイライト表示。レイアウトの変更を検出でき、すべてブラウザ内で処理します。',
    keywords: ['PDF差分', 'PDF比較', 'ページ比較', 'ピクセル比較', 'visual diff', 'PDF visual compare'],
  },
  'blur-face': {
    name: '顔ぼかし・ナンバープレート隠し',
    tagline: '顔を自動検出してぼかしやモザイクで隠す。',
    description:
      'AIで顔を自動検出し、ぼかし・モザイク・絵文字・黒帯で隠せます。フォルダ一括処理、反転・プレートモードにも対応。すべてローカル処理です。',
    keywords: ['顔ぼかし', '顔モザイク', '匿名化', 'ナンバープレート', 'blur face', 'プライバシー保護'],
  },
  'image-ascii-art': {
    name: '画像→アスキーアート変換',
    tagline: '写真を文字でできたアートに。',
    description:
      '画像を文字で構成したアスキーアートに変換し、TXTまたはPNGで書き出せます。レトロで楽しいエフェクトをすべてブラウザ内で実現します。',
    keywords: ['アスキーアート', 'ASCII art', '画像変換', 'テキストアート', 'レトロ', '写真変換'],
  },
  'image-batch-watermark': {
    name: '画像一括ウォーターマーク',
    tagline: '複数の写真に一度で透かしを追加。',
    description:
      '同じテキストやロゴの透かしを複数の画像に一括で追加し、まとめてダウンロード。写真セット全体をブラウザ内で保護できます。',
    keywords: ['ウォーターマーク', '透かし', '一括処理', 'ロゴ追加', 'batch watermark', '画像保護'],
  },
  'image-collage': {
    name: '画像コラージュメーカー',
    tagline: '複数の画像を1枚のグリッドに。',
    description:
      '複数の画像をグリッド状に配置し、1枚のJPGコラージュとして書き出せます。手軽なフォトグリッドをすべてブラウザ内で作成します。',
    keywords: ['コラージュ', 'collage', '画像結合', 'フォトグリッド', '写真合成', '画像並べ'],
  },
  'image-color-adjust': {
    name: '画像の色調整',
    tagline: '明るさ・コントラスト・彩度などをリアルタイムに。',
    description:
      '明るさ・コントラスト・彩度・色相・ぼかし・セピア・反転をライブプレビューで調整。手軽な写真補正をブラウザ内で行えます。',
    keywords: ['色調整', '明るさ', 'コントラスト', '彩度', '写真補正', 'color adjust'],
  },
  'image-denoise': {
    name: '画像ノイズ除去',
    tagline: 'メディアンフィルタでざらつきを軽減。',
    description:
      'メディアンフィルタで写真のノイズやざらつきを軽減し、よりクリアな画像に仕上げます。すべてブラウザ内で処理します。',
    keywords: ['ノイズ除去', 'denoise', 'ざらつき軽減', '画像補正', 'メディアンフィルタ', '写真クリーンアップ'],
  },
  'image-diff': {
    name: '画像の差分比較',
    tagline: '2枚の画像のピクセル差をハイライト。',
    description:
      '2枚の画像をピクセル単位で比較し、差分を赤くマーク。編集や変更箇所をすべてブラウザ内で見つけられます。',
    keywords: ['画像差分', 'image diff', '画像比較', 'ピクセル比較', '間違い探し', '変更検出'],
  },
  'image-exif-batch': {
    name: 'EXIF一括削除',
    tagline: '複数写真のGPS・カメラ情報をまとめて消去。',
    description:
      '複数の写真からGPS位置情報やカメラのEXIFデータを一括で削除してから共有。プライバシーを守れ、すべてローカル処理です。',
    keywords: ['EXIF削除', '一括削除', 'GPS削除', 'メタデータ消去', 'プライバシー', 'batch exif'],
  },
  'image-exif-strip': {
    name: 'EXIFデータ削除',
    tagline: '写真から位置・カメラ情報を消去。',
    description:
      '投稿前に写真からGPSやカメラのEXIFメタデータを削除し、プライバシーを保護。ローカル処理でアップロードはありません。',
    keywords: ['EXIF削除', 'メタデータ削除', 'GPS削除', 'プライバシー保護', 'strip exif', '写真情報消去'],
  },
  'image-exif-view': {
    name: 'EXIFビューア',
    tagline: '写真のカメラ・GPS・撮影情報を確認。',
    description:
      '写真のEXIFメタデータ（カメラ機種・設定・GPS位置・撮影日時）をブラウザ内で確認できます。',
    keywords: ['EXIFビューア', 'メタデータ確認', '撮影情報', 'GPS確認', 'exif viewer', '写真情報'],
  },
  'image-pixelate': {
    name: 'モザイク・ピクセル化',
    tagline: '画像全体または一部にモザイク。',
    description:
      '画像全体または選択した範囲にモザイク・ピクセル化エフェクトを適用し、機密部分を隠せます。すべてブラウザ内で処理します。',
    keywords: ['モザイク', 'ピクセル化', 'pixelate', '目隠し', '一部ぼかし', '画像検閲'],
  },
  'image-slideshow': {
    name: '画像→スライドショー動画',
    tagline: '写真をMP4スライドショーに。',
    description:
      '複数の画像を表示時間を調整しながらMP4スライドショー動画に変換。写真リールをブラウザ内で作成して共有できます。',
    keywords: ['スライドショー', '画像動画化', 'slideshow', '写真→動画', 'MP4変換', '画像まとめ'],
  },
  'gif-crop': {
    name: 'GIFトリミング',
    tagline: 'アニメーションGIFを範囲で切り抜き。',
    description:
      'アニメーションGIFを全フレームにわたって指定した範囲に切り抜けます。必要な部分だけ残せ、すべてブラウザ内で処理します。',
    keywords: ['GIF切り抜き', 'GIFトリミング', 'crop gif', 'GIF編集', '範囲切り抜き', 'アニメGIF'],
  },
  'gif-effects': {
    name: 'GIFエフェクト',
    tagline: 'GIFを逆再生・速度変更・ピンポン。',
    description:
      'アニメーションGIFに逆再生・速度変更・ピンポンループのエフェクトを適用。楽しいループをすべてブラウザ内で作成します。',
    keywords: ['GIFエフェクト', '逆再生', '速度変更', 'ピンポン', 'gif effects', 'ループGIF'],
  },
  'gif-optimize': {
    name: 'GIF最適化',
    tagline: 'パレットとフレーム間引きで軽量化。',
    description:
      'パレットの最適化やフレームの間引きでGIFのファイルサイズを削減。なめらかに再生できる軽量ループに。すべてローカル処理です。',
    keywords: ['GIF最適化', 'GIF圧縮', 'サイズ削減', '軽量化', 'optimize gif', 'GIF軽量化'],
  },
  'gif-resize': {
    name: 'GIFリサイズ',
    tagline: 'ループを保ったままサイズ変更。',
    description:
      'アニメーションGIFをアスペクト比固定の有無を選んで新しいサイズに変更し、ファイルサイズも縮小。すべてブラウザ内で処理します。',
    keywords: ['GIFリサイズ', 'サイズ変更', 'resize gif', '拡大縮小', 'GIF寸法', 'アニメGIF'],
  },
  'gif-text': {
    name: 'GIFにテキスト追加',
    tagline: 'アニメーションGIFに字幕を入れる。',
    description:
      'アニメーションGIF全体に表示されるテキストや字幕を追加。ミーム用キャプションやラベルをすべてブラウザ内で描画します。',
    keywords: ['GIFテキスト', '字幕追加', 'キャプション', 'gif text', 'ミーム', 'GIF文字入れ'],
  },
  'gif-trim': {
    name: 'GIFトリム',
    tagline: 'アニメーションGIFを時間範囲でカット。',
    description:
      'アニメーションGIFを開始・終了時間で切り取り、その範囲だけ保存。不要なフレームを削除でき、すべてブラウザ内で処理します。',
    keywords: ['GIFトリム', 'GIFカット', 'trim gif', '時間カット', 'GIF短縮', 'フレーム削除'],
  },
  'audio-compress': {
    name: 'オーディオ圧縮',
    tagline: 'ビットレートを下げて音声ファイルを軽量化。',
    description:
      'ブラウザ内FFmpegでビットレートを下げ、音声ファイルのサイズを削減。共有用に軽量化でき、アップロードはありません。',
    keywords: ['オーディオ圧縮', '音声圧縮', 'ビットレート', 'MP3圧縮', 'サイズ削減', 'audio compress'],
  },
  'audio-fade': {
    name: 'オーディオ フェードイン・アウト',
    tagline: '始まりと終わりに滑らかなフェードを追加。',
    description:
      '音声トラックの開始と終了に滑らかなフェードイン・フェードアウトを追加。洗練されたイントロ・アウトロをブラウザ内で作成します。',
    keywords: ['フェード', 'フェードイン', 'フェードアウト', 'audio fade', '音声編集', 'MP3フェード'],
  },
  'audio-merge': {
    name: 'オーディオ結合',
    tagline: '音声ファイルを順番にクロスフェードで連結。',
    description:
      '複数の音声ファイルを指定した順に1つへ結合し、クロスフェードも任意で追加。トラックやクリップをブラウザ内で連結します。',
    keywords: ['オーディオ結合', '音声結合', 'merge audio', 'MP3結合', '連結', 'クロスフェード'],
  },
  'audio-silence-trim': {
    name: '無音自動カット',
    tagline: '無音部分を自動で削除。',
    description:
      '音声中の無音部分を自動検出してカットし、テンポの良い録音に。ボイスやポッドキャストをブラウザ内できれいに整えます。',
    keywords: ['無音カット', '無音削除', 'silence trim', '音声整理', 'ポッドキャスト', '自動カット'],
  },
  'audio-speed': {
    name: 'オーディオ速度変更',
    tagline: '音程を保ったまま0.25〜4倍速。',
    description:
      '音程を保持したまま（atempoフィルタ）再生速度を0.25倍〜4倍に変更。速くも遅くもでき、すべてブラウザ内で処理します。',
    keywords: ['速度変更', '再生速度', '音声速度', 'audio speed', 'テンポ', '倍速'],
  },
  'audio-volume': {
    name: 'オーディオ音量調整',
    tagline: 'dBで増減またはLUFSで音量正規化。',
    description:
      '音量をdB単位で上げ下げ、またはLUFS目標値にラウドネスを正規化。一定した音量レベルをすべてブラウザ内で実現します。',
    keywords: ['音量調整', '音量正規化', 'LUFS', 'audio volume', 'ラウドネス', '音量アップ'],
  },
  'video-audio-replace': {
    name: '動画の音声差し替え',
    tagline: '動画の音声トラックを差し替え・ミックス。',
    description:
      '動画の音声トラックを別の音源に差し替え、またはミックスできます。サウンドトラックの変更をすべてブラウザ内で行えます。',
    keywords: ['音声差し替え', '音声置換', 'BGM追加', 'audio replace', '動画編集', 'サウンド変更'],
  },
  'video-blur-face': {
    name: '動画の顔ぼかし',
    tagline: '動画内の顔を追跡してぼかす。',
    description:
      'AIで動画内の顔を追跡し、音声を保ったままぼかし・モザイク・絵文字で隠せます。すべてブラウザ内で処理します。',
    keywords: ['動画顔ぼかし', '顔追跡', '匿名化', 'video face blur', 'モザイク', 'プライバシー'],
  },
  'video-burn-subtitle': {
    name: '動画に字幕を焼き込み',
    tagline: 'SRT/VTT/ASS字幕を恒久的に埋め込み。',
    description:
      'SRT・VTT・ASS字幕を動画に恒久的に焼き込み、常に表示されるように。ハードコード字幕をすべてブラウザ内で作成します。',
    keywords: ['字幕焼き込み', 'ハードサブ', '字幕埋め込み', 'burn subtitle', 'SRT', '動画字幕'],
  },
  'video-extract-frames': {
    name: '動画フレーム抽出',
    tagline: '各フレームを画像として保存。',
    description:
      '動画からフレームを抽出して画像として保存。静止画や全フレームを取り出せ、すべてブラウザ内で処理します。',
    keywords: ['フレーム抽出', '動画→画像', 'extract frames', '静止画取得', 'コマ抽出', 'フレーム保存'],
  },
  'video-merge': {
    name: '動画結合',
    tagline: 'クリップを順番に連結、コーデック統一。',
    description:
      '複数の動画クリップを指定した順に1つへ結合し、コーデックを自動統一。映像をつなぎ合わせ、すべてブラウザ内で処理します。',
    keywords: ['動画結合', 'クリップ連結', 'merge video', '動画つなぎ', 'コーデック統一', '映像結合'],
  },
  'video-poster': {
    name: '動画ポスターフレーム抽出',
    tagline: '任意の時間の静止画をキャプチャ。',
    description:
      '動画の好きな瞬間を静止画としてキャプチャし、サムネイルやポスターフレームに利用できます。すべてブラウザ内で処理します。',
    keywords: ['動画ポスター', 'サムネイル抽出', '動画フレーム取得', 'video poster', '静止画キャプチャ', 'thumbnail'],
  },
  'video-rotate': {
    name: '動画の回転',
    tagline: '90/180度の回転と上下左右の反転。',
    description:
      '動画を90度・180度回転させ、左右や上下に反転できます。横向きで撮れた映像の補正に最適。すべてブラウザ内で処理します。',
    keywords: ['動画回転', '動画反転', '横向き補正', 'rotate video', 'flip video', '向き修正'],
  },
  'epub-compress': {
    name: 'EPUB圧縮',
    tagline: '画像を再エンコードしてEPUBを軽量化。',
    description:
      'EPUB内の画像を再エンコード・縮小してファイルサイズを削減します。軽い電子書籍をブラウザ内だけで作成できます。',
    keywords: ['EPUB圧縮', '電子書籍 軽量化', 'ファイルサイズ削減', 'compress epub', 'EPUB最適化', 'ebook'],
  },
  'epub-cover-extract': {
    name: 'EPUB表紙の抽出',
    tagline: 'EPUBから表紙画像を取り出す。',
    description:
      'EPUBの表紙画像を元の画質のまま抽出します。カバーアートをそのまま取得でき、アップロード不要でローカル処理します。',
    keywords: ['EPUB表紙抽出', '表紙画像取得', '電子書籍カバー', 'epub cover', 'カバーアート', 'ebook'],
  },
  'epub-cover-replace': {
    name: 'EPUB表紙の差し替え',
    tagline: 'EPUBの表紙を新しい画像に変更。',
    description:
      'EPUBの表紙画像を新しい画像に差し替え、更新した電子書籍をダウンロードできます。すべてブラウザ内で完結します。',
    keywords: ['EPUB表紙変更', '表紙差し替え', '電子書籍カバー編集', 'replace epub cover', 'カバー変更', 'ebook'],
  },
  'epub-images-extract': {
    name: 'EPUB画像の一括抽出',
    tagline: 'EPUB内の全画像をZIPで保存。',
    description:
      'EPUBに含まれる表紙や挿絵などすべての画像をZIPにまとめて抽出します。素材を一括収集でき、すべてブラウザ内で処理します。',
    keywords: ['EPUB画像抽出', '挿絵抽出', '画像一括取得', 'epub images', '電子書籍画像', 'ZIP'],
  },
  'epub-merge': {
    name: 'EPUB結合',
    tagline: '複数のEPUBを1冊にまとめる。',
    description:
      '複数のEPUBファイルを指定した順序で1冊の電子書籍に結合します。巻や章の統合に便利で、すべてブラウザ内で処理します。',
    keywords: ['EPUB結合', '電子書籍 統合', 'EPUBマージ', 'merge epub', 'EPUB連結', 'ebook'],
  },
  'epub-metadata': {
    name: 'EPUBメタデータ編集',
    tagline: 'タイトル・著者・言語・タグを変更。',
    description:
      'EPUBのタイトル・著者・言語・説明・タグを編集し、リーダーで整然と並ぶようにします。すべてブラウザ内で処理します。',
    keywords: ['EPUBメタデータ', '電子書籍 情報編集', '著者変更', 'epub metadata', 'タイトル編集', 'ebook'],
  },
  'epub-reader': {
    name: 'EPUBリーダー',
    tagline: 'ブラウザでそのままEPUBを読む。',
    description:
      'EPUB電子書籍をブラウザで開いて閲覧できます。目次・テーマ・文字サイズ調整に対応し、アップロード不要です。',
    keywords: ['EPUBリーダー', '電子書籍 閲覧', 'EPUBを開く', 'epub reader', 'オンライン読書', 'ebook'],
  },
  'epub-split': {
    name: 'EPUB章分割',
    tagline: '各章を個別のEPUBに分割。',
    description:
      'EPUBの各章を個別のEPUBファイルに分割し、ZIPにまとめます。大きな書籍をパートに分けたいときに最適です。',
    keywords: ['EPUB分割', '章分割', '電子書籍 分割', 'split epub', 'EPUB章分け', 'ebook'],
  },
  'epub-stats': {
    name: 'EPUB統計',
    tagline: '語数・章数・画像数をカウント。',
    description:
      'EPUBの語数・文字数・章数・画像数や章ごとの分量を解析し、読書レポートを作成します。すべてブラウザ内で処理します。',
    keywords: ['EPUB統計', '文字数カウント', '電子書籍 分析', 'epub stats', '語数カウント', 'ebook'],
  },
  'epub-to-html': {
    name: 'EPUB→HTML変換',
    tagline: 'EPUBをHTMLとして書き出す。',
    description:
      'EPUBを画像インラインの単一HTMLファイル、または章ごとのHTMLをZIPにまとめて変換します。すべてブラウザ内で処理します。',
    keywords: ['EPUB HTML変換', '電子書籍 HTML化', 'epub to html', 'EPUB変換', 'ウェブ化', 'ebook'],
  },
  'epub-to-md': {
    name: 'EPUB→Markdown変換',
    tagline: 'EPUBの章をMarkdownに変換。',
    description:
      'EPUBの各章を単一ファイルまたは章ごとのZIPとしてMarkdownに変換します。書籍のテキストをノートに再利用できます。',
    keywords: ['EPUB Markdown変換', '電子書籍 マークダウン', 'epub to md', 'EPUB変換', 'ノート化', 'ebook'],
  },
  'epub-to-txt': {
    name: 'EPUB→テキスト変換',
    tagline: 'EPUBの本文をプレーンテキストに抽出。',
    description:
      'EPUBの本文をプレーンテキスト（.txt）に変換します。素早くコピー・再利用でき、アップロード不要でローカル処理します。',
    keywords: ['EPUB テキスト変換', '電子書籍 txt化', 'epub to txt', '本文抽出', 'テキスト化', 'ebook'],
  },
  'epub-validate': {
    name: 'EPUB構造チェック',
    tagline: 'OPF・spine・manifest・素材を検証。',
    description:
      'EPUBの構造（OPF・spine・manifest・表紙・欠落素材）をチェックして問題を検出します。すべてブラウザ内で処理します。',
    keywords: ['EPUB検証', 'EPUBチェッカー', '構造チェック', 'validate epub', 'EPUBエラー修正', 'ebook'],
  },
  'md-to-epub': {
    name: 'Markdown→EPUB変換',
    tagline: 'Markdownを章立てEPUBに変換。',
    description:
      'Markdownを見出しごとに章分割してEPUBに変換し、表紙も追加できます。ブラウザ内だけで電子書籍を作成できます。',
    keywords: ['Markdown EPUB変換', 'マークダウン 電子書籍', 'md to epub', 'EPUB作成', '電子書籍化', 'ebook'],
  },
  'txt-to-epub': {
    name: 'テキスト→EPUB変換',
    tagline: 'プレーンテキストをEPUBに変換。',
    description:
      'TXTファイルや貼り付けたテキストを、どの電子書籍リーダーでも読めるEPUBに変換します。すべてブラウザ内で完結します。',
    keywords: ['テキスト EPUB変換', 'txt to epub', '電子書籍化', 'EPUB作成', 'テキスト 電子書籍', 'ebook'],
  },
  chart: {
    name: 'グラフ作成（PNG出力）',
    tagline: '棒・折れ線・円グラフをPNGで作成。',
    description:
      'データを入力するだけで棒・折れ線・円グラフをPNG画像として生成します。レポートやスライドにそのまま貼り付け可能。すべてローカル処理です。',
    keywords: ['グラフ作成', 'チャート PNG', '棒グラフ生成', 'chart maker', 'グラフ画像', '円グラフ'],
  },
  'csv-diff': {
    name: 'CSV比較',
    tagline: 'キー列を基準に行単位で差分検出。',
    description:
      '2つのCSVファイルをキー列で照合し、行単位で追加・削除・変更を強調表示します。すべてブラウザ内で処理します。',
    keywords: ['CSV比較', 'CSV差分', 'csv diff', 'ファイル比較', 'csv compare', '差分検出'],
  },
  'docx-to-md': {
    name: 'DOCX→Markdown変換',
    tagline: 'Word文書をMarkdownに変換。',
    description:
      'Word（DOCX）文書をノート・Wiki・バージョン管理に適したクリーンなMarkdownに変換します。すべてブラウザ内で処理します。',
    keywords: ['DOCX Markdown変換', 'Word マークダウン', 'docx to md', 'Word変換', 'ノート化', 'word to markdown'],
  },
  'md-html': {
    name: 'Markdown⇔HTML変換',
    tagline: 'プレビュー付きで相互変換。',
    description:
      'MarkdownとHTMLをライブプレビュー付きで相互変換します。コンテンツを作成してそのままWebで再利用でき、すべてブラウザ内で処理します。',
    keywords: ['Markdown HTML変換', 'html to markdown', 'md to html', 'マークダウン変換', '相互変換', 'プレビュー'],
  },
  'markdown-stats': {
    name: 'Markdown統計',
    tagline: '語数・見出し・リンク・画像を解析。',
    description:
      'Markdown文書の構造（語数・見出し・リンク・画像・コードブロック）を一目で解析します。すべてブラウザ内で処理します。',
    keywords: ['Markdown統計', 'マークダウン 文字数', 'markdown stats', 'md分析', '見出し解析', '文字数カウント'],
  },
  'markdown-toc': {
    name: 'Markdown目次生成',
    tagline: '見出しから目次を自動生成。',
    description:
      'Markdown文書の見出しから目次を自動生成します。挿入・番号付け・リンク設定に対応し、すべてブラウザ内で処理します。',
    keywords: ['Markdown目次', 'TOC生成', 'markdown toc', '目次自動生成', 'マークダウン アウトライン', '見出し'],
  },
  'xlsx-convert': {
    name: 'XLSX⇔CSV⇔JSON変換',
    tagline: 'Excel・CSV・JSONを自由に相互変換。',
    description:
      'Excel（XLSX）・CSV・JSONをシート選択付きで相互変換します。表形式データをどこへでも移せ、すべてブラウザ内で処理します。',
    keywords: ['XLSX変換', 'Excel JSON変換', 'csv to xlsx', 'エクセル CSV', 'xlsx converter', '表データ変換'],
  },
  'subtitle-convert': {
    name: '字幕フォーマット変換',
    tagline: 'SRT・VTT・ASS・LRC・TXTを相互変換。',
    description:
      '字幕をSRT・VTT・ASS・LRC・TXT間で自由に変換し、プラットフォームの互換性問題を解消します。すべてブラウザ内で処理します。',
    keywords: ['字幕変換', 'srt vtt変換', '字幕フォーマット', 'subtitle converter', 'ass srt', '字幕 互換'],
  },
  'subtitle-edit': {
    name: '字幕エディタ・タイミング調整',
    tagline: 'SRT/VTT/ASS/LRCの編集と再同期。',
    description:
      '字幕テキストの編集やタイミングの一括シフト、フォーマット変換に対応（SRT・VTT・ASS・LRC）。字幕作業をブラウザ内で完結できます。',
    keywords: ['字幕編集', '字幕 タイミング', '字幕同期', 'subtitle editor', '字幕ずれ修正', 'srt編集'],
  },
  'text-replace': {
    name: 'テキスト一括置換',
    tagline: '正規表現とキャプチャグループで一括置換。',
    description:
      '正規表現とキャプチャグループに対応した一括検索・置換で、マッチ数をライブ表示します。テキストの整形をブラウザ内で行えます。',
    keywords: ['検索置換', '一括置換', '正規表現 置換', 'find and replace', 'regex replace', 'テキスト整形'],
  },
  'url-parser': {
    name: 'URLパーサー',
    tagline: 'URLとクエリパラメータを分解・再構築。',
    description:
      'URLを各要素に分解し、クエリパラメータを視覚的に編集して再構築します。リンクの確認や調整をブラウザ内で行えます。',
    keywords: ['URLパーサー', 'URL解析', 'クエリ編集', 'url parser', 'クエリパラメータ', 'URL分解'],
  },
  'random-pick': {
    name: 'ランダム抽選',
    tagline: 'リストから公平に当選者を抽選。',
    description:
      'Web Cryptoによる均一なランダム抽選でリストから当選者を選びます。公平な抽選やプレゼント企画に最適で、すべてブラウザ内で処理します。',
    keywords: ['ランダム抽選', '抽選ツール', 'ランダム選択', 'random picker', '当選者抽選', 'くじ引き'],
  },
  'timer-stopwatch': {
    name: 'タイマー・ストップウォッチ',
    tagline: 'ポモドーロ・ラップ・アラーム付き。',
    description:
      'ポモドーロなどのプリセット、ラップ記録、終了時のアラームを備えたタイマー＆ストップウォッチです。ブラウザ内で動作します。',
    keywords: ['タイマー', 'ストップウォッチ', 'ポモドーロ', 'online timer', 'カウントダウン', 'ラップタイマー'],
  },
  'age-calc': {
    name: '年齢計算ツール',
    tagline: '生年月日から正確な年齢と記念日数を計算。',
    description:
      '生年月日を入力するだけで満年齢を年・月・日で正確に算出し、生まれてからの経過日数や節目の日数も表示します。すべてブラウザ内で処理し、データは送信しません。',
    keywords: ['年齢計算', '満年齢', '生年月日', '経過日数', 'age calculator', '年齢早見'],
  },
  dday: {
    name: '記念日カウント（D-day）',
    tagline: '複数のイベントまでの残り日数を一括管理。',
    description:
      '試験・旅行・締め切りなど複数のイベントまでの残り日数（D-day）を一画面でまとめて表示。記念日や経過日数のカウントもブラウザ内で完結し、データは送信しません。',
    keywords: ['記念日カウント', 'Dday', 'カウントダウン', '残り日数', '日数計算', 'countdown'],
  },
  'json-to-ts': {
    name: 'JSON → TypeScript変換',
    tagline: 'JSONからTypeScriptの型定義を自動生成。',
    description:
      'JSONを貼り付けるだけで型を推論し、整ったTypeScriptのinterfaceを生成します。ネストやオブジェクトにも対応。すべてブラウザ内で処理し、アップロードしません。',
    keywords: ['JSON TypeScript変換', '型生成', 'interface生成', '型推論', 'json to typescript', '型定義'],
  },
  'css-gradient': {
    name: 'CSSグラデーション生成',
    tagline: '線形・放射グラデーションを作成しCSSをコピー。',
    description:
      '色と角度を指定してlinear-gradientやradial-gradientをリアルタイムにプレビューし、CSSコードをそのままコピーできます。すべてブラウザ内で動作します。',
    keywords: ['CSSグラデーション', 'linear-gradient', 'radial-gradient', '背景グラデーション', 'css gradient', '配色'],
  },
  'html-format': {
    name: 'HTML整形ツール',
    tagline: 'HTMLを整形（美化）または圧縮（minify）。',
    description:
      '崩れたHTMLを正しいインデントで読みやすく整形したり、不要な空白を除いて1行に圧縮（minify）できます。すべてブラウザ内で処理し、データは送信しません。',
    keywords: ['HTML整形', 'HTML美化', 'HTML圧縮', 'minify', 'html formatter', 'インデント'],
  },
  'image-split': {
    name: '画像分割（グリッド）',
    tagline: '画像をN×Mのタイルに分割。',
    description:
      '写真を任意のグリッド（例：Instagramのカルーセル用）に分割し、各タイルをまとめてZIPでダウンロードできます。すべてブラウザ内で処理し、アップロードしません。',
    keywords: ['画像分割', 'グリッド分割', 'Instagramグリッド', '画像カット', 'image splitter', 'タイル'],
  },
  'image-base64': {
    name: '画像 ↔ Base64変換',
    tagline: '画像をBase64のData URIに相互変換。',
    description:
      '画像をCSS/HTMLに埋め込めるBase64のData URIにエンコードしたり、Data URIから画像へデコードできます。すべてブラウザ内で処理し、アップロードしません。',
    keywords: ['画像Base64変換', 'Base64画像', 'Data URI', '画像埋め込み', 'image to base64', 'インライン画像'],
  },
  'image-round-corners': {
    name: '画像の角丸加工',
    tagline: '画像に丸い角を付けて透過PNGで保存。',
    description:
      '半径を調整して画像の角を丸くし、背景を透過させたPNGとして書き出せます。アイコンやサムネイル作成に最適。すべてブラウザ内で処理します。',
    keywords: ['角丸画像', '丸角PNG', '角を丸く', '透過PNG', 'rounded corners', '円形切り抜き'],
  },
  'video-speed': {
    name: '動画速度変更',
    tagline: '0.25倍〜4倍で動画を早送り・スロー再生。',
    description:
      'FFmpeg.wasmで再生速度を0.25倍〜4倍に変更し、音声のピッチも同期。スローモーションやタイムラプス動画をブラウザ内で作成でき、アップロードしません。',
    keywords: ['動画速度変更', '早送り動画', 'スローモーション', 'タイムラプス', 'video speed', '倍速'],
  },
  'video-watermark': {
    name: '動画にウォーターマーク',
    tagline: 'ロゴやテキストの透かしを動画に重ねる。',
    description:
      'ロゴ画像やテキストのウォーターマークを位置・不透明度を調整して動画に重ねられます。FFmpeg.wasmでブラウザ内処理し、アップロードしません。',
    keywords: ['動画ウォーターマーク', '動画ロゴ挿入', '透かし', 'オーバーレイ', 'video watermark', 'ブランディング'],
  },
  'dedupe-lines': {
    name: '重複行の削除',
    tagline: '元の順序を保ったまま重複した行を削除。',
    description:
      'リストを貼り付けて重複する行を削除します。大文字小文字の無視や前後空白のトリムも選択可能。すべてブラウザ内で処理し、データは送信しません。',
    keywords: ['重複行削除', '重複削除', 'ユニーク行', '行の整理', 'remove duplicate lines', 'テキスト整理'],
  },
  'whitespace-clean': {
    name: '空白クリーンアップ',
    tagline: '末尾空白・連続空行・タブを整える。',
    description:
      '乱れたテキストを整理：行末の空白を除去し、連続する空行をまとめ、インデントを正規化します。すべてブラウザ内で処理し、データは送信しません。',
    keywords: ['空白除去', '空白整理', '空行削除', 'テキストクリーン', 'whitespace cleaner', 'trim'],
  },
  slugify: {
    name: 'スラッグ生成',
    tagline: 'タイトルをURL用のスラッグに変換。',
    description:
      '任意のテキストをURLに使える安全なスラッグ（kebab-case）に変換し、アクセント記号も音訳します。パーマリンク作成に最適。すべてブラウザ内で処理します。',
    keywords: ['スラッグ生成', 'URLスラッグ', 'パーマリンク', 'slug生成', 'slugify', 'URL変換'],
  },
  'word-frequency': {
    name: '単語頻度カウント',
    tagline: 'テキスト内の各単語の出現回数を集計。',
    description:
      'テキストを貼り付けると単語ごとの出現回数を頻度順にランキング表示します。ストップワードの除外にも対応。すべてブラウザ内で処理します。',
    keywords: ['単語頻度', '出現回数カウント', '頻度分析', 'キーワード密度', 'word frequency', '語数集計'],
  },
  'column-extract': {
    name: '列の抽出',
    tagline: '区切りテキストから特定の列を取り出す。',
    description:
      '区切り文字でテキストを分割し、選んだ列だけを抽出して並び替えできます。CSVやTSVの列操作に便利。すべてブラウザ内で処理します。',
    keywords: ['列抽出', 'カラム抽出', '区切りテキスト', 'CSV列', 'column extractor', '列切り出し'],
  },
  'bmi-calc': {
    name: 'BMI計算',
    tagline: '身長と体重からBMIを計算。',
    description:
      '身長と体重を入力するとBMIとWHOの判定区分を表示します。メートル法・ヤードポンド法の両方に対応。すべてブラウザ内で処理します。',
    keywords: ['BMI計算', '体格指数', '肥満度', 'BMI判定', 'bmi calculator', '標準体重'],
  },
  'loan-calc': {
    name: 'ローン計算',
    tagline: '毎月の返済額と総利息を試算。',
    description:
      '元金・金利・返済期間を入力すると、元利均等での毎月の返済額と支払う利息の総額を試算します。すべてブラウザ内で処理します。',
    keywords: ['ローン計算', '返済シミュレーション', '毎月返済額', '元利均等', 'loan calculator', '住宅ローン'],
  },
  'aspect-ratio': {
    name: 'アスペクト比計算',
    tagline: '目標の縦横比に合う幅・高さを算出。',
    description:
      '16:9などのアスペクト比を固定し、幅または高さを変えるともう一方の寸法を自動計算します。動画や画像のサイズ決めに便利。すべてブラウザ内で処理します。',
    keywords: ['アスペクト比', '縦横比計算', '16:9', '解像度計算', 'aspect ratio', 'リサイズ比率'],
  },
  pomodoro: {
    name: 'ポモドーロタイマー',
    tagline: '25分集中＋5分休憩のサイクルで作業。',
    description:
      '25分の集中と5分の休憩を交互に繰り返し、終了時に通知するシンプルなポモドーロタイマー。登録不要で、すべてブラウザ内で動作します。',
    keywords: ['ポモドーロタイマー', '集中タイマー', '25分タイマー', '作業効率', 'pomodoro', '生産性'],
  },
  'roman-numeral': {
    name: 'ローマ数字変換',
    tagline: 'アラビア数字とローマ数字を相互変換。',
    description:
      '数値をローマ数字（I, V, X, L, C, D, M）に変換し、逆方向の変換にも対応します。すべてブラウザ内で動作します。',
    keywords: ['ローマ数字変換', 'ローマ数字', '数字変換', 'アラビア数字', 'roman numeral', '数値変換'],
  },
  'password-strength': {
    name: 'パスワード強度チェック',
    tagline: 'パスワードのエントロピーと解読時間を推定。',
    description:
      'パスワードの強度をエントロピーのビット数と推定解読時間で評価します。入力はどこにも送信されず、すべてブラウザ内で処理します。',
    keywords: ['パスワード強度', 'エントロピー', '解読時間', '強度チェック', 'password strength', '安全性'],
  },
  diceware: {
    name: 'パスフレーズ生成（Diceware）',
    tagline: '覚えやすく強力な単語ベースのパスフレーズを生成。',
    description:
      '暗号学的に安全な乱数を使い、Diceware方式の単語ベースのパスフレーズを生成します。単語数も指定可能。すべてブラウザ内で処理します。',
    keywords: ['パスフレーズ生成', 'Diceware', '覚えやすいパスワード', '単語パスワード', 'passphrase', 'ランダム生成'],
  },
  'jwt-encoder': {
    name: 'JWTエンコーダー',
    tagline: 'HS256でJSON Web Tokenを生成・署名。',
    description:
      'ヘッダー・ペイロード・シークレットからHMAC-SHA256で署名したJWTを生成します。すべてブラウザ内で処理し、データは送信しません。',
    keywords: ['JWTエンコード', 'JWT生成', 'JWT署名', 'HS256', 'jwt encoder', 'トークン生成'],
  },
  'xml-format': {
    name: 'XML整形ツール',
    tagline: 'XMLを整形（美化）または圧縮（minify）。',
    description:
      '崩れたXMLを正しいインデントで読みやすく整形したり、圧縮したりできます。整形時に構造の妥当性も検証。すべてブラウザ内で処理します。',
    keywords: ['XML整形', 'XML美化', 'XML圧縮', 'minify', 'xml formatter', 'インデント'],
  },
  'csv-viewer': {
    name: 'CSVビューア',
    tagline: 'CSVを並べ替え・検索できる表で表示。',
    description:
      'CSVファイルをブラウザで開き、列のソートや検索ができる表として閲覧できます。すべてブラウザ内で処理し、アップロードしません。',
    keywords: ['CSVビューア', 'CSV表示', 'CSV閲覧', '表プレビュー', 'csv viewer', 'CSV開く'],
  },
  'ical-gen': {
    name: 'iCal（.ics）生成',
    tagline: 'カレンダー予定を.icsファイルとして作成。',
    description:
      'タイトル・日時・場所を入力するだけで、各カレンダーアプリに予定を追加できる.icsファイルを生成します。すべてブラウザ内で処理します。',
    keywords: ['ics生成', 'iCalファイル', 'カレンダー予定', 'ics作成', 'ical generator', '予定追加'],
  },
  'vcard-parse': {
    name: 'vCard（.vcf）解析',
    tagline: '.vcf連絡先ファイルを読み込みCSVに出力。',
    description:
      'vCardファイルを開いて連絡先（氏名・電話・メール）を表で確認し、CSVに書き出せます。すべてブラウザ内で処理し、アップロードしません。',
    keywords: ['vCard解析', 'vcf CSV変換', 'vcf読み込み', '連絡先ファイル', 'vcard parser', 'アドレス帳'],
  },
  'audio-reverse': {
    name: '音声の逆再生',
    tagline: 'オーディオを逆再生して書き出す。',
    description:
      'オーディオクリップを時間軸で逆向きにして書き出します。FFmpeg.wasmでブラウザ内処理し、アップロードしません。',
    keywords: ['音声逆再生', 'オーディオ反転', '逆再生', 'MP3逆再生', 'reverse audio', 'リバース'],
  },
  'audio-normalize': {
    name: '音声ノーマライズ',
    tagline: '音量を一定のレベルに揃える。',
    description:
      'ラウドネスノーマライズ（EBU R128 loudnorm）を適用し、小さい部分と大きい部分の音量を揃えます。FFmpeg.wasmでブラウザ内処理します。',
    keywords: ['音声ノーマライズ', '音量調整', 'ラウドネス', 'loudnorm', 'normalize audio', '音量統一'],
  },
  'tone-gen': {
    name: 'トーンジェネレーター',
    tagline: 'サイン波・矩形波・三角波のテスト音を生成。',
    description:
      '任意の周波数・波形・長さで純音を生成し、WAVとしてダウンロードできます。Web Audio APIを使いブラウザ内で動作します。',
    keywords: ['トーンジェネレーター', '周波数生成', 'テスト音', 'サイン波', 'tone generator', '正弦波'],
  },

  // ── 追加分（en パリティ） ──
  'ascii-banner': {
    name: 'アスキーアートバナー生成',
    tagline: '文字を大きなアスキーアートに変換。',
    description:
      'テキストから大きなアスキーアートのバナーを生成します。READMEやターミナル、コメントに最適。すべてブラウザ内で処理します。',
    keywords: ['アスキーアート', 'アスキーバナー', 'figlet', 'ascii art', 'テキスト 文字絵'],
  },
  'avatar-crop': {
    name: '丸型アバター切り抜き',
    tagline: '画像を円形のプロフィール画像に切り抜き。',
    description:
      '写真を円形に切り抜き、透過PNGとして書き出します。アバターやプロフィール画像に最適。ブラウザ内で完結します。',
    keywords: ['丸型 切り抜き', 'アバター作成', 'プロフィール画像', 'circle crop', '円形 画像'],
  },
  'base32': {
    name: 'Base32エンコード／デコード',
    tagline: 'RFC 4648 のBase32でテキストを変換。',
    description:
      'テキストをBase32（RFC 4648）に相互変換します。TOTPシークレットや大文字小文字を区別しない符号化に便利。ブラウザ内で動作します。',
    keywords: ['base32 エンコード', 'base32 デコード', 'base32 変換', 'rfc 4648', 'base32'],
  },
  'bcrypt': {
    name: 'bcryptハッシュ生成・検証',
    tagline: 'bcryptのパスワードハッシュを生成・照合。',
    description:
      '任意のコスト係数でパスワードをbcryptハッシュ化、またはハッシュとパスワードを照合します。すべてブラウザ内で計算します。',
    keywords: ['bcrypt 生成', 'bcrypt ハッシュ', 'パスワード ハッシュ', 'bcrypt 検証', 'bcrypt'],
  },
  'binary-text': {
    name: 'テキスト ⇄ 2進数',
    tagline: 'テキストを2進数に、2進数をテキストに変換。',
    description:
      'テキストを2進数（UTF-8）に符号化、または2進数をテキストに復号します。すべてブラウザ内で処理します。',
    keywords: ['テキスト 2進数', 'バイナリ 変換', '2進数 変換', 'binary text', 'ascii バイナリ'],
  },
  'bionic-reading': {
    name: 'バイオニックリーディング変換',
    tagline: '各単語の先頭を太字にして速読を補助。',
    description:
      'テキストを単語の頭部分が強調されるバイオニックリーディング形式に変換し、視線誘導で読みやすくします。すべてブラウザ内で処理します。',
    keywords: ['バイオニックリーディング', '速読', '太字 変換', 'bionic reading', '読書補助'],
  },
  'box-shadow': {
    name: 'CSS box-shadow ジェネレーター',
    tagline: 'CSSの影を視覚的に作成してコピー。',
    description:
      'オフセット・ぼかし・広がり・色を調整してbox-shadowを作成し、ライブプレビューしながらCSSをコピーできます。ブラウザ内で完結します。',
    keywords: ['box shadow 生成', 'css 影', 'box-shadow', 'シャドウ css', '影 作成'],
  },
  'caesar-cipher': {
    name: 'シーザー暗号 / ROT13',
    tagline: 'シーザー暗号やROT13で暗号化・復号。',
    description:
      'テキストにシーザー暗号（シフト）やROT13を適用し、元に戻すこともできます。シフト量も調整可能。ブラウザ内で動作します。',
    keywords: ['シーザー暗号', 'rot13', 'シフト暗号', '暗号化 復号', 'caesar cipher'],
  },
  'chmod-calc': {
    name: 'chmod計算機',
    tagline: 'Unixのファイル権限を8進数と記号表記で変換。',
    description:
      '所有者・グループ・その他の読み取り・書き込み・実行を切り替えて、chmodの8進数と記号表記を求めます。ブラウザ内で動作します。',
    keywords: ['chmod 計算', 'unix パーミッション', 'ファイル権限', 'chmod 755', '8進数 権限'],
  },
  'coin-flip': {
    name: 'コイントス',
    tagline: '仮想コインを投げて表か裏かを決める。',
    description:
      '1枚または複数枚のコインを投げ、表裏の結果と集計を表示します。公平な乱数でブラウザ内で動作します。',
    keywords: ['コイントス', 'コイン 投げる', '表 裏', 'coin flip', 'ランダム 決定'],
  },
  'color-blind': {
    name: '色覚シミュレーター',
    tagline: '色覚特性のある見え方で画像をプレビュー。',
    description:
      '第一色覚（P型）・第二色覚（D型）・第三色覚（T型）を画像にシミュレートし、アクセシビリティを確認できます。ブラウザ内で処理します。',
    keywords: ['色覚シミュレーター', '色覚 テスト', '色弱 確認', 'アクセシビリティ 色', 'color blind'],
  },
  'color-name': {
    name: 'カラー名検索',
    tagline: 'HEXやRGBに最も近いCSSの色名を検索。',
    description:
      'HEXまたはRGBの色を入力すると、最も近いCSSの名前付き色を表示し、完全一致も判定します。ブラウザ内で動作します。',
    keywords: ['カラー名 検索', 'hex 色名', 'css カラー名', '近い色名', 'color name'],
  },
  'css-units': {
    name: 'CSS単位コンバーター',
    tagline: 'px・rem・em・ptを相互変換。',
    description:
      'ルートのフォントサイズを指定して、CSSの長さ単位（px・rem・em・pt）を相互変換します。アップロード不要、ブラウザ内で完結します。',
    keywords: ['css 単位 変換', 'px rem 変換', 'rem px', 'em px', 'css units'],
  },
  'csv-merge': {
    name: 'CSV結合',
    tagline: '複数のCSVファイルを1つにまとめる。',
    description:
      '複数のCSVをヘッダーで列を揃えながら1つのファイルに結合します。すべての処理はブラウザ内で行われます。',
    keywords: ['csv 結合', 'csv まとめる', 'csv 連結', 'merge csv', 'csv 統合'],
  },
  'csv-split': {
    name: 'CSV分割',
    tagline: '大きなCSVを行数ごとに小さく分割。',
    description:
      '大きなCSVをN行ごとのチャンクに分割し、各ファイルにヘッダーを残してZIPでダウンロードできます。ブラウザ内で完結します。',
    keywords: ['csv 分割', 'csv 切り分け', '大きい csv 分割', 'split csv', 'csv 分ける'],
  },
  'csv-to-md': {
    name: 'CSV → Markdown表',
    tagline: 'CSVをGitHub形式のMarkdown表に変換。',
    description:
      'CSVを貼り付けると、列を揃えたきれいなMarkdownの表に変換します。READMEにそのまま使えます。ブラウザ内で完結します。',
    keywords: ['csv markdown 表', 'markdown テーブル', 'csv md', 'csv 表 変換', 'markdown table'],
  },
  'cubic-bezier': {
    name: 'cubic-bezier エディター',
    tagline: 'ドラッグでCSSのイージング曲線を作成。',
    description:
      '制御点をドラッグしてCSSトランジション用のcubic-bezierタイミング関数を設計し、値をコピーできます。ブラウザ内で完結します。',
    keywords: ['cubic bezier', 'イージング エディター', 'css タイミング関数', 'ベジェ曲線 css', 'easing'],
  },
  'curl-to-code': {
    name: 'cURL → コード変換',
    tagline: 'cURLコマンドをfetch・axios・Pythonに変換。',
    description:
      'cURLコマンドを貼り付けると、すぐ使えるJavaScriptのfetch・axios、またはPython requestsのコードに変換します。ブラウザ内で完結します。',
    keywords: ['curl コード変換', 'curl fetch', 'curl python', 'curl 変換', 'curl axios'],
  },
  'date-diff': {
    name: '日付計算機',
    tagline: '日付の差を計算、または日数を加減算。',
    description:
      '2つの日付の間の日数を求めたり、ある日付に日数を足し引きしたりできます。すべてブラウザ内で動作します。',
    keywords: ['日付 計算', '日数 計算', '日付 差', '日付 加算', 'date calculator'],
  },
  'dice-roller': {
    name: 'サイコロ',
    tagline: '任意の面数のサイコロを好きな個数だけ振る。',
    description:
      'D4・D6・D20やカスタムのサイコロを振り、合計や補正値を表示します。テーブルゲーム向け。暗号学的乱数でブラウザ内で動作します。',
    keywords: ['サイコロ', 'ダイス ロール', 'd20', 'trpg サイコロ', 'dice roller'],
  },
  'discount': {
    name: '割引計算機',
    tagline: 'セール価格と割引額を計算。',
    description:
      '価格と割引率を入力して、割引後の価格と割引額を計算したり、割引率を逆算したりできます。ブラウザ内で完結します。',
    keywords: ['割引 計算', 'セール価格 計算', 'パーセント オフ', '値引き 計算', 'discount'],
  },
  'dotenv-json': {
    name: '.env ⇄ JSON 変換',
    tagline: '.envファイルとJSONを相互変換。',
    description:
      '.envの内容を貼り付けてJSONに変換、またはJSONを.envファイルに変換します。引用符やコメントにも対応。すべてブラウザ内で処理します。',
    keywords: ['env json 変換', 'dotenv json', 'json env', 'env 変換', 'env 解析'],
  },
  'fancy-text': {
    name: 'おしゃれ文字ジェネレーター',
    tagline: 'テキストを装飾的なUnicodeフォントに変換。',
    description:
      'プレーンなテキストを太字・斜体・筆記体などのUnicodeフォントスタイルに変換します。SNSのプロフィールに。ブラウザ内で完結します。',
    keywords: ['おしゃれ文字', 'unicode フォント', 'インスタ フォント', 'かわいい文字', 'fancy text'],
  },
  'fuel-cost': {
    name: 'ガソリン代計算機',
    tagline: '距離・燃費・価格から旅行の燃料費を概算。',
    description:
      '走行距離・燃費・燃料価格を入力して、合計の燃料費と消費量を概算します。すべてブラウザ内で動作します。',
    keywords: ['ガソリン代 計算', '燃料費 計算', '旅行 燃料費', '燃費 計算', 'fuel cost'],
  },
  'gitignore-gen': {
    name: '.gitignore ジェネレーター',
    tagline: '言語・フレームワーク・OSから.gitignoreを生成。',
    description:
      '技術スタックやプラットフォームを選んで、すぐ使える.gitignoreファイルを組み立てます。ローカルで生成し、アップロードしません。',
    keywords: ['gitignore 生成', 'gitignore 作成', 'git ignore テンプレート', 'gitignore', 'git 無視'],
  },
  'gpa': {
    name: 'GPA計算機',
    tagline: '成績の平均点（GPA）を計算。',
    description:
      '科目ごとの単位数と成績を入力して、加重GPA（4.0／4.5スケール）を計算します。ブラウザ内で完結します。',
    keywords: ['gpa 計算', '成績 平均', '加重 gpa', '評定平均', 'gpa calculator'],
  },
  'gradient-image': {
    name: 'グラデーション画像生成',
    tagline: 'グラデーションの背景画像をPNGで作成。',
    description:
      '色・方向・サイズを選んでグラデーションの背景画像を生成し、PNGとしてダウンロードできます。ブラウザ内で完結します。',
    keywords: ['グラデーション 画像', 'グラデーション 背景 png', 'グラデーション 壁紙', 'gradient image', '背景 生成'],
  },
  'hmac-gen': {
    name: 'HMACジェネレーター',
    tagline: 'SHA-1/256/512でHMAC署名を生成。',
    description:
      '秘密鍵とメッセージからWeb Crypto APIでHMACを計算します。出力はhexまたはBase64。すべてブラウザ内で処理します。',
    keywords: ['hmac 生成', 'hmac sha256', 'hmac', 'メッセージ認証コード', 'hmac 署名'],
  },
  'htpasswd': {
    name: '.htpasswd ジェネレーター',
    tagline: 'Apacheの.htpasswd認証行を作成。',
    description:
      'ユーザー名とパスワードから.htpasswdの行（bcrypt／APR1-MD5／SHA）を生成します。すべてブラウザ内で処理します。',
    keywords: ['htpasswd 生成', 'apache htpasswd', 'basic 認証', 'htpasswd bcrypt', 'htpasswd'],
  },
  'http-status': {
    name: 'HTTPステータスコード一覧',
    tagline: 'HTTPステータスコードの意味を調べる。',
    description:
      'HTTPステータスコード（1xx〜5xx）を説明や代表的な用途とともに検索できます。手軽なリファレンス。すべてブラウザ内で動作します。',
    keywords: ['http ステータスコード', '404 意味', '500 エラー', 'http レスポンス', 'status code'],
  },
  'image-blur': {
    name: '画像をぼかす',
    tagline: '画像にガウスぼかしを適用。',
    description:
      '画像全体に半径を調整できるぼかしをかけ、結果をダウンロードできます。すべての処理はブラウザ内で行われます。',
    keywords: ['画像 ぼかし', 'ぼかし 加工', 'ガウスぼかし', '写真 ぼかし', 'blur image'],
  },
  'image-border': {
    name: '画像に枠線を追加',
    tagline: '画像に色付きの枠やフレームを追加。',
    description:
      '任意の幅と色のべた塗りの枠を画像のまわりに追加します。アップロード不要、すべてブラウザ内で完結します。',
    keywords: ['画像 枠線', '画像 フレーム', '写真 枠', 'ボーダー 追加', 'image border'],
  },
  'image-color-picker': {
    name: '画像カラーピッカー',
    tagline: '画像から色（HEX/RGB）を抽出。',
    description:
      '画像を読み込んで好きな場所をクリックすると、その画素のHEXとRGBの色を読み取れます。すべてブラウザ内で処理します。',
    keywords: ['画像 カラーピッカー', '画像 色 抽出', 'スポイト', 'hex 抽出', 'color picker'],
  },
  'image-duotone': {
    name: 'デュオトーン画像',
    tagline: '画像を2色のデュオトーンに変換。',
    description:
      '影とハイライトに2つの色を割り当てて、写真をおしゃれなデュオトーンに変換します。ブラウザ内で完結します。',
    keywords: ['デュオトーン', '2色 画像', 'ツートン 写真', 'グラデーションマップ', 'duotone'],
  },
  'image-filters': {
    name: '画像フィルター',
    tagline: '写真にインスタ風フィルターを適用。',
    description:
      'モノクロ・セピア・ビンテージなどのフィルターを画像に適用し、結果をダウンロードできます。ブラウザ内で動作します。',
    keywords: ['画像 フィルター', '写真 フィルター', 'インスタ フィルター', 'セピア モノクロ', 'image filter'],
  },
  'image-histogram': {
    name: '画像ヒストグラム',
    tagline: '画像のRGB・輝度の分布を分析。',
    description:
      '画像を読み込むと、赤・緑・青と輝度のヒストグラムを表示します。露出の分析に便利。すべてブラウザ内で処理します。',
    keywords: ['画像 ヒストグラム', 'rgb ヒストグラム', '写真 ヒストグラム', '輝度 分布', 'histogram'],
  },
  'image-placeholder': {
    name: 'プレースホルダー画像生成',
    tagline: 'サイズと文字を指定したダミー画像を生成。',
    description:
      'モックアップ用に、任意のサイズ・色・ラベル文字のべた塗りプレースホルダー画像を作成します。ブラウザ内でPNG書き出しします。',
    keywords: ['プレースホルダー 画像', 'ダミー 画像', 'placeholder png', 'モックアップ 画像', 'image placeholder'],
  },
  'image-target-size': {
    name: '目標サイズに画像圧縮',
    tagline: '指定したファイルサイズまで画像を縮小。',
    description:
      '画質を自動調整して、JPEG/WebPを指定したサイズ（例：200KB）以下に収めます。すべてブラウザ内で処理します。',
    keywords: ['画像 サイズ 圧縮', '目標 容量', 'kb 縮小', '200kb 画像', 'target size'],
  },
  'ini-json': {
    name: 'INI ⇄ JSON 変換',
    tagline: 'INI設定とJSONを相互変換。',
    description:
      'INIファイルをJSONに解析、またはJSONをINIに直列化します。すべてブラウザ内で完結します。',
    keywords: ['ini json 変換', 'json ini', 'ini 変換', 'ini 解析', 'ini json'],
  },
  'json-diff': {
    name: 'JSON差分',
    tagline: '2つのJSONを構造的に比較。',
    description:
      '2つのJSONオブジェクトの間で追加・削除・変更されたキーを構造的な差分として表示します。ブラウザ内で動作します。',
    keywords: ['json 差分', 'json 比較', 'json diff', '構造 比較', 'json 比べる'],
  },
  'json-escape': {
    name: 'JSONエスケープ／解除',
    tagline: 'JSON用に文字列をエスケープ・復元。',
    description:
      'テキストをJSONに安全な文字列（引用符・改行・Unicode）にエスケープ、または元に戻します。ブラウザ内で完結します。',
    keywords: ['json エスケープ', 'json アンエスケープ', '文字列 エスケープ', 'json string', 'json escape'],
  },
  'json-flatten': {
    name: 'JSONフラット化／復元',
    tagline: 'ネストしたJSONをドット記法に、または元に戻す。',
    description:
      'ネストしたJSONをドット記法のフラットなキーに変換、またはドット付きキーをネストしたオブジェクトに復元します。ブラウザ内で動作します。',
    keywords: ['json フラット化', 'json 平坦化', 'json ドット記法', 'ネスト json 変換', 'json flatten'],
  },
  'json-to-go': {
    name: 'JSON → Go構造体',
    tagline: 'JSONからGoの構造体型を即座に生成。',
    description:
      'JSONを貼り付けると、jsonタグ付きの型付きGo構造体を生成します。すべてブラウザ内で処理します。',
    keywords: ['json go 変換', 'json struct', 'golang 構造体 生成', 'go 型 json', 'json golang'],
  },
  'jsonl-viewer': {
    name: 'JSONLビューア',
    tagline: 'JSON Linesを表で表示しJSON/CSVに書き出し。',
    description:
      'JSONL/NDJSONファイルを開いてレコードを表で閲覧し、JSON配列やCSVに変換できます。ブラウザ内で動作します。',
    keywords: ['jsonl ビューア', 'ndjson ビューア', 'json lines', 'jsonl csv', 'jsonl json'],
  },
  'language-detect': {
    name: '言語判定',
    tagline: 'テキストが何語で書かれているかを判定。',
    description:
      '文字種とn-gramのヒューリスティックを使って、テキストの言語を推定します。すべてブラウザ内で完結します。',
    keywords: ['言語 判定', '言語 検出', '何語', '言語 識別', 'language detect'],
  },
  'line-numbers': {
    name: '行番号を追加',
    tagline: 'テキストの各行に行番号を付与、または削除。',
    description:
      '開始番号・桁揃え・区切り文字を指定して各行の先頭に番号を付与、または行番号を削除できます。すべてブラウザ内で処理します。',
    keywords: ['行番号 追加', '行 番号付け', '行番号 削除', 'テキスト 行番号', 'line numbers'],
  },
  'lottery-number': {
    name: '宝くじ番号ジェネレーター',
    tagline: 'ランダムな宝くじの番号の組を生成。',
    description:
      '範囲と個数を指定して、宝くじ用のランダムな数字の組を選びます。暗号学的乱数でブラウザ内で動作します。',
    keywords: ['宝くじ 番号', 'ロト 番号 生成', 'ランダム 数字', '当選番号 生成', 'lottery number'],
  },
  'markdown-preview': {
    name: 'Markdownプレビュー',
    tagline: '入力しながらMarkdownをライブ描画。',
    description:
      'Markdownを書くと、描画結果とHTMLを並べてリアルタイムに表示します。すべてブラウザ内で動作します。',
    keywords: ['markdown プレビュー', 'markdown エディタ', 'ライブ markdown', 'md html プレビュー', 'markdown'],
  },
  'mock-data': {
    name: 'モックデータ生成',
    tagline: 'ダミーの名前・メール・レコードをJSON/CSVで生成。',
    description:
      'テスト用にリアルなモックデータ（名前・メール・住所・日付）を作成し、JSONやCSVで書き出します。ブラウザ内で完結します。',
    keywords: ['モックデータ 生成', 'ダミーデータ', 'テストデータ 生成', 'ダミー json csv', 'mock data'],
  },
  'morse-code': {
    name: 'モールス信号翻訳',
    tagline: 'テキストとモールス信号を音付きで相互変換。',
    description:
      'テキストとモールス信号を相互変換し、ビープ音で再生できます。すべてブラウザ内で処理します。',
    keywords: ['モールス信号 変換', 'テキスト モールス', 'モールス 解読', 'モールス 音', 'morse code'],
  },
  'nato-phonetic': {
    name: 'NATOフォネティックコード',
    tagline: 'テキストをNATOフォネティックコードで読み上げ表記。',
    description:
      '任意のテキストをNATOフォネティックコード（Alfa、Bravo、Charlie…）に変換し、明瞭に綴れます。ブラウザ内で完結します。',
    keywords: ['nato フォネティックコード', '通話表', 'alfa bravo charlie', 'フォネティック 綴り', 'nato phonetic'],
  },
  'number-to-words': {
    name: '数字を言葉に変換',
    tagline: '数字を言葉のつづりに変換。',
    description:
      '数字を英語や日本語の言葉に変換します（例：1234 → 千二百三十四）。金額表記にも。ブラウザ内で完結します。',
    keywords: ['数字 言葉 変換', '数字 つづり', '数 漢字 変換', '金額 文字', 'number to words'],
  },
  'pdf-booklet': {
    name: 'PDF小冊子メーカー',
    tagline: 'PDFを印刷用の2up小冊子に面付け。',
    description:
      'PDFのページを中綴じ小冊子の面付けに並べ替え、印刷して折って綴じられるようにします。すべてブラウザ内で処理します。',
    keywords: ['pdf 小冊子', '冊子 面付け', 'pdf 製本', '中綴じ pdf', 'pdf booklet'],
  },
  'pdf-reverse': {
    name: 'PDFページの順序を逆転',
    tagline: 'PDFのページ順を逆にする。',
    description:
      'PDFの全ページの順序を逆にして結果をダウンロードできます。アップロード不要、すべてブラウザ内で完結します。',
    keywords: ['pdf ページ 逆順', 'pdf 順序 逆', 'pdf ページ順', 'pdf 逆転', 'reverse pdf'],
  },
  'qr-logo': {
    name: 'ロゴ入りQRコード',
    tagline: '中央にロゴを入れたQRコードを生成。',
    description:
      'テキストやURLからQRコードを作成し、中央にロゴを重ねます。誤り訂正にも対応。ブラウザ内で完結します。',
    keywords: ['ロゴ qrコード', 'カスタム qrコード', 'ブランド qr', 'ロゴ qr 生成', 'qr logo'],
  },
  'random-number': {
    name: '乱数ジェネレーター',
    tagline: '範囲・個数・重複なしを指定して乱数を生成。',
    description:
      '範囲を指定した整数の乱数を、個数や重複なしのオプション付きで生成します。暗号学的乱数でブラウザ内で動作します。',
    keywords: ['乱数 生成', 'ランダム 数字', '乱数', '数字 抽選', 'random number'],
  },
  'reaction-time': {
    name: '反応速度テスト',
    tagline: 'ミリ秒単位で反応の速さを測定。',
    description:
      '合図が変わった瞬間にクリックして、複数回の反応速度を測定します。ブラウザ内で完結します。',
    keywords: ['反応速度 テスト', '反射神経 テスト', '反応 速さ', 'クリック 反応', 'reaction time'],
  },
  'reverse-text': {
    name: 'テキストを逆順に',
    tagline: '文字・単語・行の順序を逆転。',
    description:
      'テキストを文字単位・単語単位・行単位で即座に反転します。アップロード不要、ブラウザ内で動作します。',
    keywords: ['テキスト 逆順', '逆さ 文字', '文字列 反転', '文字 逆', 'reverse text'],
  },
  'scientific-calc': {
    name: '関数電卓',
    tagline: '三角関数・対数・累乗などをブラウザで計算。',
    description:
      '三角関数・対数・指数・定数・数式評価に対応した関数電卓です。サーバー処理はありません。',
    keywords: ['関数電卓', '電卓 オンライン', '三角関数 計算', '数式 計算', 'scientific calculator'],
  },
  'screen-ruler': {
    name: '画面定規・PPI',
    tagline: 'ピクセルを測定し画面のPPIを計算。',
    description:
      '解像度と対角サイズからディスプレイのPPIを計算し、画面上のピクセル定規も使えます。ブラウザ内で完結します。',
    keywords: ['画面 定規', 'ppi 計算', 'ピクセル 定規', '画面 dpi', 'screen ruler'],
  },
  'secret-split': {
    name: 'シークレット分割（Shamir）',
    tagline: '秘密を複数の断片に分割し一部で復元。',
    description:
      'シャミアの秘密分散を使って秘密をN個の断片に分割し、任意のK個で復元できます。ブラウザ内で動作します。',
    keywords: ['シャミア 秘密分散', '秘密 分割', '秘密分散 ツール', '鍵 分割', 'secret split'],
  },
  'sentiment': {
    name: '感情分析',
    tagline: 'テキストのポジティブ・ネガティブを採点。',
    description:
      '辞書ベースの採点で感情を推定します。モデルもアップロードも不要。肯定・否定の語を強調表示します。ブラウザ内で完結します。',
    keywords: ['感情分析', 'ポジティブ ネガティブ', '感情 採点', 'テキスト 感情', 'sentiment'],
  },
  'subnet-calc': {
    name: 'サブネット計算機',
    tagline: 'CIDRからネットワーク・ブロードキャスト・ホスト範囲を計算。',
    description:
      'IPv4アドレスとCIDRプレフィックスを入力して、ネットマスク・ネットワークアドレス・ブロードキャストアドレス・利用可能ホスト範囲を求めます。ブラウザ内で動作します。',
    keywords: ['サブネット 計算', 'cidr 計算', 'ip サブネット', 'ipv4 計算', 'subnet calculator'],
  },
  'summarize': {
    name: 'テキスト要約',
    tagline: '抽出型要約 — 重要な文を抜き出す。',
    description:
      '文をスコアリングして重要な文を抜き出し、テキストを要約します。モデルもアップロードも不要。ブラウザ内で完結します。',
    keywords: ['テキスト 要約', '文章 要約', '抽出 要約', '要約 生成', 'summarize'],
  },
  'svg-optimize': {
    name: 'SVG最適化',
    tagline: '不要な要素を除去してSVGを軽量化。',
    description:
      'エディタのメタデータ・余分な空白・過剰な精度をSVGから取り除いてサイズを削減します。ブラウザ内で完結します。',
    keywords: ['svg 最適化', 'svg 軽量化', 'svg 圧縮', 'svg クリーナー', 'svg optimize'],
  },
  'tdee': {
    name: 'TDEE・カロリー計算機',
    tagline: '基礎代謝と1日の必要カロリーを概算。',
    description:
      '身長・体重・年齢・活動レベルを入力して、基礎代謝（BMR）とTDEE（1日の消費カロリー）を計算します。ブラウザ内で動作します。',
    keywords: ['tdee 計算', 'カロリー 計算', '基礎代謝 計算', '消費カロリー', 'tdee'],
  },
  'text-repeat': {
    name: 'テキスト繰り返し',
    tagline: 'テキストを指定回数だけ繰り返す。',
    description:
      'テキストを区切り文字を任意に挟みながらN回複製します。テスト用やテンプレート作成に便利。すべてブラウザ内で動作します。',
    keywords: ['テキスト 繰り返し', '文字 反復', '文字列 複製', '繰り返し 生成', 'text repeat'],
  },
  'timezone': {
    name: 'タイムゾーン変換',
    tagline: 'タイムゾーン間で時刻を変換。',
    description:
      '2つのタイムゾーンを選んで時刻を変換し、時差を確認できます。ブラウザ内蔵のタイムゾーンデータを使用。ブラウザ内で完結します。',
    keywords: ['タイムゾーン 変換', '時差 計算', '世界時計', 'utc 変換', 'timezone'],
  },
  'tip-calc': {
    name: 'チップ計算機',
    tagline: 'チップを計算し、割り勘を1人あたりで算出。',
    description:
      '会計金額・チップ率・人数を入力して、チップ・合計・1人あたりの金額を求めます。すべてブラウザ内で動作します。',
    keywords: ['チップ 計算', '割り勘 計算', 'チップ 計算機', '1人あたり 計算', 'tip calculator'],
  },
  'toml-json': {
    name: 'TOML ⇄ JSON 変換',
    tagline: 'TOMLとJSONを相互変換。',
    description:
      'TOML設定をJSONに、JSONをTOMLに変換します。設定ファイルの編集や確認に便利。すべてブラウザ内で完結します。',
    keywords: ['toml json 変換', 'json toml', 'toml 変換', 'toml 変換 ツール', 'toml json'],
  },
  'tts': {
    name: '音声読み上げ（TTS）',
    tagline: 'ブラウザの音声でテキストを読み上げ。',
    description:
      'テキストを入力すると、ブラウザ内蔵の音声で読み上げます。速度やピッチも調整可能。すべてブラウザ内で動作します。',
    keywords: ['音声読み上げ', 'tts', '読み上げ', '音声合成', 'text to speech'],
  },
  'typing-speed': {
    name: 'タイピング速度テスト',
    tagline: 'タイピング速度をWPMで測定。',
    description:
      '表示された文章を打って、1分あたりの語数（WPM）と正確性を測定します。登録不要、すべてブラウザ内で動作します。',
    keywords: ['タイピング 速度', 'wpm 測定', 'タイピング テスト', '入力速度', 'typing speed'],
  },
  'user-agent-parser': {
    name: 'User-Agent解析',
    tagline: 'User-Agentからブラウザ・OS・端末を判定。',
    description:
      '任意のUser-Agent文字列を貼り付けて、ブラウザ・エンジン・OS・端末種別を識別します。すべてブラウザ内で動作します。',
    keywords: ['user agent 解析', 'ua 解析', 'ユーザーエージェント', 'ブラウザ 判定', 'user agent parser'],
  },
  'video-flip': {
    name: '動画反転',
    tagline: '動画を左右または上下に反転。',
    description:
      '動画を左右ミラーまたは上下反転して再エンコードします。FFmpeg.wasmによりブラウザ内で完結します。',
    keywords: ['動画 反転', 'ミラー 動画', '動画 左右反転', 'mp4 反転', 'flip video'],
  },
  'video-loop': {
    name: '動画ループ',
    tagline: '動画をN回繰り返して1つのファイルに。',
    description:
      'クリップを指定した回数だけ自身に連結して、シームレスなループを作ります。FFmpeg.wasmでブラウザ内で完結します。',
    keywords: ['動画 ループ', '動画 繰り返し', 'ループ 動画 作成', 'mp4 ループ', 'loop video'],
  },
  'video-resize': {
    name: '動画リサイズ',
    tagline: '動画の解像度（720p・1080p…）を変更。',
    description:
      'アスペクト比を保ったまま動画を目標の解像度に再エンコードします。FFmpeg.wasmでブラウザ内で動作します。',
    keywords: ['動画 リサイズ', '動画 解像度 変更', '動画 縮小', '動画 720p 1080p', 'resize video'],
  },
  'video-reverse': {
    name: '動画逆再生',
    tagline: '動画を逆再生で書き出す。',
    description:
      'FFmpeg.wasmでクリップを時間軸で逆向きにしてダウンロードできます。すべてブラウザ内で処理し、アップロードしません。',
    keywords: ['動画 逆再生', '動画 巻き戻し', '逆再生 動画', 'リバース 動画', 'reverse video'],
  },
  'webcam-record': {
    name: 'ウェブカメラ録画',
    tagline: 'ウェブカメラの映像を録画。',
    description:
      'ウェブカメラとマイクをキャプチャしてwebmをダウンロードします。アップロード不要、インストール不要、ブラウザ内で動作します。',
    keywords: ['ウェブカメラ 録画', 'webカメラ 録画', 'カメラ 録画', 'webm 録画', 'webcam record'],
  },
  'wifi-qr': {
    name: 'WiFi QRコード生成',
    tagline: 'WiFiに接続できるQRコードを作成。',
    description:
      'WiFiのSSID・パスワード・暗号方式を入力して、読み取るだけで接続できるQRコードを生成します。すべてブラウザ内で処理します。',
    keywords: ['wifi qrコード', 'wifi qr 生成', 'wifi 接続 qr', 'wifi 共有 qr', 'wifi qr'],
  },
  'zalgo-text': {
    name: 'ザルゴ・グリッチ文字',
    tagline: '結合文字で不気味なグリッチ文字を作成。',
    description:
      'テキストに結合分音記号を重ねて、強度を調整できるグリッチなザルゴ効果を作ります。ブラウザ内で完結します。',
    keywords: ['ザルゴ 文字', 'グリッチ 文字', '不気味 文字', '崩れた文字', 'zalgo text'],
  },

  // ── 追加分3（en パリティ） ──────────────────────────────────────────────
  'ascii-table': {
    name: 'ASCIIコード表',
    tagline: 'ASCII文字を10進・16進・8進コードで検索。',
    description:
      'ASCIIコード表を10進・16進・8進コードと制御文字の説明つきで一覧・検索できます。手早く使えるリファレンスです。',
    keywords: ['ascii 表', 'ascii コード', '文字コード', 'ascii table', 'ascii 一覧'],
  },
  'audio-pitch': {
    name: 'オーディオ ピッチ変更',
    tagline: '再生速度を変えずに音の高さを変更。',
    description:
      '再生速度を保ったまま音程を半音単位で上下できます。FFmpegでブラウザ内処理し、ファイルはどこにも送信されません。',
    keywords: ['ピッチ変更', '音程 変更', 'キー変更', 'pitch shift', 'オーディオ 移調'],
  },
  'audio-waveform': {
    name: '波形画像の生成',
    tagline: '音声ファイルの波形をPNG画像に。',
    description:
      '音声ファイルから波形画像を生成。色やサイズを指定でき、Web Audioでローカル解析するためアップロードしません。',
    keywords: ['波形 画像', '波形 生成', 'オーディオ 可視化', 'waveform', '音声 波形'],
  },
  'cc-validate': {
    name: 'クレジットカード番号チェック（Luhn）',
    tagline: 'Luhnチェックサムとカードブランドを判定。',
    description:
      'クレジットカード番号をLuhnアルゴリズムで検証し、カードブランドを判別します。データはブラウザの外に出ません。',
    keywords: ['カード番号 チェック', 'luhn 判定', 'クレジットカード 検証', 'luhn algorithm', 'カードブランド 判定'],
  },
  'checksum-verify': {
    name: 'チェックサム照合',
    tagline: 'ファイルのハッシュを期待値と照合。',
    description:
      'ファイルのSHA-256/512ハッシュを計算し、期待する値と比較して整合性を確認します。すべてブラウザ内で処理します。',
    keywords: ['チェックサム 照合', 'ハッシュ 確認', 'sha256 検証', 'ファイル 整合性', 'hash 比較'],
  },
  'code-case': {
    name: 'コード命名ケース変換',
    tagline: 'camelCase・snake_case・kebab-caseなどを相互変換。',
    description:
      '変数や識別子の名前をcamelCase・snake_case・kebab-case・PascalCase・CONSTANT_CASEへ相互変換します。ブラウザ内で完結します。',
    keywords: ['ケース変換', 'スネークケース', 'キャメルケース', 'case converter', '命名 変換'],
  },
  'compound-interest': {
    name: '複利計算',
    tagline: '複利と積立で資産の成長を試算。',
    description:
      '元本・利率・期間・定期積立を入力すると、複利での成長と利息合計を試算します。計算はブラウザ内で行われます。',
    keywords: ['複利 計算', '積立 シミュレーション', '利息 計算', '資産運用 計算', 'compound interest'],
  },
  'count-occurrences': {
    name: '出現回数カウント',
    tagline: '単語やフレーズの出現回数を数える。',
    description:
      'テキスト中の文字列の出現回数を数えます。大文字小文字の区別や単語単位の指定が可能で、すべてブラウザ内で処理します。',
    keywords: ['出現回数 カウント', '単語 数える', '文字列 検索', '出現頻度', 'count occurrences'],
  },
  'css-minify': {
    name: 'CSS圧縮・整形',
    tagline: 'CSSを瞬時に圧縮または整形。',
    description:
      '空白やコメントを除去してCSSを圧縮したり、揃ったインデントで整形したりできます。すべてブラウザ内で処理します。',
    keywords: ['css 圧縮', 'css 整形', 'css minify', 'css フォーマット', 'css 軽量化'],
  },
  'css-specificity': {
    name: 'CSS詳細度の計算',
    tagline: '任意のCSSセレクタの詳細度を計算。',
    description:
      'CSSセレクタを入力すると詳細度（id・class・要素の数）を計算し、どのルールが優先されるかを把握できます。ブラウザ内で完結します。',
    keywords: ['css 詳細度', 'セレクタ 優先度', 'specificity 計算', 'css 優先順位', 'セレクタ 重み'],
  },
  'csv-stats': {
    name: 'CSV統計',
    tagline: 'CSVの列ごとの統計を取得。',
    description:
      'CSVを解析し、数値列の件数・合計・平均・最小・最大・欠損値を列ごとに表示します。処理はブラウザ内で行われます。',
    keywords: ['csv 統計', 'csv 集計', 'csv 解析', 'csv サマリー', 'csv データ分析'],
  },
  'electricity-cost': {
    name: '電気代計算',
    tagline: '家電の使用コストを概算。',
    description:
      '消費電力・使用時間・1kWhあたりの料金を入力すると、1日・1か月・1年の電気代を概算します。計算はブラウザ内で行われます。',
    keywords: ['電気代 計算', '消費電力 コスト', 'kwh 料金', '家電 電気代', '電力 コスト 計算'],
  },
  'extract-emails': {
    name: 'メールアドレス抽出',
    tagline: 'テキストから全メールアドレスを抜き出す。',
    description:
      '貼り付けたテキストからすべてのメールアドレスを抽出します。重複除去と1行1件の出力に対応し、ブラウザ内で処理します。',
    keywords: ['メール 抽出', 'メールアドレス 抜き出し', 'email 抽出', 'アドレス 収集', 'extract emails'],
  },
  'extract-urls': {
    name: 'URL抽出',
    tagline: 'テキストから全リンク・URLを抜き出す。',
    description:
      '貼り付けたテキストからすべてのURLを抽出します。重複除去と1行1件の出力に対応し、すべてブラウザ内で処理します。',
    keywords: ['url 抽出', 'リンク 抜き出し', 'url 収集', 'リンク 抽出', 'extract urls'],
  },
  'gif-reverse': {
    name: 'GIF逆再生',
    tagline: 'GIFを逆向きに再生。',
    description:
      'アニメーションGIFのフレーム順を反転し、逆再生するループを作成します。すべてブラウザ内で処理されます。',
    keywords: ['gif 逆再生', 'gif 反転', 'gif 逆向き', 'reverse gif', 'gif リバース'],
  },
  'image-black-white': {
    name: '白黒・グレースケール変換',
    tagline: '画像をグレースケールや純白黒に変換。',
    description:
      '画像をグレースケールに変換したり、しきい値で純粋な白黒にできます。レベルは調整可能で、すべてブラウザ内で処理します。',
    keywords: ['白黒 変換', 'グレースケール', 'モノクロ 変換', 'image 白黒', '画像 グレースケール'],
  },
  'image-info': {
    name: '画像情報ビューア',
    tagline: '画像の寸法・形式・サイズ・比率を確認。',
    description:
      '画像をドロップするだけで、幅・高さ・アスペクト比・ファイル形式・サイズを即座に表示します。アップロード不要、ブラウザ内で完結します。',
    keywords: ['画像 情報', '画像 寸法', '画像 サイズ 確認', '画像 プロパティ', '解像度 確認'],
  },
  'json-sort-keys': {
    name: 'JSONキーの並べ替え',
    tagline: 'JSONオブジェクトのキーをアルファベット順に。',
    description:
      'ネストしたオブジェクトも含め、JSONのキーをすべてアルファベット順に並べ替えます。整形出力も選べ、ブラウザ内で処理します。',
    keywords: ['json キー 並べ替え', 'json ソート', 'json キー 順', 'json sort keys', 'json 整列'],
  },
  'json-stats': {
    name: 'JSON構造アナライザー',
    tagline: 'JSONのキー数・深さ・型を調べる。',
    description:
      'JSONを解析して総キー数・最大ネスト深さ・配列サイズ・値の型の内訳を表示します。処理はブラウザ内で行われます。',
    keywords: ['json 解析', 'json 構造', 'json 深さ', 'json 統計', 'json 調査'],
  },
  'json-to-python': {
    name: 'JSON→Python変換',
    tagline: 'JSONからPythonのdataclass・TypedDictを生成。',
    description:
      'JSONを貼り付けると、型を推論したPythonのdataclassやTypedDictを生成します。すべてブラウザ内で処理します。',
    keywords: ['json python 変換', 'json dataclass', 'json typeddict', 'python 型 生成', 'json to python'],
  },
  'lorem-ko': {
    name: '韓国語ダミーテキスト',
    tagline: 'モックアップ用の韓国語ダミー文を生成。',
    description:
      'デザインのモックアップ向けに、自然な見た目の韓国語の段落・文・単語を生成します。すべてブラウザ内で処理します。',
    keywords: ['韓国語 ダミー', 'ハングル ダミーテキスト', '韓国語 プレースホルダ', 'ダミー文 韓国語', 'lorem ipsum'],
  },
  'pace-calc': {
    name: 'ランニングペース計算',
    tagline: 'ランニングのペース・時間・距離を計算。',
    description:
      '距離とタイムからペースを計算したり、目標ペースからゴールタイムを予測したりできます。kmとマイルに対応、ブラウザ内で完結します。',
    keywords: ['ペース 計算', 'ランニング ペース', 'マラソン ペース', 'キロ何分', 'タイム 計算'],
  },
  'pdf-resize': {
    name: 'PDFページのサイズ変更',
    tagline: 'PDFのページをA4・Letterなどに拡縮。',
    description:
      'PDFの全ページを標準用紙サイズ（A4・Letterなど）に変更し、内容を拡縮して中央に配置します。すべてブラウザ内で処理します。',
    keywords: ['pdf サイズ変更', 'pdf ページサイズ', 'pdf a4 変換', 'pdf 用紙サイズ', 'pdf 拡縮'],
  },
  'random-bytes': {
    name: 'ランダムバイト・トークン生成',
    tagline: '暗号学的に安全なランダムトークンを生成。',
    description:
      'Web Crypto APIで安全なランダムバイトをhex・Base64・UUIDとして生成します。鍵やトークンに便利、ブラウザ内で完結します。',
    keywords: ['ランダムバイト 生成', 'トークン 生成', 'ランダム hex', '暗号 乱数', '秘密鍵 生成'],
  },
  'ratio-calc': {
    name: '比率計算',
    tagline: '比例（a:b = c:x）を解き、比を簡約。',
    description:
      '比例の不明な項を求めたり、比を最も簡単な形に約分したりできます。すべてブラウザ内で処理します。',
    keywords: ['比率 計算', '比例 計算', '比 簡約', '比 解く', 'ratio calculator'],
  },
  'remove-accents': {
    name: 'アクセント記号の除去',
    tagline: 'テキストから発音区別符号を除去（café → cafe）。',
    description:
      'Unicode正規化でアクセントや発音区別符号を除去し、プレーンなASCII向けの出力を作ります。ブラウザ内で完結します。',
    keywords: ['アクセント 除去', '発音区別符号 削除', 'ダイアクリティカル 除去', 'accent remover', 'テキスト 正規化'],
  },
  'remove-line-breaks': {
    name: '改行の削除',
    tagline: '複数行を1行に結合、または改行を空白に置換。',
    description:
      '改行を取り除いてテキストを1行に結合します。空白への置換や段落区切りの維持も選べ、ブラウザ内で完結します。',
    keywords: ['改行 削除', '行 結合', '改行 除去', 'テキスト 1行化', '改行コード 削除'],
  },
  'sleep-calc': {
    name: '睡眠時間計算',
    tagline: '睡眠サイクルから最適な就寝・起床時刻を算出。',
    description:
      '90分の睡眠サイクルと入眠までの時間をもとに、最適な就寝時刻や起床時刻を提案します。計算はブラウザ内で行われます。',
    keywords: ['睡眠 計算', '就寝時刻 計算', '睡眠サイクル', '起床時刻', '寝る時間 計算'],
  },
  'time-duration': {
    name: '時間差・経過時間の計算',
    tagline: '2つの時刻の差を求め、時間を加減算。',
    description:
      '2つの時刻の間の長さを計算したり、時・分・秒を加算・減算したりできます。すべてブラウザ内で処理します。',
    keywords: ['時間差 計算', '経過時間', '時間 加算', '時間 減算', '時間 計算'],
  },
  'unit-price': {
    name: '単価比較',
    tagline: '単位あたりの価格で商品を比較。',
    description:
      '複数商品の容量と価格を入力すると、単位あたりが最も安い商品が分かります。買い物に便利、ブラウザ内で完結します。',
    keywords: ['単価 計算', '単位あたり 価格', 'コスト 比較', '価格 比較', 'お得 計算'],
  },
  'upside-down': {
    name: '上下反転テキスト',
    tagline: 'Unicode文字でテキストを上下反転。',
    description:
      'テキストを上下反転したUnicode文字に変換します。SNS投稿やユーザー名の遊びに使えて、すべてブラウザ内で処理します。',
    keywords: ['上下反転 テキスト', '反転 文字', '逆さ 文字', 'umop apisdn', 'upside down'],
  },
  'uuid-namespace': {
    name: 'UUID v5ジェネレーター',
    tagline: '決定的な名前空間UUID（v5）を生成。',
    description:
      '名前空間と名前からSHA-1を使ってRFC 4122のバージョン5 UUIDを生成します。同じ入力なら常に同じUUIDに。ブラウザ内で完結します。',
    keywords: ['uuid v5', '名前空間 uuid', '決定的 uuid', 'uuid 生成', 'rfc 4122'],
  },
  'video-contact-sheet': {
    name: '動画コンタクトシート',
    tagline: '動画からサムネイル一覧を作成。',
    description:
      '動画から等間隔でフレームを抽出し、1枚のコンタクトシート画像に並べます。処理はブラウザ内で行われます。',
    keywords: ['動画 コンタクトシート', '動画 サムネイル 一覧', 'フレーム グリッド', '動画 プレビュー', 'サムネイル 一覧'],
  },
  'wrap-text': {
    name: 'テキスト折り返し',
    tagline: '指定した桁幅でテキストを折り返す。',
    description:
      '単語を分断せずに指定文字幅で長い行を折り返します。メールやコメント、プレーンテキストに便利で、ブラウザ内で完結します。',
    keywords: ['テキスト 折り返し', 'ワードラップ', '折り返し', '行幅 揃え', 'wrap text'],
  },
  'bill-split': {
    name: '割り勘計算機',
    tagline: '税・チップを含めて人数で割り勘。',
    description:
      '税金やチップを含めた合計金額を、好きな人数で均等に割り勘できます。すべてブラウザ内で計算します。',
    keywords: ['割り勘', '割り勘 計算', 'チップ', 'bill split', 'split the check'],
  },
  countdown: {
    name: 'カウントダウンタイマー',
    tagline: '目標の日時までをリアルタイムで秒読み。',
    description:
      '指定した目標の日時までの残り時間をリアルタイムでカウントダウンします。ブラウザ内で完結します。',
    keywords: ['カウントダウン', 'タイマー', 'd-day', 'イベント 残り時間', 'countdown'],
  },
  'crontab-builder': {
    name: 'crontabビルダー',
    tagline: 'cron式を視覚的に組み立てる。',
    description:
      'かんたんな選択肢からcron式を組み立て、次回以降の実行タイミングをプレビューできます。ブラウザ内で動作します。',
    keywords: ['cron', 'crontab', 'スケジュール', 'cron 式', 'schedule'],
  },
  'css-clamp': {
    name: 'CSS clamp()ジェネレーター',
    tagline: 'レスポンシブな可変サイズ用のclamp()値を算出。',
    description:
      'フォントサイズや余白を画面幅に応じて滑らかに変化させる、レスポンシブなCSS clamp()値を生成します。ブラウザ内で完結します。',
    keywords: ['css clamp', '可変 フォント', 'レスポンシブ', 'fluid typography', 'clamp'],
  },
  'csv-to-html': {
    name: 'CSV→HTMLテーブル変換',
    tagline: 'CSVをHTMLの表に変換。',
    description:
      'CSVデータをHTMLのテーブルマークアップに変換します。アップロード不要で、すべてブラウザ内で処理します。',
    keywords: ['csv html', 'csv 表 変換', 'テーブル', 'csv to html', 'table'],
  },
  'decision-wheel': {
    name: '抽選ルーレット',
    tagline: 'ルーレットを回して候補を1つ選ぶ。',
    description:
      '選択肢を入力してルーレットを回し、ランダムに1つを選びます。決めかねたときの抽選に便利で、ブラウザ内で完結します。',
    keywords: ['ルーレット', '抽選', 'ランダム 選択', 'decision wheel', 'spinner'],
  },
  'hash-identifier': {
    name: 'ハッシュ判定ツール',
    tagline: '長さと形式からハッシュの種類を推測。',
    description:
      'ハッシュ値の長さや形式から、MD5・SHA-1/256・bcryptなど、考えられるハッシュアルゴリズムを推定します。ブラウザ内で完結します。',
    keywords: ['ハッシュ 判定', 'md5', 'sha', 'ハッシュ 種類', 'hash identifier'],
  },
  'iban-validator': {
    name: 'IBANバリデーター',
    tagline: 'IBANのチェックサムと形式を検証。',
    description:
      'IBAN（国際銀行口座番号）のチェックサムと形式が正しいかを検証します。すべてブラウザ内で処理します。',
    keywords: ['iban 検証', 'iban チェック', '銀行 口座', 'checksum', 'iban validator'],
  },
  'ideal-weight': {
    name: '理想体重計算機',
    tagline: '身長から理想体重を算出。',
    description:
      '身長と性別から、目安となる理想体重の範囲を算出します。ブラウザ内で計算が完結します。',
    keywords: ['理想体重', '適正 体重', 'bmi', 'ideal weight', 'healthy weight'],
  },
  'image-sepia': {
    name: 'セピア加工',
    tagline: '画像にセピア調を適用。',
    description:
      '画像に温かみのあるセピア調を加えます。アップロード不要で、すべてブラウザ内で処理します。',
    keywords: ['セピア', 'ヴィンテージ', 'フィルター', 'sepia', 'vintage'],
  },
  'image-tint': {
    name: '色味オーバーレイ',
    tagline: '画像に単色の色味を重ねる。',
    description:
      '画像に単色のカラーオーバーレイを重ねて、全体の色味を調整します。すべてブラウザ内で処理します。',
    keywords: ['色味', 'カラーオーバーレイ', 'フィルター', 'tint', 'color overlay'],
  },
  'image-vignette': {
    name: 'ビネット加工',
    tagline: '画像の四隅を暗くする効果を追加。',
    description:
      '画像の四隅を暗く落とすビネット効果を加え、被写体を引き立てます。すべてブラウザ内で処理します。',
    keywords: ['ビネット', '四隅 暗く', 'フィルター', 'vignette', 'dark edges'],
  },
  'json-schema': {
    name: 'JSONスキーマ生成',
    tagline: 'JSONサンプルからJSON Schemaを推論。',
    description:
      'サンプルのJSONドキュメントから、対応するJSON Schemaを生成します。ブラウザ内で完結します。',
    keywords: ['json schema', 'json スキーマ', 'バリデーション', 'json', 'schema'],
  },
  'list-shuffle': {
    name: 'リストシャッフル',
    tagline: '行のリストをランダムに並べ替える。',
    description:
      '行ごとのリストをランダムな順番にシャッフルします。抽選や順番決めに便利で、すべてブラウザ内で処理します。',
    keywords: ['シャッフル', 'ランダム 並べ替え', '順番 決め', 'shuffle list', 'random order'],
  },
  'luhn-generator': {
    name: 'Luhn番号ジェネレーター',
    tagline: 'Luhnチェックに通るテスト番号を生成。',
    description:
      'Luhnチェックサムを通過するテスト用の番号を生成します。開発・検証用途向けで、ブラウザ内で完結します。',
    keywords: ['luhn', 'テスト カード番号', 'checksum', 'luhn generator', 'チェックサム'],
  },
  'magic-8-ball': {
    name: 'マジック8ボール',
    tagline: 'どんな質問にもランダムでイエス/ノー。',
    description:
      'イエス/ノーで答えられる質問を投げかけると、マジック8ボールがランダムな答えを返します。ブラウザ内で完結します。',
    keywords: ['マジック8ボール', 'イエス ノー', '占い', 'magic 8 ball', 'yes no'],
  },
  'markdown-table-gen': {
    name: 'Markdownテーブル生成',
    tagline: '行と列からMarkdownの表を作成。',
    description:
      '入力した行と列から、GitHub Flavored Markdown形式の表をすばやく作成します。ブラウザ内で完結します。',
    keywords: ['markdown 表', 'markdown テーブル', 'github', 'markdown table', 'generator'],
  },
  'meta-tags': {
    name: 'metaタグジェネレーター',
    tagline: 'OGP・Twitterカードのmetaタグを生成。',
    description:
      'ページ向けのSEO・Open Graph・Twitterカードのmetaタグを生成します。ブラウザ内で完結します。',
    keywords: ['meta タグ', 'ogp', 'twitter カード', 'seo', 'open graph'],
  },
  metronome: {
    name: 'メトロノーム',
    tagline: 'BPMと拍子で刻むクリック音メトロノーム。',
    description:
      '指定したBPMと拍子に合わせてクリック音を鳴らす、ブラウザ完結のメトロノームです。',
    keywords: ['メトロノーム', 'bpm', 'テンポ', '拍子', 'metronome'],
  },
  numerology: {
    name: '数秘術計算機',
    tagline: 'あなたのライフパスナンバーを算出。',
    description:
      '生年月日と氏名から、数秘術のライフパスナンバーや姓名の数を計算します。ブラウザ内で完結します。',
    keywords: ['数秘術', 'ライフパスナンバー', '運命数', 'numerology', 'life path'],
  },
  'pdf-delete-pages': {
    name: 'PDFページ削除',
    tagline: 'PDFから特定のページを削除。',
    description:
      'PDFファイルから指定したページを削除します。アップロード不要で、すべてブラウザ内で処理します。',
    keywords: ['pdf ページ 削除', 'ページ 除去', 'pdf 編集', 'delete pdf pages', 'remove pages'],
  },
  'random-pin': {
    name: 'PINジェネレーター',
    tagline: '安全な数字のPINをランダム生成。',
    description:
      '任意の桁数で、安全なランダム数字のPINコードを生成します。ブラウザ内で完結します。',
    keywords: ['pin 生成', 'ランダム pin', '暗証番号', 'pin generator', 'numeric'],
  },
  'readability-score': {
    name: '可読性スコア',
    tagline: 'Fleschの読みやすさと学年レベルを算出。',
    description:
      '英文テキストのFleschリーディングイース（読みやすさ）と学年レベルを計算します。ブラウザ内で完結します。',
    keywords: ['可読性', '読みやすさ', 'flesch', 'readability', 'grade level'],
  },
  'robots-txt': {
    name: 'robots.txtジェネレーター',
    tagline: 'クロールルール付きのrobots.txtを作成。',
    description:
      'allow/disallowルールとサイトマップを含むrobots.txtファイルを生成します。ブラウザ内で完結します。',
    keywords: ['robots.txt', 'クローラー', 'seo', 'disallow', 'crawler'],
  },
  'screenshot-shadow': {
    name: 'スクリーンショット装飾',
    tagline: '背景・余白・影でスクショを美しく。',
    description:
      'グラデーション背景・余白・影を加えて、スクリーンショットを洗練された見た目に仕上げます。すべてブラウザ内で処理します。',
    keywords: ['スクリーンショット 装飾', '影', '背景', 'screenshot beautifier', 'shadow'],
  },
  'sort-numbers': {
    name: '数値ソート',
    tagline: '数値を並べ替えて合計と平均も表示。',
    description:
      '数値のリストを昇順・降順に並べ替え、あわせて合計と平均も表示します。ブラウザ内で完結します。',
    keywords: ['数値 ソート', '昇順 降順', '合計 平均', 'sort numbers', 'sum'],
  },
  'strikethrough-text': {
    name: '取り消し線テキスト',
    tagline: 'Unicodeの取り消し線・下線テキストを作成。',
    description:
      'テキストをUnicodeの取り消し線や下線付き文字に変換します。SNS投稿に使えて、すべてブラウザ内で処理します。',
    keywords: ['取り消し線 テキスト', '下線 文字', 'unicode', 'strikethrough', 'underline'],
  },
  'string-escape': {
    name: '文字列エスケープ',
    tagline: 'JSON・JS・HTML・SQL向けにエスケープ/解除。',
    description:
      '文字列をJSON・JavaScript・HTML・SQL向けにエスケープしたり、エスケープを解除したりします。ブラウザ内で完結します。',
    keywords: ['エスケープ', 'アンエスケープ', 'json', 'html', 'escape'],
  },
  'superscript-text': {
    name: '上付き・下付き文字',
    tagline: 'Unicodeの上付き・下付き文字を作成。',
    description:
      'テキストをUnicodeの上付き文字や下付き文字に変換します。すべてブラウザ内で処理します。',
    keywords: ['上付き 文字', '下付き 文字', 'unicode', 'superscript', 'subscript'],
  },
  'syllable-counter': {
    name: '音節カウンター',
    tagline: '英文の音節数と単語数をカウント。',
    description:
      '英文テキストの音節数と単語数を数えます。詩や俳句づくりに便利で、ブラウザ内で完結します。',
    keywords: ['音節 カウント', '単語数', '俳句', 'syllable counter', 'haiku'],
  },
  'tailwind-shades': {
    name: 'Tailwindシェード生成',
    tagline: 'ベースカラーから50〜950のシェードを生成。',
    description:
      'ベースカラーから、Tailwind風の50〜950のカラーシェードスケールを生成します。ブラウザ内で完結します。',
    keywords: ['tailwind', 'カラー シェード', 'パレット', 'tailwind shades', 'palette'],
  },
  'unicode-lookup': {
    name: 'Unicodeインスペクター',
    tagline: 'コードポイント・名称・UTF-8バイトを調査。',
    description:
      '任意のテキストについて、Unicodeのコードポイント・文字名・UTF-8エンコーディングを調べられます。ブラウザ内で完結します。',
    keywords: ['unicode', 'コードポイント', 'utf-8', 'unicode lookup', 'code point'],
  },
  'world-clock': {
    name: '世界時計',
    tagline: '各都市の現在時刻を一度に表示。',
    description:
      '複数の都市やタイムゾーンの現在時刻を一度にまとめて確認できます。ブラウザ内で完結します。',
    keywords: ['世界時計', 'タイムゾーン', '現在時刻', 'world clock', 'time zones'],
  },
  zodiac: {
    name: '星座判定',
    tagline: '誕生日からあなたの星座を診断。',
    description:
      '生年月日から、あなたの12星座（占星術上の星座）を判定します。ブラウザ内で完結します。',
    keywords: ['星座', '占星術', '誕生日 星座', 'zodiac sign', 'horoscope'],
  },

  // ── オーディオ ─────────────────────────────────────────────────────────────
  'bpm-tap': {
    name: 'BPMタップカウンター',
    tagline: 'ビートに合わせてタップしてBPMを計測。',
    description:
      'キーやボタンを曲のビートに合わせてタップするだけで、テンポ（BPM）をリアルタイムの平均でその場に計測します。ブラウザ内で完結。',
    keywords: ['bpm 計測', 'タップ bpm', 'テンポ カウンター', 'bpm tapper', 'tempo'],
  },

  // ── 開発者ツール ───────────────────────────────────────────────────────────
  'color-mix': {
    name: 'カラーミキサー',
    tagline: '2色を指定した比率でブレンド。',
    description:
      '2つのHEXカラーを任意の比率で混ぜ合わせ、ブレンド後の色をライブプレビューで確認。HEX/RGBをそのままコピーできます。',
    keywords: ['色 混合', 'カラーミキサー', 'hex ブレンド', 'color mixer', '色 ブレンド'],
  },
  'csv-to-sql': {
    name: 'CSVをSQLに変換',
    tagline: 'CSVをSQLのINSERT文に変換。',
    description:
      'CSVの各行を指定テーブルのINSERT文に変換。ヘッダー行をカラム名にマッピングします。すべてブラウザ内で処理。',
    keywords: ['csv sql 変換', 'sql insert', 'csv インポート', 'csv to sql', 'insert 文'],
  },
  'git-command-builder': {
    name: 'Gitコマンドビルダー',
    tagline: 'オプションからよく使うgitコマンドを生成。',
    description:
      'コミット・ブランチ・リセット・スタッシュ・取り消しなどの作業を選ぶと、そのままコピーして実行できる正確なgitコマンドを生成します。',
    keywords: ['git コマンド', 'git ジェネレーター', 'git 早見表', 'git command', 'git cheatsheet'],
  },
  'htaccess-redirect': {
    name: '.htaccessリダイレクト生成',
    tagline: 'Apacheの.htaccessリダイレクトを生成。',
    description:
      '301/302リダイレクトやHTTPS強制、www／非wwwの統一ルールをApacheの.htaccess用に生成。ブラウザ内で完結します。',
    keywords: ['htaccess 生成', '301 リダイレクト', 'https 強制', 'htaccess generator', 'リダイレクト'],
  },
  'mime-type-lookup': {
    name: 'MIMEタイプ検索',
    tagline: '拡張子からMIMEタイプを、その逆も検索。',
    description:
      '任意のファイル拡張子に対応するMIME（コンテンツ）タイプを調べたり、MIMEタイプから拡張子を逆引きしたりできます。',
    keywords: ['mime タイプ', 'コンテンツ タイプ', 'ファイル 拡張子', 'mime type', 'content type'],
  },
  'query-string-builder': {
    name: 'クエリ文字列ビルダー',
    tagline: 'キーと値からURLのクエリ文字列を生成。',
    description:
      'キーと値のペアを入力すると、URLに付加できる正しくエンコードされたクエリ文字列を生成します。ブラウザ内で完結。',
    keywords: ['クエリ文字列', 'url パラメータ', 'querystring', 'query string', 'url エンコード'],
  },
  'regex-escape': {
    name: '正規表現エスケープ',
    tagline: '正規表現の特殊文字をエスケープ。',
    description:
      '任意のテキスト内の正規表現メタ文字をエスケープし、正規表現の中でそのまま文字どおりにマッチするようにします。',
    keywords: ['正規表現 エスケープ', 'regex エスケープ', 'メタ文字', 'regex escape', 'literal regex'],
  },
  'semver-checker': {
    name: 'Semverチェッカー',
    tagline: 'セマンティックバージョンを解析・比較。',
    description:
      'セマンティックバージョンを解析し、どちらが新しいかを比較。major/minor/patch/プレリリースの各要素も確認できます。',
    keywords: ['semver', 'セマンティック バージョン', 'バージョン 比較', 'version compare', 'バージョニング'],
  },
  'sql-in-clause': {
    name: 'SQL IN句ビルダー',
    tagline: 'リストをSQLのIN (...)句に変換。',
    description:
      '値のリストを貼り付けると、クエリにそのまま貼れる引用符付き・カンマ区切りのSQL IN (...)句を生成します。ブラウザ内で処理。',
    keywords: ['sql in 句', 'in 句 生成', 'sql リスト', 'sql in clause', 'in clause'],
  },

  // ── テキスト ───────────────────────────────────────────────────────────────
  'markdown-to-text': {
    name: 'Markdownをプレーンテキストに',
    tagline: 'Markdown記法を除去してプレーンテキストに。',
    description:
      '見出し・太字・リンク・リスト・コードなどのMarkdown記法を除去し、読みやすいプレーンテキストにします。ブラウザ内で完結。',
    keywords: ['markdown テキスト', 'markdown 除去', 'strip markdown', 'markdown to text', 'プレーンテキスト'],
  },
  'pig-latin': {
    name: 'ピッグラテン翻訳',
    tagline: '英語テキストをピッグラテンに変換。',
    description:
      '英単語を標準の母音／子音ルールでピッグラテンに変換します（例：hello → ellohay）。ブラウザ内で処理します。',
    keywords: ['pig latin', 'ピッグラテン', '英語 遊び', 'pig latin translator', '言葉遊び'],
  },
  'remove-emoji': {
    name: '絵文字を削除',
    tagline: 'テキストから絵文字や記号を除去。',
    description:
      'テキストからすべての絵文字や絵文字的な記号を取り除き、きれいなプレーンテキストだけを残します。ブラウザ内で完結。',
    keywords: ['絵文字 削除', '絵文字 除去', 'strip emoji', 'remove emoji', '記号 削除'],
  },
  'remove-numbers': {
    name: '数字を削除',
    tagline: 'テキストからすべての数字を除去。',
    description:
      'テキストからすべての数字（0〜9）をワンクリックで削除。空白を残すか詰めるかも選べます。ブラウザ内で処理します。',
    keywords: ['数字 削除', '数字 除去', 'remove numbers', 'strip digits', '桁 削除'],
  },
  'reverse-words': {
    name: '単語の並び順を反転',
    tagline: 'テキスト中の単語の順序を反転。',
    description:
      '各行の単語の順序を逆にします。パズルやキャプション、語学の練習などに便利です。すべてブラウザ内で処理します。',
    keywords: ['単語 反転', '語順 反転', 'reverse words', 'flip words', '並び替え'],
  },
  'smart-quotes': {
    name: 'スマートクォート変換',
    tagline: 'まっすぐな引用符を曲がった引用符に、その逆も。',
    description:
      'まっすぐな引用符（直線型）を組版用の曲がった引用符（カーリー）に変換、または元のまっすぐな引用符に戻します。ブラウザ内で完結。',
    keywords: ['スマートクォート', 'カーリークォート', '引用符 変換', 'smart quotes', '組版'],
  },

  // ── ユーティリティ ─────────────────────────────────────────────────────────
  'currency-format': {
    name: '通貨フォーマッター',
    tagline: '数値を桁区切り付きの通貨表記に整形。',
    description:
      '任意の数値を桁区切りと通貨記号付きで、さまざまなロケールに合わせて整形します（為替レートの換算はありません）。ブラウザ内で処理。',
    keywords: ['通貨 フォーマット', '数値 整形', '桁区切り', 'currency formatter', 'number format'],
  },
  'date-add': {
    name: '日付の加算・減算',
    tagline: '日付に日・週・月・年を足し引き。',
    description:
      '起点となる日付を選び、日・週・月・年を加算または減算して、その結果の日付を求めます。ブラウザ内で完結します。',
    keywords: ['日付 加算', '日付 計算', '日数 加算', 'date add', 'date calculator'],
  },
  'grade-calc': {
    name: '成績計算機',
    tagline: '加重平均で最終成績を算出。',
    description:
      '各項目の点数と配点（重み）を入力すると、加重平均と最終成績を計算します。ブラウザ内で処理します。',
    keywords: ['成績 計算', '加重平均', '最終 成績', 'grade calculator', 'weighted grade'],
  },
  'markup-calc': {
    name: 'マークアップ・利益率計算機',
    tagline: '原価と利益率から販売価格を算出。',
    description:
      '原価とマークアップまたは利益率（％）を入力すると、販売価格・利益・もう一方の比率を計算します。ブラウザ内で完結。',
    keywords: ['マークアップ 計算', '利益率 計算', '販売価格', 'markup calculator', 'margin'],
  },
  'ovulation-calc': {
    name: '排卵日計算機',
    tagline: '妊娠しやすい時期と排卵日を予測。',
    description:
      '最終月経の開始日と月経周期の長さから、排卵日と妊娠しやすい時期（排卵期）を予測します。ブラウザ内で完結します。',
    keywords: ['排卵日 計算', '妊娠しやすい時期', '排卵日 予測', 'ovulation calculator', 'fertile window'],
  },
  'paint-calc': {
    name: 'ペンキ計算機',
    tagline: '壁の塗装に必要なペンキの量を概算。',
    description:
      '壁の寸法・塗り回数・塗布率を入力すると、必要なペンキの量（リットルまたはガロン）を概算します。ブラウザ内で完結。',
    keywords: ['ペンキ 計算', '塗料 量', '塗装 必要量', 'paint calculator', 'paint coverage'],
  },
  'pregnancy-due-date': {
    name: '出産予定日計算機',
    tagline: '出産予定日と現在の妊娠週数を予測。',
    description:
      '最終月経開始日から、出産予定日と現在の妊娠週数（妊娠の進み具合）を計算します。ブラウザ内で完結します。',
    keywords: ['出産予定日 計算', '妊娠 計算', '妊娠 週数', 'due date calculator', 'pregnancy'],
  },
  'random-emoji': {
    name: 'ランダム絵文字ジェネレーター',
    tagline: 'ランダムな絵文字を選んでコピー。',
    description:
      'カテゴリ別にランダムな絵文字を1つまたは複数生成し、クリックでコピーできます。ブラウザ内で完結します。',
    keywords: ['ランダム 絵文字', '絵文字 生成', 'random emoji', 'emoji generator', '絵文字'],
  },
  'random-team-generator': {
    name: 'ランダムチーム分け',
    tagline: '名前のリストをランダムなチームに分割。',
    description:
      '名前を貼り付けてシャッフルし、指定した数のバランスの取れたランダムなチームやグループに振り分けます。ブラウザ内で処理。',
    keywords: ['チーム 分け', 'グループ 生成', 'チーム 抽選', 'random team generator', 'team picker'],
  },
  'time-card-calc': {
    name: 'タイムカード計算機',
    tagline: '出退勤時刻から労働時間を集計。',
    description:
      '出勤・退勤の時刻と休憩を入力すると、1日および1週間の労働時間と給与を合計します。ブラウザ内で完結します。',
    keywords: ['タイムカード 計算', '労働時間', '勤務時間 計算', 'time card calculator', 'timesheet'],
  },

  // ── セキュリティ ───────────────────────────────────────────────────────────
  'imei-validate': {
    name: 'IMEIバリデーター',
    tagline: 'Luhnチェックで端末のIMEIを検証。',
    description:
      '15桁のIMEIがLuhnチェックサムを通過し、正しい桁数かどうかを検証します。すべてブラウザ内で処理します。',
    keywords: ['imei 検証', 'imei チェック', 'imei luhn', 'imei validator', '端末識別番号'],
  },
  'isbn-validate': {
    name: 'ISBNバリデーター',
    tagline: 'ISBN-10とISBN-13のチェックサムを検証。',
    description:
      'ISBN-10またはISBN-13のチェックサムと書式が正しいかを検証し、両者の相互変換も行えます。ブラウザ内で完結。',
    keywords: ['isbn 検証', 'isbn チェックサム', 'isbn 13', 'isbn validator', '書籍コード'],
  },
  'vin-validate': {
    name: 'VINバリデーター',
    tagline: '車両VINのチェックディジットを検証。',
    description:
      '17文字の車両識別番号（VIN）のチェックディジットと書式（ISO 3779）を検証します。ブラウザ内で完結します。',
    keywords: ['vin 検証', 'vin チェックディジット', '車台番号', 'vin validator', 'vehicle id'],
  },

  // ── ドキュメント ───────────────────────────────────────────────────────────
  'image-noise': {
    name: '画像にノイズ・グレインを追加',
    tagline: '写真にフィルムグレインやノイズを追加。',
    description:
      '画像に調整可能なフィルムグレインやノイズを加えて、ヴィンテージ風や質感のある仕上がりに。すべてブラウザ内で処理します。',
    keywords: ['ノイズ 追加', 'フィルムグレイン', '写真 ノイズ', 'add noise', 'film grain'],
  },
  'image-threshold': {
    name: '画像の2値化（しきい値）',
    tagline: '画像を純粋な白黒に2値化。',
    description:
      '明るさのしきい値を調整しながら、画像を純粋な白黒に変換します。スキャンやステンシルに最適。ブラウザ内で完結します。',
    keywords: ['画像 2値化', '画像 白黒', 'binarize', 'image threshold', 'しきい値'],
  },

  // ── パック6 追加 ─────────────────────────────────────────────────────────
  'age-difference': {
    name: '年齢差計算ツール',
    tagline: '2人の年齢差をすぐに割り出す。',
    description:
      '2つの生年月日から、年・月・日まで正確な年齢差を計算します。すべてブラウザ内で完結します。',
    keywords: ['年齢差 計算', '年の差', 'age difference', '生年月日 差', 'age gap'],
  },
  base58: {
    name: 'Base58 エンコード / デコード',
    tagline: 'Base58（ビットコイン用アルファベット）を相互変換。',
    description:
      'ビットコインのアルファベットを使い、テキストとBase58を相互変換します。紛らわしい0/O/I/lを含みません。ブラウザ内で処理します。',
    keywords: ['base58 エンコード', 'base58 デコード', 'base58 変換', 'bitcoin base58', 'ビットコイン'],
  },
  'bmr-calculator': {
    name: '基礎代謝量（BMR）計算ツール',
    tagline: '1日の基礎代謝量を手軽に見積もる。',
    description:
      '身長・体重・年齢・性別から、ミフリン-サンジョール式で基礎代謝量（BMR）を推定します。ブラウザ内で完結します。',
    keywords: ['基礎代謝量 計算', 'bmr 計算', '基礎代謝', 'mifflin st jeor', 'カロリー'],
  },
  'business-days': {
    name: '営業日計算ツール',
    tagline: '2つの日付の間の営業日数を数える。',
    description:
      '2つの日付の間の営業日数を、週末（および任意の祝日）を除いて数えます。ブラウザ内で計算します。',
    keywords: ['営業日 計算', '稼働日 数える', 'business days', '平日 日数', '週末 除く'],
  },
  'cooking-converter': {
    name: '料理の単位換算ツール',
    tagline: 'カップ・大さじ・ml・グラムを換算。',
    description:
      'よく使う食材について、カップ・大さじ・小さじ・ミリリットル・グラムを相互に換算します。ブラウザ内で完結します。',
    keywords: ['料理 単位 換算', 'カップ ml', '大さじ グラム', 'cooking converter', 'レシピ 換算'],
  },
  'credit-card-type': {
    name: 'クレジットカード種類判定ツール',
    tagline: 'カード番号からブランドを判定。',
    description:
      'カード番号の先頭から、Visa・Mastercard・Amex・Discoverなどのブランドを判定します。すべてブラウザ内で処理し、どこにも送信しません。',
    keywords: ['カード ブランド 判定', 'クレジットカード 種類', 'credit card type', 'カード番号', 'card brand'],
  },
  'css-grid': {
    name: 'CSS グリッドジェネレーター',
    tagline: 'CSS Gridのレイアウトを視覚的に生成。',
    description:
      '行・列・間隔を設定するだけで、ライブプレビュー付きですぐ使えるCSS Gridレイアウトのコードを生成します。',
    keywords: ['css grid ジェネレーター', 'グリッド レイアウト', 'css grid', 'グリッド 生成', 'レイアウト'],
  },
  'css-triangle': {
    name: 'CSS 三角形ジェネレーター',
    tagline: 'borderテクニックでCSSの三角形を生成。',
    description:
      '向き・サイズ・色を選ぶだけで、borderテクニックを使った純粋なCSSの三角形を生成します。',
    keywords: ['css 三角形 ジェネレーター', 'css triangle', 'border 三角形', 'css 三角', '三角形 生成'],
  },
  'dog-age-calc': {
    name: '犬の年齢計算ツール',
    tagline: '犬の年齢を人間の年齢に換算。',
    description:
      '古い「7倍」の俗説ではなく、体格を考慮した式で犬の年齢を人間の年齢に換算します。ブラウザ内で計算します。',
    keywords: ['犬 年齢 計算', '犬 人間 換算', 'dog age', '犬の年齢', 'dog years'],
  },
  'ean-validate': {
    name: 'EAN / UPC バリデーター',
    tagline: 'EAN-13・EAN-8・UPC-Aのチェックデジットを検証。',
    description:
      'EAN-13・EAN-8・UPC-Aのバーコード番号が正しいチェックサムを持つかを検証します。ブラウザ内で完結します。',
    keywords: ['ean 検証', 'upc 検証', 'バーコード チェックサム', 'ean validator', 'jan コード'],
  },
  'email-validator': {
    name: 'メールアドレス形式チェッカー',
    tagline: 'メールアドレスの形式を検証。',
    description:
      'メールアドレスの形式が正しいかを、1件ずつでもリストまとめてでも検証します。すべてブラウザ内で処理します。',
    keywords: ['メールアドレス 検証', 'メール 形式 チェック', 'email validator', 'メール 確認', 'email format'],
  },
  'hashtag-generator': {
    name: 'ハッシュタグ生成ツール',
    tagline: 'キーワードをSNS用ハッシュタグに。',
    description:
      'キーワードや文章を、InstagramやXなどの投稿に使えるきれいな#ハッシュタグに変換します。ブラウザ内で完結します。',
    keywords: ['ハッシュタグ 生成', 'インスタ ハッシュタグ', 'hashtag generator', 'sns タグ', 'instagram hashtags'],
  },
  'html-to-markdown': {
    name: 'HTMLをMarkdownに変換',
    tagline: 'HTMLをMarkdownへ変換。',
    description:
      'HTML（見出し・リンク・リスト・太字・コード）を、ドキュメントやREADMEに貼り付けられるきれいなMarkdownに変換します。',
    keywords: ['html markdown 変換', 'html to markdown', 'html md 変換', 'マークダウン 変換', 'html to md'],
  },
  'image-glitch': {
    name: 'グリッチ画像エフェクト',
    tagline: 'RGBシフトのグリッチ効果を加える。',
    description:
      '画像にRGBチャンネルのずれや走査線といった調整可能なグリッチ効果を適用します。すべてブラウザ内で処理します。',
    keywords: ['グリッチ 効果', '画像 グリッチ', 'glitch effect', 'rgb シフト', 'image glitch'],
  },
  'image-posterize': {
    name: '画像のポスタリゼーション',
    tagline: '画像の色数を減らしてポスター風に。',
    description:
      'チャンネルごとの色数を減らして写真をポスタリゼーションし、力強いポスター風の仕上がりにします。ブラウザ内で完結します。',
    keywords: ['ポスタリゼーション', 'ポスター 効果', 'posterize', '色数 削減', 'poster effect'],
  },
  leetspeak: {
    name: 'リートスピーク変換ツール',
    tagline: 'テキストを 1337 5p34k に変換。',
    description:
      '通常のテキストをリートスピーク（例: leet → 1337）に変換したり元に戻したりできます。置換の強さも調整可能。ブラウザ内で完結します。',
    keywords: ['リートスピーク 変換', 'leetspeak', 'leet 変換', '1337 文字', 'leet converter'],
  },
  'letter-frequency': {
    name: '文字出現頻度カウンター',
    tagline: '各文字の出現回数を数える。',
    description:
      'テキスト内で各文字が出現する頻度を分析します。暗号解読・パズル・言語分析に便利です。ブラウザ内で処理します。',
    keywords: ['文字 頻度', '文字 カウント', 'letter frequency', '出現頻度 分析', 'frequency analysis'],
  },
  'love-calculator': {
    name: '相性占い（ラブ計算機）',
    tagline: '名前で相性をはかる遊びツール。',
    description:
      '2人の名前を入れると、お遊びの相性スコアを表示します。結果は決まった値で、本気のアドバイスではありません。ブラウザ内で完結します。',
    keywords: ['相性占い', '名前 相性', 'love calculator', 'ラブ計算機', 'love test'],
  },
  'mac-address': {
    name: 'MACアドレス バリデーター',
    tagline: 'MACアドレスを検証・整形。',
    description:
      'MACアドレスを検証し、コロン・ハイフン・ドット区切りの形式や大文字小文字を相互変換します。ブラウザ内で処理します。',
    keywords: ['mac アドレス 検証', 'mac アドレス 形式', 'mac address validator', 'macアドレス 整形', 'mac format'],
  },
  'nanoid-gen': {
    name: 'NanoID ジェネレーター',
    tagline: 'URLセーフな一意IDを生成。',
    description:
      'Web Crypto APIを使って、任意の長さの短くURLセーフな一意IDを生成します。UUIDより小さい代替手段です。ブラウザ内で完結します。',
    keywords: ['nanoid 生成', '一意 id', 'nanoid generator', '短い id', 'short id'],
  },
  'noise-generator': {
    name: 'ホワイトノイズ生成ツール',
    tagline: 'ホワイト・ピンク・ブラウンノイズを再生。',
    description:
      '集中・睡眠・音のマスキングのために、ホワイト・ピンク・ブラウンノイズを生成して再生します。ブラウザ内で合成します。',
    keywords: ['ホワイトノイズ 生成', 'ピンクノイズ', 'ブラウンノイズ', 'white noise', '作業用 ノイズ'],
  },
  'random-letter': {
    name: 'ランダム文字生成ツール',
    tagline: 'アルファベットをランダムに選ぶ。',
    description:
      'ランダムな文字（A〜Z）を生成します。ゲームやお絵かきのお題、授業のアクティビティに便利です。ブラウザ内で完結します。',
    keywords: ['ランダム 文字', 'アルファベット ランダム', 'random letter', '文字 抽選', 'random letter picker'],
  },
  'random-words': {
    name: 'ランダム単語生成ツール',
    tagline: 'ランダムな英単語を生成。',
    description:
      'ブレインストーミング・ゲーム・お題・ネーミングのために、任意の数のランダムな英単語を生成します。ブラウザ内で完結します。',
    keywords: ['ランダム 単語', 'ランダム 英単語', 'random word generator', '単語 生成', 'random words'],
  },
  'regex-cheatsheet': {
    name: '正規表現チートシート',
    tagline: '検索できる正規表現リファレンス。',
    description:
      '正規表現のトークン・文字クラス・量指定子・アンカー・フラグを、例付きで検索できるチートシートです。ブラウザ内で完結します。',
    keywords: ['正規表現 チートシート', 'regex チートシート', 'regex cheatsheet', '正規表現 一覧', 'regex リファレンス'],
  },
  'remove-duplicate-words': {
    name: '重複単語の削除ツール',
    tagline: '各単語を1回だけ残す。',
    description:
      'テキストから重複した単語を取り除き、最初に出てきたものだけを残します。大文字小文字を無視するオプションもあります。ブラウザ内で処理します。',
    keywords: ['重複 単語 削除', '単語 重複 除去', 'remove duplicate words', '単語 ユニーク化', 'unique words'],
  },
  'shoe-size-converter': {
    name: '靴のサイズ換算ツール',
    tagline: 'US・EU・UK・cmの靴サイズを換算。',
    description:
      'メンズ・レディース・キッズの靴サイズを、US・EU・UK・センチメートルで相互に換算します。ブラウザ内で完結します。',
    keywords: ['靴 サイズ 換算', 'us eu 靴 サイズ', 'shoe size converter', '靴 サイズ 表', 'shoe size chart'],
  },
  'text-shadow': {
    name: 'CSS テキストシャドウジェネレーター',
    tagline: 'ライブプレビュー付きでtext-shadowを生成。',
    description:
      'オフセット・ぼかし・色を調整して、ライブプレビューとコピー付きでCSSのtext-shadowコードを生成します。',
    keywords: ['text shadow ジェネレーター', 'css text-shadow', 'テキストシャドウ 生成', '文字 影 css', 'text shadow'],
  },
  'tsv-to-csv': {
    name: 'TSV ⇄ CSV 変換ツール',
    tagline: 'TSVとCSVを相互変換。',
    description:
      'タブ区切り（TSV）データをカンマ区切り（CSV）に、また逆方向にも、適切なクォート処理付きで変換します。ブラウザ内で完結します。',
    keywords: ['tsv csv 変換', 'csv tsv 変換', 'tsv to csv', 'タブ カンマ 変換', 'tab to comma'],
  },
  'uuid-validate': {
    name: 'UUID バリデーター',
    tagline: 'UUIDを検証しバージョンを判定。',
    description:
      'UUID/GUIDの形式が正しいかを検証し、バージョン（v1〜v5）とバリアントを判定します。ブラウザ内で処理します。',
    keywords: ['uuid 検証', 'uuid バリデーター', 'uuid validator', 'uuid バージョン', 'guid 検証'],
  },
  'week-number': {
    name: '週番号計算ツール',
    tagline: '日付からISO週番号を求める。',
    description:
      '任意の日付のISO-8601週番号を求めたり、指定した週番号がどの日付に当たるかを確認できます。ブラウザ内で完結します。',
    keywords: ['週番号 計算', 'iso 週番号', 'week number', '第何週', 'week of year'],
  },
  'cron-next-runs': {
    name: 'cron 次回実行プレビュー',
    tagline: 'cron式から次の実行日時を一覧表示。',
    description:
      'cron式を入力すると、タイムゾーンを考慮して次のN回分の実行日時を一覧で確認できます。スケジュール設定の検証に便利です。',
    keywords: ['cron 次回実行', 'cron 実行日時', 'crontab プレビュー', 'cron next runs', 'スケジュール 確認'],
  },
  'http-header-analyzer': {
    name: 'HTTPヘッダー解析ツール',
    tagline: 'レスポンスヘッダーを監査。',
    description:
      'レスポンスヘッダーを貼り付けると、セキュリティ・キャッシュ・CORSのヘッダーを分類し、不足しているものを指摘します。ブラウザ内で処理します。',
    keywords: ['http ヘッダー', 'セキュリティヘッダー', 'cors', 'cache-control', 'ヘッダー 監査'],
  },
  'regex-extract': {
    name: '正規表現グループ抽出',
    tagline: '全マッチからキャプチャグループを抽出。',
    description:
      'テキストに正規表現を適用し、すべてのマッチからキャプチャグループや名前付きグループを表形式で抽出します。',
    keywords: ['正規表現 抽出', 'キャプチャグループ', '名前付きグループ', 'regex 抽出', '正規表現 マッチ'],
  },
  'json-to-jsdoc': {
    name: 'JSON → JSDoc 変換',
    tagline: 'JSONから@typedefを生成。',
    description:
      'JSONサンプルから型を推論し、JSDocの@typedef型定義を生成します。ブラウザ内で処理します。',
    keywords: ['json jsdoc', 'jsdoc 生成', 'typedef', '型定義', 'json 型 推論'],
  },
  'color-shades': {
    name: 'カラーシェード生成',
    tagline: '明度のトーン段階を作成。',
    description:
      'ベースカラーからHSLの明度を段階的に変化させ、ティント（明）とシェード（暗）のカラーランプを生成します。',
    keywords: ['カラーシェード', 'ティント', 'パレット', 'hsl 明度', 'カラースケール'],
  },
  'css-keyframes': {
    name: 'CSS keyframes ジェネレーター',
    tagline: '@keyframes アニメCSSを生成。',
    description:
      'イージング・繰り返し回数・再生時間を設定して、@keyframesアニメーションのCSSを生成します。',
    keywords: ['css keyframes', 'アニメーション', 'イージング', 'css アニメ', 'transition'],
  },
  'json-to-env': {
    name: 'JSON → .env 変換',
    tagline: 'JSONを環境変数に平坦化。',
    description:
      'ネストしたJSONを、大文字キーの.env環境変数の行に変換します。ブラウザ内で処理します。',
    keywords: ['json env', 'dotenv', '環境変数', 'json 平坦化', 'environment'],
  },
  'sql-where-builder': {
    name: 'SQL WHERE 句ビルダー',
    tagline: 'エスケープ済みWHERE句を組み立て。',
    description:
      'フィールド・演算子・値を選んで、安全にエスケープされたSQLのWHERE句を組み立てます。',
    keywords: ['sql where', 'クエリビルダー', '条件 絞り込み', 'sql 句', 'where 生成'],
  },
  'duplicate-lines': {
    name: '重複行の検出',
    tagline: '重複する行だけを一覧表示。',
    description:
      '2回以上現れる行だけを出現回数とともに抽出します。リストの重複チェックに便利です。',
    keywords: ['重複行', '重複 検出', '出現回数', 'duplicate lines', 'テキスト 重複'],
  },
  'text-stats-table': {
    name: '行ごとの長さ統計',
    tagline: '行単位の長さ統計を集計。',
    description:
      '行ごとの文字数・単語数に加え、最長・最短・平均の長さを計算して表で表示します。',
    keywords: ['行 長さ', 'テキスト 統計', '文字数', '平均 長さ', 'line length'],
  },
  'number-extract': {
    name: '数値の抽出',
    tagline: 'テキストから数値を取り出す。',
    description:
      'テキストから整数・小数・通貨表記の数値を抽出し、一覧と合計を表示します。ブラウザ内で処理します。',
    keywords: ['数値 抽出', '数字 取り出し', '合計', 'number extract', '通貨 抽出'],
  },
  'text-to-columns': {
    name: '列に整列',
    tagline: '区切りテキストを表に整形。',
    description:
      '区切り文字で分割したテキストを、等幅フォントで桁揃えした列の表に整形します。',
    keywords: ['列 整列', '桁揃え', '区切り文字', '表 整形', 'fixed width'],
  },
  'prefix-suffix-lines': {
    name: '行の前後に文字を追加',
    tagline: '各行をまとめて囲む。',
    description:
      'すべての行に接頭辞・接尾辞を一括で付与します。リストの一括編集にすばやく対応できます。',
    keywords: ['接頭辞', '接尾辞', '行 囲む', '一括編集', 'prefix suffix'],
  },
  'tax-bracket-calc': {
    name: '累進税率計算ツール',
    tagline: '累進課税の概算を計算。',
    description:
      '累進課税の税率区分を設定して、実効税率と概算税額を計算します。あくまで目安としてご利用ください。',
    keywords: ['累進税率', '税率区分', '実効税率', '所得税 概算', 'tax bracket'],
  },
  'data-size-converter': {
    name: 'データサイズ変換',
    tagline: 'バイトをSI/IECで換算。',
    description:
      'バイト・KB・MB・GB・TBを、SI（1000）とIEC（1024）の両基準でまとめて換算します。',
    keywords: ['データサイズ', 'バイト 換算', 'ギガバイト', 'iec', 'kib mib'],
  },
  'download-time-calc': {
    name: 'ダウンロード時間計算',
    tagline: '転送にかかる時間を概算。',
    description:
      'ファイルサイズと回線速度から、ダウンロードやアップロードにかかる時間を概算します。',
    keywords: ['ダウンロード時間', '転送時間', '回線速度', 'bandwidth', 'ファイルサイズ'],
  },
  'frame-time-calc': {
    name: 'フレーム ⇄ タイムコード',
    tagline: 'fps基準でフレームを変換。',
    description:
      '指定したfpsで、フレーム数とタイムコード（HH:MM:SS:FF）を相互に変換します。動画編集に便利です。',
    keywords: ['タイムコード', 'フレーム', 'fps', '動画 編集', 'smpte'],
  },
  'angle-converter': {
    name: '角度変換ツール',
    tagline: '度・ラジアン・グラード・回転。',
    description:
      '度（degree）・ラジアン・グラード（gon）・回転（turn）をまとめて相互に変換します。',
    keywords: ['角度 変換', '度', 'ラジアン', 'グラード', '回転 turn'],
  },
  'fov-calc': {
    name: '画角（FOV）計算ツール',
    tagline: 'センサーと焦点距離から画角を算出。',
    description:
      'センサーサイズと焦点距離から、水平・垂直・対角の画角（FOV）を計算します。',
    keywords: ['画角', 'fov', '焦点距離', 'センサーサイズ', 'カメラ'],
  },
  'resistor-color-code': {
    name: '抵抗カラーコード読み取り',
    tagline: 'カラーバンドから抵抗値を判定。',
    description:
      '4バンド・5バンドの抵抗カラーコードから、抵抗値と許容差を読み取ります。電子工作に役立ちます。',
    keywords: ['抵抗 カラーコード', 'カラーコード', 'オーム', '許容差', '電子工作'],
  },
  'random-date': {
    name: 'ランダム日付生成',
    tagline: '範囲内の日付をランダムに選ぶ。',
    description:
      '指定した開始日と終了日の範囲内で、安全な乱数を使ってランダムな日付を生成します。',
    keywords: ['ランダム 日付', '日付 生成', '範囲', 'シャッフル', 'random date'],
  },
  'ohms-law-calc': {
    name: 'オームの法則計算ツール',
    tagline: 'V・I・R・Pを求める。',
    description:
      '電圧・電流・抵抗・電力のうち2つを入力すると、残りの値を計算します。ブラウザ内で処理します。',
    keywords: ['オームの法則', '電圧', '電流', '抵抗', '電力'],
  },
  'crc32-hash': {
    name: 'CRC32 チェックサム',
    tagline: 'ブラウザ内でCRC32を計算。',
    description:
      'テキストやファイルのCRC32チェックサムを計算し、手軽に整合性を確認できます。ファイルは送信されません。',
    keywords: ['crc32', 'チェックサム', '整合性 確認', 'ハッシュ', 'verify'],
  },
  'adler32-hash': {
    name: 'Adler-32 チェックサム',
    tagline: 'zlibのAdler-32チェックサム。',
    description:
      'zlibで使われるAdler-32チェックサムを、テキストやファイルから計算します。ブラウザ内で処理します。',
    keywords: ['adler32', 'チェックサム', 'zlib', '整合性', 'ハッシュ'],
  },
  'passphrase-gen': {
    name: 'パスフレーズ生成',
    tagline: '覚えやすい複数単語パスワード。',
    description:
      '区切り文字・大文字小文字・数字の付加を選んで、覚えやすい複数単語のパスフレーズを生成します。使い回しは避けてください。',
    keywords: ['パスフレーズ', 'パスワード', '覚えやすい', '単語 パスワード', '安全'],
  },
  'csv-to-yaml': {
    name: 'CSV → YAML 変換',
    tagline: 'CSVの行をYAMLに変換。',
    description:
      'CSVの表を、ヘッダーをキーにしたオブジェクトのYAMLリストに変換します。ブラウザ内で処理します。',
    keywords: ['csv yaml', 'yaml 変換', '変換', 'テーブル', 'データ'],
  },
  'json-to-toml': {
    name: 'JSON → TOML 変換',
    tagline: 'JSONをTOMLに変換。',
    description:
      'JSONデータを、テーブルや配列のテーブルに対応したTOML設定形式に変換します。',
    keywords: ['json toml', 'toml 変換', '変換', '設定ファイル', 'config'],
  },
  'image-ascii-braille': {
    name: '画像 → 点字アート',
    tagline: '画像を点字ドットで表現。',
    description:
      '画像を高解像度のUnicode点字（⠿）ブロックによるアートテキストに変換します。ブラウザ内で処理します。',
    keywords: ['点字 アート', 'aa アスキーアート', '画像 文字化', 'unicode アート', 'ドット'],
  },
  'image-mirror-tile': {
    name: 'ミラータイル',
    tagline: '左右対称のミラータイルを作成。',
    description:
      '画像を水平・垂直に反転させ、左右上下が対称になるパターンタイルを作成します。万華鏡のような効果です。',
    keywords: ['ミラー', 'タイル', '対称', 'パターン', '万華鏡'],
  },
  'binaural-tone-gen': {
    name: 'バイノーラルビート生成',
    tagline: '左右の周波数差でビートを再生。',
    description:
      '左右の耳でわずかに周波数を変え、バイノーラルビートをWeb Audioで生成・再生します。ヘッドホンの使用を推奨します。',
    keywords: ['バイノーラルビート', 'ビート', '周波数', '集中', 'トーン'],
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

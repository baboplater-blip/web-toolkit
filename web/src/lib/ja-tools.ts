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

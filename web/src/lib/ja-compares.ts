/**
 * 日本語「X vs Y」比較ページのデータ。
 *
 * 英語比較(en-compares.ts)と同じ slug・構造を使い、本文だけ日本語にする。
 * ルート /ja/compare/{slug} が使用し、/compare・/en/compare と hreflang で連結される。
 * relatedConverts(変換マトリクス相互リンク)は en-compares から slug で参照する。
 *
 * COMPARE_SLUGS / relatedCompares / comparesForTool は言語非依存なので
 * en-compares のものをそのまま再エクスポートする。
 */

import { COMPARE_SLUGS, comparesForTool, relatedCompares } from '@/lib/en-compares';
import type { Compare } from '@/lib/en-compares';

export { COMPARE_SLUGS, comparesForTool, relatedCompares };

export const COMPARES_JA: Compare[] = [
  {
    slug: 'merge-vs-split-pdf',
    category: 'pdf',
    title: 'PDF結合 vs 分割 — どちらが必要？',
    h1: 'PDF結合 vs 分割',
    description:
      '結合は複数のPDFを1つに、分割は1つのPDFをページや部分に分けます。どちらをいつ使うか — 無料・ブラウザで。',
    intro:
      '結合と分割は正反対の操作です。結合は複数のPDFを1つの文書につなぎ、分割は1つのPDFからページを取り出したり複数ファイルに分けたりします。どちらもブラウザ内で処理され、ファイルはアップロードされません。',
    options: [
      {
        label: 'PDF結合',
        toolId: 'pdf-merge',
        best: '複数のPDFを1つの文書にまとめたいとき。',
        pros: ['スキャン・章・報告書を1ファイルに', '書き出し前にページ・ファイル順を変更', '共有・保管が簡単'],
        cons: ['大きなPDFから数ページだけ取り出すには不向き'],
      },
      {
        label: 'PDF分割',
        toolId: 'pdf-split',
        best: '大きなPDFから特定のページや部分が必要なとき。',
        pros: ['ページ範囲を別PDFに取り出す', '大きなPDFをページ・章単位で分割', '小さいファイルはアップロード・メールに有利'],
        cons: ['複数の文書を1つにまとめるには不向き'],
      },
    ],
    verdict:
      '複数→1つなら結合、1つ→複数(またはページ抽出)なら分割です。まず結合してから結果を分割し、文書を丸ごと再構成することもできます。',
    faqs: [
      {
        q: '結合と分割を一度のセッションでできますか？',
        a: 'はい。PDFを1つに結合してダウンロードし、分割ツールを開いて抽出・分割すればOKです。すべてブラウザ内で完結します。',
      },
      {
        q: '結合・分割で画質は落ちますか？',
        a: 'いいえ。どちらも既存のPDFページを再エンコードせず扱うため、テキスト・画像は元のまま保たれます。',
      },
    ],
    keywords: ['pdf 結合 分割', 'pdf 統合 分割', 'pdf merge split', 'pdf 結合 vs 分割'],
  },
  {
    slug: 'heic-vs-jpg',
    category: 'image',
    title: 'HEIC vs JPG — どの画像フォーマットを使う？',
    h1: 'HEIC vs JPG',
    description:
      'HEICはiPhoneで容量を節約できますが他環境での互換性が弱く、JPGはどこでも開けます。HEICをJPGに変換するとき — 無料・ブラウザで。',
    intro:
      'HEICはiPhoneが標準で使う高効率フォーマット、JPG(JPEG)は汎用の写真フォーマットです。HEICは似た画質でより小さい容量になりますが、Windows・Web・多くのアプリで開けないため、JPGに変換することがよくあります。',
    options: [
      {
        label: 'HEIC',
        toolId: 'image-heic-to-jpg',
        best: '容量が気になるApple端末で写真を保存するとき。',
        pros: ['同等画質でJPGの約半分の容量', '高ビット深度・透明度に対応', '最新iPhoneの標準'],
        cons: ['Windows・古いソフト・Webでの対応が弱い', '変換しないと共有しにくい'],
      },
      {
        label: 'JPG',
        toolId: 'image-convert',
        best: '互換性が重要な共有・アップロード・印刷のとき。',
        pros: ['ほぼあらゆる端末・アプリで開ける', 'どのサイト・プリンターでも受け付ける', 'どこでも編集できる'],
        cons: ['同じ画質ではHEICよりファイルが大きい'],
      },
    ],
    verdict:
      'Apple端末での保存用にはHEICのままで。共有・アップロード・WindowsやWebで開く必要が出たら、HEICをJPGに変換しましょう。変換はブラウザ内で行われ、プライベートな写真も端末から出ません。',
    faqs: [
      {
        q: 'HEICをJPGに変換すると画質は落ちますか？',
        a: 'JPGが再エンコードするためわずかに、通常は気づかない程度の劣化があります。高品質設定なら違いはほとんど分かりません。',
      },
      {
        q: 'HEICを複数まとめて変換できますか？',
        a: 'はい。HEIC→JPG変換は一括変換に対応し、結果をZIPでまとめてダウンロードできます。すべてブラウザ内で処理されます。',
      },
    ],
    keywords: ['heic jpg 違い', 'heic jpeg', 'heic 変換', 'iphone 写真 フォーマット'],
    relatedConverts: ['heic-to-jpg', 'heic-to-png'],
  },
  {
    slug: 'png-vs-jpg',
    category: 'image',
    title: 'PNG vs JPG — どちらを選ぶ？',
    h1: 'PNG vs JPG',
    description:
      'PNGは可逆で透明度に対応し図やスクショに、JPGは小さく写真に最適。選び方 — ブラウザで無料変換。',
    intro:
      'PNGとJPGは役割が違います。PNGは可逆圧縮で透明度に対応し、ロゴ・スクリーンショット・輪郭や文字の鮮明なグラフィックに最適です。JPGは非可逆圧縮で写真に強く、わずかな劣化が目立たない場面でずっと小さいファイルになります。',
    options: [
      {
        label: 'PNG',
        toolId: 'image-convert',
        best: 'ロゴ・スクショ・アイコン、透明度や文字が必要なもの。',
        pros: ['可逆 — 圧縮ノイズが出ない', '透明度(アルファ)に対応', '輪郭や文字がくっきり'],
        cons: ['写真ではファイルがかなり大きい'],
      },
      {
        label: 'JPG',
        toolId: 'image-convert',
        best: '容量が重要な写真や色の豊かな画像。',
        pros: ['写真ならとても小さい容量', 'どこでも対応', '画質と容量を調整可能'],
        cons: ['非可逆 — 輪郭が甘く、透明不可、文字にノイズ'],
      },
    ],
    verdict:
      '写真ならJPG。ロゴ・スクショ・アイコン、透明度や鋭い文字が必要ならPNGです。ブラウザの画像変換でどちら向きにも数秒で変換できます。',
    faqs: [
      {
        q: 'スクリーンショットにはどちらが良いですか？',
        a: 'PNGです。スクショは文字や鋭いUIの輪郭を含み、JPG圧縮ではにじみますが、PNGなら鮮明なまま保てます。',
      },
      {
        q: '容量節約のためPNGをJPGに変換してもいい？',
        a: 'はい。写真的なPNGは大きく縮むことが多いです。ただしJPGは透明を失うため、背景は単色になります。',
      },
    ],
    keywords: ['png jpg 違い', 'jpg png', 'png jpeg 違い', '画像 フォーマット おすすめ'],
    relatedConverts: ['png-to-jpg', 'jpg-to-png'],
  },
  {
    slug: 'webp-vs-png',
    category: 'image',
    title: 'WebP vs PNG — 小さい容量か最大の互換性か',
    h1: 'WebP vs PNG',
    description:
      'WebPは透明度に対応しつつずっと小さく、Webに最適。PNGは互換性が抜群。どちらを選ぶか — ブラウザで無料変換。',
    intro:
      'WebPは非可逆・可逆の両方と透明度に対応する最新フォーマットで、通常PNGより25〜35%小さくなります。PNGは古いものの、ほぼあらゆる環境で対応しています。トレードオフは容量と互換性です。',
    options: [
      {
        label: 'WebP',
        toolId: 'image-convert',
        best: 'ページの重さや表示速度が重要なWeb画像。',
        pros: ['同じ画質でPNGより小さい', '透明度・アニメーションに対応', '最新ブラウザすべてに対応'],
        cons: ['ごく古いソフトや一部の印刷ワークフローには不向き'],
      },
      {
        label: 'PNG',
        toolId: 'image-convert',
        best: '最大の互換性と可逆での保管。',
        pros: ['新旧あらゆるツールで開ける', '可逆で扱いが予測しやすい', '編集パイプラインで安全な選択'],
        cons: ['WebPよりファイルが大きい'],
      },
    ],
    verdict:
      '高速なWebサイトを作るならWebPで画像を軽く。古いものを含めどんなソフトでも開けるファイルや、編集を続ける可逆マスターが必要ならPNGです。ブラウザで瞬時に相互変換できます。',
    faqs: [
      {
        q: 'WebPはPNGのように可逆ですか？',
        a: 'WebPにはPNGに匹敵する可逆モードと、さらに小さくなる非可逆モードがあります。変換時に品質を選べます。',
      },
      {
        q: 'すべてのブラウザがWebPに対応していますか？',
        a: 'はい、現在の主要ブラウザはすべて対応しています。ごく古いソフトでは非対応で、その場合はPNGが安全です。',
      },
    ],
    keywords: ['webp png 違い', 'webp png', 'webp 変換', 'webp png 比較'],
    relatedConverts: ['webp-to-png', 'png-to-webp'],
  },
  {
    slug: 'jpg-to-pdf-vs-pdf-to-jpg',
    category: 'pdf',
    title: 'JPG→PDF vs PDF→JPG — どちらの向き？',
    h1: 'JPG→PDF vs PDF→JPG',
    description:
      'JPG→PDFは画像を1つの文書に、PDF→JPGはPDFページを画像に戻します。向きの選び方 — 無料・ブラウザで。',
    intro:
      'この2つは画像とPDFの間を逆向きに行き来します。JPG→PDFは1枚以上の画像を1つのPDF文書にまとめ、PDF→JPGは各PDFページを独立した画像に描き出します。どちらも端末内で完結します。',
    options: [
      {
        label: 'JPG→PDF',
        toolId: 'pdf-from-jpg',
        best: 'スキャン写真や領収書を1つの共有用文書にするとき。',
        pros: ['多数の画像を1つのPDFに', 'ページサイズと順番を調整', 'スキャン・領収書・ポートフォリオに最適'],
        cons: ['出力は文書で、編集可能な画像ではない'],
      },
      {
        label: 'PDF→JPG',
        toolId: 'pdf-to-jpg',
        best: 'スライドやサムネ用にPDFのページ画像を取り出すとき。',
        pros: ['ページごとにJPG/PNGを取得', 'ページをプレビューやSNS画像に', '解像度を選べる'],
        cons: ['文字が画像の一部になり選択できなくなる'],
      },
    ],
    verdict:
      '画像があって1つの文書にしたいならJPG→PDF。PDFがあってページの画像ファイルが欲しいならPDF→JPGです。どちらもローカルで動くため、機微なスキャンもブラウザから出ません。',
    faqs: [
      {
        q: 'PDF→JPGの後も文字は選択できますか？',
        a: 'いいえ。ページをJPGにするとすべてピクセルになり、文字は選択できなくなります。文字が必要ならPDFを残してください。',
      },
      {
        q: 'JPGから変換するときPDFのページサイズを指定できますか？',
        a: 'はい。JPG→PDFツールでページサイズと収め方を選べるので、画像が引き伸ばされたり切れたりしません。',
      },
    ],
    keywords: ['jpg pdf pdf jpg', '画像 pdf', 'pdf 画像', 'pdf 画像 変換'],
    relatedConverts: ['jpg-to-pdf', 'pdf-to-jpg'],
  },
  {
    slug: 'compress-vs-resize-image',
    category: 'image',
    title: '画像の圧縮 vs リサイズ — 容量を減らすのはどっち？',
    h1: '画像の圧縮 vs リサイズ',
    description:
      '圧縮はサイズはそのままに品質を下げて容量を、リサイズはピクセル寸法を変えます。どちらを使うか — 無料・ブラウザで。',
    intro:
      'どちらも容量を減らしますが方法が違います。圧縮は幅・高さを保ったまま品質(データ量)を下げ、リサイズは実際のピクセル寸法を変えます。多くの場合、必要な寸法にリサイズしてから圧縮するのが最良です。',
    options: [
      {
        label: '圧縮',
        toolId: 'image-batch-compress',
        best: '寸法はそのままに容量だけ減らしたいとき。',
        pros: ['同じ幅・高さで容量を縮小', '多数の画像を一括処理', '画質と容量を調整可能'],
        cons: ['圧縮しすぎると目に見えるノイズが出る'],
      },
      {
        label: 'リサイズ',
        toolId: 'image-resize',
        best: '画像が必要以上に大きいとき。',
        pros: ['正確なピクセルサイズや割合に合わせる', '寸法を大きく減らすと容量が激減', '縦横比を固定できる'],
        cons: ['縮小すると失われた細部は戻せない'],
      },
    ],
    verdict:
      '寸法は適切なのにファイルが重いなら圧縮。6000pxの写真が1200px幅で十分ならまずリサイズ、その後に圧縮すれば最小になります。どちらもブラウザで動きます。',
    faqs: [
      {
        q: 'リサイズと圧縮はどちらを先に？',
        a: '実際に必要な寸法にまずリサイズし、その後に圧縮を。リサイズが最も多くデータを減らし、圧縮が残りを整えます。',
      },
      {
        q: '圧縮すると画像の寸法は変わりますか？',
        a: 'いいえ。圧縮は幅・高さを保ちます。ピクセル寸法を変えるのはリサイズだけです。',
      },
    ],
    keywords: ['画像 圧縮 リサイズ', '画像 容量 削減', '画像 縮小', '画像 サイズ 画質'],
  },
  {
    slug: 'md5-vs-sha256',
    category: 'security',
    title: 'MD5 vs SHA-256 — どのチェックサムを使う？',
    h1: 'MD5 vs SHA-256',
    description:
      'MD5は速いがセキュリティ用途では破られており、SHA-256が現代の標準。使い分け — ブラウザで両方を無料計算。',
    intro:
      'MD5とSHA-256はどちらもファイルの固定長フィンガープリントを作ります。MD5は速く、簡易なファイル確認では今も使われますが暗号学的には破られています。SHA-256は改ざんが問題になる場面の現代標準です。',
    options: [
      {
        label: 'MD5',
        toolId: 'file-hash',
        best: 'セキュリティが問題にならない手早い整合性確認。',
        pros: ['非常に速い', '短くて扱いやすいハッシュ', 'ダウンロード用に今も公開される'],
        cons: ['暗号学的に破られ衝突が実用的', '改ざんされていない証明には絶対に使わない'],
      },
      {
        label: 'SHA-256',
        toolId: 'file-hash',
        best: 'ダウンロード・署名などセキュリティ関連の検証。',
        pros: ['衝突耐性があり信頼される', 'ソフトウェア配布の標準', '整合性保証に推奨'],
        cons: ['わずかに遅くハッシュが長い(ほぼ問題なし)'],
      },
    ],
    verdict:
      '既定はSHA-256で。ダウンロード検証や改ざん検知に正しい選択です。MD5は速い使い捨てのフィンガープリントが欲しく、セキュリティが関係ないときだけにしましょう。ハッシュツールは両方を同時に計算します。',
    faqs: [
      {
        q: 'MD5はパスワードに安全ですか？',
        a: 'いいえ。MD5はパスワードやセキュリティには絶対に使うべきではありません。SHA-256単体でもパスワードには不十分で、bcryptやArgon2のような遅くソルト付きのアルゴリズムが必要です。',
      },
      {
        q: '内容が違う2つのファイルでMD5が同じになるのはなぜ？',
        a: 'それがMD5衝突で、まさにMD5がセキュリティに使えない理由です。SHA-256には実用的な衝突がありません。',
      },
    ],
    keywords: ['md5 sha256 違い', 'md5 sha256', 'チェックサム アルゴリズム', 'ハッシュ 使い分け'],
  },
  {
    slug: 'base64-vs-url-encoding',
    category: 'dev',
    title: 'Base64 vs URLエンコード — 何が違う？',
    h1: 'Base64 vs URLエンコード',
    description:
      'Base64はバイナリを安全なASCIIに、URLエンコードはURLで危険な文字を変換します。使い分け — ブラウザの無料ツールで。',
    intro:
      '名前は似ていますが解決する問題が違います。Base64は任意のバイナリデータを安全なASCII文字列にします(画像・トークン・添付の埋め込みに使用)。URL(パーセント)エンコードはスペースやアンパサンドなど、URLで危険な個々の文字をエスケープします。',
    options: [
      {
        label: 'Base64',
        toolId: 'base64',
        best: 'バイナリ(画像・ファイル・トークン)をテキストとして埋め込む。',
        pros: ['あらゆるバイナリを安全にASCIIで表現', 'データURL・JWT・メール添付で使用', '無劣化で可逆'],
        cons: ['サイズが約33%増える', 'テキストをURL安全にする用途ではない'],
      },
      {
        label: 'URLエンコード',
        toolId: 'url-encoder',
        best: 'テキストを安全にURLやクエリ文字列に入れる。',
        pros: ['危険な文字だけをエスケープ', 'URLやクエリパラメータを有効に保つ', 'サイズ変化が最小'],
        cons: ['バイナリファイルのエンコードには使えない'],
      },
    ],
    verdict:
      'ファイルやトークンをテキストとして埋め込むならBase64。値をURLやクエリ文字列に入れるならURLエンコードです。組み合わせる(Base64url)こともありますが、バイナリ処理かURL構築かで選びましょう。',
    faqs: [
      {
        q: 'Base64urlとは？',
        a: 'Base64のURL安全な派生で、「+」と「/」を「-」と「_」に置き換え、追加のエスケープなしでURLに入れられるようにしたものです。JWTで使われます。',
      },
      {
        q: 'Base64はデータを暗号化しますか？',
        a: 'いいえ。Base64は暗号化ではなくエンコードで、誰でも復号できます。秘密が必要なら本物の暗号化ツールを使ってください。',
      },
    ],
    keywords: ['base64 urlエンコード 違い', 'パーセント エンコード', 'base64 url safe', 'エンコード 違い'],
  },
  {
    slug: 'mp4-vs-webm',
    category: 'video',
    title: 'MP4 vs WebM — どの動画フォーマット？',
    h1: 'MP4 vs WebM',
    description:
      'MP4はどこでも再生でき、WebMは小さくオープンでWebに最適。どちらを使うか — ブラウザで無料変換。',
    intro:
      'MP4はほぼあらゆる端末・プラットフォームで再生できる汎用の動画コンテナです。WebMは小さく透明度に対応する最新のロイヤリティフリー形式ですが、対応はそれほど広くありません。互換性か、軽くWeb最適化されたファイルかの選択です。',
    options: [
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: '共有・アップロードと最大の端末互換。',
        pros: ['あらゆる端末・SNS・プレイヤーで再生', 'アップロードの既定', '良好な圧縮'],
        cons: ['透明動画は非対応', 'ロイヤリティフリーではない'],
      },
      {
        label: 'WebM',
        toolId: 'video-convert',
        best: '容量とオープン性が重要なWebページ。',
        pros: ['Web向けに小さい容量', 'オープンでロイヤリティフリー', '透明度に対応'],
        cons: ['一部の端末・編集ソフトで非対応', 'SNSアップロードの対応にばらつき'],
      },
    ],
    verdict:
      'どこでも再生・SNSにアップロードしたいならMP4。高速サイトへの埋め込みや透明度が必要ならWebMです。ブラウザでどちら向きにも変換できます。',
    faqs: [
      { q: 'YouTubeやInstagramにはどちらが良い？', a: 'MP4です。SNSはMP4を広く受け付けますが、WebMの対応は一定しません。' },
      { q: 'WebMはMP4より高画質ですか？', a: '同じビットレートなら同等で、WebM(VP9/AV1)はより効率的なため、似た画質で小さくなります。' },
    ],
    keywords: ['mp4 webm 違い', 'webm mp4', '動画 フォーマット おすすめ', 'mp4 webm 変換'],
    relatedConverts: ['webm-to-mp4', 'mp4-to-webm'],
  },
  {
    slug: 'mp3-vs-wav',
    category: 'audio',
    title: 'MP3 vs WAV — どの音声フォーマット？',
    h1: 'MP3 vs WAV',
    description:
      'MP3は小さく汎用的、WAVは可逆で大きく編集向き。使い分け — ブラウザで無料変換。',
    intro:
      'MP3は汎用の非可逆形式で、どこでも再生できる小さなファイルが共有や視聴に最適です。WAVは無圧縮・可逆で原音をそのまま保つため編集・マスタリングに向きますが、ファイルは非常に大きくなります。',
    options: [
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: '共有・ストリーミング・日常の視聴。',
        pros: ['とても小さい容量', 'あらゆる端末・アプリで再生', 'ビットレートを調整可能'],
        cons: ['非可逆 — 原音より音質が落ちる', '保管や重い編集には不向き'],
      },
      {
        label: 'WAV',
        toolId: 'audio-convert',
        best: '編集・マスタリング・可逆での保管。',
        pros: ['完全に可逆な原音', '編集の標準', '幅広い互換性'],
        cons: ['ファイルが非常に大きい', '共有・ストリーミングに非効率'],
      },
    ],
    verdict:
      '共有や視聴ならMP3。音声を編集したり可逆マスターを保つならWAV、終わったらMP3に書き出しましょう。ブラウザでどちら向きにも変換できます。',
    faqs: [
      { q: 'WAVをMP3に変換すると音質は落ちますか？', a: 'はい、わずかに — MP3は非可逆です。高ビットレート(256〜320kbps)なら違いは聞き分けにくいです。' },
      { q: 'MP3から元の音質を取り戻せますか？', a: 'いいえ。MP3をWAVにしても可逆コンテナになるだけで、MP3で失われた細部は復元できません。' },
    ],
    keywords: ['mp3 wav 違い', 'wav mp3', '音声 フォーマット 音質', 'wav mp3 変換'],
    relatedConverts: ['wav-to-mp3', 'mp3-to-wav'],
  },
  {
    slug: 'jpg-vs-webp',
    category: 'image',
    title: 'JPG vs WebP — Web写真にはどちら？',
    h1: 'JPG vs WebP',
    description:
      'WebPは似た画質でJPGより小さく透明度に対応、JPGはどこでも使えます。ブラウザで無料変換。',
    intro:
      'JPGは汎用の写真フォーマットで、あらゆる端末・アプリ・プリンターに対応します。WebPは似た画質で明らかに小さく、透明度やアニメーションを加える最新形式で、Webに最適です(ごく古いソフトには不向き)。',
    options: [
      {
        label: 'JPG',
        toolId: 'image-convert',
        best: '最大の互換性・印刷・汎用的な共有。',
        pros: ['あらゆる端末・アプリで開ける', 'どのプリンター・サイトでも受け付ける', '画質を調整可能'],
        cons: ['同じ画質ではWebPより大きい', '透明不可'],
      },
      {
        label: 'WebP',
        toolId: 'image-convert',
        best: 'ページの重さと速度が重要なWeb写真。',
        pros: ['似た画質でJPGより小さい', '透明度・アニメーションに対応', '最新ブラウザすべてに対応'],
        cons: ['ごく古いソフトには不向き', '一部の印刷ワークフローはJPGを好む'],
      },
    ],
    verdict:
      '高速サイトを作るならWebPで画像を軽く。どこでも開く・印刷できる写真が必要ならJPGです。ブラウザで瞬時に相互変換できます。',
    faqs: [
      { q: 'WebPは常にJPGより小さい？', a: '通常、似た画質でWebPは25〜35%小さくなります。画像によって差は小さいこともありますが、WebPが負けることはまれです。' },
      { q: 'サイト全体をWebPに切り替えるべき？', a: '写真ならJPGフォールバック付きのWebPが一般的で安全な選択です。最新ブラウザはすべてWebPに対応します。' },
    ],
    keywords: ['jpg webp 違い', 'webp jpg', 'web 画像 フォーマット', 'jpg webp 変換'],
    relatedConverts: ['jpg-to-webp', 'webp-to-jpg'],
  },
  {
    slug: 'epub-vs-pdf',
    category: 'docs',
    title: 'EPUB vs PDF — 電子書籍にはどちら？',
    h1: 'EPUB vs PDF',
    description:
      'EPUBはどの画面にも流れ、PDFは固定レイアウトを保ちます。電子書籍・文書での使い分け — ブラウザで無料変換。',
    intro:
      'EPUBとPDFは異なる読書の問題を解決します。EPUBは文字をどの画面にも合わせて流し、読者がフォントサイズを調整できるため、電子書籍端末やスマホでの小説や長文に最適です。PDFは印刷どおりの固定レイアウトを保つため、書式が変わってはいけないフォーム・報告書・図版書に向きます。',
    options: [
      {
        label: 'EPUB',
        toolId: 'pdf-to-epub',
        best: '電子書籍端末・スマホでの流動的な読書(小説・長文)。',
        pros: ['文字がどの画面にも流れる', '読者がフォント・サイズを調整', '小さく電子書籍リーダーの標準'],
        cons: ['固定レイアウトには不向き', 'リーダーごとに表示が異なる'],
      },
      {
        label: 'PDF',
        toolId: 'epub-to-pdf',
        best: '印刷・フォーム・図版文書の固定レイアウト。',
        pros: ['どこでも同じレイアウト', '印刷に最適', '汎用的な閲覧'],
        cons: ['小さい画面で読みにくい', '流動表示やフォント変更ができない'],
      },
    ],
    verdict:
      'スマホや電子書籍端末で小説を読むならEPUB。印刷・フォーム共有・レイアウトを正確に保つならPDFです。ブラウザで相互変換できます。',
    faqs: [
      { q: 'スマホにはどちらが良い？', a: 'EPUBです。文字が画面に流れるので、固定のPDFのようにピンチ操作で拡大縮小する必要がありません。' },
      { q: 'EPUBをPDFに変換するとレイアウトは保たれる？', a: 'EPUBの内容から固定レイアウトのPDFを生成します。正確なページ分けは元データ次第ですが、テキストと画像は保たれます。' },
    ],
    keywords: ['epub pdf 違い', 'pdf epub', '電子書籍 フォーマット', 'epub pdf 変換'],
    relatedConverts: ['epub-to-pdf'],
  },
  {
    slug: 'csv-vs-json',
    category: 'docs',
    title: 'CSV vs JSON — どのデータフォーマット？',
    h1: 'CSV vs JSON',
    description:
      'CSVはどの表計算でも読める平らな表、JSONはAPI・設定向けの入れ子構造。使い分け — ブラウザで無料変換。',
    intro:
      'CSVとJSONはデータを違う形で保存します。CSVは平らなカンマ区切りの表で、表計算や単純な行・列データに最適です。JSONはオブジェクトや配列を入れ子にでき、API・設定・階層的なものに最適です。データが表か木かで選びます。',
    options: [
      {
        label: 'CSV',
        toolId: 'csv-json',
        best: '表計算・取り込み・書き出し向けの平らな表データ。',
        pros: ['あらゆる表計算・DBで開ける', '小さくシンプル', '行ごとに見比べやすい'],
        cons: ['入れ子・階層データは扱えない', '型や書式がない', '文字コード・区切りの落とし穴'],
      },
      {
        label: 'JSON',
        toolId: 'csv-json',
        best: 'API・設定・アプリの状態など入れ子データ。',
        pros: ['入れ子のオブジェクト・配列を表現', 'あらゆる言語でそのまま解析', '基本的な型(数値・真偽・null)を持つ'],
        cons: ['表として見にくい', 'CSVより大きい', '手作業の大量編集が面倒'],
      },
    ],
    verdict:
      '行と列の単純な表ならCSV。入れ子データ・APIのペイロード・設定ならJSONです。ブラウザで瞬時にどちら向きにも変換 — アップロードなし。',
    faqs: [
      { q: 'どんなCSVもJSONにできますか？', a: 'はい。各行がヘッダーをキーに持つオブジェクトになります。深く入れ子になったJSONからCSVへ戻すには、先に平坦化が必要なことがあります。' },
      { q: 'Excelにはどちらが良い？', a: 'CSVです。Excelはシートとして直接開けます。JSONは取り込みや変換が先に必要です。' },
    ],
    keywords: ['csv json 違い', 'json csv', 'データ フォーマット', 'csv json 変換'],
    relatedConverts: ['csv-to-json', 'json-to-csv'],
  },
  {
    slug: 'mp4-vs-mov',
    category: 'video',
    title: 'MP4 vs MOV — どの動画フォーマット？',
    h1: 'MP4 vs MOV',
    description:
      'MOVはApple端末での編集に最適、MP4はどこでも再生・アップロードできます。使い分け — ブラウザで無料変換。',
    intro:
      'MOVとMP4は近い親戚で、よく同じH.264/H.265動画を収めます。MOVはAppleのQuickTimeコンテナで、iPhone録画の標準でありMac編集で扱いやすい形式です。MP4はあらゆる端末で再生でき、どのプラットフォームにもきれいにアップロードできる汎用の配信コンテナです。',
    options: [
      {
        label: 'MOV',
        toolId: 'video-convert',
        best: 'Apple環境での録画・編集。',
        pros: ['iPhone録画の標準', 'Mac編集アプリで扱いやすい', '高画質の映像を収める'],
        cons: ['Windows・Webでの対応が弱い', 'ファイルが大きい', 'SNSアップロードでばらつき'],
      },
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: '共有・アップロード・どこでも再生。',
        pros: ['あらゆる端末・プラットフォームで再生', 'SNS・Webアップロードの標準', '良好な圧縮'],
        cons: ['編集より配信向け', '透明度は非対応'],
      },
    ],
    verdict:
      'MacやiPhoneから直接編集するならMOVで十分。共有・アップロード・端末をまたいで再生するならMP4に変換を。ブラウザですぐに切り替えられます。',
    faqs: [
      { q: 'MOVをMP4に変換すると画質は落ちますか？', a: '同じコーデックを包み直すだけならほぼ変わりません。再エンコードするとわずかな、通常気づかない劣化が加わります。' },
      { q: 'MOVがアップロードできないのはなぜ？', a: '一部のプラットフォームはMOVやそのコーデックを拒否します。MP4(H.264)に変換するのが最も互換性のある対処です。' },
    ],
    keywords: ['mp4 mov 違い', 'mov mp4', '動画 フォーマット おすすめ', 'mov mp4 変換'],
    relatedConverts: ['mov-to-mp4', 'mp4-to-mov'],
  },
  {
    slug: 'docx-vs-pdf',
    category: 'docs',
    title: 'DOCX vs PDF — どちらを送る？',
    h1: 'DOCX vs PDF',
    description:
      'DOCXは編集でき、PDFはレイアウトを固定してどこでも同じに見えます。送るときの選び方 — ブラウザで無料変換。',
    intro:
      'DOCXとPDFは文書の一生の両端にあります。DOCX(Word)は執筆・共同作業向けで、完全に編集でき、変更履歴やコメントを扱えます。PDFは配布向けで、どの端末でも同じに見える固定レイアウトで、うっかり変更される心配がありません。多くの文書はDOCXで始まりPDFで届きます。',
    options: [
      {
        label: 'DOCX',
        toolId: 'docx-to-pdf',
        best: '文書の執筆・編集・共同作業。',
        pros: ['テキスト・書式を完全に編集', 'コメントや変更履歴', '下書きのOffice標準'],
        cons: ['ビューアごとにレイアウトが変わる', 'Wordや互換アプリが必要', 'うっかり変更しやすい'],
      },
      {
        label: 'PDF',
        toolId: 'pdf-to-word',
        best: 'どこでも同じに見えるべき最終文書の送付。',
        pros: ['どの端末でも同じレイアウト', '共有・印刷・署名の標準', 'うっかり変更されにくい'],
        cons: ['自由な編集向けではない', '再編集には変換が必要'],
      },
    ],
    verdict:
      'まだ執筆・共同作業中ならDOCXのまま。校閲・印刷・署名のための最終版を送るならPDFに。PDFをまた編集したいなら、ブラウザでWordに戻せます。',
    faqs: [
      { q: 'DOCX→PDFで書式は保たれる？', a: 'はい。PDFは現在のレイアウトを固定するので、どこでも同じに見えます。だからこそ送付に好まれます。' },
      { q: 'PDFをWordに戻せますか？', a: 'はい。PDF→WordツールがテキストをWordや互換アプリで開ける編集可能な.docに取り出します。' },
    ],
    keywords: ['docx pdf 違い', 'word pdf', '文書 送付 フォーマット', 'docx pdf 変換'],
    relatedConverts: ['docx-to-pdf', 'pdf-to-word'],
  },
  {
    slug: 'aac-vs-mp3',
    category: 'audio',
    title: 'AAC vs MP3 — どの音声フォーマット？',
    h1: 'AAC vs MP3',
    description:
      'AACは低ビットレートで音が良く、MP3はとにかくどこでも再生できます。使い分け — ブラウザで無料変換。',
    intro:
      'AACとMP3はどちらも非可逆音声ですが、AACは新しい後継です。同じビットレートならAACの方がたいてい音が良く、特に低ビットレートで顕著なため、ストリーミングやApple端末の既定になっています。MP3は古いものの、これまで作られたあらゆる端末・アプリ・カーステレオで再生できます。',
    options: [
      {
        label: 'AAC',
        toolId: 'audio-convert',
        best: 'ストリーミング・Apple端末・低ビットレート音声。',
        pros: ['同じ容量でMP3より良い音質', 'ストリーミング・放送の標準', '低ビットレートで効率的'],
        cons: ['MP3よりわずかに汎用性が低い', '生のAACはコンテナが簡素', 'ごく古い端末でばらつき'],
      },
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: 'あらゆる端末での最大の互換性。',
        pros: ['とにかくどこでも再生', 'ビットレートを調整可能', '小さく扱いの知られたファイル'],
        cons: ['同じ容量ではAACよりわずかに劣る', 'ごく低ビットレートで弱い'],
      },
    ],
    verdict:
      'メガバイトあたりの音を重視する、またはApple環境にいるならAAC。新旧どんな端末でも再生できるファイルが必要ならMP3です。ブラウザでどちら向きにも変換できます。',
    faqs: [
      { q: 'AACはMP3より明らかに良い？', a: '低ビットレートではそうです — AACはMP3が失う細部を保ちます。高ビットレートではどちらも良く、違いは聞き分けにくいです。' },
      { q: 'MP3をAACに変換すると音質は上がる？', a: 'いいえ。どちらも非可逆なので、変換で失われた細部は戻せません。できるだけ高品質な元データから変換してください。' },
    ],
    keywords: ['aac mp3 違い', 'mp3 aac', '音声 フォーマット おすすめ', 'aac mp3 変換'],
    relatedConverts: ['mp3-to-aac', 'aac-to-mp3'],
  },
  {
    slug: 'webp-vs-avif',
    category: 'image',
    title: 'WebP vs AVIF — どの次世代画像フォーマット？',
    h1: 'WebP vs AVIF',
    description:
      'AVIFはより小さく圧縮し、WebPは対応が広い。どちらの次世代フォーマットを使うか — ブラウザで無料変換。',
    intro:
      'WebPとAVIFはどちらもJPG・PNGより容量で勝る最新フォーマットです。AVIF(AV1ベース)は同じ画質でたいていより小さく、HDRに対応しますが、エンコードが遅くまだ対応が全面的ではありません。WebPは数年早く、現在のほぼあらゆるブラウザや多くの編集ソフトに対応します。',
    options: [
      {
        label: 'WebP',
        toolId: 'image-convert',
        best: '今すぐ広く確実な対応が必要なWeb画像。',
        pros: ['JPG/PNGより小さい', '現在のブラウザすべてに対応', '透明度・アニメーション'],
        cons: ['AVIFよりわずかに大きい', 'ごく古いソフトには不向き'],
      },
      {
        label: 'AVIF',
        toolId: 'image-convert',
        best: '高画質で可能な限り最小のファイルを絞り出す。',
        pros: ['最高水準の圧縮', '広色域・HDR', '透明度に対応'],
        cons: ['エンコードが遅い', '古いブラウザ・アプリで非対応', '対応する編集ツールが少ない'],
      },
    ],
    verdict:
      '最小のファイルが欲しく、利用者が最新ブラウザならAVIF。今すぐ安全で広い対応が欲しいならWebPです。ブラウザで相互変換できます。',
    faqs: [
      { q: 'AVIFは常にWebPより小さい？', a: '通常、同じ画質ならAVIFの方が小さく、細部の多い写真では顕著です。単純な図ではその差は縮まります。' },
      { q: 'すべてのブラウザがAVIFを開けますか？', a: '現在の多くのブラウザは開けますが、対応はWebPより新しいです。最大限の到達にはJPGフォールバック付きのWebPが今も最も安全です。' },
    ],
    keywords: ['webp avif 違い', 'avif webp', '次世代 画像 フォーマット', 'webp avif 変換'],
    relatedConverts: ['webp-to-avif', 'avif-to-webp'],
  },
  {
    slug: 'svg-vs-png',
    category: 'image',
    title: 'SVG vs PNG — ロゴ・アイコンにはどちら？',
    h1: 'SVG vs PNG',
    description:
      'SVGはどんなサイズでもぼやけずに拡大でき、PNGは固定ピクセルのラスター。ロゴ・アイコンでの使い分け — ブラウザで無料変換。',
    intro:
      'SVGとPNGは異なる問題を解決します。SVGはベクターで、数式から描かれるためどんなサイズでも鮮明なまま保たれ、コードとして編集できるロゴ・アイコン・単純な図形に最適です。PNGは固定ピクセルのラスターで、可逆品質と透明度を持ち、スクショや細部の多いグラフィック、SVGでは表せない写真的なものに向きます。',
    options: [
      {
        label: 'SVG',
        toolId: 'image-svg-to-png',
        best: '鮮明に拡大すべきロゴ・アイコン・図形。',
        pros: ['どんなサイズでも無限に鮮明', '単純な図形なら極小', 'コードとして編集できる'],
        cons: ['写真は表現できない', '一部のアプリ・文書で非対応', '複雑な絵では重い'],
      },
      {
        label: 'PNG',
        toolId: 'image-convert',
        best: '透明度のあるスクショや細部の多いグラフィック。',
        pros: ['可逆でノイズが出ない', '透明度に対応', 'どこでも開ける'],
        cons: ['拡大するとぼやける', '大きい画像では容量大', 'ベクターではない'],
      },
    ],
    verdict:
      'どんなサイズでも鮮明であるべきロゴ・アイコンならSVG。スクショや細部の多い画像、どこでも開く必要があるならPNGです。固定画像が必要なときはブラウザでSVGをPNGにラスタライズしましょう。',
    faqs: [
      { q: 'PNGをSVGに戻せますか？', a: '本当の意味では戻せません — PNGはピクセルなので近似的にトレースできるだけです。元のベクターがあれば残しておきましょう。' },
      { q: 'SVGロゴがPNGにするとぼやけるのはなぜ？', a: 'PNGを高い解像度で書き出してください。ラスターは固定ピクセルなので、使う最大の場所に合わせてサイズを決めます。' },
    ],
    keywords: ['svg png 違い', 'png svg', 'ロゴ 画像 フォーマット', 'svg png 変換'],
    relatedConverts: ['svg-to-png'],
  },
  {
    slug: 'flac-vs-mp3',
    category: 'audio',
    title: 'FLAC vs MP3 — 可逆か小ささか',
    h1: 'FLAC vs MP3',
    description:
      'FLACは保管向けの可逆、MP3は小さくどこでも再生できます。使い分け — ブラウザで無料変換。',
    intro:
      'FLACとMP3は対極にあります。FLACは可逆で、原音をそのまま保つため保管や編集に最適ですが、ファイルは大きくなります。MP3は非可逆で、聞こえない細部を捨ててこれまで作られたあらゆる端末で再生できる極小ファイルにするため、共有や携帯での視聴に最適です。',
    options: [
      {
        label: 'FLAC',
        toolId: 'audio-convert',
        best: '原音を保つべき保管・編集。',
        pros: ['可逆 — 原音そのまま', 'WAVより小さい', '豊富なメタデータ・タグ'],
        cons: ['MP3よりずっと大きい', '一部の端末で非対応', 'Bluetoothで制約'],
      },
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: 'あらゆる端末での共有・携帯視聴。',
        pros: ['とにかくどこでも再生', '極小ファイル', 'ビットレートを調整可能'],
        cons: ['非可逆 — 原音より劣る', 'マスター保管には不向き'],
      },
    ],
    verdict:
      'マスターを保つ・音声を編集するならFLAC。共有したりスマホを音楽で満たすならMP3です。小さくしたいときはブラウザでFLACをMP3に変換しましょう。',
    faqs: [
      { q: 'FLACとMP3の違いは聞き分けられますか？', a: '高ビットレートのMP3(256〜320kbps)なら、ふだんの視聴ではほとんどの人が聞き分けられません。FLACが効くのは主に保管・編集です。' },
      { q: 'MP3をFLACに変換すると音質は上がる？', a: 'いいえ。FLACはMP3がすでに捨てた細部を戻せません。可逆な元データからのみFLACに変換してください。' },
    ],
    keywords: ['flac mp3 違い', 'mp3 flac', '可逆 非可逆 音声', 'flac mp3 変換'],
    relatedConverts: ['flac-to-mp3', 'wav-to-flac'],
  },
  {
    slug: 'm4a-vs-mp3',
    category: 'audio',
    title: 'M4A vs MP3 — どの音声フォーマット？',
    h1: 'M4A vs MP3',
    description:
      'M4A(AAC)はメガバイトあたりの音が良く、MP3はとにかくどこでも再生できます。使い分け — ブラウザで無料変換。',
    intro:
      'M4AとMP3はどちらも非可逆ですが、M4Aは新しいAACコーデックを包みます。同じ容量ならM4Aの方がたいてい少し音が良く、Apple環境の既定でチャプターやメタデータに対応します。MP3は古いものの、これまで作られたあらゆる端末・アプリ・カーステレオで再生でき、共有の安全な選択です。',
    options: [
      {
        label: 'M4A',
        toolId: 'audio-convert',
        best: 'Apple端末とメガバイトあたりの音質。',
        pros: ['同じ容量でMP3より良い音質', 'iTunes・Appleの既定', 'チャプターと豊富なメタデータ'],
        cons: ['一部の古い端末で非互換', 'MP3ほど汎用的でない', '対応する編集ツールが少ない'],
      },
      {
        label: 'MP3',
        toolId: 'audio-convert',
        best: 'あらゆる端末での最大の互換性。',
        pros: ['とにかくどこでも再生', '極小ファイル', 'ビットレートを調整可能'],
        cons: ['容量あたりの音質がわずかに劣る', 'ごく低ビットレートで弱い'],
      },
    ],
    verdict:
      'Apple環境にいる、またはメガバイトあたりの音を重視するならM4A。新旧問わず何でも開くファイルが必要ならMP3です。ブラウザでM4AをMP3に変換できます。',
    faqs: [
      { q: 'M4Aが一部の端末で再生できないのはなぜ？', a: '古いまたは非Apple端末はAAC/M4Aに対応しないことがあります。MP3に変換すればどこでも互換性が取れます。' },
      { q: 'M4A→MP3で音質は落ちますか？', a: 'どちらも非可逆なので、再エンコードでわずかに劣化します。高ビットレートなら気づきにくく、最良の元データから変換しましょう。' },
    ],
    keywords: ['m4a mp3 違い', 'mp3 m4a', '音声 フォーマット おすすめ', 'm4a mp3 変換'],
    relatedConverts: ['m4a-to-mp3', 'm4a-to-wav'],
  },
  {
    slug: 'mkv-vs-mp4',
    category: 'video',
    title: 'MKV vs MP4 — どの動画コンテナ？',
    h1: 'MKV vs MP4',
    description:
      'MKVは多トラックの高画質保管に柔軟、MP4はどこでも再生・アップロードできます。使い分け — ブラウザで無料変換。',
    intro:
      'MKVとMP4は同じ動画を収められるコンテナです。MKVは複数の音声・字幕トラックとほぼあらゆるコーデックを収められる柔軟なオープンコンテナで、高画質の保管に人気です。MP4はあらゆる端末で再生でき、どのプラットフォームにもきれいにアップロードできる汎用の配信コンテナです。',
    options: [
      {
        label: 'MKV',
        toolId: 'video-convert',
        best: '複数の音声・字幕トラックを持つ高画質保管。',
        pros: ['複数の音声・字幕トラック', 'ほぼあらゆるコーデックを収容', '高画質保管に最適'],
        cons: ['端末・SNSでの対応が弱い', 'ブラウザでの直接再生に制約', '共有には変換が必要'],
      },
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: '共有・アップロード・どこでも再生。',
        pros: ['あらゆる端末・プラットフォームで再生', 'アップロードの標準', '良好な圧縮'],
        cons: ['MKVよりトラック機能が少ない', '保管より配信向け'],
      },
    ],
    verdict:
      '複数の音声・字幕トラックを持つ映画を保管するならMKV。共有・アップロード・端末で再生するならMP4に変換を。ブラウザですぐに切り替えられます。',
    faqs: [
      { q: 'MKV→MP4で画質は落ちますか？', a: '同じコーデックを包み直すだけなら変わりません。再エンコードするとわずかな、通常気づかない劣化が加わります。' },
      { q: 'MKVが再生・アップロードできないのはなぜ？', a: '多くの端末やプラットフォームはMKVに対応しません。MP4(H.264)に変換するのが最も互換性のある対処です。' },
    ],
    keywords: ['mkv mp4 違い', 'mp4 mkv', '動画 コンテナ おすすめ', 'mkv mp4 変換'],
    relatedConverts: ['mkv-to-mp4', 'mkv-to-webm'],
  },
  {
    slug: 'gif-vs-mp4',
    category: 'video',
    title: 'GIF vs MP4 — 短いクリップにはどちら？',
    h1: 'GIF vs MP4',
    description:
      'MP4はずっと小さく滑らか、GIFはどこでもインライン自動再生されます。短いループでの使い分け — ブラウザで無料変換。',
    intro:
      'GIFとMP4はどちらも短い動きを見せますが、やり方が大きく違います。GIFは256色の古いアニメーションで、音や操作なしにどこでもインライン自動再生されるため、小さなリアクションやスタンプに最適ですが、細部の多いものでは膨らみます。MP4は本物の動画で、ずっと小さくフルカラーで滑らかですが、インライン画像というより動画プレイヤーです。',
    options: [
      {
        label: 'GIF',
        toolId: 'video-to-gif',
        best: '小さなインラインのリアクション・スタンプ・ミーム。',
        pros: ['どこでもインライン自動再生', 'プレイヤーや操作が不要', '埋め込みが簡単'],
        cons: ['細部の多いクリップでは巨大', '256色でバンディング', '無音'],
      },
      {
        label: 'MP4',
        toolId: 'video-convert',
        best: 'より長い・細部のある・音付きのもの。',
        pros: ['GIFよりはるかに小さい', 'フルカラーで滑らかな再生', '音声に対応'],
        cons: ['動画プレイヤーが必要', '「インライン画像」としては扱いにくい'],
      },
    ],
    verdict:
      '小さなループのリアクションやスタンプならGIFで十分。より長い・色やディテールの多いものならMP4 — 圧倒的に小さくなります。ブラウザでクリップをGIFにする(またはMP4のまま)変換ができます。',
    faqs: [
      { q: 'GIFが大きすぎるのはなぜ？', a: 'GIFは細部の多い動きに非効率です。長さを切り、サイズと色数を減らすか、MP4のままにすると — しばしば10分の1になります。' },
      { q: 'MP4をGIFにできますか？', a: 'はい。動画→GIFツールを使います。先に切り取って縮小すると、GIFを小さく保てます。' },
    ],
    keywords: ['gif mp4 違い', 'mp4 gif', 'gif 動画', '動画 gif 変換'],
    relatedConverts: ['mp4-to-gif', 'webm-to-gif'],
  },
  {
    slug: 'yaml-vs-json',
    category: 'docs',
    title: 'YAML vs JSON — どの設定フォーマット？',
    h1: 'YAML vs JSON',
    description:
      'YAMLは設定向けで人に優しく、JSONは厳格で汎用的なデータ交換向け。使い分け — ブラウザで無料変換。',
    intro:
      'YAMLとJSONは同じ種類の構造化データを違う優先順位で記述します。YAMLはインデントを使いコメントに対応するため、手で編集する設定ファイルをすっきり読めます。JSONは波かっこを使い厳格で汎用的 — あらゆる言語がそのまま解析するため、API・データ交換の標準です。',
    options: [
      {
        label: 'YAML',
        toolId: 'yaml-json',
        best: '人が編集する設定ファイル(CI・Docker・アプリ設定)。',
        pros: ['とても読みやすい', 'コメントに対応', '記号のノイズが少ない'],
        cons: ['インデントに敏感で壊れやすい', '一部の環境で非対応', '複雑になると曖昧'],
      },
      {
        label: 'JSON',
        toolId: 'yaml-json',
        best: 'API・データ交換・プログラム間のデータ。',
        pros: ['どこでもそのまま解析', '厳格で曖昧さがない', 'API・データの標準'],
        cons: ['コメント不可', '記号が冗長', '手編集が快適でない'],
      },
    ],
    verdict:
      'コメント付きで設定を手編集するならYAML。プログラム間やAPIでデータを交換するならJSONです。ブラウザで瞬時に相互変換できます。',
    faqs: [
      { q: 'YAMLはJSONのスーパーセットですか？', a: '実質的にはそうです — 有効なJSONは有効なYAMLなので、どのJSONもきれいにYAMLへ、そして元へ変換できます。' },
      { q: 'どちらがミスしにくい？', a: 'JSONです。波かっこが明示的だからです。YAMLのインデントは読みやすい反面、空白ひとつで壊れやすいです。' },
    ],
    keywords: ['yaml json 違い', 'json yaml', '設定 フォーマット', 'yaml json 変換'],
    relatedConverts: ['yaml-to-json', 'json-to-yaml'],
  },
  {
    slug: 'markdown-vs-html',
    category: 'docs',
    title: 'Markdown vs HTML — どちらで書く？',
    h1: 'Markdown vs HTML',
    description:
      'Markdownは速く読みやすいプレーンテキスト、HTMLは完全な制御でどのブラウザでも表示されます。使い分け — ブラウザで無料変換。',
    intro:
      'MarkdownとHTMLはしばしば同じWebページになります。Markdownは軽量なプレーンテキストで、書くのが速く読みやすくバージョン管理しやすく、そのままHTMLに変換できます。HTMLは構造・スタイル・メディアを完全に制御できるWeb標準ですが、手で書くと冗長です。多くの人はMarkdownで書いてHTMLに書き出します。',
    options: [
      {
        label: 'Markdown',
        toolId: 'md-html',
        best: 'ドキュメント・README・メモを素早く書く。',
        pros: ['読みやすいプレーンテキスト', 'バージョン管理に向く', 'どこでもHTMLに変換'],
        cons: ['複雑なレイアウトには限界', 'レンダラーごとに差', 'スタイル制御が弱い'],
      },
      {
        label: 'HTML',
        toolId: 'md-html',
        best: 'レイアウト・スタイル・メディアをWebで完全制御。',
        pros: ['あらゆるブラウザで開ける', '完全な構造とスタイル', 'リンク・メディア・スクリプト'],
        cons: ['手書きが冗長', 'ミスをしやすい', 'ソースとして読みにくい'],
      },
    ],
    verdict:
      'コンテンツを速く書き読みやすく保つならMarkdown。精密なレイアウトやWeb機能が必要ならHTMLです。ブラウザでMarkdownをHTMLに(そして戻すことも)変換できます。',
    faqs: [
      { q: 'Markdownの中にHTMLを混ぜられますか？', a: 'はい。多くのMarkdownレンダラーは生のHTMLをそのまま通すので、追加の制御が必要な場所にHTMLを差し込めます。' },
      { q: 'Markdown→HTMLで書式は保たれる？', a: 'はい。見出し・リスト・リンク・コード・強調はすべて対応するHTMLに、ライブプレビュー付きで対応します。' },
    ],
    keywords: ['markdown html 違い', 'html markdown', 'markdown html 変換', '執筆 フォーマット'],
    relatedConverts: ['md-to-html'],
  },
  {
    slug: 'xlsx-vs-csv',
    category: 'docs',
    title: 'XLSX vs CSV — どの表計算フォーマット？',
    h1: 'XLSX vs CSV',
    description:
      'XLSXは数式・書式・複数シートを保ち、CSVはどのツールも読める平らな表。使い分け — ブラウザで無料変換。',
    intro:
      'XLSXとCSVはどちらも表を保ちますが、豊かさが違います。XLSXは完全なExcel形式で、複数シート・数式・書式・型を1ファイルに収めます。CSVはカンマ区切りの単一の平らな表で書式がなく、小さくシンプルで、ほぼあらゆる表計算・DB・プログラムが読めます。',
    options: [
      {
        label: 'XLSX',
        toolId: 'xlsx-convert',
        best: '数式・書式・複数シートのある本物の表計算。',
        pros: ['数式と書式を保つ', '複数シートを1ファイルに', '型とスタイル'],
        cons: ['単純なデータには過剰', 'プログラム処理が難しい', 'Excel・互換アプリが必要'],
      },
      {
        label: 'CSV',
        toolId: 'xlsx-convert',
        best: '取り込み・書き出し・プログラム向けの表データ。',
        pros: ['あらゆるツールで開ける', '小さくシンプル', '生成・解析が簡単'],
        cons: ['数式・書式がない', '単一シートのみ', '文字コード・区切りの落とし穴'],
      },
    ],
    verdict:
      '数式・書式・複数シートを扱うならXLSX。取り込み・書き出しやプログラムにデータを渡すならCSVです。ブラウザで(JSONまで)相互変換できます。',
    faqs: [
      { q: 'XLSXをCSVで保存すると何か失いますか？', a: 'はい。CSVは1シートの値だけを残します。数式・書式・他のシートは失われます。' },
      { q: 'Excelで誰かに送るならどちら？', a: '数式・書式が必要ならXLSX、取り込む生データだけならCSVです。' },
    ],
    keywords: ['xlsx csv 違い', 'excel csv', '表計算 フォーマット', 'xlsx csv 変換'],
    relatedConverts: ['csv-to-xlsx', 'xlsx-to-csv'],
  },
  {
    slug: 'crontab-builder-vs-cron-explainer',
    category: 'dev',
    title: 'Crontab Builder vs Cron Explainer — cron式を作るか読み解くか',
    h1: 'Crontab Builder vs Cron Explainer',
    description:
      'Crontab Builderは構文を知らなくても選ぶだけでcron式を組み立て、Cron Explainerは既存の式が何をいつ実行するか解説します。どちらを使うか — ブラウザで完結する無料ツール。',
    intro:
      'この2つは逆方向の作業です。Crontab Builderはゼロから新しいスケジュールを作るためのもので、曜日・時刻・間隔をフォームで選べば正しいcron式が出ます。Cron Explainerはすでにある式を貼り付けて、何が・いつ動くのかを人間語で確認・検証するためのものです。どちらもブラウザ内で処理され、入力はアップロードされません。',
    options: [
      {
        label: 'Crontab Builder（cron式ビルダー）',
        toolId: 'crontab-builder',
        best: 'cronの書式を覚えていないのに新しいスケジュールを組みたいとき。',
        pros: ['分・時・日・月・曜日を選ぶだけで式が完成', '構文ミスを防げる', '次回実行のプレビューで意図を確認できる'],
        cons: ['すでにある式の意味を読み解く用途には向かない'],
      },
      {
        label: 'Cron Explainer（cron式の解説）',
        toolId: 'cron-explainer',
        best: '既存のcron式を貼り付けて、いつ実行されるか確かめたいとき。',
        pros: ['謎の式を日本語の説明に変換', '次回実行時刻を一覧で確認', 'レビューや引き継ぎで挙動を検証できる'],
        cons: ['新しいスケジュールをフォームから組み立てる機能はない'],
      },
    ],
    verdict:
      'これから新しいジョブを設定するならCrontab Builder、既存の式の意味や次回実行を確かめたいならCron Explainerです。作った式をExplainerで読み直して検算する使い方も便利です。',
    faqs: [
      {
        q: 'Builderで作った式が正しいか確認できますか？',
        a: 'はい。Crontab Builderで組み立てた式をCron Explainerに貼り付ければ、何がいつ実行されるかを日本語で読み返して検証できます。すべてブラウザ内で処理されます。',
      },
      {
        q: '曜日の指定（0と7など）はどう扱われますか？',
        a: 'どちらのツールも標準cronに従い、0と7をどちらも日曜として扱います。Explainerなら貼り付けた式の曜日解釈をそのまま確認できます。',
      },
    ],
    keywords: ['crontab builder vs cron explainer', 'cron 式 作成', 'cron 式 解説', 'crontab 書き方'],
  },
  {
    slug: 'hash-identifier-vs-text-hash',
    category: 'security',
    title: 'Hash Identifier vs Text Hash Generator — ハッシュを識別するか生成するか',
    h1: 'Hash Identifier vs Text Hash Generator',
    description:
      'Hash Identifierは手元のハッシュがどのアルゴリズムか推定し、Text Hash Generatorはテキストからハッシュを作ります。どちらを使うか — ブラウザで完結する無料ツール。',
    intro:
      'この2つは入口が逆です。Hash Identifierはすでにハッシュ文字列を持っていて、それがMD5・SHA-1・SHA-256・bcryptのどれで作られたかを長さや形から推定します。Text Hash Generatorは元のテキストや入力からハッシュを生成します。どちらもブラウザ内で計算され、入力はアップロードされません。',
    options: [
      {
        label: 'Hash Identifier（ハッシュ識別）',
        toolId: 'hash-identifier',
        best: '正体不明のハッシュ文字列のアルゴリズムを当てたいとき。',
        pros: ['長さや接頭辞から候補を提示', 'MD5・SHA-1・SHA-256・bcryptなどを判別', 'ログや設定で見つけた謎の値を調べられる'],
        cons: ['元のテキストを復元することはできない'],
      },
      {
        label: 'Text Hash Generator（ハッシュ生成）',
        toolId: 'text-hash',
        best: 'テキストから実際にハッシュ値を作りたいとき。',
        pros: ['複数アルゴリズムでハッシュを生成', '整合性チェックや指紋作成に使える', '即座に結果をコピーできる'],
        cons: ['既存ハッシュの種類を当てる用途には使えない'],
      },
    ],
    verdict:
      '手元にあるハッシュの正体を知りたいならHash Identifier、入力からハッシュを作りたいならText Hash Generatorです。識別で種類を特定してから、同じアルゴリズムで生成して照合することもできます。',
    faqs: [
      {
        q: 'ハッシュから元のテキストに戻せますか？',
        a: 'いいえ。ハッシュは一方向で、元の入力を復元することはできません。Identifierは種類の推定、Generatorは生成に使います。どちらもブラウザ内で処理されます。',
      },
      {
        q: '識別はどうやってアルゴリズムを当てるのですか？',
        a: '文字数や接頭辞などの形から候補を絞ります。例えば32桁の16進数はMD5、64桁はSHA-256の可能性が高い、といった推定です。確定ではなく候補の提示です。',
      },
    ],
    keywords: ['hash identifier vs text hash', 'ハッシュ 種類 判別', 'ハッシュ 生成', 'md5 sha256 識別'],
  },
  {
    slug: 'css-clamp-vs-css-units',
    category: 'dev',
    title: 'CSS clamp() vs CSS単位変換 — 可変サイズか固定値の換算か',
    h1: 'CSS clamp() vs CSS Unit Converter',
    description:
      'clamp()は最小と最大の間でビューポートに応じて伸縮する可変サイズを作り、CSS単位変換はpx/rem/em/ptを1つの固定値として換算します。どちらを使うか — ブラウザで完結する無料ツール。',
    intro:
      'この2つは目的が違います。clamp()はレスポンシブな可変サイズ向けで、最小値・最大値・ビューポート連動の中間値を組み合わせて画面幅に応じて滑らかに変化する値を作ります。CSS単位変換は固定された1つの値をpxとrem、emやptの間で換算するだけのものです。どちらの計算もブラウザ内で完結します。',
    options: [
      {
        label: 'CSS clamp()（可変サイズ生成）',
        toolId: 'css-clamp',
        best: '画面幅に応じて滑らかに伸縮する文字や余白を作りたいとき。',
        pros: ['最小〜最大の範囲でビューポート連動', 'メディアクエリを書かずに流体タイポグラフィ', '上限・下限で崩れを防げる'],
        cons: ['固定値どうしの単純な単位換算には大げさ'],
      },
      {
        label: 'CSS Unit Converter（単位変換）',
        toolId: 'css-units',
        best: '1つの固定値をpx・rem・em・ptの間で換算したいとき。',
        pros: ['px↔rem↔em↔ptを即換算', 'ルートフォントサイズ基準で計算', 'デザインの数値をすばやく合わせられる'],
        cons: ['画面幅に応じて変化する値は作れない'],
      },
    ],
    verdict:
      'レスポンシブに伸縮させたいならclamp()、固定の1値を別の単位に直したいだけならCSS単位変換です。換算で基準値を決めてから、その最小・最大をclamp()に渡す流れも自然です。',
    faqs: [
      {
        q: 'clamp()の中の単位もこのツールで揃えられますか？',
        a: 'はい。まずCSS単位変換でpxをremなどに換算して基準を決め、その値をclamp()ビルダーの最小・最大に使えば一貫した可変サイズが作れます。すべてブラウザ内で計算されます。',
      },
      {
        q: 'remとemの違いはどちらのツールで分かりますか？',
        a: 'CSS単位変換がルートフォントサイズ基準で換算するので、remの基準が分かります。emは親要素基準で変わる点に注意して使い分けてください。',
      },
    ],
    keywords: ['css clamp vs css units', 'clamp 流体タイポグラフィ', 'px rem 変換', 'css 単位 換算'],
  },
  {
    slug: 'luhn-generator-vs-cc-validate',
    category: 'security',
    title: 'Luhn Generator vs カード番号検証 — テスト番号を作るか検証するか',
    h1: 'Luhn Generator vs Card Number Validator',
    description:
      'Luhn GeneratorはQAやフォーム検証用のLuhn有効なテスト番号を作り、カード番号検証は既存番号のLuhnチェックサムを確かめます。どちらもテスト専用で実在・有効な口座ではありません。ブラウザで完結する無料ツール。',
    intro:
      'この2つはテスト目的の表裏です。Luhn Generatorは入力フォームやQAで使うために、Luhnアルゴリズムを満たすダミーのカード番号を生成します。カード番号検証は手元の番号がLuhnチェックを通るかを確認します。いずれも生成・検証される番号はテスト専用で、実在する有効なカードや口座を表すものではありません。すべてブラウザ内で処理され、入力はアップロードされません。',
    options: [
      {
        label: 'Luhn Generator（テスト番号生成）',
        toolId: 'luhn-generator',
        best: 'フォームやQAでLuhn有効なダミー番号が必要なとき。',
        pros: ['Luhnチェックを通るテスト番号を生成', '入力検証やデモのサンプル作りに便利', '何件でもすぐ作れる'],
        cons: ['生成番号はテスト専用で実在カードではない', '実際の決済には一切使えない'],
      },
      {
        label: 'Card Number Validator（番号検証）',
        toolId: 'cc-validate',
        best: '既存の番号がLuhnチェックサムを満たすか確かめたいとき。',
        pros: ['Luhnチェックの成否を即判定', '桁の打ち間違いを発見できる', 'ブランド推定の目安も得られる'],
        cons: ['チェックサムが合っても実在・有効とは限らない', '番号を新規に作る機能はない'],
      },
    ],
    verdict:
      'テスト用のダミー番号を作るならLuhn Generator、手元の番号の整合性を確かめるならカード番号検証です。どちらもあくまでLuhn計算上の話で、実在・有効な口座を意味しない点に注意してください。すべてブラウザ内で処理されます。',
    faqs: [
      {
        q: '生成した番号で実際に決済できますか？',
        a: 'いいえ。Luhnチェックを通るだけのテスト専用番号で、実在する有効なカードや口座ではありません。決済には一切使えず、QAやフォーム検証のためのものです。',
      },
      {
        q: '検証でLuhnを通れば本物のカードですか？',
        a: 'いいえ。Luhnチェックは桁の打ち間違いを見つけるための計算にすぎず、実在・有効・利用可能かは判定できません。あくまでチェックサムの確認です。',
      },
    ],
    keywords: ['luhn generator vs cc validate', 'テスト カード番号 生成', 'luhn チェック 検証', 'ダミー カード番号'],
  },
  {
    slug: 'json-schema-vs-json-to-ts',
    category: 'dev',
    title: 'JSON Schema vs JSON to TypeScript — 実行時検証か型安全か',
    h1: 'JSON Schema vs JSON to TypeScript',
    description:
      'JSON Schema Generatorは実行時バリデーション用のスキーマを作り、JSON to TypeScriptはコンパイル時の型安全のための型・インターフェースを生成します。どちらを使うか — ブラウザで完結する無料ツール。',
    intro:
      'この2つはJSONから出す成果物が違います。JSON Schema Generatorは実行時にデータの形を検証するためのJSON Schemaを出力します。JSON to TypeScriptはコンパイル時に型をチェックするためのTypeScriptの型・インターフェースを出力します。どちらの生成もブラウザ内で完結し、入力はアップロードされません。',
    options: [
      {
        label: 'JSON Schema Generator（スキーマ生成）',
        toolId: 'json-schema',
        best: '受け取ったデータを実行時に検証したいとき。',
        pros: ['実行時にデータ構造を検証できる', 'APIやフォームの入力チェックに使える', '言語を問わず共有できる仕様になる'],
        cons: ['エディタ上の型補完やコンパイル時チェックは得られない'],
      },
      {
        label: 'JSON to TypeScript（型生成）',
        toolId: 'json-to-ts',
        best: 'TypeScriptでコンパイル時の型安全がほしいとき。',
        pros: ['interface/typeを自動生成', 'エディタ補完とコンパイル時チェック', 'リファクタリングが安全になる'],
        cons: ['実行時に実データを検証する仕組みではない'],
      },
    ],
    verdict:
      '実行時に入力を検証したいならJSON Schema、TypeScriptのコード上で型安全を得たいならJSON to TypeScriptです。両方を組み合わせ、スキーマで検証しつつ型でも守る設計もよくあります。すべてブラウザ内で処理されます。',
    faqs: [
      {
        q: '両方を一緒に使う意味はありますか？',
        a: 'はい。JSON Schemaで実行時に外部入力を検証し、JSON to TypeScriptでコード内の型安全を確保すれば、境界と内部の両方を守れます。どちらの生成もブラウザ内で完結します。',
      },
      {
        q: 'TypeScriptの型だけで実行時の検証はできますか？',
        a: 'いいえ。TypeScriptの型はコンパイル時に消えるため、実行時の値は検証されません。実データのチェックにはJSON Schemaのような実行時の仕組みが必要です。',
      },
    ],
    keywords: ['json schema vs json to ts', 'json スキーマ 生成', 'json typescript 型 変換', '実行時 検証 型安全'],
  },
  {
    slug: 'markdown-table-vs-html-table',
    category: 'docs',
    title: 'Markdownテーブル vs HTMLテーブル — READMEかWebページか',
    h1: 'Markdown Table Generator vs CSV to HTML Table',
    description:
      'Markdown Table GeneratorはGitHub風のMarkdown表を、CSV to HTML TableはHTMLの<table>マークアップを出力します。どちらを使うか — ブラウザで完結する無料ツール。',
    intro:
      'この2つは出力する形式が違います。Markdown Table GeneratorはREADMEやドキュメント、Wikiに貼れるGFM（GitHub Flavored Markdown）の表を作ります。CSV to HTML TableはWebページやメールに埋め込めるHTMLの<table>マークアップを出力します。どちらの変換もブラウザ内で完結し、入力はアップロードされません。',
    options: [
      {
        label: 'Markdown Table Generator（Markdown表）',
        toolId: 'markdown-table-gen',
        best: 'README・ドキュメント・WikiにそのままMarkdown表を貼りたいとき。',
        pros: ['GFM対応の読みやすい表記', 'GitHubやドキュメントでそのまま描画', 'プレーンテキストで差分も追いやすい'],
        cons: ['細かいスタイルやセル結合などの装飾はできない'],
      },
      {
        label: 'CSV to HTML Table（HTML表）',
        toolId: 'csv-to-html',
        best: 'WebページやメールにHTMLの表を埋め込みたいとき。',
        pros: ['そのまま貼れる<table>マークアップ', 'CSSで自由にスタイリングできる', 'メールやサイトで安定して表示'],
        cons: ['MarkdownのREADMEには直接そぐわない'],
      },
    ],
    verdict:
      'README・ドキュメント・WikiならMarkdownテーブル、WebページやメールならHTMLテーブルです。同じ表データでも貼り先に合わせて使い分けるのが手早いです。すべてブラウザ内で処理されます。',
    faqs: [
      {
        q: 'GitHubのREADMEにはどちらが良いですか？',
        a: 'Markdownテーブルです。GitHubはGFMの表をそのまま描画するため、HTMLを書くより簡潔で差分も読みやすくなります。変換はブラウザ内で完結します。',
      },
      {
        q: 'CSVのデータからどちらも作れますか？',
        a: 'CSV to HTML TableはCSVを直接HTML表に変換します。Markdown表が必要なら同じ列・行のデータをMarkdown Table Generatorで整えれば、貼り先に応じて両方そろえられます。',
      },
    ],
    keywords: ['markdown table vs html table', 'markdown 表 作成', 'csv html 表 変換', 'readme 表 埋め込み'],
  },
  {
    slug: 'world-clock-vs-timezone-converter',
    category: 'util',
    title: 'World Clock vs タイムゾーン変換 — 各地の今を一覧か特定時刻の換算か',
    h1: 'World Clock vs Time Zone Converter',
    description:
      'World Clockは複数都市の現在時刻を一目で並べ、タイムゾーン変換は特定の日時を2つのゾーン間で換算します。どちらを使うか — ブラウザで完結する無料ツール。',
    intro:
      'この2つは見たいものが違います。World Clockは世界各地の「今」の時刻を同時に並べて、いま何時かをパッと把握するためのものです。タイムゾーン変換は特定の日付・時刻を、あるゾーンから別のゾーンへ正確に換算するためのものです。どちらの計算もブラウザ内で行われます。',
    options: [
      {
        label: 'World Clock（世界時計）',
        toolId: 'world-clock',
        best: '複数都市の現在時刻をまとめて確認したいとき。',
        pros: ['多数の都市の今を一画面で一覧', '海外の相手が起きている時間帯を把握', '常に現在時刻を表示'],
        cons: ['特定の未来・過去の日時を換算する用途には向かない'],
      },
      {
        label: 'Time Zone Converter（タイムゾーン変換）',
        toolId: 'timezone',
        best: '特定の日時を2つのゾーン間で正確に換算したいとき。',
        pros: ['任意の日付・時刻を相互に換算', '会議や締切の時刻合わせに最適', 'サマータイムも考慮される'],
        cons: ['多数都市の現在時刻を一覧する用途ではない'],
      },
    ],
    verdict:
      '各地の今を一目で見たいならWorld Clock、ある特定の日時を別ゾーンに直したいならタイムゾーン変換です。まず世界時計で時差感をつかみ、変換で会議時刻を確定する流れが便利です。すべてブラウザ内で処理されます。',
    faqs: [
      {
        q: '海外との会議時刻を決めるならどちら？',
        a: 'タイムゾーン変換です。具体的な日付・時刻を入力して相手のゾーンに換算すれば、サマータイムも考慮した正確な開始時刻が分かります。計算はブラウザ内で完結します。',
      },
      {
        q: 'サマータイムは正しく扱われますか？',
        a: 'はい。タイムゾーン変換は各地域のサマータイムを考慮して換算します。World Clockも各都市の現在時刻にDSTが反映されます。',
      },
    ],
    keywords: ['world clock vs timezone converter', '世界時計 一覧', 'タイムゾーン 変換', '時差 計算'],
  },
  {
    slug: 'readability-vs-word-count',
    category: 'text',
    title: 'Readability Score vs 文字数カウント — 読みやすさか分量か',
    h1: 'Readability Score vs Word & Character Count',
    description:
      'Readability Scoreは文章の読みやすさ（Flesch読みやすさ・学年レベル）を測り、文字数カウントは単語数・文字数・長さを数えます。どちらを使うか — ブラウザで完結する無料ツール。',
    intro:
      'この2つは測る対象が違います。Readability Scoreは文章がどれだけ読みやすいかを、Flesch読みやすさスコアや想定学年として評価します。文字数カウントは単語数・文字数・長さといった分量そのものを数えます。どちらの計算もブラウザ内で行われ、文章はアップロードされません。',
    options: [
      {
        label: 'Readability Score（読みやすさ判定）',
        toolId: 'readability-score',
        best: '文章が難しすぎないか、読みやすさを確かめたいとき。',
        pros: ['Flesch読みやすさや想定学年で評価', '一文の長さや難語の傾向が分かる', '読み手に合わせて推敲できる'],
        cons: ['単純な文字数・単語数の集計用途ではない'],
      },
      {
        label: 'Word & Character Count（文字数カウント）',
        toolId: 'text-count',
        best: '単語数・文字数・長さの制限に収めたいとき。',
        pros: ['単語数・文字数を即集計', '文字数制限のチェックに最適', 'シンプルで速い'],
        cons: ['読みやすさや難易度は測れない'],
      },
    ],
    verdict:
      '文章の難易度や読みやすさを整えたいならReadability Score、分量や文字数制限を確認したいなら文字数カウントです。まず分量を整えてから読みやすさを調整する流れも有効です。すべてブラウザ内で処理されます。',
    faqs: [
      {
        q: '読みやすさスコアを上げるにはどうすれば？',
        a: '一文を短くし、難しい語を平易な語に置き換えると改善しやすいです。Readability Scoreで数値を見ながら推敲し、文字数カウントで分量も確認できます。処理はブラウザ内で完結します。',
      },
      {
        q: '文字数制限のチェックにはどちらですか？',
        a: '文字数カウントです。単語数・文字数を即座に数えるので、投稿や提出の文字数制限に収まっているかをすばやく確認できます。',
      },
    ],
    keywords: ['readability vs word count', '読みやすさ スコア', '文字数 カウント', 'flesch 読みやすさ'],
  },
  {
    slug: 'bill-split-vs-tip-calculator',
    category: 'util',
    title: 'Bill Splitter vs チップ計算 — 割り勘かチップ額か',
    h1: 'Bill Splitter vs Tip Calculator',
    description:
      'Bill Splitterは税・チップ込みの合計を人数で等分し、チップ計算は会計に対するチップの額や率だけを出します。どちらを使うか — ブラウザで完結する無料ツール。',
    intro:
      'この2つは出したい答えが違います。Bill Splitterは税やチップを含めた合計を、N人で均等に割って1人あたりの支払額を出します。チップ計算は会計額に対するチップの金額や割合だけを計算します。どちらの計算もブラウザ内で完結します。',
    options: [
      {
        label: 'Bill Splitter（割り勘）',
        toolId: 'bill-split',
        best: '税・チップ込みの合計を複数人で等分したいとき。',
        pros: ['税・チップを含めて合計を等分', '人数を変えても即再計算', '1人あたりの支払額がすぐ分かる'],
        cons: ['チップだけを単独で求める用途には大げさ'],
      },
      {
        label: 'Tip Calculator（チップ計算）',
        toolId: 'tip-calc',
        best: '会計に対するチップの額や率だけを知りたいとき。',
        pros: ['チップの金額や率をすぐ算出', '率を変えてすばやく比較', '合計やチップ込み金額も確認できる'],
        cons: ['複数人で均等に割る計算は主目的ではない'],
      },
    ],
    verdict:
      'みんなで合計を等分したいならBill Splitter、チップ額だけを知りたいならチップ計算です。チップ計算でチップ込みの合計を出してから、その合計をBill Splitterで割る流れも自然です。すべてブラウザ内で処理されます。',
    faqs: [
      {
        q: 'チップ込みで割り勘するにはどうすれば？',
        a: 'Bill Splitterは税・チップを含めた合計を人数で等分できます。あるいはチップ計算でチップ込みの合計を出し、その額をBill Splitterに入れて割ることもできます。計算はブラウザ内で完結します。',
      },
      {
        q: '端数はどちらのツールで調整できますか？',
        a: 'Bill Splitterで人数を変えれば1人あたりの額が再計算されます。チップ率による端数はチップ計算で率を微調整して合わせられます。',
      },
    ],
    keywords: ['bill split vs tip calculator', '割り勘 計算', 'チップ 計算', '会計 割り勘 チップ'],
  },
  {
    slug: 'ideal-weight-vs-bmi',
    category: 'util',
    title: 'Ideal Weight vs BMI計算 — 身長からの目標体重か今の判定か',
    h1: 'Ideal Weight vs BMI Calculator',
    description:
      'Ideal Weightは身長から目標体重の範囲（Devine式・BMI22基準）を推定し、BMI計算は今の身長と体重から肥満度（BMI）を判定します。どちらを使うか — ブラウザで完結する無料ツール。',
    intro:
      'この2つは入口と出口が逆です。Ideal Weightは身長から、目標としうる体重の目安レンジ（Devine式やBMI22基準）を出します。BMI計算は今の身長と体重を入力して、現在の肥満度（BMI）と判定区分を求めます。どちらの計算もブラウザ内で行われ、入力は保存されません。',
    options: [
      {
        label: 'Ideal Weight（理想体重）',
        toolId: 'ideal-weight',
        best: '身長を基準に目標体重の目安レンジを知りたいとき。',
        pros: ['身長から目標体重の範囲を推定', 'Devine式やBMI22基準を参照', '目標設定の出発点になる'],
        cons: ['今の体重が健康域かどうかの判定はしない'],
      },
      {
        label: 'BMI Calculator（BMI計算）',
        toolId: 'bmi-calc',
        best: '今の身長と体重から肥満度を判定したいとき。',
        pros: ['現在のBMIと判定区分を算出', '身長と体重だけで手軽', '健康域かどうかの目安が分かる'],
        cons: ['身長から目標体重を逆算する用途ではない'],
      },
    ],
    verdict:
      '身長から目指す体重の範囲を知りたいならIdeal Weight、今の状態を評価したいならBMI計算です。まずBMIで現状を確認し、Ideal Weightで目標を決める流れがおすすめです。いずれの計算もブラウザ内で完結します。',
    faqs: [
      {
        q: '理想体重とBMIはどう使い分けますか？',
        a: 'Ideal Weightは身長から目標体重のレンジを示し、BMI計算は今の体重が健康域かを判定します。現状確認はBMI、目標設定はIdeal Weightという使い分けが分かりやすいです。計算はブラウザ内で完結します。',
      },
      {
        q: 'これらの数値は医療的な診断ですか？',
        a: 'いいえ。あくまで一般的な目安の計算で、診断や医療助言ではありません。健康に関する判断は専門家に相談してください。',
      },
    ],
    keywords: ['ideal weight vs bmi', '理想体重 計算', 'bmi 計算', '目標体重 身長'],
  },
  {
    slug: 'ovulation-vs-due-date',
    category: 'util',
    title: '排卵日計算 vs 出産予定日計算 — どちらを使う？',
    h1: '排卵日計算 vs 出産予定日計算',
    description:
      '排卵日計算は最終月経と周期から妊娠しやすい時期を、出産予定日計算は妊娠後の予定日を推定します。どちらも目安で医療助言ではありません — 無料・ブラウザで。',
    intro:
      '排卵日計算は「これから妊娠を計画する」ための妊娠可能期間(フ​ァータイルウィンドウ)を、出産予定日計算は「すでに妊娠している」場合の予定日を求めます。どちらもあくまで推定であり、医療上の診断やアドバイスではありません。計算はすべてブラウザ内で行われ、入力した情報は送信されません。',
    options: [
      {
        label: '排卵日計算',
        toolId: 'ovulation-calc',
        best: 'これから妊娠を計画し、妊娠しやすい時期を知りたいとき。',
        pros: ['最終月経開始日と周期から排卵日・妊娠可能期間を推定', '周期の長さに合わせて計算を調整できる', 'ブラウザ内で完結し、入力情報は送信されない'],
        cons: ['あくまで平均周期に基づく目安で、実際の排卵は人によりずれる', '排卵検査薬や基礎体温の代わりにはならない'],
      },
      {
        label: '出産予定日計算',
        toolId: 'pregnancy-due-date',
        best: 'すでに妊娠していて、出産予定日の目安が知りたいとき。',
        pros: ['ネーゲレ概算法(最終月経+280日)で予定日を推定', '妊娠週数のおおよその目安にも使える', 'ブラウザ内で計算され、データは外部に出ない'],
        cons: ['周期や受精日の個人差で予定日は前後する', '正確な評価は超音波検査など医療機関の判断が必要'],
      },
    ],
    verdict:
      '妊娠を「計画する」段階なら排卵日計算で妊娠しやすい時期を、すでに「妊娠している」なら出産予定日計算で予定日の目安を。どちらの結果も推定値であり、医療上の診断や助言ではないため、健康に関わる判断は必ず医師に相談してください。',
    faqs: [
      {
        q: '排卵日計算と出産予定日計算は何が違いますか？',
        a: '排卵日計算は妊娠前に「妊娠しやすい時期」を探すためのもの、出産予定日計算は妊娠後に「予定日」を推定するためのものです。目的が妊娠の前か後かで使い分けます。どちらもブラウザ内で計算されます。',
      },
      {
        q: 'これらの計算結果は信頼できる医療情報ですか？',
        a: 'いいえ。一般的な平均値に基づく目安であり、診断や医療助言ではありません。実際の排卵日や出産予定日は個人差が大きいため、正確な情報は産婦人科などの専門家に確認してください。',
      },
    ],
    keywords: ['排卵日 vs 出産予定日', '排卵日 計算', '出産予定日 計算', '妊娠可能 時期'],
  },
  {
    slug: 'date-add-vs-date-diff',
    category: 'util',
    title: '日付加算・減算 vs 日数差計算 — どちらを使う？',
    h1: '日付加算・減算 vs 日数差計算',
    description:
      '日付加算・減算はある日付を前後にずらし、日数差計算は2つの日付の間隔を数えます。どちらをいつ使うか — 無料・ブラウザで。',
    intro:
      '日付加算・減算は基準日から「○日後・○週間前」のように未来や過去の日付を求め、日数差計算は2つの日付の「間の日数」を測ります。やりたいことが日付を導き出すのか、間隔を測るのかで使い分けます。どちらもブラウザ内で計算されます。',
    options: [
      {
        label: '日付加算・減算',
        toolId: 'date-add',
        best: '基準日から一定期間ずらした未来・過去の日付を知りたいとき。',
        pros: ['日・週・月・年単位で前後に移動できる', '締切や記念日など「○日後」の日付を一発算出', 'ブラウザ内で計算され、入力は送信されない'],
        cons: ['2つの日付の間隔を測る用途には向かない'],
      },
      {
        label: '日数差計算',
        toolId: 'date-diff',
        best: '2つの日付の間が何日あるかを数えたいとき。',
        pros: ['2日付間の日数・期間を正確に算出', 'イベントまでの残り日数や経過日数の確認に便利', 'ブラウザ内で完結し、データは外部に出ない'],
        cons: ['基準日からずらした日付を求める用途には向かない'],
      },
    ],
    verdict:
      '「日付を出したい」なら日付加算・減算、「間隔を測りたい」なら日数差計算です。基準日に期間を足して目標日を求めるのか、すでにある2つの日付の差を知りたいのかで選びましょう。',
    faqs: [
      {
        q: '日付加算・減算と日数差計算はどう違いますか？',
        a: '日付加算・減算は1つの日付に期間を足し引きして別の日付を求めます。日数差計算は2つの日付を入力してその間隔を数えます。出力が「日付」か「日数」かが違いです。',
      },
      {
        q: '月末や閏年も正しく扱えますか？',
        a: 'はい。月単位の加算では月末をはみ出さないよう調整し、日数差計算も閏年を含めて正しく数えます。すべてブラウザ内で処理されます。',
      },
    ],
    keywords: ['date add vs date diff', '日付 加算 減算', '日数差 計算', '日付 計算'],
  },
  {
    slug: 'csv-to-sql-vs-csv-to-html',
    category: 'docs',
    title: 'CSV→SQL vs CSV→HTMLテーブル — どちらに変換する？',
    h1: 'CSV→SQL vs CSV→HTMLテーブル',
    description:
      'CSV→SQLはデータベースに取り込むINSERT文を、CSV→HTMLテーブルはページに表示する<table>を生成します。用途で選ぶ — 無料・ブラウザで。',
    intro:
      'CSV→SQLはCSVをデータベースへ流し込むためのINSERT文に変換し、CSV→HTMLテーブルはWebページにそのまま貼れる<table>に変換します。データを「データベースに入れる」のか「ページに表示する」のかで使い分けます。変換はブラウザ内で行われ、CSVはアップロードされません。',
    options: [
      {
        label: 'CSV→SQL',
        toolId: 'csv-to-sql',
        best: 'CSVのデータをデータベースに取り込みたいとき。',
        pros: ['各行をINSERT文に変換してDBに投入できる', 'テーブル名や列名を指定して実用的なSQLを生成', 'ブラウザ内で処理され、データは送信されない'],
        cons: ['そのままWebページに表示する用途には向かない'],
      },
      {
        label: 'CSV→HTMLテーブル',
        toolId: 'csv-to-html',
        best: 'CSVの内容をWebページに表として載せたいとき。',
        pros: ['ページに貼り付けられる<table>マークアップを生成', 'ヘッダー行を見出しセルとして扱える', 'ブラウザ内で変換され、データは外部に出ない'],
        cons: ['データベースへの取り込みには使えない'],
      },
    ],
    verdict:
      'データを「データベースに入れる」ならCSV→SQL、「Webページに見せる」ならCSV→HTMLテーブルです。同じCSVでも、出力先がDBか画面かで選びましょう。どちらもブラウザ内で完結します。',
    faqs: [
      {
        q: 'CSV→SQLとCSV→HTMLテーブルはどちらを使うべきですか？',
        a: 'データベースにレコードを追加したいならCSV→SQL(INSERT文)、Webページに表として表示したいならCSV→HTMLテーブル(<table>)を選びます。目的の出力形式で決まります。',
      },
      {
        q: 'CSVファイルはどこかにアップロードされますか？',
        a: 'いいえ。どちらの変換もブラウザ内で実行され、CSVの内容がサーバーに送信されることはありません。',
      },
    ],
    keywords: ['csv to sql vs csv to html', 'csv sql 変換', 'csv html テーブル', 'csv 変換'],
  },
  {
    slug: 'image-threshold-vs-black-white',
    category: 'image',
    title: '画像のしきい値(2値化) vs 白黒(グレースケール) — どちらを使う？',
    h1: '画像のしきい値 vs 白黒',
    description:
      'しきい値は輝度の境目で純粋な白黒に2値化し、白黒はなめらかなグレースケールに変換します。スキャンか写真かで選ぶ — 無料・ブラウザで。',
    intro:
      'しきい値(2値化)は明るさのカットオフで画像を純粋な白と黒の2色に分け、白黒はトーンを残したグレースケールに変換します。スキャン文書やステンシル・線画には2値化、写真の質感を残すならグレースケールが向きます。処理はすべてブラウザ内で行われます。',
    options: [
      {
        label: '画像のしきい値(2値化)',
        toolId: 'image-threshold',
        best: 'スキャン・線画・ステンシルを純粋な白黒2色にしたいとき。',
        pros: ['輝度のカットオフで白と黒の2色に明確に分離', '文書スキャンの読みやすさや印刷の鮮明さが向上', 'ブラウザ内で処理され、画像は送信されない'],
        cons: ['中間調が失われるため写真には不向き'],
      },
      {
        label: '白黒(グレースケール)',
        toolId: 'image-black-white',
        best: '写真のトーンを残したままモノクロにしたいとき。',
        pros: ['なめらかな階調を保ったグレースケールに変換', '写真らしい陰影・質感を維持できる', 'ブラウザ内で変換され、画像は外部に出ない'],
        cons: ['2色のくっきりした白黒が欲しい用途には向かない'],
      },
    ],
    verdict:
      'くっきり2色にしたい(スキャン・線画・ステンシル)ならしきい値、写真の階調を残したいなら白黒(グレースケール)です。被写体が文書か写真かで選びましょう。どちらもブラウザ内で完結します。',
    faqs: [
      {
        q: 'しきい値と白黒は何が違いますか？',
        a: 'しきい値は明るさの境目で白か黒かの2色に分ける2値化で、白黒は中間のグレーを残したグレースケール変換です。中間調を残すかどうかが大きな違いです。',
      },
      {
        q: 'スキャンした書類にはどちらが向いていますか？',
        a: '文字をくっきりさせたい書類スキャンには、背景を白・文字を黒に分けるしきい値(2値化)が向いています。処理はブラウザ内で行われます。',
      },
    ],
    keywords: ['image threshold vs black white', '画像 2値化', '画像 白黒 変換', 'グレースケール 変換'],
  },
  {
    slug: 'markdown-to-text-vs-markdown-preview',
    category: 'docs',
    title: 'Markdown→テキスト vs Markdownプレビュー — どちらを使う？',
    h1: 'Markdown→テキスト vs Markdownプレビュー',
    description:
      'Markdown→テキストは記法をすべて取り除いた素のテキストを、プレビューは整形済みのHTML表示を返します。用途で選ぶ — 無料・ブラウザで。',
    intro:
      'Markdown→テキストは見出しやリンクなどの記法を取り除いてきれいなプレーンテキストを取り出し、Markdownプレビューは記法をHTMLとして描画し見た目を確認します。「素のテキストが欲しい」のか「仕上がりを見たい」のかで使い分けます。どちらもブラウザ内で処理されます。',
    options: [
      {
        label: 'Markdown→テキスト',
        toolId: 'markdown-to-text',
        best: 'Markdownの記法を消して素のテキストを取り出したいとき。',
        pros: ['記号や装飾を除いた読みやすいプレーンテキストを生成', '別のツールへの貼り付けや文字数カウントに便利', 'ブラウザ内で処理され、内容は送信されない'],
        cons: ['整形された見た目を確認する用途には向かない'],
      },
      {
        label: 'Markdownプレビュー',
        toolId: 'markdown-preview',
        best: 'Markdownが実際にどう表示されるか確かめたいとき。',
        pros: ['記法をHTMLにレンダリングして仕上がりを確認', '見出し・リスト・リンクなどの表示を即チェック', 'ブラウザ内で描画され、データは外部に出ない'],
        cons: ['装飾を取り除いた素のテキストは得られない'],
      },
    ],
    verdict:
      '記法を消して「素のテキストを取り出す」ならMarkdown→テキスト、記法を「描画して見た目を確認する」ならMarkdownプレビューです。プレーンテキストが欲しいか、レンダリング結果を見たいかで選びましょう。',
    faqs: [
      {
        q: 'Markdown→テキストとプレビューはどう違いますか？',
        a: 'Markdown→テキストは記法を取り除いた素のテキストを出力します。プレビューは記法をHTMLとして描画し、実際の見た目を表示します。出力が素のテキストか表示かが違いです。',
      },
      {
        q: '入力したMarkdownはアップロードされますか？',
        a: 'いいえ。どちらもブラウザ内で処理され、入力したMarkdownがサーバーに送信されることはありません。',
      },
    ],
    keywords: ['markdown to text vs preview', 'markdown テキスト 変換', 'markdown プレビュー', 'マークダウン 変換'],
  },
  {
    slug: 'regex-escape-vs-string-escape',
    category: 'dev',
    title: '正規表現エスケープ vs 文字列エスケープ — どちらを使う？',
    h1: '正規表現エスケープ vs 文字列エスケープ',
    description:
      '正規表現エスケープはメタ文字を無効化して文字どおり一致させ、文字列エスケープはJSON/JS/HTML/SQL向けに文字をエスケープします。用途で選ぶ — 無料・ブラウザで。',
    intro:
      '正規表現エスケープは「.」や「*」などのメタ文字を打ち消して、テキストを文字どおりマッチさせます。文字列エスケープはJSONやJavaScript、HTML、SQLといった文脈に合わせて文字を安全な形に変換します。エスケープする相手が正規表現か、コード・マークアップかで使い分けます。どちらもブラウザ内で処理されます。',
    options: [
      {
        label: '正規表現エスケープ',
        toolId: 'regex-escape',
        best: '入力文字列を正規表現の中で文字どおり一致させたいとき。',
        pros: ['「. * + ? ( )」などのメタ文字をエスケープ', 'ユーザー入力を安全にパターンへ埋め込める', 'ブラウザ内で処理され、入力は送信されない'],
        cons: ['JSONやHTMLなどコード文脈のエスケープには使えない'],
      },
      {
        label: '文字列エスケープ',
        toolId: 'string-escape',
        best: 'JSON/JS/HTML/SQLなどに文字列を安全に埋め込みたいとき。',
        pros: ['文脈ごと(JSON・JS・HTML・SQL)に適したエスケープ', '引用符や特殊文字による構文崩れを防げる', 'ブラウザ内で変換され、データは外部に出ない'],
        cons: ['正規表現のメタ文字エスケープには向かない'],
      },
    ],
    verdict:
      'エスケープ先が「正規表現」なら正規表現エスケープ、「JSON/JS/HTML/SQLなどのコード文脈」なら文字列エスケープです。パターンに埋めるのか、コードやマークアップに埋めるのかで選びましょう。',
    faqs: [
      {
        q: '正規表現エスケープと文字列エスケープはどう違いますか？',
        a: '正規表現エスケープは正規表現のメタ文字を無効化して文字どおり一致させます。文字列エスケープはJSONやHTMLなどの文脈に合わせて文字を変換します。エスケープする対象が違います。',
      },
      {
        q: 'どちらもブラウザ内で動きますか？',
        a: 'はい。どちらの変換もブラウザ内で実行され、入力したテキストがサーバーに送信されることはありません。',
      },
    ],
    keywords: ['regex escape vs string escape', '正規表現 エスケープ', '文字列 エスケープ', 'エスケープ 変換'],
  },
  {
    slug: 'bpm-tap-vs-metronome',
    category: 'audio',
    title: 'BPMタップ計測 vs メトロノーム — どちらを使う？',
    h1: 'BPMタップ計測 vs メトロノーム',
    description:
      'BPMタップは曲に合わせてタップしテンポを計測し、メトロノームは設定したテンポで一定のクリックを鳴らします。用途で選ぶ — 無料・ブラウザで。',
    intro:
      'BPMタップ計測は曲のリズムに合わせてタップし、未知のテンポを割り出します。メトロノームは自分で設定したテンポで一定のクリックを刻みます。テンポを「測りたい」のか「鳴らしたい」のかで使い分けます。どちらもブラウザ内で動作します。',
    options: [
      {
        label: 'BPMタップ計測',
        toolId: 'bpm-tap',
        best: '曲のテンポが分からず、タップして測りたいとき。',
        pros: ['リズムに合わせたタップ間隔からBPMを推定', '耳コピやDJのテンポ合わせに便利', 'ブラウザ内で動作し、データは外部に出ない'],
        cons: ['設定したテンポを鳴らす用途には使えない'],
      },
      {
        label: 'メトロノーム',
        toolId: 'metronome',
        best: '決めたテンポで一定のクリックを鳴らしたいとき。',
        pros: ['指定したBPMで安定したクリックを再生', 'リズム練習やレコーディングのテンポ管理に最適', 'ブラウザ内で再生され、サーバー不要'],
        cons: ['未知の曲のテンポを測る用途には使えない'],
      },
    ],
    verdict:
      '未知のテンポを「測る」ならBPMタップ計測、決めたテンポを「鳴らす」ならメトロノームです。曲のBPMを知りたいのか、一定のリズムを刻みたいのかで選びましょう。どちらもブラウザ内で完結します。',
    faqs: [
      {
        q: 'BPMタップ計測とメトロノームはどう違いますか？',
        a: 'BPMタップ計測は曲に合わせてタップし、テンポ(BPM)を割り出します。メトロノームは設定したテンポでクリックを鳴らします。テンポを測るか鳴らすかが違いです。',
      },
      {
        q: 'BPMタップで測ったテンポはどれくらい正確ですか？',
        a: 'タップ間隔の平均から推定するため、一定のリズムで多くタップするほど精度が上がります。測ったBPMはメトロノームに設定して練習に使えます。',
      },
    ],
    keywords: ['bpm tap vs metronome', 'bpm 計測 タップ', 'メトロノーム', 'テンポ 計測'],
  },
  {
    slug: 'random-team-vs-random-pick',
    category: 'util',
    title: 'ランダムチーム分け vs ランダム抽選 — どちらを使う？',
    h1: 'ランダムチーム分け vs ランダム抽選',
    description:
      'チーム分けは名前リストをバランスよくグループに分け、抽選はリストから当選者を選びます。全員を分けるか1人を選ぶかで選ぶ — 無料・ブラウザで。',
    intro:
      'ランダムチーム分けは名前のリストを均等なチームに振り分け、ランダム抽選はリストから1人(または数人)の当選者を選びます。「全員をグループに分ける」のか「当選者を選ぶ」のかで使い分けます。どちらもブラウザ内で処理されます。',
    options: [
      {
        label: 'ランダムチーム分け',
        toolId: 'random-team-generator',
        best: '名前のリストを公平なチームに分けたいとき。',
        pros: ['名前リストを均等な人数のチームに自動振り分け', 'スポーツやグループワークの班分けに便利', 'ブラウザ内で処理され、リストは送信されない'],
        cons: ['1人の当選者を選ぶ用途には向かない'],
      },
      {
        label: 'ランダム抽選',
        toolId: 'random-pick',
        best: 'リストから当選者を1人(または数人)選びたいとき。',
        pros: ['リストから公平に当選者をランダム抽出', '抽選会やプレゼント企画に最適', 'ブラウザ内で抽選され、データは外部に出ない'],
        cons: ['全員をチームに分ける用途には向かない'],
      },
    ],
    verdict:
      '全員を「グループに分ける」ならランダムチーム分け、リストから「当選者を選ぶ」ならランダム抽選です。班分けがしたいのか、1人を選びたいのかで選びましょう。どちらもブラウザ内で完結します。',
    faqs: [
      {
        q: 'ランダムチーム分けとランダム抽選はどう違いますか？',
        a: 'チーム分けは全員を複数のグループに均等に振り分けます。抽選はリストから当選者を選び出します。全員を分けるのか、一部を選ぶのかが違いです。',
      },
      {
        q: '抽選やチーム分けは本当にランダムですか？',
        a: 'はい。ブラウザ内で公平にシャッフル・抽選され、結果が外部に送信されることはありません。何度でもやり直せます。',
      },
    ],
    keywords: ['random team vs random pick', 'チーム分け ランダム', 'ランダム 抽選', '班分け 抽選'],
  },
  {
    slug: 'nanoid-vs-uuid',
    category: 'dev',
    title: 'Nano ID vs UUID — どちらのID形式を使う？',
    h1: 'Nano ID vs UUID',
    description:
      'Nano IDは短くURLセーフなID、UUIDは標準的な128ビットIDを生成します。長さ・読みやすさ・衝突確率を比較 — 無料・ブラウザで。',
    intro:
      'どちらも暗号学的に強い乱数で一意なIDを生成しますが、長さと汎用性のトレードオフが異なります。Nano IDは短くデフォルトでURLセーフ — 64種の文字から通常21文字 — なのでリンクやスラッグにすっきり収まります。UUIDは確立された128ビット標準(RFC 4122)で、ハイフン入りの36文字で表記され、ほぼすべてのデータベースと言語で認識されます。どちらも何もアップロードせず、ブラウザ内で動きます。',
    options: [
      {
        label: 'Nano ID',
        toolId: 'nanoid-gen',
        best: 'URL・スラッグ・公開参照向けの短くリンクに優しいID。',
        pros: [
          'コンパクト — UUIDの36文字に対し約21文字',
          'URLセーフな文字種(A–Z, a–z, 0–9, _ と -)でエンコード不要',
          '長さと文字種を調整して衝突/サイズのバランスを最適化できる',
          '安全な乱数で生成される',
        ],
        cons: [
          '標準規格ではないため、UUID形式を前提とするシステムもある',
          'バージョンやタイムスタンプの意味づけは組み込まれていない',
        ],
      },
      {
        label: 'UUID',
        toolId: 'uuid-gen',
        best: '認知された128ビット標準が求められるDBキーやAPI。',
        pros: [
          'ほぼすべてのDB・言語が理解するRFC 4122標準',
          'PostgreSQLなどではUUID型カラムをネイティブに持つ',
          'バージョン付き(v4ランダム・v1時刻ベース)で意味が明確',
          'v4は天文学的に衝突確率が低い',
        ],
        cons: [
          'ハイフン込み36文字 — 長くURL向きではない',
          '情報量は少ないがインデックスやリンクで場所を取る',
        ],
      },
    ],
    verdict:
      'IDがURLやスラッグに現れる、または長さと読みやすさが重要で両端を自分で管理できるならNano IDを選びましょう。DBの主キーや公開APIの契約、UUID形式を前提とするツールとの相互運用など、認知された標準が必要ならUUIDです。内部はUUID、公開向けの短いリンクはNano IDという併用もよくあるパターンです。',
    faqs: [
      {
        q: 'Nano IDはUUIDと同じくらい衝突に強いですか？',
        a: 'デフォルトの21文字なら、Nano IDはUUID v4と同程度の乱数規模を持ちます。どちらも安全な乱数を使います。Nano IDを短くすると衝突安全性と引き換えに短さを得るため、大量に発行するIDではデフォルトの長さを保ってください。',
      },
      {
        q: 'UUIDカラムにNano IDを保存できますか？',
        a: 'いいえ。UUIDカラムは固定の128ビットUUID形式を前提とします。Nano IDは通常のtext/varcharカラムに保存するか、ネイティブ型が必要ならUUIDを使ってください。',
      },
    ],
    keywords: ['nanoid uuid 違い', '短い 一意 ID', 'url セーフ id', 'uuid 代替'],
  },
  {
    slug: 'base58-vs-base64',
    category: 'dev',
    title: 'Base58 vs Base64 — どちらのエンコードを使う？',
    h1: 'Base58 vs Base64',
    description:
      'Base58は紛らわしい文字を除いた人間に優しいID(ビットコインで採用)、Base64はコンパクトで普遍的なバイナリ→テキスト標準です。両方をブラウザで比較。',
    intro:
      'どちらも生のバイトを表示可能なテキストに変えますが、最適化の対象が違います。Base58は混同しやすい0・O・I・lや+・/を意図的に省いた58文字を使うため、声に出したり手で書き写したりURLに入れたりしても安全 — だからビットコインのアドレスや多くの暗号通貨識別子で使われます。Base64は64文字でデータをより密に詰め込み(約33%のオーバーヘッド)、メール・データURI・JSONなどあらゆる場面で使えます。どちらもブラウザ内でエンコード・デコードします。',
    options: [
      {
        label: 'Base58',
        toolId: 'base58',
        best: '人が書き写す・入力する・読み上げるID — アドレスや短い鍵。',
        pros: [
          '紛らわしい文字(0/O, I/l/1)を除外 — 書き写しミスが減る',
          '+や/を含まず、出力はエスケープ不要でURL・ファイル名セーフ',
          'ビットコインのアドレスや多くの暗号通貨識別子で使われるエンコード',
        ],
        cons: [
          '同じデータでBase64よりわずかに長い出力になる',
          '言語やライブラリへの組み込みはBase64ほど普遍的でない',
          '大きなバイナリの塊向けではない',
        ],
      },
      {
        label: 'Base64',
        toolId: 'base64',
        best: '任意のバイナリの埋め込み・転送 — データURI・メール・JSON。',
        pros: [
          'コンパクト: オーバーヘッド約33%でBase58より密',
          'ほぼすべての言語・プラットフォームに組み込み済み',
          'データURI・MIMEメール・テキスト内バイナリ埋め込みの標準',
        ],
        cons: [
          '0/O・I/lや+ /を含み、書き写しミスやURLエスケープが必要になりやすい',
          '標準の文字種はURLセーフ版でないとURLに不向き',
        ],
      },
    ],
    verdict:
      '人が読む・入力する・共有する文字列(ウォレットアドレス、短いID、読み上げる値)で、紛らわしい文字を避けたいならBase58を選びましょう。任意のバイナリをテキストチャネル(データURI、メール添付、JSONフィールド)で運び、最もコンパクトで普遍的なエンコードが欲しいならBase64です。',
    faqs: [
      {
        q: 'ビットコインはなぜBase64でなくBase58を使うのですか？',
        a: 'Base58は混同しやすい文字(0/O, I/l)や、URLや書き写しで壊れる+・/などの記号を取り除きます。これにより手で写すアドレスの誤りが大幅に減ります。打ち間違いが送金先を誤らせかねない場面で効いてきます。',
      },
      {
        q: 'Base58とBase64はどちらが短いですか？',
        a: '文字種が大きいBase64の方が1文字あたりのビット数が多く、短い出力になります。Base58は少しのサイズと引き換えに読みやすさと書き写しの安全性を得ています。',
      },
    ],
    keywords: ['base58 base64 違い', 'base58 エンコード', 'ビットコイン base58', 'バイナリ テキスト エンコード'],
  },
  {
    slug: 'text-shadow-vs-box-shadow',
    category: 'dev',
    title: 'text-shadow vs box-shadow — どちらのCSS影が必要？',
    h1: 'text-shadow vs box-shadow',
    description:
      'text-shadowは文字のグリフに影を、box-shadowは要素の矩形ボックスに影を落とします。どちらもビジュアルに生成 — 無料・ブラウザで。',
    intro:
      'この2つのCSSプロパティはどちらも影を作りますが、適用先が違います。text-shadowは文字の実際の形に沿った影を描くため、見出しやラベルなど浮き立たせたいテキスト向けです。box-shadowは要素のボックス — そのボーダーの縁 — の周りに影を描くため、カード・ボタン・モーダル・パネル向けです。どちらのジェネレーターもオフセット・ぼかし・色を調整し、貼り付け可能なCSSをコピーできます。',
    options: [
      {
        label: 'text-shadow',
        toolId: 'text-shadow',
        best: '文字のグリフに奥行き・グロー・縁取りを付ける。',
        pros: [
          '矩形でなく文字の形に沿った影',
          '見出し・ネオングロー・画像上の読みやすいテキストに最適',
          'カンマ区切りで複数の影を重ね、縁取りや積層効果も可能',
        ],
        cons: [
          'spread(広がり)半径がない(box-shadowと違い)',
          'テキストのみに作用し、要素のボックスには効かない',
        ],
      },
      {
        label: 'box-shadow',
        toolId: 'box-shadow',
        best: 'カード・ボタン・パネルを浮き上がらせる。',
        pros: [
          'border-radiusに沿って要素のボックスに影を落とす',
          'spread半径とinset(内側の影)オプションを追加できる',
          'UIで奥行き・高さを表現する標準的な方法',
        ],
        cons: [
          '矩形のボックスに沿うため、文字の形はなぞれない',
          '多数の要素に重いぼかし影を付けると描画性能を損なう',
        ],
      },
    ],
    verdict:
      '影を文字に沿わせたい — 見出し、キャプション、グロー効果、写真に重ねたテキスト — ならtext-shadowを選びましょう。要素全体 — カード、ボタン、ドロップダウン、モーダル — を浮き上がらせるならbox-shadowです。両者は置き換え可能ではなく、併用もできます(影付きカードの中の影付きテキスト)。',
    faqs: [
      {
        q: 'box-shadowでテキストに影を付けられますか？',
        a: 'グリフそのものには付けられません — box-shadowは要素の矩形ボックスに沿います。文字の形に影を落とすにはtext-shadowを使ってください。',
      },
      {
        q: 'text-shadowはbox-shadowのようなspread半径に対応しますか？',
        a: 'いいえ。text-shadowはoffset-x、offset-y、ぼかし、色のみを取ります。spreadやinset(内側)の影が必要ならそれはbox-shadowの機能です。',
      },
    ],
    keywords: ['text-shadow box-shadow 違い', 'css テキスト 影', 'css ボックス 影', 'css 影 ジェネレーター'],
  },
  {
    slug: 'card-type-vs-card-validate',
    category: 'security',
    title: 'カード種別判定 vs カード検証 — 判定する？検証する？',
    h1: 'カード種別判定 vs カード検証',
    description:
      '先頭数字からカードブランドを判定するか、Luhnチェックサムで番号を検証するか。それぞれの役割を確認 — 無料・ブラウザで、何もアップロードしません。',
    intro:
      'この2つのツールはカード番号について別々の問いに答えるもので、どちらも銀行には接続しません。種別判定は先頭数字(IIN/BINプレフィックス)を読み、Visa・Mastercard・Amexなどのブランドを推測します — 入力中に正しいカードロゴを表示するのに便利です。検証はLuhnアルゴリズムで桁が構造的に正しい番号かを確認し、打ち間違いや桁の入れ替わりを捕まえます。どちらも形式チェックのみで、カードが実在するか・有効か・残高があるかは確認しません。',
    options: [
      {
        label: 'カード種別判定',
        toolId: 'credit-card-type',
        best: '最初の数桁からカードブランドを見分ける。',
        pros: [
          '入力された桁からIIN/BINプレフィックスでブランドを判定',
          '決済フォームで一致するカードロゴを表示するのに便利',
          'ブランドごとの典型的な桁数パターンを把握している',
        ],
        cons: [
          '番号が有効かどうかではなくブランドを示すだけ',
          'カードを承認したり実在を確認したりはしない',
        ],
      },
      {
        label: 'カード検証(Luhn)',
        toolId: 'cc-validate',
        best: '送信前にLuhnチェックサムで打ち間違いを捕まえる。',
        pros: [
          '実在するすべてのカード番号に使われるLuhnチェックを実行',
          '打ち間違いや桁の入れ替わりを即座に検出',
          'ブランド判定と組み合わせるとフォーム検証が親切になる',
        ],
        cons: [
          'チェックサムが通ってもカードが実在・有効とは限らない',
          '単体ではブランドを判定しない',
        ],
      },
    ],
    verdict:
      '番号がどのブランドかを示す(ロゴ表示やブランド別ルール)には種別判定を、送信前に明らかな打ち間違いを捕まえるにはLuhn検証を使いましょう。実際のフォームでは通常両方を実行します — ブランドを判定してフィールドを整形・ラベル付けし、次にチェックサムを検証します。どちらのツールも決済を承認しません — カードが本物で残高があるかは決済処理事業者だけが確認できます。',
    faqs: [
      {
        q: 'Luhnチェックサムが通ればカードは本物ですか？',
        a: 'いいえ。Luhnは桁が内部的に整合していることを確認するだけで、打ち間違いを捕まえます。そのカードが発行されたか・有効か・残高があるかは分かりません — それは発行銀行や決済処理事業者だけが確認できます。',
      },
      {
        q: '両方のチェックを一緒に実行すべきですか？',
        a: 'はい。プレフィックスからブランドを判定して正しいロゴを表示しブランドルールを適用し、その後Luhnチェックで打ち間違いの番号を送信前に弾きましょう。',
      },
    ],
    keywords: ['カード 種別 検証 違い', 'カードブランド 判定', 'luhn カード チェック', 'クレジットカード bin'],
  },
  {
    slug: 'ean-vs-isbn',
    category: 'security',
    title: 'EAN vs ISBN — どちらのコードを検証する？',
    h1: 'EAN vs ISBN',
    description:
      'EANは小売商品のバーコード(GTIN/EAN-13)を、ISBNは書籍の識別子を検証します。どちらもチェックディジットを確認 — 無料・ブラウザで。',
    intro:
      'EANとISBNはどちらもチェックディジットで終わる、密接に関連した識別子の体系です。EAN(GTINファミリーの一部)は小売商品 — 食料品・電子機器・包装 — のバーコードで、通常13桁です。ISBNは特定の書籍版を識別します。両者は設計上重なります — 現代のISBN-13は実は978/979(Bookland)範囲のEAN-13で、ISBN-13もEAN-13もmod-10チェックサムを使います。古いISBN-10は別で、最後の文字がXになり得るmod-11チェックサムを使います。これらのツールはチェックサムと形式のみを検証し、商品や書籍が実際に存在するかは確認しません。',
    options: [
      {
        label: 'EAN / GTIN',
        toolId: 'ean-validate',
        best: '小売商品のバーコード(EAN-13・EAN-8・UPC/GTIN)を確認する。',
        pros: [
          'GTIN/EANのmod-10チェックディジットを検証',
          '包装商品に付く日常的な小売バーコードをカバー',
          '打ち間違いや読み取りミスの桁を検出',
        ],
        cons: [
          'チェックサムを確認するだけで、商品が登録済み・実在とは限らない',
          '書籍専用ではない — 書籍のメタデータにはISBNルールを使う',
        ],
      },
      {
        label: 'ISBN',
        toolId: 'isbn-validate',
        best: '書籍の識別子 — ISBN-13と従来のISBN-10の両方 — を確認する。',
        pros: [
          'ISBN-13(mod-10)とISBN-10(mod-11・Xチェックディジット)に対応',
          'ISBN-13は978/979範囲のEAN-13なので小売とつながる',
          'カタログや図書館データの書き写し誤りを検出',
        ],
        cons: [
          'チェックサムが有効でも書籍の実在や在庫は証明しない',
          'ISBN-10は小売バーコードとは異なる(mod-11)チェックを使う',
        ],
      },
    ],
    verdict:
      '物理的な小売商品のバーコードを検証するならEAN/GTINチェックを使いましょう。書籍の識別子 — 特に10桁のコードや、書籍として扱いたいもの — を検証するなら、mod-11のISBN-10形式も理解するISBNチェックを使います。重なりに注意 — 978か979で始まるISBN-13は有効なEAN-13でもあります。どちらのツールも構造とチェックディジットのみを検証し、データベースで照会することはありません。',
    faqs: [
      {
        q: 'ISBN-13は有効なEANでもありますか？',
        a: 'はい。ISBN-13は978または979(Bookland)プレフィックス範囲のEAN-13で、どちらも同じmod-10チェックディジットを共有します。したがって978/979のISBN-13はEAN-13のチェックサムチェックを通ります。',
      },
      {
        q: 'なぜISBN-10は異なるチェックサムを使うのですか？',
        a: 'ISBN-10はEAN-13との整合より前からあり、最後の文字がX(10を表す)になり得るmod-11の加重チェックサムを使います。EAN-13とISBN-13はどちらも単純なmod-10方式を使います。',
      },
    ],
    keywords: ['ean isbn 違い', 'バーコード 検証', 'isbn チェックサム', 'gtin ean13'],
  },
  {
    slug: 'posterize-vs-threshold',
    category: 'image',
    title: 'ポスタリゼーション vs しきい値(2値化) — どちらの効果が欲しい？',
    h1: 'ポスタリゼーション vs しきい値',
    description:
      'ポスタリゼーションは画像を数段階のフラットな色レベルに減らし、しきい値は輝度で純粋な白黒に変換します。両方を比較 — 無料・ブラウザで。',
    intro:
      'どちらも階調を減らして画像を単純化しますが、その度合いは大きく異なります。ポスタリゼーションは各チャンネルを指定した段階数に量子化するため、なめらかなグラデーションが色のフラットな帯になり、色を保ったままシルクスクリーンのようなポスター調になります。しきい値はさらに踏み込み、各ピクセルの輝度を測って純粋な白か黒にし、くっきりした2色の高コントラストな結果を生みます。どちらもブラウザ内で処理され、何もアップロードされません。',
    options: [
      {
        label: 'ポスタリゼーション',
        toolId: 'image-posterize',
        best: '色を保ったフラットで帯状のポスター調の見た目。',
        pros: [
          '各チャンネルを選んだN段階に減らす',
          'グラデーションを帯に平坦化しつつ色を保つ',
          'シルクスクリーン・ポップアート・様式化グラフィックに最適',
        ],
        cons: [
          '純粋な白黒出力には向かない',
          '段階が少なすぎると写真では硬く見えることがある',
        ],
      },
      {
        label: 'しきい値',
        toolId: 'image-threshold',
        best: '輝度からくっきりした2色の白黒を作る。',
        pros: [
          '設定した輝度の境界で純粋な白/黒に変換',
          '高コントラストで、ステンシル・ロゴ・線画に最適',
          'トレースやシルエットのきれいな下地になる',
        ],
        cons: [
          'すべての色と中間調を捨てる',
          '境界の設定がずれると細部が失われることがある',
        ],
      },
    ],
    verdict:
      'フラットな色帯の様式化されたカラフルなポスター調が欲しいなら、ポスタリゼーションで残す段階数を選びましょう。ステンシル・シルエット・ロゴの整理など硬い白黒画像が欲しいなら、しきい値で輝度の境界を調整します。ポスタリゼーションは色と複数段階を保ち、しきい値は2段階だけを残します。先にポスタリゼーションでグラフィック調にし、別コピーをしきい値で揃ったマスクにすることもできます。',
    faqs: [
      {
        q: 'ポスタリゼーションとしきい値の違いは何ですか？',
        a: 'ポスタリゼーションは各色チャンネルを数段階のフラットなレベルに減らしつつ色を保ち、帯状のポスター効果を作ります。しきい値は各ピクセルの輝度に基づき、画像全体を2段階 — 純粋な白と黒 — に減らします。',
      },
      {
        q: 'ステンシルを作るにはどちらを使うべきですか？',
        a: 'しきい値です。純粋な白黒出力が、切り抜きやトレースに使えるきれいな形を与えます。ポスタリゼーションは色と複数の階調を保つため、ステンシルより様式化グラフィック向きです。',
      },
    ],
    keywords: ['ポスタリゼーション しきい値 違い', '画像 ポスタリゼーション', '画像 2値化', '白黒 画像 効果'],
  },
  {
    slug: 'random-words-vs-lorem',
    category: 'text',
    title: 'ランダム単語 vs Lorem Ipsum — どちらのダミーテキスト？',
    h1: 'ランダム単語 vs Lorem Ipsum',
    description:
      'ランダム単語は実在する読める英単語を、Lorem Ipsumは定番のニュートラルなラテン語ダミーを出力します。適したダミーテキストを選ぶ — 無料・ブラウザで。',
    intro:
      'どちらもダミーテキストを生成しますが、語そのものが違います。ランダム単語ジェネレーターは実在する英単語を出力するため、認識できる言葉が欲しいとき — 単語リスト、プロンプト、テストデータ、手早い例 — に読めて役立ちます。Lorem Ipsumはおなじみの擬似ラテン語ダミーで、ニュートラルな意味のない文として読めます。デザインではこれが狙いで、語がレビュアーの気を散らしたり実際の内容を匂わせたりせずに空間を埋めます。どちらもアップロードなしでブラウザ内で動きます。',
    options: [
      {
        label: 'ランダム単語',
        toolId: 'random-words',
        best: 'リスト・プロンプト・テストデータ向けの実在する読める英単語。',
        pros: [
          '人が認識できる本物の英単語を出力',
          '言葉遊び・プロンプト・パスフレーズの案・サンプルデータに向く',
          '必要な単語数を選べる',
        ],
        cons: [
          '実在する語はレイアウトのレビューで気を散らしうる',
          'デザインモックアップ用の定番ダミーではない',
        ],
      },
      {
        label: 'Lorem Ipsum',
        toolId: 'lorem-ipsum',
        best: 'レイアウトやデザインモックアップ向けのニュートラルなダミー。',
        pros: [
          'デザインや印刷の業界標準のプレースホルダー',
          'ニュートラルに読めるためレイアウトの邪魔をしない',
          '段落・文・単語の単位で生成できる',
        ],
        cons: [
          '実在する言語ではない — 読める語が必要なら役に立たない',
          'ラテン語風のテキストは公開ページに残ると不自然に見える',
        ],
      },
    ],
    verdict:
      '実際に読める英語が必要なとき — サンプルリスト、言葉遊び、プロンプト、語が意味を持つテストデータ — はランダム単語を選びましょう。レイアウトをモックアップし、内容に注意を引かずに空間を保つニュートラルなダミーが欲しいときはLorem Ipsumです。デザイナーはLoremを、実在する語彙が必要な人はランダム単語を選びます。',
    faqs: [
      {
        q: 'なぜ実在する語でなくLorem Ipsumを使うのですか？',
        a: 'Lorem Ipsumは意図的に無意味なので、レビュアーはコピーを読むのではなくレイアウトやタイポグラフィに集中できます。実在する語は内容そのものに注意を引きがちで、だからデザイナーはニュートラルなダミーを好みます。',
      },
      {
        q: 'テストデータにはどちらが向きますか？',
        a: '目で確認できる認識可能な英語トークンが欲しいならランダム単語です。デザインを埋める現実的な長さのテキストブロックがあればよいだけならLorem Ipsumが向きます。',
      },
    ],
    keywords: ['ランダム単語 lorem ipsum 違い', 'ダミーテキスト', 'lorem ipsum 代替', 'ランダム 単語 生成'],
  },
  {
    slug: 'business-days-vs-date-diff',
    category: 'util',
    title: '営業日 vs 日付の差 — 稼働日？暦日？',
    h1: '営業日 vs 日付の差',
    description:
      '営業日は週末を除いて稼働日を数え、日付の差は2つの日付の間の暦日全体を数えます。適した方を選ぶ — 無料・ブラウザで。',
    intro:
      'どちらも2つの日付の間隔を測りますが、数え方が違います。営業日計算は週末を除いて稼働日だけを数えます — 配送見積もり、SLA、プロジェクトの工程に向きます。日付の差計算は暦日全体 — すべての日、または年・月・日の内訳 — を数えます — 年齢、記念日、合計期間に向きます。間違った方を選ぶのは、数日ずれる誤りのよくある原因です。',
    options: [
      {
        label: '営業日',
        toolId: 'business-days',
        best: '週末を除く稼働日の集計 — SLA・配送・締切。',
        pros: [
          '月曜〜金曜だけを数え、週末を除く',
          '配送ウィンドウやSLAの提示の仕方に合う',
          'プロジェクトや所要日数の見積もりに向く',
        ],
        cons: [
          '祝日は地域で異なり、手動の考慮が必要なことがある',
          '単純な合計日数や年齢の計算には向かない',
        ],
      },
      {
        label: '日付の差',
        toolId: 'date-diff',
        best: '2つの日付の間の暦日全体 — 年齢・期間・カウントダウン。',
        pros: [
          '日付の間のすべての暦日を数える',
          '間隔を年・月・日に分解する',
          '年齢・記念日・合計期間に最適',
        ],
        cons: [
          '週末を含むため稼働時間を過大に見積もる',
          '営業上の祝日を考慮しない',
        ],
      },
    ],
    verdict:
      '所要日数・配送日・SLAを提示するなら、週末で日数が膨らまないよう営業日を使いましょう。年齢・記念日・2つの日付の間の合計時間を測るなら、暦日全体を出す日付の差を使います。範囲内に週末が入るたびに両者の答えは食い違うので、週末を数えるべきかでツールを合わせてください。',
    faqs: [
      {
        q: 'これらのツールは祝日を考慮しますか？',
        a: '営業日計算は週末を除きます。祝日は国や地域で異なるため、特定の祝日を手動で差し引く必要があるか確認してください。日付の差計算はすべての暦日を区別なく数えます。',
      },
      {
        q: 'なぜ2つの答えが違うのですか？',
        a: '日付の差は週末を含むすべての暦日を数え、営業日は土日を除きます。範囲内に週末があると、その分だけ営業日の数が少なくなります。',
      },
    ],
    keywords: ['営業日 日付の差 違い', '稼働日 計算', '日付 間 日数', '週末 除く'],
  },
];

export function getCompareJa(slug: string): Compare | undefined {
  return COMPARES_JA.find((c) => c.slug === slug);
}

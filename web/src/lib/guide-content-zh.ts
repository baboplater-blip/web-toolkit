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

/**
 * 按工具手写的指南 override（简体中文）。
 *
 * 模式自动生成的是"适配任意工具"的通用文案，对长尾 SEO 和停留时长偏弱。
 * 搜索需求大的工具在此撰写专属正文 —— 真实使用场景、具体示例与易踩的坑 ——
 * 叠加在自动生成的内容之上。仅替换所设置的字段。
 *
 * 提供 `faqs` 时，通用 FAQ（隐私 / 免费 / 移动端）会自动追加在后面。
 */
export interface GuideOverrideZh {
  metaTitle?: string;
  metaDescription?: string;
  intro?: string;
  features?: string[];
  steps?: GuideStepZh[];
  faqs?: Array<{ q: string; a: string }>;
}

/** 所有模式共用的通用 FAQ（隐私 / 免费 / 移动端）。 */
export const COMMON_FAQS_ZH: Array<{ q: string; a: string }> = [
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

/** 拥有专属指南的高需求工具。以工具 id 为键。 */
export const CUSTOM_GUIDES_ZH: Record<string, GuideOverrideZh> = {
  'css-units': {
    metaTitle: 'CSS 单位转换 px rem em pt — 免费在线工具',
    metaDescription:
      'px、rem、em、pt 互转。默认根字号 16px 时,16px = 1rem、24px = 1.5rem、12pt = 16px。可自定义 root font-size,实时换算并一键复制。',
    intro:
      '把一个 CSS 长度值同时换算成 px、rem、em、pt 四种单位。例如根字号 16px 时输入 24px,立即得到 1.5rem 与 18pt;改成 20px 等其他值也会重算。换算公式为 1rem = root font-size,1px = 0.75pt(96/72)。',
    features: [
      '一次输入,同屏给出 px / rem / em / pt 四个结果,无需逐个换算。',
      '可自定义 root font-size(默认 16px),em 与 rem 一样按根字号计算。',
      'pt 按印刷标准 1px = 0.75pt(1pt = 1/72 英寸,1px = 1/96 英寸)换算。',
      '每一行结果都带「复制」按钮,直接粘进 CSS。',
    ],
    steps: [
      {
        title: '输入数值与单位',
        body: '在「值」里填数字(如 24),在右侧下拉选择它的单位(px / rem / em / pt)。例如选 px 输入 24,表示 24px。',
      },
      {
        title: '按需调整 root font-size',
        body: '默认根字号为 16px(浏览器默认值)。若你的项目把 html 设为别的字号(如 :root { font-size: 62.5% } 即 10px),把「root font-size」改成 10,rem 结果会随之变化:此时 24px = 2.4rem。',
      },
      {
        title: '复制对应单位',
        body: '结果表中每行(如「1.5rem」「18pt」)右侧都有复制按钮,点一下即得到带单位的字符串,可直接贴到样式表。',
      },
    ],
    faqs: [
      {
        q: 'rem 和 em 在这里有什么区别?',
        a: '本工具把 em 也按 root font-size 计算,因此结果与 rem 相同。真实 CSS 中 em 相对的是父元素字号,会随上下文层叠变化,而 rem 始终相对根元素——做精确嵌套计算时请留意这一差异。',
      },
      {
        q: '为什么 12pt 等于 16px?',
        a: 'CSS 规定 1in = 96px = 72pt,所以 1pt = 96/72 = 1.333…px,反过来 1px = 0.75pt。由此 12pt × 1.333 = 16px,这也是常见正文字号 16px 的来历。',
      },
      {
        q: '为什么很多人把根字号设成 16px 后用 rem?',
        a: '16px 是几乎所有浏览器的默认根字号。以它为基准用 rem 写尺寸,用户在浏览器里放大默认字体时,整个布局会按比例缩放,无障碍性更好,这也是默认值设为 16 的原因。',
      },
    ],
  },

  'chmod-calc': {
    metaTitle: 'chmod 权限计算器 八进制↔rwx — 在线免费',
    metaDescription:
      'Unix/Linux 文件权限在八进制与符号表示间互转。755 = rwxr-xr-x、644 = rw-r--r--。勾选 r/w/x 或直接输入 755,实时得到两种写法。',
    intro:
      '在 Unix 文件权限的八进制(如 755)和符号(如 rwxr-xr-x)之间互相转换。勾选 owner / group / other 的读(r=4)、写(w=2)、执行(x=1),或直接键入「755」,两种表示会同时算出来。',
    features: [
      '勾选复选框或直接输入八进制(如 755),两种写法双向实时同步。',
      '按 owner(所有者)/ group(组)/ other(其他)三组分别设置 r / w / x。',
      '清楚标出位权重:读 = 4、写 = 2、执行 = 1,每位为三者之和。',
      '八进制与符号结果各带复制按钮,直接用于 chmod 命令。',
    ],
    steps: [
      {
        title: '勾选权限或输入八进制',
        body: '为 owner、group、other 分别勾选 r / w / x;或者在「八进制直接输入」框里键入 3 位数,如 755。两种方式会互相联动。',
      },
      {
        title: '理解每一位数字',
        body: '每位 = 读(4)+ 写(2)+ 执行(1)之和。例如 7 = 4+2+1 = rwx,5 = 4+1 = r-x。所以 755 表示 owner 全权(rwx),group 与 other 只读且可执行(r-x),即 rwxr-xr-x。',
      },
      {
        title: '复制并用于命令',
        body: '复制八进制结果直接执行 chmod 755 file,或复制符号结果用于文档说明。输入必须是 0~7 的 3 位数,否则会提示格式错误。',
      },
    ],
    faqs: [
      {
        q: '755 和 644 有什么区别?',
        a: '755 = rwxr-xr-x,所有者可读写执行,其他人可读可执行——常用于目录和脚本。644 = rw-r--r--,所有者可读写、其他人只读、谁都不能执行——常用于普通文件(HTML、图片、配置)。目录通常需要执行位才能进入,所以多用 755。',
      },
      {
        q: '为什么 r 是 4、w 是 2、x 是 1?',
        a: '这三位是二进制位:读 = 100₂ = 4,写 = 010₂ = 2,执行 = 001₂ = 1。把需要的权限相加就得到该组的八进制数字,因此 4+2+1 = 7 = rwx,组合不会冲突。',
      },
      {
        q: '777 安全吗?',
        a: '777 = rwxrwxrwx,任何用户都能读写并执行,通常是安全隐患,应避免用于网站目录或可执行文件。多数场景用 755(目录/脚本)或 644(普通文件)即可,只在确有必要时才放宽权限。',
      },
    ],
  },

  'http-status': {
    metaTitle: 'HTTP 状态码查询 404 301 500 — 含义速查',
    metaDescription:
      '查询 HTTP 状态码含义:404 Not Found、301/302 重定向区别、500 服务器错误、403 Forbidden、429 限流等。按代码或名称即时搜索。',
    intro:
      '快速查询 HTTP 状态码的含义和用途。输入「404」即看到 Not Found(找不到资源),输入「重定向」或「301」可对比永久与临时跳转。覆盖 1xx 到 5xx 共数十个常用代码,按代码、名称或描述实时筛选。',
    features: [
      '按代码(404)、英文名(Not Found)或中文描述任意关键词即时搜索。',
      '按首位数字用不同颜色分类:1xx 信息、2xx 成功、3xx 重定向、4xx 客户端错误、5xx 服务器错误。',
      '每个代码附简明中文说明,讲清触发场景与处理方向。',
      '覆盖常用代码:200、201、204、301、302、304、400、401、403、404、429、500、502、503 等。',
    ],
    steps: [
      {
        title: '输入代码或关键词',
        body: '在搜索框键入数字(如 404)、英文名(如 Forbidden)或描述词。例如输入 4 会列出全部 4xx 客户端错误,输入 timeout 可找到 408、504。',
      },
      {
        title: '看分类颜色判断大类',
        body: '左侧彩色徽章按首位分类:绿色 = 2xx 成功,黄色 = 3xx 重定向,橙色 = 4xx 客户端错误,红色 = 5xx 服务器错误。先看颜色就能判断问题出在客户端还是服务器。',
      },
      {
        title: '读说明定位原因',
        body: '展开每条说明确认含义。例如 502 Bad Gateway 表示网关从上游收到无效响应,通常是后端服务挂了或反向代理配置有误,据此排查。',
      },
    ],
    faqs: [
      {
        q: '301 和 302 有什么区别?',
        a: '301 Moved Permanently 是永久重定向,搜索引擎会把权重转移到新 URL,浏览器也会缓存跳转——确定永久换地址时用它。302 Found 是临时重定向,原 URL 仍是主地址,不转移 SEO 权重,适合临时维护或 A/B 测试。',
      },
      {
        q: '401 和 403 有什么区别?',
        a: '401 Unauthorized 表示「未认证」——你还没登录或凭证无效,提供正确凭证后可能就能访问。403 Forbidden 表示「已认证但无权限」——身份没问题,但这个资源就是不允许你访问,换凭证也没用。',
      },
      {
        q: '404 和 410 有什么区别?',
        a: '404 Not Found 表示「找不到」,但资源未来可能会出现,语义上不确定。410 Gone 明确表示资源「已永久删除」,搜索引擎会更快地将其从索引中移除。下线内容若想加速去索引,返回 410 比 404 更直接。',
      },
    ],
  },

  'json-to-go': {
    metaTitle: 'JSON 转 Go 结构体 (struct) — 在线生成',
    metaDescription:
      '把 JSON 粘贴进来,自动生成带 json tag 的 Go struct。嵌套对象生成独立结构体,数组推断元素类型,整数→int、小数→float64,可命名根结构体。',
    intro:
      '把一段 JSON 自动转换成 Go 结构体定义,字段带 `json:"..."` 标签。例如 {"id":1,"name":"kim"} 生成含 ID int 和 Name string 的 struct;嵌套对象会拆成独立的命名结构体,数组则推断出元素类型。',
    features: [
      '字段名转为 Go 导出格式 PascalCase,并保留原始键作为 `json:"user_name"` 标签。',
      '嵌套对象拆分为独立的命名结构体,顶层结构体排在最前,便于阅读。',
      '类型自动推断:整数 → int、小数 → float64、true/false → bool、null → interface{}。',
      '数组按元素统一类型生成 []T,元素类型不一致时回退为 []interface{}。',
      '可自定义顶层结构体名称(默认 AutoGenerated)。',
    ],
    steps: [
      {
        title: '粘贴 JSON',
        body: '把 API 响应或配置 JSON 粘进输入框,例如 {"id": 1, "name": "kim", "tags": ["a", "b"]}。语法错误会即时提示,如缺少引号或多余逗号。',
      },
      {
        title: '可选:命名根结构体',
        body: '在「顶层结构体名称」填入语义化名字,如 User,生成 type User struct {...}。留空则用默认的 AutoGenerated。',
      },
      {
        title: '复制生成的代码',
        body: '右侧实时输出完整定义,如 ID int `json:"id"`、Name string `json:"name"`、Tags []string `json:"tags"`。点「复制」直接粘进 .go 文件。',
      },
    ],
    faqs: [
      {
        q: '数字会被推断成 int 还是 float64?',
        a: '按字面值判断:整数(如 1、42)推断为 int,带小数点的(如 3.14)推断为 float64。注意 JSON 没有整数/浮点之分,若某字段有时是整数有时带小数,建议生成后手动统一改为 float64,避免反序列化时丢精度或报错。',
      },
      {
        q: '嵌套对象会怎么处理?',
        a: '每个嵌套对象都会生成一个独立的命名结构体,父字段引用它。例如 {"user":{"id":1}} 会生成 User 结构体和引用它的 Field。重名时自动追加数字(如 User2)避免冲突。',
      },
      {
        q: '空数组或 null 会得到什么类型?',
        a: '空数组 [] 无法推断元素类型,生成 []interface{};null 同样信息不足,生成 interface{}。生成后建议根据实际数据手动替换为具体类型,例如把 []interface{} 改成 []string。',
      },
    ],
  },

  'color-name': {
    metaTitle: 'HEX/RGB 转颜色名 — 最接近的 CSS 色名',
    metaDescription:
      '输入 HEX 或 RGB,找出最接近的 CSS 标准颜色名。#ff0000 = red、#4169e1 = royalblue。支持 #rgb、#rrggbb、rgb(r,g,b),实时显示色块对比。',
    intro:
      '给一个 HEX 或 RGB 颜色,找出 CSS 标准 140 个命名颜色里最接近的那个。例如 #ff0000 精确匹配 red,#4169e1 匹配 royalblue,#4a72d0 这类非标准值则返回最接近的色名并标注。支持 #rgb、#rrggbb、rgb(r,g,b) 三种输入。',
    features: [
      '在约 140 个 CSS 标准命名颜色中,按 RGB 欧氏距离找最接近者。',
      '精确命中时标注「精确匹配」,否则标注「最接近的颜色」。',
      '支持 #rgb 简写、#rrggbb 全写、rgb(r,g,b)/rgba(...) 多种格式。',
      '同屏并排显示输入色块与匹配色块,直观对比色差。',
    ],
    steps: [
      {
        title: '输入颜色值',
        body: '键入 HEX 或 RGB,例如 #4169e1、#f00(简写)或 rgb(65, 105, 225)。格式无法识别时会提示需用 #rgb、#rrggbb 或 rgb(r,g,b)。',
      },
      {
        title: '查看匹配结果',
        body: '工具立即给出最接近的 CSS 色名,如 royalblue (#4169e1),并并排显示你的输入色和匹配色的色块。若完全一致会显示「精确匹配」。',
      },
      {
        title: '复制色名使用',
        body: '点复制按钮取得色名(如 royalblue),可直接写进 CSS:color: royalblue;,比记十六进制更易读。',
      },
    ],
    faqs: [
      {
        q: '为什么 #00ffff 同时是 cyan 和 aqua?',
        a: 'CSS 里 cyan 和 aqua 是同一个颜色 #00ffff 的两个标准名称(magenta 与 fuchsia 同理 = #ff00ff)。本工具按字典顺序返回先匹配到的那个,两者效果完全相同,可任选其一。',
      },
      {
        q: '找到的色名和我的颜色不完全一样怎么办?',
        a: '当输入不是 140 个标准色之一时,工具按 RGB 距离返回最接近的色名,并标注「最接近的颜色」而非「精确匹配」。如果需要原样精度,请继续用 HEX/RGB 值,色名仅供近似参考或取名。',
      },
      {
        q: '匹配是按什么算法找最近颜色的?',
        a: '用 RGB 三通道的欧氏距离平方(Δr²+Δg²+Δb²)取最小值。这是简单快速的方法,但与人眼感知略有偏差;对感知精度要求高的场景,可改用 CIEDE2000 等色差公式,本工具优先速度与直观。',
      },
    ],
  },

  'code-case': {
    metaTitle: '命名风格转换 camelCase snake_case — 在线',
    metaDescription:
      '标识符大小写一键互转:camelCase、PascalCase、snake_case、kebab-case、CONSTANT_CASE、Title Case。userProfileId → user_profile_id,支持多行批量。',
    intro:
      '把一个标识符同时转换成 6 种命名风格。输入 userProfileId,立即得到 user_profile_id、user-profile-id、USER_PROFILE_ID、UserProfileId、Title Case 等写法。能识别驼峰、下划线、连字符、空格甚至数字边界来切词,支持多行批量转换。',
    features: [
      '一次输出 6 种风格:camelCase、PascalCase、snake_case、kebab-case、CONSTANT_CASE、Title Case。',
      '智能切词:同时识别大小写边界、下划线、连字符、空格,userProfileId 与 user-profile-id 都能正确拆成 user / profile / id。',
      '多行输入时逐行转换,适合一次处理一整组字段名。',
      '每种风格结果独立,各带复制按钮。',
    ],
    steps: [
      {
        title: '输入标识符',
        body: '键入任意写法的标识符,如 userProfileId 或 user-profile-id 或 USER_PROFILE_ID。工具会先拆成单词 user / profile / id 再重组。',
      },
      {
        title: '查看 6 种风格',
        body: '同屏列出全部结果:camelCase → userProfileId,snake_case → user_profile_id,kebab-case → user-profile-id,CONSTANT_CASE → USER_PROFILE_ID,PascalCase → UserProfileId。',
      },
      {
        title: '批量转换或复制',
        body: '一行一个标识符可批量处理(每种风格内部按行对应输出)。挑中需要的风格点复制即可粘进代码。',
      },
    ],
    faqs: [
      {
        q: 'camelCase 和 PascalCase 有什么区别?',
        a: '两者都把单词首字母大写连写,唯一区别是首词:camelCase 首词小写(userProfileId),PascalCase 首词也大写(UserProfileId)。前者常用于变量和函数名,后者常用于类名、类型名和构造函数。',
      },
      {
        q: 'snake_case 和 kebab-case 用在什么地方?',
        a: 'snake_case(下划线)常见于 Python 变量、数据库列名、JSON/API 字段;kebab-case(连字符)常见于 URL、CSS 类名、HTML 属性和文件名(因为很多语言不允许标识符里出现连字符)。CONSTANT_CASE 则用于常量。',
      },
      {
        q: '连续大写的缩写(如 HTTPServer)能正确拆分吗?',
        a: '可以。工具会把 HTTPServer 这类「连续大写后接首字母大写词」的边界识别为 HTTP / Server,从而得到 http_server、httpServer 等。但全大写缩写转成 camelCase 时会小写化(变成 httpServer),如需保留 HTTP 原样请手动调整。',
      },
    ],
  },

  'tip-calc': {
    metaTitle: '小费计算器 按比例与人数 — 在线免费',
    metaDescription:
      '按账单金额、小费比例和人数算出小费、总额和人均。50000 的账单 15% 小费 4 人,人均一键算清。预设 10/15/18/20%,也可自定义。',
    intro:
      '输入账单金额、小费比例和人数,立刻算出小费、含小费总额以及每人应付多少。例如账单 50000、小费 15%、4 人时,小费 7500、总额 57500、人均约 14375。提供 10 / 15 / 18 / 20% 快捷按钮,也可手动输入任意比例。',
    features: [
      '同时给出小费金额、含小费总额、以及按人数平摊的人均金额。',
      '提供 10 / 15 / 18 / 20% 常用比例快捷按钮,也支持自定义任意百分比。',
      '人数最少 1 人,改任意字段都会实时重算,无需点按钮。',
      '一键复制小费 / 总额 / 人均三行结果,方便发到群里 AA。',
    ],
    steps: [
      {
        title: '输入账单金额',
        body: '在「计算书金额」填入餐费,如 50000。可带千分位逗号,工具会自动忽略。',
      },
      {
        title: '选择或输入小费比例',
        body: '点 10% / 15% / 18% / 20% 任一按钮,或在下方框里直接键入比例(如 12)。以 50000 账单为例,15% 对应小费 7500。',
      },
      {
        title: '填人数得人均',
        body: '在「人数」填入分摊人数(至少 1 人),如 4。工具算出总额 57500,再除以 4 得人均约 14375,点复制即可分享。',
      },
    ],
    faqs: [
      {
        q: '小费是按账单原价还是含税后金额算的?',
        a: '本工具直接对你输入的「账单金额」乘以比例。是否含税取决于你填的是税前还是税后金额。习惯上小费按税前餐费计算,如果你的账单含税且想严格按税前算,请填税前金额。',
      },
      {
        q: '小费比例一般给多少合适?',
        a: '美国常见为 15~20%:服务一般给 15%,满意给 18~20%。工具默认 15% 并提供 10/15/18/20% 预设。不同国家习惯差异很大(有些地区不给小费或已含服务费),请按当地惯例调整。',
      },
      {
        q: '人均金额是怎么算出来的?',
        a: '人均 =(账单 + 小费)÷ 人数。即先算出含小费总额,再除以分摊人数。例如 50000 账单 15% 小费总额 57500,4 人则人均 57500÷4 ≈ 14375。结果会四舍五入到整数显示。',
      },
    ],
  },

  'subnet-calc': {
    metaTitle: 'IP 子网计算器 CIDR /24 — 网络与主机数',
    metaDescription:
      'IPv4 CIDR 子网计算:输入 192.168.0.1/24,得出网络地址、广播地址、子网掩码、可用主机范围和数量。/24 = 254 台,/30 = 2 台,实时计算。',
    intro:
      '输入一个 IPv4 地址和 CIDR 前缀,算出子网掩码、网络地址、广播地址、首尾可用主机和可用主机数。例如 192.168.0.1/24,网络地址 192.168.0.0、广播 192.168.0.255、可用主机 192.168.0.1~254 共 254 台。前缀用滑块在 /0~/32 间调节。',
    features: [
      '一次给出子网掩码、通配符掩码、网络地址、广播地址、首/尾可用主机及主机总数。',
      'CIDR 前缀用滑块在 /0 到 /32 间调整,结果即时刷新。',
      '正确处理特例:/31、/32 没有常规可用主机,/30 仅 2 台。',
      '每个结果(如网络地址、广播地址)都可单独复制。',
    ],
    steps: [
      {
        title: '输入 IPv4 地址',
        body: '填入点分十进制地址,如 192.168.0.1。带前导零的写法(如 192.168.0.01)会被判为无效以避免歧义。',
      },
      {
        title: '拖动滑块设置前缀',
        body: '用 CIDR 滑块设定 /前缀,如 /24。前缀越大,子网越小:/24 留 8 个主机位,/26 留 6 位。',
      },
      {
        title: '读取网络划分结果',
        body: '以 192.168.0.1/24 为例:网络地址 192.168.0.0、广播 192.168.0.255、掩码 255.255.255.0、可用主机 192.168.0.1 至 192.168.0.254、共 254 台。需要的行点复制即可。',
      },
    ],
    faqs: [
      {
        q: '/24 有多少台可用主机?',
        a: '/24 的子网掩码是 255.255.255.0,留 8 个主机位,共 2⁸ = 256 个地址。减去网络地址和广播地址 2 个,可用主机为 254 台。通用公式:可用主机 = 2^(32−前缀) − 2。',
      },
      {
        q: '为什么要减去 2 个地址?',
        a: '每个常规子网里,主机位全 0 的地址是「网络地址」(代表整个网段),主机位全 1 的是「广播地址」(向网段内所有主机广播),这两个不能分配给设备,所以可用主机数要减 2。',
      },
      {
        q: '/30、/31、/32 这种小子网是什么情况?',
        a: '/30 共 4 个地址,减去网络和广播只剩 2 台可用,常用于点对点链路。/31 按 RFC 3021 用于点对点时 2 个地址都可用(本工具按传统算法显示 0 可用主机),/32 表示单个主机地址(掩码 255.255.255.255)。',
      },
    ],
  },

  bcrypt: {
    metaTitle: 'bcrypt 哈希生成与校验 — 在线工具',
    metaDescription:
      '在浏览器内生成和校验 bcrypt 密码哈希。cost 4~15 可调(默认 10),盐自动内嵌于 $2a$10$ 哈希中。可验证密码与现有哈希是否匹配。',
    intro:
      '在浏览器内为密码生成 bcrypt 哈希,或校验某个密码是否与给定哈希匹配。生成时可调 cost(工作因子,4~15,默认 10),结果形如 $2a$10$...,盐已内嵌在其中。整个过程不联网,密码不会离开你的设备。',
    features: [
      '两种模式:为明文密码生成哈希,或校验「密码 + 哈希」是否匹配。',
      'cost(rounds)滑块 4~15 可调,默认 10;cost 越高越安全也越慢。',
      '自动生成随机盐并内嵌进输出哈希,无需另存盐值。',
      '基于 bcryptjs,全程在浏览器内运行,密码不上传服务器。',
    ],
    steps: [
      {
        title: '选择模式',
        body: '顶部切换「哈希生成」或「校验」。生成模式把密码变成哈希;校验模式判断某密码是否对应某个已有哈希。',
      },
      {
        title: '生成哈希',
        body: '在生成模式输入密码,用滑块设定 cost(如 10),点「哈希生成」。得到形如 $2a$10$N9qo8uLOick... 的结果,$10$ 即 cost,后面 22 字符是盐。点复制保存。',
      },
      {
        title: '校验密码',
        body: '在校验模式输入要测试的密码,并粘贴现有哈希(如 $2a$10$...),点「校验」。匹配显示「一致」,否则「不一致」——可用来确认登录密码或排查哈希问题。',
      },
    ],
    faqs: [
      {
        q: '盐(salt)存在哪里?需要单独保存吗?',
        a: '不需要。bcrypt 把随机盐直接编码进哈希字符串里——$2a$10$ 之后的前 22 个字符就是盐。校验时它会自动从哈希中读取盐,所以你只需保存最终哈希,无须另存盐值。',
      },
      {
        q: 'cost(工作因子)应该设多少?',
        a: 'cost 每加 1,计算量翻倍。10(默认)是常见生产基线,12 更稳妥。本工具上限 15,值越高越抗暴力破解,但生成/校验也越慢(13 以上会有变慢提示)。请按服务器性能与可接受延迟权衡,通常 10~12 即可。',
      },
      {
        q: '同一个密码每次生成的哈希为什么都不一样?',
        a: '因为每次都会用新的随机盐,所以即使密码相同,哈希也不同——这是 bcrypt 抵御彩虹表的关键。不必担心:校验时盐已在哈希内,用 compare 比对总能正确判断,不需要哈希字面相等。',
      },
    ],
  },

  'wifi-qr': {
    metaTitle: 'WiFi 二维码生成器 — 扫码连网,免费',
    metaDescription:
      '输入 WiFi 名称(SSID)、密码和加密方式(WPA/WEP/无),生成可扫码连网的二维码 PNG。支持隐藏网络,全程浏览器内处理,密码不上传。',
    intro:
      '把 WiFi 的名称、密码和加密方式做成二维码,客人用手机相机一扫即可连网,不必口头报密码。支持 WPA/WPA2、WEP 和无密码三种加密类型,也能勾选隐藏网络,生成 512px 的 PNG 可下载打印。',
    features: [
      '生成标准 WIFI: 格式二维码,iOS 相机和 Android 扫一扫均可直接连接。',
      '支持 WPA/WPA2、WEP、无密码三种加密类型。',
      '可勾选「隐藏网络」,为不广播 SSID 的网络生成正确载荷。',
      '自动转义 SSID/密码中的特殊字符(\\ ; , : "),避免二维码连接失败。',
      '导出 512px PNG,适合打印贴在店内或门口。',
    ],
    steps: [
      {
        title: '填写网络信息',
        body: '输入 WiFi 名称(SSID),如 MyCafe_5G。SSID 需与路由器设置完全一致,包括大小写。',
      },
      {
        title: '选加密方式并填密码',
        body: '选择加密类型:家用/店用多为 WPA/WPA2,老设备可能是 WEP,开放网络选「无」(此时密码框禁用)。在密码框填入 WiFi 密码。',
      },
      {
        title: '生成并下载',
        body: '点「QR 码生成」预览二维码,再点「PNG 下载」保存 wifi-qr.png,打印出来贴在显眼处即可让访客扫码连网。',
      },
    ],
    faqs: [
      {
        q: '扫这个二维码就能自动连上 WiFi 吗?',
        a: '是的。它采用标准 WIFI: 载荷格式,iPhone 用相机对准、Android 用系统扫一扫或相机识别后,会弹出「加入网络」提示,确认即连,无需手动输入密码。部分旧机型可能需要在二维码扫描器里打开。',
      },
      {
        q: '加密方式选错(WPA 还是 WEP)会怎样?',
        a: '加密类型必须与路由器实际设置一致,否则扫码后连接会失败或提示密码错误。现代路由器几乎都是 WPA/WPA2,请选 WPA;只有很老的设备才用 WEP;完全开放的网络选「无」。不确定时查路由器后台的「无线安全」设置。',
      },
      {
        q: '什么时候要勾「隐藏网络」?',
        a: '如果你的路由器关闭了 SSID 广播(网络列表里搜不到),就勾选「隐藏网络」,二维码会带上 H:true 标记,设备据此主动探测该网络。普通可见网络不要勾,否则可能影响连接。',
      },
    ],
  },

  'remove-accents': {
    metaTitle: '去除重音符号 café → cafe — 在线工具',
    metaDescription:
      '去除文本中的重音和变音符号:café → cafe、naïve → naive、Müller → Muller。用 Unicode NFD 分解后剥离组合标记,可批量处理多行。',
    intro:
      '把带重音/变音符号的字母还原成基础拉丁字母。例如 café → cafe、résumé → resume、naïve → naive、Señor → Senor。原理是先做 Unicode NFD 分解,再剥掉组合标记(U+0300–U+036F),输入即时转换。',
    features: [
      '去除常见变音符号:重音(é è)、分音(ü ï)、波浪号(ñ)、抑扬符(â)等。',
      '采用 Unicode NFD 规范分解 + 剥离组合标记,准确且不改变非重音字符。',
      '保留大小写与其余文本,café → cafe、CAFÉ → CAFE。',
      '支持多行/整段文本一次处理,适合清洗导入数据或生成 slug。',
    ],
    steps: [
      {
        title: '粘贴文本',
        body: '把含重音的文字粘进输入框,例如 «Crème brûlée à la française»。可以是单词、句子或整段。',
      },
      {
        title: '即时得到结果',
        body: '下方只读框实时显示去符号结果,如 «Creme brulee a la francaise»。基础字母和标点保持不变,只有变音符号被去掉。',
      },
      {
        title: '复制使用',
        body: '点「复制」取出纯净文本,可用于生成 URL slug、统一搜索关键词、清洗 CSV 数据,或避免某些系统对重音字符的兼容问题。',
      },
    ],
    faqs: [
      {
        q: '德语 ß 或丹麦语 ø 这类字符也会被转换吗?',
        a: '不一定。本工具只剥离「基础字母 + 组合标记」分解后的标记,所以 é、ü、ñ 等能去掉。但 ß(德语)、ø(丹麦语)、ł(波兰语)等是独立字母而非「字母+标记」,NFD 无法拆分,会原样保留。这类字符若要转写需另行映射(如 ß→ss)。',
      },
      {
        q: '中文、日文、韩文会受影响吗?',
        a: '不会。该方法只移除拉丁等文字的组合变音标记,汉字、假名、谚文这些没有可剥离的组合标记,会完整保留。可以放心对中外混排文本使用,只有重音字母会被规整。',
      },
      {
        q: '它和大小写转换、去空格是一回事吗?',
        a: '不是。本工具只处理变音符号,不改变大小写、不删空格标点。café 转成 cafe 但 CAFÉ 转成 CAFE(大小写保留)。如需同时小写化或生成 slug,请配合大小写转换或 slug 工具一起用。',
      },
    ],
  },

  'json-flatten': {
    metaTitle: 'JSON 扁平化 / 还原 点记法 — 在线工具',
    metaDescription:
      '把嵌套 JSON 扁平化为点记法键({"a":{"b":1}} → {"a.b":1}),数组用数字索引(a.0)。也支持逆向还原,实时转换,可复制或下载。',
    intro:
      '在「嵌套 JSON」与「点记法扁平 JSON」之间双向转换。扁平化把 {"a":{"b":[1,2]}} 变成 {"a.b.0":1,"a.b.1":2};还原则把点记法键重新组装回嵌套结构。数组用数字索引段(如 a.0)表示,空对象/空数组会原样保留。',
    features: [
      '双向转换:嵌套 → 点记法扁平化,或点记法 → 还原回嵌套。',
      '数组以数字索引段表示(items.0.name),还原时按下一段是否为整数自动判断生成数组还是对象。',
      '保留空对象 {} 与空数组 [] 作为值,不会丢失。',
      '语法错误即时提示,结果可一键复制或下载为 .json。',
    ],
    steps: [
      {
        title: '选择模式',
        body: '顶部切换「扁平化」或「还原」。扁平化用于把嵌套结构压成单层点记法键;还原用于把点记法键重新展开成嵌套对象。',
      },
      {
        title: '粘贴 JSON',
        body: '扁平化模式粘入嵌套 JSON,如 {"user":{"name":"kim","tags":["a","b"]}},得到 {"user.name":"kim","user.tags.0":"a","user.tags.1":"b"}。还原模式则粘入点记法扁平对象。',
      },
      {
        title: '复制或下载结果',
        body: '右侧实时输出格式化结果。点「复制」放进代码,或点「下载」保存为 flattened.json / unflattened.json。',
      },
    ],
    faqs: [
      {
        q: '数组在扁平化后会变成什么样?',
        a: '数组元素用数字索引作为键段。例如 {"tags":["a","b"]} 扁平化为 {"tags.0":"a","tags.1":"b"}。还原时,工具看到某段的下一段是纯数字(如 0、1),就把容器建成数组而非对象,从而正确还原成 ["a","b"]。',
      },
      {
        q: '如果原始键名里本来就带点号会怎样?',
        a: '会产生歧义。本工具用「.」作为层级分隔符,如果你的键名本身含点(如 {"a.b":1}),扁平化/还原时无法区分它是一个键还是两层。处理这类数据前,建议先确认键名不含点号,或改用不会与数据冲突的分隔方案。',
      },
      {
        q: '能保证扁平化再还原后和原始 JSON 完全一致吗?',
        a: '大多数情况可以无损往返,且工具特意保留了空对象 {} 和空数组 []。但若键名含点号、或对象键恰好是连续数字(会被还原误判为数组),可能无法精确复原。普通配置和 API 数据通常没问题,边缘情况请核对结果。',
      },
    ],
  },
};

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

  const base: GuideContentZh = {
    metaTitle,
    metaDescription,
    intro,
    features: buildFeatures(pattern, cat),
    steps: buildSteps(tool, pattern, cat, zh),
    faqs: buildFaqs(tool, pattern, cat, zh),
  };

  const override = CUSTOM_GUIDES_ZH[tool.id];
  if (!override) return base;

  return {
    metaTitle: override.metaTitle ?? base.metaTitle,
    metaDescription: override.metaDescription ?? base.metaDescription,
    intro: override.intro ?? base.intro,
    features: override.features ?? base.features,
    steps: override.steps ?? base.steps,
    faqs: override.faqs ? [...override.faqs, ...COMMON_FAQS_ZH] : base.faqs,
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

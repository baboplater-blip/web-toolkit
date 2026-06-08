/**
 * 한국어 처리 공용 유틸 — 자모 분해/조합, 자판 변환, 띄어쓰기·맞춤법 휴리스틱,
 * 한자 → 한글 변환 사전.
 *
 * 모두 클라이언트에서 동작. 외부 의존성 없음.
 */

/* ============================================================
 * 자모 분해/조합 (Hangul Syllable ↔ Jamo)
 * ============================================================ */

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

// 초성 19종
const CHO = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];
// 중성 21종
const JUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ',
  'ㅣ',
];
// 종성 28종 (0 = 없음)
const JONG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

export function isSyllable(ch: string): boolean {
  if (!ch) return false;
  const c = ch.charCodeAt(0);
  return c >= HANGUL_BASE && c <= HANGUL_END;
}

/** 한글 음절 → 초/중/종성 배열 */
export function decomposeSyllable(ch: string): [string, string, string] | null {
  const c = ch.charCodeAt(0);
  if (c < HANGUL_BASE || c > HANGUL_END) return null;
  const offset = c - HANGUL_BASE;
  const cho = Math.floor(offset / 588);
  const jung = Math.floor((offset % 588) / 28);
  const jong = offset % 28;
  return [CHO[cho], JUNG[jung], JONG[jong]];
}

/** 문자열을 자모로 분해 (다른 문자는 그대로) */
export function decomposeAll(s: string): string {
  let out = '';
  for (const ch of s) {
    const d = decomposeSyllable(ch);
    if (d) out += d[0] + d[1] + d[2];
    else out += ch;
  }
  return out;
}

/** 초/중/종성 → 한글 음절 (없는 종성은 빈 문자열) */
export function composeSyllable(cho: string, jung: string, jong = ''): string {
  const ci = CHO.indexOf(cho);
  const ji = JUNG.indexOf(jung);
  const joi = jong ? JONG.indexOf(jong) : 0;
  if (ci < 0 || ji < 0 || joi < 0) return cho + jung + jong;
  return String.fromCharCode(HANGUL_BASE + ci * 588 + ji * 28 + joi);
}

/* ============================================================
 * 한 ↔ 영 자판 변환 (잘못 누른 한영키)
 *
 * 두벌식 표준 자판 매핑.
 * - 알파벳 → 자모 (영문 입력 후 한영 변환): "dkssudgktpdy" → "안녕하세요"
 * - 자모 → 알파벳 (한국어 입력 후 영문 변환): "안녕하세요" → "dkssudgktpdy"
 * ============================================================ */

const EN_TO_KO: Record<string, string> = {
  q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ', y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
  a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ', h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
  z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
  Q: 'ㅃ', W: 'ㅉ', E: 'ㄸ', R: 'ㄲ', T: 'ㅆ', O: 'ㅒ', P: 'ㅖ',
};

const KO_TO_EN: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_KO).map(([k, v]) => [v, k]),
);

/**
 * 영문(자판) 입력을 한글로 변환 (조합).
 * "dkssudgktpdy" → "안녕하세요"
 */
export function en2ko(input: string): string {
  // 1) 알파벳 → 자모 시퀀스
  const jamo: string[] = [];
  for (const ch of input) {
    if (EN_TO_KO[ch]) jamo.push(EN_TO_KO[ch]);
    else jamo.push(ch);
  }
  // 2) 자모 시퀀스 → 음절 조합
  return composeJamoSequence(jamo);
}

function isCho(c: string): number {
  return CHO.indexOf(c);
}
function isJung(c: string): number {
  return JUNG.indexOf(c);
}
function isJong(c: string): number {
  return JONG.indexOf(c);
}

const JUNG_COMBO: Record<string, string> = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ',
};

const JONG_COMBO: Record<string, string> = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ',
  'ㅂㅅ': 'ㅄ',
};

function composeJamoSequence(jamo: string[]): string {
  let out = '';
  let i = 0;
  while (i < jamo.length) {
    const c = jamo[i];
    const ci = isCho(c);
    if (ci < 0) {
      out += c;
      i++;
      continue;
    }
    // 다음이 중성?
    const next = jamo[i + 1];
    const ji = isJung(next ?? '');
    if (ji < 0) {
      out += c;
      i++;
      continue;
    }
    // 중성 결합 검토
    let junIdx = ji;
    let jumped = 2; // 초+중
    const combo2 = JUNG_COMBO[next + jamo[i + 2]];
    if (combo2) {
      junIdx = JUNG.indexOf(combo2);
      jumped = 3;
    }
    // 종성 검토 — 다음이 자음이면 종성 후보
    let jongIdx = 0;
    const after = jamo[i + jumped];
    if (after && CHO.includes(after)) {
      // 다음 다음이 중성이면 종성 사용 X (다음 음절 초성)
      const after2 = jamo[i + jumped + 1];
      if (after2 && isJung(after2) >= 0) {
        // 종성 결합 가능?
        const combo = JONG_COMBO[after + (jamo[i + jumped + 1] && CHO.includes(jamo[i + jumped + 1]) ? '' : '')];
        // 일단 단일 종성도 안 씀
      } else {
        // 단일 종성
        const jij = JONG.indexOf(after);
        if (jij >= 0) {
          jongIdx = jij;
          jumped++;
          // 추가 종성 결합?
          const after3 = jamo[i + jumped];
          if (after3) {
            const j2 = JONG_COMBO[after + after3];
            // 다음 다음 모음이면 종성 결합 X
            const afterAfter = jamo[i + jumped + 1];
            if (j2 && (!afterAfter || isJung(afterAfter) < 0)) {
              jongIdx = JONG.indexOf(j2);
              jumped++;
            }
          }
        }
      }
    }
    out += composeSyllable(CHO[ci], JUNG[junIdx], JONG[jongIdx]);
    i += jumped;
  }
  return out;
}

/**
 * 한글 텍스트를 영문 자판으로 변환.
 * "안녕하세요" → "dkssudgktpdy"
 */
export function ko2en(input: string): string {
  const decomposed = decomposeAll(input);
  let out = '';
  for (const ch of decomposed) {
    if (KO_TO_EN[ch]) out += KO_TO_EN[ch];
    else out += ch;
  }
  return out;
}

/* ============================================================
 * 한자 → 한글 변환 사전 (자주 쓰이는 한자 위주, ~500자)
 * ============================================================ */

export const HANJA_MAP: Record<string, string> = {
  // 숫자
  '一': '일', '二': '이', '三': '삼', '四': '사', '五': '오', '六': '육', '七': '칠', '八': '팔', '九': '구', '十': '십',
  '百': '백', '千': '천', '萬': '만', '億': '억', '兆': '조',
  // 시간·달력
  '年': '년', '月': '월', '日': '일', '時': '시', '分': '분', '秒': '초',
  '春': '춘', '夏': '하', '秋': '추', '冬': '동',
  '節': '절', '期': '기',
  // 가족·관계
  '父': '부', '母': '모', '子': '자', '女': '여', '男': '남', '兄': '형', '弟': '제', '姉': '자', '妹': '매',
  '夫': '부', '妻': '처', '家': '가', '族': '족', '親': '친', '友': '우',
  // 신체
  '人': '인', '口': '구', '目': '목', '耳': '이', '鼻': '비', '手': '수', '足': '족', '心': '심', '頭': '두',
  // 자연
  '山': '산', '川': '천', '海': '해', '江': '강', '湖': '호', '島': '도', '林': '림', '森': '삼',
  '天': '천', '地': '지', '星': '성', '雲': '운', '雨': '우', '雪': '설', '風': '풍',
  '火': '화', '水': '수', '木': '목', '金': '금', '土': '토', '石': '석',
  // 방향
  '東': '동', '西': '서', '南': '남', '北': '북', '中': '중', '上': '상', '下': '하', '左': '좌', '右': '우',
  // 학교·학문
  '學': '학', '校': '교', '生': '생', '師': '사', '書': '서', '冊': '책', '文': '문', '字': '자', '言': '언', '語': '어',
  '名': '명', '姓': '성', '号': '호', '號': '호',
  // 색
  '色': '색', '白': '백', '黑': '흑', '赤': '적', '靑': '청', '黃': '황', '綠': '록',
  // 동작·상태
  '見': '견', '聞': '문', '行': '행', '來': '래', '去': '거', '入': '입', '出': '출', '立': '립', '坐': '좌',
  '死': '사', '愛': '애', '惡': '악', '美': '미', '好': '호',
  // 양적
  '大': '대', '小': '소', '多': '다', '少': '소', '高': '고', '低': '저', '長': '장', '短': '단', '新': '신', '舊': '구',
  '前': '전', '後': '후', '內': '내', '外': '외',
  // 의식주
  '食': '식', '飯': '반', '茶': '차', '酒': '주', '衣': '의', '服': '복', '屋': '옥', '室': '실', '門': '문', '窓': '창',
  // 사회
  '國': '국', '王': '왕', '民': '민', '市': '시', '都': '도', '邑': '읍', '村': '촌',
  '政': '정', '治': '치', '經': '경', '濟': '제', '社': '사', '會': '회', '法': '법',
  // 일반 한자
  '本': '본', '記': '기', '事': '사', '物': '물', '所': '소', '間': '간',
  '此': '차', '是': '시', '不': '불', '無': '무', '有': '유', '可': '가', '必': '필',
  '同': '동', '異': '이', '正': '정', '反': '반', '對': '대', '相': '상', '共': '공',
  '主': '주', '客': '객', '先': '선', '次': '차', '末': '말', '全': '전', '部': '부',
  '理': '리', '道': '도', '德': '덕', '禮': '례', '義': '의', '信': '신', '智': '지', '仁': '인', '勇': '용',
  '思': '사', '念': '념', '想': '상', '意': '의', '志': '지',
  '工': '공', '業': '업', '商': '상', '農': '농', '漁': '어',
  '車': '차', '船': '선', '機': '기', '電': '전', '氣': '기', '光': '광',
  '安': '안', '吉': '길', '幸': '행', '福': '복', '健': '건', '康': '강',
  '侯': '후', '將': '장', '士': '사', '兵': '병',
  '宮': '궁', '殿': '전', '城': '성', '京': '경', '府': '부',
  '靈': '령', '神': '신', '佛': '불', '聖': '성', '魂': '혼',
  '夢': '몽', '醉': '취', '醒': '성', '覺': '각', '悟': '오',
  '寒': '한', '暑': '서', '凉': '량', '溫': '온',
  '貧': '빈', '富': '부', '貴': '귀', '賤': '천',
  '武': '무', '勝': '승', '敗': '패', '攻': '공', '守': '수',
  '近': '근', '遠': '원', '深': '심', '淺': '천', '廣': '광', '狹': '협',
  '州': '주', '里': '리',
  '原': '원', '因': '인', '果': '과', '由': '유',
  '直': '직', '曲': '곡', '誠': '성', '實': '실', '虛': '허',
  '明': '명', '暗': '암',
  '形': '형', '式': '식', '樣': '양', '態': '태',
  '質': '질', '量': '량', '重': '중', '輕': '경',
  '價': '가', '値': '치', '貨': '화', '財': '재', '寶': '보',
};

export function hanjaToHangul(text: string): { result: string; replacements: number } {
  let count = 0;
  let out = '';
  for (const ch of text) {
    if (HANJA_MAP[ch]) {
      out += HANJA_MAP[ch];
      count++;
    } else {
      out += ch;
    }
  }
  return { result: out, replacements: count };
}

/* ============================================================
 * 띄어쓰기 휴리스틱
 *
 * 완벽한 한글 띄어쓰기는 형태소 분석이 필요하지만,
 * 일상 텍스트에서 자주 빠지는 80% 케이스를 규칙으로 교정.
 *
 *   - 조사 앞에 공백 있으면 제거
 *   - 의존명사 앞에 공백 없으면 추가 (것, 수, 등, 뿐, 만큼, 듯, 채, 척)
 *   - "보다 / 부터 / 까지 / 마저 / 조차" 등 조사 처리
 *   - 숫자+단위 (1개, 2명, 3살) 는 붙임
 * ============================================================ */

const PARTICLES = [
  '을', '를', '이', '가', '은', '는',
  '의', '에', '에서', '에게', '한테', '께', '께서',
  '으로', '로', '와', '과', '랑', '이랑',
  '부터', '까지', '마저', '조차', '도', '만',
  '이다', '입니다', '입니다', '예요', '에요',
];

const DEPENDENT_NOUNS = [
  '것', '수', '등', '뿐', '만큼', '듯', '척', '채',
  '바', '나름', '나위', '대로', '따위', '터', '리',
  '편', '쪽', '겸', '및',
];

// 키 입력마다 RegExp 를 새로 만들지 않도록 모듈 로드 시 한 번만 컴파일한다.
// (autoSpacing 은 매 호출마다 의존명사·조사 수십 개의 정규식을 만들던 핫패스였다.)
const DEPENDENT_NOUN_RULES: { dep: string; re: RegExp }[] = DEPENDENT_NOUNS.map((dep) => ({
  dep,
  re: new RegExp(`([가-힣])${dep}(?=[가-힣은는이가을를도])`, 'g'),
}));

const PARTICLE_RULES: { p: string; re: RegExp }[] = PARTICLES.map((p) => ({
  p,
  re: new RegExp(`([가-힣])\\s+${p}(?=[\\s.,!?]|$)`, 'g'),
}));

const NUMBER_UNIT_RE =
  /(\d+)\s+(개|명|살|마리|번|장|권|건|회|병|개월|년|월|일|시간|분|초|만원|원|kg|km|cm|mm|m|g)/g;
const MULTI_SPACE_RE = /[ \t]+/g;

/**
 * 자주 빠지는 띄어쓰기 규칙으로 교정.
 * 매우 보수적 — 잘못된 교정을 줄이는 데 우선.
 */
export function autoSpacing(input: string): string {
  let s = input;

  // 1) 의존명사 앞에 공백 추가 — "할것이다" → "할 것이다"
  //    조건: 앞이 한글 종결어미 (아/어/은/는/할/일 등) + 의존명사
  for (const { dep, re } of DEPENDENT_NOUN_RULES) {
    re.lastIndex = 0; // 전역 RegExp 재사용 시 lastIndex 초기화 필수
    s = s.replace(re, `$1 ${dep}`);
  }

  // 2) 숫자+한글 단위는 붙임 (오히려 분리되어 있으면 합침)
  //    "3 개" → "3개", "100 만원" → "100만원"
  NUMBER_UNIT_RE.lastIndex = 0;
  s = s.replace(NUMBER_UNIT_RE, '$1$2');

  // 3) 조사 앞 공백 제거 — "사과 를" → "사과를"
  for (const { p, re } of PARTICLE_RULES) {
    re.lastIndex = 0;
    s = s.replace(re, `$1${p}`);
  }

  // 4) 다중 공백 정리
  MULTI_SPACE_RE.lastIndex = 0;
  s = s.replace(MULTI_SPACE_RE, ' ');
  return s.trim();
}

/* ============================================================
 * 맞춤법 — 자주 틀리는 단어/구문 사전
 * ============================================================ */

interface SpellRule {
  pattern: RegExp;
  fix: string;
  desc: string;
}

const SPELL_RULES: SpellRule[] = [
  // 되/돼
  { pattern: /안되([^요다어]|$)/g, fix: '안 돼$1', desc: '"안 돼" 가 표준 — "안되" 는 비표준' },
  { pattern: /([가-힣])되요/g, fix: '$1돼요', desc: '"~돼요" — 되어요의 줄임' },
  { pattern: /않되/g, fix: '안 돼', desc: '"않되" 는 "안 돼"' },
  // 안/않
  { pattern: /(\S+)않([가-힣]+)다/g, fix: '$1 않$2다', desc: '"않다" 는 띄어쓰지만 어간 결합형은 붙음 — 검토' },
  // 만큼/큼
  { pattern: /얼만큼/g, fix: '얼마나', desc: '"얼만큼" 은 표준 X' },
  // 던/든
  { pattern: /무엇이든지/g, fix: '무엇이든지', desc: 'OK' },
  // 갯/개
  { pattern: /몇갯/g, fix: '몇 개', desc: '"갯" 은 사이시옷 잘못 — "개"' },
  // 률/율
  { pattern: /확율/g, fix: '확률', desc: '받침 + 률' },
  { pattern: /비률/g, fix: '비율', desc: '모음/ㄴ + 율' },
  // 이에요/예요
  { pattern: /([가-힣])([ㅏ-ㅣ])에요/g, fix: (m: string) => m, desc: '받침 유무에 따라 다름' } as unknown as SpellRule,
  // 일찍/일찌기
  { pattern: /일찌기/g, fix: '일찍이', desc: '"일찍이" 가 표준' },
  // 어떻게/어떡해
  { pattern: /어떻해/g, fix: '어떡해', desc: '어떻게 해 → 어떡해' },
  // 며칠/몇일
  { pattern: /몇일/g, fix: '며칠', desc: '"며칠" 만 표준' },
  // 가까이/가까히
  { pattern: /가까히/g, fix: '가까이', desc: '"가까이" 가 표준' },
  // 깨끗이/깨끗히
  { pattern: /깨끗히/g, fix: '깨끗이', desc: '"깨끗이" 가 표준' },
  // 곰곰이/곰곰히
  { pattern: /곰곰히/g, fix: '곰곰이', desc: '"곰곰이" 가 표준' },
  // 뒤풀이/뒷풀이
  { pattern: /뒷풀이/g, fix: '뒤풀이', desc: '"뒤풀이" 가 표준' },
  // 설겆이/설거지
  { pattern: /설겆이/g, fix: '설거지', desc: '"설거지" 가 표준' },
  // 며칠 / 몇 일
  { pattern: /몇\s*일/g, fix: '며칠', desc: '"며칠" 한 단어' },
  // 알맞은/알맞는
  { pattern: /알맞는/g, fix: '알맞은', desc: '형용사 "알맞다" 의 활용은 "알맞은"' },
  // 바람/바램
  { pattern: /바램/g, fix: '바람', desc: '"바람직" 의 "바람"' },
  // 통째로/통채로
  { pattern: /통채로/g, fix: '통째로', desc: '"통째로" 가 표준' },
  // 햇빛 / 햇볕
  { pattern: /햇볓/g, fix: '햇볕', desc: '"햇볕" 표준 표기' },
  // 일일이/일일히
  { pattern: /일일히/g, fix: '일일이', desc: '"일일이" 가 표준' },
  // 어처구니
  { pattern: /어이없다/g, fix: '어이없다', desc: 'OK' },
];

export interface SpellMatch {
  index: number;
  length: number;
  original: string;
  suggestion: string;
  desc: string;
}

// 키 입력마다 규칙별 RegExp 를 새로 만들지 않도록 모듈 로드 시 전역 플래그 버전을 한 번만 컴파일한다.
// exec 루프에서 재사용하므로 호출 시작 전 lastIndex 를 반드시 0으로 초기화한다.
const SPELL_EXEC_RES: WeakMap<SpellRule, RegExp> = new WeakMap();
for (const rule of SPELL_RULES) {
  if (typeof rule.fix !== 'string') continue;
  const flags = rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g';
  SPELL_EXEC_RES.set(rule, new RegExp(rule.pattern.source, flags));
}

export function findSpellIssues(text: string): SpellMatch[] {
  const out: SpellMatch[] = [];
  for (const rule of SPELL_RULES) {
    if (typeof rule.fix !== 'string') continue;
    const re = SPELL_EXEC_RES.get(rule);
    if (!re) continue;
    re.lastIndex = 0; // 전역 RegExp 재사용 — 이전 호출의 lastIndex 잔존 방지
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      out.push({
        index: m.index,
        length: m[0].length,
        original: m[0],
        suggestion: m[0].replace(rule.pattern, rule.fix as string),
        desc: rule.desc,
      });
      if (m.index === re.lastIndex) re.lastIndex++; // safety
    }
  }
  // 중첩 매치 제거 (앞에 나오는 것 우선)
  out.sort((a, b) => a.index - b.index);
  const filtered: SpellMatch[] = [];
  let lastEnd = -1;
  for (const m of out) {
    if (m.index >= lastEnd) {
      filtered.push(m);
      lastEnd = m.index + m.length;
    }
  }
  return filtered;
}

export function applyAllFixes(text: string): { result: string; count: number } {
  let s = text;
  let count = 0;
  for (const rule of SPELL_RULES) {
    if (typeof rule.fix !== 'string') continue;
    const before = s;
    s = s.replace(rule.pattern, rule.fix);
    if (before !== s) count++;
  }
  return { result: s, count };
}

/**
 * 대한민국 급여 관련 계산 — 4대보험 · 근로소득세 · 퇴직금.
 *
 * 브라우저 안에서 완결되는 순수 함수. 외부 의존 없음.
 *
 * 주의: 소득세는 "연말정산 기준 예상치"(근로소득공제 → 과세표준 → 누진세율 →
 * 근로소득세액공제) 로 계산한다. 매월 원천징수되는 간이세액표 금액과는 다를 수
 * 있으며, 실제 세액은 부양가족·각종 공제·연말정산 결과에 따라 달라진다.
 *
 * 요율 기준연도는 RATES.year 로 노출한다. 요율이 바뀌면 이 상수만 갱신.
 */

export interface InsuranceRates {
  year: number;
  /** 국민연금 근로자 부담 (보수월액 기준) */
  nationalPension: number;
  /** 국민연금 기준소득월액 상한 (월) */
  pensionUpperBound: number;
  /** 국민연금 기준소득월액 하한 (월) */
  pensionLowerBound: number;
  /** 건강보험 근로자 부담 (보수월액 기준) */
  health: number;
  /** 장기요양보험 (건강보험료 대비) */
  longTermCare: number;
  /** 고용보험 근로자 부담 */
  employment: number;
}

/** 2025년 기준 4대보험 근로자 부담 요율. */
export const RATES: InsuranceRates = {
  year: 2025,
  nationalPension: 0.045,
  pensionUpperBound: 6_370_000,
  pensionLowerBound: 400_000,
  health: 0.03545,
  longTermCare: 0.1295,
  employment: 0.009,
};

/** 근로소득 과세표준 누진세율 (2024~) — [상한, 세율, 누진공제]. */
const INCOME_TAX_BRACKETS: Array<[number, number, number]> = [
  [14_000_000, 0.06, 0],
  [50_000_000, 0.15, 1_260_000],
  [88_000_000, 0.24, 5_760_000],
  [150_000_000, 0.35, 15_440_000],
  [300_000_000, 0.38, 19_940_000],
  [500_000_000, 0.4, 25_940_000],
  [1_000_000_000, 0.42, 35_940_000],
  [Infinity, 0.45, 65_940_000],
];

/** 근로소득공제 (총급여 기준, 한도 2,000만원). */
function earnedIncomeDeduction(gross: number): number {
  let d: number;
  if (gross <= 5_000_000) d = gross * 0.7;
  else if (gross <= 15_000_000) d = 3_500_000 + (gross - 5_000_000) * 0.4;
  else if (gross <= 45_000_000) d = 7_500_000 + (gross - 15_000_000) * 0.15;
  else if (gross <= 100_000_000) d = 12_000_000 + (gross - 45_000_000) * 0.05;
  else d = 14_750_000 + (gross - 100_000_000) * 0.02;
  return Math.min(d, 20_000_000);
}

/** 과세표준 → 산출세액. */
function progressiveTax(base: number): number {
  if (base <= 0) return 0;
  for (const [cap, rate, sub] of INCOME_TAX_BRACKETS) {
    if (base <= cap) return base * rate - sub;
  }
  return 0;
}

/** 근로소득세액공제 (산출세액 130만 이하 55%, 초과 30%; 총급여별 한도). */
function earnedIncomeTaxCredit(calculatedTax: number, gross: number): number {
  const credit =
    calculatedTax <= 1_300_000
      ? calculatedTax * 0.55
      : 715_000 + (calculatedTax - 1_300_000) * 0.3;
  let cap: number;
  if (gross <= 33_000_000) cap = 740_000;
  else if (gross <= 70_000_000)
    cap = Math.max(660_000, 740_000 - (gross - 33_000_000) * 0.008);
  else cap = Math.max(500_000, 660_000 - (gross - 70_000_000) * 0.5);
  return Math.min(credit, cap);
}

export interface SalaryInput {
  /** 연봉 (원). 월급 입력 시 ×12 해서 전달. */
  annualGross: number;
  /** 월 비과세액 (식대 등) — 보험·세금 제외 대상. 기본 식대 20만 가정 가능. */
  monthlyNonTax: number;
  /** 부양가족 수 (본인 포함). 기본 1. */
  dependents: number;
}

export interface SalaryResult {
  monthlyGross: number;
  monthlyTaxable: number;
  nationalPension: number;
  health: number;
  longTermCare: number;
  employment: number;
  incomeTax: number;
  localTax: number;
  totalDeduction: number;
  netMonthly: number;
  netAnnual: number;
}

/** 월 4대보험 + 소득세를 계산해 실수령액을 반환. */
export function calcSalary(input: SalaryInput): SalaryResult {
  const monthlyGross = input.annualGross / 12;
  const nonTax = Math.max(0, input.monthlyNonTax);
  const monthlyTaxable = Math.max(0, monthlyGross - nonTax);
  const dependents = Math.max(1, Math.floor(input.dependents));

  // 4대보험 (보수월액 = 과세 보수월액)
  const pensionBase = Math.min(
    Math.max(monthlyTaxable, RATES.pensionLowerBound),
    RATES.pensionUpperBound,
  );
  const nationalPension = round10(pensionBase * RATES.nationalPension);
  const health = round10(monthlyTaxable * RATES.health);
  const longTermCare = round10(health * RATES.longTermCare);
  const employment = round10(monthlyTaxable * RATES.employment);

  // 소득세 (연말정산 기준 예상치)
  const annualTaxableSalary = monthlyTaxable * 12; // 비과세 제외 총급여
  const incomeDed = earnedIncomeDeduction(annualTaxableSalary);
  const insuranceDed = (health + longTermCare + employment + nationalPension) * 12;
  const personalDed = 1_500_000 * dependents;
  const taxBase = Math.max(
    0,
    annualTaxableSalary - incomeDed - personalDed - insuranceDed,
  );
  const calcTax = progressiveTax(taxBase);
  const credit = earnedIncomeTaxCredit(calcTax, annualTaxableSalary);
  const annualIncomeTax = Math.max(0, calcTax - credit);
  const incomeTax = round10(annualIncomeTax / 12);
  const localTax = round10(incomeTax * 0.1);

  const totalDeduction =
    nationalPension + health + longTermCare + employment + incomeTax + localTax;
  const netMonthly = monthlyGross - totalDeduction;

  return {
    monthlyGross: Math.round(monthlyGross),
    monthlyTaxable: Math.round(monthlyTaxable),
    nationalPension,
    health,
    longTermCare,
    employment,
    incomeTax,
    localTax,
    totalDeduction,
    netMonthly: Math.round(netMonthly),
    netAnnual: Math.round(netMonthly * 12),
  };
}

/** 원 단위 절사 (10원 미만 버림) — 실무 관행. */
function round10(n: number): number {
  return Math.floor(n / 10) * 10;
}

// ── 퇴직금 ────────────────────────────────────────────────────────────────

export interface SeveranceInput {
  /** 입사일 (ISO yyyy-mm-dd) */
  joinDate: string;
  /** 퇴사일 (마지막 근무 다음날 기준이 원칙이나, 여기선 퇴직일 포함 재직일수로 단순화) */
  leaveDate: string;
  /** 퇴직 전 3개월 임금총액 (원) — 기본급+수당, 상여 안분 포함 가능 */
  last3MonthsPay: number;
  /** 연간 상여금 총액 (원, 선택) — 3개월분 안분해 평균임금에 가산 */
  annualBonus?: number;
  /** 연차수당 (원, 선택) — 3개월분 안분 */
  annualLeaveAllowance?: number;
}

export interface SeveranceResult {
  daysWorked: number;
  /** 평균임금 (1일) */
  avgDailyWage: number;
  severance: number;
  /** 재직연수 (소수) */
  years: number;
}

/** 두 ISO 날짜 사이 일수 (leave - join), 재직일수는 +1. */
export function daysBetween(joinISO: string, leaveISO: string): number {
  const join = Date.parse(joinISO);
  const leave = Date.parse(leaveISO);
  if (Number.isNaN(join) || Number.isNaN(leave) || leave < join) return 0;
  return Math.round((leave - join) / 86_400_000) + 1;
}

export function calcSeverance(input: SeveranceInput): SeveranceResult | null {
  const daysWorked = daysBetween(input.joinDate, input.leaveDate);
  if (daysWorked < 1) return null;

  // 평균임금 = (3개월 임금 + 상여 3/12 + 연차수당 3/12) / 최근 3개월 일수(약 91.25일 기준)
  const periodDays = 91.25; // 3개월 평균 일수
  const bonusPortion = ((input.annualBonus ?? 0) * 3) / 12;
  const leavePortion = ((input.annualLeaveAllowance ?? 0) * 3) / 12;
  const totalPay = input.last3MonthsPay + bonusPortion + leavePortion;
  const avgDailyWage = totalPay / periodDays;

  const severance = avgDailyWage * 30 * (daysWorked / 365);

  return {
    daysWorked,
    avgDailyWage: Math.round(avgDailyWage),
    severance: Math.round(severance),
    years: daysWorked / 365,
  };
}

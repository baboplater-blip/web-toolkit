import { describe, it, expect } from 'vitest';
import { calcSalary, calcSeverance, daysBetween, RATES } from './payroll';

describe('daysBetween', () => {
  it('재직일수는 끝-시작+1 (당일 입퇴사=1일)', () => {
    expect(daysBetween('2020-01-01', '2020-01-01')).toBe(1);
  });
  it('윤년 연간 일수', () => {
    expect(daysBetween('2020-01-01', '2020-12-31')).toBe(366);
  });
  it('끝이 시작보다 앞서거나 무효 입력이면 0', () => {
    expect(daysBetween('2020-12-31', '2020-01-01')).toBe(0);
    expect(daysBetween('bad', '2020-01-01')).toBe(0);
    expect(daysBetween('2020-01-01', 'bad')).toBe(0);
  });
});

describe('calcSalary', () => {
  it('국민연금은 과세보수월액 4.5% (상·하한 클램프)', () => {
    // 연봉 6000만, 비과세 20만 → 과세 월급 480만, 4.5% = 216,000 (10원 절사)
    const r = calcSalary({ annualGross: 60_000_000, monthlyNonTax: 200_000, dependents: 1 });
    expect(r.nationalPension).toBe(216_000);
    expect(r.monthlyGross).toBe(5_000_000);
  });

  it('현재 동작 고정 — 6000만원 실수령액', () => {
    const r = calcSalary({ annualGross: 60_000_000, monthlyNonTax: 200_000, dependents: 1 });
    expect(r.netMonthly).toBe(4_201_390);
    expect(r.netAnnual).toBe(r.netMonthly * 12);
  });

  it('공제 합계 = 각 항목 합', () => {
    const r = calcSalary({ annualGross: 48_000_000, monthlyNonTax: 200_000, dependents: 2 });
    const sum =
      r.nationalPension + r.health + r.longTermCare + r.employment + r.incomeTax + r.localTax;
    expect(r.totalDeduction).toBe(sum);
    expect(r.netMonthly).toBe(r.monthlyGross - r.totalDeduction);
  });

  it('국민연금 기준소득월액 상한 클램프', () => {
    // 매우 높은 연봉이라도 연금 부과 기준은 상한(637만)으로 제한
    const r = calcSalary({ annualGross: 240_000_000, monthlyNonTax: 0, dependents: 1 });
    expect(r.nationalPension).toBe(Math.floor(RATES.pensionUpperBound * RATES.nationalPension / 10) * 10);
  });

  it('부양가족은 최소 1로 보정', () => {
    const a = calcSalary({ annualGross: 36_000_000, monthlyNonTax: 200_000, dependents: 0 });
    const b = calcSalary({ annualGross: 36_000_000, monthlyNonTax: 200_000, dependents: 1 });
    expect(a.netMonthly).toBe(b.netMonthly);
  });
});

describe('calcSeverance', () => {
  it('3년 재직 퇴직금 (현재 동작 고정)', () => {
    const r = calcSeverance({
      joinDate: '2020-01-01',
      leaveDate: '2023-01-01',
      last3MonthsPay: 9_000_000,
    })!;
    expect(r.daysWorked).toBe(1097);
    expect(r.avgDailyWage).toBe(98_630);
    expect(r.severance).toBe(8_892_926);
  });
  it('상여·연차수당 3/12 안분이 평균임금에 가산된다', () => {
    const base = calcSeverance({
      joinDate: '2022-01-01',
      leaveDate: '2023-01-01',
      last3MonthsPay: 9_000_000,
    })!;
    const withBonus = calcSeverance({
      joinDate: '2022-01-01',
      leaveDate: '2023-01-01',
      last3MonthsPay: 9_000_000,
      annualBonus: 12_000_000,
    })!;
    expect(withBonus.avgDailyWage).toBeGreaterThan(base.avgDailyWage);
  });
  it('무효 기간이면 null', () => {
    expect(
      calcSeverance({ joinDate: '2023-01-01', leaveDate: '2020-01-01', last3MonthsPay: 1 }),
    ).toBeNull();
  });
});

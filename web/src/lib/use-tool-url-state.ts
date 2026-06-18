'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 도구 입력/옵션을 URL 쿼리에 동기화하는 딥링크 훅.
 *
 * 설계 원칙(절대 위반 금지):
 * - **파일·이미지·바이너리·대용량 텍스트는 URL 에 담지 않는다.** 작은 스칼라
 *   값(문자열·숫자·enum)만 직렬화한다. 길이 상한(`MAX_VALUE_LENGTH`)을 넘는
 *   값은 URL 에 쓰지 않아 주소가 비대해지거나 민감 데이터가 새는 것을 막는다.
 * - **하이드레이션 안전**: 초기 렌더(SSR/프리렌더)는 항상 결정적 `defaults` 로
 *   그린다. URL 파라미터 읽기는 마운트 후 `useEffect` 에서만 수행하므로 서버
 *   출력과 첫 클라이언트 렌더가 일치한다(`location`/`URLSearchParams` 를 초기
 *   렌더 경로에서 절대 만지지 않는다).
 * - URL 갱신은 `history.replaceState` 로 쿼리 문자열만 바꾼다. 네비게이션·
 *   스크롤·history push 가 발생하지 않는다.
 *
 * @typeParam T  스칼라 값만 담는 평면 객체(문자열·숫자·불리언·enum).
 * @param defaults  SSR·초기 렌더에 쓰는 결정적 기본값.
 * @param opts.numericKeys  숫자로 역직렬화할 키 목록(URL 값은 항상 문자열이므로 명시).
 * @param opts.booleanKeys  불리언으로 역직렬화할 키 목록('1'/'true' → true).
 * @returns `[state, patch, hydrated]`
 *   - `state`   현재 값(초기엔 defaults, 마운트 후 URL 반영).
 *   - `patch`   부분 갱신 함수. 호출 시 state 와 URL 쿼리를 함께 갱신한다.
 *   - `hydrated` URL 읽기가 끝났는지 여부(초기 false → 마운트 후 true).
 */

/** 단일 쿼리 값의 최대 길이. 초과 시 직렬화하지 않는다(파일·대용량 방지). */
const MAX_VALUE_LENGTH = 512;

type Scalar = string | number | boolean;
type ScalarRecord = Record<string, Scalar>;

interface ToolUrlStateOptions<T> {
  /** 숫자로 복원할 키. */
  numericKeys?: ReadonlyArray<keyof T & string>;
  /** 불리언으로 복원할 키. */
  booleanKeys?: ReadonlyArray<keyof T & string>;
}

/** 값을 URL 에 실어도 안전한지 검사한다(짧은 스칼라만 허용). */
function isSerializable(value: Scalar): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  return value.length <= MAX_VALUE_LENGTH;
}

export function useToolUrlState<T extends ScalarRecord>(
  defaults: T,
  opts: ToolUrlStateOptions<T> = {},
): [T, (patch: Partial<T>) => void, boolean] {
  const [state, setState] = useState<T>(defaults);
  const [hydrated, setHydrated] = useState(false);

  // defaults·opts 를 effect/콜백에서 안정적으로 참조하기 위한 ref
  // (참조 동일성에 의존하지 않도록 최신 값을 보관).
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  const numericKeys = opts.numericKeys;
  const booleanKeys = opts.booleanKeys;

  // 마운트 후 1회: URL 쿼리를 읽어 defaults 위에 덮어쓴다.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const base = defaultsRef.current;
    const next: ScalarRecord = { ...base };

    for (const key of Object.keys(base)) {
      const raw = params.get(key);
      if (raw === null) continue;

      if (numericKeys?.includes(key)) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) next[key] = parsed;
      } else if (booleanKeys?.includes(key)) {
        next[key] = raw === '1' || raw === 'true';
      } else {
        // 과도하게 긴 값은 무시(파일·대용량 유입 방지).
        if (raw.length <= MAX_VALUE_LENGTH) next[key] = raw;
      }
    }

    setState(next as T);
    setHydrated(true);
    // 마운트 시 1회만 실행. numeric/boolean 키 목록은 렌더마다 새 배열이어도
    // 의미상 고정이므로 의존성에서 제외한다(린트 비활성 명시).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // state 를 갱신하고 URL 쿼리에 반영한다(history.replaceState — 네비게이션 없음).
  const patch = useCallback((partial: Partial<T>) => {
    setState((prev) => {
      const merged = { ...prev, ...partial } as T;

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const base = defaultsRef.current;

        for (const key of Object.keys(merged)) {
          const value = merged[key];
          // 기본값과 같거나 직렬화 불가하면 쿼리에서 제거(URL 을 깔끔하게 유지).
          if (value === base[key] || !isSerializable(value)) {
            params.delete(key);
          } else {
            params.set(key, String(value));
          }
        }

        const query = params.toString();
        const url = query
          ? `${window.location.pathname}?${query}${window.location.hash}`
          : `${window.location.pathname}${window.location.hash}`;
        window.history.replaceState(window.history.state, '', url);
      }

      return merged;
    });
  }, []);

  return [state, patch, hydrated];
}

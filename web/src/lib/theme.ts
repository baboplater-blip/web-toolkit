/**
 * 테마(다크/라이트/시스템) 설정 — localStorage 기반, 간단한 pub/sub.
 *
 * `<head>` 에 인라인 스크립트가 최초 페인트 직전에 같은 키(`acp:theme`)를 읽어
 * `<html>` 의 `dark` 클래스를 적용하므로 FOUC 없이 동작한다.
 */

export type ThemeMode = 'dark' | 'light' | 'system';

export const THEME_STORAGE_KEY = 'acp:theme';

type Listener = (theme: ThemeMode) => void;
const listeners = new Set<Listener>();

export function getStoredTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'system';
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function setTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {}
  applyTheme(mode);
  for (const l of listeners) l(mode);
}

export function subscribeTheme(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * 시스템 설정 변경 감지 — 모드가 'system' 일 때만 실제 클래스를 갱신한다.
 * 앱 시작 시 한 번 부르면 된다 (중복 바인딩 방지는 caller 책임).
 *
 * 반환값은 disposer — caller(effect 등)가 정리 시 호출해 리스너 누수를 막는다.
 * SSR 등으로 바인딩하지 않은 경우엔 no-op disposer 를 돌려준다.
 */
export function watchSystemTheme(): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (getStoredTheme() === 'system') applyTheme('system');
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

/**
 * `<head>` 에 inline 으로 주입할 스크립트 본문.
 * 외부 코드를 의존하지 않도록 모든 심볼을 로컬에 재선언한다.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var m=(s==='light'||s==='dark'||s==='system')?s:'system';var dark=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){document.documentElement.classList.add('dark');}})();`;

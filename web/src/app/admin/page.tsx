'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  GitCommit,
  ImageIcon,
  KeyRound,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  clearAdsConfigCache,
  loadAdsConfig,
  type AdSlotKey,
  type AdsConfig,
} from '@/lib/ads-config';
import { AD_SLOT_SIZES, processAdImage } from '@/lib/ads-image';
import { CwvStats } from '@/components/admin/CwvStats';
import { ErrorStats } from '@/components/admin/ErrorStats';
import { PopularToolsPanel } from '@/components/admin/PopularToolsPanel';

const ADMIN_KEY_ENV = process.env.NEXT_PUBLIC_ADMIN_KEY ?? '';
const REPO_ENV = process.env.NEXT_PUBLIC_GITHUB_REPO ?? 'baboplater-blip/web-toolkit';
const CONFIG_PATH = 'web/public/ads-config.json';
const TOKEN_STORAGE = 'webtoolkit/admin/gh-token';

const SLOT_LABELS: Record<AdSlotKey, string> = {
  top: '상단 가로 배너',
  sidebarLeft: '좌측 세로 배너',
  sidebarRight: '우측 세로 배너',
  inline: '도구 페이지 인라인 (본문 위)',
};

type SlotState = AdsConfig['slots'][AdSlotKey];

export default function AdminPage() {
  const [keyParam, setKeyParam] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [config, setConfig] = useState<AdsConfig | null>(null);
  const [token, setToken] = useState('');
  const [tokenVisible, setTokenVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdSlotKey | null>(null);

  useEffect(() => {
    const k = new URL(window.location.href).searchParams.get('key');
    setKeyParam(k);
    setAuthChecked(true);
    const t = localStorage.getItem(TOKEN_STORAGE);
    if (t) setToken(t);
  }, []);

  useEffect(() => {
    loadAdsConfig(true).then(setConfig);
  }, []);

  const authorized = authChecked && ADMIN_KEY_ENV.length > 0 && keyParam === ADMIN_KEY_ENV;

  const updateSlot = (key: AdSlotKey, patch: Partial<SlotState>) => {
    if (!config) return;
    setConfig({
      ...config,
      slots: { ...config.slots, [key]: { ...config.slots[key], ...patch } },
    });
  };

  const onImagePicked = async (key: AdSlotKey, file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    try {
      const processed = await processAdImage(file, key);
      updateSlot(key, {
        image: {
          src: processed.dataUrl,
          href: config?.slots[key].image?.href ?? '',
          alt: config?.slots[key].image?.alt ?? '',
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 변환 실패');
    }
  };

  const removeImage = (key: AdSlotKey) => {
    updateSlot(key, { image: null });
  };

  const persistToken = (value: string) => {
    setToken(value);
    if (value) localStorage.setItem(TOKEN_STORAGE, value);
    else localStorage.removeItem(TOKEN_STORAGE);
  };

  const saveToGithub = async () => {
    if (!config || !token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const next: AdsConfig = { ...config, updatedAt: new Date().toISOString() };
      const headers = {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      };
      const fetchSha = async (): Promise<string> => {
        const r = await fetch(
          `https://api.github.com/repos/${REPO_ENV}/contents/${CONFIG_PATH}?ref=master&t=${Date.now()}`,
          { headers, cache: 'no-store' },
        );
        if (!r.ok) throw new Error(`현재 파일 조회 실패 (${r.status})`);
        const data = (await r.json()) as { sha: string };
        return data.sha;
      };
      const tryPut = async (sha: string) => {
        return fetch(`https://api.github.com/repos/${REPO_ENV}/contents/${CONFIG_PATH}`, {
          method: 'PUT',
          headers,
          cache: 'no-store',
          body: JSON.stringify({
            message: `chore(ads): 광고 설정 업데이트 ${next.updatedAt}`,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2) + '\n'))),
            sha,
            branch: 'master',
          }),
        });
      };

      let sha = await fetchSha();
      let putRes = await tryPut(sha);
      // 409 = SHA mismatch (다른 push 가 끼었거나 캐시된 SHA). 한 번 재조회 후 재시도.
      if (putRes.status === 409) {
        sha = await fetchSha();
        putRes = await tryPut(sha);
      }
      if (!putRes.ok) {
        const txt = await putRes.text();
        throw new Error(`커밋 실패 (${putRes.status}): ${txt.slice(0, 200)}`);
      }
      setConfig(next);
      clearAdsConfigCache();
      setSuccess('커밋 완료. Vercel 자동 배포가 1~2분 안에 적용됩니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const reload = async () => {
    setError(null);
    setSuccess(null);
    clearAdsConfigCache();
    const fresh = await loadAdsConfig(true);
    setConfig(fresh);
  };

  if (!authChecked) return null;

  if (!authorized) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <div className="rounded-xl border bg-card p-6 max-w-sm w-full text-center space-y-3">
          <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="text-base font-semibold">접근 불가</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {ADMIN_KEY_ENV.length === 0
              ? 'NEXT_PUBLIC_ADMIN_KEY 환경변수가 설정되지 않았습니다. Vercel 대시보드에서 추가하세요.'
              : '잘못된 키입니다. URL ?key= 파라미터를 확인하세요.'}
          </p>
        </div>
      </div>
    );
  }

  const isDirty = !!config;

  return (
    <div className="min-h-dvh bg-background pb-32 md:pb-24">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[52px] max-w-3xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            <h1 className="text-base font-semibold">어드민</h1>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={reload}>
            <RefreshCw className="h-3.5 w-3.5" />
            새로고침
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4">
        <section id="pat-section" className="space-y-2 scroll-mt-20">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              GitHub Personal Access Token
            </span>
            {token ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-normal text-emerald-600 dark:text-emerald-400 normal-case">
                <CheckCircle2 className="h-3 w-3" />
                입력됨 (브라우저에 저장)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-normal text-amber-600 dark:text-amber-400 normal-case">
                <AlertTriangle className="h-3 w-3" />
                미입력
              </span>
            )}
          </h2>
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                type={tokenVisible ? 'text' : 'password'}
                value={token}
                onChange={(e) => persistToken(e.target.value)}
                placeholder="github_pat_... (Contents: Read+Write 권한)"
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTokenVisible((v) => !v)}
                title={tokenVisible ? '숨기기' : '보이기'}
              >
                {tokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1">
              <p>
                repo {REPO_ENV} 의 {CONFIG_PATH} 를 수정할 토큰. 이 브라우저의 localStorage 에만 저장 — 한 번 입력하면 다음부터 자동.
              </p>
              <p>
                토큰 없으면{' '}
                <a
                  href="https://github.com/settings/personal-access-tokens/new"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-primary"
                >
                  Fine-grained PAT 발급
                </a>{' '}
                → Repository access: <strong>Only select repositories → web-toolkit</strong> →
                Permissions → Contents: <strong>Read and write</strong> + Workflows: Read and write.
              </p>
              <p>
                <strong>Expiration: No expiration</strong> 선택하면 갱신 불필요 (잃어버리지 않게 보관).
              </p>
            </div>
          </div>
        </section>

        {config && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                광고 슬롯
              </h2>
              <span className="text-[10px] text-muted-foreground">
                마지막 수정: {new Date(config.updatedAt).toLocaleString()}
              </span>
            </div>
            <div className="space-y-3">
              {(Object.keys(SLOT_LABELS) as AdSlotKey[]).map((slot) => {
                const s = config.slots[slot];
                const isPreviewing = preview === slot;
                const hint =
                  slot === 'top'
                    ? '권장 970×90 (또는 728×90)'
                    : slot === 'inline'
                      ? '도구 페이지 본문 위 노출 — 권장 728×90 또는 970×250'
                      : '권장 160×600 (또는 300×600)';
                return (
                  <div key={slot} className="rounded-xl border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{SLOT_LABELS[slot]}</p>
                        <p className="text-[10px] text-muted-foreground">{hint}</p>
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={s.enabled}
                          onChange={(e) => updateSlot(slot, { enabled: e.target.checked })}
                          className="h-3.5 w-3.5"
                        />
                        활성
                      </label>
                    </div>

                    {/* 이미지 광고 영역 */}
                    <div className="rounded-lg border bg-background/40 p-2 space-y-2">
                      <p className="text-[10px] font-medium text-muted-foreground inline-flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        이미지 광고 (우선)
                      </p>
                      {s.image && s.image.src ? (
                        <>
                          <div className="relative rounded-md border bg-muted/40 overflow-hidden flex items-center justify-center max-h-40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.image.src}
                              alt={s.image.alt ?? '광고 미리보기'}
                              className="max-w-full max-h-40 object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(slot)}
                              className="absolute top-1 right-1 h-6 w-6 inline-flex items-center justify-center rounded-md bg-background/90 border hover:bg-destructive hover:text-destructive-foreground"
                              aria-label="이미지 제거"
                              title="이미지 제거"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              type="url"
                              value={s.image.href ?? ''}
                              onChange={(e) =>
                                updateSlot(slot, {
                                  image: { ...s.image!, href: e.target.value },
                                })
                              }
                              placeholder="클릭 URL (https://...)"
                              className="h-8 text-xs"
                            />
                            <Input
                              type="text"
                              value={s.image.alt ?? ''}
                              onChange={(e) =>
                                updateSlot(slot, {
                                  image: { ...s.image!, alt: e.target.value },
                                })
                              }
                              placeholder="대체 텍스트 (alt)"
                              className="h-8 text-xs"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            크기: 약 {Math.round(s.image.src.length * 0.75 / 1024)}KB
                          </p>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border/60 bg-background/60 p-4 cursor-pointer hover:bg-muted/40 transition-colors">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <p className="text-xs font-medium">이미지 업로드</p>
                          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                            PNG · JPG · WebP · GIF · SVG<br />
                            비율 유지 + WebP 자동 변환 (잘리지 않음).
                            슬롯 비율 {AD_SLOT_SIZES[slot].width}:{AD_SLOT_SIZES[slot].height} 과 다르면
                            슬롯 안에 fit 되어 빈 공간이 생길 수 있습니다.
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void onImagePicked(slot, f);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* HTML 광고 영역 (이미지 없을 때 대체) */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-muted-foreground">
                        또는 HTML 코드 (AdSense 등 — 이미지 없을 때만 사용)
                      </p>
                      <textarea
                        value={s.html}
                        onChange={(e) => updateSlot(slot, { html: e.target.value })}
                        placeholder={`<ins class="adsbygoogle" ...></ins> 등`}
                        rows={3}
                        className="w-full rounded-md border bg-background p-2 text-xs font-mono leading-relaxed resize-y"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPreview(isPreviewing ? null : slot)}
                        className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        {isPreviewing ? '미리보기 닫기' : '미리보기'}
                      </button>
                      <span className="text-[10px] text-muted-foreground">
                        {s.image?.src
                          ? '이미지 광고'
                          : s.html
                            ? `HTML ${s.html.length}자`
                            : '비어 있음 (placeholder)'}
                      </span>
                    </div>

                    {isPreviewing && (
                      <div className="rounded-lg border-2 border-dashed border-primary/40 bg-background p-2">
                        <p className="text-[10px] text-muted-foreground mb-1">
                          미리보기 (사이트의 광고 위치에 표시될 모습)
                        </p>
                        <div className="min-h-[60px] flex items-center justify-center text-xs overflow-hidden">
                          {s.image?.src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.image.src}
                              alt={s.image.alt ?? '광고'}
                              className="max-w-full max-h-40 object-contain"
                            />
                          ) : s.html ? (
                            <div
                              className="w-full"
                              dangerouslySetInnerHTML={{ __html: s.html }}
                            />
                          ) : (
                            <span className="text-muted-foreground">placeholder</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </section>
        )}

        {config && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              사이트 공지 배너
            </h2>
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={config.notice?.enabled ?? false}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      notice: {
                        message: '',
                        tone: 'info',
                        ...(config.notice ?? {}),
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                공지 배너 표시
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">메시지</label>
                  <textarea
                    value={config.notice?.message ?? ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        notice: {
                          enabled: config.notice?.enabled ?? false,
                          tone: config.notice?.tone ?? 'info',
                          ...config.notice,
                          message: e.target.value,
                        },
                      })
                    }
                    placeholder="예: 5/24~26 점검 안내. 이 기간 작업한 결과는 저장하지 마세요."
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs h-20"
                  />
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">색조</label>
                    <select
                      value={config.notice?.tone ?? 'info'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          notice: {
                            enabled: config.notice?.enabled ?? false,
                            message: config.notice?.message ?? '',
                            ...config.notice,
                            tone: e.target.value as 'info' | 'warning' | 'success',
                          },
                        })
                      }
                      className="w-full rounded-md border bg-background px-2 py-1 text-xs"
                    >
                      <option value="info">정보 (파랑)</option>
                      <option value="warning">경고 (노랑)</option>
                      <option value="success">완료 (초록)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">자세히 보기 링크 (선택)</label>
                    <input
                      value={config.notice?.href ?? ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          notice: {
                            enabled: config.notice?.enabled ?? false,
                            message: config.notice?.message ?? '',
                            tone: config.notice?.tone ?? 'info',
                            ...config.notice,
                            href: e.target.value,
                          },
                        })
                      }
                      placeholder="https://..."
                      className="w-full rounded-md border bg-background px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                사용자가 닫으면 같은 메시지는 다시 표시되지 않음. 메시지를 바꾸면 자동으로 다시 보임.
              </p>
            </div>
          </section>
        )}

        <Separator />

        <AdImpressionStats />

        <Separator />

        {/* ── 관측 대시보드: CWV · 에러 · 인기 도구 (전부 이 브라우저 로컬 데이터) ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-base font-semibold">관측 대시보드</h2>
          </div>
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-[11px] text-muted-foreground leading-relaxed inline-flex items-start gap-2">
            <Database className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
            <span>
              아래 세 패널(Core Web Vitals · JS 에러 · 인기 도구)은 모두{' '}
              <strong>내 브라우저의 localStorage 로컬 데이터</strong>입니다. 사이트는 어떤 데이터도
              서버로 전송·수집하지 않으므로, 다른 사용자의 측정·에러·사용량은 보이지 않습니다(어드민
              본인 기기 한정).
            </span>
          </div>

          <CwvStats />
          <ErrorStats />
          <PopularToolsPanel />
        </section>
      </main>

      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur md:left-16">
          <div className="mx-auto max-w-3xl px-4 py-3">
            {error && (
              <div className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive inline-flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="break-all">{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {success}
              </div>
            )}
            {token ? (
              <Button
                onClick={saveToGithub}
                disabled={saving}
                size="lg"
                className="w-full h-11 text-sm font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    GitHub 커밋 중...
                  </>
                ) : (
                  <>
                    <GitCommit className="h-4 w-4" />
                    변경사항 저장 (GitHub 커밋 → 1~2분 후 사이트 반영)
                  </>
                )}
              </Button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  document.getElementById('pat-section')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  })
                }
                className="w-full h-11 rounded-lg border-2 border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-amber-500/20"
              >
                <AlertTriangle className="h-4 w-4" />
                저장하려면 GitHub PAT 입력 필요 — 클릭하면 입력란으로 이동
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdImpressionStats() {
  const [impressions, setImpressions] = useState<Record<string, number>>({});
  const [clicks, setClicks] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const imp = localStorage.getItem('webtoolkit/ads/impressions');
      const clk = localStorage.getItem('webtoolkit/ads/clicks');
      // 마운트 후 localStorage 읽기(하이드레이션 안전). 의도된 1회 주입.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (imp) setImpressions(JSON.parse(imp));
      if (clk) setClicks(JSON.parse(clk));
    } catch {}
  }, []);

  const slots = ['top', 'sidebarLeft', 'sidebarRight', 'inline'] as const;
  const totalImp = slots.reduce((s, k) => s + (impressions[k] ?? 0), 0);
  const totalClk = slots.reduce((s, k) => s + (clicks[k] ?? 0), 0);

  function reset() {
    if (!confirm('이 브라우저의 광고 노출·클릭 카운트를 초기화할까요?')) return;
    localStorage.removeItem('webtoolkit/ads/impressions');
    localStorage.removeItem('webtoolkit/ads/clicks');
    setImpressions({});
    setClicks({});
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          광고 노출·클릭 통계 (이 브라우저)
        </h2>
        <Button variant="ghost" size="sm" onClick={reset}>초기화</Button>
      </div>
      <div className="rounded-xl border bg-card p-3 space-y-2">
        <p className="text-xs">
          총 노출 <span className="font-semibold tabular-nums">{totalImp.toLocaleString()}</span>
          {' · '}
          총 클릭 <span className="font-semibold tabular-nums">{totalClk.toLocaleString()}</span>
          {totalImp > 0 && (
            <>
              {' · '} CTR <span className="font-semibold">{((totalClk / totalImp) * 100).toFixed(2)}%</span>
            </>
          )}
        </p>
        <table className="w-full text-xs">
          <thead className="text-muted-foreground border-b">
            <tr>
              <th className="text-left px-2 py-1">슬롯</th>
              <th className="text-right px-2 py-1">노출</th>
              <th className="text-right px-2 py-1">클릭</th>
              <th className="text-right px-2 py-1">CTR</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((k) => {
              const imp = impressions[k] ?? 0;
              const clk = clicks[k] ?? 0;
              const ctr = imp > 0 ? (clk / imp) * 100 : 0;
              return (
                <tr key={k} className="border-b border-border/30 last:border-b-0">
                  <td className="px-2 py-1">{k}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{imp.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{clk.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{ctr.toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[10px] text-muted-foreground">
          서버 통계가 아닌 어드민 브라우저의 로컬 카운터입니다. 다른 사용자의 노출은 집계되지 않습니다.
        </p>
      </div>
    </section>
  );
}

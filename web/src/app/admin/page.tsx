'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
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
import { TOOLS, CATEGORY_LABELS } from '@/lib/tools/registry';
import { useUsageStats } from '@/lib/hooks/useUsage';
import {
  clearAdsConfigCache,
  loadAdsConfig,
  type AdSlotKey,
  type AdsConfig,
} from '@/lib/ads-config';
import { AD_SLOT_SIZES, processAdImage } from '@/lib/ads-image';

const ADMIN_KEY_ENV = process.env.NEXT_PUBLIC_ADMIN_KEY ?? '';
const REPO_ENV = process.env.NEXT_PUBLIC_GITHUB_REPO ?? 'baboplater-blip/web-toolkit';
const CONFIG_PATH = 'web/public/ads-config.json';
const TOKEN_STORAGE = 'webtoolkit/admin/gh-token';

const SLOT_LABELS: Record<AdSlotKey, string> = {
  top: '상단 가로 배너',
  sidebarLeft: '좌측 세로 배너',
  sidebarRight: '우측 세로 배너',
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
  const stats = useUsageStats();

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
      const getRes = await fetch(
        `https://api.github.com/repos/${REPO_ENV}/contents/${CONFIG_PATH}?ref=master`,
        { headers },
      );
      if (!getRes.ok) throw new Error(`현재 파일 조회 실패 (${getRes.status})`);
      const current = (await getRes.json()) as { sha: string };
      const body = {
        message: `chore(ads): 광고 설정 업데이트 ${next.updatedAt}`,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2) + '\n'))),
        sha: current.sha,
        branch: 'master',
      };
      const putRes = await fetch(
        `https://api.github.com/repos/${REPO_ENV}/contents/${CONFIG_PATH}`,
        { method: 'PUT', headers, body: JSON.stringify(body) },
      );
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

  const topTools = useMemo(() => {
    const map = new Map(TOOLS.map((t) => [t.id, t]));
    return Object.entries(stats)
      .map(([id, count]) => ({ tool: map.get(id), count }))
      .filter((e): e is { tool: (typeof TOOLS)[number]; count: number } => !!e.tool)
      .sort((a, b) => b.count - a.count);
  }, [stats]);
  const totalUsage = Object.values(stats).reduce((s, n) => s + n, 0);

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
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            GitHub Personal Access Token
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
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              repo {REPO_ENV} 의 {CONFIG_PATH} 를 수정할 수 있는 토큰. 토큰은 이 브라우저의 localStorage 에만 저장됩니다.
              <br />
              발급:{' '}
              <a
                href="https://github.com/settings/personal-access-tokens/new"
                target="_blank"
                rel="noreferrer"
                className="underline text-primary"
              >
                Fine-grained PAT
              </a>{' '}
              → Repository access: web-toolkit → Permissions → Contents: Read and write
            </p>
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
                  slot === 'top' ? '권장 970×90 (또는 728×90)' : '권장 160×600 (또는 300×600)';
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
                            자동으로 {AD_SLOT_SIZES[slot].width}×{AD_SLOT_SIZES[slot].height} WebP 로 변환 (중앙 crop)
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

        <Separator />

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              사이트 사용 통계 (이 브라우저)
            </h2>
            <span className="text-[11px] text-muted-foreground">총 {totalUsage}회</span>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">
              모든 처리가 클라이언트에서 일어나므로 사이트 전체 집계는 수집되지 않습니다. 이 통계는 어드민 본인이 자기 브라우저에서 사용한 도구 카운트입니다.
            </p>
            {topTools.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">사용 기록 없음</p>
            ) : (
              <ul className="space-y-1">
                {topTools.slice(0, 20).map(({ tool, count }) => (
                  <li
                    key={tool.id}
                    className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded hover:bg-muted"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <tool.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{tool.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {CATEGORY_LABELS[tool.category]}
                      </span>
                    </span>
                    <span className="text-xs font-semibold tabular-nums shrink-0">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
            <Button
              onClick={saveToGithub}
              disabled={saving || !token}
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
            {!token && (
              <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
                저장하려면 위에서 GitHub PAT 를 입력하세요.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

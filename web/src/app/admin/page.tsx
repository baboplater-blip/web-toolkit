'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  GitCommit,
  KeyRound,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldAlert,
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

  return (
    <div className="min-h-dvh bg-background pb-14 md:pb-0">
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
                return (
                  <div key={slot} className="rounded-xl border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{SLOT_LABELS[slot]}</p>
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
                    <textarea
                      value={s.html}
                      onChange={(e) => updateSlot(slot, { html: e.target.value })}
                      placeholder={`광고 네트워크 HTML (예: AdSense <ins class="adsbygoogle"> ...)\n비우면 placeholder 표시`}
                      rows={4}
                      className="w-full rounded-md border bg-background p-2 text-xs font-mono leading-relaxed resize-y"
                    />
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
                        {s.html ? `${s.html.length}자` : '비어 있음 (placeholder)'}
                      </span>
                    </div>
                    {isPreviewing && (
                      <div className="rounded-lg border-2 border-dashed border-primary/40 bg-background p-2">
                        <p className="text-[10px] text-muted-foreground mb-1">
                          미리보기 (실제 광고 네트워크 응답은 사이트 라이브에서 확인)
                        </p>
                        <div
                          className="min-h-[60px] flex items-center justify-center text-xs"
                          dangerouslySetInnerHTML={{
                            __html: s.html || '<span class="text-muted-foreground">placeholder</span>',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive inline-flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="break-all">{error}</span>
              </div>
            )}
            {success && (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {success}
              </div>
            )}

            <Button
              onClick={saveToGithub}
              disabled={saving || !token}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  GitHub 커밋 중...
                </>
              ) : (
                <>
                  <GitCommit className="h-4 w-4" />
                  GitHub 에 커밋 (Vercel 자동 배포)
                </>
              )}
            </Button>
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
    </div>
  );
}

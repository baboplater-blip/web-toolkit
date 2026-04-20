'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { BookmarkPlus, ChevronDown, Pencil, Plus, Sparkles, Trash2, X, Check, ThumbsUp, Download, Upload } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { getTemplateScore, hasPositiveFeedback, noteTemplatePicked } from '@/lib/template-feedback';
import type { Template } from '@/lib/supabase/types';

interface TemplateMenuProps {
  onSelect: (prompt: string) => void;
  agentId: string | null;
  currentInput?: string;
  /** 현재 선택된 하네스의 feature 태그 — 있으면 매칭 템플릿을 "추천" 표시. */
  harnessFeatures?: string[] | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  recommended: '🔥 추천',
  general: '범용',
  review: '리뷰·진단',
  ops: '운영·히스토리',
  writing: '집필',
  unity: 'Unity',
  '': '사용자 정의',
};

const CATEGORY_ORDER = ['recommended', 'general', 'review', 'ops', 'writing', 'unity', ''];

export function TemplateMenu({
  onSelect,
  agentId,
  currentInput,
  harnessFeatures,
}: TemplateMenuProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; prompt: string }>({
    name: '',
    prompt: '',
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseRef.current
      .from('templates')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) {
      toast('템플릿을 불러오지 못했습니다', { variant: 'error' });
    }
    setTemplates((data as Template[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) fetchTemplates();
  }, [open, fetchTemplates]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAddMode(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  /** 추천·카테고리 그룹핑: 하네스 feature 와 template.recommended_for 교집합 있는 것은 "recommended" 카테고리로 분리 */
  const grouped = useMemo(() => {
    const recommendedIds = new Set<string>();
    if (harnessFeatures && harnessFeatures.length > 0) {
      const featureSet = new Set(harnessFeatures);
      for (const t of templates) {
        if (t.recommended_for.some((f) => featureSet.has(f))) {
          recommendedIds.add(t.id);
        }
      }
    }

    const buckets = new Map<string, Template[]>();
    for (const t of templates) {
      const bucket = recommendedIds.has(t.id) ? 'recommended' : (t.category || '');
      const list = buckets.get(bucket) ?? [];
      list.push(t);
      buckets.set(bucket, list);
    }
    // 각 버킷 내부를 (👍 가중) 점수 내림차순으로 보정. 동점은 원래 순서 유지.
    for (const list of buckets.values()) {
      list.sort((a, b) => getTemplateScore(b.id) - getTemplateScore(a.id));
    }
    return CATEGORY_ORDER
      .filter((k) => buckets.has(k))
      .map((k) => ({ key: k, label: CATEGORY_LABELS[k] ?? k, items: buckets.get(k)! }));
  }, [templates, harnessFeatures]);

  /**
   * 프롬프트에 {{변수}} 가 있으면 모달로 값을 받아 치환 후 onSelect.
   * 없으면 기존대로 바로 onSelect.
   * 같은 이름의 변수는 중복 제거해 한 번만 입력받는다.
   */
  const [varPrompt, setVarPrompt] = useState<string | null>(null);
  const [varNames, setVarNames] = useState<string[]>([]);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [varTemplateId, setVarTemplateId] = useState<string | null>(null);

  const handleSelect = (prompt: string, templateId?: string) => {
    const matches = Array.from(prompt.matchAll(/\{\{\s*([a-zA-Z0-9_\-가-힣]+)\s*\}\}/g));
    const names = Array.from(new Set(matches.map((m) => m[1])));
    if (names.length === 0) {
      if (templateId) noteTemplatePicked(templateId);
      onSelect(prompt);
      setOpen(false);
      return;
    }
    setVarPrompt(prompt);
    setVarNames(names);
    setVarValues(Object.fromEntries(names.map((n) => [n, ''])));
    setVarTemplateId(templateId ?? null);
  };

  const applyVariables = () => {
    if (!varPrompt) return;
    let out = varPrompt;
    for (const n of varNames) {
      const val = (varValues[n] ?? '').trim();
      out = out.replace(
        new RegExp(`\\{\\{\\s*${n.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*\\}\\}`, 'g'),
        val,
      );
    }
    if (varTemplateId) noteTemplatePicked(varTemplateId);
    onSelect(out);
    setVarPrompt(null);
    setVarNames([]);
    setVarValues({});
    setVarTemplateId(null);
    setOpen(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const mine = templates.filter((t) => !t.is_system);
    if (mine.length === 0) {
      toast('내보낼 개인 템플릿이 없습니다', { variant: 'warning' });
      return;
    }
    const payload = {
      exported_at: new Date().toISOString(),
      version: 1,
      templates: mine.map((t) => ({
        name: t.name,
        prompt: t.prompt,
        category: t.category,
        icon: t.icon,
        description: t.description,
        recommended_for: t.recommended_for,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `acp-templates-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(`${mine.length}개 템플릿을 내보냈습니다`, { variant: 'success' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list: unknown[] | null = Array.isArray(parsed?.templates)
        ? (parsed.templates as unknown[])
        : null;
      if (!list) {
        toast('형식이 올바르지 않습니다 (templates 배열 필요)', { variant: 'error' });
        return;
      }
      const {
        data: { user },
      } = await supabaseRef.current.auth.getUser();
      if (!user) {
        toast('로그인이 필요합니다', { variant: 'warning' });
        return;
      }
      const rows = list
        .filter(
          (t: unknown): t is { name: string; prompt: string; category?: string; icon?: string; description?: string; recommended_for?: string[] } =>
            typeof t === 'object' &&
            t !== null &&
            typeof (t as { name?: unknown }).name === 'string' &&
            typeof (t as { prompt?: unknown }).prompt === 'string',
        )
        .slice(0, 200)
        .map((t) => ({
          name: String(t.name).slice(0, 60),
          prompt: String(t.prompt).slice(0, 20_000),
          category: typeof t.category === 'string' ? t.category.slice(0, 40) : '',
          icon: typeof t.icon === 'string' ? t.icon.slice(0, 8) : null,
          description: typeof t.description === 'string' ? t.description.slice(0, 200) : null,
          recommended_for: Array.isArray(t.recommended_for)
            ? t.recommended_for.filter((x: unknown) => typeof x === 'string').slice(0, 20)
            : [],
          sort_order: 9999,
          user_id: user.id,
          is_system: false,
        }));
      if (rows.length === 0) {
        toast('가져올 템플릿이 없습니다', { variant: 'warning' });
        return;
      }
      const { error } = await supabaseRef.current.from('templates').insert(rows);
      if (error) {
        toast(`가져오기 실패: ${error.message}`, { variant: 'error' });
        return;
      }
      toast(`${rows.length}개 템플릿을 가져왔습니다`, { variant: 'success' });
      fetchTemplates();
    } catch (err) {
      toast(`가져오기 실패: ${err instanceof Error ? err.message : String(err)}`, {
        variant: 'error',
      });
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    const prompt = currentInput?.trim();
    if (!name || !prompt) return;

    const {
      data: { user },
    } = await supabaseRef.current.auth.getUser();
    if (!user) return;

    const { error } = await supabaseRef.current.from('templates').insert({
      name,
      prompt,
      category: '',
      sort_order: 9999,
      user_id: user.id,
      is_system: false,
    });
    if (error) {
      toast(`템플릿 저장 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    setNewName('');
    setAddMode(false);
    fetchTemplates();
  };

  const handleDelete = async (t: Template) => {
    if (t.is_system) {
      toast('시스템 템플릿은 삭제할 수 없습니다.', { variant: 'warning' });
      return;
    }
    const { error } = await supabaseRef.current.from('templates').delete().eq('id', t.id);
    if (error) {
      toast(`삭제 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    setTemplates((prev) => prev.filter((x) => x.id !== t.id));
  };

  const startEdit = (t: Template) => {
    if (t.is_system) {
      toast('시스템 템플릿은 편집할 수 없습니다.', { variant: 'warning' });
      return;
    }
    setEditingId(t.id);
    setEditDraft({ name: t.name, prompt: t.prompt });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ name: '', prompt: '' });
  };

  const commitEdit = async () => {
    if (!editingId) return;
    const name = editDraft.name.trim().slice(0, 60);
    const prompt = editDraft.prompt.trim();
    if (!name || !prompt) {
      toast('이름과 본문을 모두 입력하세요', { variant: 'warning' });
      return;
    }
    const { error } = await supabaseRef.current
      .from('templates')
      .update({ name, prompt })
      .eq('id', editingId);
    if (error) {
      toast(`저장 실패: ${error.message}`, { variant: 'error' });
      return;
    }
    setTemplates((prev) =>
      prev.map((t) => (t.id === editingId ? { ...t, name, prompt } : t)),
    );
    cancelEdit();
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setAddMode(false);
      setNewName('');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-muted-foreground gap-1"
        onClick={() => setOpen((prev) => !prev)}
        disabled={!agentId}
      >
        <BookmarkPlus className="h-3.5 w-3.5" />
        템플릿
        <ChevronDown className="h-3 w-3" />
      </Button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-80 rounded-lg border bg-popover p-1 shadow-lg z-50">
          {loading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">불러오는 중...</p>
          ) : templates.length === 0 && !addMode ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              저장된 템플릿이 없습니다
            </p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              {grouped.map((group, i) => (
                <div key={group.key}>
                  {i > 0 && <Separator className="my-1" />}
                  <p className="px-3 py-1 text-[10px] font-medium uppercase text-muted-foreground tracking-wider">
                    {group.label}
                  </p>
                  {group.items.map((t) => {
                    const editing = editingId === t.id;
                    if (editing) {
                      return (
                        <div
                          key={t.id}
                          className="rounded-md border bg-accent/30 p-1.5 space-y-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            value={editDraft.name}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, name: e.target.value }))
                            }
                            placeholder="이름"
                            className="h-6 text-xs"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <textarea
                            value={editDraft.prompt}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, prompt: e.target.value }))
                            }
                            placeholder="프롬프트"
                            className="w-full resize-none rounded border bg-background px-2 py-1 text-xs font-mono min-h-[4rem]"
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') cancelEdit();
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                commitEdit();
                              }
                            }}
                          />
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={cancelEdit}
                            >
                              <X className="h-3 w-3 mr-0.5" />
                              취소
                            </Button>
                            <Button
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={commitEdit}
                              disabled={!editDraft.name.trim() || !editDraft.prompt.trim()}
                            >
                              <Check className="h-3 w-3 mr-0.5" />
                              저장
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={t.id}
                        className="group flex items-start gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                        onClick={() => handleSelect(t.prompt, t.id)}
                      >
                        {t.icon && (
                          <span className="shrink-0 text-base leading-none pt-0.5">{t.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="truncate" title={t.prompt}>
                              {t.name}
                            </span>
                            {group.key === 'recommended' && (
                              <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                            )}
                            {hasPositiveFeedback(t.id) && (
                              <ThumbsUp
                                className="h-3 w-3 text-emerald-400 fill-current shrink-0"
                                aria-label="전에 👍 받은 템플릿"
                              />
                            )}
                          </div>
                          {t.description && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {t.description}
                            </p>
                          )}
                        </div>
                        {!t.is_system && (
                          <div className="flex shrink-0 opacity-0 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(t);
                              }}
                              title="템플릿 편집"
                              aria-label="템플릿 편집"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(t);
                              }}
                              title="템플릿 삭제"
                              aria-label="템플릿 삭제"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <Separator className="my-1" />

          {addMode ? (
            <div className="flex gap-1 p-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleAddKeyDown}
                placeholder="템플릿 이름"
                className="h-7 text-xs"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleAdd}
                disabled={!newName.trim() || !currentInput?.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => {
                  setAddMode(false);
                  setNewName('');
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-7 text-xs text-muted-foreground"
              onClick={() => setAddMode(true)}
              disabled={!currentInput?.trim()}
              title={
                !currentInput?.trim()
                  ? '입력란에 내용을 먼저 입력하세요'
                  : '현재 입력을 내 템플릿으로 저장'
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              현재 입력을 내 템플릿으로 저장
            </Button>
          )}

          {/* export/import — 개인 템플릿만 대상 */}
          <div className="flex gap-1 px-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-[11px] text-muted-foreground"
              onClick={handleExport}
              title="내 템플릿을 JSON 으로 내려받기"
            >
              <Download className="h-3 w-3 mr-1" />
              내보내기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-[11px] text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
              title="JSON 파일로 템플릿 가져오기"
            >
              <Upload className="h-3 w-3 mr-1" />
              가져오기
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleImport}
            />
          </div>
        </div>
      )}

      {/* 템플릿 변수 입력 모달 — {{name}} 패턴이 있는 템플릿 선택 시 노출. */}
      {varPrompt && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setVarPrompt(null);
              setVarNames([]);
              setVarValues({});
            }
          }}
        >
          <div className="w-full max-w-sm rounded-xl border bg-background p-4 shadow-xl">
            <h3 className="text-sm font-semibold">템플릿 변수 입력</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              비워두면 해당 위치가 빈 값으로 치환됩니다.
            </p>
            <div className="mt-3 space-y-2">
              {varNames.map((n) => (
                <div key={n}>
                  <label className="text-[11px] text-muted-foreground font-mono">
                    {'{{' + n + '}}'}
                  </label>
                  <Input
                    autoFocus={n === varNames[0]}
                    value={varValues[n] ?? ''}
                    onChange={(e) =>
                      setVarValues((prev) => ({ ...prev, [n]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        applyVariables();
                      }
                    }}
                    className="h-8 text-sm mt-0.5"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setVarPrompt(null);
                  setVarNames([]);
                  setVarValues({});
                }}
              >
                취소
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={applyVariables}>
                치환 후 입력창에 삽입
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

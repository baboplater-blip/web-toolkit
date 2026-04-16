'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { BookmarkPlus, ChevronDown, Plus, Trash2, X } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  prompt: string;
  category: string;
  sort_order: number;
  created_at: string;
}

interface TemplateMenuProps {
  onSelect: (prompt: string) => void;
  agentId: string | null;
  currentInput?: string;
}

export function TemplateMenu({ onSelect, agentId, currentInput }: TemplateMenuProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('templates')
      .select('*')
      .order('sort_order')
      .order('created_at', { ascending: false });
    if (data) setTemplates(data as Template[]);
    setLoading(false);
  }, []);

  // 메뉴 열릴 때 템플릿 로드
  useEffect(() => {
    if (open) fetchTemplates();
  }, [open, fetchTemplates]);

  // 외부 클릭 시 닫기
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

  const handleSelect = (prompt: string) => {
    onSelect(prompt);
    setOpen(false);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    const prompt = currentInput?.trim();
    if (!name || !prompt) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('templates').insert({
      name,
      prompt,
      category: '',
      sort_order: templates.length,
      user_id: user.id,
    } as never);

    setNewName('');
    setAddMode(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('templates').delete().eq('id', id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
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
        <div className="absolute bottom-full left-0 mb-1 w-72 rounded-lg border bg-popover p-1 shadow-lg z-50">
          {loading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">불러오는 중...</p>
          ) : templates.length === 0 && !addMode ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              저장된 템플릿이 없습니다
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                  onClick={() => handleSelect(t.prompt)}
                >
                  <span className="flex-1 truncate" title={t.prompt}>
                    {t.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
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
                onClick={() => { setAddMode(false); setNewName(''); }}
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
              title={!currentInput?.trim() ? '입력란에 내용을 먼저 입력하세요' : '현재 입력 내용을 템플릿으로 저장'}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              현재 입력을 템플릿으로 저장
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

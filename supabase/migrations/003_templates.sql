-- templates: 명령어 즐겨찾기/템플릿
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  category TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_templates_sort_order ON templates(sort_order);

-- RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_access_templates" ON templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_access_templates" ON templates
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Group Learning: paths, path items, and standalone resources

CREATE TABLE IF NOT EXISTS learning_paths (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_starred  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_path_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id     UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('course', 'video', 'tutorial')),
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT,
  added_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE learning_paths       ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources   ENABLE ROW LEVEL SECURITY;

-- learning_paths
CREATE POLICY "lp_select"  ON learning_paths FOR SELECT TO authenticated USING (true);
CREATE POLICY "lp_insert"  ON learning_paths FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "lp_delete"  ON learning_paths FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "lp_update"  ON learning_paths FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- learning_path_items (ownership checked in server actions)
CREATE POLICY "lpi_select" ON learning_path_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "lpi_insert" ON learning_path_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lpi_delete" ON learning_path_items FOR DELETE TO authenticated USING (true);

-- learning_resources
CREATE POLICY "lr_select"  ON learning_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "lr_insert"  ON learning_resources FOR INSERT TO authenticated WITH CHECK (added_by = auth.uid());
CREATE POLICY "lr_delete"  ON learning_resources FOR DELETE TO authenticated
  USING (added_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

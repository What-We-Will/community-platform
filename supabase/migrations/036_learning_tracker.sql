-- Personal learning tracker

CREATE TABLE IF NOT EXISTS personal_learning_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id  UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'want_to_take'
               CHECK (status IN ('want_to_take', 'in_progress', 'completed')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

ALTER TABLE personal_learning_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pli_select" ON personal_learning_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "pli_insert" ON personal_learning_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "pli_update" ON personal_learning_items FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "pli_delete" ON personal_learning_items FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Study groups for learning resources

CREATE TABLE IF NOT EXISTS learning_study_groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id  UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  created_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE learning_study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lsg_select" ON learning_study_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "lsg_insert" ON learning_study_groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "lsg_delete" ON learning_study_groups FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Study group members

CREATE TABLE IF NOT EXISTS learning_study_group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES learning_study_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE learning_study_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lsgm_select" ON learning_study_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "lsgm_insert" ON learning_study_group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "lsgm_delete" ON learning_study_group_members FOR DELETE TO authenticated USING (user_id = auth.uid());

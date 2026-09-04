-- Make chat and notifications user-assignable

ALTER TABLE public.team_messages
  ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.site_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_task boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS due_date date;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.site_projects(id) ON DELETE SET NULL;

-- Backfill sender_id from auth context where possible (no-op for historical rows)
-- Keep existing policies; add recipient-scoped read policies for team_messages
DROP POLICY IF EXISTS "Recipients and workspace read team_messages" ON public.team_messages;
CREATE POLICY "Recipients and workspace read team_messages"
  ON public.team_messages
  FOR SELECT
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      recipient_id IS NULL
      OR recipient_id = auth.uid()
      OR sender_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "Approved members create team_messages" ON public.team_messages;
CREATE POLICY "Approved members create team_messages"
  ON public.team_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (is_approved(auth.uid()));

DROP POLICY IF EXISTS "Approved members update team_messages" ON public.team_messages;
CREATE POLICY "Approved members update team_messages"
  ON public.team_messages
  FOR UPDATE
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      sender_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
  WITH CHECK (is_approved(auth.uid()));

DROP POLICY IF EXISTS "Approved members delete team_messages" ON public.team_messages;
CREATE POLICY "Approved members delete team_messages"
  ON public.team_messages
  FOR DELETE
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      sender_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Recipient-scoped read policy for notifications
DROP POLICY IF EXISTS "Recipients and workspace read notifications" ON public.notifications;
CREATE POLICY "Recipients and workspace read notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      recipient_id IS NULL
      OR recipient_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "Approved members create notifications" ON public.notifications;
CREATE POLICY "Approved members create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (is_approved(auth.uid()));

DROP POLICY IF EXISTS "Approved members update notifications" ON public.notifications;
CREATE POLICY "Approved members update notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      sender_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
  WITH CHECK (is_approved(auth.uid()));

DROP POLICY IF EXISTS "Approved members delete notifications" ON public.notifications;
CREATE POLICY "Approved members delete notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (
    is_approved(auth.uid())
    AND (
      sender_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Index for fast recipient lookups
CREATE INDEX IF NOT EXISTS idx_team_messages_recipient ON public.team_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_project ON public.team_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON public.notifications(project_id);

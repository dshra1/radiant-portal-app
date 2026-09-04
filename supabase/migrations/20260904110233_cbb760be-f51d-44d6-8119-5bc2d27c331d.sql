ALTER TABLE public.team_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Open',
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0;
ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS target_handover_date date,
  ADD COLUMN IF NOT EXISTS working_days_per_week integer NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS slab_cycle_days integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS finishing_days_per_floor integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS procurement_lead_days integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS concrete_grade text NOT NULL DEFAULT 'M25',
  ADD COLUMN IF NOT EXISTS steel_ratio_kg_per_sft numeric NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS cement_bags_per_sft numeric NOT NULL DEFAULT 0.4,
  ADD COLUMN IF NOT EXISTS blockwork_type text NOT NULL DEFAULT 'AAC Blocks',
  ADD COLUMN IF NOT EXISTS finishing_spec text NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS contract_type text NOT NULL DEFAULT 'Item Rate',
  ADD COLUMN IF NOT EXISTS workflow_template text NOT NULL DEFAULT 'Standard RCC Framed';
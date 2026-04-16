-- V7 SUPREME — moksha_cross_promos
-- Tracking cross-promotion depuis autres apps Purama (coupon WELCOME50)
-- 2026-04-16

CREATE TABLE IF NOT EXISTS moksha.moksha_cross_promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_app text NOT NULL,
  target_app text NOT NULL DEFAULT 'moksha',
  user_id uuid REFERENCES moksha.moksha_profiles(id) ON DELETE SET NULL,
  ip_hash text,
  coupon_used text,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  signed_up_at timestamptz,
  converted boolean NOT NULL DEFAULT false,
  converted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_moksha_cross_promos_user_id ON moksha.moksha_cross_promos(user_id);
CREATE INDEX IF NOT EXISTS idx_moksha_cross_promos_source_app ON moksha.moksha_cross_promos(source_app);
CREATE INDEX IF NOT EXISTS idx_moksha_cross_promos_clicked_at ON moksha.moksha_cross_promos(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_moksha_cross_promos_ip_hash ON moksha.moksha_cross_promos(ip_hash) WHERE ip_hash IS NOT NULL;

ALTER TABLE moksha.moksha_cross_promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cross_promos_select_own" ON moksha.moksha_cross_promos;
CREATE POLICY "cross_promos_select_own"
  ON moksha.moksha_cross_promos FOR SELECT
  USING (auth.uid() = user_id);

-- service_role bypasse RLS, pas besoin de policy explicite pour insert/update
GRANT SELECT ON moksha.moksha_cross_promos TO authenticated;
GRANT ALL ON moksha.moksha_cross_promos TO service_role;

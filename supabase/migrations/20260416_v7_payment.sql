-- V7 Wave 2 — Payment layer (CLAUDE.md §11, §17)
-- Run: PGPASSWORD=... psql -h 72.62.191.111 -p 5432 -U postgres -d postgres -f this.sql

SET search_path TO moksha, public;

-- 1. Flag subscription_started_at sur profiles
ALTER TABLE moksha.moksha_profiles
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz;

-- 2. Table subscriptions (source de vérité abo)
CREATE TABLE IF NOT EXISTS moksha.moksha_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'active',
  plan text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_moksha_sub_user ON moksha.moksha_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_moksha_sub_stripe ON moksha.moksha_subscriptions(stripe_subscription_id);
ALTER TABLE moksha.moksha_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS moksha_sub_self ON moksha.moksha_subscriptions;
CREATE POLICY moksha_sub_self ON moksha.moksha_subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- 3. Table retractions (art. L221-28 waiver + remboursement <30j)
CREATE TABLE IF NOT EXISTS moksha.moksha_retractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  amount_refunded numeric(10,2),
  prime_deducted numeric(10,2) DEFAULT 0,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  reason text
);
ALTER TABLE moksha.moksha_retractions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS moksha_retract_self ON moksha.moksha_retractions;
CREATE POLICY moksha_retract_self ON moksha.moksha_retractions
  FOR SELECT USING (user_id = auth.uid());

-- 4. Notifications fiscales (§17 — 4 paliers)
CREATE TABLE IF NOT EXISTS moksha.moksha_fiscal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  palier integer NOT NULL CHECK (palier IN (1500, 2500, 3000, 0)),
  sent_at timestamptz NOT NULL DEFAULT now(),
  email_sent boolean NOT NULL DEFAULT false,
  push_sent boolean NOT NULL DEFAULT false,
  acknowledged boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, palier)
);
ALTER TABLE moksha.moksha_fiscal_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS moksha_fiscal_notif_self ON moksha.moksha_fiscal_notifications;
CREATE POLICY moksha_fiscal_notif_self ON moksha.moksha_fiscal_notifications
  FOR SELECT USING (user_id = auth.uid());

-- 5. Récapitulatif annuel (§17 — PDF jsPDF généré 1er janvier)
CREATE TABLE IF NOT EXISTS moksha.moksha_annual_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  total_primes numeric(10,2) DEFAULT 0,
  total_parrainage numeric(10,2) DEFAULT 0,
  total_nature numeric(10,2) DEFAULT 0,
  total_marketplace numeric(10,2) DEFAULT 0,
  total_missions numeric(10,2) DEFAULT 0,
  total_annuel numeric(10,2) DEFAULT 0,
  pdf_url text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, year)
);
ALTER TABLE moksha.moksha_annual_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS moksha_annual_self ON moksha.moksha_annual_summaries;
CREATE POLICY moksha_annual_self ON moksha.moksha_annual_summaries
  FOR SELECT USING (user_id = auth.uid());

-- 6. Wave 5 preview — parrainage V4 3 niveaux (backfill level=1 existants)
ALTER TABLE moksha.moksha_referrals
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS monthly_commission numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_earned numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Grants
GRANT ALL ON moksha.moksha_subscriptions TO authenticated, service_role;
GRANT ALL ON moksha.moksha_retractions TO authenticated, service_role;
GRANT ALL ON moksha.moksha_fiscal_notifications TO authenticated, service_role;
GRANT ALL ON moksha.moksha_annual_summaries TO authenticated, service_role;

-- V7 Wave 4+5 — Phase 1 waitlist + fiscal banner dismiss + referrals N2/N3
-- 2026-04-16

-- 1) Card waitlist (Phase 1 CardTeaser)
CREATE TABLE IF NOT EXISTS moksha.moksha_card_waitlist (
  user_id uuid PRIMARY KEY REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE moksha.moksha_card_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_waitlist_read" ON moksha.moksha_card_waitlist;
CREATE POLICY "own_waitlist_read" ON moksha.moksha_card_waitlist
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_waitlist_insert" ON moksha.moksha_card_waitlist;
CREATE POLICY "own_waitlist_insert" ON moksha.moksha_card_waitlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public count of waitlist is allowed (aggregate only, no user data leak)
DROP POLICY IF EXISTS "public_waitlist_count" ON moksha.moksha_card_waitlist;
CREATE POLICY "public_waitlist_count" ON moksha.moksha_card_waitlist
  FOR SELECT TO anon USING (false);
-- (count queries via head:true use service_role / authenticated; anon not needed)

-- 2) Fiscal acknowledgment flag on banner (the field already exists on fiscal_notifications.acknowledged)
-- Ensure index for fast lookup
CREATE INDEX IF NOT EXISTS idx_fiscal_notif_user_palier
  ON moksha.moksha_fiscal_notifications(user_id, palier, acknowledged);

-- 3) Referrals index for N2/N3 lookup performance (profiles.referred_by already indexed)
CREATE INDEX IF NOT EXISTS idx_moksha_referrals_level_referrer
  ON moksha.moksha_referrals(referrer_id, level);

GRANT SELECT, INSERT, UPDATE ON moksha.moksha_card_waitlist TO authenticated, service_role;

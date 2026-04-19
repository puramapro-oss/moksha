-- MOKSHA V4 — STRIPE_CONNECT_KARMA — 12 tables + bridges
-- Source of truth: ~/purama/STRIPE_CONNECT_KARMA_V4.md (2026-04-19)
-- Dual circuit strict: SASU finance primes, Asso finance bourses (JAMAIS mélange).

-- ========== 1) CONNECT ACCOUNTS (Stripe Connect Express + Embedded) ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_connect_accounts (
  user_id UUID PRIMARY KEY REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  charges_enabled BOOLEAN DEFAULT false,
  kyc_verified_at TIMESTAMPTZ,
  country TEXT DEFAULT 'FR',
  email TEXT,
  details_submitted BOOLEAN DEFAULT false,
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moksha_connect_stripe ON moksha.moksha_connect_accounts (stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_moksha_connect_payouts ON moksha.moksha_connect_accounts (payouts_enabled) WHERE payouts_enabled = true;

-- ========== 2) USER WALLETS (matérialisation solde EUR) ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_user_wallets (
  user_id UUID PRIMARY KEY REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  balance_eur NUMERIC(10,2) DEFAULT 0 CHECK (balance_eur >= 0),
  lifetime_earned_eur NUMERIC(10,2) DEFAULT 0,
  yearly_earned_eur NUMERIC(10,2) DEFAULT 0,
  yearly_reset_date DATE DEFAULT date_trunc('year', NOW())::date,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moksha_user_wallets_balance ON moksha.moksha_user_wallets (balance_eur) WHERE balance_eur > 0;

-- ========== 3) WALLET TRANSACTIONS — extension V4 sur table existante ==========
-- Ajoute colonnes V4 sans casser l'existant.
ALTER TABLE moksha.moksha_wallet_transactions
  ADD COLUMN IF NOT EXISTS direction TEXT CHECK (direction IN ('credit','debit')),
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_id UUID,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;
-- Extension CHECK types pour accepter V4 sources (drop + recreate)
ALTER TABLE moksha.moksha_wallet_transactions DROP CONSTRAINT IF EXISTS moksha_wallet_transactions_type_check;
ALTER TABLE moksha.moksha_wallet_transactions ADD CONSTRAINT moksha_wallet_transactions_type_check
  CHECK (type IN (
    'commission','bonus','retrait','concours',
    'prime_palier_1','prime_palier_2','prime_palier_3',
    'bourse_inclusion','karma_prize_week','karma_prize_month','karma_prize_jackpot',
    'referral_n1','referral_n2','referral_n3','ambassadeur_tier',
    'cpa_payout','refund','adjustment'
  ));
CREATE INDEX IF NOT EXISTS idx_moksha_wallet_tx_source ON moksha.moksha_wallet_transactions (source, source_id);
CREATE INDEX IF NOT EXISTS idx_moksha_wallet_tx_direction ON moksha.moksha_wallet_transactions (direction, created_at DESC);

-- ========== 4) PRIMES V4 (par app, alignées paiements abo) ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_primes_v4 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL DEFAULT 'moksha',
  palier_actuel INT DEFAULT 0 CHECK (palier_actuel BETWEEN 0 AND 3),
  montant_verse_eur NUMERIC(10,2) DEFAULT 0,
  montant_total_eur NUMERIC(10,2) DEFAULT 100,
  prime_mode TEXT DEFAULT 'phase1' CHECK (prime_mode IN ('phase1','phase2')),
  subscription_payment_check_1 BOOLEAN DEFAULT false,
  subscription_payment_check_2 BOOLEAN DEFAULT false,
  subscription_payment_check_3 BOOLEAN DEFAULT false,
  palier_suspended BOOLEAN DEFAULT false,
  palier_1_date TIMESTAMPTZ,
  palier_2_date TIMESTAMPTZ,
  palier_3_date TIMESTAMPTZ,
  palier_1_transfer_id TEXT,
  palier_2_transfer_id TEXT,
  palier_3_transfer_id TEXT,
  recuperee BOOLEAN DEFAULT false,
  recuperee_at TIMESTAMPTZ,
  cpa_financing_source TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);
CREATE INDEX IF NOT EXISTS idx_moksha_primes_user_app ON moksha.moksha_primes_v4 (user_id, app_id);
CREATE INDEX IF NOT EXISTS idx_moksha_primes_palier ON moksha.moksha_primes_v4 (palier_actuel) WHERE palier_actuel < 3;

-- ========== 5) BOURSES INCLUSION (Asso — 1× par user, dual circuit) ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_bourses_inclusion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  profil_social TEXT[] NOT NULL DEFAULT '{}', -- CAF, rural, jeune, senior, demandeur_emploi, etudiant, handicap
  montant_eur NUMERIC(10,2) DEFAULT 0 CHECK (montant_eur BETWEEN 0 AND 200),
  missions_completees INT DEFAULT 0,
  missions_requises INT DEFAULT 5,
  versee BOOLEAN DEFAULT false,
  versee_at TIMESTAMPTZ,
  stripe_transfer_id TEXT,
  financement_source TEXT NOT NULL CHECK (financement_source IN (
    'subvention_afnic','subvention_fdj','subvention_fdf','subvention_orange',
    'subvention_cetelem','subvention_fdva','subvention_anct','subvention_fse',
    'subvention_bpifrance','subvention_region','subvention_commune','subvention_autre',
    'pending'
  )),
  eligible_at TIMESTAMPTZ,
  proof_documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moksha_bourses_versee ON moksha.moksha_bourses_inclusion (versee, versee_at);
CREATE INDEX IF NOT EXISTS idx_moksha_bourses_financement ON moksha.moksha_bourses_inclusion (financement_source);

-- ========== 6) USER TAX PROFILES (4 flows fiscaux) ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_user_tax_profiles (
  user_id UUID PRIMARY KEY REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN (
    'particulier_occasionnel','particulier_bnc','autoentrepreneur','entreprise'
  )),
  siret TEXT,
  siren TEXT,
  company_name TEXT,
  legal_form TEXT,
  activity_type TEXT,
  tva_franchise BOOLEAN DEFAULT true,
  urssaf_mandate_signed_at TIMESTAMPTZ,
  urssaf_mandate_doc_id TEXT,
  pennylane_oauth_token_encrypted TEXT,
  pennylane_company_id TEXT,
  edi_tdfc_enabled BOOLEAN DEFAULT false,
  threshold_305_alerted BOOLEAN DEFAULT false,
  threshold_bnc_alerted BOOLEAN DEFAULT false,
  threshold_tva_alerted BOOLEAN DEFAULT false,
  onboarded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moksha_tax_type ON moksha.moksha_user_tax_profiles (profile_type);

-- ========== 7) TAX DECLARATIONS ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_tax_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  year INT NOT NULL,
  period TEXT,
  declaration_type TEXT CHECK (declaration_type IN (
    '2042_C_PRO','urssaf_trimestriel','tva_trimestriel','is_annuel','recap_bourse'
  )),
  amount_declared_eur NUMERIC(10,2),
  cotisations_eur NUMERIC(10,2),
  filed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','filed','accepted','rejected')),
  provider_response JSONB,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, period, declaration_type)
);
CREATE INDEX IF NOT EXISTS idx_moksha_tax_decl_user ON moksha.moksha_tax_declarations (user_id, year DESC);

-- ========== 8) FACTUR-X INVOICES (Flow 4 entreprise) ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_facturx_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount_ht_eur NUMERIC(10,2),
  tva_rate NUMERIC(4,2) DEFAULT 0,
  amount_ttc_eur NUMERIC(10,2),
  source_transaction_id UUID REFERENCES moksha.moksha_wallet_transactions(id) ON DELETE SET NULL,
  facturx_xml_url TEXT,
  pdf_url TEXT,
  sent_to_pennylane BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moksha_facturx_user ON moksha.moksha_facturx_invoices (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moksha_facturx_pending ON moksha.moksha_facturx_invoices (sent_to_pennylane) WHERE sent_to_pennylane = false;

-- ========== 9) CPA EARNINGS (tracking financement primes SASU) ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_cpa_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL DEFAULT 'moksha',
  partner TEXT NOT NULL, -- qonto, pennylane, blank, binance, treezor, etc.
  amount_eur NUMERIC(10,2) NOT NULL,
  received_at TIMESTAMPTZ,
  covers_prime_palier INT CHECK (covers_prime_palier BETWEEN 1 AND 3),
  external_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','disputed','reversed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moksha_cpa_partner ON moksha.moksha_cpa_earnings (partner, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_moksha_cpa_user ON moksha.moksha_cpa_earnings (user_id, app_id);

-- ========== 10) KARMA TICKETS (18 façons gagner) ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_karma_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN (
    'inscription','parrainage_parrain','parrainage_filleul','mission',
    'avis_app_store','avis_play_store','follow_insta','follow_tiktok','follow_youtube',
    'story_insta','story_tiktok','video_tiktok','video_reels',
    'partage_evolution','partage_parrainage','challenge_won',
    'streak_7j','streak_30j','feedback','abonne_x5_multiplicateur'
  )),
  draw_period TEXT NOT NULL, -- '2026-W17' ou '2026-04' ou 'jackpot_2026-04'
  draw_type TEXT NOT NULL CHECK (draw_type IN ('week','month','jackpot_terre')),
  multiplier INT DEFAULT 1 CHECK (multiplier >= 1),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moksha_tickets_period ON moksha.moksha_karma_tickets (draw_period, draw_type, used);
CREATE INDEX IF NOT EXISTS idx_moksha_tickets_user ON moksha.moksha_karma_tickets (user_id, created_at DESC);

-- ========== 11) KARMA DRAWS (tirages hebdo/mensuel/jackpot) ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_karma_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('week','month','jackpot_terre')),
  period TEXT NOT NULL, -- '2026-W17', '2026-04', 'jackpot_2026-04'
  pool_eur NUMERIC(10,2) NOT NULL,
  draw_date TIMESTAMPTZ NOT NULL,
  random_seed TEXT, -- random.org signed seed
  random_signature TEXT,
  originstamp_hash TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','drawn','paid','cancelled')),
  winners_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(type, period)
);
CREATE INDEX IF NOT EXISTS idx_moksha_draws_status ON moksha.moksha_karma_draws (status, draw_date);

-- ========== 12) KARMA WINNERS ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_karma_winners (
  draw_id UUID NOT NULL REFERENCES moksha.moksha_karma_draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  rank INT NOT NULL CHECK (rank >= 1),
  amount_eur NUMERIC(10,2) NOT NULL,
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  PRIMARY KEY (draw_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_moksha_winners_user ON moksha.moksha_karma_winners (user_id);

-- ========== 13) REGLEMENTS (horodatage blockchain) ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_reglements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  content_hash TEXT NOT NULL, -- SHA-256
  originstamp_hash TEXT,
  originstamp_proof_url TEXT,
  blockchain TEXT DEFAULT 'tezos',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  content_url TEXT, -- /reglement?v=X
  pdf_url TEXT,
  active BOOLEAN DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_moksha_reglements_active ON moksha.moksha_reglements (active, published_at DESC);

-- ========== RLS (owner-only sauf admin) ==========
ALTER TABLE moksha.moksha_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_primes_v4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_bourses_inclusion ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_user_tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_facturx_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_cpa_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_karma_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_karma_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_karma_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_reglements ENABLE ROW LEVEL SECURITY;

-- Owner policies
DROP POLICY IF EXISTS "own connect" ON moksha.moksha_connect_accounts;
CREATE POLICY "own connect" ON moksha.moksha_connect_accounts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own wallet" ON moksha.moksha_user_wallets;
CREATE POLICY "own wallet" ON moksha.moksha_user_wallets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own primes" ON moksha.moksha_primes_v4;
CREATE POLICY "own primes" ON moksha.moksha_primes_v4 FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "own bourse" ON moksha.moksha_bourses_inclusion;
CREATE POLICY "own bourse" ON moksha.moksha_bourses_inclusion FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "own tax" ON moksha.moksha_user_tax_profiles;
CREATE POLICY "own tax" ON moksha.moksha_user_tax_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own declarations" ON moksha.moksha_tax_declarations;
CREATE POLICY "own declarations" ON moksha.moksha_tax_declarations FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "own facturx" ON moksha.moksha_facturx_invoices;
CREATE POLICY "own facturx" ON moksha.moksha_facturx_invoices FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "own cpa" ON moksha.moksha_cpa_earnings;
CREATE POLICY "own cpa" ON moksha.moksha_cpa_earnings FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "own tickets" ON moksha.moksha_karma_tickets;
CREATE POLICY "own tickets" ON moksha.moksha_karma_tickets FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "public draws" ON moksha.moksha_karma_draws;
CREATE POLICY "public draws" ON moksha.moksha_karma_draws FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "own winner" ON moksha.moksha_karma_winners;
CREATE POLICY "own winner" ON moksha.moksha_karma_winners FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "public reglements" ON moksha.moksha_reglements;
CREATE POLICY "public reglements" ON moksha.moksha_reglements FOR SELECT TO authenticated, anon USING (active = true);

-- ========== GRANT (permissions role anon/authenticated) ==========
GRANT USAGE ON SCHEMA moksha TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA moksha TO service_role;
GRANT SELECT ON moksha.moksha_karma_draws, moksha.moksha_reglements TO anon, authenticated;

-- ========== TRIGGER updated_at auto ==========
CREATE OR REPLACE FUNCTION moksha.v4_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_connect_touch ON moksha.moksha_connect_accounts;
CREATE TRIGGER trg_connect_touch BEFORE UPDATE ON moksha.moksha_connect_accounts FOR EACH ROW EXECUTE FUNCTION moksha.v4_touch_updated_at();

DROP TRIGGER IF EXISTS trg_wallet_touch ON moksha.moksha_user_wallets;
CREATE TRIGGER trg_wallet_touch BEFORE UPDATE ON moksha.moksha_user_wallets FOR EACH ROW EXECUTE FUNCTION moksha.v4_touch_updated_at();

DROP TRIGGER IF EXISTS trg_primes_touch ON moksha.moksha_primes_v4;
CREATE TRIGGER trg_primes_touch BEFORE UPDATE ON moksha.moksha_primes_v4 FOR EACH ROW EXECUTE FUNCTION moksha.v4_touch_updated_at();

DROP TRIGGER IF EXISTS trg_bourse_touch ON moksha.moksha_bourses_inclusion;
CREATE TRIGGER trg_bourse_touch BEFORE UPDATE ON moksha.moksha_bourses_inclusion FOR EACH ROW EXECUTE FUNCTION moksha.v4_touch_updated_at();

DROP TRIGGER IF EXISTS trg_tax_touch ON moksha.moksha_user_tax_profiles;
CREATE TRIGGER trg_tax_touch BEFORE UPDATE ON moksha.moksha_user_tax_profiles FOR EACH ROW EXECUTE FUNCTION moksha.v4_touch_updated_at();

-- ========== FONCTION apply_wallet_transaction (matérialisation atomique balance) ==========
CREATE OR REPLACE FUNCTION moksha.apply_wallet_transaction_v4(
  p_user_id UUID, p_amount NUMERIC, p_direction TEXT
) RETURNS VOID AS $$
BEGIN
  IF p_direction = 'credit' THEN
    INSERT INTO moksha.moksha_user_wallets (user_id, balance_eur, lifetime_earned_eur, yearly_earned_eur)
    VALUES (p_user_id, p_amount, p_amount, p_amount)
    ON CONFLICT (user_id) DO UPDATE SET
      balance_eur = moksha.moksha_user_wallets.balance_eur + EXCLUDED.balance_eur,
      lifetime_earned_eur = moksha.moksha_user_wallets.lifetime_earned_eur + EXCLUDED.balance_eur,
      yearly_earned_eur = CASE
        WHEN moksha.moksha_user_wallets.yearly_reset_date = date_trunc('year', NOW())::date
        THEN moksha.moksha_user_wallets.yearly_earned_eur + EXCLUDED.balance_eur
        ELSE EXCLUDED.balance_eur
      END,
      yearly_reset_date = date_trunc('year', NOW())::date,
      updated_at = NOW();
  ELSIF p_direction = 'debit' THEN
    UPDATE moksha.moksha_user_wallets
    SET balance_eur = GREATEST(balance_eur - p_amount, 0),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION moksha.apply_wallet_transaction_v4 TO service_role;

-- Fin migration V4 Wave B

-- MOKSHA V3 — New tables for Points, Daily Gift, Contest, Share, Feedback, Contact

-- ========== POINTS PURAMA ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_point_balances (
  user_id UUID PRIMARY KEY REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  balance INT DEFAULT 0,
  lifetime_earned INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moksha.moksha_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('inscription','parrainage','streak','partage','feedback','mission','achievement','daily_gift','achat','conversion')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== DAILY GIFTS ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_daily_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL,
  gift_value TEXT NOT NULL,
  streak_count INT DEFAULT 1,
  opened_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== CONTEST LEADERBOARD + LOTTERY ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_contest_leaderboard (
  user_id UUID PRIMARY KEY REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  full_name TEXT,
  score INT DEFAULT 0,
  rank INT,
  period TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'IYYY-IW'),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moksha.moksha_contest_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('classement','tirage')),
  winners JSONB DEFAULT '[]',
  amounts JSONB DEFAULT '[]',
  total_pool NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moksha.moksha_lottery_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('inscription','parrainage','mission','partage','streak','abo','achat_points')),
  draw_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moksha.moksha_lottery_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_date DATE NOT NULL,
  pool_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','completed')),
  winners JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== SOCIAL SHARES ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_social_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  share_code TEXT NOT NULL,
  platform_hint TEXT,
  points_given INT DEFAULT 0,
  shared_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== FEEDBACK ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general','jurisia','demarches','proofvault','wallet','autre')),
  points_given INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== CONTACT MESSAGES ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded BOOLEAN DEFAULT false
);

-- ========== FUNCTIONS ==========
CREATE OR REPLACE FUNCTION moksha.moksha_add_points(p_user_id UUID, p_amount INT) RETURNS VOID AS $$
BEGIN
  INSERT INTO moksha.moksha_point_balances (user_id, balance, lifetime_earned)
  VALUES (p_user_id, p_amount, GREATEST(p_amount, 0))
  ON CONFLICT (user_id) DO UPDATE
  SET balance = moksha.moksha_point_balances.balance + p_amount,
      lifetime_earned = CASE WHEN p_amount > 0 THEN moksha.moksha_point_balances.lifetime_earned + p_amount ELSE moksha.moksha_point_balances.lifetime_earned END,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION moksha.moksha_get_points_rank(p_user_id UUID) RETURNS INT AS $$
DECLARE v_rank INT;
BEGIN
  SELECT rank INTO v_rank FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY lifetime_earned DESC) AS rank
    FROM moksha.moksha_point_balances
  ) sub WHERE sub.user_id = p_user_id;
  RETURN v_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_moksha_point_tx_user ON moksha.moksha_point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_moksha_daily_gifts_user ON moksha.moksha_daily_gifts(user_id, opened_at);
CREATE INDEX IF NOT EXISTS idx_moksha_lottery_tickets_user ON moksha.moksha_lottery_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_moksha_social_shares_user ON moksha.moksha_social_shares(user_id, shared_at);
CREATE INDEX IF NOT EXISTS idx_moksha_feedback_user ON moksha.moksha_user_feedback(user_id);

-- ========== RLS ==========
ALTER TABLE moksha.moksha_point_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_daily_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_contest_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_contest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_lottery_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_lottery_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_contact_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_point_balances' AND policyname='own_points') THEN
    CREATE POLICY own_points ON moksha.moksha_point_balances FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_point_transactions' AND policyname='own_point_tx') THEN
    CREATE POLICY own_point_tx ON moksha.moksha_point_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_daily_gifts' AND policyname='own_gifts') THEN
    CREATE POLICY own_gifts ON moksha.moksha_daily_gifts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_contest_leaderboard' AND policyname='all_read_leaderboard') THEN
    CREATE POLICY all_read_leaderboard ON moksha.moksha_contest_leaderboard FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_contest_results' AND policyname='all_read_results') THEN
    CREATE POLICY all_read_results ON moksha.moksha_contest_results FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_lottery_tickets' AND policyname='own_tickets') THEN
    CREATE POLICY own_tickets ON moksha.moksha_lottery_tickets FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_lottery_draws' AND policyname='all_read_draws') THEN
    CREATE POLICY all_read_draws ON moksha.moksha_lottery_draws FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_social_shares' AND policyname='own_shares') THEN
    CREATE POLICY own_shares ON moksha.moksha_social_shares FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_user_feedback' AND policyname='own_feedback') THEN
    CREATE POLICY own_feedback ON moksha.moksha_user_feedback FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_contact_messages' AND policyname='service_contact') THEN
    CREATE POLICY service_contact ON moksha.moksha_contact_messages FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA moksha TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA moksha TO authenticated;
GRANT SELECT ON moksha.moksha_contest_leaderboard TO anon;
GRANT SELECT ON moksha.moksha_contest_results TO anon;
GRANT SELECT ON moksha.moksha_lottery_draws TO anon;
GRANT INSERT ON moksha.moksha_contact_messages TO anon;

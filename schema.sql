-- MOKSHA — Schema
-- Deployed via docker exec supabase-db psql

CREATE SCHEMA IF NOT EXISTS moksha;
GRANT USAGE ON SCHEMA moksha TO postgres, authenticated, anon, service_role;

-- ========== PROFILES ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'gratuit' CHECK (plan IN ('gratuit','autopilote','pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  referral_code TEXT UNIQUE DEFAULT ('MOKSHA-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6))),
  referred_by UUID REFERENCES moksha.moksha_profiles(id),
  jurisia_questions_today INT DEFAULT 0,
  jurisia_reset_date DATE DEFAULT CURRENT_DATE,
  is_admin BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  tutorial_completed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== STRUCTURES ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entreprise','association')),
  forme TEXT,
  denomination TEXT,
  nom_commercial TEXT,
  activite TEXT,
  code_ape TEXT,
  siren TEXT,
  siret TEXT,
  adresse_siege TEXT,
  capital_social NUMERIC,
  date_creation DATE,
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon','en_cours','depose','accepte','refuse','regularisation')),
  kbis_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== DEMARCHES ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_demarches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES moksha.moksha_structures(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('creation','modification','cessation','depot_comptes','association')),
  titre TEXT NOT NULL,
  mode TEXT DEFAULT 'standard' CHECK (mode IN ('standard','express')),
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon','documents_generes','en_traitement','depose_inpi','accepte','refuse','regularisation')),
  wizard_data JSONB DEFAULT '{}',
  documents_generes JSONB DEFAULT '[]',
  inpi_reference TEXT,
  avancement INT DEFAULT 0,
  date_depot TIMESTAMPTZ,
  date_acceptation TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== DOCUMENTS ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES moksha.moksha_structures(id) ON DELETE SET NULL,
  demarche_id UUID REFERENCES moksha.moksha_demarches(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  type TEXT CHECK (type IN ('statuts','pv','kbis','facture','contrat','identite','domicile','annonce_legale','autre')),
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  version INT DEFAULT 1,
  scanner_score TEXT CHECK (scanner_score IN ('parfait','attention','illisible')),
  scanner_details JSONB DEFAULT '{}',
  partage_token TEXT UNIQUE,
  partage_expire TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== JURISIA ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_jurisia_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  titre TEXT DEFAULT 'Nouvelle conversation',
  contexte JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moksha.moksha_jurisia_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES moksha.moksha_jurisia_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  confiance TEXT CHECK (confiance IN ('eleve','moyen','faible')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== RAPPELS ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_rappels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES moksha.moksha_structures(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('ag_annuelle','tva','urssaf','depot_comptes','kbis_renouvellement','echance_custom')),
  titre TEXT NOT NULL,
  description TEXT,
  date_echeance DATE NOT NULL,
  statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif','complete','reporte','ignore')),
  notifie BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== REFERRALS + WALLET ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  code_used TEXT NOT NULL,
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending','active','paid')),
  commission_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moksha.moksha_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('commission','bonus','retrait','concours')),
  amount NUMERIC NOT NULL,
  description TEXT,
  statut TEXT DEFAULT 'completed' CHECK (statut IN ('pending','completed','failed')),
  stripe_payout_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== CONCOURS ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_concours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('meilleur_parrain','premiere_creation','defi_mensuel')),
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ NOT NULL,
  prix JSONB DEFAULT '[]',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moksha.moksha_concours_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concours_id UUID NOT NULL REFERENCES moksha.moksha_concours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  rang INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(concours_id, user_id)
);

-- ========== NOTIFICATIONS ==========
CREATE TABLE IF NOT EXISTS moksha.moksha_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES moksha.moksha_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT,
  lu BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_moksha_profiles_referral_code ON moksha.moksha_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_moksha_profiles_email ON moksha.moksha_profiles(email);
CREATE INDEX IF NOT EXISTS idx_moksha_structures_user_id ON moksha.moksha_structures(user_id, statut);
CREATE INDEX IF NOT EXISTS idx_moksha_demarches_user_id ON moksha.moksha_demarches(user_id, statut);
CREATE INDEX IF NOT EXISTS idx_moksha_documents_user_id ON moksha.moksha_documents(user_id, structure_id);
CREATE INDEX IF NOT EXISTS idx_moksha_jurisia_messages_conv ON moksha.moksha_jurisia_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_moksha_rappels_user_echeance ON moksha.moksha_rappels(user_id, date_echeance);
CREATE INDEX IF NOT EXISTS idx_moksha_wallet_user ON moksha.moksha_wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_moksha_referrals_referrer ON moksha.moksha_referrals(referrer_id);

-- ========== TRIGGERS ==========
CREATE OR REPLACE FUNCTION moksha.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER moksha_profiles_updated_at BEFORE UPDATE ON moksha.moksha_profiles FOR EACH ROW EXECUTE FUNCTION moksha.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER moksha_structures_updated_at BEFORE UPDATE ON moksha.moksha_structures FOR EACH ROW EXECUTE FUNCTION moksha.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER moksha_demarches_updated_at BEFORE UPDATE ON moksha.moksha_demarches FOR EACH ROW EXECUTE FUNCTION moksha.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER moksha_jurisia_conversations_updated_at BEFORE UPDATE ON moksha.moksha_jurisia_conversations FOR EACH ROW EXECUTE FUNCTION moksha.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION moksha.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO moksha.moksha_profiles (id, email, full_name, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email = 'matiss.frasne@gmail.com'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created_moksha
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION moksha.handle_new_user();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========== RLS ==========
ALTER TABLE moksha.moksha_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_demarches ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_jurisia_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_jurisia_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_rappels ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_concours ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_concours_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_profiles' AND policyname='own_profile_select') THEN
    CREATE POLICY own_profile_select ON moksha.moksha_profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY own_profile_update ON moksha.moksha_profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY own_profile_insert ON moksha.moksha_profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_structures' AND policyname='own_structures') THEN
    CREATE POLICY own_structures ON moksha.moksha_structures FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_demarches' AND policyname='own_demarches') THEN
    CREATE POLICY own_demarches ON moksha.moksha_demarches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_documents' AND policyname='own_documents') THEN
    CREATE POLICY own_documents ON moksha.moksha_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_jurisia_conversations' AND policyname='own_conv') THEN
    CREATE POLICY own_conv ON moksha.moksha_jurisia_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_jurisia_messages' AND policyname='own_msg') THEN
    CREATE POLICY own_msg ON moksha.moksha_jurisia_messages FOR ALL USING (
      EXISTS (SELECT 1 FROM moksha.moksha_jurisia_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_rappels' AND policyname='own_rappels') THEN
    CREATE POLICY own_rappels ON moksha.moksha_rappels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_referrals' AND policyname='own_referrals') THEN
    CREATE POLICY own_referrals ON moksha.moksha_referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_wallet_transactions' AND policyname='own_wallet') THEN
    CREATE POLICY own_wallet ON moksha.moksha_wallet_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_concours' AND policyname='all_can_read') THEN
    CREATE POLICY all_can_read ON moksha.moksha_concours FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_concours_participants' AND policyname='own_concours_part') THEN
    CREATE POLICY own_concours_part ON moksha.moksha_concours_participants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='moksha' AND tablename='moksha_notifications' AND policyname='own_notifs') THEN
    CREATE POLICY own_notifs ON moksha.moksha_notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON ALL TABLES IN SCHEMA moksha TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA moksha TO authenticated;
GRANT SELECT ON moksha.moksha_concours TO anon;

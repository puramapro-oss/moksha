-- MOKSHA V7.1 — Migration moksha_reglements vers OpenTimestamps Bitcoin
-- Source: CLAUDE.md V7.1 §36.2 + STRIPE_CONNECT_KARMA_V4.md V4.1
-- Date: 2026-04-21
--
-- Contexte : OriginStamp.com Timestamp Dashboard a fermé le 31 mai 2025.
-- Migration vers OpenTimestamps open source ancré Bitcoin (zéro API key).
--
-- Stratégie : préserver les colonnes originstamp_* existantes pour
-- rétrocompatibilité (règlements déjà publiés gardent leur URL Tezos vérifiable
-- via verify.originstamp.com tant qu'OriginStamp maintient son archive lecture).

SET search_path TO moksha, public;

-- 1. Nouvelle colonne preuve OpenTimestamps base64 (binaire sérialisé .ots)
ALTER TABLE moksha.moksha_reglements
  ADD COLUMN IF NOT EXISTS opentimestamps_proof TEXT;

-- 2. Default blockchain = 'bitcoin' pour les nouvelles entrées
ALTER TABLE moksha.moksha_reglements
  ALTER COLUMN blockchain SET DEFAULT 'bitcoin';

-- 3. Backfill blockchain pour entrées sans valeur (rare)
UPDATE moksha.moksha_reglements
   SET blockchain = COALESCE(blockchain, 'bitcoin')
 WHERE blockchain IS NULL;

-- 4. Statut de l'ancrage : pending si stamp Bitcoin pas encore confirmé (~1-2h),
--    confirmed après upgrade réussi (block_height + block_timestamp renseignés)
ALTER TABLE moksha.moksha_reglements
  ADD COLUMN IF NOT EXISTS bitcoin_block_height BIGINT,
  ADD COLUMN IF NOT EXISTS bitcoin_block_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS upgrade_attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS upgrade_count INTEGER DEFAULT 0;

-- 5. Index pour CRON upgrade (cherche les preuves pas encore ancrées)
CREATE INDEX IF NOT EXISTS idx_reglements_pending_upgrade
  ON moksha.moksha_reglements (upgrade_attempted_at NULLS FIRST)
  WHERE bitcoin_block_height IS NULL AND opentimestamps_proof IS NOT NULL;

-- 6. Vue helper : règlements actifs avec statut blockchain lisible
CREATE OR REPLACE VIEW moksha.moksha_reglements_status AS
SELECT
  id,
  version,
  content_hash,
  blockchain,
  CASE
    WHEN bitcoin_block_height IS NOT NULL THEN 'confirmed'
    WHEN opentimestamps_proof IS NOT NULL THEN 'pending_anchor'
    WHEN originstamp_hash IS NOT NULL THEN 'legacy_tezos'
    ELSE 'unstamped'
  END AS stamp_status,
  bitcoin_block_height,
  bitcoin_block_timestamp,
  published_at,
  active
FROM moksha.moksha_reglements;

GRANT SELECT ON moksha.moksha_reglements_status TO anon, authenticated, service_role;

COMMENT ON COLUMN moksha.moksha_reglements.opentimestamps_proof IS 'V4.1: preuve OpenTimestamps base64 (remplace originstamp_hash retired mai 2025)';
COMMENT ON COLUMN moksha.moksha_reglements.bitcoin_block_height IS 'V4.1: hauteur du bloc Bitcoin contenant l''ancrage (NULL si pending)';
COMMENT ON COLUMN moksha.moksha_reglements.upgrade_count IS 'V4.1: nombre de tentatives d''upgrade Bitcoin (CRON)';
COMMENT ON VIEW moksha.moksha_reglements_status IS 'V4.1: statut blockchain lisible — confirmed / pending_anchor / legacy_tezos / unstamped';

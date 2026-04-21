-- MOKSHA V7.1 — Cache SIRET INSEE Sirene
-- Source: CLAUDE.md V7.1 §36.1 + STRIPE_CONNECT_KARMA_V4.md V4.1
-- Date: 2026-04-21
-- Endpoint: https://api.insee.fr/entreprises/sirene/V3.11
-- TTL par défaut: 30 jours (INSEE = données légales officielles, peu volatiles)
-- TTL fallback: 7 jours (recherche-entreprises.api.gouv.fr quand INSEE rate-limit)

SET search_path TO moksha, public;

-- Table cache SIRET
CREATE TABLE IF NOT EXISTS moksha.moksha_siret_cache (
  siret           text PRIMARY KEY,
  siren           text NOT NULL,
  payload         jsonb NOT NULL,
  source          text NOT NULL DEFAULT 'insee' CHECK (source IN ('insee', 'fallback')),
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  hit_count       integer NOT NULL DEFAULT 0,
  last_hit_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_siret_cache_siren ON moksha.moksha_siret_cache (siren);
CREATE INDEX IF NOT EXISTS idx_siret_cache_expires ON moksha.moksha_siret_cache (expires_at);
CREATE INDEX IF NOT EXISTS idx_siret_cache_source ON moksha.moksha_siret_cache (source);

-- Table cache SIREN (unité légale, agrégée multi-établissements)
CREATE TABLE IF NOT EXISTS moksha.moksha_siren_cache (
  siren           text PRIMARY KEY,
  payload         jsonb NOT NULL,
  source          text NOT NULL DEFAULT 'insee' CHECK (source IN ('insee', 'fallback')),
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  hit_count       integer NOT NULL DEFAULT 0,
  last_hit_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_siren_cache_expires ON moksha.moksha_siren_cache (expires_at);

-- Table audit appels INSEE (rate-limit observability, debug)
CREATE TABLE IF NOT EXISTS moksha.moksha_insee_calls (
  id              bigserial PRIMARY KEY,
  endpoint        text NOT NULL,
  identifier      text NOT NULL,
  status_code     integer,
  duration_ms     integer,
  cache_hit       boolean NOT NULL DEFAULT false,
  rate_limited    boolean NOT NULL DEFAULT false,
  fallback_used   boolean NOT NULL DEFAULT false,
  error           text,
  called_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insee_calls_called_at ON moksha.moksha_insee_calls (called_at DESC);
CREATE INDEX IF NOT EXISTS idx_insee_calls_endpoint ON moksha.moksha_insee_calls (endpoint, called_at DESC);

-- RLS — service_role uniquement (cache interne, pas d'exposition user direct)
ALTER TABLE moksha.moksha_siret_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_siren_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha.moksha_insee_calls ENABLE ROW LEVEL SECURITY;

-- Pas de policy = aucun accès direct depuis le client. Toutes les lectures
-- passent par les routes /api/siret et /api/siren (service_role server-side).

-- Permissions schema
GRANT USAGE ON SCHEMA moksha TO service_role, anon, authenticated;
GRANT ALL ON moksha.moksha_siret_cache TO service_role;
GRANT ALL ON moksha.moksha_siren_cache TO service_role;
GRANT ALL ON moksha.moksha_insee_calls TO service_role;
GRANT USAGE ON SEQUENCE moksha.moksha_insee_calls_id_seq TO service_role;

-- Helper SQL : purge des entrées expirées (à appeler par CRON quotidien)
CREATE OR REPLACE FUNCTION moksha.moksha_siret_cache_purge_expired()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = moksha, public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM moksha.moksha_siret_cache WHERE expires_at < now() RETURNING 1
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  WITH deleted2 AS (
    DELETE FROM moksha.moksha_siren_cache WHERE expires_at < now() RETURNING 1
  )
  SELECT deleted_count + count(*) INTO deleted_count FROM deleted2;

  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION moksha.moksha_siret_cache_purge_expired() TO service_role;

-- Helper SQL : purge audit logs > 90 jours (RGPD)
CREATE OR REPLACE FUNCTION moksha.moksha_insee_calls_purge_old()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = moksha, public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM moksha.moksha_insee_calls
    WHERE called_at < now() - interval '90 days'
    RETURNING 1
  )
  SELECT count(*) INTO deleted_count FROM deleted;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION moksha.moksha_insee_calls_purge_old() TO service_role;

COMMENT ON TABLE moksha.moksha_siret_cache IS 'Cache INSEE Sirene établissements (TTL 30j INSEE / 7j fallback)';
COMMENT ON TABLE moksha.moksha_siren_cache IS 'Cache INSEE Sirene unités légales (TTL 30j INSEE / 7j fallback)';
COMMENT ON TABLE moksha.moksha_insee_calls IS 'Audit appels INSEE pour observabilité rate-limit (purge 90j)';

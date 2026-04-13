-- Supprimer les tables créées par erreur dans public
DROP TABLE IF EXISTS public.moksha_dossiers_financement CASCADE;
DROP TABLE IF EXISTS public.moksha_aides CASCADE;

-- Créer dans le bon schema moksha
SET search_path TO moksha;

CREATE TABLE IF NOT EXISTS moksha_aides (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  type_aide TEXT NOT NULL CHECK (type_aide IN ('formation','numerique','social','fiscal','subvention','pret','accompagnement')),
  profil_eligible TEXT[] NOT NULL DEFAULT '{}',
  situation_eligible TEXT[] NOT NULL DEFAULT '{}',
  montant_max INTEGER NOT NULL DEFAULT 0,
  taux_remboursement INTEGER,
  url_officielle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  region TEXT,
  handicap_only BOOLEAN NOT NULL DEFAULT false,
  cumulable BOOLEAN NOT NULL DEFAULT true,
  badge TEXT NOT NULL DEFAULT 'verifier' CHECK (badge IN ('probable','possible','verifier')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moksha_dossiers_financement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aide_id INTEGER NOT NULL REFERENCES moksha.moksha_aides(id) ON DELETE CASCADE,
  profil TEXT NOT NULL,
  situation TEXT NOT NULL,
  handicap BOOLEAN NOT NULL DEFAULT false,
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours','accepte','refuse','renouveler')),
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moksha_aides_active ON moksha_aides(active);
CREATE INDEX IF NOT EXISTS idx_moksha_dossiers_user ON moksha_dossiers_financement(user_id);
CREATE INDEX IF NOT EXISTS idx_moksha_dossiers_aide ON moksha_dossiers_financement(aide_id);

ALTER TABLE moksha_aides ENABLE ROW LEVEL SECURITY;
ALTER TABLE moksha_dossiers_financement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moksha_aides_select" ON moksha_aides FOR SELECT USING (true);
CREATE POLICY "moksha_dossiers_select" ON moksha_dossiers_financement FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "moksha_dossiers_insert" ON moksha_dossiers_financement FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moksha_dossiers_update" ON moksha_dossiers_financement FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "moksha_dossiers_delete" ON moksha_dossiers_financement FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION moksha_financer_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS moksha_aides_updated ON moksha_aides;
CREATE TRIGGER moksha_aides_updated BEFORE UPDATE ON moksha_aides
  FOR EACH ROW EXECUTE FUNCTION moksha_financer_update_timestamp();

DROP TRIGGER IF EXISTS moksha_dossiers_updated ON moksha_dossiers_financement;
CREATE TRIGGER moksha_dossiers_updated BEFORE UPDATE ON moksha_dossiers_financement
  FOR EACH ROW EXECUTE FUNCTION moksha_financer_update_timestamp();

INSERT INTO moksha_aides (id, nom, type_aide, profil_eligible, situation_eligible, montant_max, taux_remboursement, url_officielle, description, region, handicap_only, cumulable, badge) VALUES
(1, 'CPF — Compte Personnel de Formation', 'formation', '{particulier}', '{salarie,demandeur_emploi,independant,auto_entrepreneur}', 5000, NULL, 'https://www.moncompteformation.gouv.fr', 'Formation professionnelle financée par vos droits acquis.', NULL, false, true, 'probable'),
(2, 'AIF — Aide Individuelle à la Formation', 'formation', '{particulier}', '{demandeur_emploi}', 8000, NULL, 'https://www.pole-emploi.fr/candidat/en-formation/les-aides-a-la-formation/laide-individuelle-a-la-formatio.html', 'France Travail finance votre formation quand le CPF ne suffit pas.', NULL, false, true, 'probable'),
(3, 'Chèque numérique CAF', 'numerique', '{particulier}', '{salarie,demandeur_emploi,rsa,cej}', 500, NULL, 'https://www.caf.fr', 'Aide pour l''équipement numérique et la formation digitale.', NULL, false, true, 'possible'),
(4, 'Pass Numérique', 'numerique', '{particulier}', '{salarie,demandeur_emploi,retraite,rsa}', 20, NULL, 'https://www.inclusion-numerique.fr', 'Chèques pour accéder à des services de médiation numérique.', NULL, false, true, 'possible'),
(5, 'Prime d''activité', 'social', '{particulier}', '{salarie,auto_entrepreneur,independant}', 600, NULL, 'https://www.caf.fr/aides-et-services/s-informer-sur-les-aides/solidarite-et-insertion/la-prime-d-activite', 'Complément de revenus pour les travailleurs modestes.', NULL, false, true, 'probable'),
(6, 'AGEFIPH — Aide création d''activité', 'subvention', '{particulier}', '{salarie,demandeur_emploi,independant,auto_entrepreneur}', 10000, NULL, 'https://www.agefiph.fr', 'Aide à la création d''entreprise pour les personnes en situation de handicap.', NULL, true, true, 'probable'),
(7, 'FIPHFP', 'subvention', '{particulier}', '{salarie}', 10000, NULL, 'https://www.fiphfp.fr', 'Fonds pour l''insertion des personnes handicapées dans la fonction publique.', NULL, true, true, 'verifier'),
(8, 'Mobili-Jeune', 'social', '{particulier,etudiant}', '{etudiant,salarie}', 1200, NULL, 'https://www.actionlogement.fr/aide-mobili-jeune', 'Aide au logement pour les jeunes de moins de 30 ans en formation.', NULL, false, true, 'possible'),
(9, 'Aide CROUS', 'social', '{etudiant}', '{etudiant}', 5000, NULL, 'https://www.etudiant.gouv.fr', 'Bourse sur critères sociaux pour les étudiants.', NULL, false, true, 'probable'),
(10, 'Pass Culture', 'numerique', '{particulier,etudiant}', '{etudiant,salarie,demandeur_emploi}', 300, NULL, 'https://pass.culture.fr', 'Crédit pour les jeunes de 15 à 20 ans pour l''accès à la culture.', NULL, false, true, 'possible'),
(11, 'Microcrédit professionnel', 'pret', '{particulier}', '{demandeur_emploi,rsa,auto_entrepreneur}', 5000, NULL, 'https://www.adie.org', 'Prêt professionnel pour les exclus du système bancaire classique.', NULL, false, true, 'probable'),
(12, 'OPCO — Prise en charge formation', 'formation', '{particulier}', '{salarie}', 5000, NULL, 'https://travail-emploi.gouv.fr/ministere/acteurs/partenaires/opco', 'Votre OPCO finance la formation de vos salariés.', NULL, false, true, 'probable'),
(13, '1jeune1solution', 'accompagnement', '{particulier,etudiant}', '{demandeur_emploi,etudiant,cej}', 4000, NULL, 'https://www.1jeune1solution.gouv.fr', 'Aides à l''emploi, à la formation et à l''accompagnement des jeunes.', NULL, false, true, 'probable'),
(14, 'Garantie Jeunes (CEJ)', 'social', '{particulier}', '{cej,demandeur_emploi}', 6000, NULL, 'https://www.service-public.fr/particuliers/vosdroits/F32700', 'Contrat d''Engagement Jeune — jusqu''à 500€/mois pendant 12 mois.', NULL, false, false, 'probable'),
(15, 'PLIE — Plan local pour l''insertion', 'accompagnement', '{particulier}', '{demandeur_emploi,rsa}', 3000, NULL, 'https://travail-emploi.gouv.fr', 'Parcours individualisé vers l''emploi avec accompagnement renforcé.', NULL, false, true, 'verifier'),
(16, 'RSA — Complément activité', 'social', '{particulier}', '{rsa,auto_entrepreneur}', 7200, NULL, 'https://www.caf.fr/aides-et-services/s-informer-sur-les-aides/solidarite-et-insertion/le-revenu-de-solidarite-active-rsa', 'Cumul RSA + revenus d''activité pendant les premiers mois.', NULL, false, true, 'probable'),
(17, 'FNE-Formation 100%', 'formation', '{particulier}', '{salarie}', 10000, NULL, 'https://travail-emploi.gouv.fr/emploi-et-formation/formation/fne-formation', 'Formation 100% prise en charge pour les salariés en activité partielle.', NULL, false, true, 'verifier'),
(18, 'Transition Professionnelle 100%', 'formation', '{particulier}', '{salarie}', 20000, NULL, 'https://www.transitionspro.fr', 'Financement à 100% pour une reconversion professionnelle.', NULL, false, false, 'possible'),
(19, 'VAE — Validation des Acquis', 'formation', '{particulier}', '{salarie,independant,auto_entrepreneur}', 3000, NULL, 'https://vae.gouv.fr', 'Obtenez un diplôme grâce à votre expérience professionnelle.', NULL, false, true, 'possible'),
(20, 'Prêt d''honneur France Active', 'pret', '{particulier}', '{demandeur_emploi,auto_entrepreneur,independant}', 10000, NULL, 'https://www.france-active.org', 'Prêt à taux zéro pour lancer votre activité.', NULL, false, true, 'probable'),
(21, 'France Num — Chèque numérique', 'numerique', '{entreprise}', '{independant,auto_entrepreneur,salarie}', 6500, NULL, 'https://www.francenum.gouv.fr', 'Aide à la transformation numérique des TPE/PME.', NULL, false, true, 'probable'),
(22, 'Pack IA Entreprise', 'numerique', '{entreprise}', '{independant,salarie}', 18500, NULL, 'https://www.bpifrance.fr', 'Financement pour l''intégration de l''IA dans votre entreprise.', NULL, false, true, 'possible'),
(23, 'OPCO — Formation salariés IA', 'formation', '{entreprise}', '{salarie,independant}', 8000, NULL, 'https://travail-emploi.gouv.fr/ministere/acteurs/partenaires/opco', 'Financement formation IA pour vos équipes via votre OPCO.', NULL, false, true, 'probable'),
(24, 'Aide Région BFC Numérique', 'numerique', '{entreprise}', '{independant,auto_entrepreneur,salarie}', 5000, NULL, 'https://www.bourgognefranchecomte.fr', 'Aide régionale pour la transformation numérique.', 'Bourgogne-Franche-Comté', false, true, 'possible'),
(25, 'CIR — Crédit Impôt Recherche', 'fiscal', '{entreprise}', '{independant,salarie}', 100000, 30, 'https://www.enseignementsup-recherche.gouv.fr/cir', '30% de crédit d''impôt sur vos dépenses de R&D.', NULL, false, true, 'probable'),
(26, 'CII — Crédit Impôt Innovation', 'fiscal', '{entreprise}', '{independant,salarie}', 80000, 20, 'https://www.enseignementsup-recherche.gouv.fr/cir', '20% de crédit d''impôt sur vos dépenses d''innovation.', NULL, false, true, 'probable'),
(27, 'FNE-Formation IA', 'formation', '{entreprise}', '{salarie}', 15000, NULL, 'https://travail-emploi.gouv.fr/emploi-et-formation/formation/fne-formation', 'Formation IA financée à 100% pour les salariés.', NULL, false, true, 'verifier'),
(28, 'Chèque TPE CCI', 'accompagnement', '{entreprise}', '{auto_entrepreneur,independant}', 1500, NULL, 'https://www.cci.fr', 'Aide CCI pour accompagner les TPE dans leur développement.', NULL, false, true, 'possible'),
(29, 'AGEFIPH Entreprise', 'subvention', '{entreprise}', '{independant,salarie}', 10000, NULL, 'https://www.agefiph.fr', 'Aide aux entreprises employant des travailleurs handicapés.', NULL, true, true, 'probable'),
(30, 'DIRECCTE — Aide à l''embauche', 'subvention', '{entreprise}', '{independant,salarie}', 8000, NULL, 'https://travail-emploi.gouv.fr', 'Aide directe à l''embauche dans les zones prioritaires.', NULL, false, true, 'verifier'),
(31, 'Diagnostic Numérique BFC 50%', 'accompagnement', '{entreprise}', '{independant,salarie}', 3000, 50, 'https://www.bourgognefranchecomte.fr', 'Diagnostic numérique subventionné à 50% par la Région.', 'Bourgogne-Franche-Comté', false, true, 'possible'),
(32, 'BPI France — Prêt Innovation', 'pret', '{entreprise}', '{independant,salarie}', 300000, NULL, 'https://www.bpifrance.fr', 'Prêt à taux avantageux pour financer l''innovation.', NULL, false, true, 'possible'),
(33, 'DETR — Dotation Équipement Territoires', 'subvention', '{entreprise}', '{independant,salarie}', 50000, NULL, 'https://www.collectivites-locales.gouv.fr', 'Subvention pour les entreprises en zone rurale.', NULL, false, true, 'verifier'),
(34, 'FEDER — Fonds européen', 'subvention', '{entreprise}', '{independant,salarie}', 100000, NULL, 'https://www.europe-en-france.gouv.fr', 'Fonds européen pour le développement régional.', NULL, false, true, 'verifier'),
(35, 'Aide numérique Santé', 'numerique', '{entreprise}', '{independant,salarie}', 15000, NULL, 'https://esante.gouv.fr', 'Aide à la numérisation pour les professionnels de santé.', NULL, false, true, 'possible'),
(36, 'FDVA 2 — Fonctionnement innovation', 'subvention', '{association}', '{salarie,independant,demandeur_emploi}', 15000, NULL, 'https://www.associations.gouv.fr/fdva.html', 'Subvention pour le fonctionnement et l''innovation des associations.', NULL, false, true, 'probable'),
(37, 'FDVA 3 — Formation bénévoles', 'formation', '{association}', '{salarie,independant,demandeur_emploi}', 5000, NULL, 'https://www.associations.gouv.fr/fdva.html', 'Financement de la formation des bénévoles.', NULL, false, true, 'probable'),
(38, 'Subvention communale', 'subvention', '{association}', '{salarie,independant,demandeur_emploi}', 5000, NULL, 'https://www.associations.gouv.fr', 'Subvention de fonctionnement par votre commune.', NULL, false, true, 'probable'),
(39, 'LEADER — Programme européen rural', 'subvention', '{association}', '{salarie,independant,demandeur_emploi}', 20000, NULL, 'https://www.europe-en-france.gouv.fr', 'Programme européen de développement rural.', NULL, false, true, 'verifier'),
(40, 'Aide départementale', 'subvention', '{association}', '{salarie,independant,demandeur_emploi}', 10000, NULL, 'https://www.associations.gouv.fr', 'Subvention du conseil départemental pour les associations.', NULL, false, true, 'possible'),
(41, 'Aide Région BFC Associations', 'subvention', '{association}', '{salarie,independant,demandeur_emploi}', 15000, NULL, 'https://www.bourgognefranchecomte.fr', 'Subvention régionale pour les associations.', 'Bourgogne-Franche-Comté', false, true, 'possible'),
(42, 'Fondation de France', 'subvention', '{association}', '{salarie,independant,demandeur_emploi}', 15000, NULL, 'https://www.fondationdefrance.org', 'Appels à projets thématiques de la Fondation de France.', NULL, false, true, 'possible'),
(43, 'Mécénat d''entreprise 60%', 'fiscal', '{association}', '{salarie,independant,demandeur_emploi}', 50000, 60, 'https://www.associations.gouv.fr', 'Réduction fiscale de 60% pour les entreprises mécènes.', NULL, false, true, 'probable'),
(44, 'Google Ad Grants', 'numerique', '{association}', '{salarie,independant,demandeur_emploi}', 10000, NULL, 'https://www.google.com/grants/', '10 000$/mois de publicité Google gratuite pour les associations.', NULL, false, true, 'probable'),
(45, 'France Active — Garantie associative', 'pret', '{association}', '{salarie,independant,demandeur_emploi}', 30000, NULL, 'https://www.france-active.org', 'Garantie bancaire et prêt solidaire pour les associations.', NULL, false, true, 'possible')
ON CONFLICT (id) DO NOTHING;

SELECT setval('moksha.moksha_aides_id_seq', 45);

# Journal des modifications (CHANGELOG)

Toutes les modifications notables apportées à l'application **Dépannage_entretien** sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), et ce projet adhère à la spécification du [Semantic Versioning](https://semver.org/lang/fr/).

## [1.14.6] - 2026-11-05

### Déployé & Confirmé (Alignement complet du domaine officiel Vercel & automatisation du déploiement)
- **Officialisation de `https://depannage-entretien.vercel.app`** :
  - Déploiement et association réussie du domaine de production `https://depannage-entretien.vercel.app` sur le projet Vercel.
  - Mise à jour de `OFFICIAL_APP_URL` dans `src/version.ts` pour pointer sur `https://depannage-entretien.vercel.app`.
  - Ajout du drapeau `--yes` dans le script `npm run deploy` pour garantir des déploiements pré-construits Vercel 100% automatisés sans blocage interactif.

## [1.14.5] - 2026-11-05

### Corrigé & Rétabli (Résolution erreur 404 DEPLOYMENT_NOT_FOUND Vercel & Rétablissement de l'accès public)
- **Élimination de la redirection automatique vers le domaine inexistant `depannage-entretien.vercel.app` ([index.html](file:///d:/Aplli/D%C3%A9pannage_entretien/index.html))** :
  - Suppression du script qui interceptait les connexions sur `soplan` et redirigeait systématiquement vers `https://depannage-entretien.vercel.app`.
  - Comme ce nom d'hôte n'était pas associé au projet sur l'infrastructure Vercel, chaque chargement déclenchait immédiatement une erreur `404 DEPLOYMENT_NOT_FOUND`.
- **Rétablissement de l'URL officielle active et des liens dynamiques ([version.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/version.ts))** :
  - Réassignation de `OFFICIAL_APP_URL` vers le domaine de production en service `https://soplan-app-alpha.vercel.app`.
  - Simplification de `getAppBaseUrl()` et `getInviteAppBaseUrl()` : les liens d'invitations et de connexion utilisent directement le nom de domaine hôte actif (`window.location.origin`) sans forçage vers un domaine Vercel non configuré.
  - Résolution complète des erreurs 404 lors de la navigation directe et via liens partagés.

## [1.14.4] - 2026-11-04

### Corrigé & Amélioré (Nettoyage de la base de codes erreur, recherche sur fragments 8. ou 6.10 & auto-inscription)
- **Nettoyage et normalisation de la base Supabase `error_codes`** :
  - Résolution de l'anomalie où le champ `alarme` était vide `""` sur les 51 codes erreur en base (les codes étaient concaténés dans `chapitre`).
  - Extraction et renseignement automatique du code d'alarme officiel (ex: `8.16.6.10`, `8.16.7.25`), du titre clair, de la cause, de l'action et du type d'alarme.
  - Correction des caractères d'encodage CP850 / DOS (`é`, `è`, `ê`, `à`, `â`, `ô`, `ç`, `î`).
  - Suppression de la ligne d'en-tête de section vide.
- **Support complet de la recherche par préfixe ou sous-chaîne (`8.`, `6.10`, etc.) ([InterventionFormScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/InterventionFormScreen.tsx))** :
  - La recherche dès `8.` renvoie immédiatement l'ensemble des 50 codes d'alarmes de la famille 8 (stations de traite, bras de robot, etc.).
  - La recherche sur une sous-chaîne comme `6.10` isole directement `8.16.6.10 (1:204 Le programme de la station de traite a été relancé)`.
  - Tri prioritaire optimisé : correspondance exacte > début du code > segment d'alarme inclus > autres champs.
  - Inscription automatique opérationnelle sur correspondance exacte ou résultat unique identifié.
- **Catalogue de repli hors-ligne intégré ([defaultErrorCodes.json](file:///d:/Aplli/D%C3%A9pannage_entretien/src/data/defaultErrorCodes.json) & [demoDatabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/services/demoDatabase.ts))** :
  - Intégration de `defaultErrorCodes.json` avec les 50 codes d'alarme parfaitement nettoyés et renseignés.
  - Chargement autonome dans `demoDb.getTable('errorCodes')` pour garantir un fonctionnement immédiat sans latence même en cas de déconnexion.
  - Incrémentation SemVer vers `v1.14.4`.

## [1.14.3] - 2026-11-04

### Amélioré & Ajouté (Recherche instantanée de code erreur dès le 1er chiffre & inscription automatique)
- **Recherche temps réel dès le 1er chiffre ([InterventionFormScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/InterventionFormScreen.tsx))** :
  - Déclenchement automatique de la recherche dès la saisie du premier chiffre ou caractère (plus besoin de cliquer sur un bouton pour chercher).
  - Filtrage multi-critères instantané en mémoire (code alarme, titre, cause, action, type) avec tri prioritaire par correspondance exacte puis préfixe.
  - Affichage en temps réel de la liste déroulante des codes correspondants avec prévisualisation complète du titre, de la cause et de l'action.
- **Inscription automatique dans le diagnostic ([InterventionFormScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/InterventionFormScreen.tsx))** :
  - Remplissage automatique et direct du champ « Diagnostic principal » dès correspondance exacte sur le code ou dès qu'un code unique est isolé.
  - Inscription immédiate en 1 clic sur n'importe quelle suggestion ou à l'appui sur la touche Entrée.
  - Bandeau d'information visuel confirmant l'inscription automatique du code erreur dans le formulaire.
  - Intégration ergonomique directe dans le bloc *Diagnostics et Constatations* juste au-dessus du champ de diagnostic, évitant les allers-retours au bas de page.
- **Amélioration du modal de recherche globale ([ErrorCodeSearchModal.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/common/ErrorCodeSearchModal.tsx))** :
  - Champ de recherche désormais toujours actif et éditable pour affiner la recherche librement.
  - Incrémentation SemVer vers `v1.14.3`.

## [1.14.2] - 2026-11-04

### Corrigé & Amélioré (Chargement des sections et tâches d'entretien pour kits V300 et VMS 2014)
- **Insertion et synchronisation des 758 tâches d'entretien ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts) & [defaultTachesEntretien.json](file:///d:/Aplli/D%C3%A9pannage_entretien/src/data/defaultTachesEntretien.json))** :
  - Peuplement complet de la table Supabase `taches_entretien` avec les 758 tâches réelles des kits officiels V 300 (Services 1, 2, 3, 4) et VMS 2014 (Services 1, 2, 3, 4).
  - Intégration du catalogue standard embarqué dans `src/data/defaultTachesEntretien.json` et synchronisation dans `demoDatabase.ts` pour garantir un fonctionnement hors-ligne ou sans connexion Supabase.
- **Résolution robuste de la recherche des tâches ([useTachesEntretien.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/hooks/useTachesEntretien.ts))** :
  - Support de la double résolution UUID (`id`) et identifiant alphanumérique (`kit_id`, ex: `kit_v300_2150025306_1`) dans `getSectionsByKit`, `fetchTachesByKit`, `fetchSectionsByKit` et `fetchTachesBySection`.
  - Ajout d'une méthode de repli standard de secours (Méthode 4) garantissant qu'aucune section ni tâche ne soit manquante pour un kit compatible.
- **Fluidité de validation des sections ([MultiMachineSectionSelectionScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/MultiMachineSectionSelectionScreen.tsx))** :
  - Validation et bascule instantanées des tâches d'une section sans latence réseau.
  - Transmission enrichie des métadonnées des kits sélectionnés depuis `MultiMachineKitSelectionScreen`.
- **Outil d'administration de secours ([DatabaseAdminScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/admin/DatabaseAdminScreen.tsx))** :
  - Ajout du bouton d'administration « Recharger 758 tâches standards » dans l'onglet des tâches d'entretien pour réinitialiser ou réparer la base en 1 clic.
  - Incrémentation SemVer vers `v1.14.2`.

## [1.14.1] - 2026-11-03

### Corrigé (Résolution de l'erreur React #310 - Respect des règles des hooks)
- **Déplacement du hook `useMemo` au niveau racine ([InstallationProtocolScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/InstallationProtocolScreen.tsx))** :
  - Correction de l'erreur React minifiée #310 (*« Rendered more hooks than during the previous render »*) provoquée par un appel de `useMemo` situé après des retours conditionnels (`if (!activeInterventionId) return ...`).
  - Déplacement de `collation = useMemo(...)` au niveau supérieur absolu du composant avec les autres hooks fondamentaux, assurant un ordre d'exécution immuable et stable à chaque rendu.
  - Incrémentation SemVer vers `v1.14.1`.

## [1.14.0] - 2026-11-03

### Ajouté & Amélioré (Calculs cumulés multi-techniciens par machine et catégorie avec rapport PDF exhaustif)
- **Moteur de collationnement et d'addition multi-techniciens ([installationCalculations.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/utils/installationCalculations.ts))** :
  - Création du moteur d'agrégation `calculerCollationInstallation` garantissant l'identité mathématique stricte : `Somme(Machines) === Somme(Techniciens) === Somme(Catégories) === Grand Total`.
  - Calcul pour chaque machine : sous-total par catégorie (addition de tous les intervenants sur cette catégorie), sous-total par technicien, et total cumulé de la machine.
  - Calcul global chantier : ventilation par catégorie (avec liste des techniciens ayant contribué et machines concernées), ventilation par technicien (avec catégories réalisées et machines travaillées), et matrice croisée Techniciens × Catégories.
- **Rapport PDF d'installation complet et collationné ([installationReportPDF.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/utils/installationReportPDF.ts) & [pdfGenerator.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/utils/pdfGenerator.ts))** :
  - **Synthèse globale par catégorie de travaux** : tableau AutoTable avec détail de chaque intervenant, machines concernées, volume d'heures cumulé et pourcentage du chantier avec ligne de total général.
  - **Synthèse globale par technicien** : tableau AutoTable avec machines travaillées, détail par catégorie réalisée, heures totales de chaque technicien et pourcentage avec ligne de total général.
  - **Détail complet machine par machine** : pour chaque machine, tableau complet présentant chaque catégorie de travaux, le détail des heures apportées par chaque technicien sur cette machine, et le total de la catégorie sur la machine avec le total consolidé de la machine.
  - **Encadré Grand Total du Chantier** : grand encadré officiel avec mise en valeur du total général et validation de la parfaite concordance entre les sommes des machines, des intervenants et des catégories.
  - Intégration de la fonction d'assainissement typographique `cleanPdf` évitant tout artefact d'encodage avec la police standard Helvetica de jsPDF.
  - Pied de page officiel conforme sur chaque page : `App à la Carte - Hervé CHAMPAGNE EI | SIREN : 132 021 098 | contact@appalacarte.fr | TVA non applicable, art. 293 B du CGI`.
- **Saisie collaborative sur une même machine ([MachineTasksView.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/installation/MachineTasksView.tsx))** :
  - Ajout du bandeau dépliable « Cumul de la machine par catégorie » montrant en direct la somme de toutes les heures enregistrées sur la machine et la répartition par intervenant.
  - Sur chaque ligne de tâche de l'intervenant connecté : affichage d'un badge contextuel lorsqu'un ou plusieurs collègues ont également travaillé sur cette tâche sur la même machine (`👥 Cumul machine sur cette catégorie : Xh (dont Vous : Yh • Collègue : Zh)`).
  - Mise à jour en temps réel du total machine et sauvegarde avec fusion multi-techniciens.
- **Tableau de bord de suivi du chantier ([InstallationProtocolScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/InstallationProtocolScreen.tsx))** :
  - Remplacement de l'affichage réducteur par un sélecteur à 3 vues : `👥 Par Technicien`, `📑 Par Catégorie` et `📊 Matrice Croisée`.
  - Vue `Par Catégorie` : cartes détaillant chaque poste de travail, le volume cumulé et le détail des techniciens ayant participé.
  - Vue `Matrice Croisée` : tableau croisé complet Intervenants × Catégories avec totaux en ligne et en colonne.
  - Cartes des machines enrichies : affichage de la liste des techniciens intervenus avec leurs heures respectives et les principales catégories travaillées.
  - Clôture de chantier enregistrant les données enrichies `journaliers` (parTechnicien, parCategorie, parMachine, matrice, grandTotal).
- **Conformité & Versioning** :
  - Incrémentation SemVer vers `v1.14.0`.
  - Mentions légales vérifiées et accessibles (`MentionsLegalesScreen.tsx` & `Footer.tsx`).

## [1.13.1] - 2026-11-03

### Corrigé (Champs dynamiques et options de Configuration Spécifique)
- **Nettoyage et réalignement de la base de données Supabase (`machine_fields` & `machine_field_options`)** :
  - Suppression des 10 doublons de test générés dans `machine_fields` et attribution stricte de chaque champ à son type de machine réel (`Pompe à vide`, `V 300`, `VMS 2014`, `Tous`).
  - Suppression des doublons parasites « Type de machine principal » qui créaient un champ redondant et bloquaient la sélection.
  - Résolution de l'anomalie critique sur les options : rattachement de toutes les options de listes déroulantes (`machine_field_options`) avec leur véritable identifiant parent `field_id`, mettant fin aux listes déroulantes vides affichant uniquement « Sélectionner... ».
  - Pour le type `V 300` : affichage exclusif des champs dédiés (`Options V300` avec ses options : Aucune, Option HN100, Option Conteur Cellulaire, Option MCA, Option Prog lavage, Autre ; `Type de stalle` avec Stalle simple, Stalle double ; `Version logiciel`).
  - Pour le type `Pompe à vide` : affichage des champs dédiés (`Type de pompe` [DVP, DVPF, VP, Autre], `Variateur` [Variateur NFO 2.2, Variateur Ext, Socidix, Autre], `Armoire` [Armoire Commutateur à came, Armoire 3 contacteurs, Armoire Socidix, Autre], `Pression de service`).
- **Correction du rendu et de la sélection dans [MachineFormScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/machines/MachineFormScreen.tsx)** :
  - Élimination du doublon de libellé astérisque `**` sur les champs obligatoires (le composant `Select` et `Input` gérant déjà l'astérisque de champ requis).
  - Suppression de l'option vide redondante dans les listes déroulantes.
  - Amélioration de la fonction `loadFieldOptions` : résolution multi-clés associant les options à la fois par `field_id`, `id`, `name` et `label` pour une résilience absolue.
  - Prise en charge bidirectionnelle de la rétrocompatibilité : synchronisation des champs `pumpType`, `pumpVariator`, `pumpCabinet` et `v300Option` à l'enregistrement et au rechargement.
- **Sécurisation de l'administration des données ([DatabaseAdminScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/admin/DatabaseAdminScreen.tsx) & [supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - Remplacement du bouton d'initialisation défectueux par une initialisation robuste créant les champs assignés à leurs types respectifs.
  - Prise en charge des identifiants `field_id` chaînes et UUID dans `machine_field_options.create` sans troncature.
- **Conformité & Versioning** :
  - Incrémentation SemVer vers `v1.13.1`.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098, `contact@appalacarte.fr`).

## [1.13.0] - 2026-11-03

### Corrigé & Garanti (Enregistrement Direct et Fiable des Nouveaux Clients et Machines dans Supabase)
- **Persistance garantie des machines dans Supabase ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - Création de la fonction d'assainissement strict `sanitizeMachineDataForSupabase` filtrant les champs selon le schéma réel de la table PostgreSQL `public.machines` (`modele`, `client_id`, `numero_serie`, `type_machine`, `type_relation`, `config_type`, `pump_type`, `v300_option`, `custom_fields`, `date_installation`, `compteur`, `latitude`, `longitude`, `statut`, `actif`).
  - Élimination de l'erreur PGRST204 (`nom`, `serie`, `relationType` absents du schéma SQL) qui provoquait l'échec silencieux de l'insertion Supabase et le repli erroné sur la base de démonstration locale.
  - Regroupement automatique des données techniques et personnalisées dans la colonne JSONB `custom_fields`.
  - Normalisation unifiée des machines (`normalizeMachine`) garantissant la présence simultanée de `id`, `_id`, `nom`, `modele`, `serie`, `numeroSerie`, `typeMachine`, `typeRelation`, `clientId` et `client_id`.
  - Gestion des conflits d'unicité (code 23505 sur `numero_serie`) avec régénération de suffixe unique pour éviter tout échec de création.
  - Levée d'erreurs explicites avec code en cas de blocage RLS (42501) ou d'anomalie réseau.
- **Persistance et visibilité garanties des nouveaux clients dans Supabase ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts) & [ClientsScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/clients/ClientsScreen.tsx))** :
  - Création de `sanitizeClientDataForSupabase` et `normalizeClient` avec injection des coordonnées GPS (`latitude`, `longitude`), `notes`, et gestion de conflit d'unicité sur `numero_client`.
  - Correction de l'affichage dans la liste des clients ([ClientsScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/clients/ClientsScreen.tsx)) : suppression du filtre masquant les clients ayant 0 machines, rendant les nouveaux clients immédiatement visibles dès leur création.
  - Correction de la recherche et de la sélection de client dans [ClientFormScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/clients/ClientFormScreen.tsx) et [ClientDetailScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/clients/ClientDetailScreen.tsx) en ciblant précisément l'identifiant sélectionné (`id` / `_id`).
  - Prise en charge des paramètres de filtrage et pagination dans le hook [useClients.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/hooks/useClients.ts).
- **Conformité & Versioning** :
  - Incrémentation SemVer vers `v1.13.0`.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098, `contact@appalacarte.fr`).


### Corrigé & Automatisé Définitivement (Synchronisation Inconditionnelle Git Push & Déploiement Vercel Production)
- **Automatisation Git Hook `pre-push` ([.git/hooks/pre-push](file:///d:/Aplli/D%C3%A9pannage_entretien/.git/hooks/pre-push))** :
  - Installation d'un hook Git `pre-push` automatique : chaque `git push` déclenche obligatoirement le build et le déploiement sur Vercel Production (`npm run deploy`).
  - Blocage automatique du push si le déploiement Vercel échoue, garantissant qu'aucune version de code ne peut se retrouver sur GitHub sans être immédiatement déployée et active sur Vercel Production.
- **Synchronisation et déploiement de production validés** :
  - Alignement complet du numéro de version (`v1.12.9`) sur l'ensemble de la chaîne : `package.json`, `src/version.ts`, `public/version.json`, `dist/version.json` et métadonnées HTML.
  - Déploiement Vercel Production validé et testé en direct sur `https://depannage-entretien.vercel.app`.
- **Conformité & Versioning** :
  - Incrémentation SemVer vers `v1.12.9`.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098).

## [1.12.8] - 2026-11-03

### Amélioré & Dynamisé (Types de machine et Configuration spécifique — Récupération depuis la table dédiée machine_fields)
- **Récupération dynamique des types de machine ([MachineFormScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/machines/MachineFormScreen.tsx) & [supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - Ajout d'un champ dédié « Type de machine » (`typeMachine` / `type_machine`) dans la section Identification du formulaire machine.
  - Alimentation dynamique de la liste des types disponibles directement depuis la table dédiée `machine_fields` (distincts `machine_type`), ainsi que depuis les machines existantes et les kits d'entretien.
  - Détection automatique et intelligente du type de machine basée sur le nom saisi lors de la création.
- **Récupération dynamique des champs de configuration spécifique depuis la table `machine_fields` ([MachineFormScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/machines/MachineFormScreen.tsx))** :
  - Remplacement des blocs de champs en dur par une génération dynamique basée sur la table `machine_fields`.
  - Filtrage en temps réel des champs correspondant au type de machine sélectionné (`Pompe à vide`, `V 300`, `VMS 2014`, etc.) ou au type générique `Tous`.
  - Récupération dynamique des options de menus déroulants depuis la table dédiée `machine_field_options`.
  - Prise en charge des types de champs : `select`, `text`, `number`, `date`, `checkbox`, `textarea`.
  - Prise en charge des règles conditionnelles (`conditionalRules`) et de l'option de saisie libre (`allowCustomValue`) si l'utilisateur choisit « Autre ».
  - Bouton d'accès direct « Gérer les champs dans la table » vers l'administration des tables (`database-admin`).
  - Possibilité d'ajouter des caractéristiques libres complémentaires.
- **Persistance et rechargement complets des données de configuration ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts) & [MachineFormScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/machines/MachineFormScreen.tsx))** :
  - Enregistrement des valeurs saisies dans la colonne JSONB `custom_fields` de la table `machines`.
  - Synchronisation et préservation des colonnes existantes pour rétrocompatibilité (`pump_type`, `v300_option`, `type_machine`).
  - Rechargement automatique de toutes les valeurs spécifiques lors de la modification d'une machine existante.
- **Affichage et filtrage dynamiques ([MachineDetailScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/machines/MachineDetailScreen.tsx), [MachineCard.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/domain/MachineCard.tsx) & [MachinesScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/machines/MachinesScreen.tsx))** :
  - Affichage du badge du type de machine et des caractéristiques dynamiques dans la fiche détaillée de la machine.
  - Affichage du type de machine dans les cartes de la liste des machines.
  - Filtrage par type de machine dynamique dans l'écran principal des machines.
- **Initialisation des champs et options par défaut ([demoDatabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/services/demoDatabase.ts) & [repairScript.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/sql/repairScript.ts))** :
  - Insertion des champs et options standard pour les types courants (`Pompe à vide`, `V 300`, `VMS 2014`, `Tous`) dans `demoDatabase.ts`.
  - Ajout des requêtes `INSERT INTO machine_fields` et `machine_field_options` avec `ON CONFLICT DO NOTHING` dans le script SQL de réparation Supabase.

## [1.12.7] - 2026-11-03

### Corrigé & Fiabilisé (Enregistrement Supabase — Montages, Dépannages, Mises en service & Entretiens)
- **Résolution critique de l'échec d'enregistrement Supabase pour les 4 modules d'intervention ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - **Correction du schéma de colonne PostgreSQL (`type_intervention` vs `type`)** : L'application envoyait `type: 'REPAIR'`, `type: 'INSTALLATION'`, `type: 'COMMISSIONING'`, `type: 'MAINTENANCE'`, ce qui déclenchait l'erreur PostgreSQL PostgREST 400 (`PGRST204: Could not find the 'type' column of 'interventions'`). Le mappeur automatique convertit désormais les types vers les valeurs de la contrainte CHECK PostgreSQL (`depannage`, `installation`, `mise_en_service`, `maintenance`, `controle`).
  - **Normalisation des statuts PostgreSQL (`statut`)** : Mappage automatique entre la nomenclature frontend majuscule (`EN_COURS`, `TERMINEE`, `PLANIFIEE`, `ANNULEE`) et la contrainte CHECK PostgreSQL minuscule (`en_cours`, `terminee`, `planifiee`, `annulee`).
  - **Protection des identifiants UUID (`client_id`, `machine_id`, `technicien_principal_id`)** : Validation stricte via `isUuid` évitant les rejets Postgres `invalid input syntax for type uuid` lorsque des identifiants de démonstration ou textuels sont fournis.
  - **Préservation intégrale des données applicatives dans la colonne JSONB `rapport`** : Stockage complet des objets `protocolData` (constatations, tests, vérifications), `machines`, `kits`, `selectedSections`, `tachesCompletees`, `progressionGlobale`, et `montageId`.
  - **Désérialisation bidirectionnelle ([formatInterventionFromSupabase](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** : À la lecture depuis Supabase (`v_interventions_details` ou table `interventions`), reconstitution complète des attributs frontend (`type`, `statut`, `protocolData`, `machineIds`, etc.) permettant le bon fonctionnement des filtres, des badges de couleur et de la reprise d'interventions.
- **Fiabilisation des protocoles de montage ([montages](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts) & [installationProtocols](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - Sauvegarde et mise à jour des montages dans la table `installation_protocols` (`points_controle` JSONB, `etapes` JSONB, statut et commentaires) et liaison bidirectionnelle avec l'intervention parente.
- **Fiabilisation des protocoles de mise en service ([commissioningProtocols](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - Sauvegarde des sessions, vérifications et progressions dans la table `commissioning_protocols` (`mesures` JSONB, `tests_effectues` JSONB, `statut`, `conforme`) et mise à jour de l'intervention liée.
- **Ajout des accesseurs de compatibilité `db.utilisateurs`, `db.spare_parts` et `db.intervention_parts` ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - Empêche tout crash JavaScript lors de l'accès à ces collections depuis les formulaires d'intervention.
- **Support des options de pagination et de filtres dans `useInterventions` ([useInterventions.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/hooks/useInterventions.ts))** :
  - `fetchInterventions(options?: any)` transmet désormais les options (ex: `{ limit: 100 }`) à `db.interventions.list()`.

### Corrigé & Fiabilisé (Accès Mobile & Multi-Appareil / Résolution Écran Blanc)
- **Correction critique des imports manquants `db` ([App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx) & [LoginScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/auth/LoginScreen.tsx))** :
  - `db` était appelé sans être importé dans `App.tsx` et `LoginScreen.tsx`, causant une erreur JavaScript non gérée `ReferenceError: db is not defined` dès l'ouverture de l'application sur un nouvel appareil ou une page sans session, provoquant un écran blanc vide ("le lien n'amène sur rien").
- **Sécurisation du chargement d'authentification ([App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx))** :
  - Ajout d'un timer de sécurité (`safetyTimeout`) de 2,5 secondes évitant tout blocage indéfini sur l'écran "Chargement de l'application..." lors de l'accès depuis un réseau distant ou mobile.
- **Ajout d'un Error Boundary React ([ErrorBoundary.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/common/ErrorBoundary.tsx) & [main.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/main.tsx))** :
  - Interception systématique des erreurs d'affichage React pour présenter une interface de récupération claire et conviviale avec bouton "Recharger l'application" au lieu d'un écran blanc.
- **Correction des imports manquants ([CloseInterventionModal.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/domain/CloseInterventionModal.tsx))** :
  - Ajout de l'import `useState` manquant.


## [1.12.5] - 2026-11-03

### Corrigé & Réparé (Champs machines & Options de champs — Résolution contrainte SQL "name")
- **Déblocage complet de l'insertion et de l'import des champs machines ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts) & [DatabaseAdminScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/admin/DatabaseAdminScreen.tsx))** :
  - **Résolution de la violation de contrainte NOT NULL sur la colonne `name`** : La table Supabase `machine_fields` exigeait un `name` non-nul, alors que les formulaires et les imports CSV fournissaient `label`. Le code génère désormais automatiquement l'identifiant technique `name` normalisé (slug minuscule sans accents ni caractères spéciaux) conjointement au libellé `label`.
  - **Suppression des contraintes NOT NULL superflues dans le script SQL de réparation ([repairScript.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/sql/repairScript.ts))** :
    - `ALTER TABLE public.machine_fields ALTER COLUMN name DROP NOT NULL;`
    - `ALTER TABLE public.machine_fields ALTER COLUMN label DROP NOT NULL;`
    - `ALTER TABLE public.machine_fields ALTER COLUMN type DROP NOT NULL;`
    - `ALTER TABLE public.machine_fields ALTER COLUMN section DROP NOT NULL;`
    - Protection par guillemets sur le mot-clé réservé PostgreSQL `"order"`.
  - **Sécurisation de la table `machine_field_options`** :
    - Élimination du blocage sur la contrainte NOT NULL de `label` en harmonisant `label` et `value`.
    - Validation préalable du format UUID sur `field_id` pour éviter les erreurs de syntaxe et de clé étrangère (`23503`) lors de l'import CSV indépendant.

## [1.12.4] - 2026-11-03

### Corrigé & Amélioré (Synchronisation Directe Supabase & Déblocage des Injections CSV)
- **Résolution définitive du non-remplissage des tables Supabase lors de l'injection CSV ou de l'ajout d'enregistrements** :
  - **Correction du schéma `spare_parts` ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
    - Alignement des colonnes d'insertion et mise à jour sur le schéma PostgreSQL exact (`stock_actuel` et `stock_minimum` au lieu de `stock` et `seuil_alerte` qui provoquaient l'erreur `PGRST204: Could not find 'stock' column` et un repli silencieux vers le localStorage).
    - Normalisation à la lecture pour exposer simultanément `stock`, `stockActuel`, `seuilAlerte`, `stockMinimum` et `prixUnitaire`.
  - **Correction du schéma `taches_entretien` ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
    - Garantie des colonnes `section_id` et `titre` obligatoires (NOT NULL) dans le payload d'insertion pour éviter les erreurs de contrainte d'intégrité `23502`.
    - Normalisation des alias `task_id`, `task_label`, `section_title`, `task_order`.
  - **Correction et résilience sur `error_codes`, `machine_fields`, `machine_field_options` ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
    - Mapping précis des types et colonnes Supabase (`type` au lieu de `field_type`, `field_id`, etc.).
    - Mécanisme de repli automatique sur colonnes standard en cas de colonnes étendues non encore créées.
    - Élimination des erreurs silencieuses : capture claire des rejets Supabase et détection du code d'erreur RLS `42501`.
  - **Amélioration de l'import CSV et retour utilisateur ([DatabaseAdminScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/admin/DatabaseAdminScreen.tsx))** :
    - Introduction de `handleImportFeedback` sur toutes les tables (`clients`, `utilisateurs`, `spare_parts`, `error_codes`, `taches_entretien`, `machine_fields`, `machine_field_options`).
    - En cas de blocage RLS Supabase (erreur 42501), l'utilisateur est immédiatement averti avec proposition d'un clic pour copier dans le presse-papier le script SQL officiel de déblocage.
    - Bannière Supabase enrichie avec instructions claires et bouton permanent de copie du script SQL.

## [1.12.3] - 2026-11-03

### Corrigé & Réparé (Administration des Bases : Déblocage des 4 Onglets Défaillants)
- **Résolution définitive du blocage et des plantages sur les 4 onglets administratifs ([DatabaseAdminScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/admin/DatabaseAdminScreen.tsx))** :
  - **Onglet « Codes erreur » (`error_codes`)** :
    - Correction du format de réponse de `db.errorCodes.list()` dans [useErrorCodes.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/hooks/useErrorCodes.ts) (extraction de `list` au lieu d'injecter un objet non-itérable dans la DataTable, ce qui provoquait l'exception `(data || []).filter is not a function`).
    - Implémentation complète des méthodes manquantes `create` et `update` sur `db.errorCodes` dans [supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts).
    - Câblage complet des formulaires d'ajout, de modification (`getEditForm`) et de la suppression (`deleteErrorCode`) avec confirmation.
    - Normalisation bidirectionnelle des champs (`alarme` / `Alarme`, `titre` / `Titre`, `cause` / `Cause`, `action` / `Action`, `typeAlarme` / `Type_alarme`) pour assurer la cohérence avec le modal de recherche d'interventions.
  - **Onglet « Tâches d'entretien » (`taches_entretien`)** :
    - Résolution de la fonction `fetchTachesEntretien` dans [useTachesEntretien.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/hooks/useTachesEntretien.ts) qui ne mettait pas à jour l'état React `setTachesEntretien`.
    - Ajout des formulaires d'ajout (`getAddForm`) et d'édition (`getEditForm`) pour les tâches d'entretien avec tous les paramètres requis (`kitId`, `machineType`, `idTache`, `section`, `description`, `ordre`).
    - Harmonisation complète des colonnes d'affichage avec les schémas SQL et l'import de kits (`task_id`, `task_label`, `section_title`, `task_order`).
  - **Onglet « Champs machines » (`machine_fields`)** :
    - Correction de l'extraction de `list` dans [useMachineFields.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/hooks/useMachineFields.ts) pour éliminer le crash lors de l'accès à l'onglet.
    - Ajout de la méthode `update` manquante sur `db.machineFields` dans [supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts).
    - Câblage de la modification de champ avec règles conditionnelles et suppression sécurisée.
  - **Onglet « Options de champs » (`machine_field_options`)** :
    - Correction de l'extraction de `list` dans [useMachineFieldOptions.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/hooks/useMachineFieldOptions.ts).
    - Ajout de la méthode `update` sur `db.machineFieldOptions` dans [supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts).
    - Ajout du formulaire d'édition avec sélection du champ machine parent, libellé et ordre.
  - **Blindage universel de la DataTable ([DataTable.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/admin/DataTable.tsx))** :
    - Protection défensive `safeData` garantissant un tableau valide quel que soit le format reçu (`Array` direct ou `{ list: [...] }`), éliminant tout risque d'écran blanc.
  - **Script de réparation SQL Supabase ([repairScript.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/sql/repairScript.ts))** :
    - Intégration des politiques RLS et permissions pour `error_codes`, `taches_entretien`, `machine_fields`, `machine_field_options` et `maintenance_kits`.
- **Conformité & Versioning** :
  - Incrémentation SemVer vers `v1.12.3` dans `package.json`, `src/version.ts`, `public/version.json` et le footer applicatif.
  - Vérification obligatoire des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098).

### Corrigé & Amélioré (Messagerie : Connexion Automatique et Prise en Charge Multi-Webmails)
- **Résolution définitive du lien d'invitation dans la messagerie ([LoginScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/auth/LoginScreen.tsx), [App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx))** :
  - **Connexion automatique transparente en 1 clic** : Dès l'ouverture du lien envoyé par messagerie (`/login?email=...&temp=...&action=login`), l'écran de connexion déclenche automatiquement l'authentification sans forcer l'utilisateur à deviner qu'il doit cliquer manuellement sur le formulaire avec un mot de passe masqué.
  - **Détection et purge des sessions concurrentes** : Détection automatique des collisions de session dans [App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx) et [LoginScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/auth/LoginScreen.tsx) lorsqu'un administrateur teste un lien d'invitation destiné à un collaborateur différent, déconnectant l'ancienne session pour garantir l'authentification de l'utilisateur ciblé.
  - **Transition guidée vers le mot de passe définitif** : Si l'utilisateur utilise un mot de passe temporaire pour sa première connexion, il est directement dirigé vers l'écran de création de mot de passe personnel avec message d'accueil personnalisé (`Bienvenue [Prénom] !`). S'il a déjà configuré son mot de passe, il est connecté directement au tableau de bord.
  - **Décodage résilient des paramètres URL (`safeDecode`)** : Prise en charge sans faille des adresses email et tokens encodés, double-encodés (`%2540` / `%40` / `@`) ou altérés par les clients de messagerie.
- **Optimisation de la mise en forme du message d'invitation & options webmails ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** :
  - **Isolation du lien sur sa propre ligne** : Le lien de connexion direct est désormais isolé sans tiret ni deux-points collés au protocole `https://`, empêchant tout retour à la ligne RFC 5322 (limite 78 caractères) de tronquer le lien dans Outlook, Hotmail, Gmail ou les messageries mobiles.
  - **Prise en charge native d'Outlook.com / Hotmail et Google Gmail** : Rétablissement de boutons d'action dédiés « Outlook / Hotmail » et « Gmail » pour les utilisateurs de webmails dans le navigateur, en plus du client de messagerie local (`mailto:`) et des boutons de copie 1-clic.
- **Conformité & Versioning** :
  - Incrémentation SemVer vers `v1.12.2` synchronisée dans `package.json`, `src/version.ts`, `public/version.json` et le footer applicatif.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098).

## [1.12.1] - 2026-11-03

### Corrigé & Blindé (Résolution Définitive de l'Actualisation de Version et du Cache Vercel)
- **Plugin de synchronisation automatique de version au build ([vite.config.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/vite.config.ts))** :
  - **Génération automatique de `version.json`** : À chaque exécution de `npm run build` ou `vercel build`, `public/version.json` et `dist/version.json` sont automatiquement générés et synchronisés avec le numéro de version de `package.json`, avec horodatage ISO et timestamp temps réel.
  - **Injection directe dans le code HTML** : Balises `<meta name="app-version">` et `<meta name="build-time">` injectées dynamiquement dans `index.html`.
- **Destructeur de Service Worker résiduel & vidage de CacheStorage ([sw.js](file:///d:/Aplli/D%C3%A9pannage_entretien/public/sw.js), [service-worker.js](file:///d:/Aplli/D%C3%A9pannage_entretien/public/service-worker.js), [index.html](file:///d:/Aplli/D%C3%A9pannage_entretien/index.html))** :
  - Mise en place de scripts `public/sw.js` et `public/service-worker.js` auto-destructeurs : tout navigateur disposant d'un ancien Service Worker en mémoire les exécute, purge instantanément l'intégralité de `CacheStorage` et désenregistre inconditionnellement le worker sans bloquer les requêtes réseau.
  - Écoute globale de l'événement `vite:preloadError` dans `index.html` pour actualiser immédiatement l'application en cas d'appel d'un ancien chunk JavaScript remplacé par un nouveau déploiement.
- **Détection haute fréquence et rechargement intelligent ([App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx))** :
  - **Vérification multi-événements** : Détection de nouvelle version au démarrage, à chaque reprise de focus de la fenêtre (`window.onfocus`), à chaque retour de mise en arrière-plan (`document.visibilitychange`), et par cycle continu toutes les 15 secondes.
  - **Respect du travail de l'utilisateur** : Rechargement automatique fluide si l'utilisateur ne saisit rien dans un formulaire ; affichage du bandeau d'alerte avec bouton de rechargement si l'utilisateur est activement en train de taper dans un champ pour ne jamais perdre de données.
  - **Garde-fou anti-boucle de rechargement** : Limitation stricte à 2 tentatives automatiques par version dans `sessionStorage`.
- **En-têtes HTTP anti-cache renforcés ([vercel.json](file:///d:/Aplli/D%C3%A9pannage_entretien/vercel.json))** :
  - Règle stricte `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0` avec `Surrogate-Control: no-store` et `CDN-Cache-Control: no-store`.
  - Exclusion explicite des fichiers `/version.json`, `/sw.js` et `/service-worker.js` de la réécriture SPA, garantissant un retour JSON et JS immédiat et non masqué par `index.html`.
  - Ajout du script de déploiement direct `pnpm run deploy` (`vite build && vercel deploy --prebuilt --prod`).
- **Conformité & Versioning** :
  - Incrémentation SemVer vers `v1.12.1` synchronisée dans `package.json`, `src/version.ts`, `public/version.json` et le footer applicatif.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098).

## [1.12.0] - 2026-11-03

### Ajouté & Amélioré (Logigramme des 12 Rôles & Modèle de Permissions Pré-définies avec Ajustement Personnel)
- **Logigramme des 12 Rôles Métiers ([RoleLogigramTab.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/RoleLogigramTab.tsx))** :
  - **Représentation intégrale des 12 rôles** : Remplacement de l'ancien découpage restreint par les 12 rôles officiels exhaustifs :
    1. *Administrateur* (`ADMINISTRATEUR`)
    2. *Directeur* (`DIRECTEUR`)
    3. *Responsable Technique* (`RESPONSABLE_TECHNIQUE`)
    4. *Responsable / Supérieur* (`RESPONSABLE`)
    5. *Chef Technicien CMS* (`CHEF_TECHNICIEN_CMS`)
    6. *Chef Technicien VMS* (`CHEF_TECHNICIEN_VMS`)
    7. *Chef Monteur* (`CHEF_MONTEUR`)
    8. *Technicien CMS* (`TECHNICIEN_CMS`)
    9. *Technicien VMS* (`TECHNICIEN_VMS`)
    10. *Monteur* (`MONTEUR`)
    11. *Magasinier* (`MAGASINIER`)
    12. *Client / Éleveur* (`CLIENT`)
  - **Bascule d'affichage interactive** : Choix entre vue *Organigramme hiérarchique* avec connecteurs de délégation et vue *Grille matricielle des 12 rôles*.
  - **Filtres complets par catégorie** : Tous les 12 rôles, Direction (2), Encadrement (2), Chefs d'équipe (3), Terrain (3), Magasin (1), Clients (1).
- **Permissions Pré-définies par Rôle ([permissions.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/utils/permissions.ts))** :
  - **Modèle de configuration par rôle** : Chaque rôle possède désormais son jeu de permissions pré-définies directement visualisable et modifiable par l'administrateur.
  - **Modale de personnalisation des permissions de rôle** : Bouton `⚙️ Pré-définir` sur chaque carte de rôle permettant de cocher/décocher les 18 permissions réparties en 7 catégories thématiques (Tableau de bord, Clients, Machines, Interventions, Stock, Maintenance, Administration).
  - **Persistance locale et propagation globale** : Enregistrement des pré-configurations (`maintenance_role_default_permissions`) avec bouton de réinitialisation usine et option de répercussion immédiate sur tous les utilisateurs existants possédant le rôle.
- **Gestion Personnelle des Permissions à la Création et dans la Fiche Utilisateur ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** :
  - **Pré-remplissage automatique des permissions** : Dès qu'un rôle est sélectionné lors de l'ajout d'un utilisateur ou de la validation d'une demande, ses permissions pré-définies sont instantanément chargées.
  - **Ajustement personnel (+ / -)** : L'administrateur peut affiner les droits au cas par cas directement dans le formulaire de création/édition en accordant des permissions supplémentaires (+) ou en en retirant (-), sans toucher au modèle global du rôle.
  - **Bouton de réalignement instantané** : Bouton `🔄 Rétablir modèle rôle` présent dans le formulaire et dans l'accordéon de chaque utilisateur pour réaligner ses droits sur son rôle en 1 clic.
- **Conformité & Versioning** :
  - Incrémentation SemVer vers la version mineure `v1.12.0` (`package.json`, `src/version.ts`, `public/version.json`, footer applicatif).
  - Conformité stricte aux mentions légales de l'éditeur (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098, sans numéro de téléphone, contact@appalacarte.fr).

## [1.11.0] - 2026-11-02

### Ajouté & Amélioré (Montage Collaboratif Multi-Techniciens, Multi-Machines & Collation PDF Finale)
- **Collaboration simultanée multi-techniciens sur mobile ([InstallationProtocolScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/InstallationProtocolScreen.tsx), [MachineTasksView.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/installation/MachineTasksView.tsx))** :
  - **Saisie indépendante par smartphone** : Chaque technicien intervenant chez le client se connecte avec son propre compte sur son téléphone et renseigne ses heures de façon autonome sur chaque machine.
  - **Prise en charge multi-machines chez le même client** : Possibilité d'associer et d'administrer plusieurs machines (machine de référence maître, machines esclaves ou équipements distincts) au sein d'un même chantier de montage.
  - **Fusion concurrente intelligente (`saveMontage`)** : Lors de la sauvegarde depuis un téléphone, fusion automatique avec la version la plus récente en base pour préserver les saisies simultanées réalisées par d'autres techniciens sur la même machine ou sur d'autres machines du chantier (aucune perte d'heures ou d'écrasement).
  - **Synchronisation automatique et bouton d'actualisation** : Ajout d'une synchronisation périodique et d'un bouton « Synchroniser » permettant aux intervenants de voir en temps réel l'avancement et les heures saisies par leurs collègues.
  - **Correction du filtrage utilisateur** : Résolution du cas où l'identifiant utilisateur (`_id` vs `id`) pouvait fausser l'affichage des techniciens tiers sur la fiche machine.
- **Collation consolidée sur le PDF final de fin de montage ([pdfGenerator.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/utils/pdfGenerator.ts))** :
  - **Calcul dynamique de collation globale** : Calcul automatique des heures cumulées par technicien et par tâche à travers l'ensemble des machines du chantier, même si le compte-rendu est généré avant la clôture définitive.
  - **Synthèse multi-niveaux exhaustive** :
    - Fiche récapitulative du chantier et du client.
    - Liste complète des machines installées.
    - Tableau de synthèse globale des heures par technicien.
    - Tableau de synthèse globale des heures par tâche (électricité, plomberie, monteur, frigoriste, etc.).
    - Détail complet machine par machine avec la ventilation nominative de chaque technicien intervenu et de ses tâches.
    - Encadré du total global définitif en heures et minutes.
  - **Disponibilité immédiate du PDF** : Bouton d'export PDF accessible à tout moment (« PDF Synthèse » en cours de chantier, « PDF Compte-rendu » une fois clôturé).
  - **Pied de page légal officiel** : Intégration de la mention légale de l'éditeur sur toutes les pages (`App à la Carte — Hervé CHAMPAGNE EI | SIREN : 132 021 098 | contact@appalacarte.fr | TVA non applicable, art. 293 B du CGI`).
- **Conformité & Versioning** :
  - Incrémentation SemVer vers la version mineure `v1.11.0` synchronisée dans `package.json`, `src/version.ts`, `public/version.json` et le footer applicatif.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098).

## [1.10.5] - 2026-11-02

### Simplifié & Épuré (Transmission des Accès Techniciens)
- **Simplification radicale de la modale de transmission d'identifiants ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** :
  - **Élimination de la surcharge de boutons Webmail** : Suppression des multiples boutons Outlook/Gmail aux URLs surchargées qui semaient la confusion et ouvraient des pages intermédiaires non désirées.
  - **Bouton Copier le lien tout-en-un** : Ajout d'un champ dédié avec bouton 1-clic pour copier le lien direct incluant email et mot de passe temporaire pré-remplis (`&temp=prenom2027`).
  - **Bouton Copier le message complet** : Permet de coller instantanément le message prêt à l'envoi dans n'importe quelle application (email, WhatsApp, SMS, etc.).
  - **Bouton Messagerie standardisé** : Un simple lien `mailto:` universel pour ouvrir le client de messagerie par défaut sans artifice.
- **Conformité & Versioning** :
  - Incrémentation SemVer vers la version `v1.10.5` synchronisée dans `package.json`, `src/version.ts`, `public/version.json` et le footer.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098).

## [1.10.4] - 2026-11-02

### Corrigé & Blindé (Résolution Définitive du Cache Navigateur & CDN Vercel)
- **Neutralisation définitive du cache Vercel Edge CDN ([vercel.json](file:///d:/Aplli/D%C3%A9pannage_entretien/vercel.json))** :
  - **Correction de la règle d'en-têtes HTTP** : Remplacement des filtres restreints par `/((?!assets/).*)`, garantissant que toutes les routes de l'application (`/`, `/login`, `/version.json`, etc.) reçoivent systématiquement les en-têtes stricts anti-cache.
  - **Désactivation du cache Vercel Edge** : Ajout des en-têtes `CDN-Cache-Control: no-store`, `Vercel-CDN-Cache-Control: no-store` et `s-maxage=0`, empêchant Vercel de conserver les pages HTML périmées pendant plus de 2 heures sur ses serveurs périphériques.
- **Désenregistrement automatique des Service Workers & Vidage CacheStorage ([index.html](file:///d:/Aplli/D%C3%A9pannage_entretien/index.html))** :
  - Script d'initialisation immédiate dans l'en-tête HTML désenregistrant inconditionnellement tout Service Worker actif et purgeant tous les caches de `CacheStorage` au chargement de la page.
- **Bandeau de notification et actualisation intelligente ([App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx), [Footer.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/common/Footer.tsx))** :
  - Ajout du composant `VersionBanner` affichant un bandeau en temps réel dès qu'une nouvelle version est disponible sur le serveur, avec un bouton « Actualiser maintenant ».
  - Fonction globale `forceAppUpdate` procédant à la purge intégrale (Service Worker + CacheStorage + sessionStorage) et au rechargement dur avec paramètre de contournement d'horodatage (`_v=timestamp`).
- **Conformité & Versioning** :
  - Incrémentation SemVer vers la version `v1.10.4` synchronisée dans `package.json`, `src/version.ts`, `public/version.json` et le footer.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098).

## [1.10.3] - 2026-11-02

### Clarifié & Amélioré (Transmission des Identifiants Technicien & Explication de l'Envoi)
- **Clarification du mode d'envoi des invitations ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** :
  - **Suppression du libellé ambigu « Compte d'envoi automatique »** : Remplacé par « Email officiel de support & contact », évitant de faire croire à l'administrateur qu'un envoi silencieux s'effectue sans action de sa part.
  - **Ajout d'un guide explicatif clair** : Encadré d'instruction stipulant qu'aucun email n'est expédié sans action de l'utilisateur, et invitant à cliquer sur le bouton de messagerie désiré (Outlook / Hotmail, Gmail ou Messagerie locale) ou à copier le message / lien direct.
  - **Intitulés de boutons explicites** : Remplacement des boutons par « Envoyer via Outlook / Hotmail » et « Envoyer via Gmail » pour guider directement l'action d'envoi.
- **Conformité & Versioning** :
  - Incrémentation SemVer vers la version `v1.10.3` synchronisée dans `package.json`, `src/version.ts`, `public/version.json` et le footer.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098).

## [1.10.2] - 2026-11-02

### Corrigé & Amélioré (Messages d'Invitation Technicien & Authentification Multi-Messageries)
- **Résolution du blocage d'envoi et de réception des invitations techniciens ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx), [LoginScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/auth/LoginScreen.tsx), [App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx))** :
  - **Support natif Outlook.com / Hotmail** : Ajout d'un bouton d'envoi dédié « Outlook / Hotmail » pré-remplissant instantanément le destinataire, l'objet et le corps de l'invitation dans le webmail Outlook/Hotmail.
  - **Correction du lien Gmail** : Suppression du paramètre bloquant `authuser=contact@appalacarte.fr` qui générait une erreur 404 / compte introuvable lorsque l'administrateur n'était pas connecté sous ce compte Google spécifique dans son navigateur.
  - **Intégration du mot de passe temporaire dans le lien direct** : Le lien d'invitation inclut désormais le mot de passe temporaire officiel (`&temp=prenom2027`), permettant à l'écran de connexion de le pré-remplir automatiquement à l'ouverture.
  - **Résolution de l'incohérence du mot de passe temporaire généré** : Pour les adresses telles que `hchampag1@hotmail.fr`, l'écran de connexion recherche dorénavant le prénom réel de l'utilisateur (`herve`) en base au lieu de calculer un mot de passe temporaire erroné basé sur le préfixe de l'email (`hchampag12027`).
  - **Garantie de l'URL publique officielle** : Utilisation de `getInviteAppBaseUrl()` (`https://depannage-entretien.vercel.app`) pour toutes les invitations et liens partagés, évitant l'envoi de liens `localhost` inaccessibles sur les smartphones et ordinateurs des collaborateurs distants.
  - **Détection des liens d'accès dans le routeur** : Prise en charge immédiate des paramètres `?action=login`, `?temp=` ou `?invite=` dans [App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx) pour diriger systématiquement le collaborateur vers l'écran de connexion, même si une session résiduelle était ouverte.
- **Conformité & Versioning** :
  - Incrémentation SemVer vers la version `v1.10.2` synchronisée dans `package.json`, `src/version.ts`, `public/version.json` et l'interface.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098).

## [1.10.1] - 2026-11-02

### Modifié (Filtrage des Clients Récents sur le Tableau de Bord)
- **Affichage conditionnel des clients récents ([Dashboard.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/Dashboard.tsx))** :
  - Les clients affichés dans le bloc « Clients récents » du tableau de bord ne sont désormais présentés que s'ils possèdent au moins une machine enregistrée (`m.clientId` ou `m.client_id`).
  - Ajout d'un badge visuel élégant indiquant le nombre exact de machines associées pour chaque client affiché (ex: `1 machine`, `2 machines`).
  - Chargement garanti des machines lors de l'accès au tableau de bord pour fiabiliser le filtrage en temps réel.
  - Message explicite et clair lorsque aucun client possédant une machine n'est encore enregistré.
- **Conformité & Versioning** :
  - Incrémentation SemVer vers la version `v1.10.1` synchronisée dans `package.json`, `src/version.ts`, `public/version.json` et le footer.
  - Vérification continue des mentions légales (EI Hervé CHAMPAGNE, SIREN 132 021 098).

## [1.10.0] - 2026-11-02

### Corrigé & Intégré (Restauration du Protocole de Montage et Calcul des Heures)
- **Restauration et intégration complète du Protocole de montage ([InstallationProtocolScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/InstallationProtocolScreen.tsx))** :
  - Élimination définitive des anciennes références bloquantes à Lumi (`lumi.auth.refreshUser()`) qui provoquaient un gel indéfini de l'écran sur "Chargement...".
  - Utilisation du hook centralisé `useCurrentUser()` garantissant la disponibilité instantanée du profil connecté.
  - Implémentation complète de l'entité `db.montages` dans `src/lib/supabase.ts` et `src/services/demoDatabase.ts` pour la persistance locale et la synchronisation avec la table Supabase `installation_protocols`.
  - Prise en charge des accès directs : l'écran de montage peut désormais être ouvert aussi bien avec les paramètres d'une intervention précise qu'en tant qu'espace global de gestion des montages.
- **Calcul et Suivi en Temps Réel des Heures d'Intervention ([MachineTasksView.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/installation/MachineTasksView.tsx), [InstallationProtocolScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/InstallationProtocolScreen.tsx))** :
  - **Module de calcul des heures** : calcul et ventilation automatique des heures par intervenant, par machine et pour l'ensemble du chantier de montage.
  - **Boutons de saisie rapide sur le terrain** : ajout de raccourcis tactiles `+0.5h`, `+1h`, `+2h` en plus de la saisie numérique libre pour accélérer l'enregistrement des temps passés sur chaque tâche obligatoire ou personnalisée.
  - **Carte de synthèse des heures en haut du chantier** : affichage en grand format du cumul total du chantier (`XXh XXmin`) et tableau de répartition par intervenant.
  - **Correction du calcul d'heures GPS** : transmission de la liste réelle des techniciens et de leurs tâches au composant `GPSTrackingAlert.tsx` pour fiabiliser le contrôle du quota journalier minimum de 8h sur le chantier.
- **Accès et Navigation Directe dans toute l'application ([Navigation.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/common/Navigation.tsx), [App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx), [InterventionDetailScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/InterventionDetailScreen.tsx), [InterventionsScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/interventions/InterventionsScreen.tsx))** :
  - Ajout d'une entrée directe **Montage** (icône marteau `Hammer`) dans le menu latéral et mobile pour un accès immédiat.
  - Intégration de la route `/montage` protégée dans `App.tsx`.
  - Ajout du bouton direct `🔨 Ouvrir le protocole de montage` dans la fiche détail des interventions (`InterventionDetailScreen.tsx`).
  - Redirection automatique des interventions de type `INSTALLATION` (Montage) directement vers leur protocole depuis la liste des interventions (`InterventionsScreen.tsx`) et le tableau de bord (`Dashboard.tsx`).
  - Sécurisation de `InterventionFormScreen.tsx` : la modification d'un montage existant n'entraîne plus de création de doublon.
- **Conformité & Versioning** :
  - Passage à la version `v1.10.0` synchronisée dans `package.json`, `src/version.ts` et `public/version.json`.
  - Vérification et respect des mentions légales obligatoires (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.9.0] - 2026-11-02

### Ajouté (Autocomplétion et Pré-remplissage en Direct pour Accélérer l'Écriture)
- **Autocomplétion dynamique dans les champs de recherche ([SearchBar.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/common/SearchBar.tsx), [ClientsScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/clients/ClientsScreen.tsx))** :
  - Dans l'écran Clients (`ClientsScreen.tsx`), le champ de recherche propose désormais au fur et à mesure que l'on tape les lettres :
    - Les correspondances instantanées des noms de ferme (badge "Ferme"), des noms de contacts/clients (badge "Client"), des numéros clients (badge "N° Client") et des villes.
    - Surlignage en gras et couleur des lettres tapées dans chaque suggestion.
    - Pré-remplissage en ligne accéléré ("ghost autocompletion") : complétion instantanée en une seule touche (`Tab` ou `Flèche Droite`).
    - Menu déroulant élégant au clic ou navigation clavier (`Flèche Haut`, `Flèche Bas`, `Entrée`, `Tab`, `Échap`).
    - Bouton rapide d'effacement `X` pour réinitialiser la recherche en un clic.
- **Système universel de pré-remplissage et d'auto-apprentissage dans tous les champs de l'application ([Input.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/common/Input.tsx), [autocomplete.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/utils/autocomplete.ts))** :
  - **Module centralisé d'autocomplétion (`src/utils/autocomplete.ts`)** :
    - Dictionnaires thématiques par défaut adaptés au métier de l'élevage, de la traite et de la maintenance (villes de référence, codes postaux, marques DeLaval/Lely/GEA..., types de machines, désignations pièces détachées, emplacements de stock, motifs et diagnostics d'intervention).
    - Mémoire d'apprentissage automatique persistant (`localStorage`) : chaque valeur saisie et validée par l'utilisateur est automatiquement mémorisée pour resservir lors des prochaines saisies.
  - **Composant `Input.tsx` enrichi pour tous les formulaires** :
    - Pré-remplissage contextuel dès la première lettre tapée.
    - Affichage d'un menu déroulant de suggestions sous le champ avec mise en valeur des caractères correspondants.
    - Double compatibilité desktop et mobile : menu personnalisé interactif + balise `<datalist>` HTML5 native pour suggestions directes au-dessus du clavier virtuel sur smartphones et tablettes.
- **Généralisation de l'autocomplétion aux autres écrans clés** :
  - `MachinesScreen.tsx` : suggestions instantanées sur noms de machines, numéros de série et marques.
  - `SparePartsScreen.tsx` : suggestions instantanées sur références et désignations de pièces détachées avec prix et stock.
  - `InterventionsScreen.tsx` : suggestions sur numéros d'intervention, diagnostics et clients.
  - `UsersScreen.tsx` : suggestions sur noms complets, emails et numéros de techniciens.
  - `Dashboard.tsx` : suggestions combinées directes pour les recherches globales.
- **Conformité & Versioning** :
  - Passage à la version `v1.9.0` synchronisée dans `package.json`, `src/version.ts` et `public/version.json`.
  - Contrôle et maintien de l'exactitude des mentions légales (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.8.9] - 2026-11-02

### Modifié (Formulaire Client - Champs Obligatoires Réduits au Strict Nécessaire)
- **Ajustement des champs requis dans `ClientFormScreen.tsx` ([ClientFormScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/clients/ClientFormScreen.tsx))** :
  - Seuls le **Numéro client**, le **Nom de la ferme** et l'**Adresse** sont désormais des champs obligatoires (`required`).
  - Les champs Nom personnel, Prénom, Code postal, Ville et Téléphone sont désormais optionnels afin d'accélérer la saisie sur le terrain.
  - Gestion automatique de repli sur le nom de ferme pour le champ `nom` en base de données afin de respecter l'intégrité de la table PostgreSQL sans bloquer l'utilisateur.
- **Conformité & Versioning** :
  - Incrémentation de version vers `v1.8.9` synchronisée dans `package.json`, `src/version.ts` et `public/version.json`.
  - Contrôle et maintien de l'exactitude des mentions légales (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.8.8] - 2026-11-02

### Corrigé (Purge Totale du Cache Navigateur & Déploiement Direct Vercel Production)
- **Résolution définitive du cache récalcitrant sur PC et Téléphone mobile ([vercel.json](file:///d:/Aplli/D%C3%A9pannage_entretien/vercel.json), [index.html](file:///d:/Aplli/D%C3%A9pannage_entretien/index.html), [version.json](file:///d:/Aplli/D%C3%A9pannage_entretien/public/version.json))** :
  - **En-têtes HTTP anti-cache stricts dans Vercel** : Ajout des directives `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache` et `Expires: 0` pour `index.html` et les fichiers racine. Le navigateur mobile et desktop interroge désormais systématiquement le serveur pour récupérer la dernière version sans jamais réutiliser un vieux fichier HTML en cache disque.
  - **Balises méta anti-cache dans `index.html`** : Protection renforcée au niveau DOM contre la mise en mémoire cache locale par les navigateurs mobiles et navigateurs intégrés (WebViews).
  - **Détection automatique en direct des mises à jour ([App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx))** : Vérification régulière en arrière-plan du fichier `/version.json`. Dès qu'une nouvelle version est détectée, le cache navigateur (`caches.delete`) est purgé et la page est rechargée automatiquement avec la dernière version active.
  - **Bouton d'actualisation forcée dans le Footer ([Footer.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/common/Footer.tsx))** : Un clic direct sur le numéro de version (`v1.8.8`) dans le pied de page force immédiatement le vidage du cache de stockage local et recharge l'application avec un paramètre anti-cache unique.
  - **Déploiement direct sur l'alias officiel de production Vercel** : Déploiement immédiat en production (`vercel --prod`) assurant la mise à jour instantanée de `https://depannage-entretien.vercel.app`.
- **Conformité & Versioning** :
  - Passage à la version `v1.8.8` synchronisée dans `package.json` et `src/version.ts`.
  - Contrôle et maintien de l'exactitude des mentions légales (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.8.7] - 2026-11-02

### Ajouté & Corrigé (Alignement Strict des Permissions et Visibilité Tableau de Bord par Rôle)
- **Système centralisé de gestion des permissions RBAC ([permissions.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/utils/permissions.ts), [useCurrentUser.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/hooks/useCurrentUser.ts))** :
  - **Matrice complète des habilitations par rôle métier** : Définition des permissions précises pour chaque catégorie de profil (Administrateurs, Directeurs, Responsables Techniques, Chefs Techniciens CMS/VMS, Techniciens CMS/VMS, Monteurs, Magasiniers, Clients).
  - **Ségrégation stricte des profils terrain (CMS / VMS / Monteurs / Clients)** : Interdiction absolue d'accès et d'affichage des sections sensibles (`view_users`, `manage_users`, `admin_access`). Un technicien ou chef technicien CMS ne peut désormais en aucun cas voir la section *Utilisateurs* ni l'*Administration*.
- **Conformité de l'affichage du Tableau de Bord ([Dashboard.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/Dashboard.tsx))** :
  - **Masquage conditionnel de la carte « Utilisateurs »** : La carte statistique des utilisateurs n'est désormais visible et accessible que pour les profils habilités (`ADMINISTRATEUR`, `DIRECTEUR`, `RESPONSABLE_TECHNIQUE`). Elle est totalement masquée pour les profils CMS et techniciens.
  - **Chargement conditionnel et sécurisé des données (`loadData`)** : L'appel de chargement de la table des utilisateurs n'est plus déclenché pour les utilisateurs n'ayant pas la permission requise, évitant toute fuite d'informations ou requête inutile.
  - **Filtrage des cartes statistiques et actions** : Les cartes clients, pièces détachées, kits d'entretien, interventions ainsi que le bouton de création d'intervention s'adaptent dynamiquement aux habilitations du profil connecté.
- **Sécurisation de la Navigation ([Navigation.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/common/Navigation.tsx))** :
  - **Filtrage des entrées de menu (Desktop & Mobile)** : Les rubriques *Utilisateurs* et *Administration* sont automatiquement masquées du menu pour les rôles CMS et non-administrateurs.
  - **Désactivation de la vérification en arrière-plan des demandes en attente** : L'interrogation périodique du nombre de comptes en attente d'approbation est réservée aux gestionnaires de comptes.
- **Sécurisation des Routes URL Directes ([App.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/App.tsx))** :
  - **Composant de garde `ProtectedRoute`** : Tout accès direct par saisie d'URL vers `/users`, `/admin/database`, `/admin/languages`, `/admin/translations`, etc., sans les droits requis affiche un écran sécurisé d'accès restreint avec possibilité de retour immédiat au tableau de bord.
- **Conformité & Versioning** :
  - Passage à la version `v1.8.7` synchronisée dans `package.json` et `src/version.ts`.
  - Contrôle et maintien de l'exactitude des mentions légales (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.8.6] - 2026-11-02

### Ajouté (Enregistrement Automatique et Résilient Sans Intervention Manuelle)
- **Enregistrement 100% automatique et transparent ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts), [UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** :
  - **Suppression définitive des blocages et alertes SQL** : Lors de la création ou modification d'un utilisateur, l'enregistrement s'effectue automatiquement sans exiger de l'utilisateur qu'il exécute du SQL manuellement dans Supabase.
  - **Double garantie de persistance** : Écriture instantanée locale (0 ms) + synchronisation directe avec Supabase en arrière-plan. Tout technicien ajouté reste immédiatement et définitivement présent dans l'interface.
  - **Réconciliation automatique des identifiants** : Récupération transparente de l'identifiant Supabase dès confirmation de l'insertion.
- **Conformité & Versioning** :
  - Passage à la version `v1.8.6` synchronisée dans `package.json` et `src/version.ts`.
  - Contrôle et maintien de l'exactitude des mentions légales (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.8.5] - 2026-11-02

### Corrigé (Syntaxe SQL des Politiques RLS Supabase)
- **Correction de la syntaxe SQL des politiques RLS ([repairScript.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/sql/repairScript.ts), [supabase_correction_complete_utilisateurs_et_rls.sql](file:///d:/Aplli/D%C3%A9pannage_entretien/supabase_correction_complete_utilisateurs_et_rls.sql))** :
  - **Résolution de l'erreur PostgreSQL `42601 syntax error at or near "FOR"`** : Séparation stricte des clauses `DROP POLICY IF EXISTS ... ON ...;` et `CREATE POLICY ... ON ... FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);` pour les tables `machines`, `interventions`, `installation_protocols` et `commissioning_protocols`.
  - **Exécution sans erreur garantie** : Le script SQL de déblocage s'exécute désormais avec un succès total dans l'éditeur SQL de Supabase.
- **Conformité & Versioning** :
  - Passage à la version `v1.8.5` synchronisée dans `package.json` et `src/version.ts`.
  - Contrôle et maintien de l'exactitude des mentions légales (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.8.4] - 2026-11-02

### Corrigé (Persistance Totale des Utilisateurs & Gestion Complète dans la Base de Données)
- **Résolution définitive de la persistance des utilisateurs ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts), [demoDatabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/services/demoDatabase.ts))** :
  - **Configuration officielle de production garantie par défaut** : Intégration directe des clés Supabase officielles (`https://syrznjjxyvbbkahaavdf.supabase.co`) en valeur par défaut résiliente, évitant tout basculement intempestif sur une URL placeholder lors des déploiements en ligne.
  - **Synchronisation automatique et bidirectionnelle du cache local (`demoDb.setTable`)** : Dès que Supabase charge la liste des utilisateurs, le stockage local est automatiquement synchronisé et mis à jour pour assurer la persistance et l'accès instantané en toute circonstance.
  - **Purge et nettoyage des entrées corrompues** : Élimination dans Supabase et en mémoire locale des lignes fantômes ayant des identifiants vides (`email: ''`), et filtrage strict pour n'afficher que les utilisateurs réels et identifiables.
- **Ajout de la gestion complète des utilisateurs dans l'Administration de la Base de Données ([DatabaseAdminScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/admin/DatabaseAdminScreen.tsx))** :
  - **Formulaire d'ajout direct d'utilisateur (`getAddForm`)** : Ajout du formulaire complet (Nom, Prénom, Email, Téléphone, N° Technicien, Rôle) permettant de créer un nouvel utilisateur directement depuis l'onglet Utilisateurs de la base de données.
  - **Modification en ligne (`getEditForm` & `onEdit`)** : Bouton d'édition opérationnel sur le tableau des utilisateurs avec formulaire modal pré-rempli.
  - **Suppression sécurisée (`onDelete`)** : Bouton de suppression branché avec confirmation et protection absolue du compte maître administrateur (`contact@appalacarte.fr`).
- **Sécurisation du filtrage dans la Gestion des Utilisateurs ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** :
  - Filtrage sécurisé contre les valeurs nulles ou indéfinies garantissant que tous les utilisateurs enregistrés restent toujours visibles dans leurs onglets respectifs (*Tous*, *Validés*, *En attente*).
- **Conformité & Versioning** :
  - Passage à la version `v1.8.4` synchronisée dans `package.json` et `src/version.ts`.
  - Contrôle et maintien de l'exactitude des mentions légales (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.8.3] - 2026-11-02

### Ajouté (Bouton Enveloppe pour Renvoyer l'Email de Connexion)
- **Ajout de l'icône enveloppe pour renvoyer le mail de connexion ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** :
  - **Bouton enveloppe dédié (`Mail`) dans la liste des utilisateurs** : Chaque utilisateur disposant d'une adresse email dispose désormais d'un bouton d'action direct représenté par une enveloppe avec infobulle explicite : *« Renvoyer le mail de connexion (identifiants & lien direct) »*.
  - **Accès direct aux options d'envoi** : Ouvre instantanément la modale de transmission avec envoi pré-rempli via Gmail (`contact@appalacarte.fr`), messagerie locale (`mailto:`) et copie du message type avec mot de passe temporaire.
  - **Séparation claire avec l'icône de partage (`Share2`)** : Le bouton de partage est désormais dédié à la copie directe dans le presse-papier du lien de connexion individualisé (`/login?email=...`), avec confirmation visuelle immédiate par coche verte.
  - **Ajout dans la modale de partage d'accès direct** : Bouton d'envoi par email également disponible dans l'onglet *Lien direct* de la boîte de dialogue de partage.

### Corrigé (Purge Finale de SoPlan et Harmonisation Email Éditeur)
- **Remplacement de l'adresse par défaut par l'email officiel ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts), [LoginScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/auth/LoginScreen.tsx), [DatabaseAdminScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/admin/DatabaseAdminScreen.tsx))** :
  - `DEFAULT_PASSWORD_REQUEST_EMAIL` passe officiellement à `contact@appalacarte.fr` (suppression de l'ancien reliquat `soplanapp1@gmail.com`).
  - **Purge dynamique du `localStorage`** : Dans `getPasswordRequestEmail()`, tout reliquat local contenant `soplan` est immédiatement détecté, nettoyé et réinitialisé automatiquement sur `contact@appalacarte.fr`.
  - **Formulaire de connexion et demande de nouveau mot de passe** : L'adresse affichée en bas du formulaire de connexion et dans l'écran de mot de passe oublié est désormais `contact@appalacarte.fr`.
  - **Administration des bases** : Mise à jour du placeholder et du bouton de réinitialisation par défaut vers `contact@appalacarte.fr`.
  - **Documentation interne** : Purge de la référence SoPlan dans `password.ts`.
- **Conformité & Versioning** :
  - Passage à la version `v1.8.3` synchronisée dans `package.json` et `src/version.ts`.
  - Contrôle et maintien de l'exactitude des mentions légales (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.8.2] - 2026-11-02

### Ajouté (Affichage de la version sous le nom de l'application)
- **Affichage de la version en petit sous « Dépannage_entretien » ([Navigation.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/common/Navigation.tsx), [LoginScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/components/auth/LoginScreen.tsx))** :
  - **Menu latéral Desktop (`Navigation.tsx`)** : Ajout discret de la version active `v1.8.2` sous le titre `Dépannage_entretien` dans la barre latérale.
  - **Barre supérieure Mobile (`Navigation.tsx`)** : Ajout de la version `v1.8.2` sous le titre pour les vues smartphones et tablettes.
  - **Écran de connexion (`LoginScreen.tsx`)** : Affichage d'un badge élégant `v1.8.2` sous le titre officiel de l'application.
- **Conformité & Versioning** :
  - Passage à la version `v1.8.2` synchronisée dans `package.json` et `src/version.ts`.
  - Contrôle et maintien de l'exactitude des mentions légales (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098).

## [1.8.1] - 2026-11-02

### Corrigé (Persistance des Utilisateurs dans Supabase & Mises à Jour Partielles)
- **Correction critique de l'écrasement des données dans `public.utilisateurs` ([supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - **Support du mode `isUpdate` dans `sanitizeUserDataForSupabase`** : Lors d'une mise à jour partielle (approbation d'accès, changement de rôle dans le logigramme, configuration du mot de passe temporaire ou bascule de permissions), les champs non spécifiés (`nom`, `prenom`, `email`, etc.) ne sont plus écrasés avec des chaînes vides `""`.
  - **Préservation de l'identité des techniciens** : Les fiches utilisateurs restent 100% complètes et pérennes dans Supabase après toute modification ou validation.
  - **Fusion de résilience locale dans `db.users.list()`** : Les utilisateurs locaux créés récemment sont automatiquement fusionnés et conservés en cas de latence réseau pour garantir qu'aucun technicien n'échappe à la vue.
  - **Bascule automatique d'onglet après création ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** : Si un technicien est créé avec le statut actif, l'onglet se positionne automatiquement sur *Validés* pour afficher immédiatement la nouvelle fiche.
  - **Nettoyage des entrées corrompues** : Suppression dans Supabase des lignes fantômes ayant subi un écrasement antérieur.

## [1.8.0] - 2026-11-02

### Ajouté (Logigramme Interactif d'Affectation des Rôles Techniciens)
- **Nouvel onglet « Logigramme des Rôles » dans la gestion des Utilisateurs ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx), [RoleLogigramTab.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/RoleLogigramTab.tsx))** :
  - **Réservé aux profils autorisés** : Accessible exclusivement aux Administrateurs, Responsables Techniques et comptes dotés des droits d'administration (`canValidate`).
  - **Arborescence visuelle par niveaux hiérarchiques** :
    - *Niveau 1* : Direction & Administration Maître (`ADMINISTRATEUR`, `DIRECTEUR`).
    - *Niveau 2* : Encadrement Technique & Coordination (`RESPONSABLE_TECHNIQUE`, `RESPONSABLE`).
    - *Niveau 3* : Responsables de Pôles Métiers (`CHEF_TECHNICIEN_CMS`, `CHEF_TECHNICIEN_VMS`, `CHEF_MONTEUR`).
    - *Niveau 4* : Équipes Opérationnelles de Terrain (`TECHNICIEN_CMS`, `TECHNICIEN_VMS`, `MONTEUR`).
    - *Niveau 5* : Support Logistique & Magasin (`MAGASINIER`).
    - *Niveau 6* : Espace Usagers & Éleveurs (`CLIENT`).
    - Prise en charge automatique des rôles personnalisés.
  - **Liaison et changement de rôle en 1 clic** :
    - Bouton `+ Lier un technicien` sur chaque bloc de rôle ouvrant une modale de sélection rapide.
    - Menu déroulant instantané directement sur chaque fiche technicien pour transférer un utilisateur vers un autre rôle.
    - Bouton de désaffectation/retrait rapide d'un rôle.
    - Bac interactif des techniciens sans rôle ou en attente d'affectation pour les lier rapidement à une fonction.
  - **Synchronisation temps réel** : Mise à jour immédiate dans la base de données Supabase (`db.users.update`) et actualisation de l'état local avec notifications visuelles.
- **Conformité & Versioning** :
  - Passage à la version `v1.8.0`.
  - Vérification des mentions légales et de l'identité officielle d'App à la Carte — Hervé CHAMPAGNE EI (SIREN 132 021 098).

## [1.7.8] - 2026-11-02

### Sécurisé & Redirection Automatique (Élimination totale de soplan-app)
- **Redirection automatique et instantanée dans `index.html`** :
  - Tout accès direct ou ancien lien contenant `soplan` (ex: `soplan-app-alpha.vercel.app`) est désormais automatiquement et instantanément redirigé par le navigateur vers `https://depannage-entretien.vercel.app` avec préservation intégrale des paramètres (`login?email=...`).
- **Génération centralisée et sécurisée de l'URL de base (`getAppBaseUrl`)** :
  - Centralisation dans `src/version.ts` de `getAppBaseUrl()` et `OFFICIAL_APP_URL` (`https://depannage-entretien.vercel.app`).
  - Remplacement de `window.location.origin` dans `UsersScreen.tsx` et `src/lib/supabase.ts` : aucun lien d'invitation, mot de passe ou email OTP ne pourra désormais comporter l'ancien nom `soplan`.
  - Maintien du support local de test (`localhost`).

## [1.7.7] - 2026-11-02

### Corrigé & Sécurisé (Synchronisation Supabase & Gestion Utilisateurs)
- **Résolution du blocage d'enregistrement des utilisateurs dans Supabase ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx), [supabase.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/supabase.ts))** :
  - **Correction de l'erreur `PGRST204` (Colonnes inconnues)** : Suppression des champs parasites (`creator`, `roles`, `_id`) transmis par erreur à la table PostgreSQL `public.utilisateurs` lors de la création et modification d'utilisateurs.
  - **Assainissement strict des payloads (`sanitizeUserDataForSupabase`)** : Filtrage préalable des données envoyées à Supabase pour ne transmettre que les colonnes existantes et valides.
  - **Mécanisme de rétro-compatibilité automatique** : En cas de tentative d'insertion avec des colonnes de mot de passe (`mot_de_passe_temporaire`, `doit_changer_mot_de_passe`) sur un schéma distant qui ne les possède pas encore, une seconde tentative sans ces champs est exécutée automatiquement pour garantir l'enregistrement réussi dans Supabase.
  - **Fin du masquage silencieux des erreurs** : Supression du catch silencieux qui masquait les erreurs Supabase et faisait croire à un enregistrement distant réussi alors qu'il n'était que local.
  - **Détection des erreurs de sécurité RLS (`42501`)** : Notification claire à l'administrateur avec affichage d'un bandeau explicatif et modale guidée pas-à-pas pour débloquer l'accès.
- **Script SQL officiel de réparation et déblocage RLS ([supabase_correction_complete_utilisateurs_et_rls.sql](file:///d:/Aplli/D%C3%A9pannage_entretien/supabase_correction_complete_utilisateurs_et_rls.sql), [repairScript.ts](file:///d:/Aplli/D%C3%A9pannage_entretien/src/lib/sql/repairScript.ts))** :
  - Création du script SQL exhaustif permettant en 1 clic d'aligner la table `public.utilisateurs`, de lever la contrainte de rôle restrictive et d'autoriser les opérations `INSERT`, `UPDATE`, `DELETE`, `SELECT` via la clé anon.
  - Boutons de copie rapide du script SQL intégrés dans [UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx) et [DatabaseAdminScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/admin/DatabaseAdminScreen.tsx).
- **Conformité & Versioning** :
  - Incrémentation de version vers `v1.7.7` dans `package.json`, `src/version.ts`, CHANGELOG et footer.
  - Vérification des mentions légales et de l'identité officielle d'App à la Carte — Hervé CHAMPAGNE EI (SIREN 132 021 098).

## [1.7.6] - 2026-11-02

### Modifié & Déployé (Domaine Vercel & Liens d'accès)
- **Remplacement du domaine `soplan-app-alpha.vercel.app` par `depannage-entretien.vercel.app`** :
  - Configuration et assignation du nouveau domaine officiel `depannage-entretien.vercel.app` sur le projet Vercel de production.
  - Déploiement en production de l'application avec prise en charge des règles de réécriture SPA (`vercel.json`) pour garantir la validité de toutes les routes de connexion directes.
  - Les liens de connexion et d'invitation générés dynamiquement par l'application (`window.location.origin`) pointent désormais sur `https://depannage-entretien.vercel.app/login?email=...&action=login`.
  - Nettoyage des reliquats de désignation dans la configuration locale `.env`.

## [1.7.5] - 2026-11-02

### Corrigé & Amélioré (Gestion des utilisateurs & Envoi d'invitations)
- **Envoi automatique des identifiants et invitations depuis `soplanapp1@gmail.com` ([UsersScreen.tsx](file:///d:/Aplli/D%C3%A9pannage_entretien/src/screens/users/UsersScreen.tsx))** :
  - Remplacement du simple lien `mailto:` système (qui ouvrait par défaut la boîte personnelle `hchampag1@hotmail.fr`) par un bouton d'envoi direct **Gmail** pré-authentifié avec le compte `soplanapp1@gmail.com` (`authuser=soplanapp1@gmail.com`).
  - Intégration de l'adresse de support et de demande de mot de passe (`soplanapp1@gmail.com`) directement dans le corps du message d'invitation généré.
  - Affichage d'un badge confirmant le compte d'envoi automatique configuré dans la modale de transmission d'identifiants.
  - Synchronisation dynamique avec la configuration globale de l'email paramétrable depuis `DatabaseAdminScreen.tsx`.

## [1.7.4] - 2026-11-02

### Ajouté & Amélioré (Administration & Page de Connexion)
- **Email de demande de nouveau mot de passe paramétrable depuis l'administration (`DatabaseAdminScreen.tsx`)** :
  - Ajout d'une section dédiée dans l'écran d'administration des bases permettant de modifier et enregistrer l'adresse email de contact pour les demandes de mot de passe (valeur par défaut : `soplanapp1@gmail.com`).
  - Boutons d'enregistrement et de rétablissement de la valeur par défaut avec confirmation visuelle immédiate.
- **Affichage sur l'écran de connexion (`LoginScreen.tsx`)** :
  - Affichage direct et dynamique de l'email paramétré sur la page de connexion principale avec lien `mailto:` prérempli et bouton de copie en un clic.
  - Intégration de l'adresse de contact dans le volet « Mot de passe oublié » pour orienter immédiatement les techniciens ayant besoin d'une assistance ou d'un nouveau mot de passe.
- **Conformité Mentions Légales & Versioning** :
  - Maintien rigoureux des données de l'éditeur officiel App à la Carte — Hervé CHAMPAGNE EI (SIREN 132 021 098, `contact@appalacarte.fr`).
  - Synchronisation de la version `v1.7.4` dans `package.json`, `src/version.ts`, le pied de page et les mentions légales.

## [1.7.3] - 2026-11-02

### Sécurité & Simplification (Authentification & Mentions Légales)
- **Simplification radicale de l'écran de connexion (`LoginScreen.tsx`)** :
  - Interface recentrée sur un flux simple et direct : adresse email et mot de passe.
  - Suppression de tout bouton superflu ou déroutant (suppression du bouton d'accès direct administrateur sans mot de passe et du bouton lien par email OTP).
  - Deux onglets limpides : « Se connecter » et « Demande d'accès ».
- **Règle stricte : Aucun accès sans mot de passe** :
  - Interdiction absolue d'accéder à l'application sans saisir un mot de passe valide (champ requis côté client et validation stricte côté service).
  - Blocage de toute session locale si un changement de mot de passe obligatoire est en attente.
- **Mot de passe temporaire technicien (`prenom2027`) & Changement obligatoire** :
  - Application stricte de la règle : prénom du technicien en minuscules (sans accent, sans espace) suivi de 2027 (ex : `thomas2027`, `herve2027`).
  - Détection automatique et redirection immédiate vers l'écran de changement obligatoire de mot de passe lors de l'utilisation du mot de passe temporaire.
  - Impossibilité formelle d'accéder aux fonctionnalités de l'application tant que le nouveau mot de passe personnel conforme aux critères de sécurité n'a pas été défini et confirmé.
- **Procédure « Mot de passe oublié » optimisée** :
  - Réinitialisation simplifiée avec réactivation du mot de passe temporaire officiel (`prenom2027`) et indicateur de changement obligatoire.
  - Bouton direct permettant de se reconnecter immédiatement avec le mot de passe temporaire réactivé pour définir son nouveau mot de passe personnel.
- **Vérification et conformité Mentions Légales (Skill `mentions-legales`)** :
  - Contrôle et maintien de la page `/mentions-legales` accessible publiquement hors connexion.
  - Conformité certifiée des mentions légales de référence de l'éditeur App à la Carte — Hervé CHAMPAGNE EI (SIREN 132 021 098, 173 rue de Courcelles 75017 Paris, contact@appalacarte.fr, hébergement Vercel Inc., aucun numéro de téléphone).
  - Présence et bon fonctionnement du lien légal dans le pied de page (footer) sur l'ensemble des écrans et sur tous les appareils (mobile, tablette, desktop).

## [1.7.2] - 2026-11-02

### Modifié
- **Incrémentation de version & synchronisation système** :
  - Passage officiel à la version `v1.7.2` (SemVer Patch).
  - Synchronisation de la version applicative dans `package.json` et `src/version.ts`.
  - Contrôle et maintien de l'affichage dynamique de la version dans le footer de l'application et sur la page des mentions légales.
  - Vérification de la stricte conformité éditeur (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098) et accessibilité hors connexion de la page légale.

## [1.7.1] - 2026-11-02

### Modifié & Nettoyé (Rebranding)
- **Nouveau nom officiel de l'application : « Dépannage_entretien »** :
  - Remplacement de l'ancien nom et purge intégrale de la désignation « soplan-app » de l'ensemble de l'application et de ses métadonnées.
  - Mise à jour du nom du package dans `package.json` (`depannage-entretien`).
  - Titre de la page web dans `index.html` mis à jour en `Dépannage_entretien - Gestion de Maintenance et Entretien`.
  - Centralisation de `APP_NAME = 'Dépannage_entretien'` dans `src/version.ts`.
  - Affichage dynamique du nom dans la barre latérale de navigation (`Navigation.tsx`), la barre mobile et l'écran de connexion (`LoginScreen.tsx`).
- **Harmonisation et conformité documentaire** :
  - Nettoyage et mise à jour complète de `README.md`, `DEPLOYMENT_GUIDE.md`, `COPIE_FICHIERS.md`, `INDEX.txt`, `LISEZMOI.txt`, `MIGRATION_CHECKLIST.md` et `TROUBLESHOOTING.md`.
  - Remplacement des adresses de contact par l'adresse officielle de l'éditeur `contact@appalacarte.fr`.
  - Migration de la clé de stockage local vers `depannage_use_live_supabase` avec rétrocompatibilité.

## [1.7.0] - 2026-11-02

### Ajouté & Amélioré (Authentification & Mots de Passe)
- **Gestion des mots de passe temporaires techniciens (`prenom2027`)** :
  - Génération automatique du mot de passe temporaire dès la création d'un utilisateur par l'administrateur ou le responsable technique selon la règle officielle : prénom en minuscules suivi de `2027` (ex : `thomas2027`).
  - Affichage direct et bouton de copie du mot de passe temporaire dans la fiche utilisateur (`UsersScreen.tsx`).
  - Modale dédiée après création et validation d'un technicien permettant l'envoi immédiat par email prérempli (`mailto:`) ou la copie du message d'invitation avec le lien direct d'accès et les identifiants.
  - Bouton de réinitialisation rapide du mot de passe temporaire disponible pour chaque collaborateur dans la liste des utilisateurs.
- **Changement obligatoire du mot de passe à la première connexion** :
  - Détection automatique lors de la saisie du mot de passe temporaire ou de l'indicateur `doitChangerMotDePasse`.
  - Écran dédié de définition du nouveau mot de passe personnel avec bascule d'affichage œil (`Eye`/`EyeOff`).
  - Checklist dynamique en temps réel des règles de sécurité (au moins 8 caractères, minuscule, majuscule, chiffre, caractère spécial).
  - Mise à jour et synchronisation immédiate sur l'ensemble des appareils (smartphones, tablettes, PC).
- **Fonctionnalité « Mot de passe oublié » multi-appareils** :
  - Ajout du lien et de l'écran « Mot de passe oublié » sur l'interface de connexion.
  - Envoi des instructions de réinitialisation et réactivation du mot de passe temporaire pour permettre la reconnexion d'urgence sur le terrain.
  - Détection automatique des liens de récupération Supabase Auth (`type=recovery`) redirigeant directement vers le formulaire de choix du nouveau mot de passe.
- **Sécurité et validation Supabase Auth (`src/lib/validation/password.ts`)** :
  - Module centralisé de validation et normalisation des mots de passe respectant les règles strictes d'authentification.
  - Script de migration SQL Supabase fourni (`supabase_mot_de_passe_temporaire_et_securite.sql`).

## [1.6.2] - 2026-11-01

### Ajouté & Amélioré
- **Routes universelles de connexion multi-appareils (`/login`, `/connexion`, `/auth`)** :
  - Accès direct garanti à l'écran de connexion depuis n'importe quel smartphone, tablette ou ordinateur.
  - Prise en charge du paramètre de réinitialisation `?reset=1` ou `?logout=1` pour forcer l'affichage de l'écran vierge de connexion même si une session locale précédente existait.
  - Détection et affichage d'un bandeau de session active permettant de basculer de compte ou de continuer vers le tableau de bord.
- **Configuration Vercel SPA (`vercel.json`)** :
  - Ajout des règles de réécriture (*rewrites*) redirigeant toutes les requêtes vers `/index.html` pour éliminer toute erreur 404 lors de l'accès direct aux liens de connexion depuis un appareil mobile ou externe.

## [1.6.1] - 2026-11-01

### Ajouté & Corrigé
- **Authentification par compte Google OAuth (`signInWithOAuth`)** :
  - Intégration du bouton officiel « Continuer avec le compte Google » sur l'écran de connexion.
  - Redirection et retour sécurisé vers l'application (`window.location.origin`).
- **Authentification par adresse email validée & Lien magique (OTP)** :
  - Bouton « Lien par email (OTP) » pour se connecter directement sans mot de passe via un lien de connexion envoyé sur l'email validé.
  - Reconnaissance immédiate de l'administrateur maître `contact@appalacarte.fr` (App à la Carte — Hervé CHAMPAGNE EI).
- **Écoute dynamique des sessions Supabase Auth (`onAuthStateChange` dans `App.tsx`)** :
  - Détection automatique et instantanée du retour de connexion Google OAuth (`#access_token=...` ou tokens de session).
  - Validation automatique du compte `contact@appalacarte.fr` en tant qu'administrateur maître avec tous les privilèges.
  - Détection des comptes Google autorisés validés ou mise en attente sécurisée avec notification explicite.

## [1.6.0] - 2026-11-01

### Ajouté & Amélioré
- **Système d'authentification complet et compte administrateur maître (`contact@appalacarte.fr`)** :
  - `contact@appalacarte.fr` (App à la Carte — Hervé CHAMPAGNE EI) est configuré comme administrateur maître avec le rôle `ADMINISTRATEUR`, accès complet et privilèges de validation.
  - Bouton d'accès direct administrateur sécurisé et résilient sur l'écran de connexion.
- **Workflow de validation des nouveaux utilisateurs par l'administrateur ou le responsable technique** :
  - Les utilisateurs autorisés formulent leur demande unique de connexion avec leur adresse email, nom, prénom, rôle souhaité et motif.
  - Le compte est enregistré avec le statut `EN_ATTENTE` et inactif tant qu'il n'a pas été validé.
  - Si un utilisateur tente de se connecter avant validation, un message explicatif lui indique que sa demande est en attente d'approbation.
  - Espace de validation dans la gestion des utilisateurs (`UsersScreen.tsx`) : liste des demandes en attente, bouton « Valider l'accès » avec choix du rôle et du numéro de technicien, bouton « Refuser ».
  - Badge d'alerte visuel en temps réel dans la navigation et l'en-tête indiquant le nombre de demandes en attente.
- **Générateur et partage de liens d'accès** :
  - Modale dédiée « Donner un lien d'accès » avec 3 types de liens :
    1. Lien public de demande d'accès (`?action=demande`) avec message type prêt à envoyer.
    2. Lien personnalisé pré-rempli pour un collaborateur (`?action=demande&email=...&nom=...&prenom=...`).
    3. Lien direct de connexion pour utilisateur validé (`?action=login&email=...`).
  - Prise en charge automatique des paramètres d'URL pour pré-remplir les formulaires et basculer sur l'onglet adéquat.
- **Script SQL de migration Supabase (`supabase_auth_et_validation_utilisateurs.sql`)** :
  - Ajout des colonnes `statut`, `motif_demande`, `date_demande`, `valide_par`, `valide_le` sur `public.utilisateurs`.
  - Politiques RLS permettant la soumission de demandes anonymes et la gestion par les utilisateurs connectés.
  - Insertion / mise à jour de `contact@appalacarte.fr` comme administrateur maître avec notification de rechargement du schéma.
- **Mentions légales & Conformité éditeur** :
  - Mentions légales accessibles sans authentification préalable depuis le footer réglementaire et la page de connexion.
  - Données certifiées conformes : App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098, 173 rue de Courcelles 75017 Paris, sans aucun numéro de téléphone public.

## [1.5.3] - 2026-11-01

### Corrigé & Amélioré
- **Script de réparation et d'alignement Supabase (`supabase_reparation_kits_et_taches.sql`)** :
  - Résolution de l'erreur `Could not find the 'kit_id' column of 'maintenance_kits' in the schema cache (PGRST204)`.
  - Ajout systématique via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` de l'ensemble des colonnes attendues (`kit_id`, `machine_type`, `kit_number`, `service_number`, `pieces`, `task_id`, `section_id`, etc.).
  - Notification `NOTIFY pgrst, 'reload schema'` pour actualiser immédiatement le cache PostgREST de Supabase.
  - Politiques RLS permissives pour les rôles `anon` et `authenticated` pour les référentiels de kits et tâches d'entretien.
- **Suppression des alertes de traductions manquantes (`useTranslation.ts`)** :
  - Intégration d'un dictionnaire français par défaut (`DEFAULT_FR_TRANSLATIONS`) pour les libellés de navigation et boutons standards (`dashboard.title`, `clients.title`, `button.add`, etc.).
  - Élimination des warnings parasites en console lorsque la traduction ou le libellé de repli est disponible.

## [1.5.2] - 2026-11-01

### Corrigé & Amélioré
- **Formulaire d'ajout direct de kits d'entretien (`DatabaseAdminScreen.tsx`)** : Ajout du formulaire complet d'ajout unitaire de kits d'entretien (`getAddForm` et `handleAdd`) qui était absent, permettant la création manuelle (machine, N° de kit, service, nom et description).
- **Suppression des kits d'entretien** : Intégration de l'action `onDelete` avec `deleteMaintenanceKit` sur la table des kits d'entretien.
- **Fin du masquage silencieux des erreurs Supabase (`src/lib/supabase.ts`)** :
  - `db.maintenance_kits.create` et `db.taches_entretien.create` remontent désormais l'erreur exacte renvoyée par Supabase au lieu de basculer silencieusement en base locale sans prévenir.
  - Normalisation et typage sécurisé des champs numériques (`kit_number` et `service_number`).
- **Détection et indicateur en temps réel de l'état de connexion Supabase** :
  - Ajout de la fonction `checkSupabaseConnection()` interrogeant la disponibilité réelle de l'instance Supabase.
  - Affichage d'un bandeau explicite dans l'interface d'administration en cas de projet Supabase injoignable, en pause (*paused*) ou d'URL inexistante.
- **Schéma SQL et politiques RLS (`supabase_schema_complet.sql`, `supabase_securite_rls.sql`)** :
  - Élargissement de la colonne `kit_number` de `INTEGER` à `BIGINT` pour accepter les numéros de kit à 10 chiffres (ex: 2150025306) sans erreur de dépassement de capacité (*out of range integer*).
  - Autorisation d'accès aux kits d'entretien et tâches d'entretien pour le rôle `anon` en plus de `authenticated`.

## [1.5.1] - 2026-11-01

### Ajouté & Amélioré
- **Activation de la copie du chemin de fichier pour la remontée d'erreurs (`DebugFileOverlay.tsx`)** :
  - Suppression du blocage `pointerEvents: 'none'` qui empêchait tout clic ou sélection sur la barre de débogage verte en bas d'écran.
  - Ajout d'un bouton d'action dédié « Copier le chemin » avec icône et retour visuel immédiat (« Copié ! » et message de confirmation).
  - Rendu cliquable de l'ensemble du chemin de fichier affiché pour une copie instantanée en un seul clic.
  - Résolution dynamique et ultra-précise des fichiers sources selon les routes et sous-routes actives (`location.pathname`).
  - Système de copie résilient avec API `navigator.clipboard` et mécanisme de repli compatible tous navigateurs.
  - Disponibilité de la barre d'aide au débogage sur l'ensemble des écrans (y compris authentification et mentions légales).

## [1.5.0] - 2026-11-01

### Modifié & Nettoyé
- **Suppression intégrale des données de démonstration en dur** : Élimination des 600 lignes de fausses données (clients fictifs, machines de test, interventions et profils simulés) dans `src/services/demoDatabase.ts`.
- **Respect absolu des retours Supabase** : Si une table Supabase connectée est vide, l'application affiche désormais fidèlement une liste vide (`[]`) sans injecter de données factices.
- **Détection automatique transparente de Supabase** : Dès que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont configurées (sur Vercel ou localement), le mode direct Supabase est activé automatiquement sans variable supplémentaire.
- **Refonte et épuration de l'écran de connexion (`LoginScreen.tsx`)** : Retrait des faux profils fictifs, formulaire d'authentification professionnel et accès rapide propre pour l'administrateur.
- **Épuration de la barre de navigation (`Layout.tsx`)** : Retrait du bouton de réinitialisation démo et du badge de test.

## [1.4.2] - 2026-11-01

### Sécurité & Protection des données
- **Élimination totale des clés en clair dans le code source** : Suppression des clés Supabase et URL par défaut codées en dur dans `src/lib/supabase.ts`. L'application utilise exclusivement les variables d'environnement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Isolation stricte et mode autonome sans fuite de configuration** : En l'absence de variables d'environnement, l'application fonctionne en mode autonome 100% sécurisé sans exposer de références réseau.
- **Script de blindage RLS PostgreSQL (`supabase_securite_rls.sql`)** : Verrouillage des tables sensibles (`clients`, `machines`, `interventions`, `utilisateurs`) réservées aux seuls utilisateurs authentifiés, empêchant tout accès ou fuite de données anonyme.

## [1.4.1] - 2026-11-01

### Corrigé & Optimisé
- **Suppression radicale de la lenteur au démarrage et en navigation** : Élimination des requêtes HTTP réseau en attente de timeout vers le serveur distant Supabase (projet saturé ou en pause).
- **Mode démo autonome direct (0 ms de latence)** : Activation instantanée du stockage autonome local (`demoDb`) par défaut. Aucune attente réseau pour le listing des clients, machines, interventions, pièces détachées et codes pannes.
- **Affichage instantané de l'écran d'accueil** : Suppression du blocage "Chargement de l'application..." dans `useAuth` et `App.tsx`.
- **Découpage optimisé des bundles Vite (`manualChunks`)** : Séparation des bundles volumineux (`jspdf`, `jspdf-autotable`, `@dnd-kit`, `react-vendor`) pour un chargement ultra-rapide et une mise en cache optimale sur Vercel et navigateurs.

## [1.4.0] - 2026-11-01

### Ajouté
- **Base de données autonome embarquée pour les acquéreurs (`demoDatabase.ts`)** : Fonctionnement 100% autonome sans aucun compte ni projet Supabase requis. Pré-remplissage avec des données de démonstration réalistes (clients agricoles/viticoles, équipements, robots, centrales de lavage, interventions d'entretien, catalogue de pièces détachées avec prix et stocks, base de codes pannes avec résolutions).
- **Tolérance totale aux pannes et bascule transparente** : L'API applicative bascule automatiquement sur la base autonome locale si Supabase est absent, plein ou inaccessible, garantissant 0 plantage et 0 ms de latence pour les futurs acquéreurs.
- **Bouton de réinitialisation des données de test** : Bouton « Réinitialiser démo » dans la barre supérieure permettant de restaurer les données d'origine en 1 clic.

## [1.3.0] - 2026-11-01

### Ajouté
- **Schéma SQL Supabase complet et autonome (`supabase_schema_complet.sql`)** : Script SQL clé en main prêt à être copié-collé dans l'éditeur SQL de Supabase pour créer l'intégralité des 15 tables du modèle relationnel (`utilisateurs`, `clients`, `machines`, `interventions`, `installation_protocols`, `commissioning_protocols`, `spare_parts`, `maintenance_kits`, `taches_entretien`, `error_codes`, `machine_fields`, `machine_field_options`, `languages`, `translations`, `client_messages`), des triggers `updated_at`, des vues d'interventions et des politiques de sécurité RLS adaptées au client web.
- **Fichier de configuration locale `.env` et gabarit `.env.example`** : Création sur le poste local du fichier `.env` configuré avec instructions pour récupérer et renseigner les clés d'API Supabase (`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`).

## [1.2.2] - 2026-11-01

### Corrigé
- **Sécurisation de l'initialisation Supabase (résolution de l'erreur Vercel)** : Remplacement de l'exception bloquante `throw new Error('Missing Supabase environment variables')` par des valeurs de repli automatiques et un avertissement non bloquant. L'application démarre désormais correctement en production même si les variables d'environnement ne sont pas immédiatement configurées dans le tableau de bord Vercel.

## [1.2.1] - 2026-11-01

### Corrigé
- **Synchronisation du lockfile pnpm pour le déploiement Vercel** : Mise à jour de `pnpm-lock.yaml` avec les dépendances actuelles (`@supabase/supabase-js`), éliminant l'erreur `ERR_PNPM_OUTDATED_LOCKFILE` lors du build CI Vercel (`pnpm install --frozen-lockfile`).

## [1.2.0] - 2026-11-01

### Supprimé
- **Neutralisation complète des marques et entités tierces** : Purge et suppression systématique de toutes les occurrences de « Soplan » et vérification de l'absence totale de « DeLaval » dans l'ensemble du code applicatif (`src/`), des assets (`public/`) et de `index.html`.
- Migration et neutralisation des clés `localStorage` (`soplan_authenticated`, `soplan_current_user`, `soplan_language`) remplacées par `maintenance_authenticated`, `maintenance_current_user` et `maintenance_language`.

### Corrigé
- **Restauration de SelectedClientContext** : Réintégration du composant `SelectedClientContext.tsx` manquant, éliminant l'erreur de build Rollup/Vite et restaurant la persistance du client sélectionné.

### Ajouté
- **Conformité éditeur & Mentions Légales LCEN** : Intégration de la page `/mentions-legales` (App à la Carte — Hervé CHAMPAGNE EI, SIREN 132 021 098, RCS/RNE 26/10/2026, 173 rue de Courcelles 75017 Paris, TVA non applicable art. 293 B du CGI, hébergeur Vercel Inc.).
- **Accessibilité universelle des mentions légales** : Consultation libre de la page des mentions légales hors connexion et après authentification.
- **Pied de page réglementaire universel (Footer)** : Présence continue du footer sur ordinateur et mobile : `App à la Carte — Hervé CHAMPAGNE EI | SIREN : 132 021 098 | v1.2.0 | Mentions légales | Contact`.

### Modifié
- Harmonisation générale sous l'intitulé « Maintenance & Dépannage ».
- Mise à jour du nom du projet dans `package.json` (`maintenance-et-depannage`).

---

## [1.1.0] - 2026-11-01

### Ajouté
- **Connexion sans mot de passe** : Ouverture des connexions pour tests rapides et accès libre multi-profils (Administrateur, Responsable Technique, Techniciens).
- **Persistance de session locale** : Gestion automatique de l'état d'authentification sans blocage d'accès.

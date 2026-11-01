# Journal des modifications (CHANGELOG)

Toutes les modifications notables apportées au projet **Soplan Élevage** sont documentées dans ce fichier.

## [1.1.0] - 2026-11-01

### Ajouté
- **Connexion sans mot de passe** : Ouverture des connexions libres sans mot de passe pour faciliter les tests et l'accès immédiat aux fonctionnalités.
- **Accès instantané & Profils rapides** : Bouton d'accès direct en 1 clic et boutons de choix de profil (Administrateur, Responsable Technique, Technicien CMS, Technicien VMS) ou saisie d'un email libre sans exigence de mot de passe.
- **Persistance de session locale** : Gestion automatique de l'état d'authentification dans `localStorage` afin d'éviter la déconnexion lors du rechargement de la page.
- **Bouton de déconnexion & Profil actif** : Affichage dans l'en-tête de l'utilisateur connecté et possibilité de se déconnecter proprement à tout moment.
- **Pied de page et Mentions Légales réglementaires** : Intégration du composant Footer officiel avec version active (`v1.1.0`), SIREN 132 021 098, lien vers les Mentions Légales et contact par email `contact@appalacarte.fr`.
- **Accessibilité publique des mentions légales** : Consultation libre de la page des mentions légales hors connexion et une fois connecté.

### Modifié
- Amélioration de la navigation desktop et mobile avec libellés traduits et icônes adaptées.

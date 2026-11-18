# HMG Global Business Solutions — site web (v3)

Version 3 du site : contenu et structure du PDF « Site HMG Global Business Solutions — Maquettes »
(textes, schémas numérotés et listes repris à l'identique), avec le design de la v2 (bleu nuit, lignes lumineuses).
Les informations entre crochets ([E-MAIL À CONFIRMER], [ADRESSE]…) sont volontairement visibles : à confirmer.
Site statique en **HTML + CSS**, avec un seul petit script (`js/rays.js`) pour l'animation du fond.

## Pages

| Fichier | Page |
|---|---|
| `index.html` | Accueil |
| `logistique.html` | Logistique & Transport |
| `sourcing.html` | Sourcing & Négoce |
| `conseil.html` | Conseil & Accompagnement |
| `a-propos.html` | À propos |
| `contact.html` | Contact & demande de devis |
| `mentions-legales.html` | Mentions légales |
| `confidentialite.html` | Politique de confidentialité |

- Style commun : `css/hmg.css` (couleurs dans `:root`).
- Animation du fond : `js/rays.js`. Elle s'arrête automatiquement si le visiteur a désactivé les animations.
- Menu mobile en CSS pur (case à cocher cachée).

## Images

Les images du dossier `assets/` sont celles de l'ancien site. Elles sont en petite résolution
(358 à 733 px de large) : remplacez-les par des versions d'au moins 1600 px de large
**en gardant les mêmes noms de fichiers**.

## À compléter avant la mise en ligne

- **Mentions légales** : les informations entre crochets (adresse complète, immatriculation, directeur de la publication, hébergeur).
- **Politique de confidentialité** : texte de base à faire valider.
- **Formulaire de contact** : brancher l'attribut `action` du formulaire sur un service d'envoi (Formspree, script PHP…).
- **Versions EN et 中文** : les liens du sélecteur de langue ne mènent encore nulle part.
- **Domaine** : les balises `canonical` pointent vers `hmgglobalgroup.com`.

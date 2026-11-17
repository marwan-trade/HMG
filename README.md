# HMG Global Business Solutions — site web

Site vitrine statique en **HTML + CSS** (aucun JavaScript, aucune dépendance).

## Pages

| Fichier | Page |
|---|---|
| `index.html` | 01 Accueil |
| `logistique.html` | 02 Logistique & Transport |
| `sourcing.html` | 03 Sourcing & Négoce |
| `conseil.html` | 04 Conseil & Accompagnement |
| `a-propos.html` | 05 À propos |
| `contact.html` | 06 Contact |

Tout le style est dans `css/style.css` (couleurs dans `:root`).
Le menu mobile fonctionne en CSS pur (case à cocher cachée).

## Images

Les images du dossier `images/` ont été reconstruites à partir de la maquette
(texte incrusté effacé, puis agrandissement). Elles sont en basse définition :
remplacez-les par des photos HD (au moins 1920 px de large pour les `hero-*`)
**en gardant les mêmes noms de fichiers**, sans toucher au code.

| Fichier | Utilisation |
|---|---|
| `hero-accueil.jpg` … `hero-apropos.jpg` | Bannières des pages |
| `carte-logistique.jpg`, `carte-sourcing.jpg`, `carte-conseil.jpg` | Cartes « Nos services » de l'accueil |
| `produit-*.jpg` | Exemples de produits (page Sourcing) |

## À compléter

- **Formulaire de contact** : il ouvre actuellement la messagerie du visiteur
  (`mailto:`). Pour un envoi direct, branchez l'attribut `action` du formulaire
  sur un service d'envoi (Formspree, script PHP, etc.).
- **Version anglaise** : le lien `EN` du menu ne mène encore nulle part.

## Aperçu local

Ouvrez simplement `index.html` dans un navigateur.

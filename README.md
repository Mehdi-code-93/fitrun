# FitDash – Tableau de bord de suivi d’activité (statique)

Version statique en JavaScript vanilla avec Web Components, localStorage et Chart.js.

## Lancer localement

1. Ouvrir `index.html` dans un navigateur moderne (Chrome/Edge/Firefox). Pour éviter les soucis de modules ES, lancez un petit serveur statique, par exemple:

```bash
python3 -m http.server 5173
```

2. Inscrivez-vous via l’écran `Connexion` (les données sont stockées dans localStorage).

## Fonctionnalités
- Authentification locale (inscription/connexion) – statique
- Gestion des entraînements: ajout, édition, suppression, filtrage par catégorie
- Tableau de bord: KPI hebdomadaires, camembert par catégorie, courbes calories/minutes (8 semaines)
- Objectifs hebdomadaires (séances, calories) et alertes
- Paramètres utilisateur (poids, taille, âge) utilisés pour le calcul des calories
- UI responsive basique

## Outils
- Web Components (sans framework)
- Chart.js (CDN)
- Stockage localStorage (en attendant Supabase)

## Formule de calories
Calories = MET × poids(kg) × durée(heures)

MET approximatifs: Musculation=5, Cardio=10, Yoga=3, Natation=8.

## Migration vers Supabase (prochaine étape)
- Remplacer localStorage par Supabase (auth, profils, entraînements, objectifs)
- Realtime pour mettre à jour les graphiques en direct
- Règles RLS pour isoler les données par utilisateur

## Binôme
- Nom Prénom 1 – email
- Nom Prénom 2 – email

## Licence
MIT

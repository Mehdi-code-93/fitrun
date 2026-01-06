JavaScript
Tableau de bord de suivi d’activité physique
Vous allez créer un tableau de bord personnel de suivi d’activité physique qui permettra aux utilisateurs de :
enregistrer leurs séances d’entraienement,
suivre leurs performances,
visualiser leurs progrès avec des graphiques,
définir des objectifs et recevoir des alertes.
L’idée est de travailler :
les web components
Supabase
Chart.js
Ces 3 outils sont obligatoires.
Vous pouvez utiliser tout autre outil Javascript, hors frameworks et Typescript.
Ce projet est à réaliser en binôme.
Fonctionnalités principales
Authentification
Connexion avec un email et un mot de passe
Inscription avec un email et un mot de passe
Gestion des entrainements
Ajout, modification, suppression d’une séance d’entrainement (type, durée, date, commentaire, etc).
Catégorisation des activités (musculation, cardio, yoga, etc).
Historique des séances d’entrainement
Tableau de bord
Camembert en temps réel des activités par catégorie
Ce graphique doit être mis à jour en temps réel, c’est à dire à chaque ajout de séance d’entrainement.
Estimation des calories brûlées et du temps passé à l’entraînement (courbes par exemple)
Ces estimations doivent être calculées en fonction des activités enregistrées et des paramètres de l’utilisateur (poids, taille, âge, etc).
Filtre des activités par catégorie (musculation, cardio, yoga, etc).
Objectifs
Il doit être possible de définir des objectifs de performance (nombre de calories brûlées, nombre de séances par semaine, etc).
Les objectifs doivent être affichés dans le tableau de bord suite à leur création ou modification, et être visible dès que l’on se connecte à l’application.
Des alertes doivent être affichées si l’utilisateur ne respecte pas ses objectifs.
Calcul des calories brûlées et du temps passé à l’entraînement : Calories = MET * poids (kg) * durée (heures)
MET est un coefficient qui varie en fonction de l’activité et qui désigne le nombre de calories brûlées par kilogramme de poids par heure.
Voici quelques exemples de MET :
Musculation : 5
Cardio : 10
Yoga : 3
Natation : 8
Bonus
Voici quelques exemples de bonus possibles :
Système de badges de récompense pour les objectifs atteints ou dépassés,
Alerte lorsqu’un objectif est atteint ou dépassé envoyée par email Resend  ou Brevo ,
Rappel des objectifs à atteindre dans le tableau de bord (restant à atteindre sur la semaine par exemple).
Rendus
Ce devoir est à rendre au plus tard le mercredi 07 janvier 2026 à 23h59.
Vous devrez me partager votre devoir sur Github (identifiant : yoanncoualan) ou m’envoyer le lien de votre repo publique par email (yoanncoualan@gmail.com).
Vous devrez me fournir :
votre code complet,
un accès à votre base Supabase,
le nom et prénom des membres du groupe dans le README.
La propreté du code et des commentaires pertinents seront également évalués (4 points) ainsi que l’UX et l’UI (6 points).
Vous présenterez votre projet lors d’une soutenance le jeudi 8 janvier 2026 a partir de 9h45.
Chaque binome aura 20 mibutes de présentation maximum, suivi de 10 minutes maximum d’échange sur votre projet.
L’objectif de votre soutenance est de présenter :
votre projet (démonstration fonctionnelle),
l’organisation du code avec une démonstration des choix techniques,
les difficultés rencontrées et les solutions apportées,
les perspectives d’amélioration,
un morceau de code qui vous semble pertinent.

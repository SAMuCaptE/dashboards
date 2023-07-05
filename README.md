# Tableaux de bord

Projet rapide pour générer des tableaux de bord au lieu de se battre avec les marges dans Word.

## Pour générer un tableau de bord

- Générer un token [ici](https://app.clickup.com/9003057443/settings/apps)
- Créer le fichier `./server/.env` et insérer le code suivant:

```bash
API_KEY=INSERER_LE_TOKEN_ICI    # Pour accéder à l'api ClickUp
HOURS_START_DATE=2023-05-11     # La date à partir de laquelle compter les moyennes
HOURS_WEEKLY_OFFSET=0           # Le nombre de semaines à soustraire depuis la date de début des moyennes
```

## Pour générer un dashboard

- Remplir le document JSON avec les données appropriées (`./fields/[session]/[AAAA-MM-JJ]/data.json`).
- Les champs communs peuvent être édités directement sur le site web.
- ~~Ajouter les images requises avec le nom approprié.~~
- Sélectionner la date de remise sur le site.
- Imprimer en pdf.

## Pour modifier

Nécessite [NodeJS](https://nodejs.org/en).

**Application client**

```sh
cd app
npm i
npm run dev
```

Ceci démarrera l'app sur [http://localhost:3000](http://localhost:3000).

**Serveur**

```sh
cd server
npm i
npm run dev
```

Ceci démarrera le serveur pour obtenir les données sur [http://localhost:16987](http://localhost:16987).

## Ce qu'il reste à faire selon le guide étudiant

- [x] Nom du projet ou de l’équipe
- [x] Date et heure de la rencontre
- [x] Photos des membres avec leur nom et responsabilités
- [x] Objectif du projet (sommaire – maximum sur deux lignes)
- [x] Objectifs de réalisation pour la session (sommaire – maximum sur deux lignes)
- [x] Ordre du jour (spécifique aux points à aborder durant la rencontre)
- [x] Période couverte pour les activités rapportées dans le tableau de bord
- [ ] ~~Gestion traditionnelle~~
  - [ ] ~~Courbe en S (semaine et projet)~~
  - [ ] ~~Donner un pourcentage de l’état d’avancement de chaque partie de votre système en construction. Vous pouvez le faire avec du texte, texte et graphique ou sur le diagramme de votre système~~
  - [ ] ~~Tâches accomplies dans la semaine~~
  - [ ] ~~Tâches à faire dans la prochaine semaine~~
- [x] Gestion agile
  - [x] Burndown chart (sprint, release)
  - [x] Tâches accomplies dans la semaine ou dans le sprint
  - [x] Tâches à faire dans la prochaine semaine ou dans le sprint
- [x] Sommaire des heures de la semaine et en moyenne faites par chaque membre
  - [x] Séparation des heures selon chaque catégorie (élec, info, mec, gestion,autre)
- [ ] ~~Répartition du temps passé par chaque membre à réaliser les activités rattachées à ses responsabilités dans l’équipe, avec une description/explication justifiant l’ampleur du travail réalisé~~
- [x] Taux d’atteinte des objectifs du projet pour la session (** --> via les epics**)
- [x] Suivi des risques avec les moyens pour les annuler ou les atténuer
- [ ] Suivi sur les protocoles d’essais (à rédiger, en révision, réalisé)
- [x] État des dépenses
- [x] Problèmes rencontrés
- [x] Identification des sujets et des présentateurs pour la rencontre hebdomadaire technique de la semaine

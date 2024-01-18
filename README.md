# Tableaux de bord

Projet ~~rapide~~ pour générer des tableaux de bord au lieu de se battre avec les marges dans Word.

## Utilisation

1. Naviguer [ici](https://samucapte.github.io/dashboards/).
1. Sélectionner la date de remise.
1. Mettre les champs à jour (certains nécessiteront de modifier les valeurs dans Mongo)
1. Imprimer le pdf.

## Pour générer un tableau de bord

- Générer un token [ici](https://app.clickup.com/9003057443/settings/apps)
- Créer le fichier `./server/.env` et insérer le code suivant:

```bash
API_KEY=INSERER_LE_TOKEN_ICI    # Pour accéder à l'api ClickUp
HOURS_START_DATE=2023-05-11     # La date à partir de laquelle compter les moyennes
HOURS_WEEKLY_OFFSET=0           # Le nombre de semaines à soustraire depuis la date de début des moyennes

DATABASE_CONNECTION_STRING=mongodb+srv://<username>:<password>@<cluster_url>/?retryWrites=true&w=majority
DEFAULTS_OBJECT_ID=             # Id de la collection comprenant les éléments communs
EMPTY_DATA_OBJECT_ID=           # Id de la collection comprenant les valeurs par défaut d'un tableau de bord
```

- Créer le fichier `./app/.env` et insérer le code suivant:

```bash
VITE_APP_SERVER_URL=http://localhost:16987
```

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

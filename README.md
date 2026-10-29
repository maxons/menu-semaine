# Menu Semaine

Application web pour créer facilement des menus de repas à la semaine.

## Fonctionnalités

- **Gestion des plats** : ajoute les plats que tu aimes, avec leurs ingrédients.
- **Génération de menu** : l'app pioche dans ta liste de plats pour composer la semaine, avec une probabilité qui favorise les plats non servis récemment (demi-vie de 14 jours).
- **Repas verrouillés** : force certains repas (🔒) pour qu'ils ne soient pas modifiés lors d'une génération, ou choisis manuellement un plat.
- **Re-roll par repas** : change un seul repas sans toucher au reste (⟳).
- **Liste de courses** : consolidation automatique des ingrédients de tous les plats de la semaine (fusion des doublons et des quantités par unité).

Les données sont stockées localement (localStorage) — aucun compte requis, fonctionne hors ligne.

## Démarrage

```bash
npm install
npm run dev
```

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Compilation TypeScript + build production |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run lint` | Lint (oxlint) |

## Architecture

```
src/
├── core/            # Logique métier pure, testable sans navigateur
│   ├── types.ts     # Dish, Menu, Meal, Ingredient…
│   ├── generator.ts # Générateur de menu pondéré
│   ├── shopping.ts  # Agrégation de la liste de courses
│   └── storage.ts   # Interface StorageAdapter
├── adapters/
│   └── localStorage.ts # Implémentation localStorage (remplaçable par API/SQLite)
├── store/
│   └── menuStore.ts    # État global Zustand
└── components/      # UI React (DishManager, WeeklyMenu, ShoppingList)
```

Le module `core/` n'a aucune dépendance au framework ni au DOM : le générateur
probabiliste et la consolidation d'ingrédients sont couverts par des tests
unitaires purs. Le stockage passe par l'interface `StorageAdapter`, ce qui
permettra de basculer vers une API REST (sync multi-appareils) ou SQLite
(packaging Android via Capacitor) sans toucher aux composants.

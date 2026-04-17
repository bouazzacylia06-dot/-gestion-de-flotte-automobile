# FleetManager — Frontend React

Interface web SPA pour la gestion de flotte automobile (Semaine 6 — M1 GIL Rouen).

## Prérequis

- Node.js ≥ 18
- npm ≥ 9
- Backend en cours d'exécution (services + api-gateway sur :4000)
- Keycloak démarré sur :8080 avec le realm `flotte`

## Variables d'environnement

Copie `.env.example` en `.env` :

```bash
cp .env.example .env
```

| Variable                  | Valeur par défaut                      |
|---------------------------|----------------------------------------|
| `VITE_KEYCLOAK_URL`       | `http://localhost:8080`                |
| `VITE_KEYCLOAK_REALM`     | `flotte`                               |
| `VITE_KEYCLOAK_CLIENT_ID` | `flotte-app`                           |
| `VITE_GRAPHQL_URL`        | `http://localhost:4000/graphql`        |
| `VITE_API_URL`            | `http://localhost:4000`                |

## Démarrage en développement

```bash
cd frontend
npm install
npm run dev
```

L'app sera disponible sur [http://localhost:5173](http://localhost:5173).  
Keycloak redirigera automatiquement vers la page de login (`login-required`).

## Comptes de test

| Utilisateur | Mot de passe | Rôle        |
|-------------|--------------|-------------|
| `admin`     | `admin`      | admin       |
| `manager`   | `manager`    | manager     |
| `technicien`| `technicien` | technicien  |
| `utilisateur`| `utilisateur`| utilisateur |

## Build de production

```bash
npm run build
```

Le dossier `dist/` contient le bundle statique prêt pour nginx.

## Docker

```bash
docker build -t fleet-frontend .
docker run -p 80:80 fleet-frontend
```

Ou via Docker Compose depuis la racine du monorepo :

```bash
docker compose up frontend
```

## Tests E2E Cypress

```bash
# Mode interactif (UI)
npm run cypress:open

# Mode headless (CI)
npm run cypress:run
```

Les 4 suites E2E :

| Fichier           | Couverture                                |
|-------------------|-------------------------------------------|
| `auth.cy.js`      | Login SSO Keycloak, logout, rôles         |
| `vehicles.cy.js`  | Listing, création (admin), RBAC bouton    |
| `rbac.cy.js`      | Accès refusé par rôle (/conducteurs, etc.)|
| `map.cy.js`       | Initialisation carte Leaflet              |

## Architecture

```
src/
├── auth/          — Keycloak Provider, ProtectedRoute, useAuth hook
├── api/           — Apollo Client (JWT authLink), queries GraphQL
├── hooks/         — useVehicles, useLocalisation, useMaintenances
├── components/
│   ├── layout/    — Navbar, Sidebar (filtrage par rôle)
│   ├── map/       — FleetMap, VehicleMarker (couleur statut), TrajectoryLayer
│   ├── vehicles/  — VehicleCard, VehicleForm, VehicleList (paginé)
│   ├── maintenance/ — MaintenanceTable, MaintenanceForm, MaintenanceBadge
│   └── dashboard/ — StatsCard, AlertsWidget, ActivityChart (Recharts)
└── pages/         — 8 pages RBAC-protégées
```

## Stack

- **React 18** + **Vite 5**
- **React Router v6** — SPA routing
- **keycloak-js** — SSO, token refresh automatique
- **Apollo Client 3** — GraphQL + JWT authLink
- **Leaflet + React-Leaflet** — carte GPS temps réel (polling 3s)
- **TailwindCSS 3** — utility-first styling
- **Recharts** — graphiques dashboard
- **Cypress 13** — tests E2E

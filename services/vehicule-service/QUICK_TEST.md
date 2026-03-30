# Vehicule Service - Pack Minimal de Test

## Reproduction complète en 5 étapes

### Prérequis
- Docker installé
- Node.js 18+ avec npm
- Port 55432 disponible (PostgreSQL de test)

---

## 1️⃣ Démarrer PostgreSQL local

```bash
docker rm -f fleet-pg-test >/dev/null 2>&1 || true
docker run -d \
	--name fleet-pg-test \
	-e POSTGRES_PASSWORD=postgres \
	-e POSTGRES_USER=postgres \
	-e POSTGRES_DB=fleet \
	-p 55432:5432 \
	postgres:16
```
✅ **Résultat attendu:** Container started, pas d'erreur Docker

---

## 2️⃣ Appliquer la migration SQL

```bash
docker exec -i fleet-pg-test \
	psql -U postgres -d fleet \
	< docs/bdd/fleet-microservices-sql/V001_initial_setup.sql
```
✅ **Résultat attendu:** Schéma appliqué, table `service_vehicles.vehicles` créée

---

## 3️⃣ Installer et lancer le service

```bash
cd services/vehicule-service
npm install
POSTGRES_HOST=127.0.0.1 \
POSTGRES_PORT=55432 \
POSTGRES_DB=fleet \
POSTGRES_USER=postgres \
POSTGRES_PASSWORD=postgres \
npm start
```
✅ **Résultat attendu:** `Server running on port 3000`

---

## 4️⃣ Tester le CRUD (dans un autre terminal)

### Créer un véhicule

```bash
curl -X POST http://127.0.0.1:3000/vehicles \
	-H "Content-Type: application/json" \
	-d '{"immatriculation":"AA-123-BB","marque":"Renault","modele":"Clio","statut":"AVAILABLE"}' \
	| jq '.'
```
✅ **Résultat attendu:** HTTP 201, ID généré en UUID

### Lister les véhicules

```bash
curl http://127.0.0.1:3000/vehicles | jq '.'
```
✅ **Résultat attendu:** HTTP 200, array avec au moins 1 véhicule

### Récupérer par ID

Remplace `{ID}` par l'UUID du véhicule créé:

```bash
curl http://127.0.0.1:3000/vehicles/{ID} | jq '.'
```
✅ **Résultat attendu:** HTTP 200, objet véhicule

### Mettre à jour

```bash
curl -X PUT http://127.0.0.1:3000/vehicles/{ID} \
	-H "Content-Type: application/json" \
	-d '{"immatriculation":"AA-123-BB","marque":"Renault","modele":"Clio V","statut":"MAINTENANCE"}' \
	| jq '.'
```
✅ **Résultat attendu:** HTTP 200, `statut` changé en `MAINTENANCE`

### Supprimer

```bash
curl -X DELETE http://127.0.0.1:3000/vehicles/{ID}
```
✅ **Résultat attendu:** HTTP 204, No Content

---

## ✅ Checklist de validation

| Opération | Code | Description |
|-----------|------|-------------|
| POST /vehicles | 201 | Création OK |
| GET /vehicles | 200 | Lister OK |
| GET /vehicles/:id | 200 | Récupération OK |
| PUT /vehicles/:id | 200 | Mise à jour OK |
| DELETE /vehicles/:id | 204 | Suppression OK |

---

## ⚠️ Cas d'erreur à vérifier

```bash
# UUID invalide dans l'URL → 400
curl http://127.0.0.1:3000/vehicles/invalid-uuid

# Statut invalide → 400
curl -X POST http://127.0.0.1:3000/vehicles \
	-H "Content-Type: application/json" \
	-d '{"immatriculation":"AA-111-CC","marque":"Peugeot","modele":"308","statut":"INVALID"}'

# Champ manquant → 400
curl -X POST http://127.0.0.1:3000/vehicles \
	-H "Content-Type: application/json" \
	-d '{"immatriculation":"AA-111-CC","marque":"Peugeot"}'

# Immatriculation déjà existante → 409
# (créer deux véhicules avec même immatriculation)

# ID inexistant → 404
curl http://127.0.0.1:3000/vehicles/00000000-0000-0000-0000-000000000000
```

---

## 🧹 Nettoyage

Arrêter le service:
```bash
# Ctrl+C dans le terminal npm start
```

Nettoyer le conteneur:
```bash
docker stop fleet-pg-test
docker rm fleet-pg-test
```

---

## 📚 Références

- Contrat API: [docs/api/véhicules-api.yaml](docs/api/véhicules-api.yaml)
- Migration SQL: [docs/bdd/fleet-microservices-sql/V001_initial_setup.sql](docs/bdd/fleet-microservices-sql/V001_initial_setup.sql)
- Service: [services/vehicule-service](.)

---

## 📋 Statuts HTTP attendus

- **200 OK**: GET, PUT réussis
- **201 Created**: POST réussi
- **204 No Content**: DELETE réussi
- **400 Bad Request**: Validation échouée (UUID invalid, statut invalide, champ manquant)
- **404 Not Found**: Ressource inexistante
- **409 Conflict**: Immatriculation déjà existante

# Infrastructure — Gestion de Flotte

Documentation de l'environnement d'infrastructure local pour le projet M1 GIL 2025-2026.

---

## Prérequis

- [Minikube](https://minikube.sigs.k8s.io/) v1.38+
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Helm](https://helm.sh/) v3.20+
- [Docker](https://www.docker.com/) v29+

---

## Architecture de l'infrastructure

| Service | Outil | Namespace / Réseau | Version |
|---|---|---|---|
| PostgreSQL | Helm (Bitnami) | `flotte-infrastructure` (Minikube) | 18.3.0 |
| Redis | Helm (Bitnami) | `flotte-infrastructure` (Minikube) | latest |
| Kafka | Docker Compose | réseau Docker `projet_default` | confluentinc/cp-kafka:7.6.0 |

> **Pourquoi Kafka n'est pas dans Minikube ?**
> Les images Bitnami Kafka (v4.0.0) sont indisponibles sur Docker Hub en raison d'un changement
> de politique Bitnami (août 2025). De plus, le réseau de certains FAI (Numericable) bloque
> les pulls Docker Hub via un proxy SSL qui invalide les certificats TLS.
> Kafka est donc déployé via Docker Compose avec l'image Confluent, qui n'est pas soumise
> à ces restrictions. Voir `helm/infra/kafka-values.yaml` pour la config Helm originale conservée
> à titre de référence.

---

## Structure des fichiers

```
helm/
└── infra/
    ├── postgresql-values.yaml      ← Config Helm PostgreSQL
    ├── redis-values.yaml           ← Config Helm Redis
    ├── kafka-values.yaml           ← Config Helm Kafka (référence, non utilisée)
    └── docker-compose.kafka.yml    ← Déploiement Docker de Kafka
```

---

## Installation

### 1. Démarrer Minikube

```bash
minikube start
```

### 2. Installer Helm

```bash
# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# macOS
brew install helm
```

### 3. Créer le namespace

```bash
kubectl create namespace flotte-infrastructure
```

### 4. Ajouter le repo Bitnami

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

### 5. Déployer PostgreSQL

```bash
helm install postgresql bitnami/postgresql \
  --namespace flotte-infrastructure \
  --values helm/infra/postgresql-values.yaml
```

### 6. Déployer Redis

```bash
helm install redis bitnami/redis \
  --namespace flotte-infrastructure \
  --values helm/infra/redis-values.yaml
```

### 7. Déployer Kafka (Docker Compose)

```bash
docker compose -f helm/infra/docker-compose.kafka.yml up -d
```

---

## Vérification

```bash
# PostgreSQL et Redis dans Minikube
kubectl get pods -n flotte-infrastructure
# Attendu :
# postgresql-0    1/1   Running
# redis-master-0  1/1   Running

# Tester PostgreSQL
kubectl exec -it postgresql-0 -n flotte-infrastructure -- \
  psql -U utilisateur_flotte -d flotte_db -c "\l"

# Tester Redis
kubectl exec -it redis-master-0 -n flotte-infrastructure -- \
  redis-cli ping
# Attendu : PONG

# Tester Kafka
docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list
# Attendu : liste vide (pas d'erreur)
```

---

## Informations de connexion

### PostgreSQL

| Paramètre | Valeur |
|---|---|
| Host (depuis Minikube) | `postgresql.flotte-infrastructure.svc.cluster.local` |
| Port | `5432` |
| Base de données | `flotte_db` |
| Utilisateur | `utilisateur_flotte` |
| Mot de passe | récupérer via la commande ci-dessous |

```bash
# Récupérer le mot de passe PostgreSQL
kubectl get secret --namespace flotte-infrastructure postgresql \
  -o jsonpath="{.data.password}" | base64 -d
```

Exemple de `DATABASE_URL` pour un microservice Node.js dans Minikube :
```
DATABASE_URL=postgresql://utilisateur_flotte:<MOT_DE_PASSE>@postgresql.flotte-infrastructure.svc.cluster.local:5432/flotte_db
```

### Redis

| Paramètre | Valeur |
|---|---|
| Host (depuis Minikube) | `redis-master.flotte-infrastructure.svc.cluster.local` |
| Port | `6379` |
| Auth | désactivée (dev local) |

### Kafka

| Paramètre | Valeur |
|---|---|
| Host (depuis Minikube) | `192.168.49.1:9092` |
| Host (depuis Docker) | `localhost:9092` |
| Port | `9092` |

> L'IP `192.168.49.1` est l'IP hôte par défaut de Minikube. Si elle change, la retrouver avec :
> ```bash
> minikube ssh -- route -n | grep '^0.0.0.0' | awk '{print $2}'
> ```

---

## Topics Kafka

<<<<<<< HEAD
Convention retenue :
- **Topic métier (pluriel)** : `vehicules`, `conducteurs`, `maintenances`, `localisations`, `alertes`
- **Type d'événement (payload)** : `entite.action` (exemples : `vehicule.cree`, `vehicule.modifie`, `vehicule.supprime`)

=======
>>>>>>> f6744b537b40886e59861b781c122c56d941867f
Les topics sont créés manuellement au premier démarrage si besoin :

```bash
docker exec kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --create --topic vehicules \
  --partitions 1 --replication-factor 1

docker exec kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --create --topic conducteurs \
  --partitions 1 --replication-factor 1

docker exec kafka kafka-topics \
  --bootstrap-server localhost:9092 \
<<<<<<< HEAD
  --create --topic maintenances \
=======
  --create --topic maintenance \
>>>>>>> f6744b537b40886e59861b781c122c56d941867f
  --partitions 1 --replication-factor 1

docker exec kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --create --topic localisations \
  --partitions 1 --replication-factor 1

docker exec kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --create --topic alertes \
  --partitions 1 --replication-factor 1

# Vérifier les topics créés
docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list
```

---

## Arrêt et redémarrage

```bash
# Arrêter Kafka
docker compose -f helm/infra/docker-compose.kafka.yml down

# Arrêter Minikube (PostgreSQL et Redis)
minikube stop

# Redémarrer tout
minikube start
docker compose -f helm/infra/docker-compose.kafka.yml up -d
```

> PostgreSQL et Redis redémarrent automatiquement avec Minikube grâce à la persistance des volumes.

---

## Dépannage

**PostgreSQL : `password authentication failed`**
Le mot de passe est stocké dans un Secret Kubernetes. Le récupérer avec la commande de la section connexion ci-dessus.

**Kafka : `Connection could not be established`**
Kafka met ~10-15 secondes à démarrer complètement. Attendre et relancer la commande.

**ImagePullBackOff sur les pods Kafka dans Minikube**
Ne pas essayer de déployer Kafka via Helm — utiliser uniquement `docker-compose.kafka.yml`.

**Minikube : pods en `Pending` après redémarrage**
```bash
minikube status
kubectl get pods -n flotte-infrastructure
```
Si les pods ne redémarrent pas, vérifier les ressources disponibles :
```bash
kubectl describe node minikube | grep -A 10 "Allocated resources"
```

# Runbook — Lancement des services (app + observabilité)

Ce document centralise les commandes pour démarrer rapidement les services du projet en local.

---

## 0) Prérequis

- Docker + Docker Compose
- kubectl
- Minikube
- Helm
- jq (optionnel, pour vérifications)

Depuis la racine du repo :

```bash
cd "/home/loic/Documents/Fac/Architecture distribuée/Version post semaine 6/-gestion-de-flotte-automobile"
```

---

## 1) Mode rapide — Application complète avec Docker Compose

Démarre l’infra + microservices + gateway + frontend + keycloak :

```bash
docker compose up -d --build
```

Vérifier l’état :

```bash
docker compose ps
docker compose logs -f gestion-flotte-gateway
```

URLs utiles :

- Frontend : http://localhost
- Gateway GraphQL/API : http://localhost:4000
- Keycloak : http://localhost:8080
- Feature Flags : http://localhost:3006

Arrêt :

```bash
docker compose down
```

> Remarque : ce compose lance l’application métier, mais pas la stack Grafana/Prometheus.

---

## 2) Mode Kubernetes — Microservices dans Minikube

Utilise le script du repo :

```bash
chmod +x start-microservices.sh
./start-microservices.sh
```

Vérifier :

```bash
kubectl get pods -A
kubectl get svc -A
```

---

## 3) Observabilité Kubernetes (Prometheus/Grafana/Loki/OTel)

### 3.1 Créer le namespace observabilité

```bash
kubectl create namespace flotte-observability --dry-run=client -o yaml | kubectl apply -f -
```

### 3.2 Ajouter les dépôts Helm

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update
```

### 3.3 Installer kube-prometheus-stack (inclut Grafana)

```bash
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  -n flotte-observability
```

### 3.4 Installer OpenTelemetry Collector (values du repo)

```bash
helm upgrade --install otel-collector open-telemetry/opentelemetry-collector \
  -n flotte-observability \
  -f helm/infra/otel-collector-values.yaml
```

### 3.5 Installer Loki (values du repo)

```bash
helm upgrade --install loki grafana/loki \
  -n flotte-observability \
  -f helm/infra/loki-values.yaml
```

### 3.6 Vérifier les composants observabilité

```bash
kubectl get pods -n flotte-observability
kubectl get svc -n flotte-observability
```

---

## 4) Appliquer règles Prometheus + Alertmanager

### 4.1 Règles Prometheus (alerts + recording rules)

```bash
kubectl apply -f k8s/observability/prometheus-rules.yaml
kubectl get prometheusrule -n flotte-observability
```

### 4.2 Configuration Alertmanager email

```bash
cp -n k8s/observability/.alertmanager.env.example k8s/observability/.alertmanager.env || true
# Éditer ensuite k8s/observability/.alertmanager.env
./k8s/observability/deploy-alertmanager.sh
```

---

## 5) Ouvrir les UIs observabilité (port-forward)

Prometheus :

```bash
kubectl port-forward -n flotte-observability svc/prometheus-kube-prometheus-prometheus 9090:9090
```

Grafana :

```bash
kubectl port-forward -n flotte-observability svc/grafana 3000:80
```

Si ce service n'existe pas (naming différent selon release Helm), lister puis adapter :

```bash
kubectl get svc -n flotte-observability | grep -i grafana
# puis utiliser le nom exact retourné, par ex.:
# kubectl port-forward -n flotte-observability svc/prometheus-grafana 3000:80
# kubectl port-forward -n flotte-observability svc/prometheus-kube-prometheus-grafana 3000:80
```

Alertmanager :

```bash
kubectl port-forward -n flotte-observability svc/prometheus-kube-prometheus-alertmanager 9093:9093
```

URLs :

- Prometheus : http://localhost:9090
- Grafana : http://localhost:3000
- Alertmanager : http://localhost:9093

---

## 6) Import des dashboards Grafana (MVP)

### 6.1 Test rapide (Kubernetes)

1. Lancer ces port-forwards (3 terminaux) :

```bash
# T1
kubectl port-forward -n flotte-observability svc/grafana 3000:80

# T2
kubectl port-forward -n flotte-observability svc/prometheus-kube-prometheus-prometheus 9090:9090

# T3
kubectl port-forward -n vehicule-ns svc/vehicule-service 18080:80
```

2. Générer du trafic (4e terminal) :

```bash
for i in {1..300}; do curl -s http://127.0.0.1:18080/health > /dev/null; done
```

3. Vérifier dans Prometheus (UI `http://localhost:9090` → `Graph`) :

```promql
sum by (exported_service) (increase(flotte_http_requests_total[10m]))
```

4. Ouvrir Grafana (`http://localhost:3000`) :

- Dashboard `Flotte - API SLI/SLO`
- Plage de temps `Last 1 hour`
- Variable `service = All`
- `Refresh`

Attendu : `RPS` et `Top routes` affichent des courbes ; les panels 5xx peuvent rester à 0.

### 6.2 Datasource + import (à faire une fois par instance Grafana)

1. `Connections` → `Add new connection` → `Prometheus`
2. URL : `http://prometheus-kube-prometheus-prometheus:9090`
3. `Save & test`
4. Importer :

- `k8s/observability/grafana/dashboards/flotte-infra-health.json`
- `k8s/observability/grafana/dashboards/flotte-api-sli-slo.json`
- `k8s/observability/grafana/dashboards/flotte-business-kpis.json`

Si Grafana demande un login :

```bash
kubectl get secret grafana -n flotte-observability -o jsonpath='{.data.admin-user}' | base64 -d; echo
kubectl get secret grafana -n flotte-observability -o jsonpath='{.data.admin-password}' | base64 -d; echo
```

### 6.3 Nouveau clone : faut-il refaire ?

Oui, généralement sur une nouvelle machine/environnement il faut refaire :

- déploiement K8s/Helm,
- datasource Grafana (une fois),
- import des dashboards (une fois),
- puis génération de trafic pour voir les courbes.

Non, pas besoin de refaire à chaque refresh : une fois configuré, Grafana conserve la datasource et les dashboards (tant que l’instance/volumes ne sont pas réinitialisés).

---

## 7) Commandes de diagnostic rapides

```bash
# État global
kubectl get pods -A

# Vérifier les règles Prometheus chargées
curl -s "http://localhost:9090/api/v1/rules" | jq '.data.groups[] | {name: .name, rules: [.rules[].name]}'

# Voir les cibles scrapées
curl -s "http://localhost:9090/api/v1/targets" | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'
```

---

## 8) Arrêt / nettoyage

Stack applicative Docker :

```bash
docker compose down
```

Observabilité (Helm) :

```bash
helm uninstall prometheus -n flotte-observability || true
helm uninstall otel-collector -n flotte-observability || true
helm uninstall loki -n flotte-observability || true
```

Minikube :

```bash
minikube stop
```

---

## 9) Tests de charge minimaux (K6 starter)

Pré-requis :

- Keycloak accessible (par défaut `http://127.0.0.1:8080`)
- Services accessibles (par défaut `vehicle=18081`, `conducteur=18082`)
- soit `k6` installé localement (`k6 version`), soit Docker disponible

Script prêt à l'emploi :

- `tests/k6/starter.js`


### 9.1 Préparer les endpoints en mode Kubernetes/Helm

Laisser ces commandes actives dans 2 terminaux séparés :

```bash
# T1
kubectl port-forward -n vehicule-ns svc/vehicule-service 18081:80

# T2
kubectl port-forward -n conducteur-ns svc/conducteur-service 18082:80
```

Si Keycloak n'est pas déjà lancé localement :

```bash
docker compose up -d keycloak
```

### 9.2 Lancer K6 (k6 local)

```bash
npm run test:k6:smoke
npm run test:k6:load
npm run test:k6:spike
```

### 9.3 Lancer K6 (sans installation locale, via Docker)

```bash
npm run test:k6:smoke:docker
npm run test:k6:load:docker
npm run test:k6:spike:docker
```

Variables utiles (override) :

```bash
KEYCLOAK_URL=http://127.0.0.1:8080 \
KEYCLOAK_REALM=flotte \
KEYCLOAK_CLIENT_ID=flotte-app \
KEYCLOAK_USERNAME=admin \
KEYCLOAK_PASSWORD=admin123 \
VEHICLE_URL=http://127.0.0.1:18081 \
CONDUCTEUR_URL=http://127.0.0.1:18082 \
PROFILE=smoke \
k6 run tests/k6/starter.js
```

### 9.4 Validation rapide attendue

- `checks` proche de `100%`
- `http_req_failed` proche de `0%`
- `GET /vehicles status 200` et `POST /conducteurs status 201` visibles dans le résumé K6

### 9.5 Dépannage (si `checks` très bas / `http_req_failed` élevé)

Si tu observes beaucoup d'échecs K6 en mode Helm/Minikube :

1. Vérifier les port-forwards toujours actifs (`18081`, `18082`).
2. Vérifier que `global.keycloakUrl` dans `helm/fleet-app/values-prod.yaml` pointe vers une URL joignable depuis les pods (ex. `http://192.168.49.1:8080` en local Minikube).
3. Vérifier la base SQL du `vehicule-service` : sans schéma `service_vehicles`, `GET /vehicles` retourne souvent `500`.

Initialisation SQL (une fois) :

```bash
kubectl exec -n flotte-infrastructure postgresql-0 -- bash -lc 'PGPASSWORD="archi_distribuée" psql -U utilisateur_flotte -d flotte_db -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"'
kubectl exec -n flotte-infrastructure postgresql-0 -- bash -lc 'PGPASSWORD="archi_distribuée" psql -U utilisateur_flotte -d flotte_db -f /dev/stdin' < db/init-vehicles.sql
```

Puis redéployer :

```bash
helm upgrade --install fleet-app ./helm/fleet-app \
  --namespace fleet-system --create-namespace \
  -f helm/fleet-app/values-prod.yaml \
  --wait --timeout 8m
```

Le starter exécute :

- récupération d'un token Keycloak en `setup()`
- `GET /vehicles` à chaque itération
- `POST /conducteurs` toutes les 10 itérations (charge légère d'écriture)

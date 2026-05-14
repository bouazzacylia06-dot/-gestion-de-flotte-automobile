# Glossaire Grafana / Prometheus — Gestion de flotte

Ce document recense les principaux termes utilisés dans les dashboards Grafana du projet, avec leur signification, leur intérêt opérationnel, une requête PromQL type et le type de panel conseillé.

## 1) SLI / SLO

- **SLI (Service Level Indicator)** : métrique qui mesure la qualité réelle d’un service (latence, erreurs, disponibilité).
- **SLO (Service Level Objective)** : objectif attendu pour un SLI (ex. erreur < 5%, latence p95 < 1s).

**Pourquoi c’est utile ?**
- Aligne la technique avec un niveau de service mesurable.
- Sert de base aux alertes et à la décision en incident.

**Exemples SLI de ce projet**
- Ratio d’erreur 5xx (fiabilité)
- Latence p95 (performance)

---

## 2) `up`

**Définition**
- Métrique Prometheus binaire par cible scrappée :
  - `1` = cible joignable
  - `0` = cible non joignable

**PromQL**
```promql
up{namespace="flotte-observability"}
```

**Panel conseillé**
- Time series (état dans le temps)
- Stat (compter les cibles UP)

---

## 3) Scrape duration collector

**Définition**
- Durée nécessaire à Prometheus pour récupérer les métriques de la cible (ici le collector OpenTelemetry).

**PromQL**
```promql
avg_over_time(scrape_duration_seconds{job="otel-collector-opentelemetry-collector"}[5m])
```

**Panel conseillé**
- Time series avec seuil warning/critical

---

## 4) Samples scraped

**Définition**
- Nombre d’échantillons de métriques collectés à chaque scrape.

**PromQL**
```promql
scrape_samples_scraped{job="otel-collector-opentelemetry-collector"}
```

**Panel conseillé**
- Time series

---

## 5) Panel "targets down"

**Définition**
- Panel qui affiche les cibles indisponibles (celles pour lesquelles `up == 0`).

**PromQL**
```promql
up{namespace="flotte-observability"} == 0
```

**Panel conseillé**
- Table (job, instance)
- Stat (nombre total de cibles down)

---

## 6) RPS (Requests Per Second)

**Définition**
- Nombre de requêtes HTTP par seconde.

**PromQL**
```promql
sum by (exported_service) (rate(flotte_http_requests_total[5m]))
```

**Panel conseillé**
- Time series par service

---

## 7) Taux 5xx

**Définition**
- Débit de réponses HTTP en erreur serveur (codes 500 à 599).

**PromQL (débit 5xx/s)**
```promql
sum by (exported_service) (rate(flotte_http_requests_total{status=~"5.."}[5m]))
```

**PromQL (ratio d’erreur 5xx)**
```promql
sum by (exported_service) (rate(flotte_http_requests_total{status=~"5.."}[5m]))
/
clamp_min(sum by (exported_service) (rate(flotte_http_requests_total[5m])), 0.001)
```

**Panel conseillé**
- Time series + seuil (ex. warning 2%, critical 5%)

---

## 8) Top routes

**Définition**
- Routes API les plus sollicitées sur une fenêtre de temps.

**PromQL**
```promql
topk(10, sum by (exported_service, route, method) (rate(flotte_http_requests_total[5m])))
```

**Panel conseillé**
- Bar chart (Top 10)
- Table (service, route, method, valeur)

---

## Mapping rapide terme → dashboard

- **Infra Health** : `up`, scrape duration, samples scraped, targets down
- **API SLI/SLO** : RPS, taux 5xx, ratio d’erreur, latence p95, top routes
- **Business** : véhicules par statut, maintenances en retard, alertes géofencing, lag Kafka

## Références du projet

- Requêtes PromQL prêtes à l’emploi : `k8s/observability/promql-queries.md`
- Règles et seuils d’alertes : `k8s/observability/prometheus-rules.yaml`
- Dashboards JSON fournis : `k8s/observability/grafana/dashboards/`

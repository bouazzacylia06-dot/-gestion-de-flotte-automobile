# PromQL utiles — Gestion de flotte

## 1) Santé infra (fonctionne immédiatement)

- Cibles down

```promql
up{namespace="flotte-observability"} == 0
```

- Cibles up

```promql
up{namespace="flotte-observability"}
```

- Durée de scrape du collector (moyenne 5 min)

```promql
avg_over_time(scrape_duration_seconds{job="otel-collector-opentelemetry-collector"}[5m])
```

- Nombre d'échantillons scrappés

```promql
scrape_samples_scraped{job="otel-collector-opentelemetry-collector"}
```

## 2) SLI API (après instrumentation métriques applicatives)

- Débit de requêtes/s

```promql
sum by (exported_service) (rate(flotte_http_requests_total[5m]))
```

- Débit d'erreurs 5xx/s

```promql
sum by (exported_service) (rate(flotte_http_requests_total{status=~"5.."}[5m]))
```

- Ratio d'erreur 5xx

```promql
sum by (exported_service) (rate(flotte_http_requests_total{status=~"5.."}[5m]))
/
clamp_min(sum by (exported_service) (rate(flotte_http_requests_total[5m])), 0.001)
```

- Latence p95

```promql
histogram_quantile(
  0.95,
  sum by (exported_service, le) (rate(flotte_http_request_duration_seconds_bucket[5m]))
)
```

- Top routes les plus sollicitées

```promql
topk(10, sum by (exported_service, route, method) (rate(flotte_http_requests_total[5m])))
```

## 3) Métier flotte (après instrumentation)

- Véhicules par statut

```promql
sum by (status) (flotte_vehicles_total)
```

- Maintenances en retard

```promql
flotte_maintenance_overdue_total
```

- Alertes géofencing par type

```promql
sum by (type, severity) (increase(flotte_geo_alerts_total[15m]))
```

- Lag Kafka max

```promql
max by (topic, consumer_group) (flotte_kafka_consumer_lag)
```

## 4) Vérification des rules enregistrées

- Ratio d'erreur calculé (recording rule)

```promql
job:flotte_http_error_ratio:rate5m
```

- Latence p95 calculée (recording rule)

```promql
job:flotte_http_latency_p95_seconds:5m
```

# Observability rules (Prometheus)

## Fichiers

- `prometheus-rules.yaml` : recording rules + alertes
- `promql-queries.md` : requêtes prêtes à copier dans Prometheus/Grafana
- `../../RUNBOOK-LANCEMENT-SERVICES.md` : guide de lancement app + observabilité

## Déploiement

```bash
kubectl apply -f k8s/observability/prometheus-rules.yaml
```

## Vérification

```bash
kubectl get prometheusrule -n flotte-observability
kubectl describe prometheusrule flotte-observability-rules -n flotte-observability
```

## Ouvrir Prometheus

```bash
kubectl port-forward -n flotte-observability svc/prometheus-kube-prometheus-prometheus 9090:9090
```

## Vérifier les alertes actives

```bash
curl -s "http://localhost:9090/api/v1/rules" | jq '.data.groups[] | {name: .name, rules: [.rules[].name]}'
```

## Notes

- Les alertes infra (`TargetDown`, scrape lent, etc.) fonctionnent immédiatement.
- Les alertes/métriques préfixées `flotte_*` deviennent actives dès que les services exposent ces métriques applicatives.

## Dashboards Grafana (MVP)

- Glossaire des termes observabilité : `k8s/observability/GLOSSAIRE-GRAFANA.md`
- Dashboards JSON importables : `k8s/observability/grafana/dashboards/`

Dashboards fournis :

- `flotte-infra-health.json`
- `flotte-api-sli-slo.json`
- `flotte-business-kpis.json`

### Import manuel dans Grafana

1. Ouvrir Grafana (`Dashboards` > `New` > `Import`)
2. Importer un fichier JSON du dossier `k8s/observability/grafana/dashboards/`
3. Sélectionner la datasource Prometheus demandée (`DS_PROMETHEUS`)
4. Répéter pour les 3 dashboards

### Mapping termes → panels

- Infra : `up`, `scrape duration collector`, `samples scraped`, `targets down`
- API SLI/SLO : `RPS`, `taux 5xx`, `ratio 5xx`, `latence p95`, `top routes`
- Business : véhicules par statut, maintenances en retard, alertes géofencing, lag Kafka

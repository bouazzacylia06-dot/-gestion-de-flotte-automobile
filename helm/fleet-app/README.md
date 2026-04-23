# Helm chart minimal - fleet-app

Ce chart Helm remplace les manifests bruts du dossier `k8s/` pour les 5 microservices applicatifs.

## 1) Prévisualiser les manifests rendus

```bash
helm template fleet-app ./helm/fleet-app
```

## 2) Déployer en local (minikube)

```bash
helm upgrade --install fleet-app ./helm/fleet-app --create-namespace --namespace fleet-system
```

## 3) Déployer en mode "prod-like"

```bash
helm upgrade --install fleet-app ./helm/fleet-app \
  --namespace fleet-system \
  -f helm/fleet-app/values-prod.yaml \
  --atomic --wait --timeout 5m
```

## 3b) Images GHCR

Avant le déploiement prod-like, remplace les repositories dans `values-prod.yaml` par tes images GHCR réelles, par exemple :

- `ghcr.io/<github-username>/vehicule-service`
- `ghcr.io/<github-username>/conducteur-service`
- `ghcr.io/<github-username>/maintenance-service`
- `ghcr.io/<github-username>/localisation-service`
- `ghcr.io/<github-username>/evenement-service`

Puis pousse les tags voulus, par exemple `1.0.0`.

## 4) Vérifier

```bash
kubectl get deploy,svc -A | grep -E 'vehicule|conducteur|maintenance|localisation|evenement'
```

## 5) Désactiver un service

Exemple pour désactiver l'événementiel :

```bash
helm upgrade --install fleet-app ./helm/fleet-app \
  --namespace fleet-system \
  --set services.evenement.enabled=false
```

## Notes

- Par défaut, le chart crée `db-secrets` dans chaque namespace applicatif (mode dev).
- En production, passe `secrets.create=false` et crée les secrets via ton mécanisme sécurisé (External Secrets / Sealed Secrets / CI).

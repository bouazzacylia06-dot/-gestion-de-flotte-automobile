# 📧 Configuration Alertmanager avec Email

Guide complet pour configurer les notifications email d'alertes dans Alertmanager.

## 📋 Table des matières

1. [Quick Start](#quick-start)
2. [Configuration SMTP](#configuration-smtp)
3. [Gestion des destinataires](#gestion-des-destinataires)
4. [Déploiement sur Kubernetes](#déploiement-sur-kubernetes)
5. [Déploiement local (docker-compose)](#déploiement-local)
6. [Slack & PagerDuty](#slack--pagerduty)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1️⃣ Copier et configurer le fichier `.env`

```bash
cp k8s/observability/.alertmanager.env.example k8s/observability/.alertmanager.env
```

Édite `.alertmanager.env` avec tes paramètres :

```bash
# SMTP (Gmail exemple)
ALERTMANAGER_SMTP_HOST=smtp.gmail.com
ALERTMANAGER_SMTP_USER=your-email@gmail.com
ALERTMANAGER_SMTP_PASSWORD=your-app-password  # App Password, PAS le vrai mdp!

# Emails destinataires
ALERTMANAGER_EMAIL_TO_CRITICAL=ops@company.com
ALERTMANAGER_EMAIL_TO_DEFAULT=dev@company.com
```

### 2️⃣ Appliquer la configuration Kubernetes

```bash
# Appliquer le ConfigMap + Secret
kubectl apply -f k8s/observability/alertmanager-config.yaml

# Vérifier
kubectl get configmap alertmanager-config -n flotte-observability -o yaml | head -30
```

### 3️⃣ Redémarrer Prometheus/Alertmanager

```bash
# Si Alertmanager est dans un pod
kubectl rollout restart deployment/alertmanager -n flotte-observability

# Ou si tu utilises docker-compose (voir section locale)
docker compose restart alertmanager
```

---

## 🔌 Configuration SMTP

### Gmail (Recommandé pour dev/test)

1. **Générer une App Password** :
   - Aller sur https://myaccount.google.com/apppasswords
   - Sélectionner "Mail" et "Windows/Linux/Mac"
   - Copier le mot de passe généré (16 caractères)

2. **Configurer** :
   ```bash
   ALERTMANAGER_SMTP_HOST=smtp.gmail.com
   ALERTMANAGER_SMTP_PORT=587
   ALERTMANAGER_SMTP_USER=your-email@gmail.com
   ALERTMANAGER_SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # App Password
   ```

### Office 365

```bash
ALERTMANAGER_SMTP_HOST=smtp.office365.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=your-email@company.com
ALERTMANAGER_SMTP_PASSWORD=your-password
```

### SendGrid (Production)

```bash
ALERTMANAGER_SMTP_HOST=smtp.sendgrid.net
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=apikey
ALERTMANAGER_SMTP_PASSWORD=SG.xxxxxxxxxxxx  # API Key
```

### Mailinblue (Alternative)

```bash
ALERTMANAGER_SMTP_HOST=smtp-relay.mailinblue.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=votre-email@company.com
ALERTMANAGER_SMTP_PASSWORD=smtp-password
```

---

## 👥 Gestion des destinataires

### Structure

```yaml
# alertmanager-config.yaml - ConfigMap
data:
  alertmanager.yml: |
    receivers:
      - name: 'email-default'
        email_configs:
          - to: '{{ env "ALERTMANAGER_EMAIL_TO_DEFAULT" }}'  # ← Variable d'env
      
      - name: 'email-critical'
        email_configs:
          - to: '{{ env "ALERTMANAGER_EMAIL_TO_CRITICAL" }}'  # ← Variable d'env
```

### Modifier les destinataires

**Option 1 : Fichier `.env` (le plus facile)** ✨

```bash
# .alertmanager.env
ALERTMANAGER_EMAIL_TO_DEFAULT=alice@company.com,bob@company.com,charlie@company.com
ALERTMANAGER_EMAIL_TO_CRITICAL=ops-lead@company.com,cto@company.com
```

**Option 2 : ConfigMap directement**

```bash
# Éditer le ConfigMap
kubectl edit configmap alertmanager-config -n flotte-observability

# Modifier la section recipients.txt :
data:
  recipients.txt: |
    # Équipe DEV
    alice@company.com
    bob@company.com
    
    # Équipe OPS (CRITICAL)
    ops-lead@company.com
```

**Option 3 : Helm values (si tu utilises Helm)**

```yaml
# helm/values.yaml
alertmanager:
  emailRecipients:
    default: alice@company.com,bob@company.com
    critical: ops-lead@company.com
    warning: dev-team@company.com
    info: tech-lead@company.com
```

### Routage par sévérité

```yaml
# Dans alertmanager.yml
route:
  receiver: 'email-default'  # Par défaut
  routes:
    - match:
        severity: critical
      receiver: 'email-critical'  # Override pour CRITICAL
      repeat_interval: 15m  # Re-envoyer chaque 15 min
    
    - match:
        severity: warning
      receiver: 'email-warning'
      repeat_interval: 1h  # Re-envoyer chaque 1h
```

---

## ☸️ Déploiement sur Kubernetes

### 1. Vérifier Prometheus Operator

Assure-toi que Prometheus Operator gère Alertmanager :

```bash
kubectl get alertmanager -n flotte-observability
kubectl get alertmanagerconfig -n flotte-observability
```

### 2. Appliquer ConfigMap + Secret

```bash
kubectl apply -f k8s/observability/alertmanager-config.yaml

# Vérifier
kubectl get secrets alertmanager-smtp -n flotte-observability -o yaml
```

### 3. Créer AlertmanagerConfig CRD

Si tu utilises Prometheus Operator, crée une `AlertmanagerConfig` :

```yaml
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: flotte
  namespace: flotte-observability
spec:
  route:
    receiver: email-default
    routes:
      - matchers:
          - name: severity
            value: critical
        receiver: email-critical
        groupWait: 10s
        groupInterval: 1m

  receivers:
    - name: email-default
      emailConfigs:
        - to: '{{ env "ALERTMANAGER_EMAIL_TO_DEFAULT" }}'
          from: fleet-alerts@company.com
          smarthost: smtp.gmail.com:587
          auth:
            username: '{{ env "ALERTMANAGER_SMTP_USER" }}'
            password: '{{ env "ALERTMANAGER_SMTP_PASSWORD" }}'
          headers:
            Subject: '[ALERTE] {{ .GroupLabels.alertname }}'
          html: |
            <h2>{{ .GroupLabels.alertname }}</h2>
            <p>Service: {{ .GroupLabels.exported_service }}</p>
            <p>{{ .Annotations.description }}</p>
```

### 4. Vérifier le changelog

```bash
# Voir les logs Alertmanager
kubectl logs -n flotte-observability deploy/alertmanager -f

# Chercher les erreurs SMTP
kubectl logs -n flotte-observability deploy/alertmanager | grep -i smtp
```

---

## 💻 Déploiement local (docker-compose)

### 1. Créer un service Alertmanager

Ajoute ceci à `docker-compose.yaml` :

```yaml
  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./k8s/observability/alertmanager-config.yaml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    environment:
      # Charger les variables d'env du fichier .env
      - ALERTMANAGER_SMTP_HOST=${ALERTMANAGER_SMTP_HOST}
      - ALERTMANAGER_SMTP_PORT=${ALERTMANAGER_SMTP_PORT}
      - ALERTMANAGER_SMTP_USER=${ALERTMANAGER_SMTP_USER}
      - ALERTMANAGER_SMTP_PASSWORD=${ALERTMANAGER_SMTP_PASSWORD}
      - ALERTMANAGER_EMAIL_FROM=${ALERTMANAGER_EMAIL_FROM}
      - ALERTMANAGER_EMAIL_TO_DEFAULT=${ALERTMANAGER_EMAIL_TO_DEFAULT}
      - ALERTMANAGER_EMAIL_TO_CRITICAL=${ALERTMANAGER_EMAIL_TO_CRITICAL}
      - ALERTMANAGER_EMAIL_TO_WARNING=${ALERTMANAGER_EMAIL_TO_WARNING}
      - ALERTMANAGER_EMAIL_TO_INFO=${ALERTMANAGER_EMAIL_TO_INFO}
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093/'
    networks:
      - flotte-network
    depends_on:
      - prometheus

volumes:
  alertmanager-data:
```

### 2. Lancer localement

```bash
# Charger les variables d'env
set -a
source k8s/observability/.alertmanager.env
set +a

# Démarrer
docker compose up -d alertmanager

# Vérifier
docker compose logs alertmanager -f
curl http://localhost:9093
```

### 3. Configurer Prometheus pour envoyer les alertes

Dans `prometheus.yml` :

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - localhost:9093  # ou alertmanager:9093 dans docker-compose
```

---

## 💬 Slack & PagerDuty

### Slack (Facile à ajouter)

1. **Créer un webhook** :
   - Aller sur https://api.slack.com/apps
   - Create New App → From scratch
   - Nommer : "Fleet Alerts"
   - Ajouter "Incoming Webhooks"
   - Copy le Webhook URL

2. **Ajouter à alertmanager-config.yaml** :

```yaml
receivers:
  - name: 'slack-critical'
    slack_configs:
      - api_url: '{{ env "ALERTMANAGER_SLACK_WEBHOOK" }}'
        channel: '#incidents'
        title: '🚨 {{ .GroupLabels.alertname }}'
        text: 'Service: {{ .GroupLabels.exported_service }}'
        send_resolved: true
```

3. **Configurer dans `.env`** :

```bash
ALERTMANAGER_SLACK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

### PagerDuty (Pour production)

1. **Créer l'intégration** :
   - PagerDuty → Services → Create Service
   - Intégration : Prometheus

2. **Ajouter à alertmanager-config.yaml** :

```yaml
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - routing_key: '{{ env "ALERTMANAGER_PAGERDUTY_KEY" }}'
        description: '{{ .GroupLabels.alertname }}'
        severity: 'critical'
```

---

## 🔍 Troubleshooting

### Les emails ne sont pas envoyés

**Vérifier les logs** :

```bash
# Kubernetes
kubectl logs -n flotte-observability deploy/alertmanager | grep -i error

# Docker
docker compose logs alertmanager | grep -i "smtp\|error"
```

**Problèmes courants** :

| Problème | Solution |
|----------|----------|
| `smtp: Error authenticating` | App Password invalide (Gmail) |
| `Connection timeout` | SMTP_HOST/SMTP_PORT incorrect |
| `EOF` | Problème de auth_username/password |
| Emails reçus mais vides | Template HTML mal formaté |

### Test d'envoi d'email manually

```bash
# Installer amtool
go install github.com/prometheus/alertmanager/cmd/amtool@latest

# Tester la configuration
amtool config routes

# Envoyer un email de test
amtool alert add testAlert severity=critical alertname=TestAlert
```

### Vérifier la connectivité SMTP

```bash
# Depuis le pod Kubernetes
kubectl exec -it deployment/alertmanager -n flotte-observability -- sh

# Installer telnet
apk add --no-cache netcat-openbsd

# Tester la connexion
nc -zv smtp.gmail.com 587
```

---

## 📚 Ressources

- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Email Configuration](https://prometheus.io/docs/alerting/latest/configuration/#email_config)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [PagerDuty Integration](https://www.pagerduty.com/docs/guides/prometheus-integration-guide/)
- [Slack Integration](https://api.slack.com/apps)

---

## ✅ Checklist de déploiement

- [ ] Fichier `.alertmanager.env` créé et complété
- [ ] ConfigMap Alertmanager appliquée : `kubectl apply -f alertmanager-config.yaml`
- [ ] Secret SMTP créé avec les bonnes credentials
- [ ] Prometheus configuré pour router vers Alertmanager
- [ ] Alertes testées avec la génération de trafic
- [ ] Emails reçus avec succès
- [ ] (Optionnel) Slack webhook configuré
- [ ] (Optionnel) PagerDuty integration testée
- [ ] Documentation de l'équipe mise à jour


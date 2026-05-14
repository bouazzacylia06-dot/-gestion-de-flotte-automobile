#!/bin/bash
# Script de déploiement Alertmanager avec configuration email
# Usage: ./deploy-alertmanager.sh

set -e

NAMESPACE="flotte-observability"

echo "🚀 Déploying Alertmanager configuration..."

# Vérifier que le fichier .env existe
if [ ! -f "k8s/observability/.alertmanager.env" ]; then
    echo "❌ Fichier .alertmanager.env non trouvé !"
    echo "   Créer d'abord: cp k8s/observability/.alertmanager.env.example k8s/observability/.alertmanager.env"
    exit 1
fi

# Charger les variables d'env
echo "📋 Chargement des variables d'env..."
set -a
source k8s/observability/.alertmanager.env
set +a

# Vérifier les variables obligatoires
required_vars=(
    "ALERTMANAGER_SMTP_HOST"
    "ALERTMANAGER_SMTP_USER"
    "ALERTMANAGER_SMTP_PASSWORD"
    "ALERTMANAGER_EMAIL_FROM"
    "ALERTMANAGER_EMAIL_TO_DEFAULT"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Variable manquante: $var"
        exit 1
    fi
done

echo "✅ Variables chargées avec succès"
echo ""
echo "Configuration SMTP:"
echo "  Host: $ALERTMANAGER_SMTP_HOST"
echo "  Port: $ALERTMANAGER_SMTP_PORT"
echo "  User: $ALERTMANAGER_SMTP_USER"
echo "  From: $ALERTMANAGER_EMAIL_FROM"
echo ""
echo "Destinataires:"
echo "  Default: $ALERTMANAGER_EMAIL_TO_DEFAULT"
echo "  Critical: $ALERTMANAGER_EMAIL_TO_CRITICAL"
echo "  Warning: $ALERTMANAGER_EMAIL_TO_WARNING"
echo "  Info: $ALERTMANAGER_EMAIL_TO_INFO"
echo ""

# Option 1: Déployer sur Kubernetes
if command -v kubectl &> /dev/null; then
    read -p "Déployer sur Kubernetes ? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Applying ConfigMap + Secret..."
        kubectl apply -f k8s/observability/alertmanager-config.yaml
        
        echo "✅ Configuration appliquée"
        echo ""
        echo "Vérifier l'état:"
        echo "  kubectl get configmap alertmanager-config -n $NAMESPACE"
        echo "  kubectl get secret alertmanager-smtp -n $NAMESPACE"
        echo ""
        
        # Optionnel: redémarrer Alertmanager
        read -p "Redémarrer Alertmanager ? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if kubectl get deployment/alertmanager -n "$NAMESPACE" >/dev/null 2>&1; then
                resource="deployment/alertmanager"
            else
                resource=$(kubectl get statefulset -n "$NAMESPACE" -o name | grep -E 'statefulset/.*alertmanager.*' | head -n1 || true)
            fi

            if [ -z "$resource" ]; then
                echo "⚠️  Aucun workload Alertmanager trouvé dans le namespace $NAMESPACE"
                echo "   Vérifie avec: kubectl get deploy,statefulset -n $NAMESPACE | grep -i alertmanager"
            else
                echo "🔄 Redémarrage de $resource..."
                kubectl rollout restart "$resource" -n "$NAMESPACE"
                echo "⏳ Attente du redémarrage..."
                kubectl rollout status "$resource" -n "$NAMESPACE"
                echo "✅ Alertmanager redémarré ($resource)"
            fi
        fi
    fi
fi

# Option 2: Déployer en local avec docker-compose
read -p "Lancer Alertmanager en local (docker-compose) ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v docker-compose &> /dev/null; then
        if ! docker-compose config --services 2>/dev/null | grep -qx "alertmanager"; then
            echo "⚠️  Service 'alertmanager' absent de docker-compose.yaml"
            echo "   Ignoré. Continue avec Kubernetes uniquement."
            exit 0
        fi

        echo "🐳 Starting alertmanager..."
        docker-compose up -d alertmanager
        
        sleep 2
        echo ""
        echo "✅ Alertmanager lancé localement"
        echo "   UI: http://localhost:9093"
        echo ""
        docker-compose logs -f alertmanager &
    else
        echo "❌ docker-compose non trouvé"
        exit 1
    fi
fi

echo ""
echo "=== PROCHAINES ÉTAPES ==="
echo "1. Configurer Prometheus pour envoyer les alertes à Alertmanager"
echo "2. Tester avec: curl -s http://localhost:9090/api/v1/alerts"
echo "3. Valider les emails reçus"
echo "4. Documentation: k8s/observability/README-ALERTMANAGER.md"

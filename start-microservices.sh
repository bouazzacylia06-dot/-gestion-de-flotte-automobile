#!/bin/bash

# 1. Vérifier que Minikube est installé
if ! command -v minikube &> /dev/null; then
    echo "❌ Minikube n'est pas installé. Installez-le d'abord : https://minikube.sigs.k8s.io/docs/start/"
    exit 1
fi

# 2. Démarrer Minikube (si ce n'est pas déjà fait)
echo "🚀 Démarrage de Minikube..."
minikube start --driver=docker --cpus=2 --memory=4g --disk-size=20g --force

# 3. Activer l'Ingress Controller
echo "🔧 Activation de l'Ingress Controller..."
minikube addons enable ingress
echo "⏳ Attente que l'Ingress Controller soit prêt..."
sleep 30

# 4. Appliquer les namespaces
echo "📁 Création des namespaces..."
kubectl apply -f k8s/namespaces.yaml

# 5. Appliquer les deployments et services
echo "🚀 Création des deployments et services..."
kubectl apply -f k8s/vehicule-deployment.yaml
kubectl apply -f k8s/conducteur-deployment.yaml
kubectl apply -f k8s/maintenance-deployment.yaml
kubectl apply -f k8s/localisation-deployment.yaml
kubectl apply -f k8s/evenement-deployment.yaml

kubectl apply -f k8s/vehicule-service.yaml
kubectl apply -f k8s/conducteur-service.yaml
kubectl apply -f k8s/maintenance-service.yaml
kubectl apply -f k8s/localisation-service.yaml
kubectl apply -f k8s/evenement-service.yaml

# 6. Appliquer l'Ingress (avec validation désactivée)
echo "🌐 Configuration de l'Ingress..."
kubectl apply -f k8s/ingress.yaml --validate=false

# 7. Instructions pour l'utilisateur
echo ""
echo "✅ Configuration Kubernetes terminée !"
echo ""
echo "📌 Instructions pour tester les microservices :"
echo "1. Ajoutez ces lignes dans votre /etc/hosts (nécessite sudo) :"
echo "$(minikube ip) vehicle.local driver.local maintenance.local location.local event.local"
echo ""
echo "2. Testez avec :"
echo "   curl http://vehicle.local"
echo "   curl http://driver.local"
echo ""
echo "💡 Alternative : Utilisez 'kubectl port-forward' pour tester temporairement :"
echo "   kubectl port-forward svc/vehicle-service 8080:80 -n vehicle-ns"
echo "   Puis testez avec : curl http://localhost:8080"


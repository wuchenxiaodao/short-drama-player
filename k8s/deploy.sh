#!/bin/bash
set -e

echo "=== Kubernetes Deployment Script ==="

# Build and push Docker image
echo "Building backend Docker image..."
cd ../backend
docker build -t your-registry.com/drama-backend:latest .
docker push your-registry.com/drama-backend:latest
cd ../k8s

# Apply Kubernetes configs
echo "Applying Kubernetes configurations..."
kubectl apply -f mysql.yaml
kubectl apply -f redis.yaml
kubectl apply -f backend.yaml

echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=drama-backend --timeout=120s

echo ""
echo "=== Kubernetes Deployment Complete ==="
echo "Check status with: kubectl get pods"
echo "Get service URL: kubectl get svc drama-backend-service"

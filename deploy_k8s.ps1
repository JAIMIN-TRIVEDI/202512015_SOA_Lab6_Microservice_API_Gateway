# ==============================================================================
# PowerShell One-Click Deployment Script for Kubernetes (Lab 8)
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  CampusConnect Microservices - Kubernetes Lab 8 Deployment Automation" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Check kubectl context
Write-Host "`n[1/5] Checking Kubernetes Context & Nodes..." -ForegroundColor Cyan
kubectl config current-context
kubectl get nodes

# 2. Build Docker Images
Write-Host "`n[2/5] Building Docker Images for All Microservices..." -ForegroundColor Cyan
Write-Host "Building api-gateway..." -ForegroundColor Yellow
docker build -t campusconnect-api-gateway:latest ./api-gateway

Write-Host "Building user-service..." -ForegroundColor Yellow
docker build -t campusconnect-user-service:latest ./user-service

Write-Host "Building product-service..." -ForegroundColor Yellow
docker build -t campusconnect-product-service:latest ./product-service

Write-Host "Building order-service..." -ForegroundColor Yellow
docker build -t campusconnect-order-service:latest ./order-service

# 3. Create Namespace
Write-Host "`n[3/5] Creating / Verifying 'lab8' Namespace..." -ForegroundColor Cyan
kubectl create namespace lab8 --dry-run=client -o yaml | kubectl apply -f -

# 4. Apply Kubernetes Manifests
Write-Host "`n[4/5] Applying Kubernetes Manifests in 'lab8' Namespace..." -ForegroundColor Cyan
kubectl apply -f k8s/configmap.yaml -n lab8
kubectl apply -f k8s/secret.yaml -n lab8
kubectl apply -f k8s/mongodb.yaml -n lab8
kubectl apply -f k8s/user-deployment.yaml -n lab8
kubectl apply -f k8s/user-service.yaml -n lab8
kubectl apply -f k8s/product-deployment.yaml -n lab8
kubectl apply -f k8s/product-service.yaml -n lab8
kubectl apply -f k8s/order-deployment.yaml -n lab8
kubectl apply -f k8s/order-service.yaml -n lab8
kubectl apply -f k8s/gateway-deployment.yaml -n lab8
kubectl apply -f k8s/gateway-service.yaml -n lab8
kubectl apply -f k8s/prometheus.yaml -n lab8
kubectl apply -f k8s/grafana.yaml -n lab8

# 5. Display Status
Write-Host "`n[5/5] Checking Deployment Status..." -ForegroundColor Cyan
kubectl get deployments -n lab8
kubectl get pods -n lab8
kubectl get services -n lab8

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "  Deployment Submitted Successfully!" -ForegroundColor Green
Write-Host "  To port-forward Gateway locally:  kubectl port-forward svc/api-gateway 8080:8080 -n lab8" -ForegroundColor Yellow
Write-Host "  To port-forward Prometheus:       kubectl port-forward svc/prometheus 9090:9090 -n lab8" -ForegroundColor Yellow
Write-Host "  To port-forward Grafana:          kubectl port-forward svc/grafana 3000:3000 -n lab8" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

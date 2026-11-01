# Web Services & SOA Laboratory — Lab 8
## Kubernetes Orchestration, Basic CI/CD & Monitoring
**Student ID:** 202512015  
**Course:** Web Services & Service Oriented Architecture (SOA)  
**Technology Stack:** Kubernetes (`kubectl`, Pods, Deployments, Services, ConfigMaps, Secrets) • GitHub Actions (CI/CD) • Prometheus • Grafana • Docker • Node.js (Express.js) • MongoDB Atlas / MongoDB  

---

## 1. Executive Summary & Objective

In **Lab 7**, the CampusConnect system established an **API Gateway** acting as a single entry point for three independent microservices (**User Service**, **Product Service**, and **Order Service**) backed by **MongoDB Atlas**, using Docker Compose for local isolation and configuration-based service discovery.

In **Lab 8**, we transition this microservices architecture to an enterprise cloud-native DevOps workflow:
1. **Part A — Kubernetes Deployment & Orchestration**:
   - Deploy **API Gateway**, **User Service**, **Product Service**, and **Order Service** into a dedicated Kubernetes namespace (`lab8`).
   - Define declarative Kubernetes manifests (`Deployment`, `Service`, `ConfigMap`, `Secret`).
   - Use Kubernetes internal DNS service discovery (`http://user-service:3001`, etc.) and NodePort / Port-Forwarding for gateway ingress.
   - Demonstrate horizontal scaling (`kubectl scale`) and automatic self-healing pod recovery upon failure.
2. **Part B — Continuous Integration (CI) with GitHub Actions**:
   - Automate a CI workflow (`.github/workflows/ci.yml`) triggered on `push` and `pull_request`.
   - Perform repository checkout, Node.js environment setup, automated unit testing across all services (`npm test`), and Docker container image creation.
3. **Part C — Full-Stack Observability with Prometheus & Grafana**:
   - Instrument all services with `prom-client` exposing `/metrics`.
   - Deploy Prometheus to scrape real-time metrics (`http_requests_total`, `http_request_duration_seconds`, `up`, `gateway_*`).
   - Provision Grafana dashboards to visualize availability, request throughput (RPS), error rates (4xx/5xx), and request latency histograms under synthetic traffic load.

---

## 2. End-to-End System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         CLIENT / POSTMAN                                         │
│                                (http://localhost:8080 or NodePort 30080)                         │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │
                                                 │ HTTP Requests (/users, /products, /orders)
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                KUBERNETES CLUSTER (Namespace: lab8)                              │
│                                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                 API GATEWAY SERVICE (Port 8080)                          │   │
│   │      Deployment: api-gateway (Replicas: 1)  |  Service: NodePort (30080)                  │   │
│   │      • Dynamic Proxy Routing   • Request Metrics Exporter (/metrics)                     │   │
│   └───────────────┬────────────────────────────┬─────────────────────────────┬───────────────┘   │
│                   │                            │                             │                   │
│                   │ http://user-service:3001   │ http://product-service:3002 │ http://order-service:3003
│                   ▼                            ▼                             ▼                   │
│        ┌─────────────────────┐      ┌─────────────────────┐       ┌─────────────────────┐        │
│        │    User Service     │      │   Product Service   │       │    Order Service    │        │
│        │  Deployment: 1 -> 3 │      │    Deployment: 1    │       │    Deployment: 1    │        │
│        │  Service: ClusterIP │      │  Service: ClusterIP │       │  Service: ClusterIP │        │
│        │  Port: 3001         │      │  Port: 3002         │       │  Port: 3003         │        │
│        └──────────┬──────────┘      └──────────┬──────────┘       └──────────┬──────────┘        │
│                   │                            │                             │                   │
│                   │ Inter-Service REST Calls   │                             │                   │
│                   │◀───────────────────────────┴─────────────────────────────┘                   │
│                   │                GET /users/:id & GET /products/:id                            │
│                   │                                                                              │
│   ════════════════╪════════════════════════════╪═════════════════════════════╪════════════════   │
│                   ▼                            ▼                             ▼                   │
│   ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                     OBSERVABILITY & MONITORING (Namespace: lab8)                         │   │
│   │  ┌────────────────────────────────────────────────────────────────────────────────────┐  │   │
│   │  │ Prometheus Server (Port 9090 / NodePort 30090)                                     │  │   │
│   │  │   • Scrapes /metrics from API Gateway, User, Product, Order Services every 5s      │  │   │
│   │  └────────────────────────────────────────┬───────────────────────────────────────────┘  │   │
│   │                                           │ Query / Metrics DataSource                   │   │
│   │  ┌────────────────────────────────────────▼───────────────────────────────────────────┐  │   │
│   │  │ Grafana Observability Dashboard (Port 3000 / NodePort 30300)                       │  │   │
│   │  │   • Panels: Service Availability (UP), Request Rate (RPS), Latency, Error Rates   │  │   │
│   │  └────────────────────────────────────────────────────────────────────────────────────┘  │   │
│   └──────────────────────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │
                                                 │ TLS Mongoose Connection
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL DATABASE LAYER (MongoDB Atlas Cloud Cluster)                      │
│                           Databases: `user_db` • `product_db` • `order_db`                       │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Kubernetes Manifests Structure (`k8s/`)

All Kubernetes manifests are located in the [k8s/](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s) directory:

| Manifest File | Kind | Purpose |
|---|---|---|
| [`configmap.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/configmap.yaml) | `ConfigMap` | Non-sensitive runtime variables (`NODE_ENV`, ports, internal URLs: `http://user-service:3001`, `http://product-service:3002`, `http://order-service:3003`) |
| [`secret.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/secret.yaml) | `Secret` | Sensitive configuration: MongoDB Atlas connection URIs (`MONGO_URI_USER`, `MONGO_URI_PRODUCT`, `MONGO_URI_ORDER`) |
| [`gateway-deployment.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/gateway-deployment.yaml) | `Deployment` | API Gateway pod specification (resource limits, liveness & readiness health checks) |
| [`gateway-service.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/gateway-service.yaml) | `Service` | NodePort service exposing the API Gateway on port `8080` (NodePort `30080`) |
| [`user-deployment.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/user-deployment.yaml) | `Deployment` | User microservice deployment with replica control and health probes |
| [`user-service.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/user-service.yaml) | `Service` | ClusterIP service exposing User microservice internally on port `3001` |
| [`product-deployment.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/product-deployment.yaml) | `Deployment` | Product catalog microservice deployment |
| [`product-service.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/product-service.yaml) | `Service` | ClusterIP service exposing Product microservice internally on port `3002` |
| [`order-deployment.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/order-deployment.yaml) | `Deployment` | Order orchestration microservice deployment |
| [`order-service.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/order-service.yaml) | `Service` | ClusterIP service exposing Order microservice internally on port `3003` |
| [`prometheus.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/prometheus.yaml) | `ConfigMap` + `Deployment` + `Service` | Prometheus server scraping all microservice pods on `/metrics` |
| [`grafana.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/grafana.yaml) | `ConfigMap` + `Deployment` + `Service` | Grafana dashboard server pre-configured with Prometheus datasource |
| [`mongodb.yaml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/k8s/mongodb.yaml) | `Deployment` + `Service` | Optional in-cluster MongoDB database for offline / standalone test scenarios |

---

## 4. Step-by-Step Execution Guide

### Step 1: Verify Kubernetes Environment
Verify your active cluster context and available node(s):
```powershell
kubectl config current-context
kubectl get nodes
```
Create the `lab8` namespace:
```powershell
kubectl create namespace lab8
```

### Step 2: Build Docker Images Locally
Build the container images for all 4 microservices:
```powershell
docker build -t campusconnect-api-gateway:latest ./api-gateway
docker build -t campusconnect-user-service:latest ./user-service
docker build -t campusconnect-product-service:latest ./product-service
docker build -t campusconnect-order-service:latest ./order-service
```

### Step 3: Deploy Application & Monitoring onto Kubernetes
Apply the manifests to the `lab8` namespace:
```powershell
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
```

Alternatively, use the automated PowerShell deployment script:
```powershell
.\deploy_k8s.ps1
```

### Step 4: Verify Running Resources
```powershell
kubectl get deployments -n lab8
kubectl get pods -n lab8
kubectl get services -n lab8
```

### Step 5: Access & Test Gateway
Port-forward the API Gateway service to `localhost:8080`:
```powershell
kubectl port-forward svc/api-gateway 8080:8080 -n lab8
```

Run end-to-end tests and traffic generation:
```powershell
.\test_k8s_traffic.ps1 -GatewayUrl "http://localhost:8080" -PrometheusUrl "http://localhost:9090"
```

---

## 5. Kubernetes Scaling & Self-Healing Demonstrations

### 5.1 Horizontal Scaling Test
Scale the `user-service` deployment from 1 replica to 3 replicas:
```powershell
kubectl scale deployment user-service --replicas=3 -n lab8
kubectl get pods -l app=user-service -n lab8
```
**Observation:** Kubernetes immediately spins up two new pods (`user-service-xxxx-1`, `user-service-xxxx-2`). The `user-service` Kubernetes Service automatically updates its internal endpoints list (`kubectl get endpoints user-service -n lab8`) and distributes incoming requests across all 3 healthy replicas.

### 5.2 Automatic Self-Healing Test
Find an active `user-service` pod and delete it:
```powershell
kubectl get pods -l app=user-service -n lab8
kubectl delete pod <user-service-pod-name> -n lab8
kubectl get pods -l app=user-service -n lab8
```
**Observation:** The ReplicaSet controller detects the discrepancy between the desired state (3 replicas) and actual state (2 replicas), immediately launching a replacement Pod to restore the system to desired state without downtime.

---

## 6. GitHub Actions CI/CD Pipeline

The CI workflow is configured in [`.github/workflows/ci.yml`](file:///d:/Jaimin_Files/Sem3/SOA/Lab/202512015_Lab6_Microservices/.github/workflows/ci.yml):

### Workflow Features:
- **Triggers:** On every `push` and `pull_request` targeting `main` or `master`.
- **Parallel Strategy Matrix:** Runs jobs for `api-gateway`, `user-service`, `product-service`, and `order-service`.
- **Steps:**
  1. `actions/checkout@v4` — Clones repository source.
  2. `actions/setup-node@v4` — Sets up Node.js 20 with npm caching.
  3. `npm ci` — Installs reproducible dependencies for each service.
  4. `npm test` — Executes automated unit tests for model schemas, configs, and Prometheus metrics.
  5. `docker/setup-buildx-action@v3` + `docker build` — Builds container images tagged with `latest` and `${{ github.sha }}`.

---

## 7. Monitoring with Prometheus & Grafana

### 7.1 Prometheus Setup & Queries
Port-forward the Prometheus service:
```powershell
kubectl port-forward svc/prometheus 9090:9090 -n lab8
```
Open `http://localhost:9090` and navigate to **Status ➔ Targets** to verify that all endpoints (`api-gateway:8080`, `user-service:3001`, `product-service:3002`, `order-service:3003`) report state **UP (1/1)**.

#### Essential PromQL Queries:
1. **Service Availability / Health:**
   ```promql
   up
   ```
2. **Total HTTP Request Rate (per second over 5m):**
   ```promql
   sum(rate(http_requests_total[5m])) by (service, route)
   ```
3. **Gateway Error Rate (HTTP 4xx & 5xx):**
   ```promql
   sum(rate(http_requests_total{status_code=~"4..|5.."}[5m])) by (service, status_code)
   ```
4. **95th Percentile Request Duration (Latency):**
   ```promql
   histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))
   ```

### 7.2 Grafana Observability Dashboard
Port-forward the Grafana service:
```powershell
kubectl port-forward svc/grafana 3000:3000 -n lab8
```
Open `http://localhost:3000` (Default credentials: `admin` / `admin`).

The pre-provisioned Prometheus datasource automatically connects to `http://prometheus:9090`.

#### Recommended Dashboard Panels:
| Panel Title | Visualization Type | Query | Operational Question Answered |
|---|---|---|---|
| **Microservice Uptime** | Stat / Status history | `up` | Are all microservice pods alive and reachable? |
| **Request Throughput (RPS)** | Time Series Graph | `sum(rate(http_requests_total[1m])) by (service)` | How much traffic is arriving across the system? |
| **Error Rate (4xx / 5xx)** | Time Series Graph / Stat | `sum(rate(http_requests_total{status_code=~"4..|5.."}[1m]))` | Are failures or invalid requests increasing? |
| **P95 Latency (Seconds)** | Gauge / Time Series | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | How long are requests taking to complete? |

---

## 8. Troubleshooting Guide

| Issue | Root Cause | Resolution |
|---|---|---|
| `ImagePullBackOff` / `ErrImageNeverPull` | Docker image not available in local Kubernetes runtime | Build image with `docker build -t <image-name>:latest .` and ensure `imagePullPolicy: IfNotPresent` |
| `CrashLoopBackOff` | Missing environment variables or database connection | Check `kubectl logs <pod-name> -n lab8` and verify `k8s/secret.yaml` has valid `MONGO_URI` |
| Service connection `ECONNREFUSED` | Service selector mismatch or wrong target port | Verify service selectors match deployment labels: `kubectl describe svc <service-name> -n lab8` |
| Prometheus Target `DOWN` | Metrics endpoint `/metrics` not exposed or port mismatch | Verify `curl http://localhost:<port>/metrics` returns Prometheus text metrics |

---

## 9. Submission Deliverables Checklist

- [x] **Lab 7 Baseline:** Verified API Gateway + User/Product/Order microservices and MongoDB Atlas connectivity.
- [x] **Kubernetes Cluster Context & Node:** Checked active context and node availability.
- [x] **Namespace `lab8`:** Created and configured as isolated workload namespace.
- [x] **Kubernetes Manifests:** Created `k8s/` containing `configmap.yaml`, `secret.yaml`, and Deployment + Service pairs for `api-gateway`, `user-service`, `product-service`, `order-service`, `prometheus`, `grafana`, `mongodb`.
- [x] **Service Discovery:** Verified internal cluster communication using Kubernetes DNS service names.
- [x] **Scaling Verification:** Scaled `user-service` to 3 replicas with zero-downtime routing.
- [x] **Self-Healing Verification:** Demonstrated automatic pod replacement upon deletion.
- [x] **GitHub Actions CI:** Implemented `.github/workflows/ci.yml` matrix build with `npm test` and `docker build`.
- [x] **Prometheus Metrics:** Integrated `prom-client` in all services, verified `/metrics` scrape and `up` targets.
- [x] **Grafana Dashboard:** Configured panels for availability, request rate, error rate, and latency.
- [x] **Traffic Generator:** Created `test_k8s_traffic.ps1` to generate dynamic load and test all microservices.

# ==============================================================================
# PowerShell Test & Traffic Generation Script for Web Services & SOA Lab 8
# Kubernetes • GitHub Actions • Prometheus • Grafana
# Student ID: 202512015
# ==============================================================================

param (
    [string]$GatewayUrl = "http://localhost:8080",
    [string]$PrometheusUrl = "http://localhost:9090",
    [int]$TrafficRounds = 30
)

$ErrorActionPreference = "Continue"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  CampusConnect Microservices - Lab 8 Kubernetes & Monitoring Test" -ForegroundColor Yellow
Write-Host "  Gateway Target    : $GatewayUrl" -ForegroundColor White
Write-Host "  Prometheus Target : $PrometheusUrl" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Method = "GET",
        [string]$Url,
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )

    Write-Host -NoNewline "[TEST] $Name ($Method $Url) ... "
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 10
            UseBasicParsing = $true
        }
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }

        $response = Invoke-WebRequest @params
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "PASS ($($response.StatusCode))" -ForegroundColor Green
            return $response.Content
        } else {
            Write-Host "WARN (Got $($response.StatusCode), Expected $ExpectedStatus)" -ForegroundColor Yellow
            return $response.Content
        }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq $ExpectedStatus) {
            Write-Host "PASS ($status - Expected Failure/Status)" -ForegroundColor Green
            return $_.Exception.Response
        } else {
            Write-Host "FAIL (Error: $_)" -ForegroundColor Red
            return $null
        }
    }
}

Write-Host "`n--- 1. Baseline Gateway & Health Probes ---" -ForegroundColor Cyan
Test-Endpoint -Name "Gateway Info" -Url "$GatewayUrl/"
Test-Endpoint -Name "Gateway Health Probe" -Url "$GatewayUrl/health"
Test-Endpoint -Name "Gateway Prometheus Metrics" -Url "$GatewayUrl/metrics"

Write-Host "`n--- 2. End-to-End Microservice CRUD Operations ---" -ForegroundColor Cyan
# Test User Service through Gateway
Test-Endpoint -Name "Get All Users" -Url "$GatewayUrl/users"

$newUserId = "80" + (Get-Random -Minimum 100 -Maximum 999)
$userPayload = @"
{
  "userId": "$newUserId",
  "name": "Kubernetes Test User",
  "email": "k8s.user.$newUserId@daiict.ac.in",
  "role": "student",
  "department": "DevOps & Cloud Systems"
}
"@
Test-Endpoint -Name "Create User via Gateway" -Method "POST" -Url "$GatewayUrl/users" -Body $userPayload -ExpectedStatus 201
Test-Endpoint -Name "Get User By ID" -Url "$GatewayUrl/users/$newUserId"

# Test Product Service through Gateway
Test-Endpoint -Name "Get All Products" -Url "$GatewayUrl/products"

$newProdId = "90" + (Get-Random -Minimum 100 -Maximum 999)
$productPayload = @"
{
  "productId": "$newProdId",
  "name": "Kubernetes Cloud Handbook",
  "description": "Comprehensive guide to microservices orchestration",
  "price": 39.99,
  "category": "Books",
  "stock": 100
}
"@
Test-Endpoint -Name "Create Product via Gateway" -Method "POST" -Url "$GatewayUrl/products" -Body $productPayload -ExpectedStatus 201
Test-Endpoint -Name "Get Product By ID" -Url "$GatewayUrl/products/$newProdId"

# Test Order Service with Inter-Service Orchestration through Gateway
$newOrderId = "ORD-K8S-" + (Get-Random -Minimum 1000 -Maximum 9999)
$orderPayload = @"
{
  "orderId": "$newOrderId",
  "userId": "$newUserId",
  "productId": "$newProdId",
  "quantity": 2
}
"@
Test-Endpoint -Name "Create Inter-Service Order via Gateway" -Method "POST" -Url "$GatewayUrl/orders" -Body $orderPayload -ExpectedStatus 201
Test-Endpoint -Name "Get All Orders" -Url "$GatewayUrl/orders"

Write-Host "`n--- 3. Generating Traffic for Prometheus / Grafana Observation ---" -ForegroundColor Cyan
Write-Host "Sending $TrafficRounds requests across endpoints to populate metric rates..." -ForegroundColor Yellow

$endpoints = @(
    "$GatewayUrl/users",
    "$GatewayUrl/products",
    "$GatewayUrl/orders",
    "$GatewayUrl/health",
    "$GatewayUrl/users/$newUserId",
    "$GatewayUrl/products/$newProdId"
)

for ($i = 1; $i -le $TrafficRounds; $i++) {
    $target = $endpoints[$i % $endpoints.Length]
    try {
        $null = Invoke-RestMethod -Uri $target -Method GET -TimeoutSec 3
    } catch {}
    if ($i % 10 -eq 0) {
        Write-Host "  -> Generated $i / $TrafficRounds requests..." -ForegroundColor Gray
    }
}

# Generate 5 intentional 404 error requests to populate error rate panels
Write-Host "Simulating 5 intentional 404 requests to populate Grafana Error Rate metrics..." -ForegroundColor Yellow
for ($i = 1; $i -le 5; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "$GatewayUrl/non-existent-route-$i" -Method GET -TimeoutSec 2 -UseBasicParsing
    } catch {}
}
Write-Host "Traffic generation complete!" -ForegroundColor Green

Write-Host "`n--- 4. Prometheus Target & Query Validation ---" -ForegroundColor Cyan
try {
    $promTargets = Invoke-RestMethod -Uri "$PrometheusUrl/api/v1/targets" -Method GET -TimeoutSec 5
    $activeTargets = $promTargets.data.activeTargets
    Write-Host "Active Prometheus Targets Found: $($activeTargets.Count)" -ForegroundColor Green
    foreach ($target in $activeTargets) {
        $job = $target.labels.job
        $health = $target.health
        $scrapeUrl = $target.scrapeUrl
        $color = if ($health -eq "up") { "Green" } else { "Red" }
        Write-Host "  • [$health] Job: $job -> $scrapeUrl" -ForegroundColor $color
    }
} catch {
    Write-Host "Notice: Could not connect to Prometheus at $PrometheusUrl. (Ensure Prometheus pod or container is running)" -ForegroundColor Yellow
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "  Lab 8 Verification & Traffic Run Complete!" -ForegroundColor Green
Write-Host "  Grafana URL    : http://localhost:3000 or http://localhost:30300 (admin / admin)" -ForegroundColor White
Write-Host "  Prometheus URL : http://localhost:9090 or http://localhost:30090" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan

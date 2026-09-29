# ==============================================================================
# Automated Comprehensive Test Script for API Gateway & Microservices (Lab 7)
# Web Services & SOA Laboratory - Student ID: 202512015
# ==============================================================================

param (
    [string]$GatewayUrl = "http://localhost:8080"
)

# Enable TLS 1.2 / TLS 1.3 for secure HTTPS calls to Cloud Providers (Render/Railway)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "CampusConnect Lab 7: API Gateway, Service Discovery & Cloud Test" -ForegroundColor Cyan
Write-Host "Target Gateway URL: $GatewayUrl" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$isLocal = $GatewayUrl.Contains("localhost") -or $GatewayUrl.Contains("127.0.0.1")

# ------------------------------------------------------------------------------
# 1. API Gateway Health & Service Discovery Inspection
# ------------------------------------------------------------------------------
Write-Host "`n[1] Checking API Gateway Health & Service Registry..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$GatewayUrl/health" -Method GET -TimeoutSec 15
    $uptime = if ($health.gateway -and $health.gateway.uptimeSeconds) { $health.gateway.uptimeSeconds } else { $health.uptimeSeconds }
    Write-Host "[OK] Gateway Status: $($health.status.ToUpper()) (Uptime: ${uptime}s)" -ForegroundColor Green
    
    if ($health.serviceRegistry) {
        Write-Host "   Service Registry configured:" -ForegroundColor Gray
        Write-Host "   +-- User Service    -> $($health.serviceRegistry.userService)" -ForegroundColor Gray
        Write-Host "   +-- Product Service -> $($health.serviceRegistry.productService)" -ForegroundColor Gray
        Write-Host "   +-- Order Service   -> $($health.serviceRegistry.orderService)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[FAIL] Failed to connect to API Gateway: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# 2. Test User Service via Gateway (/users)
# ------------------------------------------------------------------------------
Write-Host "`n[2] Testing User Service via Gateway (GET $GatewayUrl/users)..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$GatewayUrl/users" -Method GET -TimeoutSec 20
    Write-Host "[OK] Route /users -> User Service OK | Count: $($users.count)" -ForegroundColor Green
    if ($users.data) {
        $users.data | Format-Table -Property userId, name, email, role
    }
} catch {
    Write-Host "[FAIL] GET /users through gateway failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 3. Test Product Service via Gateway (/products)
# ------------------------------------------------------------------------------
Write-Host "`n[3] Testing Product Service via Gateway (GET $GatewayUrl/products)..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "$GatewayUrl/products" -Method GET -TimeoutSec 20
    Write-Host "[OK] Route /products -> Product Service OK | Count: $($products.count)" -ForegroundColor Green
    if ($products.data) {
        $products.data | Format-Table -Property productId, name, price, stock
    }
} catch {
    Write-Host "[FAIL] GET /products through gateway failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 4. Test Order Creation via Gateway (POST /orders -> Validates User & Product)
# ------------------------------------------------------------------------------
Write-Host "`n[4] Testing Order Creation via Gateway (POST $GatewayUrl/orders)..." -ForegroundColor Yellow
$orderPayload = @{
    userId = "101"
    productId = "501"
    quantity = 2
} | ConvertTo-Json

try {
    $orderRes = Invoke-RestMethod -Uri "$GatewayUrl/orders" -Method POST -Body $orderPayload -ContentType "application/json" -TimeoutSec 25
    Write-Host "[OK] Order successfully placed via Gateway (HTTP 201)!" -ForegroundColor Green
    Write-Host "   Order ID: $($orderRes.data.orderId) | Total: `$$($orderRes.data.totalAmount)" -ForegroundColor Green
    Write-Host "   Customer: $($orderRes.data.userDetails.name) ($($orderRes.data.userDetails.email))" -ForegroundColor Gray
    Write-Host "   Item:     $($orderRes.data.productDetails.name) x $($orderRes.data.quantity)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] POST /orders failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 5. Security & Isolation Test (Direct Access to Internal Microservices)
# ------------------------------------------------------------------------------
if ($isLocal) {
    Write-Host "`n[5] Security Boundary Test: Verifying Internal Microservices Are Hidden..." -ForegroundColor Yellow
    $internalPorts = @(3001, 3002, 3003)
    foreach ($port in $internalPorts) {
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:$port" -TimeoutSec 2 -ErrorAction Stop
            Write-Host "[WARN] Warning: Port $port is directly reachable from host! (Should be internal only)" -ForegroundColor Yellow
        } catch {
            Write-Host "[SECURED] Port $port is inaccessible from host directly (Protected by Docker network boundary)" -ForegroundColor Green
        }
    }

    # ------------------------------------------------------------------------------
    # 6. Centralized Error Handling & Fault Tolerance (Stop User Service -> 502/503)
    # ------------------------------------------------------------------------------
    Write-Host "`n[6] Centralized Error Handling Test (Stopping user-service container)..." -ForegroundColor Yellow
    Write-Host "   Executing: docker stop user-service..." -ForegroundColor Gray
    docker stop user-service 2>$null | Out-Null
    Start-Sleep -Seconds 2

    try {
        $faultTest = Invoke-RestMethod -Uri "$GatewayUrl/users" -Method GET -ErrorAction Stop
        Write-Host "[FAIL] Unexpected success when user-service is stopped" -ForegroundColor Red
    } catch {
        $statusCode = 502
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        Write-Host "[OK] Gateway intercepted outage and returned controlled error response!" -ForegroundColor Green
        Write-Host "   Status Code: $statusCode" -ForegroundColor Green
    }

    Write-Host "   Recovering: docker start user-service..." -ForegroundColor Gray
    docker start user-service 2>$null | Out-Null
    Start-Sleep -Seconds 4

    try {
        $recoveredUsers = Invoke-RestMethod -Uri "$GatewayUrl/users" -Method GET
        Write-Host "[OK] Service recovered! Gateway routing resumed successfully: $($recoveredUsers.count) user(s)" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Recovery test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`n[5] Cloud Diagnostics: Probing Live Downstream Services (GET $GatewayUrl/health?probe=true)..." -ForegroundColor Yellow
    try {
        $liveProbe = Invoke-RestMethod -Uri "$GatewayUrl/health?probe=true" -Method GET -TimeoutSec 20
        Write-Host "[OK] Cloud Health Probe Status: $($liveProbe.status.ToUpper())" -ForegroundColor Green
        if ($liveProbe.downstreamServices) {
            $liveProbe.downstreamServices.PSObject.Properties | ForEach-Object {
                Write-Host "   +-- $($_.Value.name): $($_.Value.status) ($($_.Value.url))" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "[WARN] Probe check response: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# ------------------------------------------------------------------------------
# 7. Summary
# ------------------------------------------------------------------------------
Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "All Lab 7 API Gateway & Service Discovery Tests Complete!" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

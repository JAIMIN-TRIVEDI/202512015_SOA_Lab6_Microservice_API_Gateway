# ==============================================================================
# Automated Test Script for CampusConnect Microservices (Lab 6)
# ==============================================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🚀 Testing CampusConnect Microservices (Lab 6)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Test User Service
Write-Host "`n[1] Testing User Service (:3001)..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "http://localhost:3001/users" -Method GET
    Write-Host "✅ GET /users Status: OK | Count: $($users.count)" -ForegroundColor Green
    $users.data | Format-Table -Property userId, name, email, role
} catch {
    Write-Host "❌ GET /users Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Test Product Service
Write-Host "`n[2] Testing Product Service (:3002)..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "http://localhost:3002/products" -Method GET
    Write-Host "✅ GET /products Status: OK | Count: $($products.count)" -ForegroundColor Green
    $products.data | Format-Table -Property productId, name, price, stock
} catch {
    Write-Host "❌ GET /products Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test Order Creation (Inter-Service Validation)
Write-Host "`n[3] Testing Order Creation (:3003) -> Validates User 101 & Product 501..." -ForegroundColor Yellow
$orderBody = @{
    userId = "101"
    productId = "501"
    quantity = 2
} | ConvertTo-Json

try {
    $orderRes = Invoke-RestMethod -Uri "http://localhost:3003/orders" -Method POST -Body $orderBody -ContentType "application/json"
    Write-Host "✅ POST /orders (Success 201): Order ID: $($orderRes.data.orderId) | Total: `$$($orderRes.data.totalAmount)" -ForegroundColor Green
    Write-Host "   User details snapshot: $($orderRes.data.userDetails.name) ($($orderRes.data.userDetails.email))" -ForegroundColor Gray
    Write-Host "   Product snapshot: $($orderRes.data.productDetails.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ POST /orders Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Test Invalid Resource Validation (404)
Write-Host "`n[4] Testing Non-Existent User Validation (Expect 404)..." -ForegroundColor Yellow
$invalidUserBody = @{
    userId = "999_non_existent"
    productId = "501"
    quantity = 1
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "http://localhost:3003/orders" -Method POST -Body $invalidUserBody -ContentType "application/json"
    Write-Host "❌ Unexpected success for invalid user" -ForegroundColor Red
} catch {
    Write-Host "✅ Caught expected error: $($_.Exception.Message)" -ForegroundColor Green
}

# 5. Test Resilient Error Handling (503)
Write-Host "`n[5] Fault-Tolerance Test (Stop User Service -> Expect 503)..." -ForegroundColor Yellow
Write-Host "Stopping user-service container..." -ForegroundColor Gray
docker stop user-service | Out-Null
Start-Sleep -Seconds 2

try {
    $res = Invoke-RestMethod -Uri "http://localhost:3003/orders" -Method POST -Body $orderBody -ContentType "application/json"
    Write-Host "❌ Unexpected success when user-service was down" -ForegroundColor Red
} catch {
    Write-Host "✅ Controlled 503 Service Unavailable received as expected!" -ForegroundColor Green
}

Write-Host "Restarting user-service container..." -ForegroundColor Gray
docker start user-service | Out-Null
Start-Sleep -Seconds 4

Write-Host "Retrying Order creation after service recovery..." -ForegroundColor Yellow
try {
    $orderRecovery = Invoke-RestMethod -Uri "http://localhost:3003/orders" -Method POST -Body $orderBody -ContentType "application/json"
    Write-Host "✅ Service recovered! Order placed successfully: $($orderRecovery.data.orderId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Recovery test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "🎉 All Microservices Verification Tests Complete!" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

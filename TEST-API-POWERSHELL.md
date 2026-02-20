# Testing API Endpoints in PowerShell

## ❌ Wrong (curl syntax doesn't work in PowerShell):
```powershell
curl http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"password123\",\"name\":\"Test User\"}"
```

## ✅ Correct PowerShell Syntax:

### Option 1: Using Invoke-WebRequest (Recommended)
```powershell
$body = @{
    email = "test@test.com"
    password = "password123"
    name = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/signup" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Option 2: Using Invoke-RestMethod (Returns JSON object)
```powershell
$body = @{
    email = "test@test.com"
    password = "password123"
    name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Option 3: One-liner (Simpler)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"test@test.com","password":"password123","name":"Test User"}'
```

---

## Quick Test Commands:

### Test Backend is Running:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/stores"
```

### Test Signup:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"test@test.com","password":"password123","name":"Test User"}'
```

### Test Login:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@test.com","password":"password123"}'
```

---

## Note:
- Replace `localhost:3000` with your actual backend URL
- If using local IP: `http://192.168.201.105:3000`
- If using Render: `https://pricelens-1.onrender.com`

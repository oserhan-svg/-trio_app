@echo off
echo Emlak Takip Sistemi Baslatiliyor...
echo ===================================
echo.
echo 1. Backend Sunucusu (Port 5000) baslatiliyor...
start "Emlak Takip Backend" cmd /k "cd server && node index.js"
echo.
echo 2. Frontend Arayuzu (Port 5173) baslatiliyor...
start "Emlak Takip Client" cmd /k "cd client && npm run dev"
echo.
echo Sistem aciliyor... Tarayicinizda http://localhost:5173 adresini kontrol edin.
echo.
pause

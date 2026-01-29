@echo off
echo ===================================================
echo   EMLAK PORTFOY GUNCELLEME BASLATILIYOR...
echo   Lutfen acilan tarayici penceresini KAPATMAYIN.
echo   Islem bitince bu pencere kapanacaktir.
echo ===================================================

echo.
echo [1/2] Tarayici profili temizleniyor (Onarim)...
if exist "chrome-stealth-profile-v4" (
    rmdir /s /q "chrome-stealth-profile-v4" >nul 2>&1
)
for /d %%G in ("chrome-stealth-profile-v4_RECOVERY_*") do (
    rmdir /s /q "%%G" >nul 2>&1
)

echo [2/2] Tarayici ve Scraper baslatiliyor...
cd server
node scripts/trigger_scraper_manual.js

echo.
echo Islem Tamamlandi. Cikis icin bir tusa basin...
pause

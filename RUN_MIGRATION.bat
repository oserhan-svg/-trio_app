@echo off
echo ========================================
echo Database Migration Baslatiliyor...
echo ========================================
echo.

cd /d "%~dp0server"

echo Prisma migration calistiriliyor...
npx prisma migrate dev --name add_property_listings

echo.
echo UUID paketi yukleniyor...
npm install uuid

echo.
echo ========================================
echo Migration tamamlandi!
echo ========================================
echo.
echo Artik server'i yeniden baslatin:
echo 1. Server terminalinde Ctrl+C yapin
echo 2. "npm start" komutu ile tekrar baslatin
echo.
pause

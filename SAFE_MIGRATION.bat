@echo off
echo ========================================
echo GUVENLI Veritabani Guncellemesi
echo (Veriler SILINMEYECEK)
echo ========================================
echo.

cd /d "%~dp0server"

echo Yeni tablo veritabani yapisina ekleniyor...
npx prisma db push

echo.
echo UUID paketi yukleniyor...
npm install uuid

echo.
echo ========================================
echo Islem tamamlandi!
echo ========================================
echo.
echo Artik server'i yeniden baslatin:
echo 1. Server terminalinde Ctrl+C yapin
echo 2. "npm start" komutu ile tekrar baslatin
echo.
pause

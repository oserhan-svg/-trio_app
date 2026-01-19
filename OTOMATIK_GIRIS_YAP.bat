@echo off
title Trio Emlak - Otomatik Giris Modu
color 0A
echo ==================================================
echo   TRIO EMLAK - OTOMATIK GIRIS MODU
echo ==================================================
echo.
echo Tarayici aciliyor...
echo Lutfen acilan pencerede sitelere giris yapin.
echo.
cd server
npm run login
echo.
echo Islem tamamlandi. Pencereyi kapatabilirsiniz.
pause

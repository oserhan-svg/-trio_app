@echo off
title Trio Emlak - Sistem Baslatiliyor
color 0A
echo ==================================================
echo   TRIO EMLAK SISTEMI ACILIYOR
echo ==================================================
echo.
echo 1. Arka Plan Sunucusu (Backend)
echo 2. Kullanici Arayuzu (Frontend)
echo.
echo Lutfen bekleyin...
echo (Bu pencereyi kapatmayin, sistem calisirken acik kalmali)
echo.
cd server
npm run dev
pause

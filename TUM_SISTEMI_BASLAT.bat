@echo off
title Trio Emlak - Sistem Baslatiliyor
color 0A
echo ==================================================
echo   TRIO EMLAK SISTEMI ACILIYOR
echo ==================================================
echo.
echo 1. Arka Plan Sunucusu (Backend) baslatiliyor...
start "Trio Backend" cmd /k "cd server && npm start"

echo 2. Kullanici Arayuzu (Frontend) baslatiliyor...
start "Trio Frontend" cmd /k "cd client && npm run dev"

echo.
echo Sistem baslatildi! Pencereleri kapatmayin.
echo Tarayici otomatik olarak acilacaktir: http://localhost:5173
echo.
pause

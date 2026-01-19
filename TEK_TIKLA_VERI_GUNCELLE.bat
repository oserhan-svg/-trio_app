@echo off
title Trio Emlak - Veri Guncelleme (Local -> Live)
color 0B
echo ==================================================
echo   TRIO EMLAK - VERI SENKRONIZASYONU
echo ==================================================
echo.
echo Adim 1: Yerel veriler disari aktariliyor (Export)...
node server/scripts/export_properties.js
if %errorlevel% neq 0 (
    echo [HATA] Export islemi basarisiz oldu!
    pause
    exit /b %errorlevel%
)
echo.
echo Adim 2: Canli sunucuya yukleniyor (Import)...
node server/scripts/import_properties.js
if %errorlevel% neq 0 (
    echo [HATA] Import islemi basarisiz oldu!
    pause
    exit /b %errorlevel%
)
echo.
echo ==================================================
echo   ISLEM BASARIYLA TAMAMLANDI!
echo   Tum ilanlar canli sisteme aktarildi.
echo ==================================================
echo.
pause

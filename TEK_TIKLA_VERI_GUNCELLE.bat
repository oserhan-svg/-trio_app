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
echo Adim 3: Kullanici verileri disari aktariliyor (Export)...
node server/scripts/sync_users.js export
if %errorlevel% neq 0 (
    echo [HATA] Kullanici Export islemi basarisiz oldu!
    echo Devam ediliyor...
)
echo.
echo Adim 4: Kullanici verileri canli sunucuya yukleniyor (Import)...
node server/scripts/sync_users.js import
if %errorlevel% neq 0 (
    echo [HATA] Kullanici Import islemi basarisiz oldu!
    echo Devam ediliyor...
)
echo.
echo ==================================================
echo   ISLEM BASARIYLA TAMAMLANDI!
echo   Tum ilanlar canli sisteme aktarildi.
echo ==================================================
echo.
pause

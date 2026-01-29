@echo off
title TrioApp Sunucusu
color 0f

:: Scriptin bulundugu dizine git
cd /d "%~dp0"

echo ==============================================
echo   TrioApp Backend Sunucusu Baslatiliyor
echo ==============================================
echo.

:: Server klasorune gir
cd server
if %errorlevel% neq 0 (
    echo HATA: 'server' klasoru bulunamadi!
    echo Mevcut konum: %cd%
    echo.
    echo Lutfen bu dosyayi projenin ana klasorune koydugunuzdan emin olun.
    pause
    exit /b
)

:: Node.js kontrolu
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo HATA: Node.js sistemde yuklu degil veya PATH'e eklenmemis.
    echo Lutfen https://nodejs.org adresinden Node.js'i indirip kurun.
    pause
    exit /b
)

:: Node modullerini kontrol et
if not exist "node_modules" (
    echo.
    echo Ilk kurulum yapiliyor (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo HATA: Kurulum basarisiz oldu. Internet baglantinizi kontrol edin.
        pause
        exit /b
    )
)

echo.
echo Sunucu baslatiliyor...
echo.

:: Sunucuyu baslat ve pencereyi acik tut
cmd /k "npm start"

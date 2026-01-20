@echo off
title Trio Emlak - Temiz Chrome Modu
color 0B
echo ==================================================
echo   TEMIZ CHROME MODU (ALTERNATIF COZUM)
echo ==================================================
echo.
echo Mevcut Chrome profilinizde takilma oldugu icin
echo bu mod ile "SIFIR" bir Chrome sayfasi acacagiz.
echo.
echo AVANTAJI: Kesinlikle acilir, takilmaz.
echo DEZAVANTAJI: Sitelere tekrar giris yapmaniz gerekir.
echo.
echo 1. Acilan bembeyaz Chrome'da Sahibinden/Hepsiemlak'a girin.
echo 2. Giris yapin (Login olun).
echo 3. Ardindan 2. dosyayi (Cerezleri Cek) calistirin.
echo.
echo Devam etmek icin bir tusa basin...
pause >nul

echo.
echo Chrome hazirlaniyor...
taskkill /F /IM chrome.exe /T 2>nul
timeout /t 2 >nul

:: Ozel profil klasoru olustur
if not exist "chrome-debug-profile" mkdir "chrome-debug-profile"

echo.
echo Temiz Chrome Aciliyor...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%~dp0chrome-debug-profile" --no-first-run --no-default-browser-check

echo.
echo Port 9222 kontrol ediliyor...
:CHECK_PORT
timeout /t 1 >nul
netstat -an | find "9222" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo.
    echo ==================================================
    echo   BASARILI! Chrome (Temiz Mod) acildi.
    echo   Lutfen giris yapip islemlere devam edin.
    echo ==================================================
) else (
    echo Port bekleniyor...
    goto CHECK_PORT
)

echo Penceremiz arka planda acik kalabilir.
pause

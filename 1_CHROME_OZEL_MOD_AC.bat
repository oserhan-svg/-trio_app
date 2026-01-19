@echo off
title Trio Emlak - Ozel Chrome Modu
color 0C
echo ==================================================
echo   OZEL CHROME MODU (COOKIE OTOMASYONU ICIN)
echo ==================================================
echo.
echo DIKKAT: Bu islem, acik olan tum Chrome pencerelerini 
echo kapatip, "Scraper Uyumlu" modda yeniden acacaktir.
echo.
echo (Korkmayin, oturumlariniz silinmez, sadece yeniden baslatilir)
echo.
echo 1. Chrome kapanacak.
echo 2. Chrome yeniden acilacak.
echo 3. Siz sitelere (Sahibinden vb) giris yapacaksiniz.
echo 4. Sonra "ÇEREZLERİ AL" dosyasini calistiracaksiniz.
echo.
echo Devam etmek icin bir tusa basin...
pause >nul

echo.
echo Chrome kapatiliyor (Zorla)...
taskkill /F /IM chrome.exe /T 2>nul
timeout /t 2 >nul
taskkill /F /IM chrome.exe /T 2>nul
timeout /t 2 >nul

:: Kontrol: Hala calisan Chrome var mi?
tasklist | find /i "chrome.exe" >nul
if %errorlevel% equ 0 (
    echo.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo DIKKAT: Chrome tamamen kapanmadi!
    echo Lutfen sag alt kosedeki (saatin yanindaki) ok isaretine
    echo tiklayip Chrome simgesi varsa sag tiklayip "Cikis" deyin.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo.
    echo Elle kapattiktan sonra bir tusa basin...
    pause
    taskkill /F /IM chrome.exe /T 2>nul
)

echo.
echo Chrome Ozel Modda Aciliyor...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --restore-last-session

echo.
echo Port 9222 kontrol ediliyor...
:CHECK_PORT
timeout /t 1 >nul
netstat -an | find "9222" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo.
    echo ==================================================
    echo   BASARILI! Chrome Port 9222 uzerinden dinliyor.
    echo   Simdi sitelere giris yapip 2. dosyayi calistirabilirsiniz.
    echo ==================================================
) else (
    echo Port henuz acilmadi, bekleniyor...
    goto CHECK_PORT
)

echo Penceremiz arka planda acik kalabilir.
pause

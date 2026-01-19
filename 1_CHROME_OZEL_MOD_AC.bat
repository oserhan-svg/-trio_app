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
echo Chrome kapatiliyor...
taskkill /F /IM chrome.exe /T 2>nul
timeout /t 2 >nul

echo.
echo Chrome Ozel Modda Aciliyor...
start chrome.exe --remote-debugging-port=9222 --restore-last-session

echo.
echo ==================================================
echo   CHROME ACILDI!
echo   Lutfen sitelere giris yapin, ardindan
echo   otomatik cekim islemi icin diger dosyayi calistirin.
echo ==================================================
echo Penceremiz arka planda acik kalabilir.
pause

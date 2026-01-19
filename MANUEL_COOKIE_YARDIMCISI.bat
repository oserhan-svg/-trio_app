@echo off
title Trio Emlak - Manuel Cerez Yardimcisi
color 0E
echo ==================================================
echo   MANUEL CEREZ (COOKIE) YUKLEME SIHIRBAZI
echo ==================================================
echo.
echo Scraper'in mevcut Chrome pencerenize erismesi guvenlik 
echo nedeniyle engellenmektedir. En saglam yontem sudur:
echo.
echo 1. Chrome'a "Cookie-Editor" eklentisini kurun.
echo    (Veya benzeri bir "Export Cookies JSON" eklentisi)
echo.
echo 2. Sahibinden.com'a giris yapin.
echo.
echo 3. Eklentiye tiklayip "Export" (Disa Aktar) > "JSON" secin.
echo    (Cerezler panoya kopyalanacaktir).
echo.
echo 4. Birazdan acilacak olan Not Defteri'ne bu kodu yapistirin.
echo.
echo 5. Kaydetip kapatin. (CTRL+S, sonra X)
echo.
echo ==================================================
echo Hazir oldugunuzda bir tusa basin...
pause >nul

echo.
echo Dosya aciliyor...
notepad manual_cookies.json

echo.
echo Cerezler isleniyor...
node server/scripts/import_cookies.js

echo.
echo ==================================================
echo   ISLEM TAMAMLANDI!
echo   Scraper artik bu cerezleri kullanacaktir.
echo ==================================================
pause

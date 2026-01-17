@echo off
chcp 65001 >nul
echo ---------------------------------------------------
echo  MASTER CHROME BASLATILIYOR (Anti-Blok Modu)
echo ---------------------------------------------------
echo.
echo Bu pencere, robotun Sahibinden.com'a girmesi icin acik kalmalidir.
echo Eger "Unusual Access" (Olagan disi erisim) hatasi alirsaniz,
echo bu pencereden elle dogrulamayi tamamlayin.
echo.

set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "USER_DATA=%~dp0chrome-stealth-master"

if not exist "%CHROME_PATH%" (
    echo HATA: Chrome bulunamadi!
    echo Lutfen Chrome'un su adreste oldugundan emin olun:
    echo %CHROME_PATH%
    pause
    exit /b
)

echo Profil Yolu: %USER_DATA%
if not exist "%USER_DATA%" mkdir "%USER_DATA%"

echo.
echo Chrome aciliyor... Pencereyi KAPATMAYIN.
echo.
echo Lutfen acilan Chrome penceresinde Sahibinden.com'a giris yapin.
echo Robot bu oturumu kullanacaktir.
echo.

"%CHROME_PATH%" --remote-debugging-port=9222 --user-data-dir="%USER_DATA%" --no-first-run --no-default-browser-check --start-maximized

echo.
echo Chrome kapandi. Robot artik calisamaz.
pause

@echo off
echo ==================================================
echo   CHROME DEBUG MODU BASLATILIYOR...
echo ==================================================
echo.
echo [1/3] Tum acik Chrome pencereleri kapatiliyor...
taskkill /F /IM chrome.exe /T >nul 2>&1
echo.

echo [2/3] Chrome ozel parametrelerle aciliyor...
echo       (Kendi profiliniz ve sifreleriniz yuklenecek)
echo.

:: Launch Chrome with Debug Port 9222 and default User Data
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome\User Data"

echo [3/3] ISLEM TAMAMLANDI!
echo.
echo Lutfen acilan Chrome penceresinde Sahibinden.com'a giris yapin.
echo Ardindan terminale donup scraper'i baslatin.
echo.
pause

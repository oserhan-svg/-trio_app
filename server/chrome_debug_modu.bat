@echo off
echo Chrome Debug Modunda Baslatiliyor...
echo Lutfen once tum Chrome pencerelerini kapattiginizdan emin olun!
timeout /t 3

set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME_PATH% set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %CHROME_PATH% set CHROME_PATH="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

%CHROME_PATH% --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome\User Data"

echo Chrome baslatildi. Simdi botu calistirabilirsiniz.
pause

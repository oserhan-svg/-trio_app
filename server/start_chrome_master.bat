@echo off
echo Chrome'u Debug Modunda Baslatiyorum...
echo Lutfen acilan Chrome penceresini KAPATMAYIN.
echo Robot bu pencereyi kullanarak "insan" gibi davranacaktir.
echo.
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-debug-profile"
pause

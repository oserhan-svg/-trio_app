@echo off
echo Chrome Debug Modunda Baslatiliyor...
echo ---------------------------------------------------
echo ONEMLI: Lutfen once acik olan TUM Chrome pencerelerini kapatin.
echo ---------------------------------------------------
pause
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome_debug_profile"
echo Chrome acildi. Lutfen Sahibinden.com adresine gidin ve dogrulamayi gecin.
echo Ardindan sistemi baslatin.
pause

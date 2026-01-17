@echo off
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-dev-profile-fresh" --disable-blink-features=AutomationControlled --window-size=1920,1080

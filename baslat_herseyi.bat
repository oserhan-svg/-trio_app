@echo off
echo ========================================
echo Emlak22 Baslatiliyor...
echo ========================================

echo Server baslatiliyor...
start cmd /k "cd /d %~dp0server && npm start"

echo Client baslatiliyor...
start cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Her sey hazir! Tarayici aciliyor...
timeout /t 5
start http://localhost:5173/dashboard

exit

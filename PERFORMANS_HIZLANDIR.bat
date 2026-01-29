@echo off
set "project_path=%~dp0"
:: Remove trailing backslash if present
if "%project_path:~-1%"=="\" set "project_path=%project_path:~0,-1%"

echo ==========================================
echo PERFORMANS OPTIMIZASYONU: WINDOWS DEFENDER
echo ==========================================
echo Proje yolu: %project_path%
echo.
echo Bu islem Windows Defender taramalarina proje klasorunuzu ve 
echo node.exe'yi istisna olarak ekleyecektir.
echo.
echo Lutfen acilan onay penceresinde 'Evet' diyerek izin verin.
echo.

powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command \"Add-MpPreference -ExclusionPath ''%project_path%''; Add-MpPreference -ExclusionProcess ''node.exe''; Write-Host ''Basariyla tamamlandi!'' -ForegroundColor Green; Start-Sleep -Seconds 3\"' -Verb RunAs"

echo.
echo Islem arka planda baslatildi. Tamamlandiginda pencere kapanacaktir.
echo ==========================================
pause

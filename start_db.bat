@echo off
echo Emlak Takip - Veritabani Baslatma Araci
echo =========================================
echo.
echo 1. Servisler taranıyor...
sc query state= all | findstr /i "postgre"
echo.
echo 2. Olası servis isimleri deneniyor...
echo   - postgresql-x64-18 deneniyor...
net start postgresql-x64-18
echo.
echo   - postgresql-x64-16 deneniyor...
net start postgresql-x64-16
echo.
echo   - postgresql-x64-15 deneniyor...
net start postgresql-x64-15
echo.
echo 3. Eger yukaridaki komutlar 'Access Denied' veya 'Service name invalid' dediyse:
echo    Lutfen bu dosyaya sag tiklayip 'Yonetici Olarak Calistir' deyin.
echo.
echo 4. Eger servis hala baslamadiysa, Postgres kurulu degil veya bozuk olabilir.
echo.
pause

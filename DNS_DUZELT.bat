@echo off
echo DNS ayarlari Guvenli DNS (Google & Cloudflare) olarak degistiriliyor...
echo Lutfen bekleyin...

:: DNS 1 -> 8.8.8.8
netsh interface ip set dns "Ethernet" static 8.8.8.8
:: DNS 2 -> 1.1.1.1
netsh interface ip add dns "Ethernet" 1.1.1.1 index=2

echo.
echo DNS Onbellegi temizleniyor...
ipconfig /flushdns

echo.
echo ==========================================
echo ISLEM BASARIYLA TAMAMLANDI!
echo Artik trio-app.pages.dev adresine girebilirsiniz.
echo ==========================================
pause

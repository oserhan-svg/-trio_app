@echo off
setlocal
title Trio Emlak - Ag ve Guvenlik Yapilandirici
color 1F

echo ==================================================
echo   TRIO EMLAK - TAM AG YAPILANDIRMASI
echo ==================================================
echo.
echo Bu arac sunlari yapacaktir:
echo 1. Mevcut Ag Profilini "Ortak"tan "Ozel"e cevirecek.
echo 2. Guvenlik Duvarinda gerekli portlari (5173, 5005) acacak.
echo 3. IP adresinizi gosterip baglanti testi yapacak.
echo.
echo LUTFEN "YONETICI OLARAK" CALISTIRDIGINIZDAN EMIN OLUN!
echo.
pause

echo.
echo [1/3] Ag Profili "Ozel" (Private) olarak ayarlaniyor...
echo --------------------------------------------------
powershell -Command "Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private"
if %errorlevel% neq 0 (
    echo [UYARI] Ag profili degistirilemedi. Yonetici yetkisi oldugundan emin olun.
) else (
    echo [BASARILI] Tum aktif aglar 'Ozel' olarak ayarlandi.
)
echo --------------------------------------------------

echo.
echo [2/3] Port Izinleri Yenileniyor...
netsh advfirewall firewall delete rule name="TrioApp_Frontend" >nul 2>&1
netsh advfirewall firewall delete rule name="TrioApp_Backend" >nul 2>&1

netsh advfirewall firewall add rule name="TrioApp_Frontend" dir=in action=allow protocol=TCP localport=5173 profile=any
netsh advfirewall firewall add rule name="TrioApp_Backend" dir=in action=allow protocol=TCP localport=5005 profile=any

if %errorlevel% neq 0 (
    echo [HATA] Port acilamadi. Yonetici yetkisi gerekiyor!
) else (
    echo [BASARILI] Portlar (5173, 5005) erisime acildi.
)

echo.
echo [3/3] Baglanti Bilgileri...
echo ==================================================
echo Bilgisayarinizin IP Adresi:
ipconfig | findstr /i "IPv4"
echo.
echo Kullanilacak Adres:
echo http://[IP_ADRESINIZ]:5173
echo ==================================================
echo.
echo Islem tamam. Lutfen diger cihazdan baglanmayi deneyin.
echo.
pause

@echo off
title Trio Emlak - Cerezleri Cek
color 0B
echo ==================================================
echo   ACIK PENCEREDEN CEREZLERI CEKME ISLEMI
echo ==================================================
echo.
echo Bu islem, su an acik olan (Ozel Moddaki) Chrome'a
echo baglanip gerekli bilgileri kopyalayacaktir.
echo.
node server/scripts/extract_cookies_debug.js
echo.
echo ==================================================
echo   ISLEM TAMAMLANDI!
echo ==================================================
pause

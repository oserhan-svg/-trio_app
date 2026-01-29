@echo off
echo 🧹 Trio Port Temizleyici Baslatiliyor...

echo [1/3] Port 5000 (Eski Backend) Temizleniyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /f /pid %%a

echo [2/3] Port 5005 (Yeni Backend) Temizleniyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5005 ^| findstr LISTENING') do taskkill /f /pid %%a

echo [3/3] Port 5173 (Frontend) Temizleniyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a

echo ✅ Portlar temizlendi.
echo 🚀 Simdi sunucuyu baslatin: npm run dev
timeout /t 5

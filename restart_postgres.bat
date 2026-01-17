@echo off
echo PostgreSQL Servisi Yeniden Baslatiliyor...
net stop postgresql-x64-18
net start postgresql-x64-18
echo Islem tamamlandi.
pause

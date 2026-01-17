@echo off
echo ========================================
echo Property Listing Feature Setup
echo ========================================
echo.

echo Step 1: Running database migration...
cd /d "%~dp0server"
npx prisma migrate dev --name add_property_listings
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Database migration failed!
    echo.
    echo Common fixes:
    echo 1. Make sure PostgreSQL is running
    echo 2. Check your DATABASE_URL in server\.env
    echo 3. If migration already exists, try: npx prisma migrate resolve --applied add_property_listings
    echo.
    pause
    exit /b 1
)
echo Migration successful!
echo.

echo Step 2: Installing backend dependencies...
npm install uuid
if %errorlevel% neq 0 (
    echo ERROR: Backend dependency installation failed!
    pause
    exit /b 1
)
echo Backend dependencies installed!
echo.

echo Step 3: Installing frontend dependencies...
cd /d "%~dp0client"
npm install react-to-print qrcode.react
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependency installation failed!
    pause
    exit /b 1
)
echo Frontend dependencies installed!
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Your company branding has been configured:
echo - Company: Trio Emlak Gayrimenkul
echo - Phone: 0533 378 68 94 / 0552 473 10 21
echo - Email: trio.emlak.ayvalik@gmail.com
echo.
echo Next steps:
echo 1. Restart your application servers
echo 2. Test the property listing feature
echo 3. Click the purple button on any property in the dashboard
echo.
pause

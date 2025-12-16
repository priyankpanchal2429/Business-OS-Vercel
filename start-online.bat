@echo off
TITLE Business-OS Local Server & Tunnel
echo ===================================================
echo    STARTING BUSINESS-OS LOCAL SERVER
echo ===================================================
echo.
echo [1/2] Starting Backend Server...
echo (This window will stay open. Do not close it!)
echo.
:: Using "start" without /min so you can see errors if any.
start "Business-OS Backend" cmd /k "cd server && set NODE_ENV=production && node index.js"

echo.
echo [2/2] Starting Serveo Tunnel...
echo.
echo ===================================================
echo    IMPORTANT: COPY THE URL BELOW
echo ===================================================
echo Search for the URL that ends with ".serveo.net"
echo Example: https://random-name.serveo.net
echo.
echo PASTE this URL into your Vercel Settings -> Environment Variables -> VITE_API_URL
echo.
echo (Press Ctrl+C to stop the tunnel)
echo ===================================================
echo.
ssh -i C:\Users\Rajesh\.ssh\id_rsa -o ServerAliveInterval=60 -R business-os-master-server:80:localhost:3001 serveo.net

@echo off
TITLE Business-OS Serveo Tunnel
echo ===================================================
echo    STARTING SERVEO TUNNEL
echo ===================================================
echo.
echo This will expose your local server (port 3000) to the internet.
echo.
echo IMPORTANT:
echo 1. Copy the URL ending in .serveo.net from below.
echo 2. Go to Vercel -> Settings -> Environment Variables.
echo 3. Update VITE_API_URL with this new URL.
echo 4. Redeploy your project.
echo.
echo ===================================================
echo.
ssh -o ServerAliveInterval=60 -R 80:localhost:3000 serveo.net

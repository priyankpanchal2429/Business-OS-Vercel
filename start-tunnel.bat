@echo off
TITLE Business-OS Cloudflare Tunnel
echo ===================================================
echo    STARTING CLOUDFLARE TUNNEL
echo ===================================================
echo.
echo This will expose your local server (port 3000) to the internet.
echo.
echo IMPORTANT:
echo 1. Copy the URL ending in .trycloudflare.com from below.
echo 2. Go to Vercel -> Settings -> Environment Variables.
echo 3. Update VITE_API_URL with this new URL.
echo 4. Redeploy your project.
echo.
echo ===================================================
echo.
cd /d "%~dp0\server"
cloudflared.exe tunnel --url http://localhost:3000
pause

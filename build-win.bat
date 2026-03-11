@echo off
echo ============================================================
echo   PhotoCard Studio v1.6 — Windows Build
echo   Features: AI Search, Gemini, Resize Handles, Logo
echo ============================================================
where node >nul 2>&1 || (echo Node.js not found. Install from nodejs.org && pause && exit /b 1)
echo [1/3] Installing packages...
call npm install
echo [2/3] Building React app...
call npx webpack --mode production
echo [3/3] Packaging Windows installer + portable...
call npx electron-builder --win --x64
echo Done! Check the release\ folder.
pause

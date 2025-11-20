@echo off
echo ========================================
echo    Iniciando EcoScan
echo ========================================
echo.
echo Iniciando Backend (servidor)...
start "EcoScan Backend" cmd /k "node server.js"
timeout /t 2 /nobreak >nul
echo.
echo Iniciando Frontend (Vite)...
start "EcoScan Frontend" cmd /k "npm run dev"
echo.
echo ========================================
echo  Ambos servidores iniciados!
echo  Backend: http://localhost:3000
echo  Frontend: http://localhost:5173
echo ========================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul

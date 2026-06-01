@echo off
title FinanzasOS
cd /d "%~dp0"
echo.
echo  Iniciando FinanzasOS...
echo  Abre tu navegador en: http://localhost:8765
echo  Cierra esta ventana para apagar el servidor.
echo.
python server.py
pause

@echo off
REM Script para iniciar o Sistema de Estoque na LAN

cd /d C:\Estoque

echo.
echo ================================
echo Sistema de Estoque - LAN
echo ================================
echo.

REM Verificar se npm está instalado
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js/npm não encontrado!
    echo Instale de: https://nodejs.org
    pause
    exit /b 1
)

REM Limpar banco de dados se existir arquivo .reset
if exist ".reset" (
    echo Deletando banco de dados anterior...
    del database\estoque.db 2>nul
    del ".reset"
    echo Banco resetado!
)

echo Iniciando servidor...
echo.
echo [IMPORTANTE] Acesse pelo seu navegador:
echo - Localhost: http://localhost:3000/login.html
echo - Rede Local: http://[SEU_IP]:3000/login.html
echo.
echo Credenciais:
echo - admin / admin123
echo - user / user123
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm start

pause

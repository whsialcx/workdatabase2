@echo off
chcp 65001 >nul
title Spring Boot Application with Nginx

echo ========================================
echo    Starting Spring Boot Application
echo    and Nginx Server
echo ========================================
echo.

REM 设置路径
set JAR_PATH=E:\GitHub\workdatabase2\work\target\work-0.0.1-SNAPSHOT.jar
set NGINX_PATH=E:\nginx-1.29.3\nginx-1.29.3\nginx.exe
set NGINX_DIR=E:\nginx-1.29.3\nginx-1.29.3

REM 检查JAR文件是否存在
if not exist "%JAR_PATH%" (
    echo ERROR: JAR file not found at %JAR_PATH%
    echo Please make sure the project is built successfully.
    pause
    exit /b 1
)

REM 检查Nginx是否存在
if not exist "%NGINX_PATH%" (
    echo ERROR: Nginx not found at %NGINX_PATH%
    echo Please check the nginx installation path.
    pause
    exit /b 1
)

REM 检查Java是否安装
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java is not installed or not in system PATH.
    echo Please install Java and ensure it's available in PATH.
    pause
    exit /b 1
)

echo Application: work-0.0.1-SNAPSHOT.jar
echo Server: 0.0.0.0:8080
echo Nginx: %NGINX_PATH%
echo.

REM 停止可能已经在运行的Nginx进程
echo Stopping any running Nginx processes...
taskkill /f /im nginx.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM 启动Nginx
echo Starting Nginx...
cd /d "%NGINX_DIR%"
start "Nginx Server" nginx.exe
timeout /t 3 /nobreak >nul

REM 检查Nginx是否启动成功
tasklist /fi "imagename eq nginx.exe" | find /i "nginx.exe" >nul
if errorlevel 1 (
    echo ERROR: Failed to start Nginx
    pause
    exit /b 1
) else (
    echo Nginx started successfully
)

echo.
echo Starting Spring Boot application...
echo.

REM 运行Spring Boot应用
java -jar "%JAR_PATH%" --server.address=0.0.0.0 --server.port=8080

REM Spring Boot应用停止后，停止Nginx
echo.
echo ========================================
echo    Spring Boot application stopped
echo    Stopping Nginx...
echo ========================================

REM 停止Nginx
cd /d "%NGINX_DIR%"
nginx.exe -s quit
timeout /t 3 /nobreak >nul

REM 强制杀死任何残留的Nginx进程
taskkill /f /im nginx.exe >nul 2>&1

echo All services have been stopped.
pause
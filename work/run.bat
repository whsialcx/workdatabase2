@echo off
chcp 65001 >nul
title Spring Boot Application with Nginx and Kafka
setlocal enabledelayedexpansion

echo ========================================
echo    Starting Spring Boot Application
echo    with Nginx and Kafka Services
echo ========================================
echo.

REM ========== 配置区域 ==========
REM 设置路径
set JAR_PATH=E:\GitHub\workdatabase2\work\target\library.jar
set NGINX_PATH=E:\nginx-1.29.3\nginx-1.29.3\nginx.exe
set NGINX_DIR=E:\nginx-1.29.3\nginx-1.29.3

REM Kafka容器名称（必须与之前创建的容器名称一致）
set ZOOKEEPER_CONTAINER=zookeeper
set KAFKA_CONTAINER=kafka
REM =============================

echo 正在检查依赖环境...
echo.

REM 1. 检查JAR文件是否存在
if not exist "%JAR_PATH%" (
    echo [错误] 未找到JAR文件: %JAR_PATH%
    echo 请确保项目已成功构建。
    pause
    exit /b 1
) else (
    echo [✓] JAR文件: %JAR_PATH%
)

REM 2. 检查Nginx是否存在
if not exist "%NGINX_PATH%" (
    echo [错误] 未找到Nginx: %NGINX_PATH%
    echo 请检查Nginx安装路径。
    pause
    exit /b 1
) else (
    echo [✓] Nginx: %NGINX_PATH%
)

REM 3. 检查Java是否安装
java -version >nul 2>&1
if errorlevel 1 (
    echo [错误] Java未安装或不在系统PATH中。
    echo 请安装Java并确保其在PATH中可用。
    pause
    exit /b 1
) else (
    echo [✓] Java已安装
)

REM 4. 检查Docker服务是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker服务未运行。
    echo 请启动Docker Desktop并确保其正在运行。
    pause
    exit /b 1
) else (
    echo [✓] Docker服务正在运行
)

echo.
echo ========================================
echo 启动服务...
echo ========================================
echo.

REM 停止可能已经在运行的Nginx进程
echo [1/5] 停止已运行的Nginx进程...
taskkill /f /im nginx.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM 停止可能已经在运行的Kafka容器
echo [2/5] 停止Kafka相关容器...
docker stop %KAFKA_CONTAINER% >nul 2>&1
docker stop %ZOOKEEPER_CONTAINER% >nul 2>&1
timeout /t 3 /nobreak >nul

REM 启动Nginx
echo [3/5] 启动Nginx...
cd /d "%NGINX_DIR%"
start "Nginx Server" /MIN nginx.exe
timeout /t 3 /nobreak >nul

REM 检查Nginx是否启动成功
tasklist /fi "imagename eq nginx.exe" | find /i "nginx.exe" >nul
if errorlevel 1 (
    echo [错误] Nginx启动失败
    pause
    exit /b 1
) else (
    echo [✓] Nginx启动成功
)

REM 启动ZooKeeper容器
echo [4/5] 启动ZooKeeper容器(%ZOOKEEPER_CONTAINER%)...
docker start %ZOOKEEPER_CONTAINER% >nul 2>&1
if errorlevel 1 (
    echo [错误] ZooKeeper容器启动失败，尝试重新创建...
    echo 请确保已按之前步骤创建容器，或检查容器名称。
    pause
    exit /b 1
) else (
    echo [等待] ZooKeeper启动中，请等待5秒...
    timeout /t 5 /nobreak >nul
    echo [✓] ZooKeeper已启动 (端口:2181)
)

REM 启动Kafka容器
echo [5/5] 启动Kafka容器(%KAFKA_CONTAINER%)...
docker start %KAFKA_CONTAINER% >nul 2>&1
if errorlevel 1 (
    echo [错误] Kafka容器启动失败，尝试重新创建...
    echo 请确保已按之前步骤创建容器，或检查容器名称。
    pause
    exit /b 1
) else (
    echo [等待] Kafka启动中，请等待10秒...
    timeout /t 10 /nobreak >nul
    echo [✓] Kafka已启动 (端口:9092)
)

REM 验证Kafka是否可访问
echo.
echo 验证Kafka连接性...
docker exec %KAFKA_CONTAINER% kafka-topics --list --bootstrap-server localhost:9092 >nul 2>&1
if errorlevel 1 (
    echo [警告] Kafka连接测试失败，但将继续启动应用...
    echo 这可能是因为Kafka仍在初始化，稍后Spring Boot会自动重连。
) else (
    echo [✓] Kafka连接测试通过
)

echo.
echo ========================================
echo 所有基础服务已就绪!
echo - Nginx:      http://localhost:80
echo - ZooKeeper:  localhost:2181
echo - Kafka:      localhost:9092
echo - Spring Boot: http://localhost:8080
echo ========================================
echo.

REM 运行Spring Boot应用
echo 正在启动Spring Boot应用...
echo (按Ctrl+C停止所有服务)
echo ========================================
java -jar "%JAR_PATH%" --server.address=0.0.0.0 --server.port=8080

REM ========================================
REM Spring Boot应用停止后，清理所有服务
REM ========================================
echo.
echo ========================================
echo Spring Boot应用已停止
echo 正在停止所有服务...
echo ========================================

echo [1/3] 停止Kafka容器...
docker stop %KAFKA_CONTAINER% >nul 2>&1
echo [✓] Kafka已停止

echo [2/3] 停止ZooKeeper容器...
docker stop %ZOOKEEPER_CONTAINER% >nul 2>&1
echo [✓] ZooKeeper已停止

echo [3/3] 停止Nginx...
cd /d "%NGINX_DIR%"
nginx.exe -s quit >nul 2>&1
timeout /t 2 /nobreak >nul
taskkill /f /im nginx.exe >nul 2>&1
echo [✓] Nginx已停止

echo.
echo ========================================
echo 所有服务已停止。
echo ========================================
pause
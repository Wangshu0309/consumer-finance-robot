@echo off
set PYTHON=C:\Program Files\Python311\python.exe

echo ========================================
echo  大消费行业智能财务分析机器人
echo  正在启动服务...
echo ========================================

echo.
echo [1/2] 启动后端服务 (FastAPI)...
start "Backend" cmd /k "cd /d ""%~dp0backend"" && ""%PYTHON%"" -c ""import uvicorn; uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=False)"" "

echo [2/2] 启动前端服务 (Vite)...
start "Frontend" cmd /k "cd /d ""%~dp0frontend"" && npx vite --host 0.0.0.0"

echo.
echo 等待服务启动...
timeout /t 8 /nobreak >nul

echo.
echo 浏览器访问: http://localhost:5173
echo 如果浏览器没打开，手动访问上面的网址。
echo.
echo 不要关闭弹出的两个命令行窗口。
echo ========================================
start http://localhost:5173
pause

@echo off
REM 沈家本研究院官网 - Windows 一键启动
REM 1. 生成种子数据
echo 正在初始化数据库和种子数据...
"%~dp0..\..\..\..\..\..\.workbuddy\binaries\node\versions\22.22.2\node.exe" -e "require('./src/backend-js/db'); require('./src/backend-js/seed').seed(); console.log('Data seeded');"

REM 2. 启动 API 服务
echo.
echo 正在启动 API 服务...
start "沈家本研究院-API" "%~dp0..\..\..\..\..\..\.workbuddy\binaries\node\versions\22.22.2\node.exe" src/backend-js/server.js

REM 3. 打开首页
echo.
echo 服务已启动！
echo API 地址: http://localhost:5000/api/v1/
echo 管理后台: %~dp0src/admin/index.html
echo 管理员: admin / shenjiaben2026
start http://localhost:5000/api/v1/
pause

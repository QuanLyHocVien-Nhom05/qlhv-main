@echo off
setlocal
where node >nul 2>nul
if not errorlevel 1 goto system_node
if exist "%~dp0.tools\node-v22.16.0-win-x64\node.exe" goto portable_node
echo Can cai Node.js 22.16 tro len: https://nodejs.org/en/download
exit /b 1
:system_node
node "%~dp0scripts\start-local.cjs" %*
exit /b %errorlevel%
:portable_node
"%~dp0.tools\node-v22.16.0-win-x64\node.exe" "%~dp0scripts\start-local.cjs" %*
exit /b %errorlevel%

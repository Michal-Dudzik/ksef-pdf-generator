@echo off
REM KSeF PDF Generator CLI - Windows Batch Script
setlocal

REM Check if Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo Or use the standalone executable: ksef-pdf-generator.exe
    exit /b 1
)

REM Check if dist\cli.cjs exists
if not exist "%~dp0..\dist\cli.cjs" (
    echo ERROR: CLI tool not built yet
    echo.
    echo Please run scripts\setup.bat first to build the tool
    echo Or use the standalone executable: bin\ksef-pdf-generator.exe
    exit /b 1
)

REM Run the CLI
node "%~dp0..\dist\cli.cjs" %*
exit /b %ERRORLEVEL%


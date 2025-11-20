@echo off
setlocal

REM Change to project root directory (parent of scripts/)
cd /d "%~dp0.."

echo ========================================
echo KSeF PDF Generator - Setup
echo ========================================
echo.
echo Working directory: %CD%
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo Minimum required version: Node.js 18 or higher
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
echo Found Node.js version: %NODE_VERSION%

REM Check if npm is available
echo Checking npm installation...
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VERSION=%%i
echo Found npm version: %NPM_VERSION%
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Make sure you're running this script from the project directory
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Building CLI tool...
call npm run build
if errorlevel 1 (
    echo.
    echo ERROR: Failed to build CLI
    pause
    exit /b 1
)

REM Verify the build output
if not exist "dist\cli.cjs" (
    echo ERROR: Build succeeded but dist\cli.cjs not found
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo You can now use the tool:
echo   node dist/cli.cjs --help
echo.
echo Or use the wrapper script:
echo   bin\ksef-pdf-generator.bat -i input.xml -o output.pdf -t invoice
echo.
echo Test the installation:
echo   bin\ksef-pdf-generator.bat --help
echo.
pause


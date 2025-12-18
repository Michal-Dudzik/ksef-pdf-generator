@echo off
REM Compress the executable with UPX
REM This can reduce size by 50-70% (90MB -> 30-40MB)

cd /d "%~dp0.."

echo ========================================
echo Compressing ksef-pdf-generator with UPX
echo ========================================
echo.

REM Determine which executable to compress (prefer versioned filename from package.json)
setlocal enabledelayedexpansion
set "APP_VERSION="
for /f "usebackq tokens=*" %%i in (`node -p "require('./package.json').version" 2^>nul`) do set "APP_VERSION=%%i"

set "EXE_VERSIONED="
if defined APP_VERSION (
    set "EXE_VERSIONED=bin\ksef-pdf-generator-ver-!APP_VERSION!.exe"
)
set "EXE_LATEST=bin\ksef-pdf-generator.exe"
set "EXE_TARGET="

if defined EXE_VERSIONED if exist "!EXE_VERSIONED!" (
    set "EXE_TARGET=!EXE_VERSIONED!"
) else if exist "!EXE_LATEST!" (
    set "EXE_TARGET=!EXE_LATEST!"
)

if not defined EXE_TARGET (
    echo ERROR: No executable found to compress.
    if defined EXE_VERSIONED echo Tried: !EXE_VERSIONED!
    echo Tried: !EXE_LATEST!
    echo Please run scripts\build-standalone-win.bat first.
    echo.
    pause
    exit /b 1
)

echo Target: !EXE_TARGET!
echo.

REM Check if UPX is installed
where upx >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo UPX not found in PATH!
    echo.
    echo To install UPX:
    echo   1. Download from: https://upx.github.io/
    echo   2. Extract upx.exe to a folder in your PATH
    echo   OR
    echo   Use winget: winget install upx.upx
    echo   Use scoop: scoop install upx
    echo.
    pause
    exit /b 1
)

for %%A in ("!EXE_TARGET!") do set "EXE_BASENAME=%%~nxA"

echo Original size:
dir "!EXE_TARGET!" | find /I "!EXE_BASENAME!"
echo.

echo Compressing... (this may take a minute)
upx --best --lzma "!EXE_TARGET!"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo Compression completed successfully!
    echo ========================================
    echo.
    echo New size:
    dir "!EXE_TARGET!" | find /I "!EXE_BASENAME!"
    echo.
    echo The executable is now significantly smaller!
    echo Note: First launch may be slightly slower due to decompression.
) else (
    echo ERROR: Compression failed
    exit /b 1
)

echo.
pause


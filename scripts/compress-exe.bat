@echo off
REM Compress the executable with UPX
REM This can reduce size by 50-70% (90MB -> 30-40MB)

cd /d "%~dp0.."

echo ========================================
echo Compressing ksef-pdf-generator.exe with UPX
echo ========================================
echo.

if not exist "bin\ksef-pdf-generator.exe" (
    echo ERROR: bin\ksef-pdf-generator.exe not found!
    echo Please run build-standalone-win.bat first.
    pause
    exit /b 1
)

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

echo Original size:
dir bin\ksef-pdf-generator.exe | find "ksef-pdf-generator.exe"
echo.

echo Compressing... (this may take a minute)
upx --best --lzma bin\ksef-pdf-generator.exe

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo Compression completed successfully!
    echo ========================================
    echo.
    echo New size:
    dir bin\ksef-pdf-generator.exe | find "ksef-pdf-generator.exe"
    echo.
    echo The executable is now significantly smaller!
    echo Note: First launch may be slightly slower due to decompression.
) else (
    echo ERROR: Compression failed
    exit /b 1
)

echo.
pause


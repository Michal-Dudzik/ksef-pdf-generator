@echo off
setlocal enabledelayedexpansion

REM Change to project root directory (parent of scripts/)
cd /d "%~dp0.."

echo ========================================
echo KSeF PDF Generator - Standalone Build
echo Using Node.js Single Executable Applications (SEA)
echo ========================================
echo.
echo Working directory: %CD%
echo.

REM Read app version from package.json (requires Node.js)
set "APP_VERSION="
for /f "usebackq tokens=*" %%i in (`node -p "require('./package.json').version" 2^>nul`) do set "APP_VERSION=%%i"
if not defined APP_VERSION (
    set "APP_VERSION=unknown"
)

set "EXE_VERSIONED=bin\ksef-pdf-generator-ver-!APP_VERSION!.exe"
set "EXE_LATEST=bin\ksef-pdf-generator.exe"

echo App version: !APP_VERSION!
echo Output (versioned): !EXE_VERSIONED!
echo Output (latest): !EXE_LATEST!
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Step 1: Creating bundled application with esbuild...
call npm run bundle
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to bundle application
    pause
    exit /b 1
)

echo.
echo Step 1b: Copying required jsdom worker file...
if not exist "dist\" mkdir dist
copy /Y "node_modules\jsdom\lib\jsdom\living\xhr\xhr-sync-worker.js" "dist\xhr-sync-worker.js" >nul
if %ERRORLEVEL% neq 0 (
    echo WARNING: Could not copy xhr-sync-worker.js
)

echo.
echo Step 2: Creating SEA configuration...
if not exist "build\" mkdir build
(
echo {
echo   "main": "dist/cli.cjs",
echo   "output": "build/sea-prep.blob",
echo   "disableExperimentalSEAWarning": true,
echo   "useSnapshot": false,
echo   "useCodeCache": true
echo }
) > build\sea-config.json

echo.
echo Step 3: Generating SEA blob...
node --experimental-sea-config build\sea-config.json
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to generate SEA blob
    pause
    exit /b 1
)

echo.
echo Step 4: Copying Node.js binary...
if not exist "bin\" mkdir bin
node -e "require('fs').copyFileSync(process.execPath, process.argv[1])" "!EXE_VERSIONED!"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to copy Node.js binary
    pause
    exit /b 1
)

REM Get Node.js version for the success message
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i

echo.
echo Step 5: Injecting application into executable...
REM Remove signature (Windows) - Try to find signtool
set "SIGNTOOL="

REM Check if signtool is in PATH
where signtool >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set "SIGNTOOL=signtool"
) else (
    REM Search common Windows SDK locations
    for /f "tokens=*" %%i in ('dir /b /s "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\signtool.exe" 2^>nul ^| sort /r') do (
        set "SIGNTOOL=%%i"
        goto :found_signtool
    )
    for /f "tokens=*" %%i in ('dir /b /s "C:\Program Files (x86)\Windows Kits\10\bin\*\x86\signtool.exe" 2^>nul ^| sort /r') do (
        set "SIGNTOOL=%%i"
        goto :found_signtool
    )
)
:found_signtool

if defined SIGNTOOL (
    echo Found signtool, removing original Node.js signature...
    "%SIGNTOOL%" remove /s "!EXE_VERSIONED!" >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo Successfully removed signature
    ) else (
        echo Note: Could not remove signature, continuing anyway...
    )
) else (
    echo.
    echo Note: signtool not found - signature removal skipped
    echo.
    echo This will cause a "signature seems corrupted" warning during injection.
    echo The executable will still work, but may trigger SmartScreen warnings.
    echo.
    echo To fix this, install Windows SDK from:
    echo   https://developer.microsoft.com/windows/downloads/windows-sdk/
    echo.
)

REM Inject the blob using postject (via npx)
npx --yes postject "!EXE_VERSIONED!" NODE_SEA_BLOB build\sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to inject blob into executable
    pause
    exit /b 1
)

echo.
echo Step 6: Cleaning up temporary files...
del build\sea-config.json 2>nul
del build\sea-prep.blob 2>nul

echo.
echo Step 6b: Creating/Updating latest executable copy...
copy /Y "!EXE_VERSIONED!" "!EXE_LATEST!" >nul
if %ERRORLEVEL% neq 0 (
    echo WARNING: Failed to copy to !EXE_LATEST!
) else (
    echo Latest copy updated: !EXE_LATEST!
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Standalone executable created: !EXE_VERSIONED!
echo Stable copy created: !EXE_LATEST!
echo.

REM Get file size
for %%A in ("!EXE_VERSIONED!") do set SIZE=%%~zA
set /a SIZE_MB=!SIZE! / 1048576
echo File size: !SIZE_MB! MB (!SIZE! bytes)
echo.

echo This executable includes:
echo   - Node.js runtime (v%NODE_VERSION%)
echo   - All dependencies bundled
echo   - Your application code
echo.

REM Check if UPX is available
where upx >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo UPX detected - Would you like to compress?
    echo ========================================
    echo.
    echo UPX can reduce the file size by 50-70%% (e.g., 90MB to 30-40MB)
    echo First launch will be slightly slower due to decompression.
    echo.
    choice /C YN /M "Compress with UPX"
    if !ERRORLEVEL! equ 1 (
        echo.
        echo Compressing with UPX...
        upx --best --lzma "!EXE_VERSIONED!"
        if !ERRORLEVEL! equ 0 (
            echo.
            echo Compression successful!
            for %%A in ("!EXE_VERSIONED!") do set NEW_SIZE=%%~zA
            set /a NEW_SIZE_MB=!NEW_SIZE! / 1048576
            set /a SAVED=!SIZE! - !NEW_SIZE!
            set /a SAVED_MB=!SAVED! / 1048576
            echo New size: !NEW_SIZE_MB! MB (!NEW_SIZE! bytes)
            echo Saved: !SAVED_MB! MB (!SAVED! bytes)
        ) else (
            echo WARNING: Compression failed, but executable is still usable.
        )
    )
) else (
    echo.
    echo ========================================
    echo TIP: Reduce file size by 50-70%%
    echo ========================================
    echo.
    echo Install UPX to compress the executable:
    echo   winget install upx.upx
    echo   OR
    echo   scoop install upx
    echo   OR
    echo   Download from: https://upx.github.io/
    echo.
    echo Then run: scripts\compress-exe.bat
    echo.
)

echo.
echo You can now copy !EXE_VERSIONED! to any Windows machine
echo without requiring Node.js installation!
echo.
echo Usage:
echo   !EXE_VERSIONED! -i input.xml -o output.pdf -t invoice
echo   (or) !EXE_LATEST! -i input.xml -o output.pdf -t invoice
echo.
pause

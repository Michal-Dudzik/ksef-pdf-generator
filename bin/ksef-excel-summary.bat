@echo off
REM KSeF Excel Summary Generator - Windows Wrapper Script

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Navigate to project root (one level up from bin)
cd /d "%SCRIPT_DIR%.."

REM Check if dist/excel-summary.cjs exists
if not exist "dist\excel-summary.cjs" (
    echo Error: excel-summary.cjs not found. Please run 'npm run build' first.
    exit /b 1
)

REM Run the CLI with all provided arguments
node dist\excel-summary.cjs %*

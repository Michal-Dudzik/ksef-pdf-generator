@echo off
setlocal enabledelayedexpansion

REM Change to project root directory (parent of scripts/)
cd /d "%~dp0.."

echo ========================================
echo KSeF PDF Generator - Diagnostic Tool
echo ========================================
echo.
echo This script will check your environment for common issues
echo and test PDF generation with the example invoice.
echo.
echo Working directory: %CD%
echo.

set "LOGFILE=%CD%\diagnostics.log"
echo Diagnostics started at %date% %time% > "%LOGFILE%"
echo. >> "%LOGFILE%"

REM Check 1: Node.js
echo [1/9] Checking Node.js installation...
where node >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo   [FAIL] Node.js not found in PATH
    echo   [FAIL] Node.js not found in PATH >> "%LOGFILE%"
    set HAS_NODE=0
) else (
    for /f "tokens=*" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
    echo   [OK] Node.js version: !NODE_VERSION!
    echo   [OK] Node.js version: !NODE_VERSION! >> "%LOGFILE%"
    
    REM Check Node path
    for /f "tokens=*" %%i in ('where node 2^>^&1') do (
        echo   Node.js path: %%i
        echo   Node.js path: %%i >> "%LOGFILE%"
        goto :node_found
    )
    :node_found
    set HAS_NODE=1
)
echo.

REM Check 2: npm
echo [2/9] Checking npm installation...
where npm >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo   [FAIL] npm not found in PATH
    echo   [FAIL] npm not found in PATH >> "%LOGFILE%"
    set HAS_NPM=0
) else (
    for /f "tokens=*" %%i in ('npm --version 2^>^&1') do set NPM_VERSION=%%i
    echo   [OK] npm version: !NPM_VERSION!
    echo   [OK] npm version: !NPM_VERSION! >> "%LOGFILE%"
    set HAS_NPM=1
)
echo.

REM Check 3: Project files
echo [3/9] Checking project files...
if not exist "package.json" (
    echo   [FAIL] package.json not found
    echo   [FAIL] package.json not found >> "%LOGFILE%"
) else (
    echo   [OK] package.json found
    echo   [OK] package.json found >> "%LOGFILE%"
)

if not exist "scripts\setup.bat" (
    echo   [FAIL] scripts\setup.bat not found
    echo   [FAIL] scripts\setup.bat not found >> "%LOGFILE%"
) else (
    echo   [OK] scripts\setup.bat found
    echo   [OK] scripts\setup.bat found >> "%LOGFILE%"
)

if exist "assets\invoice.xml" (
    echo   [OK] assets\invoice.xml found
    echo   [OK] assets\invoice.xml found >> "%LOGFILE%"
) else (
    echo   [WARN] assets\invoice.xml not found - functional test will be skipped
    echo   [WARN] assets\invoice.xml not found >> "%LOGFILE%"
)
echo.

REM Check 4: Built files
echo [4/9] Checking built files...
if not exist "dist\cli.cjs" (
    echo   [WARN] dist\cli.cjs not found - run setup.bat first
    echo   [WARN] dist\cli.cjs not found >> "%LOGFILE%"
) else (
    echo   [OK] dist\cli.cjs found
    echo   [OK] dist\cli.cjs found >> "%LOGFILE%"
)

if not exist "bin\ksef-pdf-generator.exe" (
    echo   [WARN] bin\ksef-pdf-generator.exe not found
    echo   [WARN] bin\ksef-pdf-generator.exe not found >> "%LOGFILE%"
) else (
    echo   [OK] bin\ksef-pdf-generator.exe found
    echo   [OK] bin\ksef-pdf-generator.exe found >> "%LOGFILE%"
    
    REM Get file size
    for %%F in ("bin\ksef-pdf-generator.exe") do set SIZE=%%~zF
    echo   Executable size: !SIZE! bytes
    echo   Executable size: !SIZE! bytes >> "%LOGFILE%"
)
echo.

REM Check 5: node_modules
echo [5/9] Checking dependencies...
if not exist "node_modules\" (
    echo   [WARN] node_modules not found - run npm install
    echo   [WARN] node_modules not found >> "%LOGFILE%"
) else (
    echo   [OK] node_modules directory found
    echo   [OK] node_modules directory found >> "%LOGFILE%"
    
    REM Check key dependencies
    if exist "node_modules\jsdom\" (
        echo   [OK] jsdom installed
        echo   [OK] jsdom installed >> "%LOGFILE%"
    ) else (
        echo   [WARN] jsdom not found
        echo   [WARN] jsdom not found >> "%LOGFILE%"
    )
    
    if exist "node_modules\pdfmake\" (
        echo   [OK] pdfmake installed
        echo   [OK] pdfmake installed >> "%LOGFILE%"
    ) else (
        echo   [WARN] pdfmake not found
        echo   [WARN] pdfmake not found >> "%LOGFILE%"
    )
    
    if exist "node_modules\xml-js\" (
        echo   [OK] xml-js installed
        echo   [OK] xml-js installed >> "%LOGFILE%"
    ) else (
        echo   [WARN] xml-js not found
        echo   [WARN] xml-js not found >> "%LOGFILE%"
    )
)
echo.

REM Check 6: PATH environment
echo [6/9] Checking PATH environment...
echo Current PATH: >> "%LOGFILE%"
echo %PATH% >> "%LOGFILE%"
echo   PATH entries written to diagnostics.log
echo.

REM Check 7: Permissions
echo [7/9] Checking file permissions...
echo. > test_write.tmp 2>nul
if exist test_write.tmp (
    echo   [OK] Can write to current directory
    echo   [OK] Can write to current directory >> "%LOGFILE%"
    del test_write.tmp >nul 2>&1
) else (
    echo   [FAIL] Cannot write to current directory
    echo   [FAIL] Cannot write to current directory >> "%LOGFILE%"
)
echo.

REM Check 8: Test execution
echo [8/9] Testing execution...
if exist "bin\ksef-pdf-generator.exe" (
    echo Testing standalone executable...
    bin\ksef-pdf-generator.exe --help >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo   [OK] bin\ksef-pdf-generator.exe runs successfully
        echo   [OK] bin\ksef-pdf-generator.exe runs successfully >> "%LOGFILE%"
    ) else (
        echo   [FAIL] bin\ksef-pdf-generator.exe failed to run (exit code: !ERRORLEVEL!^)
        echo   [FAIL] bin\ksef-pdf-generator.exe failed (exit code: !ERRORLEVEL!^) >> "%LOGFILE%"
        
        REM Try to get more error details
        echo   Attempting detailed error check...
        bin\ksef-pdf-generator.exe --help > test_output.log 2>&1
        if exist test_output.log (
            echo   Error output: >> "%LOGFILE%"
            type test_output.log >> "%LOGFILE%"
            del test_output.log >nul 2>&1
        )
    )
) else (
    echo   [SKIP] bin\ksef-pdf-generator.exe not found
    echo   [SKIP] bin\ksef-pdf-generator.exe not found >> "%LOGFILE%"
)

if exist "dist\cli.cjs" (
    if !HAS_NODE! equ 1 (
        echo Testing Node.js CLI...
        node dist\cli.cjs --help >nul 2>&1
        if !ERRORLEVEL! equ 0 (
            echo   [OK] Node.js CLI runs successfully
            echo   [OK] Node.js CLI runs successfully >> "%LOGFILE%"
        ) else (
            echo   [FAIL] Node.js CLI failed to run (exit code: !ERRORLEVEL!^)
            echo   [FAIL] Node.js CLI failed (exit code: !ERRORLEVEL!^) >> "%LOGFILE%"
        )
    )
)
echo.

REM Check 9: Functional test with example invoice
echo [9/9] Running functional test...
set FUNCTIONAL_TEST_PASSED=0

if exist "assets\invoice.xml" (
    echo Testing PDF generation with example invoice...
    
    REM Try with standalone executable first
    if exist "bin\ksef-pdf-generator.exe" (
        echo   Testing with standalone executable...
        bin\ksef-pdf-generator.exe -i assets\invoice.xml -o test_diagnostic_output.pdf -t invoice > test_functional.log 2>&1
        
        if !ERRORLEVEL! equ 0 (
            if exist "test_diagnostic_output.pdf" (
                REM Check if PDF file is not empty
                for %%F in ("test_diagnostic_output.pdf") do set PDF_SIZE=%%~zF
                
                if !PDF_SIZE! gtr 1000 (
                    echo   [OK] PDF generated successfully (size: !PDF_SIZE! bytes^)
                    echo   [OK] PDF generated successfully (size: !PDF_SIZE! bytes^) >> "%LOGFILE%"
                    set FUNCTIONAL_TEST_PASSED=1
                    
                    REM Clean up test file
                    del test_diagnostic_output.pdf >nul 2>&1
                ) else (
                    echo   [FAIL] PDF file is too small (!PDF_SIZE! bytes^) - likely corrupted
                    echo   [FAIL] PDF file is too small (!PDF_SIZE! bytes^) >> "%LOGFILE%"
                    del test_diagnostic_output.pdf >nul 2>&1
                )
            ) else (
                echo   [FAIL] PDF generation reported success but file not created
                echo   [FAIL] PDF not created despite success exit code >> "%LOGFILE%"
            )
        ) else (
            echo   [FAIL] PDF generation failed (exit code: !ERRORLEVEL!^)
            echo   [FAIL] PDF generation failed (exit code: !ERRORLEVEL!^) >> "%LOGFILE%"
            
            REM Log error details
            if exist test_functional.log (
                echo   Error details: >> "%LOGFILE%"
                type test_functional.log >> "%LOGFILE%"
            )
        )
        
        REM Clean up log file
        if exist test_functional.log del test_functional.log >nul 2>&1
        
    ) else if exist "dist\cli.cjs" (
        if !HAS_NODE! equ 1 (
            echo   Testing with Node.js CLI...
            node dist\cli.cjs -i assets\invoice.xml -o test_diagnostic_output.pdf -t invoice > test_functional.log 2>&1
            
            if !ERRORLEVEL! equ 0 (
                if exist "test_diagnostic_output.pdf" (
                    REM Check if PDF file is not empty
                    for %%F in ("test_diagnostic_output.pdf") do set PDF_SIZE=%%~zF
                    
                    if !PDF_SIZE! gtr 1000 (
                        echo   [OK] PDF generated successfully (size: !PDF_SIZE! bytes^)
                        echo   [OK] PDF generated successfully (size: !PDF_SIZE! bytes^) >> "%LOGFILE%"
                        set FUNCTIONAL_TEST_PASSED=1
                        
                        REM Clean up test file
                        del test_diagnostic_output.pdf >nul 2>&1
                    ) else (
                        echo   [FAIL] PDF file is too small (!PDF_SIZE! bytes^) - likely corrupted
                        echo   [FAIL] PDF file is too small (!PDF_SIZE! bytes^) >> "%LOGFILE%"
                        del test_diagnostic_output.pdf >nul 2>&1
                    )
                ) else (
                    echo   [FAIL] PDF generation reported success but file not created
                    echo   [FAIL] PDF not created despite success exit code >> "%LOGFILE%"
                )
            ) else (
                echo   [FAIL] PDF generation failed (exit code: !ERRORLEVEL!^)
                echo   [FAIL] PDF generation failed (exit code: !ERRORLEVEL!^) >> "%LOGFILE%"
                
                REM Log error details
                if exist test_functional.log (
                    echo   Error details: >> "%LOGFILE%"
                    type test_functional.log >> "%LOGFILE%"
                )
            )
            
            REM Clean up log file
            if exist test_functional.log del test_functional.log >nul 2>&1
        ) else (
            echo   [SKIP] Node.js not available
            echo   [SKIP] Node.js not available for functional test >> "%LOGFILE%"
        )
    ) else (
        echo   [SKIP] No executable found to test
        echo   [SKIP] No executable found for functional test >> "%LOGFILE%"
    )
) else (
    echo   [SKIP] assets\invoice.xml not found
    echo   [SKIP] assets\invoice.xml not found >> "%LOGFILE%"
)
echo.

REM Summary
echo ========================================
echo Summary
echo ========================================
echo Full diagnostic log saved to: %LOGFILE%
echo.

if !HAS_NODE! equ 0 (
    echo ISSUE: Node.js is not installed
    echo SOLUTION: Install Node.js from https://nodejs.org/ (version 18 or higher^)
    echo           OR use the standalone executable if available
    echo.
)

if !FUNCTIONAL_TEST_PASSED! equ 1 (
    echo [SUCCESS] Functional test passed - PDF generation is working!
    echo.
) else (
    if exist "assets\invoice.xml" (
        if exist "bin\ksef-pdf-generator.exe" (
            echo [WARNING] Functional test failed - PDF generation may not work properly
            echo            Check diagnostics.log for error details
            echo.
        ) else if exist "dist\cli.cjs" (
            if !HAS_NODE! equ 1 (
                echo [WARNING] Functional test failed - PDF generation may not work properly
                echo            Check diagnostics.log for error details
                echo.
            )
        )
    )
)

if exist "bin\ksef-pdf-generator.exe" (
    echo RECOMMENDED: Use the standalone executable
    echo   bin\ksef-pdf-generator.exe -i input.xml -o output.pdf -t invoice
    echo.
) else if !HAS_NODE! equ 1 (
    if not exist "dist\cli.cjs" (
        echo RECOMMENDED: Run scripts\setup.bat to build the tool
        echo   scripts\setup.bat
        echo.
    ) else (
        echo RECOMMENDED: Use the Node.js version
        echo   bin\ksef-pdf-generator.bat -i input.xml -o output.pdf -t invoice
        echo.
    )
)

echo For detailed logs, check:
echo   - diagnostics.log (this diagnostic run^)
echo   - setup.log (if you ran scripts\setup.bat^)
echo.

pause


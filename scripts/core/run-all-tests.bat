@echo off
setlocal EnableDelayedExpansion

REM 🧪 COMPREHENSIVE TEST RUNNER (Windows)
REM Runs ALL tests and saves results with timestamps

echo 🧪 COMPREHENSIVE TEST RUNNER
echo Starting test run at: %date% %time%

REM Create timestamp (Windows format)
set "datetime=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "datetime=%datetime: =0%"
set "TEST_RESULTS_DIR=test-results"
set "RUN_DIR=%TEST_RESULTS_DIR%\run_%datetime%"

echo Results will be saved to: %RUN_DIR%

REM Create directories
mkdir "%RUN_DIR%\unit-integration" 2>nul
mkdir "%RUN_DIR%\e2e" 2>nul
mkdir "%RUN_DIR%\reports" 2>nul
mkdir "%RUN_DIR%\logs" 2>nul

REM Save environment info
echo # Test Run Environment Info > "%RUN_DIR%\environment.md"
echo - **Timestamp**: %date% %time% >> "%RUN_DIR%\environment.md"
node --version > temp_node.txt
set /p NODE_VERSION=<temp_node.txt
echo - **Node Version**: %NODE_VERSION% >> "%RUN_DIR%\environment.md"
npm --version > temp_npm.txt
set /p NPM_VERSION=<temp_npm.txt
echo - **NPM Version**: %NPM_VERSION% >> "%RUN_DIR%\environment.md"
git branch --show-current > temp_branch.txt
set /p GIT_BRANCH=<temp_branch.txt
echo - **Git Branch**: %GIT_BRANCH% >> "%RUN_DIR%\environment.md"
git rev-parse HEAD > temp_commit.txt
set /p GIT_COMMIT=<temp_commit.txt
echo - **Git Commit**: %GIT_COMMIT% >> "%RUN_DIR%\environment.md"
echo - **Working Directory**: %cd% >> "%RUN_DIR%\environment.md"
del temp_*.txt

REM Initialize results summary
set "SUMMARY_FILE=%RUN_DIR%\TEST_SUMMARY.md"
echo # 🧪 COMPREHENSIVE TEST RESULTS > "%SUMMARY_FILE%"
echo **Run Date**: %date% %time% >> "%SUMMARY_FILE%"
echo **Run ID**: %datetime% >> "%SUMMARY_FILE%"
echo. >> "%SUMMARY_FILE%"

REM Test counters
set /a TOTAL_TESTS=0
set /a PASSED_TESTS=0
set /a FAILED_TESTS=0

echo.
echo 📋 PHASE 1: LINT ^& TYPE CHECK

REM Lint check
echo Running lint check...
npm run lint:check > "%RUN_DIR%\logs\lint.txt" 2>&1
if %errorlevel% equ 0 (
    echo ✅ Lint check passed
    echo ## 📋 Lint Check: ✅ PASSED >> "%SUMMARY_FILE%"
) else (
    echo ❌ Lint check failed
    echo ## 📋 Lint Check: ❌ FAILED >> "%SUMMARY_FILE%"
)

REM Type check
echo Running type check...
npm run type-check > "%RUN_DIR%\logs\typecheck.txt" 2>&1
if %errorlevel% equ 0 (
    echo ✅ Type check passed
    echo ## 🔍 Type Check: ✅ PASSED >> "%SUMMARY_FILE%"
) else (
    echo ❌ Type check failed
    echo ## 🔍 Type Check: ❌ FAILED >> "%SUMMARY_FILE%"
)

echo.
echo 🧪 PHASE 2: UNIT ^& INTEGRATION TESTS

REM Unit and Integration tests
echo Running unit and integration tests...
npm run test:run > "%RUN_DIR%\unit-integration\test-output.txt" 2>&1
if %errorlevel% equ 0 (
    echo ✅ Unit/Integration tests completed
    echo ## 🧪 Unit ^& Integration Tests: ✅ COMPLETED >> "%SUMMARY_FILE%"
    
    REM Extract test results (simplified for Windows)
    findstr /C:"passed" "%RUN_DIR%\unit-integration\test-output.txt" > temp_results.txt
    if exist temp_results.txt (
        echo - **Results**: See test-output.txt for details >> "%SUMMARY_FILE%"
        del temp_results.txt
    )
) else (
    echo ❌ Unit/Integration tests failed
    echo ## 🧪 Unit ^& Integration Tests: ❌ FAILED >> "%SUMMARY_FILE%"
    echo - See logs for details >> "%SUMMARY_FILE%"
)

echo.
echo 🎭 PHASE 3: E2E TESTS (PLAYWRIGHT)

REM Kill any running processes
echo Cleaning up running processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 3 /nobreak >nul

REM Build for production testing
echo Building for production...
npm run build > "%RUN_DIR%\logs\build.txt" 2>&1
if %errorlevel% equ 0 (
    echo ✅ Build completed
    echo ## 🏗️ Production Build: ✅ PASSED >> "%SUMMARY_FILE%"
) else (
    echo ❌ Build failed
    echo ## 🏗️ Production Build: ❌ FAILED >> "%SUMMARY_FILE%"
)

REM Run E2E tests
echo Running E2E tests...
npx playwright test --reporter=html > "%RUN_DIR%\e2e\e2e-output.txt" 2>&1
if %errorlevel% equ 0 (
    echo ✅ E2E tests passed
    echo ## 🎭 E2E Tests: ✅ PASSED >> "%SUMMARY_FILE%"
) else (
    echo ❌ E2E tests failed
    echo ## 🎭 E2E Tests: ❌ FAILED >> "%SUMMARY_FILE%"
    echo - See logs for details >> "%SUMMARY_FILE%"
)

REM Copy Playwright HTML report if it exists
if exist "playwright-report" (
    xcopy "playwright-report" "%RUN_DIR%\e2e\playwright-html-report\" /E /I /Q 2>nul
)

echo.
echo 📊 PHASE 4: GENERATING COMPREHENSIVE REPORT

REM Create detailed summary
echo. >> "%SUMMARY_FILE%"
echo ## 📊 OVERALL SUMMARY >> "%SUMMARY_FILE%"
echo - **Total Tests**: See individual test outputs >> "%SUMMARY_FILE%"
echo - **Status**: Check individual test results above >> "%SUMMARY_FILE%"
echo. >> "%SUMMARY_FILE%"
echo ## 📁 FILES ^& REPORTS >> "%SUMMARY_FILE%"
echo - **Unit/Integration Output**: `unit-integration\test-output.txt` >> "%SUMMARY_FILE%"
echo - **E2E Output**: `e2e\` directory >> "%SUMMARY_FILE%"
echo - **All Logs**: `logs\` directory >> "%SUMMARY_FILE%"
echo - **Environment Info**: `environment.md` >> "%SUMMARY_FILE%"

REM Create JSON summary (simplified)
echo { > "%RUN_DIR%\results.json"
echo   "timestamp": "%datetime%", >> "%RUN_DIR%\results.json"
echo   "run_date": "%date% %time%", >> "%RUN_DIR%\results.json"
echo   "platform": "windows", >> "%RUN_DIR%\results.json"
echo   "note": "See individual test outputs for detailed results" >> "%RUN_DIR%\results.json"
echo } >> "%RUN_DIR%\results.json"

REM Create index file
echo ^<!DOCTYPE html^> > "%TEST_RESULTS_DIR%\index.html"
echo ^<html^> >> "%TEST_RESULTS_DIR%\index.html"
echo ^<head^> >> "%TEST_RESULTS_DIR%\index.html"
echo     ^<title^>Test Results Index^</title^> >> "%TEST_RESULTS_DIR%\index.html"
echo     ^<style^> >> "%TEST_RESULTS_DIR%\index.html"
echo         body { font-family: Arial, sans-serif; margin: 20px; } >> "%TEST_RESULTS_DIR%\index.html"
echo         .passed { color: green; } >> "%TEST_RESULTS_DIR%\index.html"
echo         .failed { color: red; } >> "%TEST_RESULTS_DIR%\index.html"
echo     ^</style^> >> "%TEST_RESULTS_DIR%\index.html"
echo ^</head^> >> "%TEST_RESULTS_DIR%\index.html"
echo ^<body^> >> "%TEST_RESULTS_DIR%\index.html"
echo     ^<h1^>🧪 Test Results Index^</h1^> >> "%TEST_RESULTS_DIR%\index.html"
echo     ^<p^>Browse the run_* directories to see individual test results.^</p^> >> "%TEST_RESULTS_DIR%\index.html"
echo ^</body^> >> "%TEST_RESULTS_DIR%\index.html"
echo ^</html^> >> "%TEST_RESULTS_DIR%\index.html"

echo.
echo 🎉 TEST RUN COMPLETED
echo Results saved to: %RUN_DIR%
echo Check TEST_SUMMARY.md for detailed results

pause 
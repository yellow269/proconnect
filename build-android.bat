@ECHO OFF
REM ProConnect Android Build Script
REM This script builds the Android App Bundle (.aab) for Google Play Store

SET APP_NAME=ProConnect
SET PACKAGE_ID=za.co.proconect.app
SET BUILD_DIR=android

echo ========================================
echo  %APP_NAME% Android Build
echo ========================================
echo.

REM Check if JDK is available
where java >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Java/JDK not found.
    echo.
    echo Please install JDK 17 or later:
    echo   - Download from: https://adoptium.net/
    echo   - Or use: winget install EclipseAdoptium.Temurin.17.JDK
    echo.
    exit /b 1
)

echo [1/4] Checking Java version...
java -version 2>&1
echo.

echo [2/4] Starting Gradle build...
cd %BUILD_DIR%

REM Check if gradlew exists, if not use gradle directly
if exist "gradlew.bat" (
    call gradlew.bat bundleRelease
) else (
    where gradle >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        gradle bundleRelease
    ) else (
        echo ERROR: Neither gradlew.bat nor gradle command found.
        echo.
        echo Please either:
        echo   1. Install Gradle: https://gradle.org/install/
        echo   2. Or use: winget install Gradle.Gradle
        echo.
        exit /b 1
    )
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed. Please check the error messages above.
    exit /b 1
)

echo.
echo [3/4] Build successful!
echo.
echo [4/4] Locating output file...

set AAB_PATH=
for /r %%f in (*.aab) do set AAB_PATH=%%f

if defined AAB_PATH (
    echo.
    echo ========================================
    echo  BUILD COMPLETE
    echo ========================================
    echo.
    echo  App Bundle location:
    echo  %AAB_PATH%
    echo.
    echo  Next steps:
    echo  1. Go to https://play.google.com/console
    echo  2. Create a new app or select existing
    echo  3. Go to Production ^> Create new release
    echo  4. Upload the .aab file
    echo  5. Complete store listing, content rating, etc.
    echo.
) else (
    echo.
    echo WARNING: Could not locate .aab file.
    echo Check android/app/build/outputs/bundle/release/ manually.
)

cd ..

@ECHO OFF
REM ProConnect Keystore Generator
REM Run this ONCE to create the signing key for Android

echo ========================================
echo  Generate Android Signing Keystore
echo ========================================
echo.
echo You will be prompted for:
echo   - A keystore password (remember this!)
echo   - Your name/organization details
echo.

keytool -genkeypair ^
    -v ^
    -keystore android\release-key.jks ^
    -keyalg RSA ^
    -keysize 2048 ^
    -validity 10000 ^
    -alias proconnect

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Keystore created: android\release-key.jks
    echo.
    echo IMPORTANT:
    echo   - Keep this file safe and backed up
    echo   - NEVER commit it to git
    echo   - You need the password for Android builds
    echo.
) else (
    echo.
    echo ERROR: Keystore generation failed.
    echo Make sure you have JDK installed.
    echo.
)

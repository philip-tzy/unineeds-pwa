@echo off
echo ===================================================
echo  UniNeeds - Terminal Server Installation Helper
echo ===================================================
echo.
echo This script will help install UniNeeds correctly for use on a Terminal Server.
echo.
echo WARNING: This script must be run with administrator privileges.
echo If you're not running as administrator, please close and restart as admin.
echo.
pause

echo.
echo Step 1: Setting Terminal Services to Install mode...
change user /install
echo.

echo Step 2: Running the application installer...
echo Please run your normal application installation now.
echo When installation is complete, press any key to continue.
pause

echo.
echo Step 3: Setting Terminal Services back to Execute mode...
change user /execute
echo.

echo Step 4: Enabling linked connections registry setting...
reg add "HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableLinkedConnections" /t REG_DWORD /d 0x00000001 /f

echo.
echo Installation completed!
echo.
echo If you continue to have permission issues with saving driver profiles, 
echo please try the following:
echo.
echo 1. Ensure you're running the application as Administrator
echo 2. Restart the server after applying these changes
echo.
pause 
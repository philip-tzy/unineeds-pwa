@echo off
echo ===================================================
echo  UniNeeds - Terminal Server Permissions Fix
echo ===================================================
echo.
echo This script will fix permission issues with UniNeeds on Terminal Server
echo.
echo WARNING: This script must be run with administrator privileges.
echo If you're not running as administrator, please close and restart as admin.
echo.
pause

echo.
echo Step 1: Temporarily setting Terminal Services to Install mode...
change user /install
echo.

echo.
echo Step 2: Setting Terminal Services back to Execute mode...
change user /execute
echo.

echo.
echo Step 3: Enabling linked connections registry setting...
reg add "HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableLinkedConnections" /t REG_DWORD /d 0x00000001 /f

echo.
echo Permission fix completed! 
echo.
echo You will need to restart the server for these changes to take effect.
echo After restarting, you should be able to edit driver profiles.
echo.
pause 
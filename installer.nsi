; Space Miner NSIS Installer Script
!define APPNAME "Space Miner"
!define APPVERSION "1.0.0"
!define COMPANYNAME "Space Miner Studios"

Name "${APPNAME}"
OutFile "dist\SPACE_MINER_SETUP.exe"
InstallDir "$PROGRAMFILES64\SpaceMiner"
Icon "src\assets\app_icon.ico"
RequestExecutionLevel admin

Page directory
Page instfiles

Section "Install"
  SetOutPath $INSTDIR
  File "dist\SPACE_MINER.exe"
  File /r "dist\web\*.*"
  CreateShortcut "$DESKTOP\Space Miner.lnk" "$INSTDIR\SPACE_MINER.exe"
  CreateDirectory "$SMPROGRAMS\Space Miner"
  CreateShortcut "$SMPROGRAMS\Space Miner\Space Miner.lnk" "$INSTDIR\SPACE_MINER.exe"
  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\SPACE_MINER.exe"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\Space Miner.lnk"
SectionEnd

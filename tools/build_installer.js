#!/usr/bin/env node
// Create Inno Setup script and NSIS stub for installer
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const issContent = `; Space Miner Inno Setup Script v6.3.0
; Generated for SPACE MINER Premium Space Mining Adventure

#define MyAppName "Space Miner"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Space Miner Studios"
#define MyAppURL "https://space-miner.local"
#define MyAppExeName "SPACE_MINER.exe"

[Setup]
AppId={{8A9F1C2D-4E3B-4F7A-9D2C-1B4E6F8A9C0D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\\SpaceMiner
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=.\\dist
OutputBaseFilename=SPACE_MINER_SETUP
Compression=lzma
SolidCompression=yes
WizardStyle=modern
SetupIconFile=src\\assets\\app_icon.ico
UninstallDisplayIcon={app}\\{#MyAppExeName}
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\\SPACE_MINER.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\\web\\*"; DestDir: "{app}\\web"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "src\\assets\\*"; DestDir: "{app}\\assets"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{group}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"
Name: "{group}\\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"`;

fs.writeFileSync(path.join(root,'installer.iss'), issContent);
console.log('Created installer.iss');

// NSIS alternative
const nsiContent = `; Space Miner NSIS Installer Script
!define APPNAME "Space Miner"
!define APPVERSION "1.0.0"
!define COMPANYNAME "Space Miner Studios"

Name "\${APPNAME}"
OutFile "dist\\SPACE_MINER_SETUP.exe"
InstallDir "$PROGRAMFILES64\\SpaceMiner"
Icon "src\\assets\\app_icon.ico"
RequestExecutionLevel admin

Page directory
Page instfiles

Section "Install"
  SetOutPath $INSTDIR
  File "dist\\SPACE_MINER.exe"
  File /r "dist\\web\\*.*"
  CreateShortcut "$DESKTOP\\Space Miner.lnk" "$INSTDIR\\SPACE_MINER.exe"
  CreateDirectory "$SMPROGRAMS\\Space Miner"
  CreateShortcut "$SMPROGRAMS\\Space Miner\\Space Miner.lnk" "$INSTDIR\\SPACE_MINER.exe"
  WriteUninstaller "$INSTDIR\\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\\SPACE_MINER.exe"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\\Space Miner.lnk"
SectionEnd
`;

fs.writeFileSync(path.join(root,'installer.nsi'), nsiContent);
console.log('Created installer.nsi');

// Try to build actual installer if tools available
try{
  execSync('iscc installer.iss', {stdio:'inherit'});
  console.log('Inno Setup compiled successfully');
}catch(e){
  console.log('Inno Setup not available in sandbox - installer script generated for Windows build');
  console.log('Fallback SETUP exe already exists:', fs.existsSync(path.join(dist,'SPACE_MINER_SETUP.exe')));
}

; Space Miner Inno Setup Script v6.3.0
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
DefaultDirName={autopf}\SpaceMiner
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=.\dist
OutputBaseFilename=SPACE_MINER_SETUP
Compression=lzma
SolidCompression=yes
WizardStyle=modern
SetupIconFile=src\assets\app_icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\SPACE_MINER.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\web\*"; DestDir: "{app}\web"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "src\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"
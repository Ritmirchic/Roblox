; Inno Setup 6 Script for SPACE MINER: BUILD & CONQUER (64-bit Windows)
#define MyAppName "SPACE MINER: BUILD & CONQUER"
#define MySafeFolderName "SPACE MINER - BUILD & CONQUER"
#define MyAppExeName "SPACE_MINER.exe"
#define MyAppVersion "2.5.0"
#define MyAppPublisher "Orbital Forge Interactive"

[Setup]
AppId={{8F4B9A2E-51C4-4E91-9B72-7C3E2A10D4F8}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\SpaceMinerBuildAndConquer
DefaultGroupName={#MySafeFolderName}
DisableProgramGroupPage=yes
DisableStartupPrompt=yes
CloseApplications=no
RestartApplications=no
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\dist
OutputBaseFilename=SPACE_MINER_SETUP
SetupIconFile=..\assets\branding\icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
WizardStyle=modern
WizardImageFile=..\assets\branding\installer_banner.bmp
WizardSmallImageFile=..\assets\branding\installer_small.bmp
Compression=lzma2/fast
SolidCompression=yes

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "..\build\windows\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\README_CONTROLS.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\THIRDPARTY_LICENSES.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MySafeFolderName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\Controls and Quick Guide"; Filename: "{app}\README_CONTROLS.txt"
Name: "{group}\Uninstall {#MySafeFolderName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MySafeFolderName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

; DON'T LOOK BACK — Inno Setup installer script (builds DONT_LOOK_BACK_SETUP.exe)
#define MyAppName "Don't Look Back"
#define MyAppVersion "1.0.0"
#define MyAppExe "DONT_LOOK_BACK.exe"

[Setup]
AppId={{7E2B1A44-9C41-4B8E-9A2D-D1F04B87A001}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher=Meridian House (independent)
DefaultDirName={localappdata}\Programs\DontLookBack
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\release
OutputBaseFilename=DONT_LOOK_BACK_SETUP
SetupIconFile=..\icon.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName={#MyAppName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"

[Files]
Source: "..\release\{#MyAppExe}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExe}"; Description: "Play {#MyAppName}"; Flags: nowait postinstall skipifsilent

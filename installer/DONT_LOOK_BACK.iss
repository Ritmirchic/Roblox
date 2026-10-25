#define GameName "DON'T LOOK BACK"
#define GameVersion "1.0.0"
#define GamePublisher "Independent"

[Setup]
AppId={{4C55049C-CE54-4E6C-9CE8-A801AA41140D}
AppName={#GameName}
AppVersion={#GameVersion}
AppPublisher={#GamePublisher}
DefaultDirName={localappdata}\Programs\DONT_LOOK_BACK
DefaultGroupName={#GameName}
DisableProgramGroupPage=yes
OutputDir=..\build
OutputBaseFilename=DONT_LOOK_BACK_SETUP
SetupIconFile=..\assets\icon.ico
UninstallDisplayIcon={app}\DONT_LOOK_BACK.exe
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: unchecked

[Files]
Source: "..\build\DONT_LOOK_BACK.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\DON'T LOOK BACK"; Filename: "{app}\DONT_LOOK_BACK.exe"
Name: "{autodesktop}\DON'T LOOK BACK"; Filename: "{app}\DONT_LOOK_BACK.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\DONT_LOOK_BACK.exe"; Description: "Launch DON'T LOOK BACK"; Flags: postinstall nowait skipifsilent

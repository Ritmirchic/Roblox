/**
 * ASHES OF HUMANITY: LAST SIGNAL - Electron shell.
 *
 * The game itself is a self-contained WebGL build (index.html + game.js).
 * Electron is optional: it provides a native window, fullscreen and pointer lock.
 * Build a Windows binary with:  npx electron-packager . AshesOfHumanity --platform=win32 --arch=x64
 */
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0a0c0c',
    title: 'ASHES OF HUMANITY: LAST SIGNAL',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      webgl: true,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  const target = path.join(__dirname, '..', 'release', 'windows', 'index.html');
  win.loadFile(target);
  if (isDev) win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

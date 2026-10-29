const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1680, height: 960, minWidth: 1180, minHeight: 700,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
    title: 'PhotoCard Studio',
    icon: path.join(__dirname, 'public', 'assets', 'icon.ico'),
    backgroundColor: '#1e1e1e',
    show: false,
  });
  win.loadFile(path.join(__dirname, 'public', 'index.html'));
  win.setMenu(null);
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => { win = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });

ipcMain.handle('save-file', async (_, { data, encoding, defaultName, filters, kind }) => {
  const dir = app.getPath(kind === 'image' ? 'pictures' : 'documents');
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(dir, defaultName), filters });
  if (r.canceled || !r.filePath) return { success: false };
  fs.writeFileSync(r.filePath, encoding === 'base64' ? Buffer.from(data, 'base64') : data, encoding === 'base64' ? undefined : 'utf8');
  return { success: true, filePath: r.filePath };
});

ipcMain.handle('open-file', async (_, { filters }) => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters });
  if (r.canceled || !r.filePaths.length) return null;
  return { filePath: r.filePaths[0], content: fs.readFileSync(r.filePaths[0], 'utf8') };
});

ipcMain.handle('show-in-folder', (_, fp) => shell.showItemInFolder(fp));
ipcMain.handle('get-version', () => app.getVersion());

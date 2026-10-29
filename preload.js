const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (opts) => ipcRenderer.invoke('save-file', opts),
  openFile: (opts) => ipcRenderer.invoke('open-file', opts),
  showInFolder: (fp) => ipcRenderer.invoke('show-in-folder', fp),
  getVersion: () => ipcRenderer.invoke('get-version'),
});

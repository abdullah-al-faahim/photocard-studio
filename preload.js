const{contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('electronAPI',{
  savePng:(dataUrl,defaultName)=>ipcRenderer.invoke('save-png',{dataUrl,defaultName}),
  saveEps:(epsContent,defaultName)=>ipcRenderer.invoke('save-eps',{epsContent,defaultName}),
  showInFolder:fp=>ipcRenderer.invoke('show-in-folder',fp),
  getVersion:()=>ipcRenderer.invoke('get-version'),
});

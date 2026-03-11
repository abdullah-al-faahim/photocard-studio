const{app,BrowserWindow,ipcMain,dialog,shell}=require('electron');
const path=require('path'),fs=require('fs');
let win;
function createWindow(){
  win=new BrowserWindow({
    width:1680,height:960,minWidth:1280,minHeight:720,
    webPreferences:{nodeIntegration:false,contextIsolation:true,preload:path.join(__dirname,'preload.js'),webSecurity:false},
    title:'PhotoCard Studio — News Edition v1.6',
    icon:path.join(__dirname,'public','assets','icon.ico'),
    backgroundColor:'#141a14',show:false,
  });
  win.loadFile(path.join(__dirname,'public','index.html'));
  win.setMenu(null);
  win.once('ready-to-show',()=>win.show());
  win.on('closed',()=>{win=null;});
}
app.whenReady().then(createWindow);
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow();});
ipcMain.handle('save-png',async(_,{dataUrl,defaultName})=>{
  const r=await dialog.showSaveDialog(win,{title:'Save PNG',defaultPath:path.join(app.getPath('pictures'),defaultName||'photocard.png'),filters:[{name:'PNG',extensions:['png']}]});
  if(!r.canceled&&r.filePath){fs.writeFileSync(r.filePath,Buffer.from(dataUrl.replace(/^data:image\/\w+;base64,/,''),'base64'));return{success:true,filePath:r.filePath};}
  return{success:false};
});
ipcMain.handle('save-eps',async(_,{epsContent,defaultName})=>{
  const r=await dialog.showSaveDialog(win,{title:'Save EPS',defaultPath:path.join(app.getPath('documents'),defaultName||'photocard.eps'),filters:[{name:'EPS/PostScript',extensions:['eps','ps']}]});
  if(!r.canceled&&r.filePath){fs.writeFileSync(r.filePath,epsContent,'utf8');return{success:true};}
  return{success:false};
});
ipcMain.handle('show-in-folder',(_,fp)=>shell.showItemInFolder(fp));
ipcMain.handle('get-version',()=>app.getVersion());

const { app, BrowserWindow, nativeImage, Tray, Menu, ipcMain } = require('electron')

const image = nativeImage.createFromPath(__dirname + '/icon.png');

image.setTemplateImage(true)

let hiddenWindow = null;
let win = null;

function createWindow () {
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      webSecurity: false,
      webgl: false
    },
    icon: image
  })

  win.setMenu(null)

  win.loadURL('https://chess.com/')

  // keep contents in same window
  win.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    win.loadURL(url);
    if (hiddenWindow) hiddenWindow.webContents.send('navigated', url)
  });

  win.webContents.on('did-navigate-in-page', function (event, url) {
    if (hiddenWindow) hiddenWindow.webContents.send('navigated', url)
  })

  win.webContents.on('did-navigate', async (event, url, httpResponseCode, httpStatusCode) => {

    if (hiddenWindow) hiddenWindow.webContents.send('navigated', url)

  });

  // minimize to tray
  win.on('minimize',function(event){
    event.preventDefault();
    win.hide();
  });

  // proper quit
  win.on('close',function(event){
    app.isQuiting = true;
    app.quit();
  });

}

function createHiddenWindow () {
  hiddenWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      webgl: false
    },
    icon: image
  })

  //hiddenWindow.setMenu(null)

  hiddenWindow.loadFile('./hidden.html')

}

function createTrayIcon() {
  appIcon = new Tray(image);
  var contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show', 
      click:  function(){
        win.show();
      } 
    },
    { 
      label: 'Quit', 
      click:  function(){
        app.isQuiting = true;
        app.quit();
      } 
    }
  ]);
  appIcon.setToolTip('Chess.com');
  appIcon.setContextMenu(contextMenu);

  appIcon.on('click', function(e){
    if (win.isVisible()) {
      win.hide()
    } else {
      win.show()
    }
  });

}

app.whenReady().then((d) => {

  createWindow(d)

  createTrayIcon();

  createHiddenWindow(d)

})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
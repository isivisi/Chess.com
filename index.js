const { app, BrowserWindow, nativeImage, ipcMain } = require('electron')

const image = nativeImage.createFromPath(__dirname + '/icon.png');

image.setTemplateImage(true)

let hiddenWindow = null;

function createWindow () {
  const win = new BrowserWindow({
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
    console.log(new URL(url))
    // Let our hidden window know that we've changed pages
    if (hiddenWindow) hiddenWindow.webContents.send('navigated', url)
  });

  win.webContents.on('did-navigate-in-page', function (event, url) {
    console.log(new URL(url))
    if (hiddenWindow) hiddenWindow.webContents.send('navigated', url)
  })

  win.webContents.on('did-navigate', async (event, url, httpResponseCode, httpStatusCode) => {

    console.log(new URL(url))

    // Let our hidden window know that we've changed pages
    if (hiddenWindow) hiddenWindow.webContents.send('navigated', url)

  });

}

function createHiddenWindow () {
  hiddenWindow = new BrowserWindow({
    show: true,
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

app.whenReady().then((d) => {

  createWindow(d)

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
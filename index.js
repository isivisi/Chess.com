const { app, BrowserWindow, nativeImage, Tray, Menu, ipcMain } = require('electron')
const path = require('path');
const ElectronPreferences = require('electron-preferences');

const image = nativeImage.createFromPath(__dirname + '/icon.png');

image.setTemplateImage(true)

let hiddenWindow = null;
let win = null;

function createWindow () {
  win = new BrowserWindow({
    show: !process.argv.includes('--hidden'),
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

  hiddenWindow.webContents.on('did-finish-load', ()=>{
    hiddenWindow.webContents.send('preferences', preferences.preferences)
  })

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
      label: 'Settings', 
      click:  function(){
        preferences.show();
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

const preferences = new ElectronPreferences({
  'dataStore': path.resolve(app.getPath('userData'), 'preferences.json'),
  'defaults': {
    'startup': {
        'startup_with_os': false,
        'startup_hidden': true,
    },
    'discord': {
        'status_on': [
          'live',
          'playing',
          'puzzles',
          'lessons'
        ]
    },
  },
  'sections':[
      {
        'id': 'startup',
        'label': 'Startup Settings',
        'form': {
            'groups': [
                {
                    'label': 'Startup Settings',
                    'fields': [
                      {
                          'label': "On OS Startup",
                          'key': 'startup_type',
                          'type': 'radio',
                          'options': [
                            {'label': "Don't start automatically", 'value': false},
                            {'label': 'Start automatically', 'value': true},
                          ],
                          'help': 'What to publicly show you are doing on chess.com'
                      }
                  ]
                }
            ]      
        }
      },
    {
      'id': 'discord',
      'label': 'Discord Settings',
      'form': {
          'groups': [
              {
                  'label': 'Discord Settings',
                  'fields': [
                      {
                          'label': "When to show chess.com status",
                          'key': 'status_on',
                          'type': 'checkbox',
                          'options': [
                              {'label': 'Watching Live', 'value': 'live'},
                              {'label': 'Playing Chess', 'value': 'playing'},
                              {'label': 'Solving Puzzles', 'value': 'puzzles'},
                              {'label': 'Watching Lessons', 'value': 'lessons'},
                          ],
                          'help': 'What to publicly show you are doing on chess.com'
                      }
                  ]
              } 
          ]
      }
    }
  ]
});

preferences.on('save', (preferences) => {
  setStartupState(preferences.startup.startup_type)
  hiddenWindow.webContents.send('preferences', preferences)
});

function setStartupState(open) {
  app.setLoginItemSettings({
    openAtLogin: open,
    args: ['--hidden'],
  })
}
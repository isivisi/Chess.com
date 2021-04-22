const { app, BrowserWindow, nativeImage, Tray, Menu, ipcMain, screen } = require('electron')
const path = require('path');
const ElectronPreferences = require('electron-preferences');

const image = nativeImage.createFromPath(__dirname + '/icon.png');

image.setTemplateImage(true)

let hiddenWindow = null;
let win = null;
let lastSendUrl = "/";

function createWindow () {
  win = new BrowserWindow({
    show: !process.argv.includes('--hidden'),
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: preferences.preferences.notifications.show_chessboard_on.length,
      backgroundThrottling: false, // better notifications
      webSecurity: true,
      enableRemoteModule: false,
      contextIsolation: true, // so web contents cant access electrons api
      webgl: false,
      preload: preferences.preferences.notifications.show_chessboard_on.length ? path.join(__dirname, 'preload.js') : null,
    },
    icon: image
  })

  if (!process.argv.includes('--dev')) win.setMenu(null)

  win.loadURL('https://chess.com/')

  // keep contents in same window
  win.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    win.loadURL(url);
    lastSendUrl = url;
    if (hiddenWindow) hiddenWindow.webContents.send('navigated', url)
  });

  win.webContents.on('did-navigate-in-page', function (event, url) {
    lastSendUrl = url;
    if (hiddenWindow) hiddenWindow.webContents.send('navigated', url)
  });

  win.webContents.on('did-navigate', (event, url, httpResponseCode, httpStatusCode) => {
    lastSendUrl = url;
    if (hiddenWindow) hiddenWindow.webContents.send('navigated', url)

  });

  // minimize to tray
  win.on('minimize',function(event){
    event.preventDefault();
    win.hide();
    //win.webContents.setAudioMuted(true);
    hiddenWindow.webContents.send('navigated', "https://chess.com/")
    win.webContents.send('minimized');
  });

  win.on('show', () => {
    //win.webContents.setAudioMuted(false);
    hiddenWindow.webContents.send('navigated', lastSendUrl)
    win.webContents.send('visible');
  })

  // proper quit
  win.on('close',function(event){
    app.isQuiting = true;
    app.quit();
  });

  //win.on('focus', () => win.flashFrame(false));

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
    'notifications': {
      'show_chessboard_on': [],
      'show_chessboard_time': 10,
    }
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
    },
    {
      'id': 'notifications',
      'label': 'Notifications',
      'form': {
          'groups': [
              {
                  'label': 'Notification Settings',
                  'fields': [
                      {
                          'label': "Chessboard notifications",
                          'key': 'show_chessboard_on',
                          'type': 'checkbox',
                          'options': [
                              {'label': 'When a move happens in a live game', 'value': 'live'},
                              {'label': 'When a move happens in an online game', 'value': 'online'},
                              {'label': 'When a move happens in an event', 'value': 'event'},
                          ],
                          'help': 'These notifications will show the current board state. To get this information we need to inject code into the webpage, use at your own risk'
                      },
                      {
                        'label': "Notification time (seconds)",
                        'key': 'show_chessboard_time',
                        'type': 'slider',
                        'min': 1,
                        'max': 30,
                        'help': 'How long a boardstate notifcation stays on the screen in seconds'
                    }
                  ]
              } 
          ]
      }
    }
  ]
});

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

let popup = null;
let popupTimeout = null;
ipcMain.on('board-change', (event, html) => {

  clearTimeout(popupTimeout)

  if (!win.isMinimized()) {
    return;
  }

  if (!popup) {
    let display = screen.getPrimaryDisplay();
    let width = display.bounds.width;
    let height = display.bounds.height;
    popup = new BrowserWindow({
      frame: false,
      show: false,
      width: 600,
      height: 600,
      x: width - 600,
      y: height - 600,
      webPreferences: {
        nodeIntegration: true,
        webSecurity: false,
        webgl: false,
      },
      icon: image
    })
    popup.loadFile('./boardNotification.html')
    popup.setAlwaysOnTop(true, "screen-saver", 1);
    popup.setSkipTaskbar(true);
    //popup.setResizable(false)
  } else popup.showInactive();

  popup.on('close',function(event){
    popup = null;
  });
  
  popup.once('focus', () => {
    popup.hide();
    win.show();
  });

  popup.webContents.send('board-update', html);

  popupTimeout = setTimeout(() => {
    popup.hide();
  }, preferences.preferences.notifications.show_chessboard_time * 1000);

  popup.webContents.on('did-finish-load', ()=>{
    popup.webContents.executeJavaScript('document.body.style = "background-color:rgb(49, 46, 43)"');
  });
  
});
const { ipcRenderer } = require('electron');

var image = document.getElementById('notificationImage');

ipcRenderer.on('board-update', (event, boardURI) => {
    image.src = boardURI;
});
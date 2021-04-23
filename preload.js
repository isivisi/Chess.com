// preload for chess.com

const { ipcRenderer } = require('electron');
const domtoimage = require('dom-to-image');

// force focus even when not for better notifications when minimized
//window.hasFocus = function() { return true }
//window.__defineGetter__("hasFocus", function() { return true })
//document.__defineGetter__("visibilityState",  function() { return "visible" })

console.log('Chess.com desktop script injected successfuly')

// Gather all chess boards in current view so we can determine someone has made a move
var mutationObservers = [];


function watchBoard(toWatch) {
    var mutationObserver = new MutationObserver((mutation) => {
        //window.__defineGetter__("hasFocus", function() { return true })
        //document.__defineGetter__("visibilityState",  function() { return "visible" })

        if (mutation[0].target.closest('.dragging')) return; // moving

        var board = mutation[0].target.closest('.layout-board-section') || mutation[0].target.closest('#board-layout-main') || mutation[0].target.closest('.game-board-component');
        if (!board) return;
        
        domtoimage.toPng(board).then(function (dataUrl) {
            ipcRenderer.send('board-change', dataUrl);
        });

        // kill any instance of this as it wont go away when window isnt in focus
        if (modals = document.getElementsByClassName('board-dialog-component')) for (var i = 0; i < modals.length; i++) modals[i].remove();

    });
    mutationObserver.observe(toWatch, {
        /*attributes: true,
        characterData: true,*/
        childList: true,
        subtree: true,
        /*attributeOldValue: true,
        characterDataOldValue: true*/
    });
    mutationObservers.push(mutationObserver);
}

function enableBoardObservers() {
    console.log('observing board changes');

    var boards = document.getElementsByTagName("chess-board");
    for (var i = 0; i < boards.length; i++) watchBoard(boards[i])

    if (document.getElementById('game-board')) watchBoard(document.getElementById('game-board'))

    var eventBoards = document.getElementsByClassName('game-board-component');
    for (var i = 0; i < eventBoards.length; i++) watchBoard(eventBoards[i]);
    
    console.log("board observers", mutationObservers);
}

function disableBoardObservers() {
    console.log('disabling observers');

    for (var i = 0; i < mutationObservers.length; i++) {
        mutationObservers[i].disconnect();
        delete mutationObservers[i];
    }
    mutationObservers = [];
}

ipcRenderer.on('minimized', () => {
    enableBoardObservers();
});

ipcRenderer.on('visible', () => {
    disableBoardObservers();
});

// Capture notifications, abstracted from nativefier
/*const realNotification = window.Notification;
const notificationCapture = function (title, opt) {

    // opts:
    // body - string
    // icon - url
    // badge - url
    // image - url
    // actions: 
    //  action
    //  title
    //  icon

    ipcRenderer.on('notification', {title, opt});

    const instance = new realNotification(title, opt);
    instance.addEventListener('click', () => {
        ipcRenderer.on('notification-clicked', {title, opt});
    });
};

notificationCapture.requestPermission = realNotification.requestPermission.bind(realNotification);
Object.defineProperty(notificationCapture, 'permission', {
    get: () => realNotification.permission,
});
window.Notification = notificationCapture;*/
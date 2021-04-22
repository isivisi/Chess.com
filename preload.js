// preload for chess.com

const { ipcRenderer } = require('electron');

const html2canvas = require('html2canvas');
const domtoimage = require('dom-to-image');

console.log('Chess.com desktop script injected successfuly')

// Gather all chess boards in current view so we can determine someone has made a move
var mutationObservers = [];

var cssInline = null;
var head = null;

//boards.concat(Array.from(document.getElementsByTagName("chess-board"))); 

function watchBoard(toWatch, ignoreStyle=false) {
    var mutationObserver = new MutationObserver((mutation) => {
        if (!ignoreStyle && mutation[0].target.getAttribute("style") != "") return; // moving
        if (mutation[0].target.closest('.dragging')) return; // moving
        var board = mutation[0].target.closest('.layout-board-section') || mutation[0].target.closest('#board-layout-main') || mutation[0].target.closest('.game-board-component');
        if (!board) return;

        domtoimage.toPng(board).then(function (dataUrl) {
            ipcRenderer.send('board-change', dataUrl);
        });

    });
    mutationObserver.observe(toWatch, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
        attributeOldValue: true,
        characterDataOldValue: true
    });
    mutationObserver.setMaxListeners(50);
    mutationObservers.push(mutationObserver);
}

document.addEventListener('DOMContentLoaded', ()=> {

    var boards = document.getElementsByTagName("chess-board");
    for (var i = 0; i < boards.length; i++) watchBoard(boards[i])

    if (document.getElementById('game-board')) watchBoard(document.getElementById('game-board'), true)

    var eventBoards = document.getElementsByClassName('game-board-component');
    for (var i = 0; i < eventBoards.length; i++) watchBoard(eventBoards[i], true);
    
    console.log("board observers", mutationObservers);

}, false);
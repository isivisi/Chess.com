// preload for chess.com

const { ipcRenderer } = require('electron');

const html2canvas = require('html2canvas');

console.log('Chess.com desktop script injected successfuly')

// Gather all chess boards in current view so we can determine someone has made a move
var mutationObservers = [];

var cssInline = null;
var head = null;

//boards.concat(Array.from(document.getElementsByTagName("chess-board"))); 

function watchBoard(toWatch) {
    var mutationObserver = new MutationObserver((mutation) => {
        //if (mutation[0].target.getAttribute("style") != "") return; // moving
        if (mutation[0].target.closest('.dragging')) return; // moving
        var board = mutation[0].target.closest('.layout-board-section') || mutation[0].target.closest('#board-layout-main');
        if (!board) return;

        html2canvas(board).then(canvas => {
            console.log(canvas.toDataURL());
            ipcRenderer.send('board-change', canvas.toDataURL());
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
    mutationObservers.push(mutationObserver);
}

document.addEventListener('DOMContentLoaded', ()=> {

    var boards = document.getElementsByTagName("chess-board");
    for (var i = 0; i < boards.length; i++) watchBoard(boards[i])

    if (document.getElementById('game-board')) watchBoard(document.getElementById('game-board'))

    var eventBoards = document.getElementsByClassName('game-board-component');
    for (var i = 0; i < eventBoards.length; i++) watchBoard(eventBoards[i]);
    
    console.log("board observers", mutationObservers);

}, false);
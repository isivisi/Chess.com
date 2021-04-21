// preload for chess.com

const { ipcRenderer } = require('electron');

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
        // send out html of move so we can make alert
        console.log(head + board.outerHTML);
        ipcRenderer.send('board-change', head + board.outerHTML);

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

    //https://stackoverflow.com/questions/1679507/getting-all-css-used-in-html-file/31460383
    var css = [];
    var hrefs = [];
    for (var i=0; i<document.styleSheets.length; i++)
    {
        hrefs.push(document.styleSheets[i].href);
        var sheet = document.styleSheets[i];
        var rules = ('cssRules' in sheet)? sheet.cssRules : sheet.rules;
        if (rules)
        {
            css.push('\n/* Stylesheet : '+(sheet.href||'[inline styles]')+' */');
            for (var j=0; j<rules.length; j++)
            {
                var rule = rules[j];
                if ('cssText' in rule)
                    css.push(rule.cssText);
                else
                    css.push(rule.selectorText+' {\n'+rule.style.cssText+'\n}\n');
            }
        }
    }
    cssInline = '<style>' + (css.join('\n')) + '</style>'

    var links = document.getElementsByTagName('link');
    head = '<head>';
    for (var i = 0; i < links.length; i++) {
        head += links[i].outerHTML;
    }
    head += '</head>'

    var boards = document.getElementsByTagName("chess-board");
    for (var i = 0; i < boards.length; i++) watchBoard(boards[i])

    if (document.getElementById('game-board')) watchBoard(document.getElementById('game-board'))

    var eventBoards = document.getElementsByClassName('game-board-component');
    for (var i = 0; i < eventBoards.length; i++) watchBoard(eventBoards[i]);
    
    console.log("board observers", mutationObservers);

}, false);
var COL_HEADER_PAPER_TYPE = "Paper.type..C.conference.paper..J...journal.paper..M.miscellaneous..capstone..keynote..VAST.challenge..panel..poster......";
var COL_HEADER_AUTHOR_NAMES = "Author.Names";

var BASE_FONT_SIZE = 7;

var PAPER_TYPES = ['J', 'C'];

var canvasWidth = 10000;
var canvasHeight = 2000;

var table;
var colPaperTypes;
var colAuthorNames;

var authorsList = [];
var authorsListAll = [];
var authorsListMain = [];
var authorsOccurrences = {};
var authorsOccurrencesMain = {};

function preload() {
    table = loadTable("../../data/data.csv", "csv", "header");
}

function setup() {
    createCanvas(canvasWidth, canvasHeight);
    noLoop();
    background(230, 240, 255);

    // get the column data
    colPaperTypes = table.getColumn(COL_HEADER_PAPER_TYPE);
    colAuthorNames = table.getColumn(COL_HEADER_AUTHOR_NAMES)

    authorsList = getAuthorsNameLists();
    authorsOccurrences = getOccurrences(authorsListAll);
    authorsOccurrencesMain = getOccurrences(authorsListMain);
}

function draw() {
    var xPos = 0;
    var yPos = 0;

    for (i = 0; i < authorsList.length; i++) {
        // list all names
        var authorName = authorsList[i];
        var occurrence = authorsOccurrences[authorName];
        var fontSize = BASE_FONT_SIZE + (2 * occurrence);

        var occurrenceMain = (authorsOccurrencesMain[authorName] != undefined) ? authorsOccurrencesMain[authorName] : 0;
        var fontStyle = NORMAL;
        if (occurrenceMain >= 10) {
            fontStyle = BOLD;
        } else if (occurrenceMain >= 5) {
            fontStyle = ITALIC;
        }

        var displayName = authorName + ' [' + occurrenceMain + '|' + occurrence + ']';

        textSize(fontSize);
        textStyle(fontStyle);
        text(displayName, xPos, yPos);

        yPos += 20;

        if (yPos >= canvasHeight) {
            xPos += 150;
            yPos = 0;
        }

        // TODO add scrollbars / resize Canvas
    }
}

function getAuthorsNameLists() {
    var tmpArr = [];
    for (i = 0; i < colAuthorNames.length; i++) {
        var authorsTmp = colAuthorNames[i].split(';');

        for (j = 0; j < authorsTmp.length; j++) {
            var indexOfAuthor = tmpArr.indexOf(authorsTmp[j]);
            var authorName = authorsTmp[j];

            if (indexOfAuthor === -1) {
                tmpArr.push(authorName);
            }

            if (j === 0) {
                authorsListMain.push(authorName)
            }

            authorsListAll.push(authorName);
        }
    }

    tmpArr.sort();
    return tmpArr;
}

function getOccurrences(list) {
    var tmpObj = {};
    for (var i = 0; i < list.length; i++) {
        tmpObj[list[i]] = (tmpObj[list[i]] || 0) + 1;
    }

    return tmpObj;
}
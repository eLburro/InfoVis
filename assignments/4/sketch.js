var COL_HEADER_AUTHOR_NAMES = "Deduped.author.names";
var COL_HEADER_AUTHOR_KEYWORDS = "Author.Keywords";

var canvasWidth = 1000;
var canvasHeight = 1000;

var table;
var author2Topic = {};

// drawing
var CENTER_X = 300;
var CENTER_Y = 300;
var RAD = 80;

// this would be available over dropdown or search field
var TEST_AUTHOR_NAME_1 = "Garth, C";
var TEST_AUTHOR_NAME_2 = "Gao, J.";
var TEST_AUTHOR_NAME_3 = "van Wijk, J.J.";
var TEST_KEYWORD = "object modeling";

function preload() {
    table = loadTable("../../data/author2topic.csv", "csv", "header");
}

function setup() {
    createCanvas(canvasWidth, canvasHeight);
    noLoop();
    //background(230, 240, 255);

    // loop over data and get info needed
    for (var i = 0; i < table.getRowCount(); i++) {
        var row = table.getRow(i);
        var rowAuthor = row.get(COL_HEADER_AUTHOR_NAMES);
        var rowKeyword = row.get(COL_HEADER_AUTHOR_KEYWORDS);

        if (author2Topic[rowAuthor] == undefined) {
            author2Topic[rowAuthor] = {};
            author2Topic[rowAuthor][rowKeyword] = 1;

        } else {
           if (author2Topic[rowAuthor][rowKeyword] == undefined) {
               author2Topic[rowAuthor][rowKeyword] = 1;

           } else {
               author2Topic[rowAuthor][rowKeyword] += 1;
           }
        }
    }

    //console.log(author2Topic);
}

function draw() {
    var authorToDisplay = author2Topic[TEST_AUTHOR_NAME_2];
    var topicCount = Object.keys(authorToDisplay).length;
    var alpha = 360 / topicCount;

    // get the maximum count for topics to draw the circles
    var maxLevels = getMaxTopicCount(authorToDisplay);

    // display author name
    textSize(32);
    text("Author: " + TEST_AUTHOR_NAME_2, 0, 32);

    // draw helper circles
    drawHelperCircles(maxLevels);

    // reset colors
    fill(0,0,0);

    var bX = 0
    var bY = 0;
    var cX = 0;
    var cY = 0;
    var angle = alpha;

    // loop over topics of author
    for (var topic in authorToDisplay) {
        var count = authorToDisplay[topic];

        // calculate point c of the triangle
        bX = RAD * count * Math.sin(toRadians(angle-alpha)) + CENTER_X;
        bY = RAD * count * Math.cos(toRadians(angle-alpha)) + CENTER_Y;

        cX = RAD * count * Math.sin(toRadians(angle)) + CENTER_X;
        cY = RAD * count * Math.cos(toRadians(angle)) + CENTER_Y;

        // draw triangle with center point, b & c as corners
        triangle(CENTER_X, CENTER_Y, bX, bY, cX, cY);

        bX = cX;
        bY = cY;
        angle += alpha;
    }
}

function drawHelperCircles(levels) {
    noFill();
    stroke(210, 210, 210);
    ellipse(CENTER_X, CENTER_Y, 5, 5);

    for (var i = 1; i <= levels; i++) {
        ellipse(CENTER_X, CENTER_Y, RAD * 2 * i, RAD * 2 * i);
    }
}

function getMaxTopicCount(topics) {
    var max = 1;

    for (var topic in topics) {
        if (max < topics[topic]) {
            max = topics[topic];
        }
    }

    return max;
}

function toRadians (angle) {
    return angle * (Math.PI / 180);
}
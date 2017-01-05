var COL_HEADER_AUTHOR_NAMES = "Deduped.author.names";
var COL_HEADER_AUTHOR_KEYWORDS = "Author.Keywords";
var COL_HEADER_YEAR = "Year";

var MAX_PUBLISHING_YEAR = 2015;

var canvasWidth = 1000;
var canvasHeight = 1000;

var table;
var author2Topic = {};

// drawing
var CENTER_X = 400;
var CENTER_Y = 400;
var RAD = 80;

// this would be available over dropdown or search field
var TEST_AUTHOR_NAME_1 = "Bostock, M.";
var TEST_AUTHOR_NAME_2 = "Gao, J.";
var TEST_AUTHOR_NAME_3 = "van Wijk, J.J.";
var TEST_KEYWORD = "object modeling";

function preload() {
    table = loadTable("../../data/author2topicAndYear.csv", "csv", "header");
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
        var rowYear = row.get(COL_HEADER_YEAR);

        if (author2Topic[rowAuthor] == undefined) {
            author2Topic[rowAuthor] = {};
            author2Topic[rowAuthor][rowKeyword] = {'count': 1, 'year': rowYear};

        } else {
           if (author2Topic[rowAuthor][rowKeyword] == undefined) {
               author2Topic[rowAuthor][rowKeyword] = {'count': 1, 'year': rowYear};

           } else {
               author2Topic[rowAuthor][rowKeyword].count += 1;

               if (author2Topic[rowAuthor][rowKeyword].year < rowYear) {
                   author2Topic[rowAuthor][rowKeyword].year = rowYear;
               }
           }
        }
    }

    console.log(author2Topic);
}

function draw() {
    var authorToDisplay = author2Topic[TEST_AUTHOR_NAME_1];
    var topicCount = Object.keys(authorToDisplay).length;
    var alpha = 360 / topicCount;

    // get the maximum count for topics to draw the circles
    var maxLevels = getMaxTopicCount(authorToDisplay);

    // display author name
    textSize(32);
    text("Author: " + TEST_AUTHOR_NAME_1, 0, 32);

    // draw helper circles
    drawHelperCircles(maxLevels);

    // reset colors & sizes
    reset();

    var bX = 0
    var bY = 0;
    var cX = 0;
    var cY = 0;
    var angle = alpha;

    // loop over topics of author
    for (var topic in authorToDisplay) {
        var count = authorToDisplay[topic].count;
        var year = authorToDisplay[topic].year;

        // calculate point c of the triangle
        bX = RAD * count * Math.sin(toRadians(angle-alpha)) + CENTER_X;
        bY = RAD * count * Math.cos(toRadians(angle-alpha)) + CENTER_Y;

        cX = RAD * count * Math.sin(toRadians(angle)) + CENTER_X;
        cY = RAD * count * Math.cos(toRadians(angle)) + CENTER_Y;

        // add fill saturation based on last publishing year
        fill(getSaturation(year));

        // draw triangle with center point, b & c as corners
        triangle(CENTER_X, CENTER_Y, bX, bY, cX, cY);

        // add label to the end of the triangle
        var midX = (bX + cX) / 2;
        var midY = (bY + cY) / 2;
        var lineLen = getLineLength(count, maxLevels);
        var endPoint = getLineSegmentPoint(CENTER_X, CENTER_Y, midX, midY, lineLen);
        reset();
        line(midX, midY, endPoint.x, endPoint.y);
        text(topic, endPoint.x, endPoint.y);

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
        if (max < topics[topic].count) {
            max = topics[topic].count;
        }
    }

    return max;
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

/**
 * Saturation gets calculated based on the year of last publishing.
 * Year range is from 1990 to 2015 which is a difference from 0 to 25.
 *
 * @param year The last publishing year
 */
function getSaturation(year) {
    var diff = MAX_PUBLISHING_YEAR - year;

    if (diff < 5) {
        return 0;
    } else if (diff < 15) {
        return 100
    } else {
        return 200
    }
}

function getLineSegmentPoint(x1, y1, x2, y2, len2add) {
    var lenAB = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    var newX = x2 + (x2 - x1) / lenAB * len2add;
    var newY = y2 + (y2 - y1) / lenAB * len2add;

    return {'x': newX, 'y': newY};
}

function getLineLength(count, maxCount) {
   var multiplier = (maxCount + 1) - count;
   return multiplier * RAD;
}

function reset() {
    fill(0,0,0);
    textSize(12);
}
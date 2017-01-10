var COL_HEADER_AUTHOR_NAMES = "Deduped.author.names";
var COL_HEADER_AUTHOR_KEYWORDS = "Author.Keywords";
var COL_HEADER_YEAR = "Year";

var MAX_PUBLISHING_YEAR = 2015;

// drawing
var CENTER_X = 600;
var CENTER_Y = 400;
var RAD = 80;

var canvasWidth = 1500;
var canvasHeight = 1500;

var table;
var author2Topic = {};

var selectedAuthor = '';
var detailAuthorName = '';
var isAuthorNameMoving = false;

var font;

// colors
var hoverColor;
var pressedColor;
var bgColor;
var lineColor;

var authorToDisplay;
var detailedTopicsBound = [];
var detailedTopicsContext = [];

// static context
var authorNames = ['Bostock, M.', 'Gao, J.', 'van Wijk, J.J.'];
var authorNamesHover = [0, 0, 0];

function preload() {
    table = loadTable("../../data/author2topicAndYear.csv", "csv", "header");
    font = loadFont('../../assets/ClearSans-Regular.ttf');
}

function setup() {
    createCanvas(canvasWidth, canvasHeight);

    // set up colors
    hoverColor = color(0, 0, 255);
    pressedColor = color(180, 180, 180);
    bgColor = color(255, 255, 255);
    lineColor = color(180, 180, 180);

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

    noLoop();
    //console.log(author2Topic);
}

function draw() {
    background(bgColor);
    reset();

    drawAuthorList();

    if (detailAuthorName !== '') {
        drawAuthorDetails();

    } else {
        drawDropZone();
    }
}

function mouseMoved() {
    if (font) {
        if (!isAuthorNameMoving) {
            // check for author names hovers
            var isAuthorNameHover = false;
            for (var i = 0; i < authorNames.length; i++) {
                var bounds = font.textBounds(authorNames[i], 20, (i * 40 + 20), 14);
                if (bounds.x < mouseX && bounds.x + bounds.w > mouseX &&
                    bounds.y < mouseY && bounds.y + bounds.h > mouseY) {
                    authorNamesHover[i] = 1;
                    selectedAuthor = authorNames[i];
                    isAuthorNameHover = true;

                } else {
                    authorNamesHover[i] = 0;
                }
            }

            if (isAuthorNameHover) {
                cursor(HAND);
            } else {
                cursor(ARROW);
            }

            redraw();

            // check for triangle context details
            if (detailAuthorName) {
                for (var j = 0; j < detailedTopicsBound.length; j++) {
                    var boundsTopic = detailedTopicsBound[j];

                    if (boundsTopic.x < mouseX && boundsTopic.x + boundsTopic.w > mouseX &&
                        boundsTopic.y < mouseY && boundsTopic.y + boundsTopic.h > mouseY) {
                        // draw context details for topic
                        drawContextForTopic(j, boundsTopic);
                    }
                }
            }
        }
    }
}

function mousePressed() {
    if (selectedAuthor !== '' && !isAuthorNameMoving) {
        isAuthorNameMoving = true;
        drawAuthorList();
    }
}

function mouseReleased() {
    if (selectedAuthor !== '' && isAuthorNameMoving &&
    mouseX > 300 && mouseX < 900 &&
    mouseY > 100 && mouseY < 700) {
        detailAuthorName = selectedAuthor;
    }

    isAuthorNameMoving = false;
    selectedAuthor = '';
    reset();
    redraw();
}

function mouseDragged() {
    if (isAuthorNameMoving) {
        // create ghost effect for moving cursor
        redraw();

        fill(lineColor);
        text(selectedAuthor, mouseX, mouseY);
    }
}

function drawContextForTopic(topicIndex, bounds) {
    var posX = bounds.x + bounds.w + 20;
    var posY = bounds.y + bounds.h;
    var displayText = 'Last paper published in ' + detailedTopicsContext[topicIndex];
    var contextBound = font.textBounds(displayText, posX, posY);
    stroke(lineColor);
    fill(210,210,210)
    rect(contextBound.x - 20, contextBound.y - 20, contextBound.w + 40, contextBound.h + 40);
    reset();

    text(displayText, posX, posY);
}

function drawAuthorDetails() {
    reset();
    detailedTopicsBound = [];
    detailedTopicsContext = [];

    authorToDisplay = author2Topic[detailAuthorName];
    var topicCount = Object.keys(authorToDisplay).length;
    var alpha = 360 / topicCount;

    // get the maximum count for topics to draw the circles
    var maxLevels = getMaxTopicCount(authorToDisplay);

    // display author name
    textSize(32);
    var textCenter = textWidth(detailAuthorName) / 2;
    text(detailAuthorName, CENTER_X - textCenter, 32);

    // draw helper circles
    drawHelperCircles(maxLevels);

    // reset colors & sizes
    reset();

    var bX = 0;
    var bY = 0;
    var cX = 0;
    var cY = 0;
    var angle = alpha;

    // loop over topics of author
    for (var topic in authorToDisplay) {
        var count = authorToDisplay[topic].count;
        var year = authorToDisplay[topic].year;

        // calculate point c of the triangle
        bX = RAD * count * Math.sin(toRadians(angle - alpha)) + CENTER_X;
        bY = RAD * count * Math.cos(toRadians(angle - alpha)) + CENTER_Y;

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

        stroke(lineColor);
        line(midX, midY, endPoint.x, endPoint.y);
        reset();

        text(topic, endPoint.x, endPoint.y);
        detailedTopicsBound.push(font.textBounds(topic, endPoint.x, endPoint.y));
        detailedTopicsContext.push(year);

        bX = cX;
        bY = cY;
        angle += alpha;
    }
}

function drawDropZone() {
    noFill();
    stroke(lineColor);
    ellipse(CENTER_X, CENTER_Y - 150, RAD * 6, RAD * 6);

    reset();
    textSize(20);
    var textCenter = textWidth('Drop Author here') / 2;
    text('Drop Author here', CENTER_X - textCenter, CENTER_Y - 150);
}

function drawAuthorList() {
    resetClip(0, 0, 200, 1000);

    var posX = 20;
    var posY = 20;
    var lineHeight = 40;
    stroke(180, 180, 180);
    line(10, 0, 10, 3 * lineHeight - 10);

    textSize(14);
    noStroke();
    for (var i = 0; i < authorNames.length; i++) {
        if (authorNames[i] === detailAuthorName) {
            fill(hoverColor);

        } else if (authorNamesHover[i]) {
            if (isAuthorNameMoving) {
                fill(pressedColor);
            } else {
                fill(hoverColor);
            }
        } else {
            fill(0, 0, 0);
        }
        text(authorNames[i], posX, posY);

        posY += lineHeight;
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
    fill(0, 0, 0);
    noStroke();
    textFont(font, 14);
}

function resetClip(x, y, w, h) {
    fill(bgColor);
    rect(x, y, w, h);
    reset();
}
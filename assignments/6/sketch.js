var COL_HEADER_AUTHOR_NAMES = "Deduped.author.names";
var COL_HEADER_AUTHOR_KEYWORDS = "Author.Keywords";
var COL_HEADER_YEAR = "Year";
var COL_HEADER_PAPER_DOI = "Paper.DOI";
var COL_HEADER_PAPER_TITLE = "Paper.Title";

var MAX_PUBLISHING_YEAR = 2015;

// drawing
var CENTER_X = 600;
var CENTER_Y = 400;
var RAD = 50;
var MAX_CIRCLES = 5;

var canvasWidth = 1800;
var canvasHeight = 1500;

var table;
var author2Topic = {};

var selectedAuthor = '';
var detailAuthorName = '';
var isAuthorNameMoving = false;

var font;

// colors
var activeColor;
var pressedColor;
var bgColor;
var lineColor;
var topicMatchColor = [];

var authorToDisplay;
var detailedTopicsBound = [];
var detailedTopics = [];
var peerReviewList = [];

var selectedTopics = [];
var maxTopicsToShow = 12;
var maxTopicsAvailable = 0;

// static context
var authorNames = [];
var authorNamesHover = [];

var moveLock = false;

var addAuthorIcon;
var addAuthorIconBounds;

function preload() {
    table = loadTable("../../data/authorsAndPapers.csv", "csv", "header");
    font = loadFont('../../assets/ClearSans-Regular.ttf');
    addAuthorIcon = loadImage("../../assets/add_author.ico");
}

function setup() {
    createCanvas(canvasWidth, canvasHeight);

    // set up colors
    activeColor = color(0, 0, 255);
    pressedColor = color(180, 180, 180);
    bgColor = color(255, 255, 255);
    lineColor = color(180, 180, 180);
    topicMatchColor = [
        color(251, 180, 174),
        color(179, 205, 227),
        color(204, 235, 197),
        color(222, 203, 228),
        color(254, 217, 166)];

    // loop over data and get info needed
    for (var i = 0; i < table.getRowCount(); i++) {
        var row = table.getRow(i);
        var rowAuthor = row.get(COL_HEADER_AUTHOR_NAMES);
        var rowTopic = row.get(COL_HEADER_AUTHOR_KEYWORDS);
        var rowYear = row.get(COL_HEADER_YEAR);
        var rowDOI = row.get(COL_HEADER_PAPER_DOI);
        var rowTitle = row.get(COL_HEADER_PAPER_TITLE);

        var paperInfo = {
            'doi': rowDOI,
            'title': rowTitle,
            'year': rowYear
        };
        if (author2Topic[rowAuthor] == undefined) {
            author2Topic[rowAuthor] = {};
            author2Topic[rowAuthor][rowTopic] = {
                'count': 1,
                'lastYear': rowYear,
                'papers': []
            };
            author2Topic[rowAuthor][rowTopic].papers.push(paperInfo);

        } else {
            if (author2Topic[rowAuthor][rowTopic] == undefined) {
                author2Topic[rowAuthor][rowTopic] = {
                    'count': 1,
                    'lastYear': rowYear,
                    'papers': []
                };
                author2Topic[rowAuthor][rowTopic].papers.push(paperInfo);

            } else {
                author2Topic[rowAuthor][rowTopic].count += 1;

                if (author2Topic[rowAuthor][rowTopic].lastYear < rowYear) {
                    author2Topic[rowAuthor][rowTopic].lastYear = rowYear;
                }

                author2Topic[rowAuthor][rowTopic].papers.push(paperInfo);
            }
        }
    }

    noLoop();
}

function draw() {
    background(bgColor);
    reset();

    drawAuthorList();

    if (detailAuthorName !== '') {
        drawAuthorDetails();
        drawAddAuthorIcon();

    } else {
        drawDropZone();
    }
}


/*** DRAW *************************************************************************************************************/
function drawAddAuthorIcon() {
    textSize(32);
    var textCenter = textWidth(detailAuthorName) / 2;
    image(addAuthorIcon, CENTER_X + textCenter + 20, 5, 32, 32);
    addAuthorIconBounds = {'x': CENTER_X + textCenter + 20, 'y': 5, 'w': 32, 'h': 32};
}

function drawContextForTopic(topicIndex, bounds) {
    var posX = bounds.x + bounds.w + 20;
    var posY = bounds.y + bounds.h;

    var author = detailedTopics[topicIndex].author;
    var topicName = detailedTopics[topicIndex].topic;
    var topic = author2Topic[author][topicName];

    var displayText = 'Published papers on topic \'' + topicName + '\':';
    var lines = 1;

    for (var i = 0; i < topic.papers.length; i++) {
        var title = topic.papers[i].title;
        var year = topic.papers[i].year;

        displayText += '\n' + year + ' - ' + title;
        lines++;
    }

    var contextBound = font.textBounds(displayText, posX, posY);
    stroke(lineColor);

    var colorIndex = selectedTopics.indexOf(topicName);
    if (colorIndex >= 0) {
        fill(topicMatchColor[colorIndex]);
    } else {
        fill(210, 210, 210);
    }

    rect(contextBound.x - 20, contextBound.y - 20, contextBound.w + 40, lines * 30);
    reset();

    text(displayText, posX, posY);
}

function drawAuthorDetails() {
    reset();
    detailedTopicsBound = [];
    detailedTopics = [];

    authorToDisplay = author2Topic[detailAuthorName];
    maxTopicsAvailable = Object.keys(authorToDisplay).length;
    var topicCount = (maxTopicsAvailable < maxTopicsToShow) ? maxTopicsAvailable : maxTopicsToShow;

    // sort topics after occurrences
    var sortedTopics = getSortedTopics(authorToDisplay, topicCount);

    // display author name
    textSize(32);
    var textCenter = textWidth(detailAuthorName) / 2;
    text(detailAuthorName, CENTER_X - textCenter, 32);

    // draw helper circles
    drawHelperCircles();

    // reset colors & sizes
    reset();

    var bX = 0;
    var bY = 0;
    var cX = 0;
    var cY = 0;
    var alpha = 360 / sortedTopics.length;
    var angle = alpha;

    // loop over topics of author
    for (var i = 0; i < sortedTopics.length; i++) {
        var topic = sortedTopics[i];
        var count = (authorToDisplay[topic].count > MAX_CIRCLES) ? MAX_CIRCLES : authorToDisplay[topic].count;
        var year = authorToDisplay[topic].lastYear;
        var topicColor = lineColor;

        // calculate point c of the triangle
        bX = RAD * count * Math.sin(toRadians(angle - alpha)) + CENTER_X;
        bY = RAD * count * Math.cos(toRadians(angle - alpha)) + CENTER_Y;

        cX = RAD * count * Math.sin(toRadians(angle)) + CENTER_X;
        cY = RAD * count * Math.cos(toRadians(angle)) + CENTER_Y;

        // add fill saturation based on last publishing year
        fill(getSaturation(year));

        stroke(lineColor);

        // draw triangle with center point, b & c as corners
        triangle(CENTER_X, CENTER_Y, bX, bY, cX, cY);

        // add label to the end of the triangle
        var midX = (bX + cX) / 2;
        var midY = (bY + cY) / 2;
        var lineLen = getLineLength(count);
        var endPoint = getLineSegmentPoint(CENTER_X, CENTER_Y, midX, midY, lineLen);

        var colorIndex = selectedTopics.indexOf(topic);
        if (colorIndex >= 0) {
            topicColor = topicMatchColor[colorIndex];
            strokeWeight(3);
        } else {
            strokeWeight(1);
        }
        stroke(topicColor);
        line(midX, midY, endPoint.x, endPoint.y);
        reset();

        var displayText = '[' + authorToDisplay[topic].count + '] ' + topic;
        text(displayText, endPoint.x, endPoint.y);
        detailedTopicsBound.push(font.textBounds(displayText, endPoint.x, endPoint.y));
        detailedTopics.push({'author': detailAuthorName, 'topic': topic});

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
    if (moveLock) return;

    resetClip(0, 0, 200, 1000);

    var posX = 20;
    var posY = 60;
    var lineHeight = 40;
    stroke(lineColor);
    textSize(14);

    text('Authors listed by topic relevancy:', posX, 20);

    if (authorNames.length > 0) {
        line(10, lineHeight, 10, authorNames.length * lineHeight + lineHeight);
        noStroke();

        for (var i = 0; i < authorNames.length; i++) {
            textSize(14);

            if (authorNames[i] === detailAuthorName) {
                fill(activeColor);

            } else if (peerReviewList.indexOf(authorNames[i]) > -1) {
                fill(pressedColor);

            } else if (authorNamesHover[i]) {
                if (isAuthorNameMoving) {
                    fill(pressedColor);

                } else {
                    textSize(15);
                    fill(0, 0, 0);
                }
            } else {
                fill(0, 0, 0);
            }

            text(authorNames[i], posX, posY);

            posY += lineHeight;
        }

    } else {
        line(10, lineHeight, 10, 2 * lineHeight);
        noStroke();
        text('Please search for topics first!', posX, posY);
    }
}

function drawHelperCircles() {
    noFill();
    stroke(220, 220, 220);
    ellipse(CENTER_X, CENTER_Y, 5, 5);

    for (var i = 1; i <= MAX_CIRCLES; i++) {
        ellipse(CENTER_X, CENTER_Y, RAD * 2 * i, RAD * 2 * i);
    }
}

function generatePeerReviewList() {
    $('.selected-authors ul').text('');
    for (var i = 0; i < peerReviewList.length; i++) {
        $('.selected-authors ul').append('<li>' + peerReviewList[i] + '</li>');
    }
}


/*** DRAW UTILITIES ***************************************************************************************************/
function reset() {
    fill(0, 0, 0);
    noStroke();
    strokeWeight(1);
    textFont(font, 14);
}

function resetClip(x, y, w, h) {
    fill(bgColor);
    rect(x, y, w, h);
    reset();
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
        return 50;
    } else if (diff < 15) {
        return 150
    } else {
        return 200
    }
}

/*
function getMaxTopicCount(topics) {
    var max = 1;

    for (var topic in topics) {
        if (max < topics[topic].count) {
            max = topics[topic].count;
        }
    }

    return max;
}
*/

function getSortedTopics(authorObj, topicCount) {
    var sortedTopics = Object.keys(authorObj).sort(function (a, b) {
        return authorObj[b].count - authorObj[a].count;
    });

    var resArray = [];
    for (var i = 0; i < sortedTopics.length; i++) {
        var topic = sortedTopics[i];
        if (topic && (resArray.length < topicCount || selectedTopics.indexOf(topic) >= 0)) {
            resArray.push(topic);
        }
    }

    return resArray;
}

/*** MATH UTILITIES ***************************************************************************************************/
function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function getLineSegmentPoint(x1, y1, x2, y2, len2add) {
    var lenAB = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    var newX = x2 + (x2 - x1) / lenAB * len2add;
    var newY = y2 + (y2 - y1) / lenAB * len2add;

    return {'x': newX, 'y': newY};
}

function getLineLength(count) {
    var multiplier = (MAX_CIRCLES + 1) - count;
    return multiplier * RAD;
}


/*** EVENTS ***********************************************************************************************************/
function mouseMoved() {
    if (moveLock) return;

    if (font) {
        if (!isAuthorNameMoving && authorNames.length > 0) {
            // check for author names hovers
            var isAuthorNameHover = false;
            for (var i = 0; i < authorNames.length; i++) {
                var bounds = font.textBounds(authorNames[i], 20, (i * 40 + 60), 14);
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

                // add author icon hover
                if (addAuthorIconBounds.x < mouseX && addAuthorIconBounds.x + addAuthorIconBounds.w > mouseX &&
                    addAuthorIconBounds.y < mouseY && addAuthorIconBounds.y + addAuthorIconBounds.h > mouseY) {
                    cursor(HAND);
                    reset();
                    var posX = addAuthorIconBounds.x + addAuthorIconBounds.w + 10;
                    var posY = addAuthorIconBounds.y + (addAuthorIconBounds.h / 2);
                    text('Add author to the peer review list', posX, posY);

                } else {
                    cursor(ARROW);
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

    if (addAuthorIconBounds && addAuthorIconBounds.x < mouseX && addAuthorIconBounds.x + addAuthorIconBounds.w > mouseX &&
        addAuthorIconBounds.y < mouseY && addAuthorIconBounds.y + addAuthorIconBounds.h > mouseY) {

        if (peerReviewList.indexOf(detailAuthorName) < 0) {
            peerReviewList.push(detailAuthorName);
            generatePeerReviewList();
        }
    }
}

function mouseReleased() {
    if (selectedAuthor !== '' && isAuthorNameMoving &&
        mouseX > 300 && mouseX < 900 &&
        mouseY > 100 && mouseY < 700) {
        detailAuthorName = selectedAuthor;
        maxTopicsToShow = 12;
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

function selectorChanged(params) {
    if (params.hasOwnProperty('selected')) {
        var topicSel = params.selected;
        if (selectedTopics.indexOf(topicSel) < 0) {
            selectedTopics.push(topicSel);
        }

    } else if (params.hasOwnProperty('deselected')) {
        var topicDes = params.deselected;
        var index = selectedTopics.indexOf(topicDes);

        if (index > -1) {
            selectedTopics.splice(index, 1);
        }
    }

    // add topic to top page in valid color
    $('.selected-topics').text('');
    for (var i = 0; i < selectedTopics.length; i++) {
        var style = 'style="background-color: ' + topicMatchColor[i] + ';"';
        $('.selected-topics').append('<li ' + style + '>' + selectedTopics[i] + '</li>');
    }

    updateAuthorList();
}

function updateAuthorList() {
    var authorRating = {};

    for (var author in author2Topic) {
        for (var i = 0; i < selectedTopics.length; i++) {
            var authorObj = author2Topic[author];
            var topic = selectedTopics[i];

            if (topic in authorObj) {
                if (authorRating[author] == undefined) {
                    authorRating[author] = authorObj[topic].count;

                } else {
                    authorRating[author] += authorObj[topic].count;
                }
            }
        }
    }

    // sort authors by rating
    var sortedAuthors = Object.keys(authorRating).sort(function (a, b) {
        return authorRating[b] - authorRating[a]
    });

    authorNames = [];
    authorNamesHover = [];
    var maxCount = (sortedAuthors.length <= 10) ? sortedAuthors.length : 10;
    for (var j = 0; j < maxCount; j++) {
        authorNames.push(sortedAuthors[j]);
        authorNamesHover.push(j);
    }

    moveLock = false;
    drawAuthorList();
}


/*** SCROLLING ********************************************************************************************************/
function mouseWheel(event) {
    if (detailAuthorName != '') {
        if (keyIsDown(SHIFT)) {
            disableScroll();

            if (event.delta > 0) {
                if (maxTopicsToShow < maxTopicsAvailable) {
                    maxTopicsToShow++;
                }
            } else {
                if (maxTopicsToShow > 6) {
                    maxTopicsToShow--;
                }
            }

        } else {
            enableScroll();
        }
    }
}

var keys = {37: 1, 38: 1, 39: 1, 40: 1};

function preventDefault(e) {
    e = e || window.event;
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.returnValue = false;
}

function preventDefaultForScrollKeys(e) {
    if (keys[e.keyCode]) {
        preventDefault(e);
        return false;
    }
}

function disableScroll() {
    if (window.addEventListener) {
        window.addEventListener('DOMMouseScroll', preventDefault, false);
    }
    window.onwheel = preventDefault;
    window.onmousewheel = document.onmousewheel = preventDefault;
    window.ontouchmove = preventDefault;
    document.onkeydown = preventDefaultForScrollKeys;
}

function enableScroll() {
    if (window.removeEventListener) {
        window.removeEventListener('DOMMouseScroll', preventDefault, false);
    }
    window.onmousewheel = document.onmousewheel = null;
    window.onwheel = null;
    window.ontouchmove = null;
    document.onkeydown = null;
}



var w = 1300;
var h = 900;

// Now we want to modify the marks
var table;

var yearCol;
var conferenceCol;
var minYear;
var maxYear;

var minWidth = 1;
var maxWidth = 5;

var fills = [0,50,100,150,200];
var conferences = ["VAST","InfoVis","SciVis","Vis"];  

function preload(){
  table = loadTable("../../data/data.csv","csv","header")
}

function setup() {
  createCanvas(w, h);
  noLoop();
  background(255,204,0);
  
  console.log(table.getRowCount() + " total rows in table");
  console.log(table.getColumnCount() + " total columns in table");

  yearCol = table.getColumn("Year");
  minYear = min(yearCol);
  maxYear = max(yearCol);
  
  conferenceCol = table.getColumn("Conference");
  
}

function draw() {
  var spacing = 10;
  var x = 0;
  var y = 5;
  var length = 10;
  var lineheight = 30;
  
  for (var i = 0; i < table.getRowCount(); i++)
   {
     x = x + spacing;
     
     if (x > w - spacing) {
       x = x % w + spacing;
       y = y + lineheight + 10;
     }
     
     currentYear = yearCol[i];
     currentWidth = (currentYear - minYear) / (maxYear - minYear) * (maxWidth - minWidth) + minWidth;
     strokeWeight(currentWidth);
     
     var conf = conferenceCol[i];
     var index = conferences.indexOf(conf);
     var fillColor = fills[index];
     
     stroke(fillColor);
     
     line(x,y,x,y+lineheight);
   }
}
// ---- DEPENDENCIES ----
var d3 = require('d3');
var crossfilter = require('crossfilter');
var ScrollMagic = require('scrollmagic');


// ---- CONVENTIONS ---- 
var margin = {top:100,right:100,bottom:100,left:100};

var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;

var width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight)
    .append('g')
    .attr('transform','translate(' + margin.left + ',' + margin.top + ')');


// ---- SCALES ----
var scaleX = d3.scaleTime()
    .range([0,width]);

var scaleColor = d3.scaleOrdinal()
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue']);

var scaleY = d3.scaleLinear()
    // .domain([0,80])
    .range([height,0]);


//---- AXES ----
var axisX = d3.axisBottom()
    .scale(scaleX)
    .tickSize(-height);
var axisY = d3.axisLeft()
    .scale(scaleY)
    .tickSize(-width);

//---- GENERATORS ----
var lineGenerator = d3.line()
    // .x(function(d){ return scaleX(new Date(d.key)); })
    .x(function(d){ return scaleX(d.key); })
    // .y(function(d){ return scaleY(d.dayAccidents); })
    .y(function(d){ return scaleY(d.value); })
    .curve(d3.curveCardinal);


var scrollController = new ScrollMagic.Controller({
        globalSceneOptions:{
            triggerHook:'onLeave'
        }
    });


// ---- QUEUE ----
d3.queue()
    .defer(d3.csv, 'data/fars.csv',parse)
    .await(function(err, data){

        drawWeather(data);


        //Draw axes
        plot.append('g').attr('class','axis axis-x')
            .attr('transform','translate(0,'+height+')')
            .call(axisX);
        plot.append('g').attr('class','axis axis-y')
            .call(axisY);

        //Append path
        plot.append('path')
            .attr('class', 'average-line');


    var scene1 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-1').clientHeight, //controlled by height of the #scene-1 <section>, as specified in CSS
            triggerElement:'#scene-1',
            reverse:true //should the scene reverse, scrolling up?
        })
        .on('enter',function(){
            console.log('Enter Scene 1');
            draw(data, 'fatals'); //all the fatalities
        })
        .addTo(scrollController);

    var scene2 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-2').clientHeight, //controlled by height of the #scene-1 <section>, as specified in CSS
            triggerElement:'#scene-2',
            reverse:true //should the scene reverse, scrolling up?
        })
        .on('enter',function(){
            console.log('Enter Scene 2');
            draw(data, 'drunk'); //plot drunk drivers
        })
        .addTo(scrollController);

    });


function draw(rows, fact){
    rows.sort(function(a, b){
        return (a.date - b.date);
    });

    console.log(rows);

    // creating the dimension
    var dayFilter = crossfilter(rows);
    var dimDay = dayFilter.dimension(function(d) { return d.date; });

    // aggregating one variable
    var countDays = dimDay.group().reduceSum(function(d) { return d[fact]; });

    // the array
    var allDimension = countDays.top(Infinity);
    allDimension.sort(function(a, b){
        return (a.key - b.key);
    });

    // redraw the axes
    var extX = scaleX.domain( d3.extent(allDimension, function(d){ return d.key; }) );
    var extY = scaleY.domain( d3.extent(allDimension, function(d) { return d.value; }) );

    plot.select('.axis-x')
    .transition().duration(1500)
        .call(axisX);

    plot.select('.axis-y')
        .transition().duration(1500)
        .call(axisY);

    //Draw <path>
    plot.select('.average-line')
        .datum(allDimension)
        .transition()
        .duration(1000)
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .style('stroke-width', '1px')
        .style('stroke', '#00aa99');
        // .style('stroke', function(array){ return scaleColor(array[0].values[0].airline); });

}

function drawWeather(rows) {

    rows.sort(function(a, b){
        return (a.date - b.date);
    });

    // creating the dimensions
    var dayFilter = crossfilter(rows);
    var dimDay = dayFilter.dimension(function(d) { return d.date; });
    var dimWeather = dayFilter.dimension(function(d) { return d.weather; });


    // clear sky
    dimWeather.filter(1);
    var group = dimDay.group();
    var weaClear = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
    group.dispose();

    weaClear.sort(function(a, b){
        return (a.key - b.key);
    });

    dimDay.filter(null);
    dimWeather.filter(null);

    // rain 
    dimWeather.filter(2);
    group = dimDay.group();
    var weaRain = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
    group.dispose();

    weaRain.sort(function(a, b){
        return (a.key.valueOf() - b.key.valueOf());
    });

    // sleet
    dimWeather.filter(3);
    group = dimDay.group();
    var weaSleet = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
    group.dispose();

    weaSleet.sort(function(a, b){
        return (a.key.valueOf() - b.key.valueOf());
    });

    // snow
    dimWeather.filter(4);
    group = dimDay.group();
    var weaSnow = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
    group.dispose();

    weaSnow.sort(function(a, b){
        return (a.key.valueOf() - b.key.valueOf());
    });
}

// ---- MISC FUNCTIONS ----
function parse(d){

    return {
        incident: d.ST_CASE,
        date: new Date(d.YEAR, +d.MONTH-1, d.DAY),  //fix the month offset
        fatals: +d.FATALS,
        drunk: +d.DRUNK_DR,
        city: d.CITY,
        county: d.COUNTY,
        weather: +d.WEATHER,
    };
}
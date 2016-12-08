// ---- DEPENDENCIES ----
var d3 = require('d3');
var crossfilter = require('crossfilter');
var ScrollMagic = require('scrollmagic');
var _ = require('lodash');
// Utils
var utils = require('./utils');
var parse = utils.parse;
var join = utils.join;


// ---- CONVENTIONS ------------------------------------------------------------------------
var margin = {top:40, right:40, bottom:40, left:40};

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
    // .classed('test', true);

var selectLine = plot.selectAll('.average-line');


// ---- SCALES ----------------------------------------------------------------------------
var scaleX = d3.scaleTime()
    .range([0,width]);

var scaleColor = d3.scaleOrdinal()
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue']);

var scaleY = d3.scaleLinear()
    .range([height,0]);

var maxOffset = 1.1,
    minDate = new Date(2014, 11, 25); //these provide padding for the axes

//---- AXES ------------------------------------------------------------------------------
var axisX = d3.axisBottom()
    .scale(scaleX)
    .tickFormat(d3.timeFormat("%b"))
    .tickSize(-height);

var axisY = d3.axisLeft()
    .scale(scaleY)
    .ticks(6)
    .tickSize(-width);

//---- GENERATORS ------------------------------------------------------------------------
var lineGenerator = d3.line()
    .x(function(d){ return scaleX(d.key); })
    .y(function(d){ return scaleY(d.value); })
    .curve(d3.curveMonotoneX);

var lineGeneratorMonth = d3.line()
    .x(function(d){ return scaleX(new Date(2015, d.key-1, 1)); })
    .y(function(d){ return scaleY(d.value); })
    .curve(d3.curveMonotoneX);

// transition for line generator
var t = d3.transition()
        .duration(4000)
        .ease(d3.easePolyIn);


d3.select('.canvas').transition().style('opacity', 1);


var scrollController = new ScrollMagic.Controller({
        globalSceneOptions:{
            triggerHook:'onLeave'
        }
    });

// ---- QUEUE ----------------------------------------------------------------------------
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
            .attr('class', 'average-line')
            .enter();


// ---- SCROLL EVENTS --------------------------------------------------------------------
    var scene0 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-0').clientHeight,
            triggerElement:'#scene-0',
            reverse:true
        })
        .on('enter',function(){
            console.log('Enter Scene 0');
            draw(data, 'fatals');

            plot.selectAll('.average-line')
                .attr("stroke-dasharray", function(d){ return this.getTotalLength(); })
                .attr("stroke-dashoffset", function(d){ return this.getTotalLength(); })
                .style('stroke', 'B11623')
                .style('opacity', '0.6');

            plot.selectAll(".average-line").transition(t)
            .attr("stroke-dashoffset", 0);


            d3.select('#pin').transition().style('opacity', 0).on('end', function(d) {
                    d3.select('#scroller').transition().style('opacity', 1);
                });

            d3.selectAll('.axis').classed('test', true);
            d3.select('.canvas').transition().style('opacity', 1);
        })
        .addTo(scrollController);

    var scene1 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-1').clientHeight,
            triggerElement:'#scene-1',
            reverse:true
        })
        .on('enter',function(){
            console.log('Enter Scene 1');
            d3.selectAll('.axis').classed('test', false);
            
            d3.select('.canvas').transition().duration(1500).style('opacity', 1);
            draw(data, 'fatals'); //all the fatalities
            plot.selectAll('.average-line')
                .style('stroke', 'B11623');

            d3.select('#pin').transition().style('opacity', 0).on('end', function(d) {
                document.getElementById("pin").innerHTML = "These are all the fatalities that ocurred in 2015";
                d3.select('#pin').transition().style('opacity', 1);
            });
        })
        .addTo(scrollController);


    var scene1_2 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-1').clientHeight,
            triggerElement:'#scene-1-2',
            reverse:true
        })
        .on('enter',function(){
            console.log('Enter Scene 1-2');
            d3.select('.canvas').transition().duration(3000).style('opacity', 1);

            draw(data, 'fatals', true); //fatals in monthly freq.
            
            d3.select('#pin').transition().style('opacity', 0).on('end', function(d) {
                document.getElementById("pin").innerHTML = "August is the month with most fatalities";
                d3.select('#pin').transition().style('opacity', 1);
            });

        })
        .addTo(scrollController);

    var scene2 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-2').clientHeight,
            triggerElement:'#scene-2',
            reverse:true
        })
        .on('enter',function(){
            console.log('Enter Scene 2');
            plot.selectAll('.avg').remove();
            draw(data, 'drunk', true); //plot drunk drivers
            plot.selectAll('.average-line')
                .style('stroke', 'purple');

        })
        .addTo(scrollController);


    var scene3 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-3').clientHeight,
            triggerElement:'#scene-3',
            reverse:true
        })
        .on('enter',function(){
            console.log('Enter Scene 3');
            plot.append('path')
                .attr('class', 'avg average-line2')
                .enter();

            plot.append('path')
                .attr('class', 'avg average-line3')
                .enter();

            drawWeather(data); //plot drunk drivers

        })
        .addTo(scrollController);

    });


// ---- DRAW FUNCTION --------------------------------------------------------------------
function draw(rows, fact, month){
    rows.sort(function(a, b){
        return (a.date - b.date);
    });

    var getTheMonth = d3.timeFormat("%m");

    // creating the dimension
    var dayFilter = crossfilter(rows);
    var dimDay = dayFilter.dimension(function(d) { return d.date; });
    
    if (month) {
       dimDay = dayFilter.dimension(function(d) { return getTheMonth(d.date); });
    }

    // aggregating one variable
    var countDays = dimDay.group().reduceSum(function(d) { return d[fact]; });

    // the array
    var allDimension = countDays.top(Infinity);

    allDimension.sort(function(a, b){
        return (a.key - b.key);
    });

    allDimension.forEach(function(el, i) {
        el.key = +el.key;
    });

    // redraw the axes
    scaleX.domain( [minDate, d3.max(allDimension, function(d){ return d.key; })] );
    scaleY.domain( [0, d3.max(allDimension, function(d){ return d.value; })*maxOffset] );

    if (month) {
        scaleX = d3.scaleTime()
        .domain( [minDate, new Date(2015, 11, 1)] )
        .range([0,width]);

        axisX = d3.axisBottom()
            .scale(scaleX)
            .tickFormat(d3.timeFormat("%b"))
            .tickSize(-height);
    }

    plot.select('.axis-x')
    .transition().duration(1500)
        .call(axisX);

    plot.select('.axis-y')
        .transition().duration(1500)
        .call(axisY);

    var path = plot.selectAll(".average-line")
            .datum(allDimension);
            
        path.enter().append("path")
            .merge(path)
            .attr("d", lineGenerator)
            .attr("fill", "none")
            .style('stroke-width', '1.5px');

    if (month) {
        plot.select('.average-line')
            .datum(allDimension)
            .transition().duration(1500)
            .attr('d', lineGeneratorMonth)
            .style('fill', 'none')
            .style('stroke-width', '1.5px');      
    }
}


// ---- WEATHER FUNCTION --------------------------------------------------------------------
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

    dimDay.filter(null);
    dimWeather.filter(null);

    // sleet
    dimWeather.filter(3);
    group = dimDay.group();
    var weaSleet = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
    group.dispose();

    weaSleet.sort(function(a, b){
        return (a.key.valueOf() - b.key.valueOf());
    });

    dimDay.filter(null);
    dimWeather.filter(null);

    // snow
    dimWeather.filter(4);
    group = dimDay.group();
    var weaSnow = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
    group.dispose();

    weaSnow.sort(function(a, b){
        return (a.key.valueOf() - b.key.valueOf());
    });

    dimDay.filter(null);
    dimWeather.filter(null);

    // join into a single array
    var clearRain = join(weaRain, weaClear, "key", "key", function(clear, rain) {
        return {
            key: clear.key,
            clearVal: clear.value,
            rainVal: rain.value,
        };
    });

    var clearRainSleet = join(weaSleet, clearRain, "key", "key", function(clearRain, sleet) {
        return {
            clearVal: clearRain.clearVal,
            rainVal: clearRain.rainVal,
            sleetVal: sleet.value,
            key: clearRain.key
        };
    });

    var weaArray = join(weaSnow, clearRainSleet, "key", "key", function(clearRainSleet, snow) {
        return {
            clearVal: clearRainSleet.clearVal,
            rainVal: clearRainSleet.rainVal,
            sleetVal: clearRainSleet.sleetVal,
            snowVal: snow.value,
            key: clearRainSleet.key
        };
    });

    var weaArray2 = join(weaSnow, clearRainSleet, "key", "key", function(clearRainSleet, snow) {
        return {
            value: [{
            as: clearRainSleet.clearVal,
            bes:clearRainSleet.rainVal,
            des: clearRainSleet.sleetVal,
            ces: snow.value,
            }
            ],

            key: clearRainSleet.key
        };
    });

    var maxWeather = [];
    maxWeather.push(d3.max(weaArray, function(d) { return d.clearVal; }));
    maxWeather.push(d3.max(weaArray, function(d) { return d.rainVal; }));
    maxWeather.push(d3.max(weaArray, function(d) { return d.sleetVal; }));
    maxWeather.push(d3.max(weaArray, function(d) { return d.snowVal; }));
    maxWeather.push(0);

    // redraw the axes
    scaleX.domain( [minDate, d3.max(weaArray, function(d){ return d.key; })] );
    scaleY.domain( [-5, d3.max(maxWeather)*maxOffset] );

    plot.select('.axis-x')
    .transition().duration(1500)
        .call(axisX);

    plot.select('.axis-y')
        .transition().duration(1500)
        .call(axisY);

    //Draw <path>
    plot.selectAll('.average-line')
        .datum(weaClear)
        .transition()
        .duration(1000)
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .style('stroke-width', '1px')
        .style('stroke', 'red');

    plot.selectAll('.average-line2')
        .datum(weaRain)
        .transition()
        .duration(1000)
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .style('stroke-width', '1px')
        .style('stroke', 'green');

    plot.selectAll('.average-line3')
        .datum(weaSleet)
        .transition()
        .duration(1000)
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .style('stroke-width', '1px')
        .style('stroke', 'pink');


}


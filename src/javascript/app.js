// ---- DEPENDENCIES ----
var d3 = require('d3');
window.d3 = d3;
d3.interpolatePath = require('d3-interpolate-path').interpolatePath;
var crossfilter = require('crossfilter');
var ScrollMagic = require('scrollmagic');
var _ = require('lodash');

// Utils
var utils = require('./utils');
var parse = utils.parse;
var join = utils.join;
var fatalsData = utils.fatalsData;
var drunksData = utils.drunksData;
var weatherData = utils.weatherData;

var getTheMonth = d3.timeFormat("%m");


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

var c = {red: 'B11623', green:' #83a243', purple: '#9157ae', teal: '#669b90', orange: 'b95c4c',
        key: function(n) {
                return this[Object.keys(this)[n]];
            }};

// ---- SCALES ----------------------------------------------------------------------------
var scaleX = d3.scaleTime()
    .domain( [new Date(2015, 0, 1), new Date(2015, 11, 31)] )
    .range([0,width]);

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
    .tickSize(-10);

//---- GENERATORS ------------------------------------------------------------------------
var lineGenerator = d3.line()
    .x(function(d){ return scaleX(new Date(d.key)); })
    .y(function(d){ return scaleY(d.value); })
    .curve(d3.curveMonotoneX);

var lineGeneratorMonth = d3.line()
    .x(function(d){ return scaleX(new Date(2015, d.key-1, 1)); })
    .y(function(d){ return scaleY(d.value); })
    .curve(d3.curveMonotoneX);

// transition for line generator
var t = d3.transition()
        .duration(3200)
        .ease(d3.easeQuadInOut);


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
            drawDay(fatalsData(data, false), false);

            plot.selectAll('.average-line')
                .attr("stroke-dasharray", function(d){ return this.getTotalLength(); })
                .attr("stroke-dashoffset", function(d){ return this.getTotalLength(); })
                .style('stroke', c.red)
                .style('opacity', '0.4');

            // plot.selectAll('.average-line').transition()

            plot.selectAll(".average-line").transition(t)
                .attr("stroke-dashoffset", 0)
                .on('end', function(d) {
                    d3.select('.commentary').transition().duration(1500).style('opacity', 1);
                });

            d3.select('#pin').transition().style('opacity', 0);

            d3.select('#pin').transition().style('opacity', 0).on('end', function(d) {
                    d3.select('#scroller').transition().style('opacity', 1);
                });

            d3.selectAll('.axis-y').classed('axisX', true);
            d3.selectAll('.axis-x').classed('axisY', true);
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
            drawDay(fatalsData(data, false), false);
            d3.selectAll('.axis').classed('test', false);
            
            d3.select('.canvas').transition().duration(1500).style('opacity', 1);
            
            plot.selectAll('.average-line')
                .transition().duration(1500)
                .style('stroke', c.red)
                .style('opacity', '1');

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

            drawMonth(fatalsData(data, true), true); //fatals in monthly freq.
            
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
            // plot.selectAll('.avg').remove();

            plot.append('path')
                .attr('class', 'avg average-line2')
                .enter();

            // draw(data, 'drunk', true);
            drawMonth(drunksData(data, true), true);
            plot.selectAll('.average-line')
                .style('stroke', c.purple);

            d3.select('#pin').transition().style('opacity', 0).on('end', function(d) {
                document.getElementById("pin").innerHTML = "These are all the incidents with drunk drivers";
                d3.select('#pin').transition().style('opacity', 1);
            });

        })
        .addTo(scrollController);


    var scene3 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-3').clientHeight,
            triggerElement:'#scene-3',
            reverse:true
        })
        .on('enter',function(){
            console.log('Enter Scene 3');

            scaleX = d3.scaleTime()
                .domain( [new Date(2015, 0, 1), new Date(2015, 11, 1)] )
                .range([0,width]);

            plot.append('path')
                .attr('class', 'avg average-line2')
                .enter();

            plot.append('path')
                .attr('class', 'avg average-line3')
                .enter();

            plot.append('path')
                .attr('class', 'avg average-line4')
                .enter();

            drawWeather(weatherData(data));

            d3.select('#pin').transition().style('opacity', 0).on('end', function(d) {
                document.getElementById("pin").innerHTML = "Incidents by type of weather";
                d3.select('#pin').transition().style('opacity', 1);
            });

        })
        .addTo(scrollController);



    });
    
// ---- DRAW FUNCTION --------------------------------------------------------------------
function drawDay(arrayTest, month){

    scaleY.domain( [0, d3.max(arrayTest, function(d){ return d.value; })*maxOffset] );

    plot.select('.axis-x')
    .transition().duration(1500)
        .call(axisX);

    plot.select('.axis-y')
        .transition().duration(1500)
        .call(axisY);

    var path = plot.selectAll(".average-line")
            .data([arrayTest]);
            
        path.enter().append("path")
            .attr('class', 'average-line')
            .merge(path)
            
            .attr("fill", "none")
            .style('stroke-width', '1.5px')
            .attr("d", lineGenerator);  
}


function drawMonth(arrayTest, month){
    scaleY.domain( [0, d3.max(arrayTest, function(d){ return d.value; })*maxOffset] );

    plot.select('.axis-x')
    .transition().duration(1500)
        .call(axisX);

    plot.select('.axis-y')
        .transition().duration(1500)
        .call(axisY);

    var path = plot.selectAll(".average-line")
            .data([arrayTest]);

        plot.select('.average-line')
            .datum(arrayTest)
            .transition().duration(1500)
            .style('fill', 'none')
            .style('stroke-width', '1.5px')
            .style('stroke','purple')
            //.attr('d',lineGeneratorMonth);
            .attrTween('d', function (d) {
                var previous = d3.select(this).attr('d');
                var current = lineGeneratorMonth(d);    
                return d3.interpolatePath(previous, current);
          });
}


function drawWeather(obj) {
    var test = obj.weaClear;

    console.log(test);
}

// ---- WEATHER FUNCTION --------------------------------------------------------------------
function drawWeather(obj) {
    var weaClear    = obj.weaClear,
        weaRain     = obj.weaRain,
        weaSleet    = obj.weaSleet,
        weaSnow     = obj.weaSnow,
        maxWeather  = obj.maxWeather;

    var weathers = [weaClear, weaRain, weaSleet, weaSnow];
    scaleY.domain( [-5, d3.max(maxWeather)*maxOffset] );


    axisX = d3.axisBottom()
        .scale(scaleX)
        .tickFormat(d3.timeFormat("%b"))
        .tickSize(-height);

    plot.select('.axis-x')
    .transition().duration(1500)
        .call(axisX);

    plot.select('.axis-y')
        .transition().duration(1500)
        .call(axisY);


    // for (var i = 0; i < weathers.length; i++) {
        plot.selectAll('.average-line')
            .data(weathers)
            .enter().append('path')
            .attr("class", 'i')
            .transition().duration(1500)
            .transition()
            .duration(1000)
            .attr('d', lineGeneratorMonth)
            .style('fill', 'none')
            .style('stroke-width', '1.5px')
            .style('stroke', function(d, i) { console.log(c.key[i]); });
    // }

    // plot.selectAll('.average-line')
    //     .datum(weaClear)
    //     .transition()
    //     .duration(1000)
    //     .attr('d', lineGeneratorMonth)
    //     .style('fill', 'none')
    //     .style('stroke-width', '1.5px')
    //     .style('stroke', c.green);

    // plot.selectAll('.average-line2')
    //     .datum(weaRain)
    //     .transition()
    //     .duration(1000)
    //     .attr('d', lineGeneratorMonth)
    //     .style('fill', 'none')
    //     .style('stroke-width', '1.5px')
    //     .style('stroke', c.purple);

    // plot.selectAll('.average-line3')
    //     .datum(weaSleet)
    //     .transition()
    //     .duration(1000)
    //     .attr('d', lineGeneratorMonth)
    //     .style('fill', 'none')
    //     .style('stroke-width', '1.5px')
    //     .style('stroke', c.teal);

    // plot.selectAll('.average-line4')
    //     .datum(weaSnow)
    //     .transition()
    //     .duration(1000)
    //     .attr('d', lineGeneratorMonth)
    //     .style('fill', 'none')
    //     .style('stroke-width', '1.5px')
    //     .style('stroke', c.orange);

    var myText =  plot.append("text")
       .attr("y", 200)//magic number here
       .attr("x", 60)
       .attr('text-anchor', 'middle')
       .attr("class", "myLabel")//easy to style with CSS
       .text("I'm a label");

}


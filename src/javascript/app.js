// ---- DEPENDENCIES ----
var d3 = require('d3');
var crossfilter = require('crossfilter');
var ScrollMagic = require('scrollmagic');
var _ = require('lodash');
// Utils
var utils = require('./utils');
var parse = utils.parse;
var join = utils.join;


// ---- CONVENTIONS ---- -------------------------------------------------------------------
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

var selectLine = plot.selectAll('.average-line');


// ---- SCALES ----------------------------------------------------------------------------
var scaleX = d3.scaleTime()
    .range([0,width]);

var scaleColor = d3.scaleOrdinal()
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue']);

var scaleY = d3.scaleLinear()
    // .domain([0,80])
    .range([height,0]);


//---- AXES ------------------------------------------------------------------------------
var axisX = d3.axisBottom()
    .scale(scaleX)
    .tickSize(-height);
var axisY = d3.axisLeft()
    .scale(scaleY)
    .tickSize(-width);

//---- GENERATORS ------------------------------------------------------------------------
var lineGenerator = d3.line()
    .x(function(d){ return scaleX(d.key); })
    .y(function(d){ return scaleY(d.value); })
    .curve(d3.curveCardinal);

d3.select('.canvas').transition().style('opacity', 0);


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
            duration:document.getElementById('scene-0').clientHeight, //controlled by height of the #scene-1 <section>, as specified in CSS
            triggerElement:'#scene-0',
            reverse:true //should the scene reverse, scrolling up?
        })
        .on('enter',function(){
            console.log('Enter Scene 0');
            d3.select('.canvas').transition().style('opacity', 0);
            // d3.select('.canvas').style('visibility', 'hidden');
            // document.getElementById("scene-0").innerHTML = "Paragraph changed!";
        })
        .addTo(scrollController);

    var scene1 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-1').clientHeight, //controlled by height of the #scene-1 <section>, as specified in CSS
            triggerElement:'#scene-1',
            reverse:true //should the scene reverse, scrolling up?
        })
        .on('enter',function(){
            console.log('Enter Scene 1');
            d3.select('.canvas').transition().duration(1500).style('opacity', 1);
            draw(data, 'fatals'); //all the fatalities
            plot.selectAll('.average-line')
                .style('stroke', 'orange');
            
        })

        .addTo(scrollController);


    var scene1_2 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-1').clientHeight, //controlled by height of the #scene-1 <section>, as specified in CSS
            triggerElement:'#scene-1-2',
            reverse:true //should the scene reverse, scrolling up?
        })
        .on('enter',function(){
            console.log('Enter Scene 1-2');
            d3.select('.canvas').transition().style('opacity', 1);

            // lineGenerator = d3.line()
            //     .x(function(d){ return scaleX(d.key); })
            //     .y(function(d){ return scaleY(d.value); })
            //     .curve(d3.curveStep);

            draw(data, 'fatals', true);
            plot.selectAll('.average-line')
                .style('stroke', 'blue');

        })
        .addTo(scrollController);

    var scene2 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-2').clientHeight, //controlled by height of the #scene-1 <section>, as specified in CSS
            triggerElement:'#scene-2',
            reverse:true //should the scene reverse, scrolling up?
        })
        .on('enter',function(){
            console.log('Enter Scene 2');
            plot.selectAll('.avg').remove();
            draw(data, 'drunk'); //plot drunk drivers
            plot.selectAll('.average-line')
                .style('stroke', 'purple');

        })
        .addTo(scrollController);


    var scene3 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-3').clientHeight, //controlled by height of the #scene-1 <section>, as specified in CSS
            triggerElement:'#scene-3',
            reverse:true //should the scene reverse, scrolling up?
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

    // console.log(rows);

    // creating the dimension
    var dayFilter = crossfilter(rows);
    var dimDay = dayFilter.dimension(function(d) { return d.date; });
    if (month) {
       var dimDay = dayFilter.dimension(function(d) { return d.date.getMonth(); });
    }
    // aggregating one variable
    var countDays = dimDay.group().reduceSum(function(d) { return d[fact]; });

    // the array
    var allDimension = countDays.top(Infinity);
    console.log(allDimension);
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
        .style('stroke-width', '1px');
        // .style('stroke', '#00aa99');
        // .style('stroke', function(array){ return scaleColor(array[0].values[0].airline); });
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
    var extX = scaleX.domain( d3.extent(weaArray, function(d){ return d.key; }) );
    var extY = scaleY.domain( d3.extent(maxWeather) );

    // scaleY.domain([0, 65]);

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


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

var c = {red: 'B11623', green:' #83a243', purple: '#9157ae', teal: '#669b90', orange: 'b95c4c'};

// ---- SCALES ----------------------------------------------------------------------------
var scaleX = d3.scaleTime()
    .domain( [new Date(2014, 0, 1), new Date(2016, 11, 31)] )
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
        .duration(4000)
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

        console.log('true', fatalsData(data, true));
        console.log('false', fatalsData(data, false));

// ---- SCROLL EVENTS --------------------------------------------------------------------
    var scene0 = new ScrollMagic.Scene({
            duration:document.getElementById('scene-0').clientHeight,
            triggerElement:'#scene-0',
            reverse:true
        })
        .on('enter',function(){
            console.log('Enter Scene 0');
            draw(fatalsData(data, false), false);

            plot.selectAll('.average-line')
                .attr("stroke-dasharray", function(d){ return this.getTotalLength(); })
                .attr("stroke-dashoffset", function(d){ return this.getTotalLength(); })
                .style('stroke', c.red)
                .style('opacity', '0.4');

            plot.selectAll(".average-line").transition(t)
                .attr("stroke-dashoffset", 0);

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
            d3.selectAll('.axis').classed('test', false);
            
            d3.select('.canvas').transition().duration(1500).style('opacity', 1);
            
            //draw(data, 'fatals'); //all the fatalities
            
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

            draw(fatalsData(data, true), true); //fatals in monthly freq.
            
            d3.select('#pin').transition().style('opacity', 0).on('end', function(d) {
                document.getElementById("pin").innerHTML = "August is the month with most fatalities";
                d3.select('#pin').transition().style('opacity', 1);
            });

        })
        .addTo(scrollController);

    // var scene2 = new ScrollMagic.Scene({
    //         duration:document.getElementById('scene-2').clientHeight,
    //         triggerElement:'#scene-2',
    //         reverse:true
    //     })
    //     .on('enter',function(){
    //         console.log('Enter Scene 2');
    //         // plot.selectAll('.avg').remove();

    //         plot.append('path')
    //             .attr('class', 'avg average-line2')
    //             .enter();

    //         draw(data, 'drunk', true);
    //         plot.selectAll('.average-line')
    //             .style('stroke', c.purple);

    //         d3.select('#pin').transition().style('opacity', 0).on('end', function(d) {
    //             document.getElementById("pin").innerHTML = "These are all the incidents with drunk drivers";
    //             d3.select('#pin').transition().style('opacity', 1);
    //         });

    //     })
    //     .addTo(scrollController);


    // var scene3 = new ScrollMagic.Scene({
    //         duration:document.getElementById('scene-3').clientHeight,
    //         triggerElement:'#scene-3',
    //         reverse:true
    //     })
    //     .on('enter',function(){
    //         console.log('Enter Scene 3');
    //         plot.append('path')
    //             .attr('class', 'avg average-line2')
    //             .enter();

    //         plot.append('path')
    //             .attr('class', 'avg average-line3')
    //             .enter();

    //         plot.append('path')
    //             .attr('class', 'avg average-line4')
    //             .enter();

    //         drawWeather(data); //draw all weather

    //         d3.select('#pin').transition().style('opacity', 0).on('end', function(d) {
    //             document.getElementById("pin").innerHTML = "Incidents by type of weather";
    //             d3.select('#pin').transition().style('opacity', 1);
    //         });

    //     })
    //     .addTo(scrollController);



    });
    


// ---- DRAW FUNCTION --------------------------------------------------------------------
function draw(arrayTest, month){

    console.log('working');

    // redraw the axes
    // scaleX.domain( [minDate, d3.max(arrayTest, function(d){ return d.key; })] );
    scaleY.domain( [0, d3.max(arrayTest, function(d){ return d.value; })*maxOffset] );

    // if (month) {
    //     scaleX = d3.scaleTime()
    //     .domain( [minDate, new Date(2015, 11, 1)] )
    //     .range([0,width]);

    //     axisX = d3.axisBottom()
    //         .scale(scaleX)
    //         .tickFormat(d3.timeFormat("%b"))
    //         .tickSize(-height);
    // }

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
            .attr("d", lineGenerator)
            .attr("fill", "none")
            .style('stroke-width', '1.5px');


    if (month) {
        plot.select('.average-line')
            .datum(arrayTest)
            .transition().duration(1500)
            //.attr('d', lineGeneratorMonth)
            .style('fill', 'none')
            .style('stroke-width', '5px')
            .style('stroke','purple')
            //.attr('d',lineGeneratorMonth);
            .attrTween('d', function (d) {
                var previous = d3.select(this).attr('d');
                var current = lineGeneratorMonth(d);    
                return d3.interpolatePath(previous, current);
          });
    }


        // plot.selectAll('.average-line2')
        //     .datum(allDimensionDrunk)
        //     .transition()
        //     .duration(1500)
        //     .attr('d', lineGeneratorMonth)
        //     .style('fill', 'none')
        //     .style('stroke-width', '1.5px')
        //     .style('stroke', c.orange);
   
}



// ---- WEATHER FUNCTION --------------------------------------------------------------------
// function drawWeather(rows) {

//     rows.sort(function(a, b){
//         return (a.date - b.date);
//     });

//     // creating the dimensions
//     var dayFilter = crossfilter(rows);
//     var dimDay = dayFilter.dimension(function(d) { return getTheMonth(d.date); }); 
//     var dimWeather = dayFilter.dimension(function(d) { return d.weather; });

//     // clear sky
//     dimWeather.filter(1);
//     var group = dimDay.group();
//     var weaClear = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
//     group.dispose();

//     weaClear.sort(function(a, b){
//         return (a.key - b.key);
//     });

//     dimDay.filter(null);
//     dimWeather.filter(null);

//     // rain 
//     dimWeather.filter(2);
//     group = dimDay.group();
//     var weaRain = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
//     group.dispose();

//     weaRain.sort(function(a, b){
//         return (a.key.valueOf() - b.key.valueOf());
//     });

//     dimDay.filter(null);
//     dimWeather.filter(null);

//     // sleet
//     dimWeather.filter(3);
//     group = dimDay.group();
//     var weaSleet = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
//     group.dispose();

//     weaSleet.sort(function(a, b){
//         return (a.key.valueOf() - b.key.valueOf());
//     });

//     dimDay.filter(null);
//     dimWeather.filter(null);

//     // snow
//     dimWeather.filter(4);
//     group = dimDay.group();
//     var weaSnow = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
//     group.dispose();

//     weaSnow.sort(function(a, b){
//         return (a.key.valueOf() - b.key.valueOf());
//     });

//     dimDay.filter(null);
//     dimWeather.filter(null);

//     // join into a single array
//     var clearRain = join(weaRain, weaClear, "key", "key", function(clear, rain) {
//         return {
//             key: clear.key,
//             clearVal: clear.value,
//             rainVal: rain.value,
//         };
//     });

//     var clearRainSleet = join(weaSleet, clearRain, "key", "key", function(clearRain, sleet) {
//         return {
//             clearVal: clearRain.clearVal,
//             rainVal: clearRain.rainVal,
//             sleetVal: sleet.value,
//             key: clearRain.key
//         };
//     });

//     var weaArray = join(weaSnow, clearRainSleet, "key", "key", function(clearRainSleet, snow) {
//         return {
//             clearVal: clearRainSleet.clearVal,
//             rainVal: clearRainSleet.rainVal,
//             sleetVal: clearRainSleet.sleetVal,
//             snowVal: snow.value,
//             key: clearRainSleet.key
//         };
//     });

//     var weaArray2 = join(weaSnow, clearRainSleet, "key", "key", function(clearRainSleet, snow) {
//         return {
//             value: [{
//             as: clearRainSleet.clearVal,
//             bes:clearRainSleet.rainVal,
//             des: clearRainSleet.sleetVal,
//             ces: snow.value,
//             }
//             ],

//             key: clearRainSleet.key
//         };
//     });

//     var maxWeather = [];
//     maxWeather.push(d3.max(weaArray, function(d) { return d.clearVal; }));
//     maxWeather.push(d3.max(weaArray, function(d) { return d.rainVal; }));
//     maxWeather.push(d3.max(weaArray, function(d) { return d.sleetVal; }));
//     maxWeather.push(d3.max(weaArray, function(d) { return d.snowVal; }));
//     maxWeather.push(0);

//     console.log(weaSleet);
//     console.log(weaSnow);

//     // redraw the axes
//     // scaleX.domain( [minDate, d3.max(weaArray, function(d){ return d.key; })] );
//     scaleY.domain( [-5, d3.max(maxWeather)*maxOffset] );


//     scaleX = d3.scaleTime()
//         .domain( [minDate, new Date(2015, 11, 1)] )
//         .range([0,width]);

//     axisX = d3.axisBottom()
//         .scale(scaleX)
//         .tickFormat(d3.timeFormat("%b"))
//         .tickSize(-height);

//     plot.select('.axis-x')
//     .transition().duration(1500)
//         .call(axisX);

//     plot.select('.axis-y')
//         .transition().duration(1500)
//         .call(axisY);

//     //Draw <path>
//     plot.selectAll('.average-line')
//         .datum(weaClear)
//         .transition()
//         .duration(1000)
//         .attr('d', lineGeneratorMonth)
//         .style('fill', 'none')
//         .style('stroke-width', '1.5px')
//         .style('stroke', c.green);

//     plot.selectAll('.average-line2')
//         .datum(weaRain)
//         .transition()
//         .duration(1000)
//         .attr('d', lineGeneratorMonth)
//         .style('fill', 'none')
//         .style('stroke-width', '1.5px')
//         .style('stroke', c.purple);

//     plot.selectAll('.average-line3')
//         .datum(weaSleet)
//         .transition()
//         .duration(1000)
//         .attr('d', lineGeneratorMonth)
//         .style('fill', 'none')
//         .style('stroke-width', '1.5px')
//         .style('stroke', c.teal);

//     plot.selectAll('.average-line4')
//         .datum(weaSnow)
//         .transition()
//         .duration(1000)
//         .attr('d', lineGeneratorMonth)
//         .style('fill', 'none')
//         .style('stroke-width', '1.5px')
//         .style('stroke', c.orange);


// }


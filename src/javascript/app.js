// ---- DEPENDENCIES ----
var d3 = require('d3');
var crossfilter = require('crossfilter');


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

//d3.set to hold a unique array of airlines
// var airlines = d3.set();

// ---- SCALES ----
var scaleX = d3.scaleTime()
    .range([0,width]);

var scaleColor = d3.scaleOrdinal()
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue']);

var scaleY = d3.scaleLinear()
    .domain([0,80])
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


// ---- QUEUE ----
d3.queue()
    .defer(d3.csv, 'data/fars.csv',parse)
    .await(function(err, data){

        // var date1 = new Date();
        //     date1.setMonth(data[0].date.getMonth() - 1);


        // console.log(data);

        // //Mine the data to set the scales
        // var ext = scaleX.domain( d3.extent(data,function(d){ return d.date; }) );


        // scaleColor.domain( airlines.values() );
        // console.log(d3.extent(data,function(d){ return d.date; }));

        // var _data = data;

        // //Add buttons
        // d3.select('.btn-group')
        //     .selectAll('.btn')
        //     .data( airlines.values() )
        //     .enter()
        //     .append('a')
        //     .html(function(d){ return d; })
        //     .attr('href','#')
        //     .attr('class','btn btn-default')
        //     .style('color','white')
        //     .style('background',function(d){ return scaleColor(d); })
        //     .style('border-color','white')
        //     .on('click',function(d){
        //         var filteredData = _data.filter(function (el) {
        //             return(el.airline == d);
        //         });
        //         draw(filteredData);
        //     });


        //Draw axes
        plot.append('g').attr('class','axis axis-x')
            .attr('transform','translate(0,'+height+')')
            .call(axisX);
        plot.append('g').attr('class','axis axis-y')
            .call(axisY);

        //Append path
        plot.append('path')
            .attr('class', 'average-line');

        draw(data);

    });

function draw(rows){
    rows.sort(function(a, b){
        return (a.date - b.date);
    });

    var accidentsByDate = d3.nest().key(function(d){ return d.date; })
        .entries(rows);

    accidentsByDate.forEach(function(day, i){
        day.dayAccidents = accidentsByDate[i].values.length;
    });


    // some crossfilter shennaningans
    var dayFilter = crossfilter(rows);
    var dimDay = dayFilter.dimension(function(d) { return d.date; });
    // var countDays = dimDay.group().reduceSum(function(d) { return d.fatals; });




    var countDays = dimDay.group().reduceSum(function(d) { return d.drunk; }); //the drunk drivers
    var allDrunks = countDays.top(Infinity);

    allDrunks.sort(function(a, b){
        return (a.key - b.key);
    }); //worst code ever


    var ext = scaleX.domain( d3.extent(allDrunks,function(d){ return d.key; }) );
    console.log(allDrunks);

    // console.log(countDays.top(10)); //gives me top 10 fatalities by date




    // console.log(rows);
    // console.log(accidentsByDate);

    //Draw dots
    //UPDATE
    // var node = plot.selectAll('.circle')
    //     .data(rows,function(d){return d.id; });

    // //ENTER
    // var enter = node.enter()
    //     .append('circle')
    //     .attr('class', 'circle')
    //     .attr('r', 0)
    //     .attr('cx',function(d){ return scaleX(d.travelDate); })
    //     .attr('cy', function(d){ return scaleY(d.price); })
    //     .style('fill', function(d) { return scaleColor(d.airline); })

    //     // .on('click',function(d,i){
    //     //     console.log(d.travelDate.getFullYear());
    //     // })
        
    //     .on('mouseenter', function(d){
    //         var tooltip = d3.select('.custom-tooltip'),
    //             year    = d.travelDate.getFullYear(),
    //             month   = (1 + d.travelDate.getMonth()),
    //             day     = (1 + d.travelDate.getDay());

    //         tooltip.select('.title')
    //             .html(d.airline + ', ' + day + '/' + month + '/' + year);
    //         tooltip.select('.value')
    //             .html('Price: ' + d.price);

    //         tooltip.transition().style('opacity',1);
    //         d3.select(this).style('stroke-width','3px');
    //     })

    //     .on('mousemove',function(d){
    //         var tooltip = d3.select('.custom-tooltip');
    //         var xy = d3.mouse( d3.select('.container').node() );
    //         tooltip
    //             .style('left',xy[0]+10+'px')
    //             .style('top',xy[1]+10+'px');

    //     })
    //     .on('mouseleave',function(d){
    //         var tooltip = d3.select('.custom-tooltip');
    //         tooltip.transition().style('opacity',0);

    //         d3.select(this).style('stroke-width','0px');
    //     });
        
    // //UPDATE + ENTER
    // enter
    //     .merge(node)
    //     .transition()
    //     .duration(1000)
    //     .attr('r', 3)
    //     .attr('cx',function(d){ return scaleX(d.travelDate); })
    //     .attr('cy', function(d){ return scaleY(d.price); })
    //     .style('fill', function(d) { return scaleColor(d.airline); })
    //     .style('fill-opacity', 0.8);

    // //EXIT
    // node.exit().transition().attr("r", 0).remove();

    //Draw <path>
    plot.select('.average-line')
        .datum(allDrunks)
        .transition()
        .duration(1000)
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .style('stroke-width', '1px')
        .style('stroke', '#00aa99');
        // .style('stroke', function(array){ return scaleColor(array[0].values[0].airline); });

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
    };
}
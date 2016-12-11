var crossfilter = require('crossfilter');

// ---- MISC FUNCTIONS ----
function parse(d){

    return {
        incident: d.ST_CASE,
        date: new Date(d.YEAR, +d.MONTH-1, d.DAY),  //fix the month offset
        month: new Date(+d.MONTH-1),
        fatals: +d.FATALS,
        drunk: +d.DRUNK_DR,
        city: d.CITY,
        county: d.COUNTY,
        weather: +d.WEATHER,
    };
}


function join(lookupTable, mainTable, lookupKey, mainKey, select) {
    var l = lookupTable.length,
        m = mainTable.length,
        lookupIndex = [],
        output = [];

    for (var i = 0; i < l; i++) { // loop through l items
        var row = lookupTable[i];
        lookupIndex[row[lookupKey]] = row; // create an index for lookup table
    }

    for (var j = 0; j < m; j++) { // loop through m items
        var y = mainTable[j];
        var x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
        output.push(select(y, x)); // select only the columns you need
    }
    return output;
}



function fatalsData(rows, month){
    rows.sort(function(a, b){
        return (a.date - b.date);
    });
    var getTheMonth = d3.timeFormat("%m");

    // creating the dimension
    var dataFilter = crossfilter(rows);
    var dimDate = dataFilter.dimension(function(d) { return d.date; });
    
    if (month) {
       dimDate = dataFilter.dimension(function(d) { return getTheMonth(d.date); });   
    }

    var countFatal = dimDate.group().reduceSum(function(d) { return d.fatals; });

    var dataArray = countFatal.top(Infinity);
    dataArray.sort(function(a, b){
        return (a.key - b.key);
    });

    dataArray.forEach(function(el) {
        el.key = +el.key;
    });

    return(dataArray);
}


function drunksData(rows, month){
    rows.sort(function(a, b){
        return (a.date - b.date);
    });
    var getTheMonth = d3.timeFormat("%m");

    // creating the dimension
    var dataFilter = crossfilter(rows);
    var dimDate = dataFilter.dimension(function(d) { return d.date; });
    
    if (month) {
       dimDate = dataFilter.dimension(function(d) { return getTheMonth(d.date); });   
    }

    var countDrunk = dimDate.group().reduceSum(function(d) { return d.drunk; });

    var dataArray = countDrunk.top(Infinity);
    dataArray.sort(function(a, b){
        return (a.key - b.key);
    });

    dataArray.forEach(function(el) {
        el.key = +el.key;
    });

    return(dataArray);
}

function weatherData(rows) {
    rows.sort(function(a, b){
        return (a.date - b.date);
    });

    var getTheMonth = d3.timeFormat("%m");

    // creating the dimensions
    var dataFilter = crossfilter(rows);
    var dimDate = dataFilter.dimension(function(d) { return getTheMonth(d.date); }); 
    var dimWeather = dataFilter.dimension(function(d) { return d.weather; });

    // clear sky
    dimWeather.filter(1);
    var group = dimDate.group();
    var weaClear = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
    group.dispose();

    weaClear.sort(function(a, b){
        return (a.key - b.key);
    });

    dimDate.filter(null);
    dimWeather.filter(null);

    // rain 
    dimWeather.filter(2);
    group = dimDate.group();
    var weaRain = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
    group.dispose();

    weaRain.sort(function(a, b){
        return (a.key.valueOf() - b.key.valueOf());
    });

    dimDate.filter(null);
    dimWeather.filter(null);

    // sleet
    dimWeather.filter(3);
    group = dimDate.group();
    var weaSleet = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
    group.dispose();

    weaSleet.sort(function(a, b){
        return (a.key.valueOf() - b.key.valueOf());
    });

    dimDate.filter(null);
    dimWeather.filter(null);

    // snow
    dimWeather.filter(4);
    group = dimDate.group();
    var weaSnow = group.reduceSum(function(d) { return d.weather; }).top(Infinity);
    group.dispose();

    weaSnow.sort(function(a, b){
        return (a.key.valueOf() - b.key.valueOf());
    });

    dimDate.filter(null);
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

    var maxWeather = [];
    maxWeather.push(d3.max(weaArray, function(d) { return d.clearVal; }));
    maxWeather.push(d3.max(weaArray, function(d) { return d.rainVal; }));
    maxWeather.push(d3.max(weaArray, function(d) { return d.sleetVal; }));
    maxWeather.push(d3.max(weaArray, function(d) { return d.snowVal; }));
    maxWeather.push(0);


    return {
        maxWeather: maxWeather,
        weaClear: weaClear,
        weaRain: weaRain,
        weaSleet: weaSleet,
        weaSnow: weaSnow
    };
}



module.exports = {
    parse: parse,
    join: join,
    fatalsData: fatalsData,
    drunksData: drunksData,
    weatherData: weatherData
};
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

module.exports = {
    parse: parse,
    join: join
};
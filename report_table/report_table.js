/* Dependency: None yet. */

debug = true;

const addCSS = link => {
  const linkElement = document.createElement('link');

  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', link);

  document.getElementsByTagName('head')[0].appendChild(linkElement);
};

const loadStylesheets = () => {
  addCSS('https://jwtest.ngrok.io/report_table/report_table.css');
};

const options = {}

const getNewConfigOptions = function(config, fields) {
  newOptions = options;

  for (var i = 0; i < fields.length; i++) {
    newOptions['label|' + fields[i].name] = {
      section: "Columns",
      type: "string",
      label: fields[i].label_short || fields[i].label,
      order: i * 10,
    }

    newOptions['option_a|' + fields[i].name] = {
      section: "Columns",
      type: "boolean",
      label: 'Option A', // fields[i].name,
      display_size: 'half',
      order: i * 10 + 1,
    }

    newOptions['option_b|' + fields[i].name] = {
      section: "Columns",
      type: "boolean",
      label: 'Option B', // fields[i].name,
      display_size: 'half',
      order: i * 10 + 2,
    }

  }
  return newOptions
}

const buildVis = function(flatData) {

  var table = d3.select('#visContainer')
    .append('table')
    .attr("class", "reportTable");

  // create table header
  table.append('thead').append('tr')
    .selectAll('th')
    .data(flatData.headers).enter()
    .append('th')
    .text(d => d.header_name);
  
  // create table body
  table.append('tbody')
    .selectAll('tr')
    .data(flatData.data).enter()
    .append('tr')
    .selectAll('td')
    .data(function(row, i) {
      return flatData.headers.map(function(column) {
        var cell = row[column.header_name]
        cell.align = column.align
        return cell;
      })
    }).enter()
    .append('td')
    .text(d => d.rendered || d.value)
    .attr('class', d => d.align)
  
  console.log(table);
}

const buildFlatData = function(data, queryResponse) {
  var dims = queryResponse.fields.dimension_like
  var meas = queryResponse.fields.measure_like
  var pivots = queryResponse.fields.pivots
  if (typeof queryResponse.pivots !== 'undefined') {
    pivots = queryResponse.pivots
    console.log(pivots)
  }
  var supers = []
  if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
    var supers = queryResponse.fields.supermeasure_like
  }

  console.log('Number of dimension_likes', dims.length)
  console.log('Number of measure_likes', meas.length)
  console.log('Number of pivots', pivots.length)
  console.log('Number of supermeasure_likes', supers.length)
  
  flatData = {
    'headers': [],
    'data': []
  }
  for (var d = 0; d < dims.length; d++) {
    header = { ...{'header_name': dims[d].name}, ...dims[d]}
    flatData.headers.push(header)
  }
  if (pivots.length > 0) {
    for(var p = 0; p < pivots.length; p++) {
      for (var m = 0; m < meas.length; m++) {
        pivotKey = pivots[p]['key']
        measureName = meas[m]['name']
        headerName = pivotKey + '.' + measureName
        header = { ...{'header_name': headerName}, ...meas[m]}
        flatData.headers.push(header)
      }
    }
  } else {
    for (var m = 0; m < meas.length; m++) {
      header = { ...{'header_name': meas[m].name}, ...meas[m]}
      flatData.headers.push(header)
    }
  }
  if (supers) {
    for (var s = 0; s < supers.length; s++) {
      header = { ...{'header_name': supers[s].name}, ...supers[s]}
      flatData.headers.push(header)
    }
  }

  for (var i = 0; i < data.length; i++) {
    row = {}
    for (var d = 0; d < dims.length; d++) {
      row[dims[d].name] = data[i][dims[d].name]
    }
    if (pivots.length > 0) {
      for(var p = 0; p < pivots.length; p++) {
        for (var m = 0; m < meas.length; m++) {
          if (!pivots[p].is_total || typeof meas[m].is_table_calculation  == 'undefined') {
            pivotKey = pivots[p]['key']
            measureName = meas[m]['name']
            cellKey = pivotKey + '.' + measureName
            cellValue = data[i][measureName][pivotKey]
            row[cellKey] = cellValue
          }
        }
      }
    } else {
      for (var m = 0; m < meas.length; m++) {
        row[meas[m].name] = data[i][meas[m].name]
      }
    }
    if (supers) {
      for (var s = 0; s < supers.length; s++) {
        row[supers[s].name] = data[i][supers[s].name]
      }
    }

    flatData.data.push(row)
  }

  if (typeof queryResponse.totals_data !== 'undefined') {
    parser = new DOMParser()
    var totals = queryResponse.totals_data
    if (pivots.length > 0) {
      var row = {}
      for (var d = 0; d < dims.length; d++) {
        row[dims[d].name] = { 'value': '' }
      }
      for(var p = 0; p < pivots.length; p++) {
        for (var m = 0; m < meas.length; m++) {
          if (!pivots[p].is_total || typeof meas[m].is_table_calculation  == 'undefined') {
            pivotKey = pivots[p]['key']
            measureName = meas[m]['name']
            cellKey = pivotKey + '.' + measureName
            cellValue = totals[measureName][pivotKey]
            if (typeof cellValue.rendered == 'undefined' && typeof cellValue.html !== 'undefined' ){
              rendered = parser.parseFromString(cellValue.html, 'text/html')
              cellValue.rendered = rendered.getElementsByTagName('a')[0].innerText
            }
            row[cellKey] = cellValue
          }
        }
      }
      flatData.data.push(row)
    } else {
      for (var d = 0; d < dims.length; d++) {
        totals[dims[d].name] = { 'value': '' }
      }
      flatData.data.push(totals)
    }
  }
  return flatData
}

looker.plugins.visualizations.add({
  options: options,

  create: function(element, config) {
    loadStylesheets();

    // this.container = d3.select(element)
    //   .append("div")
    //   .attr("id", "visContainer")
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates.
    this.clearErrors();

    try {
      var elem = document.querySelector('#visContainer');
      elem.parentNode.removeChild(elem);  
    } catch(e) {}    

    this.container = d3.select(element)
      .append("div")
      .attr("id", "visContainer")

    if (debug) {
      console.log('data:');
      console.log(JSON.stringify(data, null, 2));
      console.log('config:');
      console.log(JSON.stringify(config, null, 2));
      console.log('queryResponse:');
      console.log(JSON.stringify(queryResponse, null, 2));      
    }

    var visHeight = element.clientHeight - 16;
    var fields = queryResponse.fields.dimension_like
                  .concat(queryResponse.fields.measure_like)
    
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      fields = fields.concat(queryResponse.fields.supermeasure_like)
    }

    new_options = getNewConfigOptions(config, fields);
    this.trigger("registerOptions", new_options);

    flatData = buildFlatData(data, queryResponse)

    buildVis(flatData);

    console.log(flatData)
    console.log(queryResponse.totals_data)
    
    done();
  }
})
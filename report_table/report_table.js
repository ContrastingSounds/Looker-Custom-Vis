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

const options = {
  subtotalDepth: {
    section: "Subtotals",
    type: "number",
    label: "Sub Total Depth",
    default: 1
  },
  singleDimensionColumn: {
    section: "Subtotals",
    type: "boolean",
    label: "Single Dimension Column",
    // display_size: 'third',
    default: "false",
  }
}

const getNewConfigOptions = function(config, fields) {
  newOptions = options;

  for (var i = 0; i < fields.length; i++) {
    newOptions['label|' + fields[i].name] = {
      section: "Columns",
      type: "string",
      label: fields[i].label_short || fields[i].label,
      order: i * 10,
    }

    newOptions['hide|' + fields[i].name] = {
      section: "Columns",
      type: "boolean",
      label: 'Hide', // fields[i].name,
      display_size: 'third',
      order: i * 10 + 1,
    }

    newOptions['var_num|' + fields[i].name] = {
      section: "Columns",
      type: "boolean",
      label: 'Var #', // fields[i].name,
      display_size: 'third',
      order: i * 10 + 2,
    }

    newOptions['var_pct|' + fields[i].name] = {
      section: "Columns",
      type: "boolean",
      label: 'Var %', // fields[i].name,
      display_size: 'third',
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
  
  var align = 'right'
  // create table body
  table.append('tbody')
    .selectAll('tr')
    .data(flatData.data).enter()
    .append('tr')
    .selectAll('td')
    .data(function(row) {
      return flatData.headers.map(function(column) {
        var cell = row[column.header_name]
        cell.align = column.align
        return cell;
      })
    }).enter()
    .append('td')
    .text(d => d.rendered || d.value)
    // .attr('class', d => d.align)
    // // .classed(function (d) {return d.align}, true)
    // .classed('total', d => typeof d.cell_style !== 'undefined')
    .attr('class', d => {
      classes = []
      classes.push(d.align)
      if (typeof d.cell_style !== 'undefined') { classes.push('total') }
      return classes.join(' ')
    })
  
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
    row['$$$_sort_$$$'] = [0, 0, i]
    flatData.data.push(row)
  }

  if (typeof queryResponse.totals_data !== 'undefined') {
    parser = new DOMParser()
    var totals = queryResponse.totals_data
    if (pivots.length > 0) {
      var row = {}
      for (var d = 0; d < dims.length; d++) {
        if (d+1 == dims.length) {
          row[dims[d].name] = { 'value': 'TOTAL', 'cell_style': 'total' }
        } else {
          row[dims[d].name] = { 'value': '' }
        }
      }
      for(var p = 0; p < pivots.length; p++) {
        for (var m = 0; m < meas.length; m++) {
          if (!pivots[p].is_total || typeof meas[m].is_table_calculation  == 'undefined') {
            pivotKey = pivots[p]['key']
            measureName = meas[m]['name']
            cellKey = pivotKey + '.' + measureName
            cellValue = totals[measureName][pivotKey]
            cellValue['cell_style'] = 'total'
            if (typeof cellValue.rendered == 'undefined' && typeof cellValue.html !== 'undefined' ){
              rendered = parser.parseFromString(cellValue.html, 'text/html')
              cellValue.rendered = rendered.getElementsByTagName('a')[0].innerText
            }
            row[cellKey] = cellValue
          }
        }
      }
    } else {
      for (var d = 0; d < dims.length; d++) {
        if (d+1 == dims.length) {
          totals[dims[d].name] = { 'value': 'TOTAL' }
        } else {
          totals[dims[d].name] = { 'value': '' }
        }
      }
      row = totals
      
    }
    row['$$$_totals_$$$'] = true
    row['$$$_sort_$$$'] = [1, 0, 0]
    flatData.data.push(row)
  }
  flatData.totals = true
  return flatData
}

const addSubTotals = function(flatData, dims, depth) {
  subTotals = []
  latest_grouping = []
  for (var r = 0; r < flatData.data.length; r++) {    
    row = flatData.data[r]
    if(typeof row['$$$_totals_$$$'] === 'undefined') {
      grouping = []
      for (var g = 0; g < depth; g++) {
        grouping.push(row[dims[g].name].value)
      }
      if (grouping.join('|') !== latest_grouping.join('|')) {
        console.log(latest_grouping, grouping)
        subTotals.push(grouping)
        latest_grouping = grouping
      }
      row['$$$_sort_$$$'] = [0, subTotals.length-1, r]
    }
  }
  for (var s = 0; s < subTotals.length; s++) {
    subtotal = {}
    for (var c = 0; c < flatData.headers.length; c++) {
      if (c+1 == dims.length) {
        subtotal_label = 'Total ' + subTotals[s].join(' – ') // [subTotals[s].length-1]
        subtotal[flatData.headers[c]['header_name']] = {'value':  subtotal_label, 'cell_style': 'total'}
      } else {
        subtotal[flatData.headers[c]['header_name']] = ''
      }
    }
    subtotal['$$$_sort_$$$'] = [0, s, 9999]
    flatData.data.push(subtotal)

    var sort_func = function(a, b) { if (a['$$$_sort_$$$'] > b['$$$_sort_$$$']) {return 1} else {return -1} }
    flatData.data.sort(sort_func)
  }
  console.log('subTotals', subTotals)
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

    // var subTotalDepth = 2
    console.log(config)
    console.log(config.subtotalDepth)
    addSubTotals(flatData, queryResponse.fields.dimension_like, config.subtotalDepth)

    buildVis(flatData);

    console.log(flatData)
    
    done();
  }
})
/* Dependency: https://cdnjs.cloudflare.com/ajax/libs/d3/5.15.0/d3.min.js */

// TODO: update flatData.data so that each row has a single_dimension value
// TODO: update table building to handle singleDimensionColumn option

debug = false;

class Row {
  constructor(type) {
    this.type = type
    this.sort = []
    this.data = {}
  }
}

class Column {
  constructor(id) {
    this.id = id
    this.field = {}
  }
}

class FlatData {
  constructor(lookerData, queryResponse) {
    this.columns = []
    this.data = []
    this.dims = queryResponse.fields.dimension_like
    this.number_of_dimensions = this.dims.length
    this.totals = false
    this.subtotals = false

    var meas = queryResponse.fields.measure_like
    var pivots = queryResponse.pivots
    if (typeof queryResponse.pivots !== 'undefined') {
      pivots = queryResponse.pivots
    }
    var supers = []
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      supers = queryResponse.fields.supermeasure_like
    }

    // BUILD COLUMNS
    //
    for (var d = 0; d < this.dims.length; d++) {
      // var column = { ...{'id': dims[d].name}, ...dims[d]}
      var column = new Column(this.dims[d].name)
      column.field = this.dims[d]
      this.columns.push(column)
    }
    if (pivots.length > 0) {
      for(var p = 0; p < pivots.length; p++) {
        for (var m = 0; m < meas.length; m++) {
          if (typeof meas[m].is_table_calculation === 'undefined') {
            var pivotKey = pivots[p]['key']
            var measureName = meas[m]['name']
            var columnId = pivotKey + '.' + measureName
            var column = new Column(columnId)
            column.field = meas[m]
            this.columns.push(column)
          }
        }
      }
    } else {
      for (var m = 0; m < meas.length; m++) {
        var column = new Column(meas[m].name)
        column.field = meas[m]
        this.columns.push(column)
      }
    }
    if (supers.length > 0) {
      for (var s = 0; s < supers.length; s++) {
        var column = new Column(supers[s].name)
        column.field = supers[s]
        this.columns.push(column)
      }
    }
  
    // BUILD ROWS
    //
    for (var i = 0; i < lookerData.length; i++) {
      var row = new Row('line_item')

      // DIMENSIONS
      for (var d = 0; d < this.dims.length; d++) {
        var dim = this.dims[d].name
        row.data[dim] = lookerData[i][dim]
      }

      if (pivots.length > 0) {
        // PIVOTED MEASURES
        for(var p = 0; p < pivots.length; p++) {
          for (var m = 0; m < meas.length; m++) {
            if (!pivots[p].is_total || typeof meas[m].is_table_calculation  == 'undefined') {
              var pivotKey = pivots[p]['key']
              var measureName = meas[m]['name']
              var cellKey = pivotKey + '.' + measureName
              var cellValue = lookerData[i][measureName][pivotKey]
              row.data[cellKey] = cellValue
            }
          }
        }
      } else {
        // MEASURES
        for (var m = 0; m < meas.length; m++) {
          var mea = meas[m].name
          row.data[mea] = lookerData[i][mea] 
        }
      }
      // SUPERMEASURES
      if (supers.length > 0) {
        for (var s = 0; s < supers.length; s++) {
          var super_ = supers[s].name
          row.data[super_] = lookerData[i][super_]
        }
      }
      row.sort = [0, 0, i]
      this.data.push(row)
    }
  
    // TOTALS ROW
    if (typeof queryResponse.totals_data !== 'undefined') {
      var parser = new DOMParser()
      var totals_ = queryResponse.totals_data

      if (pivots.length > 0) {
        var row = new Row('total')
        // DIMENSIONS
        for (var d = 0; d < this.dims.length; d++) {
          if (d+1 == this.dims.length) {
            row.data[this.dims[d].name] = { 'value': 'TOTAL', 'cell_style': 'total' }
          } else {
            row.data[this.dims[d].name] = { 'value': '' }
          }
        }
        // MEASURES
        for(var p = 0; p < pivots.length; p++) {
          for (var m = 0; m < meas.length; m++) {
            if (!pivots[p].is_total || typeof meas[m].is_table_calculation  == 'undefined') {
              var pivotKey = pivots[p]['key']
              var measureName = meas[m]['name']
              var cellKey = pivotKey + '.' + measureName
              var cellValue = totals_[measureName][pivotKey]
              cellValue['cell_style'] = 'total'
              if (typeof 
                    cellValue.rendered == 'undefined' 
                    && typeof cellValue.html !== 'undefined'
                    && cellValue.html != ''
              ){
                var rendered = parser.parseFromString(cellValue.html, 'text/html')
                cellValue.rendered = rendered.getElementsByTagName('a')[0].innerText
              }
              row.data[cellKey] = cellValue
            }
          }
        }
        // SUPERMEASURES
        if (supers.length > 0) {
          for (var s = 0; s < supers.length; s++) {
            var super_ = supers[s].name
            row.data[super_] = totals_[super_]
          }
        }
      } else {
        // Straight copy except for adding "TOTAL" label
        for (var d = 0; d < this.dims.length; d++) {
          if (d+1 == this.dims.length) {
            totals_[this.dims[d].name] = { 'value': 'TOTAL' }
          } else {
            totals_[this.dims[d].name] = { 'value': '' }
          }
        }
        row.data = totals_
        
      }
      row.sort = [1, 0, 0]
      this.data.push(row)
      this.totals = true
    }
  }

  addSubTotals (depth) { // (flatData, dims, depth) {
    if (typeof depth === 'undefined') { depth = this.number_of_dimensions - 1 }
    var subTotals = []
    var latest_grouping = []
    for (var r = 0; r < this.data.length; r++) {    
      var row = this.data[r]
      if (row.type !== 'total') {
        var grouping = []
        for (var g = 0; g < depth; g++) {
          var dim = this.dims[g].name
          grouping.push(row.data[dim].value)
        }
        if (grouping.join('|') !== latest_grouping.join('|')) {
          subTotals.push(grouping)
          latest_grouping = grouping
        }
        row.sort = [0, subTotals.length-1, r]
      }
    }
    for (var s = 0; s < subTotals.length; s++) {
      var subtotal = new Row('subtotal')
      for (var c = 0; c < this.columns.length; c++) {
        if (c+1 == this.dims.length) {
          var subtotal_label = 'Total ' + subTotals[s].join(' – ') // [subTotals[s].length-1]
          subtotal.data[this.columns[c]['id']] = {'value':  subtotal_label, 'cell_style': 'total'}
        } else {
          subtotal.data[this.columns[c]['id']] = ''
        }
      }
      subtotal.sort = [0, s, 9999]
      this.data.push(subtotal)
    }
    var compare_sort_values = (a, b) => {
      for(var i=0; i<3; i++) {
          if (a.sort[i] > b.sort[i]) { return 1 }
          if (a.sort[i] < b.sort[i]) { return -1 }
      }
      return -1
    }
    this.data.sort(compare_sort_values)
    this.subtotals = true
  }

  raw() {
    var raw_values = []
    this.data.forEach(r => {
      if (r.type === 'line_item') {
        var row = {}
        this.columns.forEach(c => {
          row[c.id] = r.data[c.id].value
        })
        raw_values.push(row)
      }
    })
    return raw_values
  }
}

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

const getHeaders = function(flatData, config, queryResponse) {
  if (config.singleDimensionColumn) {
    non_dimensions = flatData.columns.splice(queryResponse.fields.dimension_like.length)
    single_dimension = {
      'id': 'single_dimension',
      'label': 'Single Dimension',
      'align': 'left',
    }
    return [single_dimension].concat(non_dimensions)
  } else {
    return flatData.columns
  }
}

const buildVis = function(flatData) {

  var table = d3.select('#visContainer')
    .append('table')
    .attr("class", "reportTable");

  // create table header
  table.append('thead').append('tr')
    .selectAll('th')
    .data(flatData.columns).enter()
    .append('th')
    .text(d => d.id);
  
  var align = 'right'
  // create table body
  table.append('tbody')
    .selectAll('tr')
    .data(flatData.data).enter()
    .append('tr')
    .selectAll('td')
    .data(function(row) {
      return flatData.columns.map(function(column) {
        var cell = row.data[column.id]
        cell.align = column.field.align
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

    flatData = new FlatData(data, queryResponse)
    flatData.addSubTotals(config.subtotalDepth)
    buildVis(flatData);

    console.log(flatData)
    console.log(flatData.raw())
    
    done();
  }
})
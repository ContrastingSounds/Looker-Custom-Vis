/* Dependency: https://cdnjs.cloudflare.com/ajax/libs/d3/5.15.0/d3.min.js */

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

class LookerData {
  constructor(lookerData, queryResponse) {
    this.columns = []
    this.data = []
    this.dims = queryResponse.fields.dimension_like
    this.meas = queryResponse.fields.measure_like
    this.supers = []
    this.pivots = queryResponse.pivots
    this.number_of_dimensions = this.dims.length
    this.totals = false
    this.subtotals = false
    this.has_pivots = false
    this.has_supers = false

    // var meas = queryResponse.fields.measure_like
    // var pivots = queryResponse.pivots
    // if (typeof queryResponse.pivots !== 'undefined') {
    if (this.pivots.length > 0) {
      // this.pivots = queryResponse.pivots
      this.has_pivots = true
    }

    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      this.supers = queryResponse.fields.supermeasure_like
      this.has_supers = true
    }

    // BUILD COLUMNS
    //
    for (var d = 0; d < this.dims.length; d++) {
      // var column = { ...{'id': dims[d].name}, ...dims[d]}
      var column = new Column(this.dims[d].name)
      column.field = this.dims[d]
      this.columns.push(column)
    }
    if (this.has_pivots) {
      for(var p = 0; p < this.pivots.length; p++) {
        for (var m = 0; m < this.meas.length; m++) {
          if (typeof this.meas[m].is_table_calculation === 'undefined') {
            var pivotKey = this.pivots[p]['key']
            var measureName = this.meas[m]['name']
            var columnId = pivotKey + '.' + measureName
            var column = new Column(columnId)
            column.field = this.meas[m]
            this.columns.push(column)
          }
        }
      }
    } else {
      for (var m = 0; m < this.meas.length; m++) {
        var column = new Column(this.meas[m].name)
        column.field = this.meas[m]
        this.columns.push(column)
      }
    }
    if (this.has_supers) {
      for (var s = 0; s < this.supers.length; s++) {
        var column = new Column(this.supers[s].name)
        column.field = this.supers[s]
        this.columns.push(column)
      }
    }
  
    // BUILD ROWS
    //
    for (var i = 0; i < lookerData.length; i++) {
      var row = new Row('line_item')

      // DIMENSIONS
      var row_index = []
      for (var d = 0; d < this.dims.length; d++) {
        var dim = this.dims[d].name
        row.data[dim] = lookerData[i][dim]
        row_index.push(lookerData[i][dim].value)
      }
      var idx = this.number_of_dimensions - 1
      var final_value = lookerData[i][this.dims[idx].name].value
      row.data['$$$_index_$$$'] = { 'value': final_value, 'cell_style': 'indent' }

      if (this.has_pivots) {
        // PIVOTED MEASURES
        for(var p = 0; p < this.pivots.length; p++) {
          for (var m = 0; m < this.meas.length; m++) {
            if (!this.pivots[p].is_total || typeof this.meas[m].is_table_calculation  == 'undefined') {
              var pivotKey = this.pivots[p]['key']
              var measureName = this.meas[m]['name']
              var cellKey = pivotKey + '.' + measureName
              var cellValue = lookerData[i][measureName][pivotKey]
              row.data[cellKey] = cellValue
            }
          }
        }
      } else {
        // MEASURES
        for (var m = 0; m < this.meas.length; m++) {
          var mea = this.meas[m].name
          row.data[mea] = lookerData[i][mea] 
        }
      }
      // SUPERMEASURES
      if (this.has_supers) {
        for (var s = 0; s < this.supers.length; s++) {
          var super_ = this.supers[s].name
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

      if (this.has_pivots) {
        var row = new Row('total')
        row.data['$$$_index_$$$'] = { 'value': 'TOTAL', cell_style: 'total' }
        // DIMENSIONS
        for (var d = 0; d < this.dims.length; d++) {
          if (d+1 == this.dims.length) {
            row.data[this.dims[d].name] = { 'value': 'TOTAL', 'cell_style': 'total' }
          } else {
            row.data[this.dims[d].name] = { 'value': '' }
          }
        }
        // MEASURES
        for(var p = 0; p < this.pivots.length; p++) {
          for (var m = 0; m < this.meas.length; m++) {
            if (!this.pivots[p].is_total || typeof this.meas[m].is_table_calculation  == 'undefined') {
              var pivotKey = this.pivots[p]['key']
              var measureName = this.meas[m]['name']
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
        if (this.has_supers) {
          for (var s = 0; s < this.supers.length; s++) {
            var super_ = this.supers[s].name
            row.data[super_] = totals_[super_]
            row.data[super_].cell_style = 'total'
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

  addSubTotals (depth) { // (lookerData, dims, depth) {
    if (typeof depth === 'undefined') { depth = this.number_of_dimensions - 1 }

    // BUILD GROUPINGS / SORT VALUES
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

    // GENERATE DATA ROWS FOR SUBTOTALS
    for (var s = 0; s < subTotals.length; s++) {
      var subtotal = new Row('subtotal')
      // DIMENSIONS
      for (var d = 0; d < this.columns.length; d++) {
        if (d+1 == this.dims.length) {
          var subtotal_label = subTotals[s].join(' | ') // [subTotals[s].length-1]
          subtotal.data[this.columns[d]['id']] = {'value':  subtotal_label, 'cell_style': 'total'}
        } else {
          subtotal.data[this.columns[d]['id']] = ''
        }
      }

      // MEASURES
      if (this.has_pivots) { // Pivoted measures, skipping table_calculations for row totals
        for(var p = 0; p < this.pivots.length; p++) {
          for (var m = 0; m < this.meas.length; m++) {
            if (!this.pivots[p].is_total || typeof this.meas[m].is_table_calculation  == 'undefined') {
              var pivotKey = this.pivots[p]['key']
              var measureName = this.meas[m]['name']
              var cellKey = pivotKey + '.' + measureName
              var cellValue = {'value': 'TBD', 'cell_style': 'total'}
              subtotal.data[cellKey] = cellValue
            }
          }
        }
      } else {
        for (var m = 0; m < this.meas.length; m++) {
          var mea = this.meas[m].name
          subtotal.data[mea] = {'value': 'TBD', 'cell_style': 'total'}
        }
      }

      // SUPERMEASURES
      if (this.has_supers) {
        for (var s_ = 0; s_ < this.supers.length; s_++) {
          var super_ = this.supers[s_].name
          subtotal.data[super_] = {'value': 'TBD', 'cell_style': 'total'}
        }
      }

      subtotal.data['$$$_index_$$$'] = { 'value': subtotal_label, 'cell_style': 'total'}
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

  headers (index_column=false) {
    if (index_column) {
      var index_dimension = {
        'id': '$$$_index_$$$',
        'field': {
          'label': 'Index',
          'align': 'left'
        }
      }
      var non_dimensions = this.columns.slice(this.number_of_dimensions)
      return [index_dimension].concat(non_dimensions)
    } else {
      return this.columns
    }
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
  indexColumn: {
    section: "Subtotals",
    type: "boolean",
    label: "Use Index Dimension",
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

const buildReportTable = function(lookerData, index_column=false) {

  var table = d3.select('#visContainer')
    .append('table')
    .attr("class", "reportTable");

  // create table header
  table.append('thead').append('tr')
    .selectAll('th')
    .data(lookerData.headers(index_column)).enter()
    .append('th')
    .text(d => d.id);
  
  var align = 'right'
  // create table body
  table.append('tbody')
    .selectAll('tr')
    .data(lookerData.data).enter()
    .append('tr')
    .selectAll('td')
    .data(function(row) {
      return lookerData.headers(index_column).map(function(column) {
        var cell = row.data[column.id]
        cell.align = column.field.align
        return cell;
      })
    }).enter()
    .append('td')
    .text(d => d.rendered || d.value)
    .attr('class', d => {
      classes = []
      if (typeof d.align !== 'undefined') { classes.push(d.align) }
      if (typeof d.cell_style !== 'undefined') { 
        var styles = d.cell_style.split(' ')
        classes = classes.concat(styles) 
      }
      return classes.join(' ')
    })
    console.log(table)
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

    lookerData = new LookerData(data, queryResponse)
    lookerData.addSubTotals(config.subtotalDepth)
    console.log(lookerData)
    buildReportTable(lookerData, config.indexColumn);
    
    done();
  }
})
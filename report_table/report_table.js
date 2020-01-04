/* Dependency: https://cdnjs.cloudflare.com/ajax/libs/d3/5.15.0/d3.min.js */

const formatter = d3.format(",.2f")

class Row {
  constructor(type) {
    this.id = ''
    this.type = type
    this.sort = []
    this.data = {}
  }
}

class Column {
  constructor(id) {
    this.id = id
    this.levels = []
    this.field = {} // Looker field definition
    this.type = '' // dimension | measure
    this.pivoted = false
    this.super = false
    this.pivot_key = ''
    this.measure_name = ''
    this.align = '' // left | center | right
  }
}

class LookerData {
  constructor(lookerData, queryResponse) {
    this.columns = []
    this.dimensions = []
    this.measures = []
    this.data = []
    this.rowspan_values = {}

    this.pivots = []
    this.number_of_pivots = queryResponse.fields.pivots.length
    this.has_totals = false
    this.has_subtotals = false
    this.has_pivots = false
    this.has_supers = false

    if (typeof queryResponse.pivots !== 'undefined') {
      this.pivots = queryResponse.pivots
      this.has_pivots = true
    }

    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      this.has_supers = true
    }

    // BUILD COLUMN INDEX ///////////////////////////////////////////////////
    var index_column = new Column('$$$_index_$$$')
    index_column.align = 'left'
    var index_levels = ['$$$_index_$$$']
    for (var p = 0; p < queryResponse.fields.pivots.length-1; p++) { index_levels.push('') }
    index_column.levels = index_levels
    this.columns.push(index_column)

    for (var d = 0; d < queryResponse.fields.dimension_like.length; d++) {
      var column_name = queryResponse.fields.dimension_like[d].name
      this.dimensions.push(column_name)
      var column = new Column(column_name)
      var levels = [column_name]
      for (var p = 0; p < queryResponse.fields.pivots.length-1; p++) { levels.push('') }
      column.levels = levels
      column.field = queryResponse.fields.dimension_like[d]
      column.type = 'dimension'
      column.pivoted = false
      column.super = false
      this.columns.push(column)
    }

    for (var m = 0; m < queryResponse.fields.measure_like.length; m++) {
      this.measures.push(queryResponse.fields.measure_like[m].name)
    }

    if (this.has_pivots) {
      for (var p = 0; p < this.pivots.length; p++) {
        for (var m = 0; m < this.measures.length; m++) {
          if (typeof queryResponse.fields.measure_like[m].is_table_calculation === 'undefined') {
            var pivotKey = this.pivots[p]['key']
            var measureName = this.measures[m]
            var columnId = pivotKey + '.' + measureName
            var levels = []
            for (var pf = 0; pf < queryResponse.fields.pivots.length; pf++) { 
              var pf_name = queryResponse.fields.pivots[pf].name
              levels.push(this.pivots[p]['data'][pf_name]) 
            }
            var column = new Column(columnId)
            column.levels = levels
            column.field = queryResponse.fields.measure_like[m]
            column.type = 'measure'
            column.pivoted = true
            column.super = false
            column.pivot_key = pivotKey
            column.measure_name = measureName
            this.columns.push(column)
          }
        }
      }
    } else {
      for (var m = 0; m < this.measures.length; m++) {
        var column = new Column(this.measures[m])
        column.field = queryResponse.fields.measure_like[m]
        column.type = 'measure'
        column.pivoted = false
        column.super = false
        this.columns.push(column)
      }
    }
    
    // this.supermeasures = []
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      for (var s = 0; s < queryResponse.fields.supermeasure_like.length; s++) {
        var column_name = queryResponse.fields.supermeasure_like[s].name
        this.measures.push(column_name)

        var column = new Column(column_name)
        var levels = [column_name]
        for (var p = 0; p < queryResponse.fields.pivots.length-1; p++) { levels.push('') }
        column.levels = levels
        column.field = queryResponse.fields.supermeasure_like[s]
        column.type = 'measure'
        column.pivoted = false
        column.super = true
        this.columns.push(column)
      }
    }

    // BUILD ROWS
    //
    for (var i = 0; i < lookerData.length; i++) {
      var row = new Row('line_item')
      
      for (var c = 0; c < this.columns.length; c++) {
        var column = this.columns[c]
        if (column.pivoted) {
          row.data[column.id] = lookerData[i][column.measure_name][column.pivot_key]
        } else {
          row.data[column.id] = lookerData[i][column.id]
        }
      }

      // Set Row Id
      var all_dims = []
      for (var d = 0; d < this.dimensions.length; d++) {
        all_dims.push(lookerData[i][this.dimensions[d]].value)
      }
      row.id = all_dims.join('|')

      // Set Index Dimension value (note: this is the index for display purposes, while row.id is the unique reference)
      var last_dim = this.dimensions[this.dimensions.length - 1]
      var last_dim_value = lookerData[i][last_dim].value
      row.data['$$$_index_$$$'] = { 'value': last_dim_value, 'cell_style': 'indent' }

      row.sort = [0, 0, i]
      this.data.push(row)
    }
  
    // BUILD TOTALS
    if (typeof queryResponse.totals_data !== 'undefined') {
      // var parser = new DOMParser()
      var totals_ = queryResponse.totals_data
      var totals_row = new Row('total')

      for (var c = 0; c < this.columns.length; c++) {
        var column = this.columns[c]
        totals_row.data[column.id] = { 'value': '' } // set a default on all columns

        if (column.id == this.dimensions[this.dimensions.length-1]) {
          totals_row.data[column.id] = { 'value': 'TOTAL', 'cell_style': 'total' }
        } 

        if (column.type == 'measure') {
          if (column.pivoted == true) {
            var cellKey = [column.pivot_key, column.measure_name].join('.')
            var cellValue = totals_[column.measure_name][column.pivot_key]
            cellValue.cell_style = 'total'
            if (typeof cellValue.rendered == 'undefined' && typeof cellValue.html !== 'undefined' ){
              cellValue.rendered = this.getRenderedFromHtml(cellValue)
            }
            totals_row.data[cellKey] = cellValue
          } else {
            totals_row.data[column.id] == totals_[column.id]
          }            
          totals_row.data[column.id].cell_style = 'total'
        }
      } 
      totals_row.sort = [1, 0, 0]
      totals_row.data['$$$_index_$$$'] = { 'value': 'TOTAL', cell_style: 'total' }

      this.data.push(totals_row)
      this.has_totals = true
    }

    // BUILD ROW SPANS
    this.updateRowSpanValues()
 
  }

  updateRowSpanValues () {
    var span_tracker = {}
    // loop backwards through data rows
    for (var r = this.data.length-1; r >= 0 ; r--) {
      var row = this.data[r]

      // full reset and continue for totals
      if (row.type !== 'line_item' ) {
        for (d = 0; d < this.dimensions.length; d++) {
          span_tracker[this.dimensions[d]] = 1
        }
        continue;
      }

      // loop fowards through the dimensions
      this.rowspan_values[row.id] = {}
      for (var d = 0; d < this.dimensions.length; d++) {
        var dim = this.dimensions[d]

        var this_cell_value = this.data[r].data[dim].value
        if (r > 0) {
          var cell_above_value = this.data[r-1].data[dim].value
        }

        // increment the span_tracker if dimensions match
        if (r > 0 && this_cell_value == cell_above_value) {
          this.rowspan_values[row.id][this.dimensions[d]] = -1;
          span_tracker[dim] += 1;
        } else {
        // partial reset and continue if dimensions different
          for (var d_ = d; d_ < this.dimensions.length; d_++) {
            var dim_ = this.dimensions[d_]
            this.rowspan_values[row.id][dim_] = span_tracker[dim_];
            span_tracker[dim_] = 1
          }
          break;
        }
      }
    }
  }

  sortData () {
    var compare_sort_values = (a, b) => {
      for(var i=0; i<3; i++) {
          if (a.sort[i] > b.sort[i]) { return 1 }
          if (a.sort[i] < b.sort[i]) { return -1 }
      }
      return -1
    }
    this.data.sort(compare_sort_values)
    this.updateRowSpanValues()
  }

  addSubTotals (depth) { 
    if (typeof depth === 'undefined') { depth = this.dimensions.length - 1 }

    // BUILD GROUPINGS / SORT VALUES
    var subTotals = []
    var latest_grouping = []
    for (var r = 0; r < this.data.length; r++) {    
      var row = this.data[r]
      if (row.type !== 'total') {
        var grouping = []
        for (var g = 0; g < depth; g++) {
          var dim = this.dimensions[g]
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

      for (var d = 0; d < this.columns.length; d++) {
        var column = this.columns[d]
        subtotal.data[column.id] = '' // set default

        if (this.columns[d].id === '$$$_index_$$$' || d === this.dimensions.length ) {
          var subtotal_label = subTotals[s].join(' | ')
          subtotal.data[this.columns[d]['id']] = {'value':  subtotal_label, 'cell_style': 'total'}
        } 

        if (column.type == 'measure') {
          var subtotal_value = 0
          if (column.pivoted) {
            var cellKey = [column.pivot_key, column.measure_name].join('.') 
          } else {
            var cellKey = column.id
          }
          for (var mr = 0; mr < this.data.length; mr++) {
            var data_row = this.data[mr]
            if (data_row.type == 'line_item' && data_row.sort[1] == s) {
              subtotal_value += data_row.data[cellKey].value
            } 
          }
          var cellValue = {'value': formatter(subtotal_value), 'cell_style': 'total'}
          subtotal.data[cellKey] = cellValue
        }
      }
      subtotal.sort = [0, s, 9999]
      this.data.push(subtotal)
    }
    this.sortData()
    this.has_subtotals = true
  }

  getRenderedFromHtml (cellValue) {
    var parser = new DOMParser()
    // console.log('cell to renderFromHtml', cellValue)
    if (cellValue.html !== '') {
      var rendered = parser.parseFromString(cellValue.html, 'text/html')
      rendered = rendered.getElementsByTagName('a')[0].innerText
    } else {
      var rendered = cellValue.value
    }

    return rendered
  }

  getLevels () {
    var levels = [0]
    for (var p=0; p<this.number_of_pivots; p++) { levels.push(p) } 
    return levels
  }

  // getColSpans (headers, field_at_top=true) {
  getColSpans (headers) {
    // build single array of the header values
    // use column id for the first level
    var header_levels = []
    var span_values = []
    var span_tracker = []

    for (var h = headers.length-1; h >= 0; h--) {
      // if (field_at_top) {
      //   header_levels.push(headers[h].levels.concat([headers[h].field.name])) 
      // } else {
      //   header_levels.push([headers[h].field.name].concat(headers[h].levels))  
      // }
      header_levels[headers.length-1 - h] = headers[h].levels.concat([headers[h].field.name])
      span_values[h] = []
      for (var l = 0; l < header_levels[headers.length-1 - h].length; l++) {
        span_values[h].push(1) // set defaults
      }
    }
    console.log('header levels (reverse)', header_levels)

    // init tracker
    for (var l = 0; l < header_levels[0].length; l++) {
      span_tracker.push(1)
    }
    console.log('init tracker', span_tracker)

    // loop through the headers
    for (var h = 0; h < header_levels.length; h++) {
      var header = header_levels[h]
      console.log('Processing header', h, header)
      
      // loop through the levels for the pivot headers
      // if (field_at top) {}
      var start = 0
      var end = header.length - 1

      for (var l = start; l < end; l++) {
        console.log('...level', l)
        var this_value = header_levels[h][l]
        console.log('......h, header length', h, header_levels[h].length-1)
        if (h < header_levels.length-1) {
          console.log('......new above_value')
          var above_value = header_levels[h+1][l]
        }
        console.log('......comparing', h, l, 'to', h+1, l, ':', this_value, above_value)

        // increment the tracker if values match
        if (h < header_levels.length-1 && this_value == above_value) {
          console.log('......MATCH – INCREMENT, going to next level for this header')
          span_values[h][l] = -1;
          span_tracker[l] += 1;
        } else {
        // partial reset if the value differs
          for (var l_ = l; l_ < end; l_++) {
            console.log('......DIFFERS – PARTIAL RESET')
            span_values[h][l_] = span_tracker[l_];
            span_tracker[l_] = 1
          }
          console.log('.........span_values', h, span_values[h])
          break;
        }
        console.log('.........span_values', h, span_values[h])
      }

    }

    // loop backwards through the levels for the column labels
    var label_level = 2
    for (var l = 0; l < header_levels[0].length; l++) {
      span_tracker.push(1) // reset to default
    }

    for (var h = header_levels.length-1; h >= 0; h--) {
      var this_value = header_levels[h][label_level]
      if (h > 0) {
        var next_value =header_levels[h-1][label_level] 
      }
      // increment the span_tracker if dimensions match
      if (h > 0 && this_value == next_value) {
        span_values[h][label_level] = -1;
        span_tracker[label_level] += 1;
      } else {
      // partial reset and continue if dimensions different
        span_values[h][label_level] = span_tracker[label_level];
        span_tracker[label_level] = 1
      }
    }

    span_values.reverse()

    for (var h = 0; h < headers.length; h++) {
      headers[h].colspans = span_values[h]
    }
    console.log('colspans', span_values)
    return headers
  }

  getHeaders (i, index_column=false, span_cols=true) {
    if (index_column) {
      var headers = this.columns.filter(c => c.field.measure || c.id == '$$$_index_$$$')
    } else {
      var headers =  this.columns.filter(c => c.id !== '$$$_index_$$$')
    }

    if (span_cols) {
      headers = this.getColSpans(headers).filter(c => c.colspans[i] > 0)
    }
    console.log('getHeaders ->', headers)
    return headers
  }

  // ADD getRow(index_column=false, span_rows=true) function
  getRow (row, index_column=false, span_rows=true) {
    // filter out unwanted dimensions based on index_column setting
    if (index_column) {
      var cells = this.columns.filter(c => c.field.measure || c.id == '$$$_index_$$$')
    } else {
      var cells =  this.columns.filter(c => c.id !== '$$$_index_$$$')
    }

    if (!index_column && span_rows) {
    // set row spans
      for (var cell = 0; cell < cells.length; cell++) {
        cells[cell].rowspan = 1 // set default
        if (row.type === 'line_item' && this.rowspan_values[row.id][cells[cell].id] > 0) {
          cells[cell].rowspan = this.rowspan_values[row.id][cells[cell].id]
        } 
      }

      // filter out 'hidden' cells
      if (row.type === 'line_item') {
        cells = cells.filter(c => c.type == 'measure' || this.rowspan_values[row.id][c.id] > 0)
      }
    }

    console.log('getRow ->', cells)
    return cells
  }

  getSimpleJson() {
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
  },
  spanRows: {
    section: "Subtotals",
    type: "boolean",
    label: "Span Rows",
    // display_size: 'third',
    default: "true",
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

const buildReportTable = function(lookerData, use_index_column=false, span_rows=true) {

  var table = d3.select('#visContainer')
    .append('table')
    .attr("class", "reportTable");

  table.append('thead')
    .selectAll('tr')
    .data(lookerData.getLevels()).enter()
    .append('tr')
    .selectAll('th')
    .data(function(level, i) { 
      return lookerData.getHeaders(i, use_index_column, true).map(function(column) {
        var header = {
          'text': '',
          'colspan': column.colspans[i]
        }
        if (i < column.levels.length && column.pivoted) {
          header.text = column.levels[i]
        } else if (i === column.levels.length) {
          header.text = column.field.label_short || column.field.label
        } else {
          header.text = ''
        }
        return header
      })
    }).enter()
    .append('th')
    .text(d => d.text)
    .attr('colspan', d => d.colspan);
  
  var align = 'right'
  // create table body
  table.append('tbody')
    .selectAll('tr')
    .data(lookerData.data).enter()
    .append('tr')
    .selectAll('td')
    .data(function(row) {  
      return lookerData.getRow(row, use_index_column, span_rows).map(function(column) {
        var cell = row.data[column.id]
        cell.rowspan = column.rowspan
        cell.align = column.field.aligns
        return cell;
      })
    }).enter()
    .append('td')
      .text(d => d.rendered || d.value) 
      .attr("rowspan", d => d.rowspan)
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
    buildReportTable(lookerData, config.indexColumn, config.spanRows);
    
    done();
  }
})
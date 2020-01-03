/* Dependency: https://cdnjs.cloudflare.com/ajax/libs/d3/5.15.0/d3.min.js */

debug = false;

const formatter = d3.format(",.2f")

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
    this.levels = []
    this.field = {}
  }
}

class LookerData {
  constructor(lookerData, queryResponse) {
    this.columns = []
    this.data = []

    this.alt_columns = []
    this.alt_data = []

    this.dims = queryResponse.fields.dimension_like
    this.meas = queryResponse.fields.measure_like
    this.supers = []
    this.pivots = []
    this.number_of_dimensions = this.dims.length
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
      this.supers = queryResponse.fields.supermeasure_like
      this.has_supers = true
    }

    // ALT COLUMN ARRAY ///////////////////////////////////////////////////
    var alt_index_column = new Column('$$$_index_$$$')
    alt_index_column.align = 'left'
    var alt_index_levels = ['$$$_index_$$$']
    for (var p = 0; p < queryResponse.fields.pivots.length-1; p++) { alt_index_levels.push('') }
    alt_index_column.levels = index_levels
    this.alt_columns.push(alt_index_column)

    this.dimensions = []
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
      this.alt_columns.push(column)
    }

    this.measures = []
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
            this.alt_columns.push(column)
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
        this.alt_columns.push(column)
      }
    }
    
    // this.supermeasures = []
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      for (var s = 0; s < queryResponse.fields.supermeasure_like.length; s++) {
        var column_name = queryResponse.fields.supermeasure_like[s].name
        this.measures.push(column_name)
      // }
      // for (var s = 0; s < this.supermeasures.length; s++) {
        var column = new Column(column_name)
        var levels = [column_name]
        for (var p = 0; p < queryResponse.fields.pivots.length-1; p++) { levels.push('') }
        column.levels = levels
        column.field = queryResponse.fields.supermeasure_like[s]
        column.type = 'measure'
        column.pivoted = false
        column.super = true
        this.alt_columns.push(column)
      }
    }


    // BUILD COLUMNS //////////////////////////////////////////////////////
    //
    var index_column = new Column('$$$_index_$$$')
    index_column.align = 'left'
    var index_levels = ['$$$_index_$$$']
    for (var p = 0; p < queryResponse.fields.pivots.length-1; p++) { index_levels.push('') }
    index_column.levels = index_levels
    this.columns.push(index_column)
    
    for (var d = 0; d < this.dims.length; d++) {
      var column = new Column(this.dims[d].name)
      var levels = [this.dims[d].name]
      for (var p = 0; p < queryResponse.fields.pivots.length-1; p++) { levels.push('') }
      column.levels = levels
      column.field = this.dims[d]
      this.columns.push(column)
    }
    if (this.has_pivots) {
      for (var p = 0; p < this.pivots.length; p++) {
        for (var m = 0; m < this.meas.length; m++) {
          if (typeof this.meas[m].is_table_calculation === 'undefined') {
            var pivotKey = this.pivots[p]['key']
            var measureName = this.meas[m]['name']
            var columnId = pivotKey + '.' + measureName
            var levels = []
            for (var pf = 0; pf < queryResponse.fields.pivots.length; pf++) { 
              var pf_name = queryResponse.fields.pivots[pf].name
              levels.push(this.pivots[p]['data'][pf_name]) 
            }
            var column = new Column(columnId)
            column.levels = levels
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
        var levels = [this.supers[s].name]
        for (var p = 0; p < queryResponse.fields.pivots.length-1; p++) { levels.push('') }
        column.levels = levels
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

    // ALT BUILD ROWS
    //
    for (var i = 0; i < lookerData.length; i++) {
      var row = new Row('line_item')

      var last_dim = this.dimensions[this.dimensions.length - 1]
      var last_dim_value = lookerData[i][last_dim].value
      row.data['$$$_index_$$$'] = { 'value': last_dim_value, 'cell_style': 'indent' }
      
      for (var c = 0; c < this.alt_columns.length; c++) {
        var column = this.alt_columns[c]
        if (column.pivoted) {
          row.data[column.id] = lookerData[i][column.measure_name][column.pivot_key]
        } else {
          row.data[column.id] = lookerData[i][column.id]
        }
      }

      row.sort = [0, 0, i]
      this.alt_data.push(row)
    }
  
    // TOTALS ROW
    if (typeof queryResponse.totals_data !== 'undefined') {
      var parser = new DOMParser()
      var totals_ = queryResponse.totals_data
      var row = new Row('total')

      if (this.has_pivots) {  
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
      row.data['$$$_index_$$$'] = { 'value': 'TOTAL', cell_style: 'total' }
      this.data.push(row)
      this.has_totals = true
    }

    // ALT BUILD TOTALS
    if (typeof queryResponse.totals_data !== 'undefined') {
      var parser = new DOMParser()
      var totals_ = queryResponse.totals_data
      var totals_row = new Row('total')

      for (var c = 0; c < this.alt_columns.length; c++) {
        var column = this.alt_columns[c]
        totals_row.data[column.id] = { 'value': '' } // set a default on all columns

        if (column.id == this.dimensions[this.dimensions.length-1]) {
          totals_row.data[column.id] = { 'value': 'TOTAL', 'cell_style': 'total' }
        } 

        if (column.type == 'measure') {
          if (column.pivoted == true) {
            var cellValue = totals_[column.measure_name][column.pivot_key]
            cellValue.cell_style = 'total'
            if (typeof 
              cellValue.rendered == 'undefined' 
              && typeof cellValue.html !== 'undefined'
              && cellValue.html != ''
            ){
              var rendered = parser.parseFromString(cellValue.html, 'text/html')
              cellValue.rendered = rendered.getElementsByTagName('a')[0].innerText
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
      this.alt_data.push(row)
      this.has_totals = true
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
        if (this.columns[d].id === '$$$_index_$$$' || d === this.dims.length ) {
          var subtotal_label = subTotals[s].join(' | ') // [subTotals[s].length-1]
          subtotal.data[this.columns[d]['id']] = {'value':  subtotal_label, 'cell_style': 'total'}
        } else {
          subtotal.data[this.columns[d]['id']] = ''
        }
      }

      // MEASURES
      if (this.has_pivots) { // Pivoted measures, skipping table_calculations for row totals
        for (var p = 0; p < this.pivots.length; p++) {
          for (var m = 0; m < this.meas.length; m++) {
            if (!this.pivots[p].is_total || typeof this.meas[m].is_table_calculation  == 'undefined') {
              var pivotKey = this.pivots[p]['key']
              var measureName = this.meas[m]['name']
              var cellKey = pivotKey + '.' + measureName
              var subtotal_value = 0
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
        }
      } else {
        for (var m = 0; m < this.meas.length; m++) {
          var mea = this.meas[m].name
          var subtotal_value = 0
          for (var mr = 0; mr < this.data.length; mr++) {
            var data_row = this.data[mr]
            if (data_row.type == 'line_item' && data_row.sort[1] == s) {
              subtotal_value += data_row.data[mea].value
            } 
          }
          subtotal.data[mea] = {'value': formatter(subtotal_value), 'cell_style': 'total'}
        }
      }

      // SUPERMEASURES
      if (this.has_supers) {
        for (var sm = 0; sm < this.supers.length; sm++) {
          var super_ = this.supers[sm].name
          var subtotal_value = 0
          for (var mr = 0; mr < this.data.length; mr++) {
            var data_row = this.data[mr]
            if (data_row.type == 'line_item' && data_row.sort[1] == s) {
              subtotal_value += data_row.data[super_].value
            } 
          }
          subtotal.data[super_] = {'value': formatter(subtotal_value), 'cell_style': 'total'}
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
    this.has_subtotals = true

    // ALT BUILD GROUPINGS / SORT VALUES
    var alt_subTotals = []
    var alt_latest_grouping = []
    for (var r = 0; r < this.alt_data.length; r++) {    
      var row = this.alt_data[r]
      if (row.type !== 'total') {
        var grouping = []
        for (var g = 0; g < depth; g++) {
          var dim = this.dimensions[g]
          grouping.push(row.data[dim].value)
        }
        if (grouping.join('|') !== alt_latest_grouping.join('|')) {
          alt_subTotals.push(grouping)
          alt_latest_grouping = grouping
        }
        row.sort = [0, alt_subTotals.length-1, r]
      }
    }

    // ALT GENERATE DATA ROWS FOR SUBTOTALS
    for (var s = 0; s < alt_subTotals.length; s++) {
      var subtotal = new Row('subtotal')

      for (var d = 0; d < this.alt_columns.length; d++) {
        var column = this.alt_columns[d]
        subtotal.data[column.id] = '' // set default

        if (this.alt_columns[d].id === '$$$_index_$$$' || d === this.dimensions.length ) {
          var subtotal_label = alt_subTotals[s].join(' | ')
          subtotal.data[this.alt_columns[d]['id']] = {'value':  subtotal_label, 'cell_style': 'total'}
        } 

        if (column.type == 'measure') {
          var subtotal_value = 0
          if (column.pivoted) {
            cellKey = [column.pivot_key, column.measure_name].join('.') 
          } else {
            cellKey = column.id
          }
          for (var mr = 0; mr < this.alt_data.length; mr++) {
            var data_row = this.alt_data[mr]
            if (data_row.type == 'line_item' && data_row.sort[1] == s) {
              subtotal_value += data_row.data[cellKey].value
            } 
          }
          var cellValue = {'value': formatter(subtotal_value), 'cell_style': 'total'}
          subtotal.data[cellKey] = cellValue
        }
      }
      subtotal.sort = [0, s, 9999]
      this.alt_data.push(subtotal)
    }
    var compare_sort_values = (a, b) => {
      for(var i=0; i<3; i++) {
          if (a.sort[i] > b.sort[i]) { return 1 }
          if (a.sort[i] < b.sort[i]) { return -1 }
      }
      return -1
    }
    this.alt_data.sort(compare_sort_values)
    this.has_subtotals = true
  }

  getLevels () {
    var levels = []
    if (this.has_pivots) {
      for (var p=0; p<this.number_of_pivots; p++) { 
        var level = {}
        for (var c=0; c<this.alt_columns.length; c++) {
          var column = Object.assign({}, this.alt_columns[c])
          column.level = p
          if (column.field.category == 'measure') {
            column.label = column.levels[p]
          } else {
            column.label = ''
          }
          level[column.id] = column
        }
        levels.push(level)
      }
      var level = {}
      for (var c=0; c<this.alt_columns.length; c++) {
        var column = Object.assign({}, this.alt_columns[c])
        column.level = this.number_of_pivots
        column.label = column.field.label_short || column.field.label
        level[column.id] = column
      }
      levels.push(level)
    } else {
      var level = {}
      for (var c=0; c<this.alt_columns.length; c++) {
        var column = Object.assign({}, this.alt_columns[c])
        column.level = 0
        column.label = column.field.label_short || column.field.label
        level[column.id] = column
      }
      levels.push(level)
    }
    console.log('levels in getLevels', levels)
    return levels
  }

  getHeaders (index_column=false) {
    if (index_column) {
      return this.alt_columns.filter(c => c.field.measure || c.id == '$$$_index_$$$')
    } else {
      return this.alt_columns.filter(c => c.id !== '$$$_index_$$$')
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

const buildReportTable = function(lookerData, use_index_column=false) {

  var table = d3.select('#visContainer')
    .append('table')
    .attr("class", "reportTable");

  table.append('thead')
    .selectAll('tr')
    .data(lookerData.getLevels()).enter()
    .append('tr')
    .selectAll('th')
    .data(function(level, i) {
      return lookerData.getHeaders(use_index_column).map(function(column) {
        var header_cell = level[column.id]
        return header_cell
      })
    }).enter()
    .append('th')
    .text(d => d.label);
  
  var align = 'right'
  // create table body
  table.append('tbody')
    .selectAll('tr')
    .data(lookerData.data).enter()
    .append('tr')
    .selectAll('td')
    .data(function(row) {
      return lookerData.getHeaders(use_index_column).map(function(column) {
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
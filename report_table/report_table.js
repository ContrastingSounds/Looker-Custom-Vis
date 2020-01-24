/* Dependency: https://cdnjs.cloudflare.com/ajax/libs/d3/5.15.0/d3.min.js */

const formatter = d3.format(",.2f")

const newArray = function(length, value) {
  var arr = []
  for (var l = 0; l < length; l++) {
    arr.push(value)
  }
  return arr
}

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
    this.label = '' // queryResponse.fields.measures[n].label_short
    this.view = '' // queryResponse.fields.measures[n].view_label
    this.levels = []
    this.field = {} // Looker field definition
    this.field_name = ''
    this.type = '' // dimension | measure
    this.pivoted = false
    this.super = false
    this.pivot_key = '' // queryResponse.pivots[n].key
    this.align = '' // left | center | right

    this.sort_by_measure_values = []
    this.sort_by_pivot_values = []
  }

  getLabel (label_with_view=false, label_with_pivots=false) {
    var label = this.label
    if (label_with_view) { 
      label = [this.view, label].join(' ') 
    }
    if (label_with_pivots) {
      var pivots = this.levels.join(' ')
      label = [label, pivots].join(' ') 
    }
    return label
  }
}

class LookerData {
  constructor(lookerData, queryResponse, config) {
    this.columns = []
    this.dimensions = []
    this.measures = []
    this.data = []
    this.pivot_fields = []
    this.pivot_values = []

    this.rowspan_values = {}

    this.useIndexColumn = config.indexColumn || false
    this.addRowSubtotals = config.rowSubtotals || false
    this.addSubtotalDepth = config.subtotalDepth || this.dimensions.length - 1
    this.spanRows = false || config.spanRows
    this.spanCols = false || config.spanCols
    this.sortColsBy = config.sortColumnsBy || 'sort_by_pivot_values'

    this.has_totals = false
    this.has_subtotals = false
    this.has_pivots = false
    this.has_supers = false

    // CHECK FOR PIVOTS AND SUPERMEASURES
    for (var p = 0; p < queryResponse.fields.pivots.length; p++) { 
      var name = queryResponse.fields.pivots[p].name
      this.pivot_fields.push(name) 
    }

    if (typeof queryResponse.pivots !== 'undefined') {
      this.pivot_values = queryResponse.pivots
      this.has_pivots = true
    }

    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      this.has_supers = true
    }

    // BUILD INDEX COLUMN 
    var index_column = new Column('$$$_index_$$$')
    index_column.align = 'left'
    index_column.levels = newArray(queryResponse.fields.pivots.length, '')
    index_column.sort_by_measure_values = [-1, 0, ...newArray(this.pivot_fields.length, 0)]
    index_column.sort_by_pivot_values = [-1, ...newArray(this.pivot_fields.length, 0), 0]

    this.columns.push(index_column)

    // index all original columns to preserve order later
    var col_idx = 0

    // add dimensions, list of ids, list of full objects
    for (var d = 0; d < queryResponse.fields.dimension_like.length; d++) {
      var column_name = queryResponse.fields.dimension_like[d].name
      this.dimensions.push(column_name) // simple list of dimension ids

      var column = new Column(column_name) // TODO: consider creating the column object once all required field values identified
      column.levels = newArray(queryResponse.fields.pivots.length, '') // populate empty levels when pivoted
      column.field = queryResponse.fields.dimension_like[d]
      column.field_name = column.field.name
      column.label = column.field.label_short || column.field.label
      column.view = column.field.view_label
      column.type = 'dimension'
      column.pivoted = false
      column.super = false
      column.sort_by_measure_values = [0, col_idx, ...newArray(this.pivot_fields.length, 0)]
      column.sort_by_pivot_values = [0, ...newArray(this.pivot_fields.length, 0), col_idx]

      this.columns.push(column)
      col_idx += 1
    }

    // add measures, list of ids
    for (var m = 0; m < queryResponse.fields.measure_like.length; m++) {
      this.measures.push({
        name: queryResponse.fields.measure_like[m].name,
        label: queryResponse.fields.measure_like[m].label_short || queryResponse.fields.measure_like[m].label,
        view: queryResponse.fields.measure_like[m].view_label || '',
        is_table_calculation: typeof queryResponse.fields.measure_like[m].is_table_calculation !== 'undefined',
        can_pivot: true
      }) 
    }

    // add measures, list of full objects
    if (this.has_pivots) {
      for (var p = 0; p < this.pivot_values.length; p++) {
        for (var m = 0; m < this.measures.length; m++) {
          var include_measure = (                                     // for pivoted measures, skip table calcs for row totals
            this.pivot_values[p]['key'] != '$$$_row_total_$$$'        // if user wants a row total for table calc, must define separately
          ) || (
            this.pivot_values[p]['key'] == '$$$_row_total_$$$' 
            && this.measures[m].is_table_calculation == false
          )

          if (include_measure) {
            var pivotKey = this.pivot_values[p]['key']
            var measureName = this.measures[m].name
            var columnId = pivotKey + '.' + measureName

            var levels = [] // will contain a list of all the pivot values for this column
            var level_sort_values = []
            for (var pf = 0; pf < queryResponse.fields.pivots.length; pf++) { 
              var pf_name = queryResponse.fields.pivots[pf].name
              levels.push(this.pivot_values[p]['data'][pf_name])
              level_sort_values.push(this.pivot_values[p]['sort_values'][pf_name]) 
            }

            var column = new Column(columnId)
            column.levels = levels
            column.field = queryResponse.fields.measure_like[m]
            column.label = column.field.label_short || column.field.label
            column.view = column.field.view_label
            column.type = 'measure'
            column.pivoted = true
            column.super = false
            column.pivot_key = pivotKey
            column.field_name = measureName

            if (this.pivot_values[p]['key'] !== '$$$_row_total_$$$') {
              column.sort_by_measure_values = [1, m, ...level_sort_values]
              column.sort_by_pivot_values = [1, ...level_sort_values, col_idx]
            } else {
              column.sort_by_measure_values = [2, m, ...newArray(this.pivot_fields.length, 0)]
              column.sort_by_pivot_values = [2, ...newArray(this.pivot_fields.length, 0), col_idx]
            }

            this.columns.push(column)
            col_idx += 1
          }
        }
      }
    } else {
      // noticeably simpler for flat tables!
      for (var m = 0; m < this.measures.length; m++) {
        var column = new Column(this.measures[m].name)
        column.field = queryResponse.fields.measure_like[m]
        column.label = column.field.label_short || column.field.label
        column.view = column.field.view_label
        column.type = 'measure'
        column.pivoted = false
        column.super = false
        column.sort_by_measure_values = [1, col_idx]
        column.sort_by_pivot_values = [1, col_idx]
        this.columns.push(column)
        col_idx += 1
      }
    }
    
    // add supermeasures, if present
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      for (var s = 0; s < queryResponse.fields.supermeasure_like.length; s++) {
        var column_name = queryResponse.fields.supermeasure_like[s].name
        this.measures.push({
          name: queryResponse.fields.supermeasure_like[s].name,
          label: queryResponse.fields.supermeasure_like[s].label,
          view: '',
          can_pivot: false
        }) 

        var column = new Column(column_name)
        column.levels = newArray(queryResponse.fields.pivots.length, '')
        column.field = queryResponse.fields.supermeasure_like[s]
        column.label = column.field.label_short || column.field.label
        column.view = column.field.view_label
        column.type = 'measure'
        column.pivoted = false
        column.super = true
        column.sort_by_measure_values = [2, col_idx, ...newArray(this.pivot_fields.length, 1)]
        column.sort_by_pivot_values = [2, ...newArray(this.pivot_fields.length, 1), col_idx]
        this.columns.push(column)
        col_idx += 1
      }
    }

    // BUILD ROWS
    for (var i = 0; i < lookerData.length; i++) {
      var row = new Row('line_item') // TODO: consider creating the row object once all required field values identified
      
      // flatten data, if pivoted. Looker's data structure is nested for pivots (to a single level, no matter how many pivots)
      for (var c = 0; c < this.columns.length; c++) {
        var column = this.columns[c]
        if (column.pivoted) {
          row.data[column.id] = lookerData[i][column.field_name][column.pivot_key]
        } else {
          row.data[column.id] = lookerData[i][column.id]
        }
      }

      // set a unique id for the row
      var all_dims = []
      for (var d = 0; d < this.dimensions.length; d++) {
        all_dims.push(lookerData[i][this.dimensions[d]].value)
      }
      row.id = all_dims.join('|')

      // set an index value (note: this is an index purely for display purposes; row.id remains the unique reference value)
      var last_dim = this.dimensions[this.dimensions.length - 1]
      var last_dim_value = lookerData[i][last_dim].value
      row.data['$$$_index_$$$'] = { 'value': last_dim_value, 'cell_style': 'indent' }

      row.sort = [0, 0, i]
      this.data.push(row)
    }
  
    // BUILD TOTALS
    if (typeof queryResponse.totals_data !== 'undefined') {
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
            var cellKey = [column.pivot_key, column.field_name].join('.')
            var cellValue = totals_[column.field_name][column.pivot_key]
            cellValue.cell_style = 'total'
            if (typeof cellValue.rendered == 'undefined' && typeof cellValue.html !== 'undefined' ){ // totals data may include html but not rendered value
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

    if (config.rowSubtotals) {
      this.addSubTotals(config.subtotalDepth)
    }
    if (config.colSubtotals) {
      this.addColumnSubTotals()
    }
    this.sortColumns()
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
    var compareRowSortValues = (a, b) => {
      var depth = a.sort.length
      for(var i=0; i<depth; i++) {
          if (a.sort[i] > b.sort[i]) { return 1 }
          if (a.sort[i] < b.sort[i]) { return -1 }
      }
      return -1
    }
    this.data.sort(compareRowSortValues)
    this.updateRowSpanValues()
  }

  sortColumns () {
    var compareColSortValues = (a, b) => {
      var param = this.sortColsBy
      var depth = a[param].length
      for(var i=0; i<depth; i++) {
          if (a[param][i] > b[param][i]) { return 1 }
          if (a[param][i] < b[param][i]) { return -1 }
      }
      return -1
    }
    this.columns.sort(compareColSortValues)
  }

  addSubTotals () { 
    var depth = this.addSubtotalDepth

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
            var cellKey = [column.pivot_key, column.field_name].join('.') 
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

  addColumnSubTotals () {
    // https://pebl.dev.looker.com/explore/pebl/trans?qid=Vm6kceDf5Xv51y3VugI71G&origin_space=6&toggle=pik,vis
    var labels_at_bottom = true

    var getPivotKey = function(components, labels_at_bottom) {
      // console.log('getPivotKey() called with', components, labels_at_bottom)
      if (labels_at_bottom) {
          var key = components[0]
      } else {
          var key = components.join('.')
      }
      return key
    }

    var this_pivot_key = ''
    var last_pivot_key = ''
    var last_pivot_col = {}
    var subtotals = []

    var pivots = []
    var pivot_dimension = this.pivot_fields[0]
    for (var p = 0; p < this.pivot_values.length; p++) {
      var p_value = this.pivot_values[p]['data'][pivot_dimension]
      if (p_value !== null) { pivots.push(p_value) }
    }
    pivots = [...new Set(pivots)]
    // console.log('addColumnSubTotals pivots', pivots)

    var sub_idx = 0

    for (var p = 0; p < pivots.length; p++) {
      var pivot = pivots[p]
      var highest_pivot_col = [0, '']
      var previous_subtotal = null

      // console.log('Processing pivot', pivot)

      for (var m = 0; m < this.measures.length; m++) {
        if (this.measures[m].can_pivot) {
          var measure = this.measures[m].name
          // console.log('...measure', measure)
          var this_pivot_key = getPivotKey([pivot, measure], labels_at_bottom)
          // console.log('...pivot key', this_pivot_key)
          var subtotal_col = {
            field: measure,
            label: this.measures[m].label,
            view: this.measures[m].view,
            pivot: pivot,
            measure_idx: m,
            pivot_idx: p,
            columns: [],
            id: ['$$$_subtotal_$$$', pivot, measure].join('.'),
            after: ''
          }
          // console.log('...subtotal_col init', subtotal_col)
  
          for (var c = 0; c < this.columns.length; c++) {
            var column = this.columns[c]
  
            // console.log('...column', column.id)
  
            if (column.pivoted && column.levels[0] == pivot) {
              if (column.field_name == measure) {
                // console.log('......pivoted, pivot, measure', column.pivoted, column.levels[0], column.field_name)
                // console.log('......VALID COLUMN')
                subtotal_col.columns.push(column.id)
              }
              if (getPivotKey([column.levels[0], column.field_name], labels_at_bottom) == this_pivot_key) {
                // console.log('......this_pivot_key', this_pivot_key)
                // console.log('......VALID PIVOT KEY')
                if (c > highest_pivot_col[0]) {
                  // console.log('......current highest_pivot_col', highest_pivot_col)
                  // console.log('......UPDATE highest_pivot_col')
                  highest_pivot_col = [c, column.id]
                }
              }
            }
          }
  
          if (this_pivot_key != last_pivot_key) {
            // console.log('......this_pivot_key, last_pivot_key', this_pivot_key, last_pivot_key)
            // console.log('......UPDATE last_pivot_col')
            last_pivot_col[this_pivot_key] = highest_pivot_col[1]
            previous_subtotal = null
          }
  
          subtotal_col.after = previous_subtotal || last_pivot_col[this_pivot_key]
          // console.log('......AFTER', subtotal_col.after)
          last_pivot_key = this_pivot_key
          previous_subtotal = subtotal_col.id
          subtotals.push(subtotal_col)
          sub_idx += 1
        }
      }
    }

    // UPDATE THIS.COLUMNS WITH NEW SUBTOTAL COLUMNS
    for (var s = 0; s < subtotals.length; s++) {
      var subtotal = subtotals[s]
      var column = new Column(subtotal.id)

      column.levels = [subtotal.pivot, 'Subtotal'] //, subtotal.field]
      column.label = subtotal.label
      column.view = subtotal.view || ''
      column.field = { name: subtotal.field } // Looker field definition. Name only, to calc colspans
      column.type = 'measure' // dimension | measure
      column.sort_by_measure_values = [1, subtotal.measure_idx, ...column.levels]

      var pivot_values = [...column.levels]
      if (typeof pivot_values[pivot_values.length-1] == 'string') {
        pivot_values[pivot_values.length-1] = 'ZZZZ'
      } else {
        pivot_values[pivot_values.length-1] = 9999
      }
      column.sort_by_pivot_values = [1, ...pivot_values, 10000 + s]
      column.pivoted = true
      column.subtotal = true
      column.pivot_key = [subtotal.pivot, '$$$_subtotal_$$$'].join('|')
      column.field_name = subtotal.field
      column.align = 'center' // left | center | right

      this.columns.push(column)
    }
    this.sortColumns()

    console.log('updated this.columns', this.columns)

    // CALCULATE COLUMN SUB TOTALS
    for  (var r = 0; r < this.data.length; r++) {
      var row = this.data[r]
      for (var s = 0; s < subtotals.length; s++) {
        var subtotal = subtotals[s]
        var subtotal_value = 0
        for (var f = 0; f < subtotal.columns.length; f++) {
          var field = subtotal.columns[f]
          subtotal_value += row.data[field].value
        }
        row.data[subtotal.id] = {
          value: subtotal_value,
          rendered: formatter(subtotal_value),
          align: 'right'
        }
        if (row.type == 'total') { row.data[subtotal.id].cell_style = 'total' }
      }
    }

    return subtotals
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
    return newArray(this.pivot_fields.length+1, 0)
  }

  setColSpans (columns) {
    // build single array of the header values
    // use column id for the label level
    var header_levels = []
    var span_values = []
    var span_tracker = []
    

    // init header_levels and span_values arrays
    for (var c = columns.length-1; c >= 0; c--) {
      var idx = columns.length - 1 - c

      if (this.sortColsBy === 'sort_by_pivot_values') {
        header_levels[idx] = [...columns[c].levels, columns[c].field.name] // columns[c].levels.concat([columns[c].field.name])
      } else {
        header_levels[idx] = [columns[c].field.name, ...columns[c].levels]
      }

      span_values[c] = newArray(header_levels[idx].length, 1)
    }

    if (this.spanCols) {
      span_tracker = newArray(header_levels[0].length, 1)

      // FIRST PASS: loop through the pivot headers
      for (var h = 0; h < header_levels.length; h++) {
        var header = header_levels[h]
        
        // loop through the levels for the pivot headers
        var start = 0
        var end = header.length - 1

        for (var l = start; l < end; l++) {
          var this_value = header_levels[h][l]
          if (h < header_levels.length-1) {
            var above_value = header_levels[h+1][l]
          }

          // increment the tracker if values match
          if (h < header_levels.length-1 && this_value == above_value) {
            span_values[h][l] = -1;
            span_tracker[l] += 1;
          } else {
          // partial reset if the value differs
            for (var l_ = l; l_ < end; l_++) {
              span_values[h][l_] = span_tracker[l_];
              span_tracker[l_] = 1
            }
            break;
          }
        }
      }

      if (this.sortColsBy === 'sort_by_pivot_values') {
        var label_level = this.pivot_fields.length + 1
      } else {
        var label_level = 0
      }

      // SECOND PASS: loop backwards through the levels for the column labels
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
    }

    for (var c = 0; c < columns.length; c++) {
      columns[c].colspans = span_values[c]
    }
    return columns
  }

  getColumnsToDisplay (i) {
    // remove some dimension columns if we're just using a single index column
    if (this.useIndexColumn) {
      var columns = this.columns.filter(c => c.type == 'measure' || c.id == '$$$_index_$$$')
    } else {
      var columns =  this.columns.filter(c => c.id !== '$$$_index_$$$')
    }

    // update list with colspans
    columns = this.setColSpans(columns).filter(c => c.colspans[i] > 0)

    // console.log('getColumnsToDisplay i ->', i, headers)
    return columns
  }

  getRow (row) {
    // filter out unwanted dimensions based on index_column setting
    if (this.useIndexColumn) {
      var cells = this.columns.filter(c => c.type == 'measure' || c.id == '$$$_index_$$$')
    } else {
      var cells =  this.columns.filter(c => c.id !== '$$$_index_$$$')
    }
    
    // if we're using all dimensions, and we've got span_rows on, need to update the row
    if (!this.useIndexColumn && this.spanRows) {
    // set row spans, for dimension cells that should appear
      for (var cell = 0; cell < cells.length; cell++) {
        cells[cell].rowspan = 1 // set default
        if (row.type === 'line_item' && this.rowspan_values[row.id][cells[cell].id] > 0) {
          cells[cell].rowspan = this.rowspan_values[row.id][cells[cell].id]
        } 
      }

      // filter out dimension cells that a hidden / merged into a cell above
      if (row.type === 'line_item') {
        cells = cells.filter(c => c.type == 'measure' || this.rowspan_values[row.id][c.id] > 0)
      }
    }

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
    section: "Table",
    type: "number",
    label: "Sub Total Depth",
    default: 1
  },
  indexColumn: {
    section: "Table",
    type: "boolean",
    label: "Use Index Dimension",
    default: "false",
  },
  sortColumnsBy: {
    section: "Table",
    type: "string",
    display: "select",
    label: "Sort Columns By",
    values: [
      { 'Pivots': 'sort_by_pivot_values' },
      { 'Measures': 'sort_by_measure_values' }
    ],
    default: "sort_by_pivot_values",
  },
  spanRows: {
    section: "Table",
    type: "boolean",
    label: "Span Rows",
    display_size: 'half',
    default: "true",
  },
  spanCols: {
    section: "Table",
    type: "boolean",
    label: "Span Cols",
    display_size: 'half',
    default: "true",
  },
  rowSubtotals: {
    section: "Table",
    type: "boolean",
    label: "Row Subtotals",
    display_size: 'half',
    default: "true",
  },
  colSubtotals: {
    section: "Table",
    type: "boolean",
    label: "Col Subtotals",
    display_size: 'half',
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

    newOptions['comparison|' + fields[i].name] = {
      section: "Columns",
      type: "string",
      label: 'Comparison for ' + ( fields[i].label_short || fields[i].label ),
      order: i * 10 + 1
    }

    newOptions['hide|' + fields[i].name] = {
      section: "Columns",
      type: "boolean",
      label: 'Hide',
      display_size: 'third',
      order: i * 10 + 2,
    }

    newOptions['var_num|' + fields[i].name] = {
      section: "Columns",
      type: "boolean",
      label: 'Var #',
      display_size: 'third',
      order: i * 10 + 3,
    }

    newOptions['var_pct|' + fields[i].name] = {
      section: "Columns",
      type: "boolean",
      label: 'Var %',
      display_size: 'third',
      order: i * 10 + 2,
    }

  }
  console.log('newOptions', newOptions)
  return newOptions
}

const buildReportTable = function(lookerData) {

  var table = d3.select('#visContainer')
    .append('table')
    .attr("class", "reportTable");

  table.append('thead')
    .selectAll('tr')
    .data(lookerData.getLevels()).enter()
      .append('tr')
      .selectAll('th')
      .data(function(level, i) { 
        return lookerData.getColumnsToDisplay(i).map(function(column) {
          var header = {
            'text': '',
            'colspan': column.colspans[i]
          }
          if (lookerData.sortColsBy == 'sort_by_pivot_values') {
            if (i < column.levels.length && column.pivoted) {
              header.text = column.levels[i]
            } else if (i === column.levels.length) {
              header.text = column.getLabel()
            } else {
              header.text = ''
            }
          } else {
            if (i == 0) {
              header.text = column.getLabel()
            } else {
              header.text = column.levels[i - 1]
            }
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
        return lookerData.getRow(row).map(function(column) {
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

    console.log('data', data)
    console.log('config', config)
    console.log('queryResponse', queryResponse)

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

    new_options = getNewConfigOptions(config, fields)
    this.trigger("registerOptions", new_options)

    lookerData = new LookerData(data, queryResponse, config)
    console.log(lookerData)

    buildReportTable(lookerData)
    
    done();
  }
})
### Tasks

- Build a list of all columns in data
- Create a 'semi-flat table' i.e. array of row objects, each of which has an array of cell objects
- Display that as a table
- Enrich the table object
  - Add the total row
  - Add the subtotal rows
  - Have a single dimension column, appropriately indented for line items / subtotals / totals
  - Have a single dimension column, appropriately bolded/capitalised for line items / subtotals / totals


  - Colspans/multiple headers for pivots
  - Option to put total at top or bottom
  - Option to put subtotals above or below rows
  - Ability to hide rows associated with a given subtotal
- Formatting
  - Red for negatives
  - Brackets for negatives
  - Bold top border for subtotals
  - Top & bottom border for totals
  - Up/down/steady bullets ( △ ▽ ▷ )
- Calculations
  - Variance:
    - Any column with a numeric column to left has config options for Absolute Var, Relative Var
    - Any pivoted set of columns has config option to create a "Variance Pivot Group"
  - Top N + Others, with option to add sub-total of the Top N
    - Initial requirement is a single dimension table i.e. simple calc with limit of N plus Totals enabled
  - Arbitrary re-grouping as supplementary information / rows below the total
    - If this means having a dimension used purely for re-grouping, might take a healthy chunk of data re-processing. It's not possible to "hide from vis" and still have access to the values. Which means they must be present and impacting any existing sub-totals
- Sparklines
  - https://www.essycode.com/posts/create-sparkline-charts-d3/
  - http://www.tnoda.com/blog/2013-12-19/
  - http://bl.ocks.org/benjchristensen/1133472
  - https://bl.ocks.org/mph006/20f76a764fd5ed2ff37f
  - https://github.com/DKirwan/reusable-d3-sparkline
  - http://prag.ma/code/sparky/

## Cell merge in dimensions

- cell merge option
- ? cell merge depth - use subTotalDepth value
- do not merge across subtotals

Data structure
- this.rowspan_values { row_index: { dimension: span_value} }

Building rowspan_values
- init rowspan_value (this.rowspan_values = {})
- init span_tracker (var span_tracker = {})
- loop backwards through the data rows
  - if total or subtotal, full_reset and continue
    FULL RESET: for each dim, span_tracker.dim = 1, continue
  - loop forwards through the dimensions
    - MATCH: if the dimension value is same as previous, increment the tracker and set cell to hidden
      INCREMENT: for current dimension, span_tracker.dim += 1, this.row_span_values[row_index][dimension] = -1
    - NEW VALUE: if the dimension value is different to previous, reset this and following cells, and continue to next row
      PARTIAL RESET: for current and subsequent dimensions, span_tracker.dim = 1

Rendering table - getRows() to replace getHeaders()
- getRows(index_column=false, row_index)
  - this.columns.filter
    - if index_column==true, either measure or $$$_index_$$$
    - else NOT $$$_index_$$$
    - .filter
      - this.row_span_values[row_index][column.id] > 0

## Adding Column SubTotals – addColumnSubTotals()

- For a single level of pivot, existing row totals functionality will do
- Only required therefore for pivots of depth 2+

Qs
- Take same approach as financial subtotals - choose a single level for subtotals?
  - DESIGN: default to one level of subtotals, at highest level of pivot
- Option to create list rather than sum? Both?
  - DESIGN: figure out how to create sum. Only then expand to lists.
- Labelling?
  - DESIGN: Add a 'TOTAL' column that will fit under the higher level pivot
- Set / disable config option when less than depth 2?

Design
- config setting: columnSubtotals (boolean)

- IF (columnSubtotals == true && pivots.length > 1)

- subtotal_level = 0
- current_group = {
    label: '',
    before: '',
    columns: []
  }
- subtotal_groups = []

- loop through this.columns
- IF (column.subtotaled) remove column
- IF (column.pivoted)
  - IF (current_group.label == column.levels[subtotal_level])
    - current_group.columns.push(column.id)
  - ELSE
    - IF (current_group.columns.length > 0)
      - current_group.before = column.levels[subtotal_level]
      - subtotal_groups.push(current_group)
    - current_group = { 
        label: column.levels[subtotal_level], 
        columns: [column.id]
      }

- insert new columns
- for each subtotal group
  - loop through this.columns  
    - if (subtotal_group.before == column.id)

- loop through rows


## Building a row (CHANGED: now can do single run through the columns)

1. Create row
2. Dimensions
3. Measures 
   - if flat
     - else pivots
5. Supermeasures

#### Create row
    var row = new Row(type) // type: line_item | subtotal | total

#### Dimensions
    for (var d = 0; d < this.dims.length; d++) {
      var dim = this.dims[d].name
      row.data[dim] = // calculate cell value
    }

#### Measures
    if (this.has_pivots) { // Pivoted measures, skipping table_calculations for row totals
      for(var p = 0; p < this.pivots.length; p++) {
        for (var m = 0; m < meas.length; m++) {
          if (!this.pivots[p].is_total || typeof meas[m].is_table_calculation  == 'undefined') {
            var pivotKey = this.pivots[p]['key']
            var measureName = meas[m]['name']
            var cellKey = pivotKey + '.' + measureName
            var cellValue = // calculate cell value
            row.data[cellKey] = cellValue
          }
        }
      } else { // Flat table measures
        for (var m = 0; m < this.meas.length; m++) {
          var mea = this.meas[m].name
          row.data[mea] = // calculate cell value 
        }
      }
    }

#### Supermeasures
    if (this.has_supers) {
      for (var s = 0; s < this.supers.length; s++) {
        var super_ = this.supers[s].name
        row.data[super_] = // calculate cell value
      }
    }

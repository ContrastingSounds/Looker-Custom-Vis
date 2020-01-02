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


## Building a row

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
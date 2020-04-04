### Tasks

+ Build a list of all columns in data
+ Create a 'semi-flat table' i.e. array of row objects, each of which has an array of cell objects
+ Display that as a table
- Enrich the table object
  + Add the total row
  + Add the subtotal rows
  + Have a single dimension column, appropriately indented for line items / subtotals / totals
  + Have a single dimension column, appropriately bolded/capitalised for line items / subtotals / totals
  + Colspans/multiple headers for pivots
  + Option to put measure labels at top (with time periods grouped by measure)
    + Method for sorting columns
    - Column subtotals to require / not require specific grouping or ordering?
    + Ensure subtotals are not generated for supermeasures
  - Ability to hide rows associated with a given subtotal
- Formatting
  + Red for negatives
  - Brackets for negatives
  + Bold top border for subtotals
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
- Running Sub Totals
  - Especially for income statement style tables
- Sparklines
  - https://www.essycode.com/posts/create-sparkline-charts-d3/
  - http://www.tnoda.com/blog/2013-12-19/
  - http://bl.ocks.org/benjchristensen/1133472
  - https://bl.ocks.org/mph006/20f76a764fd5ed2ff37f
  - https://github.com/DKirwan/reusable-d3-sparkline
  - http://prag.ma/code/sparky/
- Transpose
  - Some statements are better done as transposed tables e.g. inserting EPS in to middle of rows

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

## Adding a variance

+ Make it easy to select a column and create a variance against another
- Variance should be absolute and relative (%), with option of which to display
+ Ability to show negative variance in red text
- Ability to add up/down/steady indicator
- Flavours of variance
  - Actual vs Plan
  - Period vs Same Period
  - Period to Previous Period

Qs
- repurpose existing config options per column?
- always locate to right of selected column?
- ability to do bulk comparisons? (ie JD Sport This Year vs Last year w/ 5 measures)
- how to handle pivoted measures
- how to handle subtotals 
- any typical scenarios? where the same [pivoted | super] measure has multiple comparions?

Pivoted measures
- When you select a measure e.g. "Total Transction Value", related columns can include:
  - simple measure
  - multiple pivots
  - multiple subtotals
  - row total
- Comparison options are
  - unpivoted measure vs another unpivoted measure
  - 1 PIVOT
  - pivoted measure vs another pivoted measure of same pivot key
  - pivoted measure vs another pivot of same measure
  - row total of a measure vs row total of another measure
  - 2 PIVOTS
  - subtotaled measure vs another pivot of the same subtotal
  - row total of a measure vs row total of another measure
  - supermeasure vs another supermeasure
- List could look like:
  - 0 PIVOTS
    - A. Actual v Budget
  - 1 PIVOT
    - A. Actual Row Total v Budget Row Total   | Actual vs Budget (row totals)
    - Ba This Year Actual v Last Year Actual   | Compare Reporting Periods (example a)
    - Bb Compare Jan, Feb, Mar                 | Compare Calendar Months   (example b)             | Feb vs Jan, Mar vs Feb Actual
    - C. SuperX vs SuperY                      | Super X vs Super Y .. include row totals?
  - 2 PIVOTS
    - A. Actual Row Total v Budget Row Total
    - B. Compare 1996, 1997, 1998              | Compare Calendar Years (compare sub totals)       | 1997 vs 1996, 1998 vs 1997 Actual
    - C. Compare Jan, Feb, Mar                 | Compare Calendar Months (include w. sub totals)   | Feb vs Jan, Mar vs Feb Actual
    - D. SuperX vs SuperY                      | Super X vs Super Y
- Logic
  - 0 Pivots
    - Baseline: Selected Column
    - Comparison: Selected Column
  - 1 Pivot Sort By Pivot
  - 1 Pivot Sort By Measure
  - 2 Pivots Sort By Pivot
  - 2 Pivots Sort By Measure


## Creating a new column

1. Create list of new objects
2. Update this.columns with Column object(s)
3. Update Rows in this.data 

```
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

    this.sort_by_measure_values = [] // [index -1|dimension 0|measure 1|row totals & supermeasures 2, column number, [measure values]  ]
    this.sort_by_pivot_values = []   // [index -1|dimension 0|measure 1|row totals & supermeasures 2, [pivot values], column number    ]
  }
```

## variance column

id = $$$_[absolute|percent]variance_$$$.[baseline.id].[comparison.id]
label = Var # | Var %
view = ''
levels = ???
field = {
  name: id
}
field_name = id
type = measure
pivoted = baseline.pivoted
super = baseline.super
pivot_key = levels.join('|')
align = 'right'
this.sort_by_measure_values = ???
this.sort_by_pivot_values = ???

1. What baseline column(s)
2. What comparison column(s)
3. Build ids
4. For each id:
   - Create column
     - set label, field, field_name, type, pivoted, super
     - levels = ???
   - For each row:
     - if absolute, value = baseline - comparison
     - else value = (baseline - comparison) / comparison
     - cell = {
          value:
          rendered:
        }  
5. Sort Columns
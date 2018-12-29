# Financial Table Design Notes

- Constructing a table
- Simplified Data Structures
  - From Looker
  - Globals, settings
  - All Tables
  - Pivot Tables
- Functions
- Pivot Tables
  - Pivots without Sparklines
  - Pivots with Sparklines


# Constructing a table

1. Reset the viz:
   - Clear errors
   - Destroy the previous tabulator object
   - Delete the data table
2. Set style _(currently single theme only)_
3. Validate config _(may need restrict the depth of pivots allowed based on behaviour seen so far)_
4. Handle dimensions
   - Add rows to data table
   - Create array of column definitions
5. Handle measures
   - Add rows to data table: updateDataTableWithMeasureValues()
     - Three types of table: pivoted, pivoted with spark lines, flat
   - Create column definitions
     - Pivot table: buildMeasuresTree()
     - Flat table: buildMeasuresArray() 
   - Append measure columns to dimension columns
6. Set group_by, if applied in user options
7. Set sort order _(currently defaulting to first dimension column)_
8. Construct Tabulator object

## Tabulator features used

### Column Grouping

Column grouping is used to support pivot tables. This is largely performed by the ```buildMeasuresTree()``` function.

### Column Resizing (```columnResized``` handler)

Columns can be resized by the user. Note in the ```updateOptionsPanel()``` function, by saving the column width without providing ```section``` or ```label``` properties, these options can be hidden from the user's options panel.

### Row Grouping (```groupHeader``` handler)

Data grouping is provided by the Tabulator library. The aggregation applied is set by the applyMeasureFormat() function, and the format of the aggregated figure is set by a combination of the applyMeasureFormat() function and the table's ```groupHeader``` property.

### Tooltips (```tooltips``` handler)

Tooltips only display the measure name and value currently. Set by the tables ```tooltips``` property. Might be an option in future to do more with the tooltip. Not clear from the docs, but looks like it is restricted to text only.

# Simplified Data Structures

## From Looker

These variables are provided by Looker as part of the Custom Vis API. The API's updateAsync function includes ```data, element, config, queryResponse, details, done``` parameters. The data structures of particular interest are:

### dimensions _(queryResponse.fields.dimension_like)_

Array of all dimension-like objects, including dimensions, custom dimensions and table calcs.

### measures _(queryResponse.fields.measure_like)_

Array of all measure-like objects, including measures, custom measures and table calcs.

### pivot_fields _(config.query_fields.pivots)_

Array of pivot field objects, including their sort order index.

### pivot_index _(queryResponse.pivots)_

Array of all pivot index objects, that is the objects that describe every pivot column in the dataset. Includes their key, which combined with a measure name uniquely identifies a column in the dataset.


## Globals, settings

### number_formats

Map of format names to parameter settings.

### formatters

Map of formatter names to functions.

### themeFinancialTable

CSS Stylesheet for the vis.

### global_options

Required user options for the vis.


## All Tables

These variables are used for all variations of the vis. They are effectively global (within the context of a custom vis plugin).

### dim_names

Simple array of all dimension names.

### dim_details

Array of column definitions, using the Tabulator column definition structure. Concatenated with mea_details and (not yet implemented) supermeasures to provide the Tabulator object with an array of all columns.

### tabulator_data

Array of table data, using the Tabulator row definition structure. Field properties must match exactly to the fields defined in dim_details.

### mea_names

Simple array of all measure names.

### mea_details

Array of column definitions, using the Tabulator column definition structure. Concatenated with dim_details and (not yet implemented) supermeasures to provide the Tabulator object with an array of all columns.

### table_col_details

The complete array of column definitions, a concatenation of ```dim_details```, ```mea_details``` and (not yet implemented) supermeasures.

### group_by

Field used for grouping – based on user options

### initial_sort

Field used for sorting table on display – currently hard-coded to the first dimension.

### tbl

The Tabulator table object itself, tied to the ```finance_tabulator``` HTML element.


## Pivot Tables

### measures_tree

Nested array of column groups and definitions, required to display a pivoted table. Once built, it is assigned to the mea_details object. This is then concatenated with the dim_details and (yet to be implemented) supermeasures to form the complete array of Tabulator column definitions.


# Functions

### getNestedObject

_parameters:_ nestedArray, pathArr

_returns:_ object

Given a nested array and an index reference (in the form of an array), returns the object at that index.

### updateOptionsPanel

_parameters:_ vis, dimensions, measures

_updates:_ vis options (via ```registerOptions``` trigger)

Register new config options (eg settings for individual fields). Calls the registerOptions trigger provided by Looker Custom Vis API.

### buildDimensionsArray

_parameters:_ dimensions

_returns:_ dim_names

### buildDimensionDefinitions

_parameters:_ dimensions, config

_returns:_ dim_details

### buildTableSpine

_parameters:_ data, dim_names

_returns:_ tabulator_data 

Builds the "spine" of the Tabulator data table. This is the full length array of data rows, but at this stage only the dimension-like fields.

### insertColumnGroup

_parameters:_ group, branch, index, iteration=1

_updates:_ measures_tree

Adds a Tabulator column group object, which represent a new branch in the Measures Tree.

### insertMeasuresArray

_parameters:_ measures_array, branch, index, iteration=1

_updates:_ measures_tree

Adds an array of Tabulator column definitions, which represent the leaves of the Measures Tree. This is a recursive function to handle arbitrary tree depth (number of pivot fields).

### applyMeasureFormat

_parameters:_ mea_object, mea_definition, config

_updates:_ mea_definition

Takes the measure as defined in the Looker queryReponse.fields.measure_like array, plus the user options, and updates the Tabulator column definition object accordingly.

This sets:
- Calculation to be used if the table is grouped
- The formatter to be used for the cell values themselves, plus the grouped values
- The column width if it has been set by the user

### buildMeasuresTree

_parameters:_ pivot_fields, column_keys, measures, config

_returns:_ measures_tree

For pivoted tables, builds a Measures Tree of column groups and definitions. This nested array will be concatenated to the existing array of dimension columns

Algorithm:

TODO: Document the process! And figure out spark lines :)

### buildMeasureNamesArray

_parameters:_ measures

_returns:_ mea_names

Simple function to build an array of measure names.

### buildMeasuresFlat

_parameters:_ measures, config

_returns:_ mea_details

This function is for flat tables. Builds array of Tabulator column definitions for the measures.

### getSparklinePivotIndex

_parameters:_ pivot_fields, pivot_index, pivot_index_num

_returns:_ new_name

Simple function to return the field name required for a sparkline measure column in a pivoted table. This is a concatenation of all but the last field value, as the last field value becomes the index to the data array representing the sparkline.

TODO: Probably this can be simplified and the logic just applied inline rather than as a separate function. 

### updateDataTableWithMeasureValues

_parameters:_ data, tabulator_data, pivot_fields, mea_names, config

_updates:_ tabulator_data

Iterates through each data row and measure, adding each measure value to the data table using the
appropriate field name. The correct value and field depends on whether pivots and spark
lines are to be used.

#### Flat Tables

1.

#### Pivot Tables

1. 

#### Pivot Tables with Spark Lines

1. If pivoted without spark lines:


# Pivot Tables

Pivot tables require additional processing. The pivot fields must be converted in to Tabulator column groups. This means that the Tabulator's ```columns``` property is no longer a simple array of column definitions, but is now represented as the __Measures Tree__, a nested array of arbitrary depth. As the depth is not known in advance, a couple of recursive functions are used to dynamically create the tree.

Creating the __Measures Tree__ involves three functions:

1. __buildMeasuresTree__ – the main function
2. __insertColumnGroup__ - recursive function to add column groups (branches) to the tree
3. __insertMeasuresArray__ – recursive function to add arrays of measures (leaves) to the tree

## Pivot Tables without Spark Lines

### pivot_depth _(pivot_fields.length)_

Integer defining how many of the pivot fields to use. For pivot tables without spark lines, all fields are used, and this is equal to ```pivot_fields.length```.

## Pivot Table with Spark Lines

### pivot_depth _(pivot_fields.length - 1)_

Integer defining how many of the pivot fields to use. For pivot tables with spark lines, the final field is not used, and this is equal to ```pivot_fields.length - 1```.

### spark_index _(filtered version of pivot_index)_

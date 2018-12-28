# Financial Table Design Notes

- Simplified Data Structures
  - Globals, settings
  - From Looker
  - All Tables
  - Flat Tables
- Functions
- Pivot Tables
  - Pivots without Sparklines
  - Pivots with Sparklines


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

### tbl_data

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

## Flat Tables

Flat tables are easy! No additional vis-level variables required.


# Functions

### getNestedObject

Given a nested array and an index reference (in the form of an array), returns the object at that index.

_in:_ nestedArray, pathArr

_returns:_ object

### updateOptionsPanel

Register new config options (eg settings for individual fields). Calls the registerOptions trigger provided by Looker Custom Vis API.

_in:_ vis, dimensions, measures

_updates:_ vis options (via ```registerOptions``` trigger)

### buildDimensionsArray

_in:_ dimensions

_returns:_ dim_names

### buildDimensionDefinitions

_in:_ dimensions, config

_returns:_ dim_details

### buildTableSpine

### insertColumnGroup

### insertMeasuresArray

### applyMeasureFormat

### buildMeasuresTree

### buildMeasureNamesArray

### buildMeasuresFlat

### getSparklinePivotIndex

### updateDataTableWithMeasureValues


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

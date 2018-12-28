# Functions

### getNestedObject

Given a nested array and an index reference (in the form of an array), returns the object at that index.

_in:_ nestedArray, pathArr
_out:_ object

### updateOptionsPanel

Register new config options (eg settings for individual fields). Calls the registerOptions trigger provided by Looker Custom Vis API.

_in:_ vis, dimensions, measures
_updates:_ vis options (via registerOptions trigger)

### buildDimensionsArray

_in:_ dimensions
_out:_ dim_names

### buildDimensionDefinitions

### buildTableSpine

### insertColumnGroup

### insertMeasuresArray

### applyMeasureFormat

### buildMeasuresTree

### buildMeasureNamesArray

### buildMeasuresFlat

### getSparklinePivotIndex

### updateDataTableWithMeasureValues

# Simplified Data Structures

## Globals, settings

number_formats

formatters

themeFinancialTable

global_options


## From Looker

dimensions (queryResponse.fields.dimension_like)

measures (queryResponse.fields.measure_like)

pivot_fields (config.query_fields.pivots)

pivot_index (queryResponse.pivots)

## All Tables

dim_names

dim_definition

dim_details

tbl_data

mea_names

mea_definition

mea_details

table_col_details

group_by

initial_sort

tbl

## Flat Table

## Pivot Table

pivot_depth (pivot_fields.length)

## Pivot Table with Spark Lines

pivot_depth (pivot_fields.length)

spark_index (filtered version of pivot_index)

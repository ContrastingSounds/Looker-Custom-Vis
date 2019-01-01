/**
 *   Financial Report visualisation
 *   Table vis using tabulator.js, primarily intended for finance-style reporting
 */

/**
 *   render_table and debug are dev-only flags
 */ 
render_table = true;
debug = false;

// lineFormatter = function(cell, formatterParams){
//     setTimeout(function(){ //give cell enough time to be added to the DOM before calling sparkline formatter
//         cell.getElement().sparkline(cell.getValue(), {width:"100%", type:"line", disableTooltips:true});
//     }, 10);
//   };
/**
 * Different Tablulator number formats to set the appearance of measure cells in the table
 * Used by the applyMeasureFormat() function.
 */
number_formats = {
  "usd": {
        decimal: ".",
        thousand: ",",
        symbol: "$",
        precision: 2,
  },
  "gbp": {
        decimal: ".",
        thousand: ",",
        symbol: "£",
        precision: 2,
  },
  "dec_0": {
        decimal: ".",
        thousand: ",",
        precision: 0,
  },
  "dec_2": {
        decimal: ".",
        thousand: ",",
        precision: 2,
  },
}

/**
 * Different Tablulator formatters to set the appearance of measure cells in the table
 * Used by the applyMeasureFormat() function.
 */

spark_line_config = {
  width:"100%", 
  type:"line", 
  disableTooltips:true, 
  lineColor:"black", 
  fillColor:"lightgrey"
}

formatters = {
  "percent_2": function(cell, formatterParams, onRendered) {
    rendered_value = (100 * cell.getValue()).toFixed(2).toString() + '%';
    return rendered_value; 
  },
  "spark_line": function(cell, formatterParams){
    setTimeout(function(){ //give cell enough time to be added to the DOM before calling sparkline formatter
      cell.getElement().sparkline(cell.getValue(), spark_line_config);
    }, 10);
  },
  "spark_bar": function(cell, formatterParams, onRendered) {
    onRendered(function() {
      $(cell.getElement()).sparkline(cell.getValue(), {width:"100%", type:"bar"});
    })
  },
}

/**
 * CSS theme for the table
 * Based on Tabulator's simple theme
 * Changes made:
 *
 * .tabulator {
 *   font-family: Open Sans,Helvetica,Arial,sans-serif;
 *   font-size: 11px;
 * }
 *
 * .tabulator .tabulator-header { 
 *   border-bottom: 1px solid #000;
 * }
 *
 * .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row.tabulator-calcs {
 *   background: #ffffff !important;
 * }
 *
 * .tabulator-row.tabulator-group {
 *   background: #ffffff;
 * }
 */
themeFinanceTable = `
  /* Based on: Tabulator v4.1.3 (c) Oliver Folkerd */
  .tabulator {
    position: relative;
    background-color: #fff;
    overflow: auto;
    font-family: Open Sans,Helvetica,Arial,sans-serif;    /* FONT FAMILY   */
    font-size: 11px;                                      /* FONT SIZE     */
    text-align: left;
    -ms-transform: translatez(0);
    transform: translatez(0);
  }

  .tabulator[tabulator-layout="fitDataFill"] .tabulator-tableHolder .tabulator-table {
    min-width: 100%;
  }

  .tabulator.tabulator-block-select {
    -webkit-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
  }

  .tabulator .tabulator-header {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    border-bottom: 1px solid #000; /* #999 */
    background-color: #fff;
    color: #555;
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    -moz-user-select: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -o-user-select: none;
  }

  .tabulator .tabulator-header .tabulator-col {
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    border-right: 1px solid #ddd;
    background-color: #fff;
    text-align: left;
    vertical-align: bottom;
    overflow: hidden;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-moving {
    position: absolute;
    border: 1px solid #999;
    background: #e6e6e6;
    pointer-events: none;
  }

  .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
    box-sizing: border-box;
    position: relative;
    padding: 4px;
  }

  .tabulator .tabulator-header .tabulator-col .tabulator-col-content .tabulator-col-title {
    box-sizing: border-box;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
  }

  .tabulator .tabulator-header .tabulator-col .tabulator-col-content .tabulator-col-title .tabulator-title-editor {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid #999;
    padding: 1px;
    background: #fff;
  }

  .tabulator .tabulator-header .tabulator-col .tabulator-col-content .tabulator-arrow {
    display: inline-block;
    position: absolute;
    top: 9px;
    right: 8px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid #bbb;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-col-group .tabulator-col-group-cols {
    position: relative;
    display: -ms-flexbox;
    display: flex;
    border-top: 1px solid #ddd;
    overflow: hidden;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-col-group .tabulator-col-group-cols .tabulator-col:last-child {
    margin-right: -1px;
  }

  .tabulator .tabulator-header .tabulator-col:first-child .tabulator-col-resize-handle.prev {
    display: none;
  }

  .tabulator .tabulator-header .tabulator-col.ui-sortable-helper {
    position: absolute;
    background-color: #e6e6e6 !important;
    border: 1px solid #ddd;
  }

  .tabulator .tabulator-header .tabulator-col .tabulator-header-filter {
    position: relative;
    box-sizing: border-box;
    margin-top: 2px;
    width: 100%;
    text-align: center;
  }

  .tabulator .tabulator-header .tabulator-col .tabulator-header-filter textarea {
    height: auto !important;
  }

  .tabulator .tabulator-header .tabulator-col .tabulator-header-filter svg {
    margin-top: 3px;
  }

  .tabulator .tabulator-header .tabulator-col .tabulator-header-filter input::-ms-clear {
    width: 0;
    height: 0;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-sortable .tabulator-col-title {
    padding-right: 25px;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-sortable:hover {
    cursor: pointer;
    background-color: #e6e6e6;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="none"] .tabulator-col-content .tabulator-arrow {
    border-top: none;
    border-bottom: 6px solid #bbb;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="asc"] .tabulator-col-content .tabulator-arrow {
    border-top: none;
    border-bottom: 6px solid #666;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="desc"] .tabulator-col-content .tabulator-arrow {
    border-top: 6px solid #666;
    border-bottom: none;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-col-vertical .tabulator-col-content .tabulator-col-title {
    -webkit-writing-mode: vertical-rl;
        -ms-writing-mode: tb-rl;
            writing-mode: vertical-rl;
    text-orientation: mixed;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-align: center;
        align-items: center;
    -ms-flex-pack: center;
        justify-content: center;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-col-vertical.tabulator-col-vertical-flip .tabulator-col-title {
    -ms-transform: rotate(180deg);
        transform: rotate(180deg);
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-col-vertical.tabulator-sortable .tabulator-col-title {
    padding-right: 0;
    padding-top: 20px;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-col-vertical.tabulator-sortable.tabulator-col-vertical-flip .tabulator-col-title {
    padding-right: 0;
    padding-bottom: 20px;
  }

  .tabulator .tabulator-header .tabulator-col.tabulator-col-vertical.tabulator-sortable .tabulator-arrow {
    right: calc(50% - 6px);
  }

  .tabulator .tabulator-header .tabulator-frozen {
    display: inline-block;
    position: absolute;
    z-index: 10;
  }

  .tabulator .tabulator-header .tabulator-frozen.tabulator-frozen-left {
    border-right: 2px solid #ddd;
  }

  .tabulator .tabulator-header .tabulator-frozen.tabulator-frozen-right {
    border-left: 2px solid #ddd;
  }

  .tabulator .tabulator-header .tabulator-calcs-holder {
    box-sizing: border-box;
    min-width: 400%;
    background: #f2f2f2 !important;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #999;
    overflow: hidden;
  }

  .tabulator .tabulator-header .tabulator-calcs-holder .tabulator-row {
    background: #f2f2f2 !important;
  }

  .tabulator .tabulator-header .tabulator-calcs-holder .tabulator-row .tabulator-col-resize-handle {
    display: none;
  }

  .tabulator .tabulator-header .tabulator-frozen-rows-holder {
    min-width: 400%;
  }

  .tabulator .tabulator-header .tabulator-frozen-rows-holder:empty {
    display: none;
  }

  .tabulator .tabulator-tableHolder {
    position: relative;
    width: 100%;
    white-space: nowrap;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tabulator .tabulator-tableHolder:focus {
    outline: none;
  }

  .tabulator .tabulator-tableHolder .tabulator-placeholder {
    box-sizing: border-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-align: center;
        align-items: center;
    width: 100%;
  }

  .tabulator .tabulator-tableHolder .tabulator-placeholder[tabulator-render-mode="virtual"] {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
  }

  .tabulator .tabulator-tableHolder .tabulator-placeholder span {
    display: inline-block;
    margin: 0 auto;
    padding: 10px;
    color: #000;
    font-weight: bold;
    font-size: 20px;
  }

  .tabulator .tabulator-tableHolder .tabulator-table {
    position: relative;
    display: inline-block;
    background-color: #fff;
    white-space: nowrap;
    overflow: visible;
    color: #333;
  }

  .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row.tabulator-calcs {
    font-weight: bold;
    background: #ffffff !important; /* #f2f2f2 */
  }

  .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row.tabulator-calcs.tabulator-calcs-top {
    border-bottom: 2px solid #ddd; 
  }

  .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row.tabulator-calcs.tabulator-calcs-bottom {
    border-top: 2px solid #000;
  }

  .tabulator .tabulator-col-resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 5px;
  }

  .tabulator .tabulator-col-resize-handle.prev {
    left: 0;
    right: auto;
  }

  .tabulator .tabulator-col-resize-handle:hover {
    cursor: ew-resize;
  }

  .tabulator .tabulator-footer {
    padding: 5px 10px;
    border-top: 1px solid #999;
    background-color: #fff;
    text-align: right;
    color: #555;
    font-weight: bold;
    white-space: nowrap;
    -ms-user-select: none;
        user-select: none;
    -moz-user-select: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -o-user-select: none;
  }

  .tabulator .tabulator-footer .tabulator-calcs-holder {
    box-sizing: border-box;
    width: calc(100% + 20px);
    margin: -5px -10px 5px -10px;
    text-align: left;
    background: #f2f2f2 !important;
    border-bottom: 1px solid #fff;
    border-top: 1px solid #ddd;
    overflow: hidden;
  }

  .tabulator .tabulator-footer .tabulator-calcs-holder .tabulator-row {
    background: #f2f2f2 !important;
  }

  .tabulator .tabulator-footer .tabulator-calcs-holder .tabulator-row .tabulator-col-resize-handle {
    display: none;
  }

  .tabulator .tabulator-footer .tabulator-calcs-holder:only-child {
    margin-bottom: -5px;
    border-bottom: none;
  }

  .tabulator .tabulator-footer .tabulator-pages {
    margin: 0 7px;
  }

  .tabulator .tabulator-footer .tabulator-page {
    display: inline-block;
    margin: 0 2px;
    border: 1px solid #aaa;
    border-radius: 3px;
    padding: 2px 5px;
    background: rgba(255, 255, 255, 0.2);
    color: #555;
    font-family: inherit;
    font-weight: inherit;
    font-size: inherit;
  }

  .tabulator .tabulator-footer .tabulator-page.active {
    color: #d00;
  }

  .tabulator .tabulator-footer .tabulator-page:disabled {
    opacity: .5;
  }

  .tabulator .tabulator-footer .tabulator-page:not(.disabled):hover {
    cursor: pointer;
    background: rgba(0, 0, 0, 0.2);
    color: #fff;
  }

  .tabulator .tabulator-loader {
    position: absolute;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-align: center;
        align-items: center;
    top: 0;
    left: 0;
    z-index: 100;
    height: 100%;
    width: 100%;
    background: rgba(0, 0, 0, 0.4);
    text-align: center;
  }

  .tabulator .tabulator-loader .tabulator-loader-msg {
    display: inline-block;
    margin: 0 auto;
    padding: 10px 20px;
    border-radius: 10px;
    background: #fff;
    font-weight: bold;
    font-size: 16px;
  }

  .tabulator .tabulator-loader .tabulator-loader-msg.tabulator-loading {
    border: 4px solid #333;
    color: #000;
  }

  .tabulator .tabulator-loader .tabulator-loader-msg.tabulator-error {
    border: 4px solid #D00;
    color: #590000;
  }

  .tabulator-row {
    position: relative;
    box-sizing: border-box;
    min-height: 22px;
    background-color: #fff;
    /* border-bottom: 1px solid #ddd; */
  }

  .tabulator-row:nth-child(even) {
    background-color: #fff;
  }

  .tabulator-row.tabulator-selectable:hover {
    background-color: #bbb;
    cursor: pointer;
  }

  .tabulator-row.tabulator-selected {
    background-color: #9ABCEA;
  }

  .tabulator-row.tabulator-selected:hover {
    background-color: #769BCC;
    cursor: pointer;
  }

  .tabulator-row.tabulator-moving {
    position: absolute;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    pointer-events: none !important;
    z-index: 15;
  }

  .tabulator-row .tabulator-row-resize-handle {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 5px;
  }

  .tabulator-row .tabulator-row-resize-handle.prev {
    top: 0;
    bottom: auto;
  }

  .tabulator-row .tabulator-row-resize-handle:hover {
    cursor: ns-resize;
  }

  .tabulator-row .tabulator-frozen {
    display: inline-block;
    position: absolute;
    background-color: inherit;
    z-index: 10;
  }

  .tabulator-row .tabulator-frozen.tabulator-frozen-left {
    border-right: 2px solid #ddd;
  }

  .tabulator-row .tabulator-frozen.tabulator-frozen-right {
    border-left: 2px solid #ddd;
  }

  .tabulator-row .tabulator-responsive-collapse {
    box-sizing: border-box;
    padding: 5px;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
  }

  .tabulator-row .tabulator-responsive-collapse:empty {
    display: none;
  }

  .tabulator-row .tabulator-responsive-collapse table {
    font-size: 14px;
  }

  .tabulator-row .tabulator-responsive-collapse table tr td {
    position: relative;
  }

  .tabulator-row .tabulator-responsive-collapse table tr td:first-of-type {
    padding-right: 10px;
  }

  .tabulator-row .tabulator-cell {
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    padding: 4px;
    border-right: 1px solid #ddd;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tabulator-row .tabulator-cell:last-of-type {
    border-right: none;
  }

  .tabulator-row .tabulator-cell.tabulator-editing {
    border: 1px solid #1D68CD;
    padding: 0;
  }

  .tabulator-row .tabulator-cell.tabulator-editing input, .tabulator-row .tabulator-cell.tabulator-editing select {
    border: 1px;
    background: transparent;
  }

  .tabulator-row .tabulator-cell.tabulator-validation-fail {
    border: 1px solid #dd0000;
  }

  .tabulator-row .tabulator-cell.tabulator-validation-fail input, .tabulator-row .tabulator-cell.tabulator-validation-fail select {
    border: 1px;
    background: transparent;
    color: #dd0000;
  }

  .tabulator-row .tabulator-cell:first-child .tabulator-col-resize-handle.prev {
    display: none;
  }

  .tabulator-row .tabulator-cell.tabulator-row-handle {
    display: -ms-inline-flexbox;
    display: inline-flex;
    -ms-flex-align: center;
        align-items: center;
    -moz-user-select: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -o-user-select: none;
  }

  .tabulator-row .tabulator-cell.tabulator-row-handle .tabulator-row-handle-box {
    width: 80%;
  }

  .tabulator-row .tabulator-cell.tabulator-row-handle .tabulator-row-handle-box .tabulator-row-handle-bar {
    width: 100%;
    height: 3px;
    margin-top: 2px;
    background: #666;
  }

  .tabulator-row .tabulator-cell .tabulator-data-tree-branch {
    display: inline-block;
    vertical-align: middle;
    height: 9px;
    width: 7px;
    margin-top: -9px;
    margin-right: 5px;
    border-bottom-left-radius: 1px;
    border-left: 2px solid #ddd;
    border-bottom: 2px solid #ddd;
  }

  .tabulator-row .tabulator-cell .tabulator-data-tree-control {
    display: -ms-inline-flexbox;
    display: inline-flex;
    -ms-flex-pack: center;
        justify-content: center;
    -ms-flex-align: center;
        align-items: center;
    vertical-align: middle;
    height: 11px;
    width: 11px;
    margin-right: 5px;
    border: 1px solid #333;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .tabulator-row .tabulator-cell .tabulator-data-tree-control:hover {
    cursor: pointer;
    background: rgba(0, 0, 0, 0.2);
  }

  .tabulator-row .tabulator-cell .tabulator-data-tree-control .tabulator-data-tree-control-collapse {
    display: inline-block;
    position: relative;
    height: 7px;
    width: 1px;
    background: transparent;
  }

  .tabulator-row .tabulator-cell .tabulator-data-tree-control .tabulator-data-tree-control-collapse:after {
    position: absolute;
    content: "";
    left: -3px;
    top: 3px;
    height: 1px;
    width: 7px;
    background: #333;
  }

  .tabulator-row .tabulator-cell .tabulator-data-tree-control .tabulator-data-tree-control-expand {
    display: inline-block;
    position: relative;
    height: 7px;
    width: 1px;
    background: #333;
  }

  .tabulator-row .tabulator-cell .tabulator-data-tree-control .tabulator-data-tree-control-expand:after {
    position: absolute;
    content: "";
    left: -3px;
    top: 3px;
    height: 1px;
    width: 7px;
    background: #333;
  }

  .tabulator-row .tabulator-cell .tabulator-responsive-collapse-toggle {
    display: -ms-inline-flexbox;
    display: inline-flex;
    -ms-flex-align: center;
        align-items: center;
    -ms-flex-pack: center;
        justify-content: center;
    -moz-user-select: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -o-user-select: none;
    height: 15px;
    width: 15px;
    border-radius: 20px;
    background: #666;
    color: #fff;
    font-weight: bold;
    font-size: 1.1em;
  }

  .tabulator-row .tabulator-cell .tabulator-responsive-collapse-toggle:hover {
    opacity: .7;
  }

  .tabulator-row .tabulator-cell .tabulator-responsive-collapse-toggle.open .tabulator-responsive-collapse-toggle-close {
    display: initial;
  }

  .tabulator-row .tabulator-cell .tabulator-responsive-collapse-toggle.open .tabulator-responsive-collapse-toggle-open {
    display: none;
  }

  .tabulator-row .tabulator-cell .tabulator-responsive-collapse-toggle .tabulator-responsive-collapse-toggle-close {
    display: none;
  }

  .tabulator-row.tabulator-group {
    box-sizing: border-box;
    border-bottom: 1px solid #999;
    border-right: 1px solid #ddd;
    border-top: 1px solid #999;
    padding: 5px;
    padding-left: 10px;
    background: #ffffff;     /* #fafafa */
    font-weight: bold;
    min-width: 100%;
  }

  .tabulator-row.tabulator-group:hover {
    cursor: pointer;
    background-color: rgba(0, 0, 0, 0.1);
  }

  .tabulator-row.tabulator-group.tabulator-group-visible .tabulator-arrow {
    margin-right: 10px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #666;
    border-bottom: 0;
  }

  .tabulator-row.tabulator-group.tabulator-group-level-1 .tabulator-arrow {
    margin-left: 20px;
  }

  .tabulator-row.tabulator-group.tabulator-group-level-2 .tabulator-arrow {
    margin-left: 40px;
  }

  .tabulator-row.tabulator-group.tabulator-group-level-3 .tabulator-arrow {
    margin-left: 60px;
  }

  .tabulator-row.tabulator-group.tabulator-group-level-4 .tabulator-arrow {
    margin-left: 80px;
  }

  .tabulator-row.tabulator-group.tabulator-group-level-5 .tabulator-arrow {
    margin-left: 100px;
  }

  .tabulator-row.tabulator-group .tabulator-arrow {
    display: inline-block;
    width: 0;
    height: 0;
    margin-right: 16px;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 0;
    border-left: 6px solid #666;
    vertical-align: middle;
  }

  .tabulator-row.tabulator-group span {
    margin-left: 10px;
    color: #666;
  }

  .tabulator-edit-select-list {
    position: absolute;
    display: inline-block;
    box-sizing: border-box;
    max-height: 200px;
    background: #fff;
    border: 1px solid #ddd;
    font-size: 14px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    z-index: 10000;
  }

  .tabulator-edit-select-list .tabulator-edit-select-list-item {
    padding: 4px;
    color: #333;
  }

  .tabulator-edit-select-list .tabulator-edit-select-list-item.active {
    color: #fff;
    background: #1D68CD;
  }

  .tabulator-edit-select-list .tabulator-edit-select-list-item:hover {
    cursor: pointer;
    color: #fff;
    background: #1D68CD;
  }

  .tabulator-edit-select-list .tabulator-edit-select-list-group {
    border-bottom: 1px solid #ddd;
    padding: 4px;
    padding-top: 6px;
    color: #333;
    font-weight: bold;
  }
`

/** 
 * Global options
 * Required config settings for user settings
 */
global_options = {
  use_grouping: {
    section: "Data",
    type: "boolean",
    label: "Use Grouping",
    default: "true"
  },
  use_sparklines: {
    section: "Data",
    type: "boolean",
    label: "Use Sparklines",
    default: "true"
  },
}

/** 
 * function to retrieve object from nest of arbitrary depth, using array of indices
 * https://hackernoon.com/accessing-nested-objects-in-javascript-f02f1bd6387f
 */
const getNestedObject = (nestedArray, pathArr) => {
    return pathArr.reduce((obj, key) =>
        (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedArray);
}

/**
 * Register new config options (eg settings for individual fields)
 * Calls the registerOptions trigger provided by Looker Custom Vis API
 */
updateOptionsPanel = function(vis, dimensions, measures) {
  new_options = global_options
  group_by_options = []
  dimensions.forEach(function(field) {
    safe_name = field.name.replace(".", "|");
    id = "Width: " + safe_name;
    new_options[id] = {
      default: null,
      type: "number",
    };
    group_option = {};
    group_option[field.label_short] = safe_name;
    group_by_options.push(group_option);
  });

  new_options["group_by"] = {
    section: "Data",
    type: "string",
    label: "Group By",
    values: group_by_options,
    display: "select",
    default: null,
  };

  measures.forEach(function(field) {
    safe_name = field.name.replace(".", "|");
    id = "Width: " + safe_name;
    new_options[id] = {
      default: null,
      type: "number",
    };

  });

  vis.trigger('registerOptions', new_options); // register options with parent page to update visConfig  
}

/**
 * Short function to get an array of all dimension names
 */
buildDimensionNamesArray = function(dimensions) {
  dim_names = []
  for (var i = 0; i < dimensions.length; i++) {
    dim_names.push(dimensions[i].name)
  }
  return dim_names
}

/**
 * Builds array of Tabulator column definitions for all the dimensions
 * Maybe due to not being familiar with Javascript, but had some odd behaviour when trying to
 * refer to fields using dotted notation, so using "safe names" where all periods replaced with pipes
 * Note: dimensions use the label_short property for their names, table calcs use the label property
 */
buildDimensionDefinitions = function(dimensions, config) {
  dim_details = []
  for (var i = 0; i < dimensions.length; i++) {
      if (dimensions[i].hasOwnProperty("label_short")) {
        dimension_title = dimensions[i].label_short
      } else {
        dimension_title = dimensions[i].label
      }
      dim_definition = {
        title: dimension_title,
        field: dimensions[i].name.replace(".", "|"),
        align: dimensions[i].align,
        // frozen: true,
      }

      if (config["Width: " + safe_name] != null) {
        dim_definition["width"] = config["Width: " + safe_name]
      }
      dim_details.push(dim_definition)
  }
  return dim_details  
}

/**
 * Builds the data set as an array of rows, populated with the dimension fields
 * This will later be enriched with measures and supermeasures.
 */
buildTableSpine = function(data, dim_names) {
  var tabulator_data = []
  for (j = 0; j < data.length; j++) {
    var row = {id: j};

    for (var i = 0; i < dim_names.length; i++) {
        var raw_name = dim_names[i]
        var safe_name = raw_name.replace(".", "|")
        
        row[safe_name] = data[j][raw_name].value
    }
    tabulator_data.push(row)
  }
  return tabulator_data  
}

/**
 * Recursive function to add a Tabulator column group to the Measures Tree for pivoted tables
 * Given an index as an array, it will make its way down through the tree branches until it
 * reaches the level passed as a parameter.
 *
 * Don't think there's another way – this allows trees of arbitrary depth
 */
insertColumnGroup = function(group, branch, index, iteration=1) {
  if (debug) {
    console.log("insertColumnGroup, depth:", iteration);
    console.log("--group:", group);
    console.log("--branch:", branch);
    console.log("--index:", index);   
  }

  if (iteration == index.length) {
    insert_point = index[index.length - 1];
    branch.columns.push(group);

  } else {
    branch_index = index[iteration - 1];
    sub_branch = branch.columns[branch_index];
    insertColumnGroup(group, sub_branch, index, iteration + 1);
  }
}

/**
 * Adds an array of measures as leaves on the Measures Tree (using Tabulator column definitions)
 * Recursive in order to support trees/pivots of arbitrary depth
 */
insertMeasuresLeaves = function(measures_array, branch, index, iteration=1) {
  if (debug) {
    console.log("insertMeasuresLeaves, depth:", iteration);
    console.log("--measures_array:", measures_array);
    console.log("--branch:", branch);
    console.log("--index:", index);
  }

  if (iteration == index.length) {
    insert_point = index[index.length - 1];
    branch.columns = measures_array;
  } else {
    branch_index = index[iteration - 1];
    sub_branch = branch.columns[branch_index];
    insertMeasuresLeaves(measures_array, sub_branch, index, iteration + 1);    
  }
}

/**
 * Given a measure object and association definition, returns an updated measure definition
 * with the appropriate formatter and calculation when grouped.
 * Number formats stored in number_formats object.
 * Formatter functions (including spark lines) stored in formatters object.
 */
applyMeasureFormat = function(mea_object, mea_definition, config) {
  if (["sum", "count", "count_distinct"].includes(mea_object.type)) {
    mea_definition["bottomCalc"] = "sum";
  }
  else if (["average", "average_distinct"].includes(mea_object.type)) {
    mea_definition["bottomCalc"] = "avg";
  }

  if (config.use_sparklines) {
    mea_definition["formatter"] = formatters["spark_line"]; 
  } else if (mea_object.value_format != null) {        
    if (mea_object.value_format.indexOf("$") !== -1) {
      mea_definition["formatter"] = "money" // formats["spark_line"] //"money"
      mea_definition["bottomCalcFormatter"] = "money"
      mea_definition["formatterParams"] = number_formats["usd"]
      mea_definition["bottomCalcFormatterParams"] = number_formats["usd"]
    }
    else if (mea_object.value_format.indexOf("£") !== -1) {
      mea_definition["formatter"] = "money"
      mea_definition["bottomCalcFormatter"] = "money"
      mea_definition["formatterParams"] = number_formats["gbp"]
      mea_definition["bottomCalcFormatterParams"] = number_formats["gbp"]
    }
    else if (mea_object.value_format.indexOf("%") !== -1) {
      mea_definition["formatter"] = formatters["percent_2"];        
    }
    else if (mea_object.value_format.indexOf(".") !== -1) {
      mea_definition["formatter"] = "money"
      mea_definition["bottomCalcFormatter"] = "money"
      mea_definition["formatterParams"] = number_formats["dec_2"]
      mea_definition["bottomCalcFormatterParams"] = fornumber_formatsmats["dec_2"]
    }
    else {
      mea_definition["formatter"] = "money"
      mea_definition["bottomCalcFormatter"] = "money"
      mea_definition["formatterParams"] = number_formats["dec_0"]
      mea_definition["bottomCalcFormatterParams"] = number_formats["dec_0"]
    }
  }

  if (config["Width: " + safe_name] != null) {
    mea_definition["width"] = config["Width: " + safe_name]
  }

  return mea_definition
}

/**
 * For pivoted tables, builds a Measures Tree of column groups and definitions.
 * This nested array will be concatenated to the existing array of dimension columns
 *
 * Initialise tree with empty column group (title: PIVOTED MEASURES)
 * Initialise arrays tracking current location (array index) and value
 * 
 *  
 */
buildMeasuresTree = function(fields, keys, metrics, vis_config) {
  console.log("buildMeasuresTree: keys:", keys)

  // Initialise tree
  tree = [
    {
      title: "PIVOTED MEASURES",
      columns: []
    }
  ];

  // depth: number of pivot fields to use (depends on whether sparklines are on)
  // branch_addr: array indices so that columns and groups can be added at right place
  // latest_value: most recent values seen for the pivot fields
  if (vis_config.use_sparklines) {
    depth = fields.length - 1
  } else {
    depth = fields.length
  }
  branch_addr = [];
  latest_branch_value = [];
  for (level = 0; level < depth; level++) {
    branch_addr[level] = -1;
    latest_branch_value[level] = null;
  }    

  for (branch = 0; branch < keys.length; branch++) {
    if (vis_config.use_sparklines) {
      branch_key = keys[branch].spark_key
    } else {
      branch_key = keys[branch].key   
    }

    if (keys[branch].key != "$$$_row_total_$$$") {

      // Update the tree_index to get the insert point for the column group
      // Create the column group object with appropriate title
      // Add it to Measure Tree
      for (level = 0; level < depth; level++) {
        current_branch_value = keys[branch].data[fields[level].name];
        if (current_branch_value != latest_branch_value[level]) {
          branch_addr[level]++;
          for (next = level + 1; next < fields.length; next++) {
            branch_addr[next] = -1;
            latest_branch_value[next] = null;
          }
          latest_branch_value[level] = current_branch_value;

          tree_index = branch_addr.slice(0, level + 1);
          new_column_group = {
            title: current_branch_value,
            columns: []
          }
          console.log('ADDING NEW COLUMN GROUP', current_branch_value, 'AT PIVOT INDEX', tree_index)
          insertColumnGroup(new_column_group, tree[0], tree_index);
        }

        // If final pivot, get the tree_index where the leaves will be inserted
        // if (level + 1 == depth) {
        //   tree_index = branch_addr.concat([0])
        //   console.log('NEW TREE INDEX FOR ADDING THE MEASURE LEAVES:', tree_index)
        // }
      }
      tree_index.push(0)
      console.log('NEW TREE INDEX FOR ADDING THE MEASURE LEAVES:', tree_index)

      // Once we have the indices for the current column group, push in all the measures
      leaves = []
      for (metric = 0; metric < metrics.length; metric++) {
        looker_definition = metrics[metric];

        // TODO: WHAT SHOULD BE THE FIRST RIGHT HAND VALUE HERE?
        safe_name = branch_key + '|' + looker_definition.name.replace(".", "|");

        if (metrics[metric].hasOwnProperty("label_short")) {
          metric_title = looker_definition.label_short
        } else {
          metric_title = looker_definition.label
        }

        tabulator_definition = {
          title: metric_title,
          field: safe_name,
          align: looker_definition.align,
        }
        tabulator_definition = applyMeasureFormat(looker_definition, tabulator_definition, vis_config);
        leaves.push(tabulator_definition);
      }
      console.log("calling insertMeasuresLeaves with", leaves, tree[0], tree_index)
      insertMeasuresLeaves(leaves, tree[0], tree_index) ;
    }
  }  

  return tree[0].columns
}

/**
 * Simple function to build array of measure names
 */
buildMeasureNames = function(measures) {
  mea_names = []
  for (var i = 0; i < measures.length; i++) {
    mea_names.push(measures[i].name)
  }
  return mea_names
}

/**
 * For 'flat' non-pivoted tables, builds simple array of measures (as Tabulator column definitions)
 * This array will be concatenated to the existing array of dimension columns
 */
buildMeasuresFlat = function(measures, config) {
  var mea_names = []
  var mea_details = []
  
  for (var i = 0; i < measures.length; i++) {
    var mea_name = measures[i].name
    mea_names.push(mea_name)
    
    var safe_name = mea_name.replace(".", "|")
    var mea_object = measures[i]

    mea_definition = {
      title: mea_object.label_short,
      field: safe_name,
      align: mea_object.align,
    }

    mea_definition = applyMeasureFormat(mea_object, mea_definition, config);
    mea_details.push(mea_definition)
  }

  return mea_details
}

// TODO: buildSparklinePivotIndex that builds spark_index

// TODO: change/rename current getSparklinePivotIndex to getSparklineFieldName
/**
 * Constructs a new column reference for pivoted tables with a sparkline
 * This requires all but the last pivot field.
 * TODO: this should probably be done with a .join() method, and probably just inline
 */
getSparklinePivotIndex = function(fields, keys, key) {
  var new_name = keys[key].data[fields[0].name];
  var depth = fields.length - 1;
  for (i = 1; i < depth; i++) {
    new_name += '|' + keys[key].data[fields[i].name];
  }
  return new_name
}

/**
 * For every pivot key, enrich the original key with a new spark_key.
 * The spark_key consists of all but the last pivot field.
 * Also construct a spark_index of unique spark_keys for later iteration.
 */
buildSparklinePivotIndex = function(fields, keys) {
  current_spark_key = null;
  spark_index = [];

  for (pivot_column = 0; pivot_column < keys.length; pivot_column++) {
    spark_key_values = [];
    for (field = 0; field < fields.length - 1; field++) {
      field_name = fields[field].name;
      field_value = keys[pivot_column].data[field_name];
      spark_key_values.push(field_value);
    }

    spark_key = spark_key_values.join("|");
    keys[pivot_column]["spark_key"] = spark_key

    if (spark_key != current_spark_key) {
      spark_index.push(keys[pivot_column])
    }
    current_spark_key = spark_key
  }

  console.log("updated pivoted_index", keys)
  console.log("spark_index", spark_index)
  return spark_index
}

/**
 * Iterates through each data row and measure, adding each value to the data table using the
 * appropriate field name. The correct value and field depends on whether pivots and spark
 * lines are to be used.
 *
 * If pivoted with spark lines:
 *  1. 
 *
 * If pivoted without spark lines:
 *
 * If a flat table:
 *
 *
 */
updateDataTableWithMeasureValues = function(data_in, data_out, fields, keys, metrics, vis_config) {
  if (fields.length > 0) {
    for (row = 0; row < data_in.length; row++) {         
      for (var metric = 0; metric < metrics.length; metric++) {
        raw_name = metrics[metric]
        safe_name = raw_name.replace(".", "|")
        if (row==3) {
          console.log("PROCESSING ROW:", row, "METRIC:", raw_name);
          console.log("row:", data_in[row])
        }      // Avoid first row for debug output

        spark_key_value = null;
        spark_data_points = [];

        for (key = 0; key < keys.length; key++) {
          key_value = keys[key].key

          if (key_value != "$$$_row_total_$$$") {     // Ignore row_totals for now
            if (vis_config.use_sparklines) {
              var latest_spark_key_value =  keys[key].spark_key   // getSparklinePivotIndex(fields, keys, key)

              // If the spark_name has changed, "flush" the current values into a data entry
              if (latest_spark_key_value != spark_key_value) {
                // console.log("spark_key_value has changed", spark_key_value, "-->", latest_spark_key_value)
                if (spark_key_value != null && spark_data_points) {
                  var field_name = spark_key_value + '|' + safe_name
                  data_out[row][field_name] = spark_data_points;
                  
                  if (row==3) {console.log("FLUSH VALUES: ", field_name, spark_data_points)}

                }

                if (typeof data_in[row][raw_name][key_value] !== 'undefined') {
                  var data_value = data_in[row][raw_name][key_value].value
                  spark_data_points = [data_value];
                  if (row==3) { console.log("data point:", data_value, "so far:", spark_data_points)  }
                }

                spark_key_value = latest_spark_key_value;

              } else { // Otherwise, just push the current value into spark_values
                if (typeof data_in[row][raw_name][key_value] !== 'undefined') {
                  var data_value = data_in[row][raw_name][key_value].value
                  spark_data_points.push(data_value);
                }
              }  

            } else {
              var field_name = key_value + '|' + safe_name
              data_value = data_in[row][raw_name][key_value].value
              if (data_value) {
                data_out[row][field_name] = data_value; 
              } 
            }
          } 
        }     
      }
    }
    console.log("updateDataTableWithMeasureValues complete, data_out:", data_out)
    return data_out
  } else {
    for (row = 0; row < data_in.length; row++) {
      for (var metric = 0; metric < metrics.length; metric++) {
          var raw_name = metrics[metric]
          var safe_name = metrics[metric].replace(".", "|")
          
          data_out[row][safe_name] = data_in[row][raw_name].value;
      }
    }
    console.log("updateDataTableWithMeasureValues complete, data_out:", data_out)
    return data_out
  }
}

/**
 * Adds a new data vis to the Looker instance
 * As per the Custom Vis API, includes:
 *   options – user config settings for the vis
 *   create - used to add the HTML elements required to host the vis
 *   updateAsync - generates the actual vis
 *
 * Finance Table Vis:
 *  1. Clear errors, the old vis, the data table
 *  2. Set style
 *  3. Validate config. May restrict the depth of pivots allowed based on behaviour seen so far.
 *  4. Handle dimensions
 *     - Add rows to data table
 *     - Create array of column definitions
 *  5. Handle measures
 *     - Add rows to data table: updateDataTableWithMeasureValues()
 *       - Three variations: pivoted, pivoted with spark lines, flat
 *     - Create column definitions
 *       - Pivot table: buildMeasuresTree()
 *       - Flat table: buildMeasuresArray() 
 *     - Append measure columns to dimenion columns
 *  6. Set group_by, if set in user config
 *  7. Set sort order (currently defaulting to first dimension column)
 *  8. Render Tabulator table
 */
looker.plugins.visualizations.add({
  options: global_options,

  create: function(element, config) {
    console.log("create function called");
    this.style = document.createElement('style')
    document.head.appendChild(this.style)

    var container = element.appendChild(document.createElement("div"));
    container.id = "finance_tabulator";
    this._textElement = container.appendChild(document.createElement("div"));
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    console.log("update function called");
    // Clear any errors from previous updates.
    this.clearErrors();
    delete this.tabulator_data;

    // destory old viz if already exists
    if ($("#finance_tabulator").hasClass("tabulator")) { 
      $("#finance_tabulator").tabulator("destroy") 
    }

    // Set style (this could be made flexible as per https://github.com/looker/custom_visualizations_v2/blob/master/src/examples/subtotal/subtotal.ts)
    this.style.innerHTML = themeFinanceTable

    // print data to console for debugging:
    // console.log("data", data);
    // console.log("element", element);
    // console.log("config", config);
    console.log("queryResponse", queryResponse);

    var vis = this;
    var dimensions = queryResponse.fields.dimension_like
    var measures = queryResponse.fields.measure_like

    // Throw some errors and exit if the shape of the data isn't what this chart needs.
    // TODO: figure out the necessary error conditions and update as necessary
    if (dimensions.length == 0) {
      this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
      return;
    }

    // UPDATE OPTIONS PANEL
    updateOptionsPanel(vis, dimensions, measures);

    console.log("data", data);
    console.log("config.query_fields.pivots", config.query_fields.pivots);
    console.log("queryResponse.pivots", queryResponse.pivots);

    // HANDLE DIMENSIONS
    var dim_names = buildDimensionNamesArray(dimensions);
    var tabulator_data = buildTableSpine(data, dim_names);
    var dim_details = buildDimensionDefinitions(dimensions, config);

    console.log("Dimensions:", dim_names)

    // HANDLE PIVOTS
    pivot_fields = config.query_fields.pivots;
    pivot_index = queryResponse.pivots;
    if (config.use_sparklines) {
      spark_index = buildSparklinePivotIndex(pivot_fields, pivot_index)
    }

    // HANDLE MEASURES
    var mea_names = buildMeasureNames(measures);
    console.log("Measure Names:", mea_names)

    tabulator_data = updateDataTableWithMeasureValues(data, tabulator_data, pivot_fields, pivot_index, mea_names, config);

    // Update column definitions with measures information
    if (pivot_fields.length > 0) {
      if (config.use_sparklines) {
        branch_index = spark_index
      } else {
        branch_index = pivot_index
      }
      mea_details = buildMeasuresTree(pivot_fields, branch_index, measures, config)
    } else {
      mea_details = buildMeasuresFlat(measures, config);
    }
    table_col_details = dim_details.concat(mea_details) 

    // DEBUG CHECK
    console.log("table_col_details", table_col_details)
    console.log("tabulator_data", tabulator_data)

    if (config.use_grouping == true) {
        group_by = config.group_by
    } else {
        group_by = null
    };

    initial_sort = table_col_details[0].field;

    if (render_table) {
      var tbl = $("#finance_tabulator").tabulator({
        virtualDom: false,
        data: tabulator_data,           //load row data from array
        layout:"fitDataFill",      // fit columns to data, but also fill full table width
        // responsiveLayout: "hide",  //hide columns that dont fit on the table
        
        tooltips: true,            //show tool tips on cells
        
        pagination: false, //"local",       //paginate the data
        paginationSize: 10,         //allow 7 rows per page of data
        
        movableColumns: false,      //allow column order to be changed
        resizableColumns: true,
        resizableRows: false,       //allow row size to be changed
        
        groupBy: group_by,
        groupHeader: function(value, count, data, group) {
            //value - the value all members of this group share
            //count - the number of rows in this group
            //data - an array of all the row data objects in this group
            //group - the group component for the group

            return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " item)</span>";
        },

        initialSort: [ {column: initial_sort, dir:"asc"} ],
        columns: table_col_details,

        columnResized: function(column) {
          col_resize = {};
          col_resize["Width: " + column.column.definition.field] = column.column.width;
          vis.trigger('updateConfig', [col_resize]);
        },

        tooltips: function(cell) {
            //function should return a string for the tooltip or false to hide the tooltip
            return  cell.getColumn().getDefinition().title + ": " + cell.getValue(); 
        },
      });      
    } else {
      this._textElement.innerHTML = "Columns: " + table_col_details.length
    }


    // Always call done to indicate a visualization has finished rendering.
    done()
  }
})
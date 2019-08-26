/* Dependency: None yet. */

debug = false;

const addCSS = link => {
  const linkElement = document.createElement('link');

  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', link);

  document.getElementsByTagName('head')[0].appendChild(linkElement);
};

const loadStylesheets = () => {
  // addCSS('https://storage.googleapis.com/media-jw-test-environment/vis/plain_table.css');
  addCSS('https://jwtest.ngrok.io/plain_table/plain_table.css');
};

const options = {
  headers: {
    section: " Headers",
    type: "array",
    display: "string",
    label: "List of Headers",
  },
}


const getNewConfigOptions = function(config, fields) {
  newOptions = options;

  header_array = [{
    'None': 'None'
  }]

  if (typeof config.headers !== 'undefined') {
    for (var i = 0; i < config.headers.length; i++) {
      header_value = {}
      header_value[config.headers[i]] = config.headers[i]
      header_array.push(header_value);
    }    
  }

  for (var i = 0; i < fields.length; i++) {
    newOptions['label|' + i] = {
      section: "Columns",
      type: "string",
      label: fields[i].label_short,
      order: i * 10,
    }

    newOptions['header|' + i] = {
      section: "Columns",
      type: "string",
      display: "select",
      label: '', // fields[i].name,
      values: header_array,
      order: i * 10 + 1,
    }

    newOptions['conditional|' + i] = {
      section: "Columns",
      type: "boolean",
      label: 'Good/Bad', // fields[i].name,
      display_size: 'half',
      order: i * 10 + 2,
    }

    newOptions['target_achieved|' + i] = {
      section: "Columns",
      type: "boolean",
      label: 'Target', // fields[i].name,
      display_size: 'half',
      order: i * 10 + 3,
    }

  }
  return newOptions
}


const getTableStructure = function(config, fields) {
  tableStructure = [
    {
      group_name: 'ungrouped_dimensions',
      display_name: '',
      fields: []
    },
  ];

  if (typeof config.headers !== 'undefined') {
    for (let h =0; h < config.headers.length; h++) {
      header_group = {
        group_name: config.headers[h],
        display_name: config.headers[h],
        fields: []
      }
      tableStructure.push(header_group)
    }
  }

  tableStructure.push({
    group_name: 'ungrouped_metrics',
    display_name: '',
    fields: [],
  });


  for (let f = 0; f < fields.length; f++) {
    if (typeof config['label|' + f] !== 'undefined') {
      label = config['label|' + f]
    } else {
      label = fields[f].label_short
    }

    styles = [];
    if (fields[f].is_numeric) {
      styles.push('right')
    } else {
      styles.push('left')
    }

    field_definition = {
      original_position: f,
      name: fields[f].name,
      display_name: label,
      styles: styles 
    }

    found = false;
    if (typeof config['header|' + f] !== 'undefined') {
      for (let g = 0; g < tableStructure.length; g++) {
        if (config['header|' + f] === tableStructure[g].group_name) {
          tableStructure[g].fields.push(field_definition);
          found = true;
          break;
        }
      }
    }
    if (!found) {
      if (fields[f].category == 'dimension' || !fields[f].measure) {
        tableStructure[0].fields.push(field_definition)
      } else {
        tableStructure[tableStructure.length-1].fields.push(field_definition)
      }
    }
  }

  return tableStructure
}


const buildHeader = function(table, tableStructure, cols) {
  thead = table.createTHead();

  if (tableStructure.length > 2) {
    headerGroups = thead.insertRow();
    col_width = parseInt  (100 / cols) + '%';
    console.log('col_width', col_width)
    for (var i = 0; i < tableStructure.length; i++) {
        if (tableStructure[i].fields.length > 0) {
        th = document.createElement('th');
        th.setAttribute('colspan', tableStructure[i].fields.length);
        th.classList.add('primary')
        text = document.createTextNode(tableStructure[i].display_name);
        th.appendChild(text);
        headerGroups.appendChild(th);      
      }
    }
  }

  headerRow = thead.insertRow();
  col_width = parseInt  (100 / cols) + '%';
  console.log('col_width', col_width)
  for (var i = 0; i < tableStructure.length; i++) {
    for (var j = 0; j < tableStructure[i].fields.length; j++) {
      th = document.createElement('th');
      th.setAttribute('width', col_width );
      th.classList.add('secondary');
      th.classList.add(tableStructure[i].fields[j].styles);
      text = document.createTextNode(tableStructure[i].fields[j].display_name);
      th.appendChild(text);
      headerRow.appendChild(th);
    }
  }
}


const buildFooter = function(table, rows, cols, rowLimit) {
  if (rows > rowLimit) {
    excess = rows - rowLimit;
    tfoot = table.createTFoot();
    footer_comments = tfoot.insertRow();
    td = document.createElement('td');
    td.className = 'excess-rows'
    td.setAttribute('colspan', cols);
    text = document.createTextNode('NOTE: This table has an additional ' + excess + ' rows.');
    td.appendChild(text);
    footer_comments.appendChild(td);
  }
}


const buildRows = function(data, table, tableStructure, rowLimit, config) {
  rows_to_render = Math.min(rowLimit, data.length);
  dims = tableStructure[0].fields;

  rowspan_values = [[]];
  span_tracker = [];
  for (let i = 0; i < dims.length; i++) {
    rowspan_values[0].push(1);
    span_tracker.push(1);
  }

  // Build up an array of wherevrowspans are required
  for (let i = rows_to_render-1; i >= 0; i--) {
    row_index = rows_to_render - 1 - i;
    rowspan_values[row_index] = [];
    for (let j = 0; j < dims.length; j++) {
      if (i > 0 
          && j == 0
          && data[i][dims[j].name].value == data[i-1][dims[j].name].value) 
      {
        rowspan_values[row_index][j] = -1;
        span_tracker[j] += 1;
      } else {
        rowspan_values[row_index][j] = span_tracker[j];
        span_tracker[j] = 1;
      }
    }
  }
  rowspan_values.reverse();

  for (var i = 0; i < rows_to_render; i++) {
    bodyRow = table.insertRow();
    for (var j = 0; j < tableStructure.length; j++) {
      for (var k = 0; k < tableStructure[j].fields.length; k++) {
        if (j == 0 ) {
          spanner = rowspan_values[i][k] 
        } else { 
          spanner = 1 
        }

        if (spanner == -1) {
          continue;
        } else {
          field = tableStructure[j].fields[k]
          cellValue = data[i][field.name];
          styles = field.styles;
          cell = bodyRow.insertCell();

          if (typeof cellValue.rendered == 'undefined') {
            text = cellValue.value
          } else {
            text = cellValue.rendered
          }

          if (cellValue.value == 0) {
            text = '-';
            cell.classList.add('zero')
          }

          if (typeof config[ 'conditional|' + field.original_position ] !== 'undefined') {
            if ( config[ 'conditional|' + field.original_position ]) {
              if (cellValue.value > 0) {
                cell.classList.add('good')
              } else if (cellValue.value < 0) {
                cell.classList.add('bad')
              }
            }
          }

          if (typeof config[ 'target_achieved|' + field.original_position ] !== 'undefined') {
            if ( config[ 'target_achieved|' + field.original_position ]) {
              if (cellValue.value >= 1) {
                text = 'Target Achieved';
                cell.classList.add('good');
              }
            }
          }

          textNode = document.createTextNode(text)
          cell.classList.add(styles);
          cell.setAttribute('rowspan', spanner);
          cell.appendChild(textNode);
        }
      }
    }
  }
}


const buildTable = function(data, tableStructure, rows, cols, rowLimit, config) {
  table = document.createElement('table');
  table.id = 'reportTable_new';
  table.className = 'reportTable';

  buildHeader(table, tableStructure, cols);
  buildRows(data, table, tableStructure, rowLimit, config);
  buildFooter(table, rows, cols, rowLimit);

  document.getElementById('tableContainer').appendChild(table);
}



looker.plugins.visualizations.add({
  options: {
    headers: {
      section: " Headers",
      type: "array",
      display: "string",
      label: "List of Headers",
      default: [],
    },
  },

  create: function(element, config) {
    loadStylesheets();

    // Create a container element to hold the vis
    this.container = element.appendChild(document.createElement("div"));
    this.container.id = 'tableContainer';
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates.
    this.clearErrors();

    try {
      var elem = document.querySelector('#reportTable');
      elem.parentNode.removeChild(elem);  
    } catch(e) {}

    try {
      var elem = document.querySelector('#reportTable_new');
      elem.parentNode.removeChild(elem);  
    } catch(e) {}
    

    if (debug) {
      console.log('data:');
      console.log(JSON.stringify(data, null, 2));
      console.log('config:');
      console.log(JSON.stringify(config, null, 2));
      console.log('queryResponse:');
      console.log(JSON.stringify(queryResponse, null, 2));      
    }

    var tableHeight = chartHeight = element.clientHeight - 16;
    var rowLimit = parseInt(tableHeight / 25);
    var fields = queryResponse.fields.dimension_like.concat(queryResponse.fields.measure_like)

    tableStructure = getTableStructure(config, fields);

    new_options = getNewConfigOptions(config, fields);
    this.trigger("registerOptions", new_options);

    buildTable(data, tableStructure, data.length, fields.length, rowLimit, config);
    
    done();
  }
})
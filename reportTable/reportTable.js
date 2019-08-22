/* Dependency: None yet. */

debug = true;

printTableStyle = `
  table.printTable {
    font-family: Open Sans,Helvetica,Arial,sans-serif;
    font-size: 12px;   
  }

  table.printTable td, table.printTable th {
  }

  table.printTable thead {
    background: #E60000;
    border-bottom: 1px solid #444444;
  }

  table.printTable thead th {
    font-weight: normal;
    color: #FFFFFF;
  }

  table.printTable thead th:first-child {
    border-left: none;
  }
`

const globalOptions = {
  headers: {
    section: "Headers",
    type: "array",
    display: "string",
    label: "List of Headers",
  },
}


const getNewConfigOptions = function(config, tableStructure) {
  console.log('getNewConfigOptions headers', config.headers);
  newOptions = globalOptions;

  header_array = [{
    'None': 'None'
  }]

  for (var i = 0; i < config.headers.length; i++) {
    header_value = {}
    header_value[config.headers[i]] = config.headers[i]
    header_array.push(header_value);
  }

  for (var i = 0; i < tableStructure.length; i++) {
    newOptions[tableStructure[i]] = {
      section: "Data",
      type: "string",
      display: "select",
      label: tableStructure[i],
      values: header_array,
    }
  }
  console.log('newOptions:', newOptions)
  return newOptions
}


const getTableStructure = function(queryResponse) {
  columns = []

  for (var i = 0; i < queryResponse.fields.dimension_like.length; i++) {
    columns.push(queryResponse.fields.dimension_like[i].name)
  }

  for (var i = 0; i < queryResponse.fields.measure_like.length; i++) {
    columns.push(queryResponse.fields.measure_like[i].name)
  }

  return columns
}


const buildHeader = function(tableStructure) {
  
  headerColumns = ''
  for (var i = 0; i < columns.length; i++) {
    headerColumns += '<th>' + columns[i] + '</th>'
  }

  headerHtml = '<thead><tr>'
    + headerColumns
    + '</tr></thead>'

  return headerHtml
}


const buildRows = function(data, tableStructure) {
  
  bodyRows = '';
  
  for (var i = 0; i < data.length; i++) {
    bodyRow = '<tr>';
    for (var j = 0; j < tableStructure.length; j++) {
      if (typeof data[i][tableStructure[j]].rendered == 'undefined') {
        cellValue = data[i][tableStructure[j]].value
      } else {
        cellValue = data[i][tableStructure[j]].rendered
      }
      bodyRow += '<td>' + cellValue + '</td>'
    }
    bodyRow += '</tr>';
    
    bodyRows += bodyRow
  }

  return bodyRows
}


const buildTable = function(data, tableStructure) {
  
  tableHtml = '<table class="printTable">'
   + buildHeader(tableStructure)
   + '<tbody>'
   + buildRows(data, tableStructure)
   + '</tbody>'
   + '</table>'

   return tableHtml
}



looker.plugins.visualizations.add({
  options: {
    headers: {
      section: "Headers",
      type: "array",
      display: "string",
      label: "List of Headers",
      default: [],
    },
  },

  create: function(element, config) {
    this.style = document.createElement('style')
    document.head.appendChild(this.style)

    // Create a container element to let us center the text.
    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "printTable";
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates.
    this.clearErrors();

    if (debug) {
      // console.log('data:');
      // console.log(JSON.stringify(data, null, 2));
      console.log('config:');
      console.log(JSON.stringify(config, null, 2));
      // console.log('queryResponse:');
      // console.log(JSON.stringify(queryResponse, null, 2));      
    }

    // for (var i = 0; i < queryResponse.fields.measures.length; i++) {
    //   console.log(JSON.stringify(queryResponse.fields.measures[i].name, null,2));
    //   console.log()
    // }

    tableStructure = getTableStructure(queryResponse)

    console.log('config after getTableStructure:');
    console.log(JSON.stringify(config, null, 2));

    new_options = getNewConfigOptions(config, tableStructure);
    this.trigger("registerOptions", new_options);

    this.style.innerHTML = printTableStyle;
    this.container.innerHTML = buildTable(data, tableStructure);

    done();
  }
})
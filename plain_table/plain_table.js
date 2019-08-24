/* Dependency: None yet. */

debug = false;

const addCSS = link => {
  const linkElement = document.createElement('link');

  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', link);

  document.getElementsByTagName('head')[0].appendChild(linkElement);
};

const loadStylesheets = () => {
  addCSS('https://jwtest.ngrok.io/plain_table/plain_table.css');
};

const options = {
  headers: {
    section: "Headers",
    type: "array",
    display: "string",
    label: "List of Headers",
  },
}


const getNewConfigOptions = function(config, tableStructure) {
  console.log('getNewConfigOptions headers', config.headers);
  newOptions = options;

  header_array = [{
    'None': 'None'
  }]

  for (var i = 0; i < config.headers.length; i++) {
    header_value = {}
    header_value[config.headers[i]] = config.headers[i]
    header_array.push(header_value);
  }

  for (var i = 0; i < tableStructure.length; i++) {
    newOptions['header|' + i] = {
      section: "Data",
      type: "string",
      display: "select",
      label: tableStructure[i],
      values: header_array,
      order: i,
    }

    newOptions['label|' + i] = {
      section: "Labels",
      type: "string",
      label: tableStructure[i],
      order: i,
    }
  }
  console.log('newOptions:', newOptions)
  return newOptions
}


const getTableStructure = function(config, queryResponse) {
  console.log('getTableStructure:config:');
  console.log(config);
  columns = []

  for (var i = 0; i < queryResponse.fields.dimension_like.length; i++) {
    columns.push(queryResponse.fields.dimension_like[i].name)
  }

  for (var i = 0; i < queryResponse.fields.measure_like.length; i++) {
    columns.push(queryResponse.fields.measure_like[i].name)
  }

  return columns
}

const buildHeader = function(table, tableStructure) {
  thead = table.createTHead();
  headerGroups = thead.insertRow();
  for (var i = 0; i < tableStructure.length; i++) {
    th = document.createElement('th');
    text = document.createTextNode(tableStructure[i])
    th.appendChild(text)
    headerGroups.appendChild(th);
  }

  headerRow = thead.insertRow();
  for (var i = 0; i < tableStructure.length; i++) {
    th = document.createElement('th');
    text = document.createTextNode(tableStructure[i])
    th.appendChild(text)
    headerRow.appendChild(th);
  }
}

const buildRows = function(data, table, tableStructure) {
  for (var i = 0; i < data.length; i++) {
    bodyRow = table.insertRow();
    for (var j = 0; j < tableStructure.length; j++) {
      cell = bodyRow.insertCell();
      if (typeof data[i][tableStructure[j]].rendered == 'undefined') {
        text = document.createTextNode(data[i][tableStructure[j]].value)

      } else {
        text = document.createTextNode(cellValue = data[i][tableStructure[j]].rendered)
      }
      cell.appendChild(text)
    }
  }
}


const buildTable = function(data, tableStructure) {
   table = document.createElement('table');
   table.id = 'reportTable';
   table.className = 'reportTable';

   buildHeader(table, tableStructure);
   buildRows(data, table, tableStructure);

   document.getElementById('tableContainer').appendChild(table);
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
    

    if (debug) {
      console.log('data:');
      console.log(JSON.stringify(data, null, 2));
      console.log('config:');
      console.log(JSON.stringify(config, null, 2));
      console.log('queryResponse:');
      console.log(JSON.stringify(queryResponse, null, 2));      
    }

    // for (var i = 0; i < queryResponse.fields.measures.length; i++) {
    //   console.log(JSON.stringify(queryResponse.fields.measures[i].name, null,2));
    //   console.log()
    // }

    tableStructure = getTableStructure(config, queryResponse)

    new_options = getNewConfigOptions(config, tableStructure);
    this.trigger("registerOptions", new_options);

    buildTable(data, tableStructure);

    done();
  }
})
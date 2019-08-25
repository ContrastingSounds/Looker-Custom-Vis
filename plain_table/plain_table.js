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
    section: " Headers",
    type: "array",
    display: "string",
    label: "List of Headers",
  },
}


const getNewConfigOptions = function(config, fields) {
  console.log('getNewConfigOptions headers', config.headers);
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
    newOptions['header|' + i] = {
      section: "Data",
      type: "string",
      display: "select",
      label: fields[i].name,
      values: header_array,
      order: i,
    }

    newOptions['label|' + i] = {
      section: "Labels",
      type: "string",
      label: fields[i].name,
      order: i,
    }
  }
  console.log('newOptions:', newOptions)
  return newOptions
}


const getTableStructure_new = function(config, fields) {
  tableStructure_new = [
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
      tableStructure_new.push(header_group)
    }
  }

  tableStructure_new.push({
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

    if (fields[f].is_numeric) {
      justify = 'right'
    } else {
      justify = 'left'
    }

    field_definition = {
      name: fields[f].name,
      display_name: label,
      justify: justify 
    }

    found = false;
    if (typeof config['header|' + f] !== 'undefined') {
      for (let g = 0; g < tableStructure_new.length; g++) {
        if (config['header|' + f] === tableStructure_new[g].group_name) {
          tableStructure_new[g].fields.push(field_definition);
          found = true;
          break;
        }
      }
    }
    if (!found) {
      if (fields[f].category == 'dimension' || !fields[f].measure) {
        tableStructure_new[0].fields.push(field_definition)
      } else {
        tableStructure_new[tableStructure_new.length-1].fields.push(field_definition)
      }
    }
  }

  return tableStructure_new
}


const buildHeader_new = function(table, tableStructure) {
  thead = table.createTHead();
  headerGroups = thead.insertRow();
  if (tableStructure.length > 2) {
    for (var i = 0; i < tableStructure.length; i++) {
        if (tableStructure[i].fields.length > 0) {
        th = document.createElement('th');
        th.setAttribute('colspan', tableStructure[i].fields.length);
        text = document.createTextNode(tableStructure[i].display_name);
        th.appendChild(text);
        headerGroups.appendChild(th);      
      }
    }
  }

  headerRow = thead.insertRow();
  col_width = (100 / 7) + '%';
  for (var i = 0; i < tableStructure.length; i++) {
    for (var j = 0; j < tableStructure[i].fields.length; j++) {
      th = document.createElement('th');
      th.setAttribute('style', 'background: #555555');
      th.setAttribute('width', col_width  );
      text = document.createTextNode(tableStructure[i].fields[j].display_name)
      th.appendChild(text)
      headerRow.appendChild(th);
    }
  }
}


const buildRows_new = function(data, table, tableStructure) {
  for (var i = 0; i < data.length; i++) {
    bodyRow = table.insertRow();
    for (var j = 0; j < tableStructure.length; j++) {
      for (var k = 0; k < tableStructure[j].fields.length; k++) {
        cell = bodyRow.insertCell();
        if (typeof data[i][tableStructure[j].fields[k].name].rendered == 'undefined') {
          text = document.createTextNode(data[i][tableStructure[j].fields[k].name].value)
        } else {
          text = document.createTextNode(cellValue = data[i][tableStructure[j].fields[k].name].rendered)
        }
        cell.appendChild(text)
      }
    }
  }
}


const buildTable_new = function(data, tableStructure) {
   table = document.createElement('table');
   table.id = 'reportTable_new';
   table.className = 'reportTable';

   buildHeader_new(table, tableStructure);
   buildRows_new(data, table, tableStructure);

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

    var fields = queryResponse.fields.dimension_like.concat(queryResponse.fields.measure_like)

    for (var i = 0; i < fields.length; i++) {
      console.log(fields[i].name);
    }

    tableStructure_new = getTableStructure_new(config, fields);
    console.log('tableStructure_new:', JSON.stringify(tableStructure_new, null, 2));

    new_options = getNewConfigOptions(config, fields);
    this.trigger("registerOptions", new_options);

    buildTable_new(data, tableStructure_new);
    
    done();
  }
})
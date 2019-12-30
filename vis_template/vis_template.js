/* Dependency: None yet. */

debug = true;

const addCSS = link => {
  const linkElement = document.createElement('link');

  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', link);

  document.getElementsByTagName('head')[0].appendChild(linkElement);
};

const loadStylesheets = () => {
  addCSS('https://jwtest.ngrok.io/vis_template/vis_template.css');
};

const options = {}

const getNewConfigOptions = function(config, fields) {
  newOptions = options;

  for (var i = 0; i < fields.length; i++) {
    newOptions['label|' + fields[i].name] = {
      section: "Columns",
      type: "string",
      label: fields[i].label_short || fields[i].label,
      order: i * 10,
    }

    newOptions['option_a|' + fields[i].name] = {
      section: "Columns",
      type: "boolean",
      label: 'Option A', // fields[i].name,
      display_size: 'half',
      order: i * 10 + 1,
    }

    newOptions['option_b|' + fields[i].name] = {
      section: "Columns",
      type: "boolean",
      label: 'Option B', // fields[i].name,
      display_size: 'half',
      order: i * 10 + 2,
    }

  }
  return newOptions
}

const buildVis = function(data, config, queryResponse) {
  vis = document.createElement('div');
  vis.id = 'lookerVis_new';
  vis.className = 'lookerVis';

  document.getElementById('visContainer').appendChild(vis);
}


looker.plugins.visualizations.add({
  options: options,

  create: function(element, config) {
    loadStylesheets();

    // Create a container element to hold the vis
    this.container = element.appendChild(document.createElement('div'));
    this.container.id = 'visContainer';
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates.
    this.clearErrors();

    try {
      var elem = document.querySelector('#lookerVis');
      elem.parentNode.removeChild(elem);  
    } catch(e) {}

    try {
      var elem = document.querySelector('#lookerVis_new');
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

    var visHeight = element.clientHeight - 16;
    var fields = queryResponse.fields.dimension_like
                  .concat(queryResponse.fields.measure_like)

    new_options = getNewConfigOptions(config, fields);
    this.trigger("registerOptions", new_options);

    buildVis(data, config, queryResponse);
    
    done();
  }
})
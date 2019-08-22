debug = true;

multi_kpi_style = `
  .multi_kpi {
    overflow: hidden;
    font-family: Open Sans,Helvetica,Arial,sans-serif;
    font-size: 12px;   
  }
`

global_options = {
  tile_title: {
    section: "Appearance",
    type: "string",
    label: "Title of tile",
    display: "text",
    default: "Enter title for tile here",
  },
  highlightColours: {
    section: "Appearance",
    type: "array",
    display: "colors",
    label: "Highlight Colours",
    default: ["#62bad4", "#a9c574", "#929292", "#9fdee0", "#1f3e5a", "#90c8ae", "#92818d", "#c5c6a6", "#82c2ca", "#cee0a0", "#928fb4", "#9fc190"]
  },
  textColour: {
    section: "Appearance",
    type: "string",
    display: "color",
    label: "Text Colour",
    default: ["#62bad4"]
  },
};

const updateOptionsPanel = function(vis, measures) {
  new_options = global_options;
  for (var i = 0; i < measures.length; i++) {
    new_options[measures[i].name] = {
      default: measures[i].label,
      section: 'KPI Labels',
      type: 'string',
      label: measures[i].label,
      display: 'text',
    }
  }

  vis.trigger('registerOptions', new_options);
}

looker.plugins.visualizations.add({
  options: global_options,

  create: function(element, config) {
    this.style = document.createElement('style')
    document.head.appendChild(this.style)

    // Create a container element to let us center the text.
    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "multi_kpi";

  },
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates.
    this.clearErrors();

    if (debug) {
      console.log('data:');
      console.log(JSON.stringify(data, null, 2));
      console.log('config:');
      console.log(JSON.stringify(config, null, 2));
      console.log('queryResponse:');
      console.log(JSON.stringify(queryResponse, null, 2));      
    }

    // Grab the first row of the data and the set of measures
    var firstRow = data[0];
    var measures = [];

    for (var i = 0; i < queryResponse.fields.measures.length; i++) {
      measures.push({
        name: queryResponse.fields.measures[i].name,
        label: queryResponse.fields.measures[i].label_short,
      })
    }

    updateOptionsPanel(this, measures);


    vis = '<span><b>'
      + config["tile_title"]
      + '</b></span><table style="width:100%;padding:5">'

    for (var i = 0; i < measures.length; i++) {
      if (typeof config["highlightColours"] !== 'undefined') {
        bckgrd = config["highlightColours"][i]
      } else {
        bckgrd = 'white'
      }
      if (typeof config["textColour"] !== 'undefined') {
        txt = config["textColour"]
      } else {
        txt = 'black'
      }      
      vis += '<tr><td width="5" style="background-color:' 
        + bckgrd
        + '">'
        + '<td style="color:'
        + txt
        + ';text-align:left"><b>'
        + firstRow[measures[i].name].rendered
        + '</b><br/ >'
        + config[measures[i].name] // measures[i].label // + 
        + '</td></tr>'
    }

    vis += '</table>'
    

    this.style.innerHTML = multi_kpi_style;
    this.container.innerHTML = vis;

    // Always call done to indicate a visualization has finished rendering.
    done()
  }
})
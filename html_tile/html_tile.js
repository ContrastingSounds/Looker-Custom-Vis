/*

Dependency:
https://unpkg.com/liquidjs/dist/liquid.min.js

*/

debug = true;

html_tile_style = `
  .html-tile {
    overflow: hidden;
    font-family: Open Sans,Helvetica,Arial,sans-serif;
    font-size: 12px;   
  }
`

looker.plugins.visualizations.add({
  options: {
    html_template: {
      type: "string",
      label: "Template Syntax: {{ view_name%field_name }}",
      display: "text",
      default: "No HTML has been configured yet",
    }
  },

  create: function(element, config) {
    this.style = document.createElement('style')
    document.head.appendChild(this.style)

    // Create a container element to let us center the text.
    this.container = element.appendChild(document.createElement("div"));
    this.container.className = "html-tile";

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

    // Grab the first row of the data.
    var firstRow = data[0];

    var engine = new Liquid();
    tpl = engine.parse(config.html_template);

    parameters = {};
    for (var j = 0; j < tpl.length; j++) {
      var tag = tpl[j]
      if (tag.token.type == "output") {
        raw_name = tag.token.value.replace("%", "."); 
        parameters[tag.token.value] = firstRow[raw_name].rendered || firstRow[raw_name].value
      }
    }

    if (debug) {
      console.log('parameters:');
      console.log(JSON.stringify(parameters, null, 2));
    }

    this.style.innerHTML = html_tile_style;
    engine
        .render(tpl, parameters)
        .then(html => this.container.innerHTML = html);

    // Always call done to indicate a visualization has finished rendering.
    done()
  }
})
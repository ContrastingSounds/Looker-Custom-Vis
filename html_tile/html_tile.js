html_tile_style = `
  .html-tile {
    font-family: Open Sans,Helvetica,Arial,sans-serif;
    font-size: 12px;   
  }
`

looker.plugins.visualizations.add({
  options: {
    html_template: {
      type: "string",
      label: "HTML Template",
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

    // Grab the first row of the data.
    var firstRow = data[0];

    var engine = new Liquid();
    tpl = engine.parse(config.html_template);

    parameters = {};
    for (var j = 0; j < tpl.length; j++) {
      var tag = tpl[j]
      if (tag.type == "value") {
        raw_name = tag.initial.replace("--", ".");
        parameters[tag.initial] = firstRow[raw_name].rendered
      }
    }

    this.style.innerHTML = html_tile_style;
    engine
        .render(tpl, parameters)
        .then(html => this.container.innerHTML = html);

    // Always call done to indicate a visualization has finished rendering.
    done()
  }
})
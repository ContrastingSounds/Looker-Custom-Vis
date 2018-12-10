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

    // Insert a <style> tag with some styles we'll use later.
    var css = element.innerHTML = `
      <style>
        .html-tile {
          // Vertical centering
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .html-tile-text-small {
          font-size: 12px;
        }
      </style>
    `;

    // Create a container element to let us center the text.
    var container = element.appendChild(document.createElement("div"));
    container.className = "hello-world-vis";

    // Create an element to contain the text.
    this._htmlTile = container.appendChild(document.createElement("div"));
    this._htmlTile.className = "html-tile-text-small";

  },
  updateAsync: function(data, element, config, queryResponse, details, done) {
    var engine = new Liquid();
    var template = `<h3>Total Sale Price is {{ order_items_total_sale_price }}</h3>`

    // Clear any errors from previous updates.
    this.clearErrors();

    // print data to console for debugging:
    console.log("data",data);
    console.log("config",config);
    console.log("queryResponse",queryResponse);
    console.log("element", element);

    // Grab the first cell of the data.
    var firstRow = data[0];
    console.log("firstRow", firstRow);
    for (var measure in firstRow) {
      console.log("measure: ", measure)
    };

    parameters = {};
    parameters["order_items_total_sale_price"] = firstRow["order_items.total_sale_price"].rendered;
    console.log("parameters", parameters)

    output = engine
        .parseAndRender(template, parameters)
        .then(html => this._htmlTile.innerHTML = html)

    // Insert the data into the page.
    // this._htmlTile.innerHTML = LookerCharts.Utils.htmlForCell(firstCell);
    // this._htmlTile.innerHTML = output // config.html_template;

    // Always call done to indicate a visualization has finished rendering.
    done()
  }
})
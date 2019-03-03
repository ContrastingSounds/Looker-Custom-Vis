
defaultTheme = `
    rect:hover {
        fill: orange;
    }
    
    #tooltip {
        position: absolute;
        width: auto;
        height: auto;
        padding: 5px;
        background-color: white;
        -webkit-border-radius: 4px;
        -moz-border-radius: 4px;
        border-radius: 4px;
        -webkit-box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
        -moz-box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
        box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
        pointer-events: none;
        font-family: sans-serif;
        font-size: 12px;
    }
    
    #tooltip.hidden {
        display: none;
    }
    
    #tooltip p {
        margin: 0;
        font-family: sans-serif;
        font-size: 12px;
        line-height: 15px;
    }

    .textdiv {
        font-family: "Open Sans",Helvetica,Arial,sans-serif;
        font-size: 12px;
        pointer-events: none;
        overflow: none;
    }
`

convertQueryDatasetToVisData = function(data, queryResponse) {
    return data;
}

looker.plugins.visualizations.add({
    options: {
      use_grouping: {
        section: "Data",
        type: "boolean",
        label: "Placeholder Option",
        default: "true"
      },
    },

    create: function(element, config) {
        this.style = document.createElement('style');
        document.head.appendChild(this.style);
        var container = element.appendChild(document.createElement("div"));
        container.id = "treemapContainer";
    },

    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();
        this.style.innerHTML = defaultTheme;
        console.log("data", data);
        console.log("queryResponse", queryResponse);

        var vis = this;
        var dimensions = queryResponse.fields.dimension_like;
        var measures = queryResponse.fields.measure_like;

        vis_data = convertQueryDatasetToVisData(data, queryResponse);
        console.log("Treemap Data", vis_data);


        done();
    }
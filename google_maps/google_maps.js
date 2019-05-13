const defaultTheme = `
  .google-map {
    font-family: Open Sans,Helvetica,Arial,sans-serif;
    font-size: 12px;   
  }
`

const default_options = {
  // Dev Options
  dumpData: {
    section: "Debug",
    type: "boolean",
    label: "data",
    default: "false",
    display_size: "half",
  },
  dumpConfig: {
    section: "Debug",
    type: "boolean",
    label: "config",
    default: "false",
    display_size: "half",    
  },
  dumpQueryResponse: {
    section: "Debug",
    type: "boolean",
    label: "queryResponse",
    default: "false",
    display_size: "half",    
  },
  dumpTreeData: {
    section: "Debug",
    type: "boolean",
    label: "treemap",
    default: "false",
    display_size: "half",    
  },
};

const dumpToConsole = function(message, obj) {
    console.log(message, JSON.stringify(obj, null, 2));
}

const formatValue = function(number) {
    return parseInt(number);
}

const convertQueryDatasetToVisData = function(data, queryResponse) {
    var vis_data = [];
    data.forEach(d => {
        var row = {};
        vis_data.push(row);
    });
    return vis_data;
}

const getDimensionNames = function(queryResponse) {
    var dimension_names = [];
    queryResponse.fields.dimension_like.forEach(d => {
        dimension_names.push(d.name);
    });
    return dimension_names;
}

const getMeasureNames = function(queryResponse) {
    var measures = [];
    queryResponse.fields.measure_like.forEach(d => {
        measures.push(d.name);
    })
    return measures;
}

const getNewConfigOptions = function(dimensions, measures) {
    new_options = default_options;

    size_by_options = [];
    for (var i = 0; i < measures.length; i++) {
        option = {};
        // option[measures[i]] = i.toString();
        option[measures[i].label] = measures[i].name;
        size_by_options.push(option);
    }
    size_by_options.push({"Count of Rows (TBD)": "count_of_rows"});

    new_options["sizeBy"] = {
        section: "Data",
        type: "string",
        label: "Size By",
        display: "select",
        values: size_by_options,
        default: "0",
    }

    color_by_options = [];
    for (var i = 0; i < dimensions.length; i++) {
        option = {};
        option[dimensions[i].label] = dimensions[i].name;
        color_by_options.push(option)
    }
    color_by_options.push({"Color by Value (TBD)": "color_by_value"});

    new_options["colorBy"] = {
        section: "Data",
        type: "string",
        label: "Color By",
        display: "select",
        values: color_by_options,
        default: "0",
    }

    return new_options;
}

const vis = {
    options: default_options,

    create: function(element, config) {
        this.style = document.createElement('style');
        document.head.appendChild(this.style);

        this.container = element.appendChild(document.createElement("div"));
        this.container.id = "googleMap";
        this.container.className = "googleMap";

        this.tooltip = element.appendChild(document.createElement("div"));
        this.container.className = "tooltip";
    },

    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();
        // this.style.innerHTML = defaultTheme;

        if (config.dumpData) { dumpToConsole("data: ", data) }
        if (config.dumpConfig) { dumpToConsole("config: ", config) }
        if (config.dumpQueryResponse) { dumpToConsole("queryResponse: ", queryResponse) }

        const chartWidth = element.clientWidth;
        const chartHeight = element.clientHeight - 16;

        const dimensions = queryResponse.fields.dimension_like;
        const measures = queryResponse.fields.measure_like;
        
        new_options = getNewConfigOptions(dimensions, measures);
        vis.trigger("registerOptions", new_options);

        const vis_data = convertQueryDatasetToVisData(data, queryResponse);
        const dimension_names = getDimensionNames(queryResponse);
        const measure_names = getMeasureNames(queryResponse); 

        const getSize = function(d) {
            if (config["sizeBy"] == "count_of_rows") {
                return 0;
            } else {
                return 0;
            }
        }

        const getColor = function(d) {
            if (config["colorBy"] == "color_by_value") {
                return 0;
            } else {
                return 0;
            }
        }

        const getCellText = function(d) {
            let cell_string = ""
            return cell_string
        }

        const getTooltip = function(d) {
            let tiptext = "";            
            return tiptext;
        }

        const drawMap = function(vis_data) {
            let mapProperties = {
              center: new google.maps.LatLng(51.508742,-0.120850),
              zoom: 5,
            };

            var map = new google.maps.Map(document.getElementById("googleMap"), mapProperties);
        }

        drawMap();
        done();
    }
};

looker.plugins.visualizations.add(vis);
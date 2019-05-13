const defaultTheme = `
  .leaflet-map {
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
        // var head  = document.getElementsByTagName('head')[0];
        var csslink  = document.createElement('link');
        csslink.rel  = 'stylesheet';
        csslink.type = 'text/css';
        csslink.href = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.css';
        csslink.crossorigin = "";
        document.head.appendChild(csslink);

        var scriptlink  = document.createElement('script');
        scriptlink.src  = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
        scriptlink.crossorigin = "";
        document.head.appendChild(scriptlink);

        this.style = document.createElement('style');
        document.head.appendChild(this.style);

        this.container = element.appendChild(document.createElement("div"));
        this.container.id = "leafletMap";
        // this.container.className = "leafletMap";
        // this.container.height = "180px";

        this.tooltip = element.appendChild(document.createElement("div"));
        this.tooltip.id = "tooltip";
        this.tooltip.className = "tooltip";
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

        map_element = document.getElementById('leafletMap');
        if (map_element) {
            map_element.parentNode.removeChild(map_element);
        }
        map_element = element.appendChild(document.createElement("div"));
        map_element.id = "leafletMap";
        map_element.setAttribute("style","height:" + chartHeight + "px");

        var map = L.map('leafletMap').setView([51.505, -0.09], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {
            foo: 'bar', 
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        }).addTo(map);

        // L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        //         maxZoom: 18,
        //         attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        //             '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        //             'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        //         id: 'mapbox.streets'
        //     }).addTo(map);

        // var marker = L.marker([51.5, -0.09]).addTo(map); 

        // var circle = L.circle([51.508, -0.11], {
        //     color: 'red',
        //     fillColor: '#f03',
        //     fillOpacity: 0.5,
        //     radius: 500
        // }).addTo(map);

        // var polygon = L.polygon([
        //     [51.509, -0.08],
        //     [51.503, -0.06],
        //     [51.51, -0.047]
        // ]).addTo(map);

        // marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
        // circle.bindPopup("I am a circle.");
        // polygon.bindPopup("I am a polygon.");

        // var popup = L.popup()
        //     .setLatLng([51.5, -0.09])
        //     .setContent("I stand alone.")
        //     .openOn(map);

        for (let d = 0; d < dimensions.length; d++) {
            if (dimensions[d].tags.includes("geojson")) {
                for (let row = 0; row < data.length; row++) {
                    geojson_value = JSON.parse(data[row][dimensions[d].name].value);
                    L.geoJSON(geojson_value).addTo(map);
                }                
            }
        }
                    // geojson_feature = {
                    //     "type": "Feature",
                    //     "properties": {},
                    //     "geometry": geojson_value,
                    // }

        done();
    }
};

looker.plugins.visualizations.add(vis);
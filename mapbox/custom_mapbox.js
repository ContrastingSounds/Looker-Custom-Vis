mapboxgl.accessToken = 'pk.eyJ1Ijoiam9ud2FsbHMiLCJhIjoiY2p2aTZsbnh4MDJrbjRibWcxZ2UydXhiayJ9.n25D6UcjxzRQsuKiY5un8A';

const default_options = {
  // Map Options
  mapStyle: {
    section: "Map",
    type: "string",
    label: "Map Style",
    display: "select",
    values: [
      {"Streets": "streets"},
      {"Light": "light"},
      {"Dark": "dark"},
      {"Outdoor": "outdoor"},
      {"Satellite": "satellite"},
    ],
    default: "streets",
  },
}

const map_options = {
    'streets': {
        'style': 'mapbox://styles/mapbox/streets-v11'
    },
    'light': {
        'style': 'mapbox://styles/mapbox/light-v10'
    },
    'dark': {
        'style': 'mapbox://styles/mapbox/dark-v10'
    },
    'outdoor': {
        'style': 'mapbox://styles/mapbox/outdoors-v11'
    },
    'satellite': {
        'style': 'mapbox://styles/mapbox/satellite-v9'
    },
}

const vis = {
    options: default_options,

    create: function(element, config) {
        var csslink  = document.createElement('link');
        csslink.rel  = 'stylesheet';
        csslink.type = 'text/css';
        csslink.href = 'https://api.tiles.mapbox.com/mapbox-gl-js/v0.54.0/mapbox-gl.css';
        csslink.crossorigin = "";
        document.head.appendChild(csslink);

        this.container = element.appendChild(document.createElement("div"));
        this.container.id = "leafletMap";

        this.tooltip = element.appendChild(document.createElement("div"));
        this.tooltip.id = "tooltip";
        this.tooltip.className = "tooltip";
    },

    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();

        console.log(JSON.stringify(queryResponse, null, 2));

        const chartHeight = element.clientHeight - 16;
        const dimensions = queryResponse.fields.dimension_like;


        count_of_geojson_dimensions = 0;
        for (let d = 0; d < dimensions.length; d++) {
            if (dimensions[d].tags.includes("geojson")) {
                count_of_geojson_dimensions += 1;               
            }
        }
        if (count_of_geojson_dimensions == 0) {
          this.addError({title: "No GeoJSON fields", message: "This vis requires a dimension tagged as 'geojson'."});
          return;
        }

        // Create HTML elements and load Leaflet map
        // Removes map_element if already present
        map_element = document.getElementById('leafletMap');
        if (map_element) {
            map_element.parentNode.removeChild(map_element);
        }
        map_element = element.appendChild(document.createElement("div"));
        map_element.id = "map";
        map_element.setAttribute("style","height: 100%");  // " + chartHeight + "px");

        // var map = L.map('leafletMap');
        
        // L.tileLayer(
        //     map_options[config.mapStyle].tiles_url, 
        //     map_options[config.mapStyle].metadata
        // ).addTo(map);

        var map = new mapboxgl.Map({
            container: 'map', // container id
            style: map_options[config.mapStyle].style, // stylesheet location
            center: [-74.50, 40], // starting position [lng, lat]
            zoom: 9 // starting zoom
        });

        // As an alternative to Looker have a location type,
        // we can use tags (e.g. "geojson") in LookML
        // var geoLayer = L.geoJSON().addTo(map);
        // for (let d = 0; d < dimensions.length; d++) {
        //     if (dimensions[d].tags.includes("geojson")) {
        //         for (let row = 0; row < data.length; row++) {
        //             geojson_value = JSON.parse(data[row][dimensions[d].name].value);
        //             geoLayer.addData(geojson_value);
        //         }                
        //     }
        // }
        // map.fitBounds(geoLayer.getBounds());

        done();
    }
};

looker.plugins.visualizations.add(vis);
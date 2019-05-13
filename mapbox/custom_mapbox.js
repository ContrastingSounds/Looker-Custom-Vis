mapboxgl.accessToken = 'pk.eyJ1Ijoiam9ud2FsbHMiLCJhIjoiY2p2aTZsbnh4MDJrbjRibWcxZ2UydXhiayJ9.n25D6UcjxzRQsuKiY5un8A';

const dumpToConsole = function(message, obj) {
    console.log(message, JSON.stringify(obj, null, 2));
}

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
      {"Le Shine": "le_shine"},
      {"Moonlight": "moonlight"},
      {"Decimal Dark": "decimal"},
      {"North Star": "north_star"},
      {"Minimo": "minimo"},
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
    'le_shine': {
        'style': 'mapbox://styles/jonwalls/cjvmcxx3w07kf1cpgkj7kqbxa'
    },
    'moonlight': {
        'style': 'mapbox://styles/jonwalls/cjvmd478d03td1clm08k2egzq'
    },
    'decimal': {
        'style': 'mapbox://styles/jonwalls/cjvmd7k1m1uzg1ckjssqtnqnf'
    },
    'north_star': {
        'style': 'mapbox://styles/jonwalls/cjvmd9w2d3xae1clzg192pdqj'
    },
    'minimo': {
        'style': 'mapbox://styles/jonwalls/cjvmdchkn3xjl1bo3ulk8wv0d'
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

        // console.log(JSON.stringify(queryResponse, null, 2));

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

        var map = new mapboxgl.Map({
            container: 'map', // container id
            style: map_options[config.mapStyle].style, // stylesheet location
            center: [-74.01, 40.71], // starting position [lng, lat]
            zoom: 9, // starting zoom
            pitch: 45,
            bearing: -17.6,
        });

        // As an alternative to Looker have a location type,
        // we can use tags (e.g. "geojson") in LookML
        map.on('load', function() {
            let geojson_features = {
                "type": "FeatureCollection",
                features: []
            };
            for (let d = 0; d < dimensions.length; d++) {
                if (dimensions[d].tags.includes("geojson")) {

                    for (let row = 0; row < data.length; row++) {
                        let geojson_value = JSON.parse(data[row][dimensions[d].name].value);
                        geojson_feature = {
                            "type": "Feature",
                            "properties": {},
                            "geometry": geojson_value
                        }
                        geojson_features.features.push(geojson_feature);
                        map.addLayer({
                            "id": dimensions[d].name + "-layer" + d + row,
                            "type": "fill",
                            "source": {
                                "type": "geojson",
                                "data": geojson_value,
                            },
                            "layout": {},
                            "paint": {
                                "fill-color": "#ff0000",
                                "fill-opacity": 0.2
                            }
                        });
                    }              
                }
            }
            bounds = geojsonExtent(geojson_features);            
            map.fitBounds(bounds, {
                padding: 20
            });

            // https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/
            // Insert the layer beneath any symbol layer.
            var layers = map.getStyle().layers;
             
            var labelLayerId;
                for (var i = 0; i < layers.length; i++) {
                if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                    labelLayerId = layers[i].id;
                    break;
                }
            }

            map.addLayer({
                'id': '3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 9,
                'paint': {
                    'fill-extrusion-color': '#aaa',
                     
                    // use an 'interpolate' expression to add a smooth transition effect to the
                    // buildings as the user zooms in
                    
                    // 'fill-extrusion-height': ["get", "height"],
                    // 'fill-extrusion-base': ["get", "min_height"],

                    'fill-extrusion-height': [
                    "interpolate", ["linear"], ["zoom"],
                        15, 0,
                        15.05, ["get", "height"]
                    ],
                    'fill-extrusion-base': [
                    "interpolate", ["linear"], ["zoom"],
                        15, 0,
                        15.05, ["get", "min_height"]
                    ],

                    'fill-extrusion-opacity': .6
                }
            }, labelLayerId);
        });

        done();
    }
};

looker.plugins.visualizations.add(vis);
const vis = {
    options: {},

    create: function(element, config) {
        var csslink  = document.createElement('link');
        csslink.rel  = 'stylesheet';
        csslink.type = 'text/css';
        csslink.href = 'https://raw.githack.com/ContrastingSounds/Looker-Custom-Vis/leaflet_images_dev/leaflet_images/leaflet_image_overlay.css';
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
        map_element.id = "leafletMap";
        map_element.setAttribute("style","height:" + chartHeight + "px");

        var map = L.map('leafletMap');
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {
            foo: 'bar', 
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        }).addTo(map);

        // As an alternative to Looker have a location type,
        // we can use tags (e.g. "geojson") in LookML
        var geoLayer = L.geoJSON().addTo(map);
        for (let d = 0; d < dimensions.length; d++) {
            if (dimensions[d].tags.includes("geojson")) {
                for (let row = 0; row < data.length; row++) {
                    geojson_value = JSON.parse(data[row][dimensions[d].name].value);
                    geoLayer.addData(geojson_value);
                }                
            }
        }
        map.fitBounds(geoLayer.getBounds());

        done();
    }
};

looker.plugins.visualizations.add(vis);
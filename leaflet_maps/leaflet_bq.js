const vis = {
    options: {},

    create: function(element, config) {
        // Leaflet.js likes the css to be loaded ahead of the js
        // So have loaded both the CSS and Leaflet.js dependency here
        // Rather than using the dependency field on the Admin page
        var csslink  = document.createElement('link');
        csslink.rel  = 'stylesheet';
        csslink.type = 'text/css';
        csslink.href = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.css';
        csslink.crossorigin = "";
        document.head.appendChild(csslink);

        var scriptlink  = document.createElement('script');
        scriptlink.src  = 'https://unpkg.com/leaflet@1.5.1/dist/leaflet.js';
        scriptlink.crossorigin = "";
        document.head.appendChild(scriptlink);

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

        // Leaflet seems to be very sensitive to finding its div already initialised
        // The method I found that worked is deleting the div as part of updateAsync()
        map_element = document.getElementById('leafletMap');
        if (map_element) {
            map_element.parentNode.removeChild(map_element);
        }
        map_element = element.appendChild(document.createElement("div"));
        map_element.id = "leafletMap";
        map_element.setAttribute("style","height:" + chartHeight + "px");

        var map = L.map('leafletMap').setView([40.71, -74.01], 9);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {
            foo: 'bar', 
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        }).addTo(map);

        // As an alternative to Looker have a location type,
        // we can use tags (e.g. "geojson") in LookML
        for (let d = 0; d < dimensions.length; d++) {
            if (dimensions[d].tags.includes("geojson")) {
                for (let row = 0; row < data.length; row++) {
                    geojson_value = JSON.parse(data[row][dimensions[d].name].value);
                    L.geoJSON(geojson_value).addTo(map);
                }                
            }
        }
        // map.fitBounds(L.geoJSON().getBounds());

        done();
    }
};

looker.plugins.visualizations.add(vis);
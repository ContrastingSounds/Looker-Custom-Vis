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
        scriptlink.src  = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
        scriptlink.crossorigin = "";
        document.head.appendChild(scriptlink);

        this.container = element.appendChild(document.createElement("div"));
        this.container.id = "leafletMap";
    },

    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();

        const chartHeight = element.clientHeight - 16;

        // Leaflet seems to be very sensitive to finding its div already initialised
        // The method I found that worked is deleting the div as part of updateAsync()
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

        var marker = L.marker([51.5, -0.09]).addTo(map); 

        var circle = L.circle([51.508, -0.11], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: 500
        }).addTo(map);

        var polygon = L.polygon([
            [51.509, -0.08],
            [51.503, -0.06],
            [51.51, -0.047]
        ]).addTo(map);

        marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
        circle.bindPopup("I am a circle.");
        polygon.bindPopup("I am a polygon.");

        var popup = L.popup()
            .setLatLng([51.5, -0.09])
            .setContent("I am a standalone popup.")
            .openOn(map);

        done();
    }
};

looker.plugins.visualizations.add(vis);
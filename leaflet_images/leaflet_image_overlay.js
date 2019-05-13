const default_options = {
  // Image Options
  imageURL: {
    section: "Image",
    type: "string",
    label: "Background Image URL",
    display: "select",
    values: [
      {"Football": "https://i.ebayimg.com/images/i/221428428152-0-1/s-l1000.jpg"},
      {"Darts": "http://freepngimages.com/wp-content/uploads/2017/01/winmau-dartboard.png"}
    ],
    default: "https://i.ebayimg.com/images/i/221428428152-0-1/s-l1000.jpg",
  },
  defaultIconURL: {
    section: "Image",
    type: "string",
    label: "Default Icon URL",
    display: "text",
    default: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-icon-2x.png",
  },
  // Scale and Padding
  minX: {
    section: "Scales",
    type: "number",
    label: "Min X",
    display: "number",
    placeholder: 0,
    default: 0,
    display_size: "half",
  },
  maxX: {
    section: "Scales",
    type: "number",
    label: "Max X",
    display: "number",
    placeholder: 10,
    default: 10,
    display_size: "half",
  },
  minY: {
    section: "Scales",
    type: "number",
    label: "Min Y",
    display: "number",
    placeholder: 0,
    default: 0,
    display_size: "half",
  },
  maxY: {
    section: "Scales",
    type: "number",
    label: "Max Y",
    display: "number",
    placeholder: 10,
    default: 10,
    display_size: "half",
  },
  paddingVertical: {
    section: "Scales",
    type: "number",
    label: "Padding Vertical",
    display: "number",
    placeholder: 0.02,
    default: 0.02,
    display_size: "half",
  },
  paddingHorizontal: {
    section: "Scales",
    type: "number",
    label: "Padding Horizontal",
    display: "number",
    placeholder: 0.02,
    default: 0.02,
    display_size: "half",
  },
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

const vis = {
  options: default_options,

  create: function(element, config) {
        // Leaflet.js likes the css to be loaded ahead of the js
        // So have loaded both the CSS and Leaflet.js dependency here
        // Rather than using the dependency field on the Admin page
        var csslink  = document.createElement('link');
        csslink.rel  = 'stylesheet';
        csslink.type = 'text/css';
        csslink.href = 'https://unpkg.com/leaflet@1.5.1/dist/leaflet.css';
        csslink.crossorigin = "";
        document.head.appendChild(csslink);

        var scriptlink  = document.createElement('script');
        scriptlink.src  = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
        scriptlink.crossorigin = "";
        document.head.appendChild(scriptlink);


        this.container = element.appendChild(document.createElement("div"));
        this.container.id = "map_container";
    },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // console.log(data);
    // console.log(config);
    // console.log(element);

    var LeafIcon = L.Icon.extend({});
    const chartHeight = element.clientHeight - 16;

    function displayVis(scenarioImage, config, data=[]) {
      var scaleLengthX = config.maxX - config.minX;
      var scaleLengthY = config.maxY - config.minY;

      var trim_top = trim_bottom = config.paddingVertical;
      var trim_left = trim_right = config.paddingHorizontal;     

      const map_container = document.getElementById('map_container');
      var map_element = document.getElementById('map');
      if (map_element) {
          map_container.removeChild(map_element);
      }
      map_element = map_container.appendChild(document.createElement("div"));
      map_element.setAttribute("style", "height:" + chartHeight + "px");
      // map_element.setAttribute("style", "background-color:white");
      map_element.id = "map";

      var map = L.map('map', {
          crs: L.CRS.Simple,
          minZoom: -5,
          zoomSnap: 0.2,
          zoomControl: false,
          attributionControl: false,
      });

      bl_x = config.minX - (config.maxX * trim_left);
      bl_y = config.minY - (config.maxY * trim_bottom);
      tr_x = config.maxX * (1.0 + trim_right);
      tr_y = config.maxY * (1.0 + trim_top);

      var bounds = [[bl_y, bl_x], [tr_y, tr_x]];
      var image = L.imageOverlay(config.imageURL, bounds).addTo(map);

      map.fitBounds(bounds);

      var icons = {};

      const placeMarks = function() {
        const max_icon_size = 50;
        for (i = 0; i < data.length; i++) {
          row = data[i];
          mark_type = row.mark_type.value || "marker";

          switch(mark_type) {
            case "marker":
              var image = new Image();
              image.onload = function() {
                icon_height = this.naturalHeight;
                icon_width = this.naturalWidth;

                icon_longedge = Math.max(icon_height, icon_width);
                icon_height = Math.min(1.0, max_icon_size / icon_longedge) * icon_height;
                icon_width = Math.min(1.0, max_icon_size / icon_longedge) * icon_width;

                icons[row.icon] = {};
                icons[row.icon]["height"] = icon_height;
                icons[row.icon]["width"]  = icon_width;

                addMarker(this.metadata, icon_height, icon_width)
              }
              image.metadata = row;
              image.src = row.icon.value;
              break;

            case "html":
              var coordinates = L.latLng(row.y.value, row.x.value);
              var htmlIcon = L.divIcon({ 
                className: 'myicon',
                iconSize: null,
                html: row.html 
              });
              var pin = L.marker(coordinates, {icon: htmlIcon});
              pin.addTo(map);
              break;

            default:
              row.icon = default_icon;
              addMarker(row, 41, 25);             
          }
        }
      }

      const addMarker = function(metadata, height, width) {
        var markerIcon = new LeafIcon({
            iconUrl: metadata.icon.value || default_icon,
            iconSize: [width, height],
        })

        var markerOptions = {
          title: metadata.hovertext.value || "A Marker",
          draggable: false,
          icon: markerIcon,
        }
        var coordinates = L.latLng(metadata.y.value, metadata.x.value);

        console.log("L.marker(): coordinates, markerOptions");
        console.log(coordinates);
        console.log(markerOptions);
        var marker = L.marker(coordinates, markerOptions);
        marker.bindPopup(row["colour"]);
        marker.addTo(map);
      }

      placeMarks();

    }

    function loadBackground() {
      let image = new Image();
      image.onload = function() {
        displayVis(this, config, data);
      }
      image.src = config.imageURL;
    }

    loadBackground();

    done();
  }
}

looker.plugins.visualizations.add(vis);
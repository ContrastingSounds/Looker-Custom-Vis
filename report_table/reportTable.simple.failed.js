const options = {}

const addCSS = link => {
  const linkElement = document.createElement('link');

  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', link);

  document.getElementsByTagName('head')[0].appendChild(linkElement);
};

// Load all ag-grid default style themes.
const loadStylesheets = () => {
  addCSS('https://unpkg.com/ag-grid-community/dist/styles/ag-grid.css');
  addCSS('https://unpkg.com/ag-grid-community/dist/styles/ag-theme-balham.css');
};


looker.plugins.visualizations.add({
  options: options,

  create(element) {
    loadStylesheets();
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear errors and prune the DOM to be ready for new/updated table
    this.clearErrors();
        try {
      var elem = document.querySelector('#ag-grid-vis');
      elem.parentNode.removeChild(elem);  
    } catch(e) {}
    // Create an element to contain the grid.
    this.grid = element.appendChild(document.createElement('div'));
    this.grid.id = 'ag-grid-vis';
    this.grid.setAttribute('height', '400px');
    this.grid.setAttribute('width', '700px');


    // specify the columns
    var testColumnDefs = [
      {headerName: "Make", field: "make", sortable: true, filter: true },
      {headerName: "Model", field: "model", sortable: true, filter: true },
      {headerName: "Price", field: "price", sortable: true, filter: true }
    ];
    
    // specify the data
    var testRowData = [
      {make: "Toyota", model: "Celica", price: 35000},
      {make: "Ford", model: "Mondeo", price: 32000},
      {make: "Porsche", model: "Boxter", price: 72000}
    ];
    
    gridOptions = {
      columnDefs: testColumnDefs,
      rowData: testRowData,
    };

    var gridDiv = document.querySelector('#ag-grid-vis');
    new agGrid.Grid(gridDiv, gridOptions);

    newDiv = document.createElement('p');
    newContent = document.createTextNode('Vis has rendered.'); 
    newDiv.appendChild(newContent);
    gridDiv.appendChild(newDiv);

    console.log(gridOptions);
    
    done();
  }
})
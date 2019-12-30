debug = true;


const options = {
  theme: {
    default: 'ag-theme-looker',
    display: 'select',
    label: 'Table Theme',
    order: 1,
    section: 'Plot',
    type: 'string',
    values: [
      { Looker: 'ag-theme-looker' },
      { Balham: 'ag-theme-balham' },
      { Fresh: 'ag-theme-fresh' },
      { Dark: 'ag-theme-dark' },
      { Blue: 'ag-theme-blue' },
      { Bootstrap: 'ag-theme-bootstrap' },
    ],
  },
  headers: {
    section: 'Headers',
    type: 'array',
    display: 'string',
    label: 'List of Headers',
    default: [],
  },
}

const defaultTheme = 'ag-theme-looker';

// All of the currently supported ag-grid stylesheets.
const themes = [
  { Looker: 'ag-theme-looker' },
  { Balham: 'ag-theme-balham' },
  { Fresh: 'ag-theme-fresh' },
  { Dark: 'ag-theme-dark' },
  { Blue: 'ag-theme-blue' },
  { Bootstrap: 'ag-theme-bootstrap' },
];

const addCSS = link => {
  const linkElement = document.createElement('link');

  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', link);

  document.getElementsByTagName('head')[0].appendChild(linkElement);
};

// Load all ag-grid default style themes.
const loadStylesheets = () => {
  addCSS('https://unpkg.com/ag-grid-community/dist/styles/ag-grid.css');
  addCSS('https://4mile.github.io/ag_grid/ag-theme-looker.css');
  // XXX For development only:
  // addCSS('https://localhost:4443/ag-theme-looker.css');
  themes.forEach(theme => {
    const themeName = theme[Object.keys(theme)];
    if (themeName !== 'ag-theme-looker') {
      addCSS(`https://unpkg.com/ag-grid-community/dist/styles/${themeName}.css`);
    }
  });
};

// This is called from updateAsync once we are ready to display (prevents early
// displaying before CSS files have been downloaded and applied).
const hideOverlay = (vis, element, config) => {
  if (config.theme) {
    // const style = _.find(document.head.children, c => c.href && c.href.includes(config.theme));
    // if (style.sheet && vis.loadingGrid.parentNode === element) {
    //   element.removeChild(vis.loadingGrid);
    // }
    gridOptions.context.overlay = false;
  }
};


var gridOptions = {
  columnDefs: [],
  context: {
    overlay: true,
  },
};

looker.plugins.visualizations.add({
  options: options,

  create(element) {
    loadStylesheets();

    element.innerHTML = `
      <style>
        #ag-grid-vis {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .drillable-link {
          color: inherit;
          text-decoration: none;
        }
        .drillable-link:hover {
          text-decoration: underline;
        }
        #loading {
          background-color: #FFF;
          height: 100%;
          position: absolute;
          width: 100%;
          z-index: 1;
        }
      </style>
    `;

    this.loadingGrid = element.appendChild(document.createElement('div'));
    this.loadingGrid.id = 'loading';

    // Create an element to contain the grid.
    this.grid = element.appendChild(document.createElement('div'));
    this.grid.id = 'ag-grid-vis';

    this.grid.classList.add(defaultTheme);
    new agGrid.Grid(this.grid, gridOptions);
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    hideOverlay(this, element, config);
    // Clear errors and prune the DOM to be ready for new/updated table
    this.clearErrors();


    if (debug) {
      // console.log('data:');
      // console.log(JSON.stringify(data, null, 2));
      // console.log('config:');
      // console.log(JSON.stringify(config, null, 2));
      // console.log('queryResponse:');
      // console.log(JSON.stringify(queryResponse, null, 2));      
    }

    // for (var i = 0; i < queryResponse.fields.measures.length; i++) {
    //   console.log(JSON.stringify(queryResponse.fields.measures[i].name, null,2));
    //   console.log()
    // }

    // specify the columns
    var testColumnDefs = [
      {headerName: "Make", field: "make"},
      {headerName: "Model", field: "model"},
      {headerName: "Price", field: "price"}
    ];
    
    // specify the data
    var testRowData = [
      {make: "Toyota", model: "Celica", price: 35000},
      {make: "Ford", model: "Mondeo", price: 32000},
      {make: "Porsche", model: "Boxter", price: 72000}
    ];
    
    gridOptions.columnDefs = testColumnDefs;
    gridOptions.rowData = testRowData;

    gridOptions.api.sizeColumnsToFit();
    
    console.log('gridOptions:');
    console.log(gridOptions);

    console.log('element:');
    console.log(element);

    done();
  }
})
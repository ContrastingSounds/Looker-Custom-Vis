// import * as am4core from "@amcharts/amcharts4/core";
// import * as am4charts from "@amcharts/amcharts4/charts";
// import am4themes_animated from "@amcharts/amcharts4/themes/animated";

// SINGLE LINE TO ENTER INTO LOOKER ADMIN:
// https://www.amcharts.com/lib/4/core.js,https://www.amcharts.com/lib/4/charts.js,https://www.amcharts.com/lib/4/themes/animated.js

// Test the imports:
console.log(am4core)
console.log(am4themes_animated)

am4core.useTheme(am4themes_animated);


looker.plugins.visualizations.add({
  create: function(element, config) {
    this.container = element.appendChild(document.createElement("div"));
    this.container.id = 'amContainer';
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates:
    this.clearErrors();

    // Dump data and metadata to console:
    console.log('updateAsync() data', data)
    console.log('updateAsync() config', config)
    console.log('updateAsync() queryResponse', queryResponse)

    // get the names of the first dimension and measure available in data
    dimension = config.query_fields.dimensions[0].name;
    measure = config.query_fields.measures[0].name;

    // build data array for the chart, by iterating over the Looker data object
    let amData = [];
    for (let i = 0; i < data.length; i++) {
        row = data[i];
        amData.push({
          date: row[dimension].value, 
          value: row[measure].value,
        });
    }
    console.log('amChart data', amData)

    // chart building code copied directly from Elysium
    let chart = am4core.create("amContainer", am4charts.XYChart);
    chart.data = amData;

    let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.renderer.grid.template.location = 0;

    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.tooltip.disabled = true;
    valueAxis.renderer.minWidth = 35;

    let series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.dateX = "date";
    series.dataFields.valueY = "value";

    series.tooltipText = "{valueY.value}";
    chart.cursor = new am4charts.XYCursor();

    let scrollbarX = new am4charts.XYChartScrollbar();
    scrollbarX.series.push(series);
    chart.scrollbarX = scrollbarX;

    done();
  }
})  

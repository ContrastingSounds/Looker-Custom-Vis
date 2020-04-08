// import * as am4core from "@amcharts/amcharts4/core";
// import * as am4charts from "@amcharts/amcharts4/charts";
// import am4themes_animated from "@amcharts/amcharts4/themes/animated";

// SINGLE LINE TO ENTER INTO LOOKER ADMIN:
// https://www.amcharts.com/lib/4/core.js,https://www.amcharts.com/lib/4/charts.js,https://www.amcharts.com/lib/4/themes/animated.js

// Test the imports:
console.log(am4core)
console.log(am4themes_animated)



am4core.useTheme(am4themes_animated);

const buildAMChart = function(element) {  
  // do stuff
}

looker.plugins.visualizations.add({
  create: function(element, config) {
    this.container = element.appendChild(document.createElement("div"));
    this.container.id = 'amContainer';
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates.
    this.clearErrors();
    console.log('updateAsync() data', data)

    // var container = document.getElementById('amContainer')
    // container.textContent = JSON.stringify(data, null, 2)

    buildAMChart(element)
    
    done();
  }
})  

// let chart = am4core.create("chartdiv", am4charts.XYChart);
// chart.paddingRight = 20;

// let data = [];
// let visits = 10;
// for (let i = 1; i < 366; i++) {
//     visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
//     data.push({ date: new Date(2018, 0, i), name: "name" + i, value: visits });
// }

// chart.data = data;

// let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
// dateAxis.renderer.grid.template.location = 0;

// let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
// valueAxis.tooltip.disabled = true;
// valueAxis.renderer.minWidth = 35;

// let series = chart.series.push(new am4charts.LineSeries());
// series.dataFields.dateX = "date";
// series.dataFields.valueY = "value";

// series.tooltipText = "{valueY.value}";
// chart.cursor = new am4charts.XYCursor();

// let scrollbarX = new am4charts.XYChartScrollbar();
// scrollbarX.series.push(series);
// chart.scrollbarX = scrollbarX;
// 
const defaultTheme = `
    rect:hover {
        fill: orange;
    }
    
    #tooltip {
        position: absolute;
        width: auto;
        height: auto;
        padding: 5px;
        background-color: white;
        -webkit-border-radius: 4px;
        -moz-border-radius: 4px;
        border-radius: 4px;
        -webkit-box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
        -moz-box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
        box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
        pointer-events: none;
        font-family: sans-serif;
        font-size: 12px;
    }
    
    #tooltip.hidden {
        display: none;
    }
    
    #tooltip p {
        margin: 0;
        font-family: sans-serif;
        font-size: 12px;
        line-height: 15px;
    }

    .textdiv {
        font-family: "Open Sans",Helvetica,Arial,sans-serif;
        font-size: 12px;
        pointer-events: none;
        overflow: none;
        white-space: nowrap;
    }
`
const defaultHeaderColor = "orange";
const defaultCellColor = "AliceBlue";

const default_options = {
  showSubHeaders: {
    section: "Data",
    type: "boolean",
    label: "Show Sub Headers",
    default: "true"
  },
  // TODO: Implement Color By Cell Value
  // takeColorFromCellValue: {
  //   section: "Data",
  //   type: "boolean",
  //   label: "Color By Cell Value",
  //   default: "true"
  // },
  cellColor: {
    section: "Data",
    type: "array",
    display: "colors",
    label: "Color Palette",
    default: ["#62bad4", "#a9c574", "#929292", "#9fdee0", "#1f3e5a", "#90c8ae", "#92818d", "#c5c6a6", "#82c2ca", "#cee0a0", "#928fb4", "#9fc190"]
  },
  breadcrumbs: {
    type: "array",
    default: [],
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
  dumpTreeData: {
    section: "Debug",
    type: "boolean",
    label: "treemap",
    default: "false",
    display_size: "half",    
  },
};

const dumpToConsole = function(message, obj) {
    console.log(message, JSON.stringify(obj, null, 2));
}

const formatValue = function(number) {
    return parseInt(number);
}

const convertQueryDatasetToTreeData = function(data, queryResponse) {
    var vis_data = [];
    data.forEach(d => {
        var row = {};
        var idx = 0;
        row['metadata'] = {};
        for (var [key, value] of Object.entries(d)) {
            row[key] = value.value;

            if (idx < queryResponse.fields.dimension_like.length) {
                field_label = queryResponse.fields.dimension_like[idx].label_short;
            } else {
                field_label = queryResponse.fields.measure_like[idx - queryResponse.fields.dimension_like.length].label_short;
            }

            if (typeof value.rendered !== 'undefined') {
                var render = value.rendered
            } else {
                var render = value.value
            }
            row['metadata'][key] = {
                label: field_label,
                rendered: render,
                links: value.links,
            }
            idx += 1;
        }
        vis_data.push(row);
    });
    return vis_data;
}

const getHierarchyNames = function(queryResponse) {
    var hierarchy_names = [];
    queryResponse.fields.dimension_like.forEach(d => {
        hierarchy_names.push(d.name);
    });
    return hierarchy_names;
}

const getMeasureNames = function(queryResponse) {
    var measures = [];
    queryResponse.fields.measure_like.forEach(d => {
        measures.push(d.name);
    })
    return measures;
}

const getNewConfigOptions = function(dimensions, measures) {
    new_options = default_options;

    size_by_options = [];
    for (var i = 0; i < measures.length; i++) {
        option = {};
        // option[measures[i]] = i.toString();
        option[measures[i].label] = measures[i].name;
        size_by_options.push(option);
    }
    size_by_options.push({"Count of Rows (TBD)": "count_of_rows"});

    new_options["sizeBy"] = {
        section: "Data",
        type: "string",
        label: "Size By",
        display: "select",
        values: size_by_options,
        default: "0",
    }

    color_by_options = [];
    for (var i = 0; i < dimensions.length; i++) {
        option = {};
        option[dimensions[i].label] = dimensions[i].name;
        color_by_options.push(option)
    }
    color_by_options.push({"Color by Value (TBD)": "color_by_value"});

    new_options["colorBy"] = {
        section: "Data",
        type: "string",
        label: "Color By",
        display: "select",
        values: color_by_options,
        default: "0",
    }

    return new_options;
}

const vis = {
    options: default_options,

    create: function(element, config) {
        this.style = document.createElement('style');
        document.head.appendChild(this.style);

        this.container = d3.select(element)
            .append("div")
            .attr("id", "treemapContainer")

        this.tooltip = d3.select(element)
            .append("div")
            .attr("class", "hidden")
            .attr("id", "tooltip")
    },

    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();
        this.style.innerHTML = defaultTheme;

        if (config.dumpData) { dumpToConsole("data: ", data) }
        if (config.dumpConfig) { dumpToConsole("config: ", config) }
        if (config.dumpQueryResponse) { dumpToConsole("queryResponse: ", queryResponse) }

        const margin = {top: 20, right: 0, bottom: 0, left: 0};
        const chartWidth = element.clientWidth;
        const chartHeight = element.clientHeight - 16;

        const headerHeight = margin.top;
        const headerColor = defaultHeaderColor;
        const number_of_headers = 2;

        const dimensions = queryResponse.fields.dimension_like;
        const measures = queryResponse.fields.measure_like;
        
        new_options = getNewConfigOptions(dimensions, measures);
        vis.trigger("registerOptions", new_options);

        const vis_data = convertQueryDatasetToTreeData(data, queryResponse);
        const hierarchy_names = getHierarchyNames(queryResponse);
        const measure_names = getMeasureNames(queryResponse);
        const colorScale = d3.scaleOrdinal()
                           .range(config.cellColor);   

        // var current_branch;         

        var treemap = d3.treemap()
            .size([chartWidth, chartHeight])
            .padding((d) => {
                return d.depth === 1 ? 2 : 0
            })
            .paddingTop((d) => {
                if (config.showSubHeaders) {
                    return d.depth < number_of_headers ? 16 : 0
                } else {
                    return d.depth === 0 ? 16 : 0
                }
            })
            .round(true);

        const updateCurrentBranch = function(branch, keys) {
            if (keys.length === 0) {
                // returning final branch
                current_branch = branch;
            } else {
                var key = keys.shift();

                for (var value in branch.values) {
                    if (branch !== undefined) {
                        if (branch.values[value].key === key) {
                            branch = updateCurrentBranch(branch.values[value], keys);
                        }
                    }
                }
            };
        }

        const getSize = function(d) {
            if (config["sizeBy"] == "count_of_rows") {
                return !d.key ? 1 : 0;
            } else {
                let measure = config["sizeBy"];
                return parseFloat(d[measure]);    
            }
        }

        const getColor = function(d) {
            if (d.height === 0) {
                if (config.takeColorFromCellValue) {
                    return d.data[config["colorBy"]];
                } else {
                    return colorScale(d.data[config["colorBy"]]);
                }
            } else if (d.depth === 0) {
                return headerColor;
            } else {
                return defaultCellColor;
            }
        }

        const getCellText = function(d) {
            if (d.depth === 0) {
                display_value = formatValue(d.value);
                if (config.breadcrumbs.length === 0) {
                    cell_string = "Top Level (" + display_value + ") – click on cells to zoom in, or click on this bar to zoom out"; 
                } else {
                    cell_string = config.breadcrumbs.join(" – ") + " (" + display_value + ")";
                }
                
            } else if (d.depth < number_of_headers && config.showSubHeaders) {
                display_value = formatValue(d.value);
                if (typeof d.data.key === 'undefined') {
                    cell_string = display_value ;
                } else {
                    cell_string = d.data.key + " (" + display_value + ")";
                }
            } else if (d.height === 0) {
                if (config["sizeBy"] === "count_of_rows") {
                    cell_string = "1";
                } else {
                    cell_string = d.data.metadata[config["sizeBy"]].rendered;                    
                }
            } else {
                cell_string = "";
            }

            return cell_string
        }

        const getTooltip = function(d) {
            var tiptext = "";
            if (d.height === 0) {
                for (var prop in hierarchy_names) {
                    var metadata = d.data.metadata[hierarchy_names[prop]];
                    tiptext += "<p><em>" + metadata.label + ":</em> " + metadata.rendered + "</p>";
                }
                tiptext += '<br>'
                for (var measure in measures) {
                    var metadata = d.data.metadata[measure_names[measure]];
                    tiptext += "<p><em>" + metadata.label + ":</em> " + metadata.rendered + "</p>";
                }
            } else {
                tiptext += d.data.key;
            };
            
            return tiptext;
        }

        const createTreemap = function(data) {
            var nested_data = d3.nest();
            dimensions.forEach(dim => 
                nested_data = nested_data.key(d => d[dim.name]));
            nested_data = nested_data.entries(data);
            nested_data = {
                "key": "root",
                "values": nested_data,
            }

            var root = treemap(
                d3.hierarchy(nested_data, d => d.values)
                  .sum(d => getSize(d))
                  .sort(function(a, b) {return b.height - a.height || getSize(b) - getSize(a)})
            );

            const displayChart = function(d) {
                d3.select("#treemapSVG").remove();

                var svg = d3.select("#treemapContainer")
                            .append("svg")
                            .attr("id", "treemapSVG")
                            .attr("width", chartWidth)
                            .attr("height", chartHeight);

                var treemapArea = svg.append("g")
                    .datum(d)
                    .attr("class", "treemapArea");

                var treemapCells = treemapArea.selectAll("g")
                    .data(root.descendants())
                    .enter()

                treemapCells.append("rect")
                    .attr("x", d => d.x0)
                    .attr("y", d => d.y0)
                    .attr("width", d => Math.max(0, d.x1 - d.x0))
                    .attr("height", d => Math.max(0, d.y1 - d.y0))
                    .attr("fill", d => getColor(d))
                    .attr("stroke", defaultCellColor)

                    .on("mouseover", function(d) {
                        //Get this bar's x/y values, then augment for the tooltip
                        var xPosition = parseFloat(d3.select(this).attr("x")) + 50;
                        var yPosition = parseFloat(d3.select(this).attr("y")) + 50;

                        //Update the tooltip position and value
                        d3.select("#tooltip")
                            .style("left", xPosition + "px")
                            .style("top", yPosition + "px")                   
                            .html(getTooltip(d));

                        //Show the tooltip
                        d3.select("#tooltip").classed("hidden", false);
                    })
                    .on("mouseout", function() {
                        //Hide the tooltip
                        d3.select("#tooltip").classed("hidden", true);
                    })

                    .on("click", zoom)

                treemapCells.append("foreignObject")
                    .attr("x", d => d.x0 + 3)
                    .attr("y", d => d.y0)
                    .attr("width", d => Math.max(0, d.x1 - d.x0 - 3))
                    .attr("height", d => Math.max(0, d.y1 - d.y0))
                    .attr("fill", '#bbbbbb')
                    .attr("class", "foreignobj")
                    .attr("pointer-events", "none")
                    .attr("white-space", "nowrap")
                  .append("xhtml:div")
                    .html(d => getCellText(d))
                    .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS
            
                function zoom(d) {
                    if (d.depth === 0) {
                        if (config.breadcrumbs.length === 0) {
                            // zoom cancelled, already at root node
                        } else {
                            config.breadcrumbs.pop();
                            // zoom up
                            updateCurrentBranch(nested_data, config.breadcrumbs.slice(0));

                            root = treemap(d3.hierarchy(current_branch, d => d.values)
                                .sum(d => getSize(d)))
                            displayChart(root);
                        }
                    } else {
                        while (d.depth > 1) {
                            d = d.parent;
                        }
                        config.breadcrumbs.push(d.data.key);
                        // zoom down
                        root = treemap(d3.hierarchy(d.data, d => d.values)
                            .sum(d => getSize(d))
                        );
                        
                        displayChart(root);
                    }
                }
            }

            displayChart(root);
        }
        
        createTreemap(vis_data);
        done();
    }
};

looker.plugins.visualizations.add(vis);
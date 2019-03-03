
defaultTheme = `
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
    }
`

convertQueryDatasetToVisData = function(data, queryResponse) {
    var vis_data = [];
    data.forEach(d => {
        var row = {};
        for (var [key, value] of Object.entries(d)) {
            row[key] = value.value;
        }
        vis_data.push(row);
    });
    return vis_data;
}

getHierarchy = function(queryResponse) {
    var hierarchy = [];
    queryResponse.fields.dimension_like.forEach(d => {
        hierarchy.push(d.name);
    });
    return hierarchy;
}

getMeasures = function(queryResponse) {
    var measures = [];
    queryResponse.fields.measure_like.forEach(d => {
        measures.push(d.name);
    })
    return measures;
}

looker.plugins.visualizations.add({
    options: {
      use_grouping: {
        section: "Data",
        type: "boolean",
        label: "Placeholder Option",
        default: "true"
      },
    },

    create: function(element, config) {
        console.log("create() called");
        this.style = document.createElement('style');
        document.head.appendChild(this.style);
        // var container = element.appendChild(document.createElement("div"));
        // container.id = "treemapContainer";

        this.container = d3.select(element)
            .append("div")
            .attr("id", "treemapContainer")

        this.tooltip = d3.select(element)
            .append("div")
            .attr("class", "hidden")
            .attr("id", "tooltip")
    },

    updateAsync: function(data, element, config, queryResponse, details, done) {
        console.log("updateAsync() called");
        this.clearErrors();
        this.style.innerHTML = defaultTheme;
        console.log("data", data);
        console.log("queryResponse", queryResponse);

        var vis = this;

        var margin = {top: 20, right: 0, bottom: 0, left: 0};
        var chartWidth = element.clientWidth;
        var chartHeight = element.clientHeight - 16;

        var headerHeight = margin.top;
        var headerColor = "orange";
        var number_of_headers = 2;

        var breadcrumbs = [];
        var current_branch;

        var dimensions = queryResponse.fields.dimension_like;
        var measures = queryResponse.fields.measure_like;

        vis_data = convertQueryDatasetToVisData(data, queryResponse);
        console.log("Treemap Data", vis_data);

        var hierarchy = getHierarchy(queryResponse);
        console.log("Hierarchy", hierarchy);

        var measures = getMeasures(queryResponse);
        console.log("Measures", measures);

        var color = d3.scaleOrdinal(d3.schemeCategory20);

        var treemap = d3.treemap()
            .size([chartWidth, chartHeight])
            .padding((d) => {
                return d.depth === 1 ? 2 : 0
            })
            .paddingTop((d) => {
                return d.depth < number_of_headers ? 16 : 0
            })
            .round(true);

        var update_current_branch = function(branch, keys) {
            if (keys.length === 0) {
                console.log("...returning final branch", branch);
                current_branch = branch;
            } else {
                var key = keys.shift();

                for (var value in branch.values) {
                    if (branch !== undefined) {
                        if (branch.values[value].key === key) {
                            branch = update_current_branch(branch.values[value], keys);
                        }
                    }
                }
            };
        }

        var get_size = function(d) {
            return parseFloat(d[measures[0]]);
        }

        var get_color = function(d) {
            if (d.height === 0) {
                if (d.data["products.category"] === "Shorts") {
                    return "red";
                } else if (d.data["products.category"] === "Plus") {
                    return "yellow";
                } else {
                    return "green";
                }
            } else if (d.depth === 0) {
                return headerColor;
            } else {
                return "lightgrey";
            }
        }

        var get_cell_text = function(d) {
            if (d.depth === 0) {
                if (breadcrumbs.length === 0) {
                    cell_string = " – click on header cells to zoom in – "    
                } else {
                    cell_string = breadcrumbs.join(" – ")
                }
                
            } else if (d.depth < number_of_headers) {
                cell_string = d.data.key;
            } else if (d.height === 0) {
                // TODO: Replace with dynamic label
                cell_string = d.data["products.item_name"];
            } else {
                cell_string = "";
            }

            return cell_string
        }

        var get_tooltip = function(d) {
            var tiptext = "";
            if (d.height === 0) {
                for (var prop in hierarchy) {
                    tiptext += "<p><em>" + hierarchy[prop] + ":</em> " + d.data[hierarchy[prop]] + "</p>";
                }

                for (var measure in measures) {
                    tiptext += "<p><em>" + measures[measure] + ":</em> " + d.data[measures[measure]] + "</p>";
                }
            } else {
                tiptext += d.data.key;
            };
            
            return tiptext;
        }

        var create_treemap = function(data) {
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
                  .sum(d => get_size(d))
            );

            display_chart(root);

            function display_chart(d) {
                console.log("Displaying chart for", d.data.key);
                console.log("Current breadcrumbs:", breadcrumbs);
                console.log("Current treemap:", d);

                d3.select("#treemapSVG").remove();

                var svg = d3.select("#treemapContainer")
                            .append("svg")
                            .attr("id", "treemapSVG")
                            .attr("width", chartWidth)
                            .attr("height", chartHeight);

                // svg.selectAll("*")
                //     .remove();

                var treemapArea = svg.append("g")
                    .datum(d)
                    .attr("class", "treemapArea");

                var treemapCells = treemapArea.selectAll("g")
                    .data(root.descendants())
                    .enter()

                treemapCells.append("rect")
                    .attr("x", d => d.x0)
                    .attr("y", d => d.y0)
                    .attr("width", d => d.x1 - d.x0)
                    .attr("height", d => d.y1 - d.y0)
                    .attr("fill", d => get_color(d))
                    .attr("stroke", "lightgrey")

                    .on("mouseover", function(d) {
                        //Get this bar's x/y values, then augment for the tooltip
                        var xPosition = parseFloat(d3.select(this).attr("x")) + 50;
                        var yPosition = parseFloat(d3.select(this).attr("y")) + 50;

                        //Update the tooltip position and value
                        d3.select("#tooltip")
                            .style("left", xPosition + "px")
                            .style("top", yPosition + "px")                     
                            .html(get_tooltip(d));
                   
                        //Show the tooltip
                        d3.select("#tooltip").classed("hidden", false);
                    })
                    .on("mouseout", function() {
                        //Hide the tooltip
                        d3.select("#tooltip").classed("hidden", true);
                    })

                    .on("click", zoom)

                treemapCells.append("foreignObject")
                    .attr("x", d => d.x0 + 5)
                    .attr("y", d => d.y0)
                    .attr("width", d => d.x1 - d.x0 - 5)
                    .attr("height", d => d.y1 - d.y0)
                    .attr("fill", '#bbbbbb')
                    .attr("class", "foreignobj")
                    .attr("pointer-events", "none")
                  .append("xhtml:div")
                    .html(d => get_cell_text(d))
                    .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS
            
                function zoom(d) {
                    if (d.height === 0 ) {
                        console.log("leaf node – no zoom required");
                    } else if (d.depth === 0) {
                        console.log("zoom up called for");
                        if (breadcrumbs.length === 0) {
                            console.log("zoom cancelled, already at root node")
                        } else {
                            breadcrumbs.pop();
                            console.log("zoom up to (breadcrumbs):", breadcrumbs);
                            
                            update_current_branch(nested_data, breadcrumbs.slice(0));
                            console.log("current_branch:", current_branch);

                            root = treemap(d3.hierarchy(current_branch, d => d.values)
                                .sum(d => get_size(d)))
                            display_chart(root);
                        }
                    } else {
                        // TODO: support for drilling down multiple levels at a time
                        breadcrumbs.push(d.data.key);
                        console.log("zoom down to (breadcrumbs):", breadcrumbs);
                        root = treemap(d3.hierarchy(d.data, d => d.values)
                            .sum(d => get_size(d))
                        );
                        
                        display_chart(root);
                    }
                }
            }
        }
        
        create_treemap(vis_data);
        done();
    }
});

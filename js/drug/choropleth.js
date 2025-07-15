window.renderChoropleth = function(data, geoData) {
  const margin = SHARED_CONSTANTS.defaultMargin;
  const width = SHARED_CONSTANTS.defaultWidth - margin.left - margin.right;
  const height = SHARED_CONSTANTS.defaultHeight - margin.top - margin.bottom;

  const container = d3.select("#choropleth");
  container.html(""); // clear previous

  const years = Array.from(new Set(data.map(d => d.YEAR))).sort();
  let currentYear = years[0];

  // Define updateMap function
  const updateMap = (year) => {
    currentYear = year;

    const yearData = data.filter(d => d.YEAR === year);
    const totalMap = {};
    yearData.forEach(d => {
      totalMap[d.JURISDICTION] = +d.COUNT;
    });

    const maxVal = d3.max(Object.values(totalMap));
    colorScale.domain([0, maxVal]);

    window.selectedState = window.selectedState || null;

    g.selectAll("path.state")
      .data(geoData.features)
      .join("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", d => {
        const state = d.properties.STATE_NAME;
        const code = stateNameToCode[state] || state;
        const val = totalMap[code];
        return val ? colorScale(val) : "#ccc";
      })
      .attr("stroke", d => {
        const state = d.properties.STATE_NAME;
        const code = stateNameToCode[state] || state;
        return code === window.selectedState ? "#000" : "none";
      })
      .attr("stroke-width", d => {
        const state = d.properties.STATE_NAME;
        const code = stateNameToCode[state] || state;
        return code === window.selectedState ? 1.3 : null;
      })
      .attr("filter", d => {
        const state = d.properties.STATE_NAME;
        const code = stateNameToCode[state] || state;
        return code === window.selectedState ? "drop-shadow(0 0 6px #fff)" : null;
      })
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        const state = d.properties.STATE_NAME;
        const code = stateNameToCode[state] || state;
        
        window.selectedState = code;
        
        g.selectAll("path.state")
          .classed("selected", d => {
            const stateName = d.properties.STATE_NAME;
            const stateCode = stateNameToCode[stateName] || stateName;
            return stateCode === window.selectedState;
          });
        
        const filters = {
          year: d3.select("#year-filter").property("value"),
          ageGroup: d3.select("#age-filter").property("value"),
          location: d3.select("#location-filter").property("value"),
          jurisdiction: code
        };
        
        if (window.updateJurisdictionCharts) {
          window.updateJurisdictionCharts(code, filters);
        }
      })
      .on("mouseover", function(event, d) {
        const state = d.properties.STATE_NAME;
        const code = stateNameToCode[state] || state;
        
        d3.select(this).classed("hover", true);
        
        const yearData = data.filter(d => d.YEAR === currentYear && d.JURISDICTION === code);
        const positiveData = window.sharedData.positiveData.filter(d => d.YEAR === currentYear && d.JURISDICTION === code);
        
        let totalTests = d3.sum(yearData, d => +d.COUNT || 0);
        const positiveTests = d3.sum(positiveData, d => +d.COUNT || 0);
        
        if (totalTests === 0 && positiveTests > 0) {
          totalTests = positiveTests;
        }

        const content = window.createTooltipContent(
            `${code} (${currentYear})`,
            [
                {
                    label: "Total Tests",
                    value: SHARED_CONSTANTS.formatters.comma(totalTests),
                    color: "#42bcf5"
                },
                {
                    label: "Positive Tests",
                    value: SHARED_CONSTANTS.formatters.comma(positiveTests),
                    color: "#ff7f0e"
                }
            ]
        );
        window.showTooltip(event, content);
      })
      .on("mouseout", function() {
        d3.select(this).classed("hover", false);
        window.hideTooltip();
      });

    // Add jurisdiction labels
    g.selectAll("text")
      .data(geoData.features)
      .join("text")
      .attr("x", d => path.centroid(d)[0])
      .attr("y", d => path.centroid(d)[1])
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", "15px")
      .attr("font-family", "Roboto, Arial, sans-serif")
      .attr("font-weight", 400)
      .attr("stroke", "#000")
      .attr("fill", "#fff")
      .attr("stroke-width", 2)
      .attr("paint-order", "stroke")
      .text(d => stateNameToCode[d.properties.STATE_NAME] || d.properties.STATE_NAME);
  };

  // Create the year slider
  currentYear = window.createChoroplethYearSlider(data, container, updateMap);

  // Set up color scale
  const initialYearData = data.filter(d => d.YEAR === currentYear);
  const initialTotalMap = {};
  initialYearData.forEach(d => {
    initialTotalMap[d.JURISDICTION] = +d.COUNT;
  });
  const initialMaxVal = d3.max(Object.values(initialTotalMap));
  const colorScale = d3.scaleSequential(SHARED_CONSTANTS.colorScales.blueGradient);
  colorScale.domain([0, initialMaxVal]);

  const stateNameToCode = SHARED_CONSTANTS.jurisdictionNameToCode;

  // Create SVG
  const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")
    .style("margin", "0 auto");

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      zoomG.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Add zoom controls
  const zoomControls = container.append("div")
    .style("position", "absolute")
    .style("top", "10px")
    .style("left", "10px")
    .style("z-index", "1000");

  zoomControls.append("button")
    .text("+")
    .style("width", "30px")
    .style("height", "30px")
    .style("margin", "2px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("background", "white")
    .style("cursor", "pointer")
    .on("click", () => {
      svg.transition()
        .duration(300)
        .call(zoom.scaleBy, 1.3);
    });

  zoomControls.append("button")
    .text("-")
    .style("width", "30px")
    .style("height", "30px")
    .style("margin", "2px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("background", "white")
    .style("cursor", "pointer")
    .on("click", () => {
      svg.transition()
        .duration(300)
        .call(zoom.scaleBy, 0.7);
    });

  zoomControls.append("button")
    .text("Reset")
    .style("width", "60px")
    .style("height", "30px")
    .style("margin", "2px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("background", "white")
    .style("cursor", "pointer")
    .on("click", () => {
      svg.transition()
        .duration(300)
        .call(zoom.transform, d3.zoomIdentity);
    });

  // Create a group for all zoomable elements
  const zoomG = svg.append("g");

  const g = zoomG.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const projection = d3.geoMercator().fitSize([width, height], geoData);
  const path = d3.geoPath().projection(projection);

  // Initial draw
  updateMap(currentYear);

  // Add legend
  const legendWidth = 600;
  const legendHeight = 24;
  const legendSvg = container.append("svg")
    .attr("width", legendWidth + 40)
    .attr("height", 60)
    .style("display", "block")
    .style("margin", "10px auto 0 auto")
    .style("position", "relative")
    .style("z-index", "1000")
    .style("stroke", "none");

  const legendG = legendSvg.append("g")
    .attr("transform", "translate(20,10)");

  const defs = legendSvg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient");

  linearGradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.01))
    .join("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => colorScale(d * colorScale.domain()[1]));

  legendG.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  const legendScale = d3.scaleLinear()
    .domain([0, 170000])
    .range([0, legendWidth]);    

  const axisG = legendG.append("g")
    .attr("transform", `translate(0,${legendHeight})`)
    .call(d3.axisBottom(legendScale)
      .tickValues([0, 20000, 50000, 100000, 150000])
      .tickFormat(d3.format(","))
      .tickSizeOuter(0)
    );
    
  axisG.select(".domain").remove();
  axisG.selectAll(".tick line").attr("stroke", "#ccc");
  axisG.selectAll(".tick text")
    .attr("fill", "#666")
    .style("font-size", "12px");
};
window.renderPositiveDrugBarChart = function(data) {
  const margin = SHARED_CONSTANTS.defaultMargin;
  const width = SHARED_CONSTANTS.defaultWidth - margin.left - margin.right - 228;
  const height = SHARED_CONSTANTS.defaultHeight - margin.top - margin.bottom - 250;

  const container = d3.select("#positive-drug-bar-chart");
  container.html("");
  const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Always show the intro when rendering or updating the chart
  d3.select("#bar-intro").style("display", "block");

  window.updatePositiveDrugBarChart = function(filters = {}) {
    svg.selectAll("*").remove();
    // Always show the intro when updating the chart
    d3.select("#bar-intro").style("display", "block");

    // Filter the data based on current filters
    let filteredData = data;
    if (filters.year && filters.year !== "") filteredData = filteredData.filter(d => d.YEAR == filters.year);
    if (filters.ageGroup && filters.ageGroup !== "") filteredData = filteredData.filter(d => d.AGE_GROUP === filters.ageGroup);
    if (filters.location && filters.location !== "") filteredData = filteredData.filter(d => d.LOCATION === filters.location);
    if (filters.jurisdiction && filters.jurisdiction !== "") filteredData = filteredData.filter(d => d.JURISDICTION === filters.jurisdiction);

    // Aggregate
    let xDomain, totals;
    if (filters.jurisdiction && filters.jurisdiction !== "") {
      totals = d3.rollup(filteredData, v => d3.sum(v, d => +d.COUNT || 0), d => d.YEAR);
      xDomain = Array.from(totals.keys()).sort((a, b) => a - b);
    } else {
      totals = d3.rollup(filteredData, v => d3.sum(v, d => +d.COUNT || 0), d => d.JURISDICTION);
      xDomain = Array.from(totals.keys()).sort();
    }
    const values = Array.from(totals.values());
    let maxValue = d3.max(values) || 0;
    if (maxValue === 0) maxValue = 1;

    // Scales
    const x = d3.scaleBand().domain(xDomain).range([0, width]).padding(xDomain.length === 1 ? 0.8 : 0.2);
    const y = d3.scaleLinear().domain([0, maxValue]).nice().range([height, 0]);

    // Y axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => d === 0 ? "0" : d >= 1000 ? (d / 1000) + "k" : d.toString()))
      .selectAll("text").style("font-size", "14px");

    // Background for deselecting bars
    svg.append("rect")
      .attr("class", "bar-bg-reset")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("click", function() {
        selectedBar = null;
        svg.selectAll(".bar-rect")
          .transition().duration(200)
          .attr("fill", "rgb(5, 40, 91)")
          .attr("opacity", 1);
        svg.selectAll(".bar-label")
          .transition().duration(200)
          .style("opacity", 1);
        if (window.onBarChartDeselection) window.onBarChartDeselection(filters);
      });

    let selectedBar = null;

    // Bars
    const bars = svg.selectAll("rect.bar-rect")
      .data(Array.from(totals))
      .join("rect")
      .attr("class", "bar-rect")
      .attr("x", d => x(d[0]))
      .attr("y", height)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", "rgb(5, 40, 91)")
      .attr("stroke", "none")
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        const clickedValue = d[0];
        selectedBar = clickedValue;
        svg.selectAll(".bar-rect")
          .transition().duration(200)
          .attr("fill", barData => barData[0] === clickedValue ? "rgb(5, 40, 91)" : "rgb(100, 120, 150)")
          .attr("opacity", barData => barData[0] === clickedValue ? 1 : 0.6);
        svg.selectAll(".bar-label")
          .transition().duration(200)
          .style("opacity", labelData => labelData[0] === clickedValue ? 1 : 0.4);
        if (window.onBarChartSelection) {
          const selectedType = (filters.jurisdiction && filters.jurisdiction !== "") ? 'year' : 'jurisdiction';
          window.onBarChartSelection(clickedValue, selectedType, filters);
        }
      })
      .on("mouseover", function(event, d) {
        const element = d3.select(this);
        const currentFill = element.attr("fill");
        const barValue = d[0];
        if (currentFill !== "rgb(100, 120, 150)" && barValue !== selectedBar) {
          element.transition().duration(200).attr("fill", "rgb(0, 60, 136)");
        }
      })
      .on("mouseout", function(event, d) {
        const element = d3.select(this);
        const barValue = d[0];
        let correctFill, correctOpacity;
        if (barValue === selectedBar) {
          correctFill = "rgb(5, 40, 91)";
          correctOpacity = 1;
        } else if (selectedBar !== null) {
          correctFill = "rgb(100, 120, 150)";
          correctOpacity = 0.6;
        } else {
          correctFill = "rgb(5, 40, 91)";
          correctOpacity = 1;
        }
        // Only transition if the state is different
        if (element.attr("fill") !== correctFill || +element.attr("opacity") !== correctOpacity) {
          element.transition().duration(200).attr("fill", correctFill).attr("opacity", correctOpacity);
        }
      });

    // Ensure initial state matches mouseout expectations
    bars.attr("fill", d => {
      if (selectedBar === null) return "rgb(5, 40, 91)";
      return d[0] === selectedBar ? "rgb(5, 40, 91)" : "rgb(100, 120, 150)";
    })
    .attr("opacity", d => {
      if (selectedBar === null) return 1;
      return d[0] === selectedBar ? 1 : 0.6;
    });

    bars.transition().duration(800)
      .attr("y", d => y(d[1]))
      .attr("height", d => height - y(d[1]));

    // Value labels
    svg.selectAll(".bar-label")
      .data(Array.from(totals))
      .join("text")
      .attr("class", "bar-label")
      .attr("x", d => x(d[0]) + x.bandwidth() / 2)
      .attr("y", d => y(d[1]) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "#333")
      .style("opacity", 0)
      .text(d => d[1] > 0 ? SHARED_CONSTANTS.formatters.comma(d[1]) : "")
      .transition().delay(400).duration(400).style("opacity", 1);

    // X-axis
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => {
        if (filters.jurisdiction) return d;
        return Array.from(totals.keys()).includes(d) ? d : "";
      }));
    xAxis.selectAll("text")
      .style("font-size", "14px")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Axis labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 60)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(filters.jurisdiction ? "Year" : "Jurisdiction");
    svg.append("text")
      .attr("x", -height / 2)
      .attr("y", -45)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Total Positive Drug Tests");

    // Subtitle
    let filterText = "All Data";
    const activeFilters = [];
    if (filters.year && filters.year !== "") activeFilters.push(`Year: ${filters.year}`);
    if (filters.ageGroup && filters.ageGroup !== "") activeFilters.push(`Age: ${filters.ageGroup}`);
    if (filters.location && filters.location !== "") activeFilters.push(`Location: ${filters.location}`);
    if (filters.jurisdiction && filters.jurisdiction !== "") activeFilters.push(`Jurisdiction: ${filters.jurisdiction}`);
    if (activeFilters.length > 0) filterText = activeFilters.join(" | ");
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#666")
      .text(`Filters: ${filterText}`);
  };

  // Initial render
  window.updatePositiveDrugBarChart({});
};
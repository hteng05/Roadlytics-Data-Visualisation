window.attachChoroplethInteractions = function(selection, path, stateNameToCode, currentYear) {
  selection
    .on("mouseover", function(event, d) {
      d3.select(this)
        .attr("stroke", "#000")
        .attr("stroke-width", 1.3)
        .attr("filter", "drop-shadow(0 0 6px #fff)");

      const state = d.properties.STATE_NAME;
      const code = stateNameToCode[state] || state;

      if (window.showDrugTooltipChart) {
        window.showDrugTooltipChart(code, [event.pageX, event.pageY], currentYear);
      }
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("stroke", "none")
        .attr("stroke-width", null)
        .attr("filter", null);

      d3.select("#tooltip-linechart").style("display", "none");
  });
};

window.createChoroplethYearSlider = function(data, container, updateCallback) {
  // Slider (above the map)
  const slider = container.append("div")
    .style("margin", "0 auto 20px auto")
    .style("width", "350px")
    .style("text-align", "center");

  slider.append("label")
    .attr("for", "year-slider")
    .style("margin-right", "10px")
    .text("Year:");

  const years = Array.from(new Set(data.map(d => d.YEAR))).sort();
  let currentYear = years[0];

  slider.append("input")
    .attr("type", "range")
    .attr("id", "year-slider")
    .attr("min", 0)
    .attr("max", years.length - 1)
    .attr("value", 0)
    .style("width", "200px")
    .on("input", function() {
      const index = +this.value;
      const selectedYear = years[index];
      updateCallback(selectedYear);
      d3.select("#slider-year-label").text(selectedYear);
    });

  slider.append("span")
    .attr("id", "slider-year-label")
    .style("margin-left", "10px")
    .text(currentYear);

  return currentYear;
};

window.createDrugDropdowns = function(_, positiveData) {
// Extract options from positiveData only
const years = Array.from(new Set(positiveData.map(d => d.YEAR))).sort();
const ageGroups = Array.from(new Set(positiveData.map(d => d.AGE_GROUP).filter(d => d))).sort();
const locations = Array.from(new Set(positiveData.map(d => d.LOCATION).filter(d => d))).sort();
const jurisdictions = Array.from(new Set(positiveData.map(d => d.JURISDICTION).filter(d => d))).sort();

function populateDropdown(id, options) {
    const select = d3.select(`#${id}`);
    select.selectAll("option").remove();
    select.append("option").attr("value", "").text("All");
    select.selectAll("option.option")
    .data(options)
    .join("option")
    .attr("class", "option")
    .attr("value", d => d)
    .text(d => d);
}

populateDropdown("year-filter", years);
populateDropdown("age-filter", ageGroups);
populateDropdown("location-filter", locations);
populateDropdown("jurisdiction-filter", jurisdictions);

// Enhanced event listener with better filtering
d3.selectAll("#drug-filters select").on("change", function() {
    const filters = {
        year: d3.select("#year-filter").property("value"),
        ageGroup: d3.select("#age-filter").property("value"),
        location: d3.select("#location-filter").property("value"),
        jurisdiction: d3.select("#jurisdiction-filter").property("value"),
    };

    console.log("Filter values:", filters);
    
    // Update all drug-related charts
    if (window.updateDrugCharts) {
        window.updateDrugCharts(filters);
    }
    
    // Also update the bar chart directly if the function exists
    if (window.updatePositiveDrugBarChart) {
        window.updatePositiveDrugBarChart(filters);
    }
});
};

// Enhanced updateDrugCharts function
window.updateDrugCharts = function(filters) {
console.log("Filters changed:", filters);

// Update the positive drug bar chart
if (window.updatePositiveDrugBarChart) {
    window.updatePositiveDrugBarChart(filters);
}

// Update the jurisdiction line chart
if (window.updateJurisdictionLineChart) {
    window.updateJurisdictionLineChart(filters);
}
};

// Utility function to get current filter values
window.getCurrentDrugFilters = function() {
return {
    year: d3.select("#year-filter").property("value"),
    ageGroup: d3.select("#age-filter").property("value"),
    location: d3.select("#location-filter").property("value"),
    jurisdiction: d3.select("#jurisdiction-filter").property("value"),
};
};

// Function to reset all filters
window.resetDrugFilters = function() {
d3.select("#year-filter").property("value", "");
d3.select("#age-filter").property("value", "");
d3.select("#location-filter").property("value", "");
d3.select("#jurisdiction-filter").property("value", "");

// Trigger update with empty filters
if (window.updateDrugCharts) {
    window.updateDrugCharts({});
}
};

// Enhanced tooltip functionality for drug charts
window.showDrugBarTooltip = function(event, data) {
const tooltip = d3.select("body").selectAll(".drug-bar-tooltip")
    .data([1])
    .join("div")
    .attr("class", "drug-bar-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "white")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("font-size", "13px")
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)");

const content = `
    <strong>${data.jurisdiction}</strong><br/>
    Positive Tests: ${SHARED_CONSTANTS.formatters.comma(data.count)}<br/>
    <span style="font-size: 11px; color: #ccc;">Click for details</span>
`;

tooltip
    .html(content)
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 10) + "px")
    .style("opacity", 1);
};

window.hideDrugBarTooltip = function() {
d3.select(".drug-bar-tooltip").style("opacity", 0);
};
// Seatbelt specific interactions
window.createSeatbeltFilters = function(seatbeltData) {
  const years = [...new Set(seatbeltData.map(d => d.YEAR))].sort();
  const ageGroups = [...new Set(seatbeltData.map(d => d.AGE_GROUP).filter(d => d))].sort();
  const jurisdictions = [...new Set(seatbeltData.map(d => d.JURISDICTION).filter(d => d))].sort();
  
  function populateDropdown(id, options) {
      const select = d3.select(`#${id}`);
      select.selectAll("option.data-option").remove();
      select.selectAll("option.data-option")
          .data(options)
          .join("option")
          .attr("class", "data-option")
          .attr("value", d => d)
          .text(d => d);
  }
  
  populateDropdown("sb-year-filter", years);
  populateDropdown("sb-age-filter", ageGroups);
  populateDropdown("sb-jurisdiction-filter", jurisdictions);
  
  d3.selectAll("#section2-seatbelt select").on("change", () => {
      const filters = {
          year: d3.select("#sb-year-filter").property("value"),
          ageGroup: d3.select("#sb-age-filter").property("value"),
          jurisdiction: d3.select("#sb-jurisdiction-filter").property("value"),
          detectionMethod: d3.select("#sb-detection-filter").property("value")
      };
      
      if (window.seatbeltDashboard) {
          window.seatbeltDashboard.activeFilters = filters;
          window.seatbeltDashboard.updateAllCharts();
      }
  });
};

window.updateSeatbeltCharts = function(filters) {
  if (window.seatbeltDashboard) {
      window.seatbeltDashboard.activeFilters = filters;
      window.seatbeltDashboard.updateAllCharts();
  }
};

// Enhanced tooltip functionality for seatbelt charts
window.showSeatbeltTooltip = function(event, data, type) {
  const tooltip = d3.select("#seatbelt-tooltip");
  let content = '';

  switch(type) {
      case 'stacked-bar':
          content = `
              <strong>${data.jurisdiction}</strong><br/>
              Detection Method: ${data.method}<br/>
              Fines: ${SHARED_CONSTANTS.formatters.comma(data.fines)}
          `;
          break;
      case 'line-chart':
          content = `
              <strong>${data.jurisdiction}</strong><br/>
              Year: ${data.year}<br/>
              Total Fines: ${SHARED_CONSTANTS.formatters.comma(data.fines)}
          `;
          break;
      case 'pie-chart':
          content = `
              <strong>${data.method}</strong><br/>
              Fines: ${SHARED_CONSTANTS.formatters.comma(data.fines)}<br/>
              Percentage: ${(data.percentage * 100).toFixed(1)}%
          `;
          break;
  }

  tooltip
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px")
      .style("opacity", 1)
      .html(content);
};

window.hideSeatbeltTooltip = function() {
  d3.select("#seatbelt-tooltip")
      .style("opacity", 0);
};

// Animation helpers for seatbelt charts
window.animateSeatbeltChart = function(selection, delay = 0) {
  selection
      .style("opacity", 0)
      .transition()
      .delay((d, i) => delay + i * 50)
      .duration(800)
      .style("opacity", 1);
};

window.highlightSeatbeltElement = function(element) {
  d3.select(element)
      .transition()
      .duration(200)
      .attr("stroke", "#333")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");
};

window.unhighlightSeatbeltElement = function(element) {
  d3.select(element)
      .transition()
      .duration(200)
      .attr("stroke", "none")
      .attr("stroke-width", null)
      .style("filter", null);
};

window.createCrashFilters = function(drugConsequenceData, seatbeltData, positiveData) {
// Extract and normalize years for crash charts, only years >= 2019
const years = [...new Set([
    ...drugConsequenceData.map(d => +d.Year || +d.YEAR).filter(y => y && !isNaN(y)),
    ...seatbeltData.map(d => +d.Year || +d.YEAR).filter(y => y && !isNaN(y)),
    ...positiveData.map(d => +d.Year || +d.YEAR).filter(y => y && !isNaN(y))
])].filter(y => y >= 2019).sort((a, b) => a - b);

const ageGroups = [...new Set([
    ...drugConsequenceData.map(d => d.AGE).filter(d => d),
    ...seatbeltData.map(d => d.AGE_GROUP).filter(d => d),
    ...positiveData.map(d => d.AGE_GROUP).filter(d => d)
])].sort();

const regions = [...new Set([
    ...drugConsequenceData.map(d => d['Stats Area']).filter(d => d)
])].sort();

function populateDropdown(id, options) {
    const select = d3.select(`#${id}`);
    select.selectAll("option.data-option").remove();
    select.append("option").attr("class", "data-option").attr("value", "").text("All");
    select.selectAll("option.data-option-items")
        .data(options)
        .join("option")
        .attr("class", "data-option-items")
        .attr("value", d => d)
        .text(d => d);
}

populateDropdown("crash-year-filter", years);
populateDropdown("crash-age-filter", ageGroups);
populateDropdown("crash-region-filter", regions);

// Add event listeners for all crash filters
d3.selectAll("#crash-filters select").on("change", () => {
    const filters = {
        year: d3.select("#crash-year-filter").property("value"),
        ageGroup: d3.select("#crash-age-filter").property("value"),
        region: d3.select("#crash-region-filter").property("value"),
        violationType: d3.select("#violation-toggle").property("value")
    };
    
    if (window.updateCrashCharts) {
        window.updateCrashCharts(filters);
    }
});
};

window.updateCrashCharts = function(filters) {
console.log("Crash filters changed:", filters);

// Update all crash charts
if (window.updateComboChart) {
    window.updateComboChart(filters);
}
if (window.updateDonutChart) {
    window.updateDonutChart(filters);
}
if (window.updateBoxplotChart) {
    window.updateBoxplotChart(filters);
}
};

window.getCurrentCrashFilters = function() {
return {
    year: d3.select("#crash-year-filter").property("value"),
    ageGroup: d3.select("#crash-age-filter").property("value"),
    region: d3.select("#crash-region-filter").property("value"),
    violationType: d3.select("#violation-toggle").property("value")
};
};

window.resetCrashFilters = function() {
d3.select("#crash-year-filter").property("value", "");
d3.select("#crash-age-filter").property("value", "");
d3.select("#crash-region-filter").property("value", "");
d3.select("#violation-toggle").property("value", "drug");

if (window.updateCrashCharts) {
    window.updateCrashCharts({
        year: "",
        ageGroup: "",
        region: "",
        violationType: "drug"
    });
}
};

// Tooltip functions for crash charts
window.showCrashTooltip = function(event, data, type) {
const tooltip = d3.select("body").selectAll(".crash-tooltip")
    .data([1])
    .join("div")
    .attr("class", "crash-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "white")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "1000");

let content = '';

switch(type) {
    case 'combo':
        content = `
            <strong>Year: ${data.year}</strong><br/>
            Fines: ${SHARED_CONSTANTS.formatters.comma(data.fines)}<br/>
            Crashes: ${SHARED_CONSTANTS.formatters.comma(data.crashes)}
        `;
        break;
    case 'donut':
        content = `
            <strong>${data.severity}</strong><br/>
            Count: ${SHARED_CONSTANTS.formatters.comma(data.count)}<br/>
            Percentage: ${(data.percentage * 100).toFixed(1)}%
        `;
        break;
    case 'boxplot':
        content = `
            <strong>${data.region}</strong><br/>
            Min: ${data.min}<br/>
            Q1: ${data.q1}<br/>
            Median: ${data.median}<br/>
            Q3: ${data.q3}<br/>
            Max: ${data.max}
        `;
        break;
}

tooltip
    .html(content)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px")
    .style("opacity", 1);
};

window.hideCrashTooltip = function() {
d3.select(".crash-tooltip").style("opacity", 0);
};

// Initialize Show All Data button
window.initializeShowAllDataButton = function() {
const showAllButton = d3.select("#show-all-data");
if (!showAllButton.empty()) {
  showAllButton.on("click", function() {
    // Update selected jurisdiction title to show "All Jurisdictions"
    d3.select("#selected-jurisdiction").text("All Jurisdictions");
    
    // Keep the details container visible but update its appearance
    const detailsContainer = d3.select("#jurisdiction-details");
    detailsContainer
      .style("display", "block")
      .classed("visible", true);
    
    // Reset all filters using the existing resetDrugFilters function
    window.resetDrugFilters();
    
    // Clear selected state in choropleth if it exists
    if (typeof window.clearSelectedState === 'function') {
      window.clearSelectedState();
    }
  });
}
};

// Handle chart updates and interactions for jurisdiction details
window.updateJurisdictionCharts = function(code, filters) {
// Show jurisdiction details container with animation
const detailsContainer = d3.select("#jurisdiction-details");
detailsContainer
  .style("display", "block")
  .classed("visible", true);

// Smooth scroll to the details section
detailsContainer.node().scrollIntoView({ behavior: "smooth", block: "start" });

// Update selected jurisdiction title
d3.select("#selected-jurisdiction").text(code);

// Update filters to show only this jurisdiction
const jurisdictionFilter = d3.select("#jurisdiction-filter");
jurisdictionFilter.property("value", code);

// Update both charts
if (window.updatePositiveDrugBarChart) {
  window.updatePositiveDrugBarChart(filters);
}
if (window.updateJurisdictionLineChart) {
  window.updateJurisdictionLineChart(filters);
}
};

// Function to clear selected state
window.clearSelectedState = function() {
if (window.selectedState) {
  window.selectedState = null;
  d3.selectAll("path.state").classed("selected", false);
}
};

// Centralized tooltip system
window.createTooltip = function() {
  return d3.select("body").selectAll(".chart-tooltip")
      .data([1])
      .join("div")
      .attr("class", "chart-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "12px")
      .style("border-radius", "4px")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("min-width", "200px")
      .style("box-shadow", "0 2px 8px rgba(0, 0, 0, 0.2)")
      .style("border", "1px solid rgba(255, 255, 255, 0.1)")
      .style("font-family", "Segoe UI, Arial, sans-serif");
};

window.showTooltip = function(event, content) {
  const tooltip = window.createTooltip();
  tooltip
      .html(content)
      .style("left", (event.pageX + 30) + "px")
      .style("top", (event.pageY + 20) + "px");
};

window.hideTooltip = function() {
  d3.select(".chart-tooltip").remove();
};

// Helper function to create tooltip content with consistent styling
window.createTooltipContent = function(title, items) {
  const titleHtml = `
      <div style="text-align: center; margin-bottom: 8px; font-weight: bold; font-size: 16px;">
          ${title}
      </div>
  `;

  const itemsHtml = items.map(item => `
      <div style="display: flex; justify-content: space-between; margin: 4px 0;">
          <span>${item.label}:</span>
          <span style="color: ${item.color}; font-weight: bold;">${item.value}</span>
      </div>
  `).join('');

  return titleHtml + itemsHtml;
};

// Centralized tooltip for combo chart
window.showComboTooltip = function(event, d, violationType) {
  const tooltip = window.createTooltip();
  const content = window.createTooltipContent(
    `Year ${d.year}`,
    [
      {
        label: violationType === "seatbelt" ? "Seatbelt Fines" : "Drug Violations",
        value: d3.format(",")(d.fines),
        color: "rgb(61, 136, 255)"
      },
      {
        label: "Total Crash Incidents",
        value: d3.format(",")(d.crashes),
        color: "rgb(170, 203, 255)"
      }
    ]
  );
  tooltip
    .html(content)
    .style("left", (event.pageX + 30) + "px")
    .style("top", (event.pageY + 20) + "px");
};
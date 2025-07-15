window.renderJurisdictionLineChart = function(data) {
    const margin = SHARED_CONSTANTS.defaultMargin;
    const width = SHARED_CONSTANTS.defaultWidth - margin.left - margin.right - 350;
    const height = SHARED_CONSTANTS.defaultHeight - margin.top - margin.bottom - 300;

    const container = d3.select("#jurisdiction-line-chart");
    container.html(""); // clear previous

    // Create SVG container
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right + 120)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Store reference to update function
    window.updateJurisdictionLineChart = function(filters = {}) {
        // Get both total and positive data
        let totalData = window.sharedData.drugData;
        let positiveData = window.sharedData.positiveData;
        
        // Apply filters to both datasets
        if (filters.year && filters.year !== "") {
            totalData = totalData.filter(d => d.YEAR == filters.year);
            positiveData = positiveData.filter(d => d.YEAR == filters.year);
        }
        if (filters.ageGroup && filters.ageGroup !== "") {
            totalData = totalData.filter(d => d.AGE_GROUP === filters.ageGroup);
            positiveData = positiveData.filter(d => d.AGE_GROUP === filters.ageGroup);
        }
        if (filters.location && filters.location !== "") {
            totalData = totalData.filter(d => d.LOCATION === filters.location);
            positiveData = positiveData.filter(d => d.LOCATION === filters.location);
        }
        if (filters.jurisdiction && filters.jurisdiction !== "") {
            totalData = totalData.filter(d => d.JURISDICTION === filters.jurisdiction);
            positiveData = positiveData.filter(d => d.JURISDICTION === filters.jurisdiction);
        }

        // Get all years in the data
        const years = d3.range(2008, 2024);
        
        // Aggregate data by year for both total and positive tests
        const aggregatedData = years.map(year => {
            const yearTotalData = totalData.filter(d => d.YEAR === year);
            const yearPositiveData = positiveData.filter(d => d.YEAR === year);
            
            return {
                year,
                total: d3.sum(yearTotalData, d => +d.COUNT || 0),
                positive: d3.sum(yearPositiveData, d => +d.COUNT || 0)
            };
        });

        // Create scales
        const x = d3.scaleLinear()
            .domain([2008, 2023])
            .range([0, width]);

        const maxValue = d3.max(aggregatedData, d => Math.max(d.total, d.positive)) || 0;
        const y = d3.scaleLinear()
            .domain([0, maxValue])
            .nice()
            .range([height, 0]);

        // Clear previous chart elements
        svg.selectAll("*").remove();

        // Add the area for positive tests
        const area = d3.area()
            .x(d => x(d.year))
            .y0(height)
            .y1(d => y(d.positive))
            .curve(d3.curveMonotoneX);

        // Add the line for total tests
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.total))
            .curve(d3.curveMonotoneX);

        // Add the area path
        svg.append("path")
            .datum(aggregatedData)
            .attr("fill", "#ff7f0e")
            .attr("fill-opacity", 0.2)
            .attr("d", area);

        // Add the line path
        svg.append("path")
            .datum(aggregatedData)
            .attr("fill", "none")
            .attr("stroke", "#42bcf5")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add the vertical hover line (initially hidden)
        const hoverLine = svg.append("line")
            .attr("class", "hover-line")
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "#888")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4 2")
            .style("opacity", 0)
            .style("cursor", "pointer");  // Add pointer cursor

        // Add overlay for mouse events
        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mousemove", function(event) {
                const [mx, my] = d3.pointer(event, this);
                // Find the closest year
                const x0 = x.invert(mx);
                const closest = aggregatedData.reduce((a, b) => Math.abs(b.year - x0) < Math.abs(a.year - x0) ? b : a);
                const cx = x(closest.year);
                
                // Update hover line position
                hoverLine
                    .attr("x1", cx)
                    .attr("x2", cx)
                    .style("opacity", 1);
                
                // Show tooltip at mouse position
                const content = window.createTooltipContent(
                    `Year ${closest.year}`,
                    [
                        {
                            label: "Total Tests",
                            value: SHARED_CONSTANTS.formatters.comma(closest.total),
                            color: "#42bcf5"
                        },
                        {
                            label: "Positive Tests",
                            value: SHARED_CONSTANTS.formatters.comma(closest.positive),
                            color: "#ff7f0e"
                        }
                    ]
                );
                window.showTooltip(event, content);
            })
            .on("mouseleave", function() {
                if (!window.selectedYear) {  // Only hide if no year is selected
                    hoverLine.style("opacity", 0);
                }
                window.hideTooltip();
            })
            .on("click", function(event) {
                const [mx, my] = d3.pointer(event, this);
                const x0 = x.invert(mx);
                const closest = aggregatedData.reduce((a, b) => Math.abs(b.year - x0) < Math.abs(a.year - x0) ? b : a);
                const clickedYear = closest.year;
                
                // Store selected year globally
                window.selectedYear = window.selectedYear === clickedYear ? null : clickedYear;
                
                // Update hover line appearance
                if (window.selectedYear) {
                    hoverLine
                        .attr("x1", x(window.selectedYear))
                        .attr("x2", x(window.selectedYear))
                        .style("opacity", 1)
                        .attr("stroke", "#42bcf5")
                        .attr("stroke-width", 2)
                        .attr("stroke-dasharray", "none");
                    
                    // Update filters and charts
                    const newFilters = {...filters, year: window.selectedYear.toString()};
                    d3.select("#year-filter").property("value", window.selectedYear.toString());
                    if (window.updateDrugCharts) {
                        window.updateDrugCharts(newFilters);
                    }
                } else {
                    // Reset hover line
                    hoverLine
                        .style("opacity", 0)
                        .attr("stroke", "#888")
                        .attr("stroke-width", 1.5)
                        .attr("stroke-dasharray", "4 2");
                    
                    // Clear year filter
                    const newFilters = {...filters};
                    delete newFilters.year;
                    d3.select("#year-filter").property("value", "");
                    if (window.updateDrugCharts) {
                        window.updateDrugCharts(newFilters);
                    }
                }
            });

        // Add X axis
        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickValues(years)
                .tickFormat(d3.format("d"))
            );

        xAxis.selectAll("text")
            .style("font-size", "14px")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Fixed Y axis with proper tick formatting
        const tickFormat = d => {
            if (d === 0) return "0";
            if (d >= 1000) {
                return (d / 1000) + "k";
            }
            return d.toString();
        };

        svg.append("g")
            .call(d3.axisLeft(y)
                .ticks(6)
                .tickFormat(tickFormat)
            )
            .selectAll("text")
            .style("font-size", "14px");

        // Add axis labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 60)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Year");

        svg.append("text")
            .attr("x", -height / 2)
            .attr("y", -45)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Number of Tests");

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width}, 10)`);

        legend.append("line")
            .attr("x1", 20)
            .attr("y1", 0)
            .attr("x2", 50)
            .attr("y2", 0)
            .attr("stroke", "#42bcf5")
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 60)
            .attr("y", 4)
            .style("font-size", "14px")
            .text("Total Tests");

        legend.append("rect")
            .attr("x", 20)
            .attr("y", 20)
            .attr("width", 30)
            .attr("height", 10)
            .attr("fill", "#ff7f0e")
            .attr("fill-opacity", 0.2);

        legend.append("text")
            .attr("x", 60)
            .attr("y", 29)
            .style("font-size", "14px")
            .text("Positive Tests");

        // Add a subtitle showing current filters
        let filterText = "All Data";
        const activeFilters = [];
        if (filters.year && filters.year !== "") activeFilters.push(`Year: ${filters.year}`);
        if (filters.ageGroup && filters.ageGroup !== "") activeFilters.push(`Age: ${filters.ageGroup}`);
        if (filters.location && filters.location !== "") activeFilters.push(`Location: ${filters.location}`);
        if (filters.jurisdiction && filters.jurisdiction !== "") activeFilters.push(`Jurisdiction: ${filters.jurisdiction}`);
        
        if (activeFilters.length > 0) {
            filterText = activeFilters.join(" | ");
        }

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "#666")
            .text(`Filters: ${filterText}`);
    };

    // Set up event handlers for bar chart synchronization
    window.onBarChartSelection = function(selectedValue, selectedType, currentFilters) {
        // Create new filter object with the selected value
        const newFilters = {...currentFilters};
        
        if (selectedType === 'year') {
            // Bar chart is showing years, so selected value is a year
            newFilters.year = selectedValue.toString();
        } else {
            // Bar chart is showing jurisdictions, so selected value is a jurisdiction
            newFilters.jurisdiction = selectedValue;
        }
        
        // Update the line chart with the new filter
        window.updateJurisdictionLineChart(newFilters);
    };

    window.onBarChartDeselection = function(currentFilters) {
        // Get current filters but remove year filter to show all data
        const clearedFilters = {...currentFilters};
        delete clearedFilters.year;
        window.updateJurisdictionLineChart(clearedFilters);
    };

    // Initial render with no filters
    window.updateJurisdictionLineChart({});
};
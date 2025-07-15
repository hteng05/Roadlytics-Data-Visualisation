// Utility function to map individual age values to standardized age group categories
window.mapAgeToAgeGroup = function(age) {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return "Unknown";
    
    // Define age brackets for demographic analysis
    if (ageNum < 18) return "Under 18";
    if (ageNum >= 18 && ageNum <= 24) return "18-24";
    if (ageNum >= 25 && ageNum <= 34) return "25-34";
    if (ageNum >= 35 && ageNum <= 44) return "35-44";
    if (ageNum >= 45 && ageNum <= 54) return "45-54";
    if (ageNum >= 55 && ageNum <= 64) return "55-64";
    if (ageNum >= 65) return "65+";
    
    return "Unknown";
};

// Function to standardize various age group formats into consistent categories
// Handles string inputs, numeric inputs, and different formatting variations
window.standardizeAgeGroup = function(ageGroup) {
    if (!ageGroup) return "Unknown";
    
    const ag = ageGroup.toString().toLowerCase().trim();
    
    // Check if already in standard format
    if (["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "under 18"].includes(ag)) {
        return ag === "under 18" ? "Under 18" : ageGroup;
    }
    
    // Pattern matching for different age group string formats
    if (ag.includes("18") && ag.includes("24")) return "18-24";
    if (ag.includes("25") && ag.includes("34")) return "25-34";
    if (ag.includes("35") && ag.includes("44")) return "35-44";
    if (ag.includes("45") && ag.includes("54")) return "45-54";
    if (ag.includes("55") && ag.includes("64")) return "55-64";
    if (ag.includes("65") || ag.includes("over") || ag.includes("+")) return "65+";
    if (ag.includes("under") && ag.includes("18")) return "Under 18";
    
    // Fallback: try to parse as numeric age and map to group
    const ageNum = parseInt(ag);
    if (!isNaN(ageNum)) {
        if (ageNum < 18) return "Under 18";
        if (ageNum >= 18 && ageNum <= 24) return "18-24";
        if (ageNum >= 25 && ageNum <= 34) return "25-34";
        if (ageNum >= 35 && ageNum <= 44) return "35-44";
        if (ageNum >= 45 && ageNum <= 54) return "45-54";
        if (ageNum >= 55 && ageNum <= 64) return "55-64";
        if (ageNum >= 65) return "65+";
    }
    
    return "Unknown";
};

// Main function to render a combination chart (bar + line chart)
// Shows relationship between traffic violations and crash incidents
window.renderComboChart = function(drugConsequenceData, seatbeltData, positiveData, seatbeltConsequenceData) {
    // Chart dimensions and margins setup
    const margin = SHARED_CONSTANTS.defaultMargin;
    const width = SHARED_CONSTANTS.defaultWidth - margin.left - margin.right - 350;
    const height = SHARED_CONSTANTS.defaultHeight - margin.top - margin.bottom - 250;
    const container = d3.select("#combo-chart");
    
    // Clear existing chart content
    container.html("");
    
    // Calculate total SVG width including legend space
    const totalSvgWidth = width + margin.left + margin.right + 370;
    const chartAreaWidth = width + margin.left + margin.right;
    const centeredLeft = (totalSvgWidth - chartAreaWidth) / 2 + margin.left;
    
    // Create SVG container with proper positioning
    const svg = container.append("svg")
        .attr("width", totalSvgWidth)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${centeredLeft},${margin.top})`);

    // Function to update chart based on filter selections
    window.updateComboChart = function(filters = {}) {
        // Clear previous chart elements
        svg.selectAll("*").remove();
        
        // Debug logging for development
        console.log("Violation type:", filters.violationType);
        console.log("Seatbelt consequence data sample:", seatbeltConsequenceData.slice(0, 5));
        console.log("Drug consequence data sample:", drugConsequenceData.slice(0, 5));

        // Select appropriate fines dataset based on violation type
        let finesData;
        if (filters.violationType === "seatbelt") {
            finesData = seatbeltData.filter(d => d.JURISDICTION === "SA");
        } else {
            finesData = positiveData.filter(d => d.JURISDICTION === "SA");
        }

        // Select appropriate crash consequence data
        let crashData = filters.violationType === "seatbelt" ? seatbeltConsequenceData : drugConsequenceData;
        console.log("Selected crash data sample:", crashData.slice(0, 5));

        // Apply year filter if specified
        if (filters.year && filters.year !== "") {
            finesData = finesData.filter(d => d.YEAR == filters.year);
            crashData = crashData.filter(d => d.YEAR == filters.year || d.Year == filters.year);
        }

        // Apply age group filter with extensive debugging
        if (filters.ageGroup && filters.ageGroup !== "") {
            console.log("=== COMBO CHART AGE FILTERING DEBUG ===");
            console.log("Filter age group:", filters.ageGroup);
            console.log("Violation type:", filters.violationType);
            console.log("Initial fines data size:", finesData.length);
            console.log("Initial crash data size:", crashData.length);
            console.log("Sample fines data age groups:", 
                finesData.slice(0, 10).map(d => d.AGE_GROUP)
            );
            
            const finesBeforeFilter = finesData.length;
            
            // Error checking for missing AGE_GROUP field
            if (finesData.length > 0 && finesData[0].AGE_GROUP === undefined) {
                console.error("ERROR: AGE_GROUP field missing in fines data!");
                console.log("Fines data columns:", Object.keys(finesData[0]));
            }
            
            // Filter fines data by age group
            finesData = finesData.filter(d => {
                const match = d.AGE_GROUP === filters.ageGroup;
                if (match) {
                    console.log("Fines match found:", d.AGE_GROUP, "===", filters.ageGroup);
                }
                return match;
            });
            console.log(`Fines data: ${finesBeforeFilter} -> ${finesData.length} after age filter`);
            
            // Warning if no data remains after filtering
            if (finesData.length === 0) {
                console.warn("WARNING: No fines data after age filtering!");
                console.log("Available age groups in original fines data:", 
                    [...new Set(seatbeltData.concat(positiveData).map(d => d.AGE_GROUP))].filter(Boolean)
                );
            }
            
            // Handle crash data filtering differently for seatbelt vs drug violations
            if (filters.violationType === "seatbelt") {
                const crashBeforeFilter = crashData.length;
                
                if (crashData.length > 0) {
                    console.log("Crash data columns:", Object.keys(crashData[0]));
                    console.log("Sample crash data age groups:", 
                        crashData.slice(0, 10).map(d => ({
                            original: d.AGE_GROUP,
                            mapped: window.mapToDropdownAgeGroup ? window.mapToDropdownAgeGroup(d.AGE_GROUP) : "MAPPING FUNCTION MISSING"
                        }))
                    );
                }
                
                // Use mapping function if available, otherwise direct comparison
                if (!window.mapToDropdownAgeGroup) {
                    console.error("ERROR: window.mapToDropdownAgeGroup function is missing!");
                    crashData = crashData.filter(d => d.AGE_GROUP === filters.ageGroup);
                } else {
                    crashData = crashData.filter(d => {
                        const mappedAge = window.mapToDropdownAgeGroup(d.AGE_GROUP);
                        const match = mappedAge === filters.ageGroup;
                        if (match) {
                            console.log(`Seatbelt crash match: ${d.AGE_GROUP} -> ${mappedAge} matches ${filters.ageGroup}`);
                        }
                        return match;
                    });
                }
                console.log(`Seatbelt crash data: ${crashBeforeFilter} -> ${crashData.length} after age filter`);
            } else {
                // Handle drug violation crash data
                const crashBeforeFilter = crashData.length;
                console.log("Drug crash data columns:", crashData.length > 0 ? Object.keys(crashData[0]) : "No data");
                
                // Check if age information is available in crash data
                const hasAgeField = crashData.length > 0 && (
                    crashData[0].AGE_GROUP !== undefined ||
                    crashData[0].Age !== undefined ||
                    crashData[0].age !== undefined ||
                    crashData[0].AGE !== undefined
                );
                
                if (hasAgeField) {
                    console.log("Drug crash data HAS age info, attempting to filter");
                    if (!window.mapToDropdownAgeGroup) {
                        console.error("ERROR: window.mapToDropdownAgeGroup function is missing!");
                        crashData = [];
                    } else {
                        crashData = crashData.filter(d => {
                            const ageValue = d.AGE_GROUP || d.Age || d.age || d.AGE;
                            const mappedAge = window.mapToDropdownAgeGroup(ageValue);
                            return mappedAge === filters.ageGroup;
                        });
                    }
                    console.log(`Drug crash data: ${crashBeforeFilter} -> ${crashData.length} after age filter`);
                } else {
                    console.log("Drug crash data has NO age info, clearing data for age filter");
                    crashData = [];
                }
            }
            
            // Final data size logging
            console.log("Final fines data size:", finesData.length);
            console.log("Final crash data size:", crashData.length);
            
            if (finesData.length === 0 && crashData.length === 0) {
                console.warn("WARNING: Both fines and crash data are empty after filtering!");
            }
            
            console.log("=== END COMBO CHART AGE FILTERING DEBUG ===");
        }
        
        // Apply region filter if specified
        if (filters.region && filters.region !== "") {
            finesData = finesData.filter(d => d.LOCATION === filters.region);
            crashData = crashData.filter(d => {
                return d['Stats Area'] === filters.region || 
                       d.LOCATION === filters.region || 
                       d.Region === filters.region ||
                       !filters.region;
            });
        }

        // More debug logging for filtered data
        console.log("Filtered crash data sample:", crashData.slice(0, 5));
        console.log("Total crash data length:", crashData.length);
        console.log("Crash data columns:", crashData.length > 0 ? Object.keys(crashData[0]) : "No data");

        // Aggregate fines data by year using D3 rollup
        const finesByYear = d3.rollup(
            finesData,
            v => {
                if (filters.violationType === "seatbelt") {
                    return d3.sum(v, d => +d.FINES || 0);
                } else {
                    return d3.sum(v, d => +d.COUNT || 0);
                }
            },
            d => +d.YEAR
        );

        // Aggregate crash data by year (simple count)
        const crashesByYear = d3.rollup(
            crashData,
            v => v.length,
            d => +(d.YEAR || d.Year)
        );

        console.log("Crashes by year:", Object.fromEntries(crashesByYear));
        console.log("Fines by year:", Object.fromEntries(finesByYear));

        // Define year range for consistent x-axis
        const allYears = d3.range(2019, 2024);
        
        // Combine data into single array with 0 values for missing years
        const combinedData = allYears.map(year => ({
            year,
            fines: finesByYear.get(year) || 0,
            crashes: crashesByYear.get(year) || 0
        }));

        console.log("Combined data:", combinedData);

        // Calculate total crashes for validation
        const totalCrashes = d3.sum(combinedData, d => d.crashes);
        console.log("Total crashes across all years:", totalCrashes);

        // Display "no data" message if no valid data exists
        if (combinedData.length === 0 || totalCrashes === 0) {
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("fill", "#666")
                .text(totalCrashes === 0 ? "No crash data available for current filters" : "No data available for current filters");
            return;
        }

        // Set up x-axis scale (band scale for categorical years)
        const x = d3.scaleBand()
            .domain(allYears.map(String))
            .range([0, width])
            .padding(allYears.length === 1 ? 0.8 : 0.6);
        
        // Calculate maximum values for y-axis scaling
        const maxFines = d3.max(combinedData, d => d.fines) || 0;
        const maxCrashes = d3.max(combinedData, d => d.crashes) || 0;
        
        console.log("Max fines:", maxFines, "Max crashes:", maxCrashes);
        
        // Prevent zero-range scales
        let adjustedMaxFines = maxFines;
        if (adjustedMaxFines === 0) adjustedMaxFines = 1;
        
        let adjustedMaxCrashes = maxCrashes;
        if (adjustedMaxCrashes === 0) adjustedMaxCrashes = 1;
        
        // Set up dual y-axes (left for fines, right for crashes)
        const yLeft = d3.scaleLinear()
            .domain([0, adjustedMaxFines])
            .nice()
            .range([height, 0]);
        
        const yRight = d3.scaleLinear()
            .domain([0, adjustedMaxCrashes])
            .nice()
            .range([height, 0]);

        // Format large numbers with 'k' suffix
        const tickFormat = d => {
            if (d === 0) return "0";
            if (d >= 1000) return (d / 1000) + "k";
            return d.toString();
        };

        // Add invisible background rectangle for click-to-deselect functionality
        svg.append("rect")
            .attr("class", "combo-bg-reset")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent")
            .on("click", function() {
                selectedYear = null;
                // Reset all visual elements to unselected state
                svg.selectAll(".combo-bar")
                    .transition().duration(200)
                    .attr("fill", "rgb(5, 40, 91)")
                    .attr("opacity", 1);
                svg.selectAll(".combo-circle")
                    .transition().duration(200)
                    .attr("fill", "#42bcf5")
                    .attr("opacity", 1);
                // Trigger deselection callback
                if (window.onComboChartDeselection) window.onComboChartDeselection(filters);
            });

        let selectedYear = null;

        // Create bar chart elements
        const bars = svg.selectAll(".combo-bar")
            .data(combinedData)
            .join("rect")
            .attr("class", "combo-bar")
            .attr("x", d => x(String(d.year)))
            .attr("y", height)  // Start from bottom for animation
            .attr("width", x.bandwidth())
            .attr("height", 0)  // Start with zero height for animation
            .attr("fill", "rgb(5, 40, 91)")
            .style("cursor", "pointer");

        // Animate bars growing from bottom
        bars.transition()
            .duration(800)
            .attr("y", d => yLeft(d.fines))
            .attr("height", d => height - yLeft(d.fines));

        // Add interaction handlers to bars
        bars
            .on("click", (event, d) => handleElementClick(event, d, svg, selectedYear, filters))
            .on("mouseover", (event, d) => handleElementHover(event, d, d3.select(this), selectedYear, filters))
            .on("mouseout", (event, d) => handleElementMouseout(event, d, d3.select(this), selectedYear));

        // Create line generator for crash trend line
        const line = d3.line()
            .x(d => x(String(d.year)) + x.bandwidth() / 2)
            .y(d => yRight(d.crashes))
            .curve(d3.curveMonotoneX);

        // Draw line only if there are crashes to show
        if (maxCrashes > 0) {
            const path = svg.append("path")
                .datum(combinedData.filter(d => d.crashes > 0))
                .attr("fill", "none")
                .attr("stroke", "#42bcf5")
                .attr("stroke-width", 3)
                .attr("d", line);
        }

        // Create circle markers on line chart
        const circles = svg.selectAll(".combo-circle")
            .data(combinedData)
            .join("circle")
            .attr("class", "combo-circle")
            .attr("cx", d => x(String(d.year)) + x.bandwidth() / 2)
            .attr("cy", d => yRight(d.crashes))
            .attr("r", d => d.crashes > 0 ? 4 : 2)  // Smaller circles for zero values
            .attr("fill", d => d.crashes > 0 ? "#42bcf5" : "#ccc")
            .attr("stroke", d => d.crashes > 0 ? "none" : "#999")
            .attr("stroke-width", d => d.crashes > 0 ? 0 : 1)
            .style("cursor", "pointer");

        // Add interaction handlers to circles
        circles
            .on("click", (event, d) => handleElementClick(event, d, svg, selectedYear, filters))
            .on("mouseover", (event, d) => {
                const element = d3.select(this);
                const currentFill = element.attr("fill");
                // Only animate if not in disabled state
                if (currentFill !== "#8db9d9" && d.year !== selectedYear) {
                    element.transition().duration(200)
                        .attr("r", 6)
                        .attr("fill", "#6cc8f5");
                }
                window.showComboTooltip(event, d, filters.violationType);
            })
            .on("mouseout", (event, d) => {
                const element = d3.select(this);
                // Calculate correct visual state based on selection
                const correctFill = d.year === selectedYear ? "#42bcf5" : 
                                  selectedYear !== null ? "#8db9d9" : "#42bcf5";
                const correctOpacity = d.year === selectedYear || selectedYear === null ? 1 : 0.6;
                element.transition().duration(200)
                    .attr("r", 4)
                    .attr("fill", correctFill)
                    .attr("opacity", correctOpacity);
                window.hideTooltip();
            });

        // Add left y-axis (for fines)
        svg.append("g")
            .call(d3.axisLeft(yLeft)
                .ticks(6)
                .tickFormat(tickFormat)
            )
            .selectAll("text")
            .style("font-size", "14px");

        // Add right y-axis (for crashes)
        svg.append("g")
            .attr("transform", `translate(${width},0)`)
            .call(d3.axisRight(yRight)
                .ticks(6)
                .tickFormat(tickFormat)
            )
            .selectAll("text")
            .style("font-size", "14px");

        // Add x-axis with rotated labels
        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => {
                return Array.from(x.domain()).includes(d) ? d : "";
            }));
        
        xAxis.selectAll("text")
            .style("font-size", "14px")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Add axis labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 60)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Year");

        // Left y-axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -45)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "rgb(5, 40, 91)")
            .text(filters.violationType === "seatbelt" ? "Seatbelt Fines (SA)" : "Drug Violations (SA)");

        // Right y-axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", width + 60)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#42bcf5")
            .text("Total Crash Incidents");

        // Add filter status text
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "#666")
            .text(`Filters: ${getFilterText(filters)}`);

        // Create legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 80}, 20)`);

        // Legend rectangle for bars
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "rgb(5, 40, 91)");

        // Legend text for bars
        legend.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "12px")
            .text(filters.violationType === "seatbelt" ? "Seatbelt Fines (SA)" : "Drug Violations (SA)");

        // Legend line for crash trend
        legend.append("line")
            .attr("x1", 0)
            .attr("y1", 41)
            .attr("x2", 15)
            .attr("y2", 41)
            .attr("stroke", "#42bcf5")
            .attr("stroke-width", 3);

        // Legend text for line
        legend.append("text")
            .attr("x", 20)
            .attr("y", 45)
            .style("font-size", "12px")
            .text("Total Crash Incidents");
    };

    // Callback function when a year is selected in the chart
    window.onComboChartSelection = function(selectedYear, currentFilters) {
        const newFilters = {...currentFilters};
        newFilters.year = selectedYear.toString();
        
        // Update other charts with year filter
        if (window.updateDonutChart) {
            window.updateDonutChart(newFilters);
        }
    };

    // Callback function when chart selection is cleared
    window.onComboChartDeselection = function(currentFilters) {
        const clearedFilters = {...currentFilters};
        delete clearedFilters.year;
        
        // Update other charts without year filter
        if (window.updateDonutChart) {
            window.updateDonutChart(clearedFilters);
        }
    };

    // Initialize chart with default drug violation view
    window.updateComboChart({ violationType: "drug" });
};

// Helper function to update visual state of chart elements based on selection
function updateChartVisualState(svg, selectedYear, clickedYear) {
    // Update bar colors and opacity based on selection
    svg.selectAll(".combo-bar")
        .transition().duration(200)
        .attr("fill", barData => barData.year === clickedYear ? "rgb(5, 40, 91)" : "rgb(100, 120, 150)")
        .attr("opacity", barData => barData.year === clickedYear ? 1 : 0.6);
        
    // Update circle colors and opacity based on selection
    svg.selectAll(".combo-circle")
        .transition().duration(200)
        .attr("fill", circleData => circleData.year === clickedYear ? "#42bcf5" : "#8db9d9")
        .attr("opacity", circleData => circleData.year === clickedYear ? 1 : 0.6);
}

// Helper function to generate filter description text
function getFilterText(filters) {
    const activeFilters = [];
    if (filters.year && filters.year !== "") activeFilters.push(`Year: ${filters.year}`);
    if (filters.ageGroup && filters.ageGroup !== "") activeFilters.push(`Age: ${filters.ageGroup}`);
    if (filters.region && filters.region !== "") activeFilters.push(`Region: ${filters.region}`);
    
    return activeFilters.length > 0 ? activeFilters.join(" | ") : "All Data";
}

// Event handler for clicking on chart elements (bars or circles)
function handleElementClick(event, d, svg, selectedYear, filters) {
    event.stopPropagation();  // Prevent event bubbling
    const clickedYear = d.year;
    selectedYear = clickedYear;
    
    // Update visual state to show selection
    updateChartVisualState(svg, selectedYear, clickedYear);
    
    // Trigger selection callback to update other charts
    if (window.onComboChartSelection) {
        window.onComboChartSelection(clickedYear, filters);
    }
}

// Event handler for hovering over chart elements
function handleElementHover(event, d, element, selectedYear, filters) {
    // Only show hover effect if element is not in disabled state
    if (selectedYear !== null && d.year !== selectedYear) return;
    
    const currentFill = element.attr("fill");
    // Apply hover color if not already in selected state
    if (currentFill !== "rgb(0, 60, 136)") {
        element.transition().duration(200)
            .attr("fill", "rgb(0, 60, 136)");
    }
    
    // Show tooltip with data details
    window.showComboTooltip(event, d, filters.violationType);
}

// Event handler for mouse leaving chart elements
function handleElementMouseout(event, d, element, selectedYear) {
    // Only apply mouseout effect if element is not in disabled state
    if (selectedYear !== null && d.year !== selectedYear) return;
    
    // Restore original color
    const correctFill = selectedYear === d.year ? "rgb(5, 40, 91)" : "rgb(5, 40, 91)";
    
    if (element.attr("fill") !== correctFill) {
        element.transition().duration(200)
            .attr("fill", correctFill);
    }
    
    // Hide tooltip
    window.hideTooltip();
}
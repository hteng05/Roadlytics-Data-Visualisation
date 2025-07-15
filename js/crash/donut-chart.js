// Age group mapping function to match dropdown options (shared with combo chart)
if (!window.mapToDropdownAgeGroup) {
    window.mapToDropdownAgeGroup = function(ageValue) {
        if (!ageValue) return "Unknown";
        
        const ageStr = ageValue.toString().toLowerCase().trim();
        
        // Direct matches first (for data that already uses these formats)
        if (ageStr === "0-16") return "0-16";
        if (ageStr === "17-25") return "17-25";
        if (ageStr === "26-39") return "26-39";
        if (ageStr === "40-64") return "40-64";
        if (ageStr === "65 and over" || ageStr === "65+") return "65 and over";
        if (ageStr === "all ages") return "All ages";
        if (ageStr === "unknown") return "Unknown";
        
        // Parse individual ages and map to ranges
        const age = parseInt(ageStr);
        if (!isNaN(age)) {
            if (age >= 0 && age <= 16) return "0-16";
            if (age >= 17 && age <= 25) return "17-25";
            if (age >= 26 && age <= 39) return "26-39";
            if (age >= 40 && age <= 64) return "40-64";
            if (age >= 65) return "65 and over";
        }
        
        // Handle various age group formats that might exist in the data
        // Check for ranges like "18-24", "25-34", etc. and map them
        if (ageStr.includes("-")) {
            const parts = ageStr.split("-");
            if (parts.length === 2) {
                const startAge = parseInt(parts[0]);
                const endAge = parseInt(parts[1]);
                
                if (!isNaN(startAge) && !isNaN(endAge)) {
                    // Find the best matching dropdown age group
                    const midAge = (startAge + endAge) / 2;
                    
                    if (midAge <= 16) return "0-16";
                    if (midAge <= 25) return "17-25";
                    if (midAge <= 39) return "26-39";
                    if (midAge <= 64) return "40-64";
                    if (midAge >= 65) return "65 and over";
                }
            }
        }
        
        // Handle text-based age descriptions
        if (ageStr.includes("under") || ageStr.includes("child") || ageStr.includes("teen")) {
            return "0-16";
        }
        if (ageStr.includes("young") || ageStr.includes("youth")) {
            return "17-25";
        }
        if (ageStr.includes("adult") || ageStr.includes("middle")) {
            return "26-39";
        }
        if (ageStr.includes("senior") || ageStr.includes("elderly") || ageStr.includes("old")) {
            return "65 and over";
        }
        
        return "Unknown";
    };
}

window.renderDonutChart = function(drugConsequenceData, seatbeltConsequenceData) {
    const margin = SHARED_CONSTANTS.defaultMargin;
    const width = SHARED_CONSTANTS.defaultWidth - margin.left - margin.right;
    const height = SHARED_CONSTANTS.defaultHeight - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2 - 40;

    const container = d3.select("#donut-chart");
    container.html("");

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${(width + margin.left + margin.right) / 2},${(height + margin.top + margin.bottom) / 2})`);

    // Color scale for severity levels
    const colorScale = d3.scaleOrdinal()
        .domain(["Fatal", "Injury", "Minor", "No Harm", "Property Damage Only"])
        .range(["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91bfdb"]);

    window.updateDonutChart = function(filters = {}) {
        svg.selectAll("*").remove();

        // Use appropriate dataset based on violation type
        let data;
        if (filters.violationType === "seatbelt") {
            data = seatbeltConsequenceData;
            // Map seatbelt injury extent to severity levels
            data = data.map(d => ({
                ...d,
                severity: d['Injury Extent'] || "Unknown"
            }));
        } else {
            data = drugConsequenceData;
            // Map CSEF severity to our categories
            data = data.map(d => ({
                ...d,
                severity: d['CSEF Severity'] || "Unknown"
            }));
        }

        //AGE GROUP FILTERING
        if (filters.ageGroup && filters.ageGroup !== "") {
            console.log("=== DONUT AGE FILTERING DEBUG ===");
            console.log("Filter age group:", filters.ageGroup);
            console.log("Violation type:", filters.violationType);
            
            const beforeFilter = data.length;
            
            if (filters.violationType === "seatbelt") {
                // Sample the age groups to see what format they're in
                console.log("Sample seatbelt donut age groups:", 
                    data.slice(0, 10).map(d => ({
                        original: d.AGE_GROUP,
                        mapped: window.mapToDropdownAgeGroup(d.AGE_GROUP)
                    }))
                );
                
                data = data.filter(d => {
                    const mappedAge = window.mapToDropdownAgeGroup(d.AGE_GROUP);
                    const match = mappedAge === filters.ageGroup;
                    if (match) {
                        console.log(`Donut seatbelt match: ${d.AGE_GROUP} -> ${mappedAge} matches ${filters.ageGroup}`);
                    }
                    return match;
                });
            } else {
                // Drug data - check if it has age fields
                console.log("Drug donut data columns:", data.length > 0 ? Object.keys(data[0]) : "No data");
                
                const hasAgeField = data.length > 0 && (
                    data[0].AGE_GROUP !== undefined ||
                    data[0].Age !== undefined ||
                    data[0].age !== undefined ||
                    data[0].AGE !== undefined
                );
                
                if (hasAgeField) {
                    console.log("Drug donut data HAS age info, attempting to filter");
                    data = data.filter(d => {
                        const ageValue = d.AGE_GROUP || d.Age || d.age || d.AGE;
                        const mappedAge = window.mapToDropdownAgeGroup(ageValue);
                        return mappedAge === filters.ageGroup;
                    });
                } else {
                    console.log("Drug donut data has NO age info, clearing data for age filter");
                    data = [];
                }
            }
            
            console.log(`Donut data: ${beforeFilter} -> ${data.length} after age filter`);
            console.log("=== END DONUT AGE FILTERING DEBUG ===");
        }
        
        if (filters.year && filters.year !== "") {
            data = data.filter(d => d.Year == filters.year);
        }
        // Add region filter
        if (filters.region && filters.region !== "") {
            data = data.filter(d => d.LOCATION === filters.region || d['Stats Area'] === filters.region);
        }

        // Aggregate by severity
        const severityCounts = d3.rollup(
            data,
            v => v.length,
            d => d.severity
        );

        const pieData = Array.from(severityCounts, ([severity, count]) => ({
            severity,
            count,
            percentage: count / d3.sum(Array.from(severityCounts.values()))
        }));

        if (pieData.length === 0) {
            svg.append("text")
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("fill", "#666")
                .text("No data available for current filters");
            return;
        }

        // Sort pieData in the order: 1: PDO, 2: MI, 3: SI, 4: Fatal
        const severityOrder = ["1: PDO", "2: MI", "3: SI", "4: Fatal"];
        pieData.sort((a, b) => {
            const aIndex = severityOrder.indexOf(a.severity);
            const bIndex = severityOrder.indexOf(b.severity);
            return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
        });

        // Create pie generator
        const pie = d3.pie()
            .value(d => d.count)
            .sort(null);

        // Create arc generator
        const arc = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius);

        const arcHover = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius + 10);

        // Background for deselecting slices
        svg.append("circle")
            .attr("class", "donut-bg-reset")
            .attr("r", radius * 0.4)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .on("click", function() {
                selectedSeverity = null;
                svg.selectAll(".donut-slice")
                    .transition().duration(200)
                    .attr("opacity", 1)
                    .attr("d", arc);
                // Call deselection handler
                if (window.onDonutChartDeselection) window.onDonutChartDeselection(filters);
            });

        let selectedSeverity = null;

        // Create arcs
        const arcs = svg.selectAll(".arc")
            .data(pie(pieData))
            .join("g")
            .attr("class", "arc");

        // Add paths
        const paths = arcs.append("path")
            .attr("class", "donut-slice")
            .attr("fill", d => colorScale(d.data.severity))
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer");

        // Animate the donut chart
        paths.transition()
            .duration(800)
            .attrTween("d", function(d) {
                const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function(t) {
                    return arc(interpolate(t));
                };
            });

        // Add click and hover effects
        paths
            .on("mouseover", function(event, d) {
                const element = d3.select(this);
                const sliceSeverity = d.data.severity;
                if (sliceSeverity !== selectedSeverity) {
                    element.transition()
                        .duration(200)
                        .attr("d", arcHover);
                }
                
                window.showCrashTooltip(event, d.data, 'donut');
            })
            .on("mouseout", function(event, d) {
                const element = d3.select(this);
                const sliceSeverity = d.data.severity;
                let correctOpacity;
                if (sliceSeverity === selectedSeverity) {
                    correctOpacity = 1;
                } else if (selectedSeverity !== null) {
                    correctOpacity = 0.6;
                } else {
                    correctOpacity = 1;
                }
                
                element.transition()
                    .duration(200)
                    .attr("d", arc)
                    .attr("opacity", correctOpacity);
                
                window.hideCrashTooltip();
            });

        // Add percentage labels
        arcs.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "white")
            .style("opacity", 0)
            .text(d => d.data.percentage > 0.05 ? `${(d.data.percentage * 100).toFixed(1)}%` : "")
            .transition()
            .delay(800)
            .duration(400)
            .style("opacity", 1);

        // Add center label
        const centerText = svg.append("g")
            .attr("class", "center-text");

        centerText.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -10)
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text("Total Cases");

        centerText.append("text")
            .attr("text-anchor", "middle")
            .attr("y", 15)
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .style("fill", "#666")
            .text(d3.sum(pieData, d => d.count));

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${radius + 50}, ${-pieData.length * 12})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(pieData)
            .join("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 24})`);

        legendItems.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => colorScale(d.severity));

        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "12px")
            .style("fill", "#333")
            .text(d => `${d.severity} (${d.count})`);

        // Add subtitle showing current filter
        svg.append("text")
            .attr("x", 0)
            .attr("y", -radius - 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "#666")
            .text(`${filters.violationType === "seatbelt" ? "Seatbelt" : "Drug"} Related Crashes${filters.ageGroup ? ` - ${filters.ageGroup}` : ""}`);
    };

    // Set up event handlers for synchronization with combo chart
    window.onDonutChartSelection = function(selectedSeverity, currentFilters) {
        console.log("Donut chart selected severity:", selectedSeverity);
    };

    window.onDonutChartDeselection = function(currentFilters) {
        // Clear any severity-based selections
        console.log("Donut chart deselected");
    };

    // Initial render
    window.updateDonutChart({ violationType: "drug" });
};
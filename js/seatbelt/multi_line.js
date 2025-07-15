// Chart 5: Multi-Line Chart - Trends Over Time by Jurisdiction
class MultiLineChart {
    constructor(containerId, legendId, tooltipId) {
        this.containerId = containerId;
        this.legendId = legendId;
        this.tooltipId = tooltipId;
        this.jurisdictionVisibility = {};
        this.selectedJurisdiction = null; // Track selected jurisdiction
        this.colors = {
            jurisdictions: d3.scaleOrdinal(d3.schemeCategory10)
        };
    }

    render(data) {
        const container = d3.select(`#${this.containerId}`);
        container.selectAll('*').remove();

        if (!data || data.length === 0) {
            container.append('div')
                .attr('class', 'no-data-message')
                .style('text-align', 'center')
                .style('padding', '50px')
                .style('color', '#666')
                .text('No data available for current filters');
            return;
        }

        const margin = { top: 20, right: 30, bottom: 60, left: 80 };
        const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right )
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Aggregate data by year and jurisdiction
        const nested = d3.rollup(data,
            v => d3.sum(v, d => d.FINES),
            d => d.JURISDICTION,
            d => d.YEAR
        );

        const jurisdictions = Array.from(nested.keys());
        const years = [...new Set(data.map(d => d.YEAR))].sort();

        // Initialize visibility for all jurisdictions
        jurisdictions.forEach(j => {
            if (this.jurisdictionVisibility[j] === undefined) {
                this.jurisdictionVisibility[j] = true;
            }
        });

        const lineData = jurisdictions.map(jurisdiction => {
            const yearData = nested.get(jurisdiction) || new Map();
            return {
                jurisdiction,
                values: years.map(year => ({
                    year,
                    fines: yearData.get(year) || 0
                }))
            };
        });

        const xScale = d3.scaleLinear()
            .domain(d3.extent(years))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(lineData, d => d3.max(d.values, v => v.fines))])
            .range([height, 0]);

        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.fines))
            .curve(d3.curveMonotoneX);

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickValues(years)
                .tickFormat(d3.format('d')))
            .selectAll('text')
            .style('font-size', '12px');

        g.append('g')
            .call(d3.axisLeft(yScale).tickFormat(d3.format('.2s')))
            .selectAll('text')
            .style('font-size', '12px');

        // Add lines
        const lines = g.selectAll('.line-group')
            .data(lineData)
            .join('g')
            .attr('class', 'line-group');

        lines.append('path')
            .attr('class', 'line')
            .attr('d', d => line(d.values))
            .attr('stroke', d => this.colors.jurisdictions(d.jurisdiction))
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .style('opacity', d => this.getLineOpacity(d.jurisdiction));

        // Add dots
        lines.selectAll('.dot')
            .data(d => d.values.map(v => ({...v, jurisdiction: d.jurisdiction})))
            .join('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScale(d.fines))
            .attr('r', 4)
            .attr('fill', d => this.colors.jurisdictions(d.jurisdiction))
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('opacity', d => this.getLineOpacity(d.jurisdiction));

        // Add vertical line for tooltip
        const verticalLine = g.append('line')
            .attr('class', 'vertical-line')
            .attr('stroke', '#666')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .style('opacity', 0)
            .attr('y1', 0)
            .attr('y2', height);

        // Add invisible overlay for mouse events
        const overlay = g.append('rect')
            .attr('class', 'overlay')
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .on('mouseover', () => {
                verticalLine.style('opacity', 1);
                d3.select(`#${this.tooltipId}`).style('opacity', 1);
            })
            .on('mouseout', () => {
                verticalLine.style('opacity', 0);
                this.hideTooltip();
            })
            .on('mousemove', (event) => {
                const [mouseX] = d3.pointer(event);
                const year = Math.round(xScale.invert(mouseX));
                
                // Find the closest actual year in the data
                const closestYear = years.reduce((prev, curr) => 
                    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
                );
                
                const x = xScale(closestYear);
                verticalLine.attr('x1', x).attr('x2', x);
                
                this.showVerticalTooltip(event, closestYear, lineData);
            });

        // Add axis labels
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Number of Fines');

        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Year');

        // Update legend
        this.updateLegend(jurisdictions);
    }

    // Helper method to determine line opacity based on selection state
    getLineOpacity(jurisdiction) {
        if (this.selectedJurisdiction === null) {
            // No selection - show all lines normally
            return this.jurisdictionVisibility[jurisdiction] ? 1 : 0.1;
        } else if (this.selectedJurisdiction === jurisdiction) {
            // This is the selected jurisdiction - full opacity
            return 1;
        } else {
            // Other jurisdictions - faded
            return 0.3;
        }
    }

    updateLegend(jurisdictions) {
        const legendContainer = d3.select(`#${this.legendId}`);
        legendContainer.selectAll('*').remove();

        const legendItems = legendContainer.selectAll('.legend-item')
            .data(jurisdictions)
            .join('div')
            .attr('class', d => {
                let classes = 'legend-item';
                if (this.selectedJurisdiction === d) {
                    classes += ' selected';
                } else if (this.selectedJurisdiction !== null) {
                    classes += ' faded';
                } else if (!this.jurisdictionVisibility[d]) {
                    classes += ' inactive';
                }
                return classes;
            })
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                // Toggle selection logic
                if (this.selectedJurisdiction === d) {
                    // If clicking the already selected jurisdiction, deselect it
                    this.selectedJurisdiction = null;
                } else {
                    // Select this jurisdiction
                    this.selectedJurisdiction = d;
                }
                
                // Clear the dropdown jurisdiction filter since we're using legend selection
                d3.select('#sb-jurisdiction-filter').property('value', '');
                
                // Re-render this chart to update visual highlighting
                if (window.seatbeltDashboard) {
                    // Clear the jurisdiction filter in the main dashboard
                    window.seatbeltDashboard.activeFilters.jurisdiction = '';
                    
                    // Update the charts
                    window.seatbeltDashboard.filterData(); // This will now exclude jurisdiction filter
                    window.seatbeltDashboard.updateStats();
                    window.seatbeltDashboard.renderMultiLineChart(); // This will show all lines with highlighting
                    
                    // For other charts, apply the selected jurisdiction as a filter
                    if (this.selectedJurisdiction) {
                        const jurisdictionFilteredData = window.seatbeltDashboard.filteredData.filter(d => 
                            d.JURISDICTION === this.selectedJurisdiction
                        );
                        window.seatbeltDashboard.stackedBarChart.render(jurisdictionFilteredData);
                        window.seatbeltDashboard.pieDonutChart.render(jurisdictionFilteredData);
                    } else {
                        // No selection, show all data
                        window.seatbeltDashboard.renderStackedBarChart();
                        window.seatbeltDashboard.renderPieChart();
                    }
                }
            });

        legendItems.append('div')
            .attr('class', 'legend-color')
            .style('background-color', d => this.colors.jurisdictions(d));

        legendItems.append('span')
            .text(d => d);
    }

    showVerticalTooltip(event, year, lineData) {
        const tooltip = d3.select(`#${this.tooltipId}`);
        
        // Get data for all jurisdictions for this year
        const yearData = lineData.map(d => {
            const yearValue = d.values.find(v => v.year === year);
            return {
                jurisdiction: d.jurisdiction,
                fines: yearValue ? yearValue.fines : 0,
                color: this.colors.jurisdictions(d.jurisdiction)
            };
        }).sort((a, b) => b.fines - a.fines); // Sort by fines descending

        let content = `<div style="font-weight: bold; margin-bottom: 8px; text-align: center; font-size: 14px;">${year}</div>`;
        
        yearData.forEach(d => {
            if (d.fines > 0) { // Only show jurisdictions with data
                content += `
                    <div style="display: flex; align-items: center; margin: 4px 0;">
                        <div style="width: 12px; height: 12px; background-color: ${d.color}; margin-right: 8px; border-radius: 2px;"></div>
                        <span style="flex: 1;">${d.jurisdiction}</span>
                        <span style="font-weight: bold; margin-left: 10px;">${SHARED_CONSTANTS.formatters.comma(d.fines)}</span>
                    </div>
                `;
            }
        });

        tooltip
            .style('left', (event.pageX - 150) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .style('opacity', 1)
            .html(content);
    }

    showTooltip(event, data) {
        const tooltip = d3.select(`#${this.tooltipId}`);
        
        const content = `
            <strong>${data.jurisdiction}</strong><br/>
            Year: ${data.year}<br/>
            Fines: ${SHARED_CONSTANTS.formatters.comma(data.fines)}
        `;

        tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .style('opacity', 1)
            .html(content);
    }

    hideTooltip() {
        d3.select(`#${this.tooltipId}`)
            .style('opacity', 0);
    }

    // Method to get current visibility state
    getJurisdictionVisibility() {
        return this.jurisdictionVisibility;
    }

    // Method to set visibility state
    setJurisdictionVisibility(visibility) {
        this.jurisdictionVisibility = visibility;
    }

    // Method to get/set selected jurisdiction
    getSelectedJurisdiction() {
        return this.selectedJurisdiction;
    }

    setSelectedJurisdiction(jurisdiction) {
        this.selectedJurisdiction = jurisdiction;
    }

    // Method to clear selection
    clearSelection() {
        this.selectedJurisdiction = null;
    }
}

// Export for use in main dashboard
window.MultiLineChart = MultiLineChart;
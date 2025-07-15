// Chart 6: Enhanced Pie/Donut Chart - Detection Method Distribution with Age Group Breakdown
class PieDonutChart {
    constructor(containerId, tooltipId) {
        this.containerId = containerId;
        this.tooltipId = tooltipId;
        this.colors = {
            'police issued': '#2E86AB',
            'fixed or mobile camera': '#A23B72', 
            'mobile camera': '#E74C3C'
        };
        this.ageGroupColors = {
            '0-16': '#4CAF50',           // Green
            '17-25': '#2196F3',          // Blue
            '26-39': '#FF9800',          // Orange  
            '40-64': '#9C27B0',          // Purple
            '65 and over': '#F44336',    // Red
            'All ages': '#607D8B',       // Blue Gray
            'Unknown': '#9E9E9E'         // Gray
        };
        this.currentHoveredMethod = null;
        this.rawData = null;
    }

    render(data) {
        this.rawData = data; // Store raw data for age group breakdown
        
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

        const width = container.node().getBoundingClientRect().width;
        const height = 500;
        const radius = Math.min(width, height) / 2 - 80; // More space for outer ring
        const innerRadius = radius * 0.55;
        const outerRingRadius = radius + 50; // Outer ring for age groups

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Aggregate data by detection method
        const methodData = d3.rollup(data,
            v => d3.sum(v, d => d.FINES),
            d => d.DETECTION_METHOD
        );

        const pieData = Array.from(methodData.entries()).map(([method, fines]) => ({
            method,
            fines,
            percentage: fines / d3.sum(methodData.values())
        }));

        const pie = d3.pie()
            .value(d => d.fines)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(radius);

        const arcHover = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(radius + 5);

        // Create main pie slices
        const arcs = g.selectAll('.slice')
            .data(pie(pieData))
            .join('g')
            .attr('class', 'slice');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => this.colors[d.data.method.toLowerCase()])
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr('d', arcHover);
                this.currentHoveredMethod = d.data.method;
                if (this.centerTitle1 && this.centerTitle2 && this.centerTotal) {
                    const words = d.data.method.replace(/\b\w/g, l => l.toUpperCase()).split(' ');
                    if (words.length === 4) {
                        this.centerTitle1.text(words.slice(0,2).join(' '));
                        this.centerTitle2.text(words.slice(2).join(' '));
                    } else if (words.length === 3) {
                        this.centerTitle1.text(words.slice(0,2).join(' '));
                        this.centerTitle2.text(words.slice(2).join(' '));
                    } else {
                        this.centerTitle1.text(words.join(' '));
                        this.centerTitle2.text('');
                    }
                    this.centerTotal.text(`${SHARED_CONSTANTS.formatters.comma(d.data.fines)} fines`);
                }
                this.hideAgeGroupBreakdown(g);
                setTimeout(() => {
                    if (this.currentHoveredMethod === d.data.method) {
                        this.showAgeGroupBreakdown(g, d.data.method, d.startAngle, d.endAngle, radius, outerRingRadius);
                    }
                }, 50);
                // Update age group legend to show only relevant age groups for this method
                const methodAgeGroups = this.rawData
                    .filter(row => row.DETECTION_METHOD === d.data.method && row.AGE_GROUP && row.AGE_GROUP !== 'All ages')
                    .map(row => row.AGE_GROUP);
                const uniqueAgeGroups = Array.from(new Set(methodAgeGroups));
                this.renderAgeGroupLegend(uniqueAgeGroups, d.data.method);
                this.showTooltip(event, d.data);
            })
            .on('mouseout', (event, d) => {
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr('d', arc);
                this.currentHoveredMethod = null;
                if (this.centerTitle1 && this.centerTitle2 && this.centerTotal) {
                    this.centerTitle1.text('Detection');
                    this.centerTitle2.text('Methods');
                    this.centerTotal.text(`Total: ${SHARED_CONSTANTS.formatters.comma(d3.sum(pieData, d => d.fines))} fines`);
                }
                this.hideAgeGroupBreakdown(g);
                // Restore full age group legend
                this.renderAgeGroupLegend();
                this.hideTooltip();
            });

        // Add percentage labels for main slices
        arcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)')
            .text(d => `${(d.data.percentage * 100).toFixed(1)}%`);

        // Add center label
        const centerText = g.append('g')
            .attr('class', 'center-text');

        // Store references for dynamic update
        this.centerTitle1 = centerText.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('class', 'center-title1')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('Detection');

        this.centerTitle2 = centerText.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('dy', '1.2em')
            .attr('class', 'center-title2')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('Methods');

        // Add total in center
        const totalFines = d3.sum(pieData, d => d.fines);
        this.centerTotal = centerText.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('dy', '3em')
            .style('font-size', '14px')
            .style('fill', '#666')
            .text(`Total: ${SHARED_CONSTANTS.formatters.comma(totalFines)}`);

        // Add legend
        this.addLegend(svg, pieData);

        // Store references for age group breakdown
        this.svg = svg;
        this.g = g;
        this.radius = radius;
        this.outerRingRadius = outerRingRadius;
    }

    showAgeGroupBreakdown(g, method, startAngle, endAngle, innerRadius, outerRadius) {
        // Double-check that we should still show this breakdown (user might have moved mouse away)
        if (this.currentHoveredMethod !== method) {
            return;
        }

        // Get age group data for the SPECIFIC detection method being hovered
        // Filter data for this specific method and exclude "All ages" to avoid double counting
        const methodData = this.rawData.filter(d => 
            d.DETECTION_METHOD === method && 
            d.AGE_GROUP && 
            d.AGE_GROUP !== 'All ages'
        );
        
        const ageGroupData = d3.rollup(methodData,
            v => d3.sum(v, d => d.FINES),
            d => d.AGE_GROUP
        );

        const ageGroupArray = Array.from(ageGroupData.entries()).map(([ageGroup, fines]) => ({
            ageGroup,
            fines,
            percentage: fines / d3.sum(ageGroupData.values())
        }));

        // If no data for specific age groups, don't show breakdown
        if (ageGroupArray.length === 0) {
            return;
        }

        // Sort by percentage for better visual arrangement
        ageGroupArray.sort((a, b) => b.percentage - a.percentage);

        // Create pie layout for age groups covering the full circle (0 to 2π)
        const agePie = d3.pie()
            .value(d => d.fines)
            .sort(null)
            .startAngle(0)
            .endAngle(2 * Math.PI);

        const outerArc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        // Create age group slices
        const ageGroupSlices = g.selectAll('.age-group-slice')
            .data(agePie(ageGroupArray))
            .join('g')
            .attr('class', 'age-group-slice');

        // Add the slice paths
        ageGroupSlices.append('path')
            .attr('d', outerArc)
            .attr('fill', d => {
                const ageGroup = d.data.ageGroup || 'Unknown';
                return this.ageGroupColors[ageGroup] || this.ageGroupColors['Unknown'];
            })
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('opacity', 0);

        // Add annotations for each age group slice
        let labelLines = [];
        let labelTexts = [];

        const positions = [];

        ageGroupSlices.each((d, i, nodes) => {
            const slice = d3.select(nodes[i]);
            const midAngle = (d.startAngle + d.endAngle) / 2;
            const labelRadius = outerRadius + 20;

            if (d.data.percentage > 0) {
                const x = Math.cos(midAngle - Math.PI / 2) * labelRadius;
                const y = Math.sin(midAngle - Math.PI / 2) * labelRadius;
                positions.push({ d, slice, angle: midAngle, x, y });
            }
        });

        // Sort labels top to bottom
        positions.sort((a, b) => a.y - b.y);

        // Adjust y values to avoid overlaps
        const minGap = 20;
        for (let i = 1; i < positions.length; i++) {
            if (positions[i].y - positions[i - 1].y < minGap) {
                positions[i].y = positions[i - 1].y + minGap;
            }
        }

        //render adjusted lines and labels
        positions.forEach(({ d, slice, angle, x, y }) => {
            const start = [
                Math.cos(angle - Math.PI / 2) * (outerRadius - 5),
                Math.sin(angle - Math.PI / 2) * (outerRadius - 5)
            ];
            const mid = [
                Math.cos(angle - Math.PI / 2) * (outerRadius + 15),
                y
            ];
            const end = [
                x > 0 ? outerRadius + 80 : -outerRadius - 80,
                y
            ];

            const textAlign = x > 0 ? 'start' : 'end';

            // Add connector line (bent)
            slice.append('polyline')
                .attr('points', [start, mid, end])
                .attr('fill', 'none')
                .attr('stroke', '#333')
                .attr('stroke-width', 1)
                .style('opacity', 1);

            // Add external label
            slice.append('text')
                .attr('x', end[0] + (x > 0 ? 5 : -5))
                .attr('y', end[1])
                .attr('text-anchor', textAlign)
                .attr('dominant-baseline', 'central')
                .style('font-size', '15px')
                .style('fill', '#333')
                .style('font-weight', '400')
                .style('opacity', 0)
                .text(`${d.data.ageGroup}: ${(d.data.percentage * 100).toFixed(1)}%`);
        });

        // Fade-in animation - but only if this method is still being hovered
        if (this.currentHoveredMethod === method) {
            ageGroupSlices.selectAll('path')
                .transition()
                .duration(200)
                .style('opacity', 0.85);
            
            ageGroupSlices.selectAll('line')
                .transition()
                .duration(200)
                .style('opacity', 0.7);
            
            ageGroupSlices.selectAll('text')
                .transition()
                .duration(200)
                .style('opacity', 1);
        }
    }

    hideAgeGroupBreakdown(g) {
        // Immediately stop any running transitions and remove elements
        g.selectAll('.age-group-slice')
            .interrupt() // Stop any running transitions
            .remove(); // Immediately remove without transition for fast cleanup
    }

    addLegend(svg, pieData) {
        const legend = svg.append('g')
            .attr('transform', `translate(20, 20)`);
        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .text('Detection methods:')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .style('fill', '#333');
        pieData.forEach((d, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 45})`);
            legendItem.append('rect')
                .attr('width', 30)
                .attr('height', 30)
                .attr('x', 0)
                .attr('y', 20)
                .attr('fill', this.colors[d.method.toLowerCase()])
                .attr('rx', 3);
            const method = d.method;
            legendItem.append('text')
                .attr('x', 35)
                .attr('y', 30)
                .text(`${method}`)
                .style('font-size', '16px')
                .style('fill', '#333')
                .style('font-weight', 'bold');
            legendItem.append('text')
                .attr('x', 35)
                .attr('y', 45)
                .text(`${SHARED_CONSTANTS.formatters.comma(d.fines)} fines`)
                .style('font-size', '14px')
                .style('fill', '#666')
                .style('font-style', 'italic');
        });
        // Store reference to age group legend group for dynamic updates
        this.ageGroupLegendY = pieData.length * 35 + 50;
        this.ageGroupLegend = svg.append('g')
            .attr('transform', `translate(20, ${this.ageGroupLegendY})`);
        this.renderAgeGroupLegend();
    }

    renderAgeGroupLegend(filteredAgeGroups = null, method = null) {
        // Clear previous legend
        if (this.ageGroupLegend) {
            this.ageGroupLegend.selectAll('*').remove();
        }
        this.ageGroupLegend.append('text')
            .attr('x', 0)
            .attr('y', 30)
            .text('Age Groups:')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .style('fill', '#333');
        let ageGroupsToShow;
        if (filteredAgeGroups) {
            ageGroupsToShow = filteredAgeGroups;
        } else {
            ageGroupsToShow = Object.keys(this.ageGroupColors);
        }
        ageGroupsToShow.forEach((ageGroup, i) => {
            const ageItem = this.ageGroupLegend.append('g')
                .attr('transform', `translate(0, ${(i + 1) * 45})`);
            ageItem.append('rect')
                .attr('width', 30)
                .attr('height', 30)
                .attr('fill', this.ageGroupColors[ageGroup])
                .attr('rx', 2);
            ageItem.append('text')
                .attr('x', 40)
                .attr('y', 15)
                .text(ageGroup)
                .style('font-size', '16px')
                .style('fill', '#333')
                .style('font-weight', 'bold');
            let fines = 0;
            if (method) {
                fines = d3.sum(this.rawData.filter(d => d.AGE_GROUP === ageGroup && d.DETECTION_METHOD === method), d => d.FINES);
            } else {
                fines = d3.sum(this.rawData.filter(d => d.AGE_GROUP === ageGroup), d => d.FINES);
            }
            ageItem.append('text')
                .attr('x', 35)
                .attr('y', 30)
                .text(`${SHARED_CONSTANTS.formatters.comma(fines)} fines`)
                .style('font-size', '14px')
                .style('fill', '#666')
                .style('font-style', 'italic');
        });
    }
}

// Export for use in main dashboard
window.PieDonutChart = PieDonutChart;


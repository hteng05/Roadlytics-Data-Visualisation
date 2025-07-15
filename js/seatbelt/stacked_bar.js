// Chart 4: Stacked Bar Chart - Enforcement Strategy by Year
class StackedBarChart {
    constructor(containerId, tooltipId) {
        this.containerId = containerId;
        this.tooltipId = tooltipId;
        this.colors = {
            'police issued': '#2E86AB',
            'fixed or mobile camera': '#A23B72', 
            'mobile camera': '#E74C3C'
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

        const margin = { top: 50, right: 160, bottom: 60, left: 100 };
        const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Get all detection methods in the data
        const allMethods = [...new Set(data.map(d => d.DETECTION_METHOD))];
        
        // Aggregate data by year and detection method
        const nested = d3.rollup(data,
            v => d3.sum(v, d => d.FINES),
            d => d.YEAR, 
            d => d.DETECTION_METHOD
        );

        const years = Array.from(nested.keys()).filter(year => year); // Filter out empty values
        const stackData = years.map(year => {
            const methods = nested.get(year) || new Map();
            const row = { year }; 
            allMethods.forEach(method => {
                row[method] = methods.get(method) || 0;
            });
            return row;
        });

        const stack = d3.stack()
            .keys(allMethods);

        const stackedData = stack(stackData);

        const xScale = d3.scaleBand()
            .domain(years)
            .range([0, width])
            .padding(0.3);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1]) || 1000])
            .nice()
            .range([height, 0]);

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('font-size', '12px')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        g.append('g')
            .call(d3.axisLeft(yScale).tickFormat(d3.format('.2s')))
            .selectAll('text')
            .style('font-size', '12px');

        // Add bars with max width constraint
        const maxBarWidth = 60;
        const barWidth = Math.min(xScale.bandwidth(), maxBarWidth);
        const barOffset = (xScale.bandwidth() - barWidth) / 2;

        const groups = g.selectAll('.layer')
            .data(stackedData)
            .join('g')
            .attr('class', 'layer')
            .attr('fill', d => this.colors[d.key.toLowerCase()]);

        groups.selectAll('.bar')
            .data(d => d)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.data.year) + barOffset) 
            .attr('y', d => yScale(d[1]))
            .attr('height', d => yScale(d[0]) - yScale(d[1]))
            .attr('width', barWidth)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());

        // Add total labels on top of each bar
        const totals = stackData.map(d => {
            return {
                year: d.year,
                total: allMethods.reduce((sum, method) => sum + (d[method] || 0), 0)
            };
        });

        g.selectAll('.total-label')
            .data(totals)
            .join('text')
            .attr('class', 'total-label')
            .attr('x', d => xScale(d.year) + barOffset + barWidth / 2)
            .attr('y', d => yScale(d.total) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', '400')
            .style('fill', '#333')
            .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
            .text(d => SHARED_CONSTANTS.formatters.comma(d.total));

        // Add chart title
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.top + 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Seatbelt Fines by Year and Detection Method');

        // Add legend
        this.addLegend(g, allMethods, width);

        // Add axis labels
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left +30)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Number of Fines');

        g.append('text')
            .attr('transform', `translate(${width + 50}, ${height + 5})`)
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Year');
    }

    addLegend(g, allMethods, width) {
        const legend = g.append('g')
            .attr('transform', `translate(${width + 20}, 20)`);

        allMethods.forEach((method, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 35})`);

            legendItem.append('rect')
                .attr('width', 18)
                .attr('height', 18)
                .attr('fill', this.colors[method.toLowerCase()]);

            // Split long text into multiple lines manually
            const words = method.split(' ');
            if (words.length > 2) {
                // First line
                legendItem.append('text')
                    .attr('x', 25)
                    .attr('y', 14)
                    .text(words.slice(0, 2).join(' '))
                    .style('font-size', '12px');
                
                // Second line
                legendItem.append('text')
                    .attr('x', 25)
                    .attr('y', 28)
                    .text(words.slice(2).join(' '))
                    .style('font-size', '12px');
            } else {
                legendItem.append('text')
                    .attr('x', 25)
                    .attr('y', 14)
                    .text(method)
                    .style('font-size', '12px');
            }
        });
    }

    showTooltip(event, data) {
        const tooltip = d3.select(`#${this.tooltipId}`);
        const stackKey = event.target.parentNode.__data__.key;
        const value = data.data[stackKey];
        
        const content = `
            <strong>${data.data.year}</strong><br/> 
            ${stackKey}: ${SHARED_CONSTANTS.formatters.comma(value)}
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
}

// Export for use in main dashboard
window.StackedBarChart = StackedBarChart;
// Main Seatbelt Dashboard - Coordinates all charts
class SeatbeltDashboard {
    constructor() {
        this.data = null;
        this.filteredData = null;
        this.activeFilters = {
            year: '',
            ageGroup: '',
            jurisdiction: '',
            detectionMethod: ''
        };
        
        // Initialize individual charts
        this.stackedBarChart = new StackedBarChart('chart4-container', 'seatbelt-tooltip');
        this.multiLineChart = new MultiLineChart('chart5-container', 'chart5-legend', 'seatbelt-tooltip');
        this.pieDonutChart = new PieDonutChart('chart6-container', 'seatbelt-tooltip');
        
        this.init();
    }

    init() {
        // Wait for data to be loaded
        const checkData = () => {
            if (window.sharedData && window.sharedData.seatbeltData) {
                this.data = window.sharedData.seatbeltData;
                this.setupFilters();
                this.updateAllCharts();
                this.setupEventListeners();
            } else {
                setTimeout(checkData, 100);
            }
        };
        checkData();
    }

    setupFilters() {
        const years = [...new Set(this.data.map(d => d.YEAR))].sort();
        const ageGroups = [...new Set(this.data.map(d => d.AGE_GROUP).filter(d => d))].sort();
        const jurisdictions = [...new Set(this.data.map(d => d.JURISDICTION).filter(d => d))].sort();
        const detectionMethods = [...new Set(this.data.map(d => d.DETECTION_METHOD).filter(d => d))].sort();

        this.populateDropdown('sb-year-filter', years);
        this.populateDropdown('sb-age-filter', ageGroups);
        this.populateDropdown('sb-jurisdiction-filter', jurisdictions);
        this.populateDropdown('sb-detection-filter', detectionMethods);

        // Initialize jurisdiction visibility in multi-line chart
        const jurisdictionVisibility = {};
        jurisdictions.forEach(j => jurisdictionVisibility[j] = true);
        this.multiLineChart.setJurisdictionVisibility(jurisdictionVisibility);
    }

    populateDropdown(id, options) {
        const select = d3.select(`#${id}`);
        select.selectAll('option.data-option').remove();
        
        select.selectAll('option.data-option')
            .data(options)
            .join('option')
            .attr('class', 'data-option')
            .attr('value', d => d)
            .text(d => d);
    }

    setupEventListeners() {
        // Filter change listeners
        d3.selectAll('#section2-seatbelt select').on('change', () => {
            this.updateFilters();
            
            // Clear multi-line chart selection when filters change manually
            this.multiLineChart.clearSelection();
            
            this.updateAllCharts();
        });

        // Reset button
        d3.select('#reset-filters').on('click', () => {
            this.resetFilters();
        });
    }

    updateFilters() {
        this.activeFilters = {
            year: d3.select('#sb-year-filter').property('value'),
            ageGroup: d3.select('#sb-age-filter').property('value'),
            jurisdiction: d3.select('#sb-jurisdiction-filter').property('value'),
            detectionMethod: d3.select('#sb-detection-filter').property('value')
        };
    }

    resetFilters() {
        d3.selectAll('#section2-seatbelt select').property('value', '');
        this.activeFilters = {
            year: '',
            ageGroup: '',
            jurisdiction: '',
            detectionMethod: ''
        };
        
        // Reset jurisdiction visibility and clear selection
        const jurisdictions = [...new Set(this.data.map(d => d.JURISDICTION).filter(d => d))];
        const jurisdictionVisibility = {};
        jurisdictions.forEach(j => jurisdictionVisibility[j] = true);
        this.multiLineChart.setJurisdictionVisibility(jurisdictionVisibility);
        this.multiLineChart.clearSelection();
        
        this.updateAllCharts();
    }

    filterData() {
        this.filteredData = this.data.filter(d => {
            return (!this.activeFilters.year || d.YEAR == this.activeFilters.year) &&
                   (!this.activeFilters.ageGroup || d.AGE_GROUP === this.activeFilters.ageGroup) &&
                   (!this.activeFilters.jurisdiction || d.JURISDICTION === this.activeFilters.jurisdiction) &&
                   (!this.activeFilters.detectionMethod || d.DETECTION_METHOD === this.activeFilters.detectionMethod);
        });
    }

    updateAllCharts() {
        this.filterData();
        this.updateStats();
        this.renderStackedBarChart();
        this.renderMultiLineChart(); // This will now handle the logic internally
        this.renderPieChart();
    }

    updateStats() {
        const totalFines = d3.sum(this.filteredData, d => d.FINES);
        const years = [...new Set(this.filteredData.map(d => d.YEAR))];
        const avgFines = years.length > 0 ? Math.round(totalFines / years.length) : 0;
        
        const jurisdictionTotals = d3.rollup(this.filteredData, 
            v => d3.sum(v, d => d.FINES), 
            d => d.JURISDICTION
        );
        const topJurisdiction = [...jurisdictionTotals.entries()]
            .sort((a, b) => b[1] - a[1])[0];

        d3.select('#total-fines-stat').text(SHARED_CONSTANTS.formatters.comma(totalFines));
        d3.select('#avg-fines-stat').text(SHARED_CONSTANTS.formatters.comma(avgFines));
        d3.select('#top-jurisdiction-stat').text(topJurisdiction ? topJurisdiction[0] : 'N/A');
    }

    // Individual chart render methods
    renderStackedBarChart() {
        this.stackedBarChart.render(this.filteredData);
    }

    renderMultiLineChart() {
        // Check if there's a manual jurisdiction filter set (from dropdown)
        const hasManualJurisdictionFilter = this.activeFilters.jurisdiction && 
                                           this.multiLineChart.getSelectedJurisdiction() === null;
        
        if (hasManualJurisdictionFilter) {
            // Use filtered data when jurisdiction is selected via dropdown
            this.multiLineChart.render(this.filteredData);
        } else {
            // Use data filtered by everything EXCEPT jurisdiction when using legend selection
            const multiLineData = this.data.filter(d => {
                return (!this.activeFilters.year || d.YEAR == this.activeFilters.year) &&
                       (!this.activeFilters.ageGroup || d.AGE_GROUP === this.activeFilters.ageGroup) &&
                       (!this.activeFilters.detectionMethod || d.DETECTION_METHOD === this.activeFilters.detectionMethod);
                // Note: deliberately NOT filtering by jurisdiction for legend-based selection
            });
            this.multiLineChart.render(multiLineData);
        }
    }

    renderPieChart() {
        this.pieDonutChart.render(this.filteredData);
    }

    // Method to get current state for external access
    getCurrentFilters() {
        return this.activeFilters;
    }

    getCurrentData() {
        return this.filteredData;
    }

    // Method to programmatically set filters
    setFilters(filters) {
        this.activeFilters = { ...this.activeFilters, ...filters };
        
        // Update dropdown values
        if (filters.year !== undefined) {
            d3.select('#sb-year-filter').property('value', filters.year);
        }
        if (filters.ageGroup !== undefined) {
            d3.select('#sb-age-filter').property('value', filters.ageGroup);
        }
        if (filters.jurisdiction !== undefined) {
            d3.select('#sb-jurisdiction-filter').property('value', filters.jurisdiction);
        }
        if (filters.detectionMethod !== undefined) {
            d3.select('#sb-detection-filter').property('value', filters.detectionMethod);
        }
        
        // Update charts - but multi-line chart handles jurisdiction selection differently
        this.filterData();
        this.updateStats();
        this.renderStackedBarChart();
        this.renderMultiLineChart(); // This will ignore jurisdiction filter for Y-axis consistency
        this.renderPieChart();
    }

    // Method for responsive resize
    resize() {
        this.updateAllCharts();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for chart classes to be available
    const initDashboard = () => {
        if (window.sharedData && 
            window.StackedBarChart && 
            window.MultiLineChart && 
            window.PieDonutChart) {
            window.seatbeltDashboard = new SeatbeltDashboard();
            
            // Add resize listener for responsive design
            window.addEventListener('resize', () => {
                if (window.seatbeltDashboard) {
                    setTimeout(() => {
                        window.seatbeltDashboard.resize();
                    }, 100);
                }
            });
        } else {
            setTimeout(initDashboard, 100);
        }
    };
    initDashboard();
});
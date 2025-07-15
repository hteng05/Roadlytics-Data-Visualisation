/**
 * Car Crash Dashboard Filter Integration
 * Connects the modern UI filters to the chart update functions
 * File: js/car-crash-integration.js
 */

(function() {
    'use strict';

    // Global filter state
    let currentFilters = {
        violationType: 'drug',
        year: '',
        ageGroup: '',
        region: '',
        jurisdiction: ''
    };

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Car crash filter integration loading...');
        waitForData();
    });

    /**
     * Wait for chart functions and data to be loaded
     */
    function waitForData() {
        if (typeof window.updateComboChart === 'function' && 
            typeof window.updateDonutChart === 'function') {
            initializeFilters();
        } else {
            setTimeout(waitForData, 100);
        }
    }

    /**
     * Initialize all filter event listeners
     */
    function initializeFilters() {
        console.log('Initializing car crash filters...');
        
        setupViolationToggle();
        setupRegularFilters();
        createCompatibilityElements();
        setupResetButton();
        
        // Initial chart render
        updateAllCharts();
    }

    /**
     * Setup the modern violation toggle functionality
     */
    function setupViolationToggle() {
        const drugOption = document.getElementById('drug-option');
        const seatbeltOption = document.getElementById('seatbelt-option');
        const slider = document.getElementById('violation-slider');
        
        if (!drugOption || !seatbeltOption || !slider) {
            console.error('Violation toggle elements not found');
            return;
        }

        function handleToggle(selectedOption, otherOption, violationType, sliderClass) {
            // Update UI state
            selectedOption.classList.add('active');
            otherOption.classList.remove('active');
            
            // Move slider
            if (sliderClass) {
                slider.classList.add(sliderClass);
            } else {
                slider.classList.remove('seatbelt');
            }
            
            // Visual feedback animation
            selectedOption.style.transform = 'scale(0.95)';
            setTimeout(() => {
                selectedOption.style.transform = 'scale(1)';
            }, 150);
            
            // Update filter state
            currentFilters.violationType = violationType;
            
            // Update hidden select for compatibility
            const hiddenSelect = document.getElementById('violation-toggle');
            if (hiddenSelect) {
                hiddenSelect.value = violationType;
                // Trigger change event for any legacy listeners
                hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            console.log('Violation type changed to:', violationType);
            
            // Update charts
            updateAllCharts();
        }
        
        // Event listeners for toggle buttons
        drugOption.addEventListener('click', () => {
            handleToggle(drugOption, seatbeltOption, 'drug');
        });
        
        seatbeltOption.addEventListener('click', () => {
            handleToggle(seatbeltOption, drugOption, 'seatbelt', 'seatbelt');
        });
    }

    /**
     * Setup regular filter dropdowns
     */
    function setupRegularFilters() {
        // Year filter
        const yearFilter = document.getElementById('crash-year-filter');
        if (yearFilter) {
            yearFilter.addEventListener('change', function() {
                currentFilters.year = this.value;
                console.log('Year filter changed to:', this.value);
                updateAllCharts();
            });
        }

        // Age group filter
        const ageFilter = document.getElementById('crash-age-filter');
        if (ageFilter) {
            ageFilter.addEventListener('change', function() {
                currentFilters.ageGroup = this.value;
                console.log('Age group filter changed to:', this.value);
                updateAllCharts();
            });
        }

        // Region filter
        const regionFilter = document.getElementById('crash-region-filter');
        if (regionFilter) {
            regionFilter.addEventListener('change', function() {
                currentFilters.region = this.value;
                console.log('Region filter changed to:', this.value);
                updateAllCharts();
            });
        }

        // Jurisdiction filter (if exists)
        const jurisdictionFilter = document.getElementById('jurisdiction-filter');
        if (jurisdictionFilter) {
            jurisdictionFilter.addEventListener('change', function() {
                currentFilters.jurisdiction = this.value;
                console.log('Jurisdiction filter changed to:', this.value);
                updateAllCharts();
            });
        }

        // Legacy compatibility - listen for changes on old filter structure
        setupLegacyCompatibility();
    }

    /**
     * Setup legacy filter compatibility
     */
    function setupLegacyCompatibility() {
        const crashFilters = document.getElementById('crash-filters');
        if (crashFilters) {
            crashFilters.addEventListener('change', function(e) {
                console.log('Legacy filter change detected:', e.target.id, e.target.value);
                
                switch(e.target.id) {
                    case 'crash-year-filter':
                        currentFilters.year = e.target.value;
                        break;
                    case 'crash-age-filter':
                        currentFilters.ageGroup = e.target.value;
                        break;
                    case 'crash-region-filter':
                        currentFilters.region = e.target.value;
                        break;
                    case 'violation-toggle':
                        currentFilters.violationType = e.target.value;
                        updateToggleUI(e.target.value);
                        break;
                }
                
                updateAllCharts();
            });
        }
    }

    /**
     * Update toggle UI when changed programmatically
     */
    function updateToggleUI(violationType) {
        const drugOption = document.getElementById('drug-option');
        const seatbeltOption = document.getElementById('seatbelt-option');
        const slider = document.getElementById('violation-slider');
        
        if (!drugOption || !seatbeltOption || !slider) return;
        
        if (violationType === 'drug') {
            drugOption.classList.add('active');
            seatbeltOption.classList.remove('active');
            slider.classList.remove('seatbelt');
        } else {
            seatbeltOption.classList.add('active');
            drugOption.classList.remove('active');
            slider.classList.add('seatbelt');
        }
    }

    /**
     * Create hidden elements for backward compatibility
     */
    function createCompatibilityElements() {
        // Create hidden violation toggle select if it doesn't exist
        let hiddenSelect = document.getElementById('violation-toggle');
        if (!hiddenSelect) {
            hiddenSelect = document.createElement('select');
            hiddenSelect.id = 'violation-toggle';
            hiddenSelect.style.display = 'none';
            hiddenSelect.innerHTML = `
                <option value="drug">Drug</option>
                <option value="seatbelt">Seatbelt</option>
            `;
            hiddenSelect.value = currentFilters.violationType;
            document.body.appendChild(hiddenSelect);
        }
        
        // Create hidden filters container if it doesn't exist
        let filtersContainer = document.getElementById('crash-filters');
        if (!filtersContainer) {
            filtersContainer = document.createElement('div');
            filtersContainer.id = 'crash-filters';
            filtersContainer.style.display = 'none';
            document.body.appendChild(filtersContainer);
        }
    }

    /**
     * Setup the reset filters button
     */
    function setupResetButton() {
        const resetButton = document.getElementById('reset-crash-filters');
        if (!resetButton) {
            console.error('Reset filters button not found');
            return;
        }

        resetButton.addEventListener('click', function() {
            // Reset all filters to default
            currentFilters = {
                violationType: 'drug',
                year: '',
                ageGroup: '',
                region: '',
                jurisdiction: ''
            };
            
            // Reset UI elements
            const yearFilter = document.getElementById('crash-year-filter');
            const ageFilter = document.getElementById('crash-age-filter');
            const regionFilter = document.getElementById('crash-region-filter');
            
            if (yearFilter) yearFilter.value = '';
            if (ageFilter) ageFilter.value = '';
            if (regionFilter) regionFilter.value = '';
            
            // Reset toggle to drug violations
            updateToggleUI('drug');
            
            // Add visual feedback
            resetButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                resetButton.style.transform = 'scale(1)';
            }, 150);
            
            // Update charts
            updateAllCharts();
            
            console.log('All filters reset to default');
        });
    }

    /**
     * Update all charts with current filter state
     */
    function updateAllCharts() {
        console.log('Updating all charts with filters:', currentFilters);
        
        try {
            // Update combo chart
            if (typeof window.updateComboChart === 'function') {
                window.updateComboChart(currentFilters);
            } else {
                console.warn('updateComboChart function not available');
            }
            
            // Update donut chart
            if (typeof window.updateDonutChart === 'function') {
                window.updateDonutChart(currentFilters);
            } else {
                console.warn('updateDonutChart function not available');
            }
            
            // Update any other charts if they exist
            if (typeof window.updateBoxplotChart === 'function') {
                window.updateBoxplotChart(currentFilters);
            }
            
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    /**
     * Public API functions
     */
    
    // Manually update filters from external code
    window.updateCarCrashFilters = function(newFilters) {
        currentFilters = { ...currentFilters, ...newFilters };
        
        // Update UI to reflect new filters
        if (newFilters.violationType) {
            updateToggleUI(newFilters.violationType);
            const hiddenSelect = document.getElementById('violation-toggle');
            if (hiddenSelect) {
                hiddenSelect.value = newFilters.violationType;
            }
        }
        
        updateAllCharts();
    };

    // Get current filter state
    window.getCarCrashFilters = function() {
        return { ...currentFilters };
    };

    // Reset all filters to default
    window.resetCarCrashFilters = function() {
        currentFilters = {
            violationType: 'drug',
            year: '',
            ageGroup: '',
            region: '',
            jurisdiction: ''
        };
        
        // Reset UI elements
        const yearFilter = document.getElementById('crash-year-filter');
        const ageFilter = document.getElementById('crash-age-filter');
        const regionFilter = document.getElementById('crash-region-filter');
        
        if (yearFilter) yearFilter.value = '';
        if (ageFilter) ageFilter.value = '';
        if (regionFilter) regionFilter.value = '';
        
        updateToggleUI('drug');
        updateAllCharts();
    };

    // Debug function to check filter integration
    window.debugCarCrashFilters = function() {
        console.log('=== Car Crash Filter Debug ===');
        console.log('Current filters:', currentFilters);
        console.log('updateComboChart available:', typeof window.updateComboChart === 'function');
        console.log('updateDonutChart available:', typeof window.updateDonutChart === 'function');
        
        const elements = [
            'drug-option',
            'seatbelt-option', 
            'violation-slider',
            'crash-year-filter',
            'crash-age-filter',
            'crash-region-filter',
            'violation-toggle'
        ];
        
        console.log('UI Elements:');
        elements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`  ${id}:`, element ? 'Found' : 'Missing');
        });
        
        console.log('Chart functions:');
        console.log('  updateComboChart:', typeof window.updateComboChart);
        console.log('  updateDonutChart:', typeof window.updateDonutChart);
        console.log('  updateBoxplotChart:', typeof window.updateBoxplotChart);
    };

    // Force chart update (useful for debugging)
    window.forceCarCrashUpdate = function() {
        console.log('Forcing chart update...');
        updateAllCharts();
    };

})();
Promise.all([
  d3.csv("data/total-drug-test.csv", d3.autoType),
  d3.csv("data/positive-drug.csv", d3.autoType),
  d3.csv("data/no-seatbelts.csv", d3.autoType),
  d3.csv("data/drug-consequence.csv", d3.autoType),
  d3.csv("data/no-seatbelts-consequence.csv", d3.autoType),
  d3.json("data/aus-states.geojson")
]).then(([drugData, positiveData, seatbeltData, drugConsequenceData, seatbeltConsequenceData, geoData]) => {
  
  // Store data globally for access by all components
  window.sharedData = { 
    drugData, 
    positiveData, 
    seatbeltData, 
    drugConsequenceData, 
    seatbeltConsequenceData, 
    geoData 
  };

  // Create dropdowns with both datasets
  if (window.createDrugDropdowns) {
    window.createDrugDropdowns(drugData, positiveData);
  }

  if (window.renderChoropleth) {
    window.renderChoropleth(drugData, geoData);
  }

  if (window.renderPositiveDrugBarChart) {
    window.renderPositiveDrugBarChart(positiveData);
  }

  if (window.renderJurisdictionLineChart) {
    window.renderJurisdictionLineChart(drugData);
  }

  if (window.createCrashFilters) {
    window.createCrashFilters(drugConsequenceData, seatbeltData, positiveData);
  }

  if (window.renderComboChart) {
    window.renderComboChart(drugConsequenceData, seatbeltData, positiveData, seatbeltConsequenceData);
  }

  if (window.renderDonutChart) {
    window.renderDonutChart(drugConsequenceData, seatbeltConsequenceData);
  }

  if (window.renderBoxplotChart) {
    window.renderBoxplotChart(drugConsequenceData);
  }

  if (window.initializeShowAllDataButton) {
    window.initializeShowAllDataButton();
  }
  
});
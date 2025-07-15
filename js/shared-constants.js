const SHARED_CONSTANTS = {
  // Default layout settings
  defaultMargin: { top: 60, right: 40, bottom: 60, left: 40 },
  defaultWidth: 1200,
  defaultHeight: 800,

  // Jurisdiction full name → code mapping
  jurisdictionNameToCode: {
    'New South Wales': 'NSW',
    'Victoria': 'VIC', 
    'Queensland': 'QLD',
    'South Australia': 'SA',
    'Western Australia': 'WA',
    'Tasmania': 'TAS',
    'Northern Territory': 'NT',
    'Australian Capital Territory': 'ACT'
  },

  // Common color scales
  colorScales: {
    blueGradient: t => d3.interpolateBlues(0.2 + 0.8 * t),
  },

  // Formatters
  formatters: {
    comma: d3.format(","),
    percent: d3.format(".1%")
  }
};

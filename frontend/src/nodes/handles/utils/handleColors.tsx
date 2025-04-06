export const getTypeColor = (type) => {
  const colors = {
    '<class \'str\'>': '#ff8c00',   // Orange
    '<class \'int\'>': '#4169e1',      // Royal Blue
    'float': '#32cd32',    // Lime Green
    'bool': '#ff69b4',     // Hot Pink
    'image': '#9370db',    // Medium Purple
    // Add more type-color mappings as needed
  };
  
  return colors[type] || '#aaaaaa'; // Default gray if type not found
};

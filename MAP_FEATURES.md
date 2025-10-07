# Map Features Documentation

## Overview
This document describes the advanced mapping features implemented in the GIS application.

## 1. Point Clustering

### What it does
Automatically groups nearby map markers into clusters to prevent visual clutter, especially useful when displaying large datasets.

### How to use
- **Toggle**: Use the "Point Clustering" switch in the map builder sidebar
- **Behavior**: 
  - Markers within 50 pixels are grouped together
  - Cluster circles show the count of points
  - Click a cluster to zoom in and expand it
  - Click individual markers to see their data

### Technical details
- Uses `leaflet.markercluster` library
- Cluster radius: 50 pixels
- Auto-spiderfies on max zoom
- Shows coverage area on hover
- Clusters are styled using the theme colors

## 2. Attribute-Based Styling

### What it does
Color map markers dynamically based on field values from your form data (e.g., red for "urgent", green for "complete").

### How to use
1. Click the **Settings icon** (⚙️) on any layer in the layer panel
2. Select a field from your form
3. The system automatically detects unique values
4. Assign colors to each value
5. Click "Apply Style Rule"

### Examples
- **Status field**: Color by "pending", "approved", "rejected"
- **Priority field**: Color by "high", "medium", "low"
- **Category field**: Different colors for each category

### Technical details
- Analyzes form responses to find unique field values
- Supports all text and select field types
- Overrides the default layer color when active
- Persisted in map configuration

## 3. Rich Popups

### What it does
Displays all form field data in a beautifully formatted popup when clicking on map markers.

### Features
- **Layer title**: Shows which form the data comes from
- **All fields**: Displays every field from the response
- **Smart formatting**:
  - Arrays are joined with commas
  - Objects are formatted as JSON
  - Field names are capitalized and styled
- **Responsive**: Adapts to different screen sizes

### Technical details
- Maximum width: 300px
- Automatic text wrapping
- Filters out internal fields (like `_client_id`)
- Uses semantic HTML for accessibility

## 4. Map Configuration

### Persistence
All settings are saved to the database:
- Clustering enabled/disabled
- Basemap selection
- Layer configurations
- Style rules
- Symbol types and sizes

### Loading behavior
- Clustering defaults to enabled for new maps
- Existing maps preserve their settings
- Layer visibility is maintained
- Style rules are applied automatically

## 5. Layer Controls

### Available options per layer
- **Visibility**: Eye icon to show/hide
- **Color**: Color picker for default marker color
- **Symbol type**: Choose from 10 different marker shapes
- **Symbol size**: Small, medium, or large
- **Styling**: Attribute-based coloring (via Settings)

## 6. Z-Index Management

All UI elements are properly layered:
- Map: `z-0` (bottom)
- Sidebar: `z-10`
- Dropdowns: `z-[9999]`
- Dialogs: `z-[10000]` (top)

This ensures dropdowns and dialogs always appear above the map.

## 7. Best Practices

### Performance
- Use clustering for datasets with 50+ points
- Limit visible layers to 3-5 for best performance
- Use attribute-based styling instead of creating multiple layers

### Styling
- Choose contrasting colors for different layers
- Use attribute-based styling for categorical data
- Keep marker sizes consistent across similar data types

### User Experience
- Add descriptive layer titles
- Use meaningful field names in forms
- Test popups to ensure all important data is visible
- Provide map descriptions for end users

## 8. Troubleshooting

### Markers not clustering
- Check if clustering is enabled in map settings
- Ensure markers are close enough (within 50px at current zoom)
- Try zooming out to see clusters form

### Style rules not applying
- Verify the field exists in your form responses
- Check that field values match exactly (case-sensitive)
- Ensure the layer is visible

### Dropdowns hidden behind map
- This should be fixed with proper z-index
- If persisting, check browser console for errors
- Try refreshing the page

## 9. Future Enhancements

Potential additions for future versions:
- Layer filtering by attribute values
- Real-time data updates
- Heatmap visualization
- Custom basemap support
- Export styled maps as images
- Time-based animations
- Measurement tools
- Drawing tools

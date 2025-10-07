# GIS Integration Guide

Complete guide for integrating Field Data Collection form submissions with QGIS, ArcGIS Pro, and other GIS applications.

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [QGIS Integration](#qgis-integration)
4. [ArcGIS Pro Integration](#arcgis-pro-integration)
5. [Advanced Features](#advanced-features)
6. [Troubleshooting](#troubleshooting)

---

## Overview

This system provides three methods to access form submission data in GIS applications:

### 1. **Live GeoJSON Feed** (Recommended for most users)
- **Best for**: QGIS, ArcGIS Pro, web maps
- **Format**: GeoJSON (RFC 7946)
- **Features**: Simple, fast, auto-updating
- **Use case**: Real-time data visualization and analysis

### 2. **WFS Service** (OGC Standard)
- **Best for**: Professional GIS workflows
- **Format**: OGC WFS 2.0.0 compliant
- **Features**: Schema introspection, advanced queries, bbox filtering
- **Use case**: Enterprise GIS systems, standardized workflows

### 3. **ArcGIS Feature Service** (ESRI Format)
- **Best for**: ArcGIS Online, ArcGIS Server
- **Format**: ESRI REST API
- **Features**: Native ArcGIS compatibility, pagination
- **Use case**: ESRI ecosystem integration

---

## Getting Started

### Step 1: Create a Public Share Link

1. Navigate to the Forms page in your analyst dashboard
2. Find the form you want to integrate
3. Click the **Share** button
4. Select **Public** access type
5. Copy the generated share token

### Step 2: Get Your Integration URLs

1. Click the **GIS** button on the form card
2. The GIS Integration dialog will show all available URLs:
   - Live GeoJSON Feed URL
   - WFS Service URL
   - ArcGIS Feature Service URL

### Step 3: Choose Your Integration Method

Select the method that best fits your workflow (see sections below).

---

## QGIS Integration

### Method 1: GeoJSON Live Feed (Recommended)

**Advantages:**
- Simplest setup
- Auto-updating data
- Works with all QGIS versions

**Steps:**

1. **Open QGIS Desktop** (version 3.0 or higher)

2. **Add Vector Layer**
   - Go to `Layer → Add Layer → Add Vector Layer`
   - Or press `Ctrl+Shift+V` (Windows/Linux) or `Cmd+Shift+V` (Mac)

3. **Configure Protocol Connection**
   - Source Type: Select **Protocol: HTTP(S), cloud, etc.**
   - Protocol Type: Select **GeoJSON**
   - URI: Paste your GeoJSON Feed URL

4. **Click Add**

5. **Enable Auto-Refresh (Optional)**
   - Right-click the layer → Properties
   - Go to Rendering tab
   - Check "Refresh layer at interval"
   - Set interval (e.g., 60 seconds)

**Example URL:**
```
https://shqclgwsgmlnimcggxch.supabase.co/functions/v1/public-geojson-feed?token=YOUR_TOKEN&formId=YOUR_FORM_ID
```

### Method 2: WFS Connection (Advanced)

**Advantages:**
- Standard OGC protocol
- Schema information included
- Advanced filtering capabilities

**Steps:**

1. **Add WFS Layer**
   - Go to `Layer → Add Layer → Add WFS Layer`

2. **Create New Connection**
   - Click **New**
   - Name: "Field Data Collection"
   - URL: `https://shqclgwsgmlnimcggxch.supabase.co/functions/v1/wfs-service?token=YOUR_TOKEN`
   - Version: WFS 2.0.0

3. **Connect and Add Layer**
   - Click **OK**, then **Connect**
   - Select the form layer
   - Click **Add**

### QGIS Styling Tips

**Graduated Symbols by Attribute:**
```
Layer Properties → Symbology → Graduated
- Select attribute field
- Choose classification method
- Set color ramp
```

**Time Manager Animation:**
```
Install TimeManager plugin
Configure layer's time attribute
Animate data collection over time
```

**Spatial Queries:**
```
Use "Select by Location" to find patterns
Buffer analysis on point features
Overlay multiple form layers
```

---

## ArcGIS Pro Integration

### Method 1: GeoJSON Layer (Quick Start)

**Steps:**

1. **Open ArcGIS Pro**

2. **Add Data from Path**
   - Go to `Map → Add Data → Data from Path`
   - Paste GeoJSON Feed URL
   - Click **OK**

3. **The layer will appear in your map**

**Limitations:**
- No auto-refresh in ArcGIS Pro
- Requires manual reload for updates

### Method 2: ArcGIS Feature Service (Recommended)

**Advantages:**
- Native ESRI format
- Better performance
- Pagination support

**Steps:**

1. **Add Feature Service**
   - In Catalog pane, right-click **Servers**
   - Select **New ArcGIS Server**
   
2. **Configure Connection**
   - Server URL: `https://shqclgwsgmlnimcggxch.supabase.co/functions/v1/arcgis-feature-service/YOUR_FORM_ID`
   - Add `?token=YOUR_TOKEN` to query parameters

3. **Add to Map**
   - Drag the layer from Catalog to your map

### ArcGIS Online Integration

1. **Add Layer from Web**
   - Click **Add → Add Layer from Web**
   - Choose **A GeoJSON File**
   - Paste GeoJSON URL

2. **Configure Pop-ups**
   - Click layer → Configure Pop-ups
   - Enable/customize field display

3. **Create Web Map**
   - Save and share your map
   - Set visibility and permissions

### ArcGIS Server Integration

For enterprise deployments:

1. Create a custom REST endpoint
2. Point to the ArcGIS Feature Service URL
3. Configure caching and security
4. Publish as a service

---

## Advanced Features

### Spatial Filtering (Bounding Box)

Limit results to a geographic area:

**GeoJSON Feed:**
```
?token=TOKEN&formId=FORM_ID&bbox=-180,-90,180,90
```

**WFS:**
```
&bbox=-180,-90,180,90,EPSG:4326
```

**Parameters:**
- Format: `minLon,minLat,maxLon,maxLat`
- Coordinate System: WGS84 (EPSG:4326)

### Temporal Filtering

Get only recent submissions:

```
?token=TOKEN&formId=FORM_ID&since=2025-01-01T00:00:00Z
```

### Limiting Results

Control the number of features returned:

```
?token=TOKEN&formId=FORM_ID&limit=1000
```

### Caching and Performance

**ETag Support:**
The service uses HTTP ETags for efficient caching. Your GIS client will automatically reuse cached data if nothing has changed.

**Recommended Refresh Intervals:**
- Real-time monitoring: 30-60 seconds
- Daily updates: 15-30 minutes
- Historical data: Manual refresh

### WFS Advanced Queries

**GetCapabilities:**
```
?token=TOKEN&service=WFS&request=GetCapabilities
```

**DescribeFeatureType:**
```
?token=TOKEN&service=WFS&request=DescribeFeatureType&typeName=form_FORM_ID
```

**GetFeature with filters:**
```
?token=TOKEN&service=WFS&request=GetFeature&typeName=form_FORM_ID&maxFeatures=100
```

---

## Troubleshooting

### Issue: "Layer shows empty / No features"

**Possible Causes:**
1. Invalid or expired token
2. Form has no submissions yet
3. Geometry type mismatch

**Solutions:**
1. Regenerate the share token
2. Submit test data to the form
3. Check form geometry type matches layer expectations

### Issue: "Connection failed" or "403 Forbidden"

**Possible Causes:**
1. Token not included in URL
2. Token expired
3. Network/firewall blocking request

**Solutions:**
1. Double-check URL includes `?token=YOUR_TOKEN`
2. Regenerate token in GIS Integration dialog
3. Check firewall allows HTTPS to `*.supabase.co`

### Issue: "Slow loading / Timeout"

**Possible Causes:**
1. Too many features (>10,000)
2. No spatial index
3. Large attribute payloads

**Solutions:**
1. Use `limit` parameter to reduce features
2. Apply `bbox` filter to specific area
3. Contact administrator about spatial indexing

### Issue: "Coordinate system mismatch"

**Possible Causes:**
1. Data in different projection
2. GIS software auto-reprojection disabled

**Solutions:**
1. All data uses WGS84 (EPSG:4326)
2. Enable on-the-fly reprojection in QGIS
3. In ArcGIS, ensure data frame is WGS84

### Issue: "Token security concerns"

**Best Practices:**
1. Use tokens only for published, non-sensitive forms
2. Regenerate tokens periodically
3. Revoke old tokens when no longer needed
4. Monitor access logs (coming soon)

### Issue: "Auto-refresh not working"

**QGIS:**
- Verify "Refresh layer at interval" is checked
- Increase interval if server load is high
- Check network stability

**ArcGIS:**
- ArcGIS Pro doesn't support auto-refresh for external URLs
- Use Python script to reload layer periodically
- Consider using ArcGIS Online hosted feature layer

---

## Performance Optimization

### For Large Datasets (>50,000 features)

1. **Use spatial filtering:**
   - Add `bbox` parameter to limit geographic extent
   - Only load data in current view extent

2. **Pagination:**
   - Use `limit` and `offset` parameters
   - Load data in chunks of 5,000-10,000 features

3. **Attribute filtering:**
   - Request only needed fields (WFS)
   - Filter by date range using `since` parameter

4. **Caching:**
   - Enable local caching in QGIS/ArcGIS
   - Set reasonable refresh intervals
   - Use ETags for conditional requests

---

## Security Considerations

### Token Management

- **Tokens are UUIDs** - 128-bit random identifiers
- **Revocable** - Generate new token to invalidate old ones
- **Public forms only** - Only works with public access type
- **No authentication** - Anyone with token can access data

### When NOT to use GIS Integration

❌ Sensitive data (PII, confidential)
❌ Internal-only forms
❌ Data requiring authentication
❌ Forms with access restrictions

### Recommended Use Cases

✅ Public infrastructure surveys
✅ Community mapping projects
✅ Environmental monitoring
✅ Open data initiatives
✅ Research data collection

---

## API Reference

### Public GeoJSON Feed

**Endpoint:** `/public-geojson-feed`

**Parameters:**
- `token` (required): Share token UUID
- `formId` (required): Form UUID
- `limit` (optional): Max features (default: 5000)
- `since` (optional): ISO 8601 timestamp
- `bbox` (optional): minLon,minLat,maxLon,maxLat

**Response Headers:**
- `Content-Type: application/geo+json`
- `ETag`: Cache validation
- `Last-Modified`: Last update timestamp
- `Cache-Control: public, max-age=120`
- `X-Total-Features`: Total feature count
- `X-Returned-Features`: Returned feature count

### WFS Service

**Endpoint:** `/wfs-service`

**Operations:**
- `GetCapabilities`: Service metadata
- `DescribeFeatureType`: Schema information
- `GetFeature`: Actual features

**Parameters:**
- `token` (required): Share token
- `service=WFS` (required)
- `version` (optional): WFS version (default: 2.0.0)
- `request` (required): Operation name
- `typeName` (required for DescribeFeatureType, GetFeature)
- `outputFormat` (optional): application/json or application/gml+xml
- `maxFeatures` (optional): Max features
- `bbox` (optional): Spatial filter

### ArcGIS Feature Service

**Endpoint:** `/arcgis-feature-service/{formId}/query`

**Parameters:**
- `token` (required): Share token
- `where` (optional): SQL where clause (default: 1=1)
- `outFields` (optional): Comma-separated field list (default: *)
- `returnGeometry` (optional): true/false (default: true)
- `f` (optional): json or geojson (default: json)
- `resultOffset` (optional): Pagination offset
- `resultRecordCount` (optional): Features per page (max: 5000)

**Response Format:**
```json
{
  "objectIdFieldName": "OBJECTID",
  "geometryType": "esriGeometryPoint",
  "spatialReference": {"wkid": 4326},
  "fields": [...],
  "features": [...],
  "exceededTransferLimit": false
}
```

---

## Support and Resources

### Documentation
- [QGIS Documentation](https://docs.qgis.org/)
- [ArcGIS Pro Documentation](https://pro.arcgis.com/en/pro-app/latest/help/)
- [OGC WFS Standard](https://www.ogc.org/standards/wfs)

### Sample Files
- QGIS Layer Definition (.qlr)
- ArcGIS Layer File (.lyrx)
- Python automation scripts

### Getting Help
- Contact your GIS administrator
- Open a support ticket
- Check system status page

---

## Changelog

### Version 1.0 (2025-10-07)
- Initial release
- GeoJSON feed support
- WFS 2.0.0 service
- ArcGIS Feature Service
- Spatial and temporal filtering
- Caching with ETags
- Performance optimization

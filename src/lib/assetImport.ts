import Papa from 'papaparse';
import { ParsedAssetData } from '@/types/tracking';

export const parseCSV = (file: File): Promise<ParsedAssetData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsed = results.data.map((row: any) => {
            // Try common column name variations
            const name = row.name || row.Name || row.asset_name || row['Asset Name'];
            const asset_id = row.asset_id || row.AssetID || row.id || row.ID;
            const type = row.type || row.Type || row.asset_type || row['Asset Type'] || 'unknown';
            const status = row.status || row.Status || 'active';
            
            // Try to find latitude/longitude in various formats
            const lat = parseFloat(
              row.latitude || row.Latitude || row.lat || row.Lat || 
              row.y || row.Y || ''
            );
            const lon = parseFloat(
              row.longitude || row.Longitude || row.lon || row.Lon || 
              row.lng || row.Lng || row.x || row.X || ''
            );

            return {
              name,
              asset_id,
              type,
              status: status as any,
              latitude: isNaN(lat) ? undefined : lat,
              longitude: isNaN(lon) ? undefined : lon,
              metadata: row,
            };
          });

          resolve(parsed.filter(item => item.name && item.asset_id));
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const parseGeoJSON = (file: File): Promise<ParsedAssetData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const geojson = JSON.parse(e.target?.result as string);
        
        if (!geojson.type || geojson.type !== 'FeatureCollection') {
          reject(new Error('Invalid GeoJSON: Must be a FeatureCollection'));
          return;
        }

        const features = geojson.features || [];
        const parsed: ParsedAssetData[] = features.map((feature: any) => {
          const props = feature.properties || {};
          const coords = feature.geometry?.coordinates || [];

          return {
            name: props.name || props.Name || 'Unnamed Asset',
            asset_id: props.asset_id || props.id || props.ID || `asset_${Date.now()}`,
            type: props.type || props.Type || 'unknown',
            status: props.status || 'active',
            longitude: coords[0],
            latitude: coords[1],
            metadata: props,
          };
        });

        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

export const validateAssetData = (assets: ParsedAssetData[]): { valid: ParsedAssetData[]; errors: string[] } => {
  const valid: ParsedAssetData[] = [];
  const errors: string[] = [];

  assets.forEach((asset, index) => {
    const rowErrors: string[] = [];

    if (!asset.name) rowErrors.push('Missing name');
    if (!asset.asset_id) rowErrors.push('Missing asset_id');
    if (asset.latitude && (asset.latitude < -90 || asset.latitude > 90)) {
      rowErrors.push('Invalid latitude');
    }
    if (asset.longitude && (asset.longitude < -180 || asset.longitude > 180)) {
      rowErrors.push('Invalid longitude');
    }

    if (rowErrors.length > 0) {
      errors.push(`Row ${index + 1}: ${rowErrors.join(', ')}`);
    } else {
      valid.push(asset);
    }
  });

  return { valid, errors };
};

// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const formId = pathParts[pathParts.length - 2];
    const operation = pathParts[pathParts.length - 1];
    
    const token = url.searchParams.get('token');
    const where = url.searchParams.get('where') || '1=1';
    const outFields = url.searchParams.get('outFields') || '*';
    const f = url.searchParams.get('f') || 'json';
    const returnGeometry = url.searchParams.get('returnGeometry') !== 'false';
    const resultOffset = parseInt(url.searchParams.get('resultOffset') || '0');
    const resultRecordCount = parseInt(url.searchParams.get('resultRecordCount') || '5000');

    if (!token) {
      return new Response(JSON.stringify({ error: { code: 400, message: 'Missing token parameter' } }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Handle service info
    if (operation !== 'query') {
      const serviceInfo = generateServiceInfo(formId);
      return new Response(JSON.stringify(serviceInfo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate token
    const { data: validatedFormId, error: tokenError } = await supabase
      .rpc('get_form_from_share_token', { p_token: token });

    if (tokenError || validatedFormId !== formId) {
      return new Response(JSON.stringify({ error: { code: 403, message: 'Invalid or expired token' } }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get form data
    const { data: geojson, error: geojsonError } = await supabase
      .rpc('get_form_data_geojson', { form_id_input: formId });

    if (geojsonError) {
      console.error('GeoJSON error:', geojsonError);
      return new Response(JSON.stringify({ error: { code: 500, message: 'Failed to retrieve features' } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert to ESRI format
    const features = (geojson?.features || [])
      .slice(resultOffset, resultOffset + resultRecordCount)
      .map((feature: any) => convertToEsriFeature(feature, returnGeometry));

    const response = {
      objectIdFieldName: 'OBJECTID',
      globalIdFieldName: '',
      geometryType: detectGeometryType(geojson?.features?.[0]),
      spatialReference: { wkid: 4326, latestWkid: 4326 },
      fields: generateFields(geojson?.features?.[0]),
      features,
      exceededTransferLimit: (geojson?.features?.length || 0) > (resultOffset + resultRecordCount),
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120',
      },
    });
  } catch (error: any) {
    console.error('Error in arcgis-feature-service:', error);
    return new Response(JSON.stringify({ error: { code: 500, message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function convertToEsriFeature(feature: any, includeGeometry: boolean) {
  const esriFeature: any = {
    attributes: {
      OBJECTID: feature.id || Math.random(),
      ...feature.properties,
    },
  };

  if (includeGeometry && feature.geometry) {
    // Convert GeoJSON geometry to ESRI geometry
    const geom = feature.geometry;
    if (geom.type === 'Point') {
      esriFeature.geometry = {
        x: geom.coordinates[0],
        y: geom.coordinates[1],
      };
    } else if (geom.type === 'LineString') {
      esriFeature.geometry = {
        paths: [geom.coordinates],
      };
    } else if (geom.type === 'Polygon') {
      esriFeature.geometry = {
        rings: geom.coordinates,
      };
    }
  }

  return esriFeature;
}

function detectGeometryType(feature: any): string {
  if (!feature?.geometry) return 'esriGeometryNull';
  
  const type = feature.geometry.type;
  const typeMap: any = {
    Point: 'esriGeometryPoint',
    LineString: 'esriGeometryPolyline',
    Polygon: 'esriGeometryPolygon',
    MultiPoint: 'esriGeometryMultipoint',
  };
  
  return typeMap[type] || 'esriGeometryNull';
}

function generateFields(feature: any) {
  const fields = [
    {
      name: 'OBJECTID',
      type: 'esriFieldTypeOID',
      alias: 'OBJECTID',
    },
  ];

  if (feature?.properties) {
    Object.keys(feature.properties).forEach(key => {
      fields.push({
        name: key,
        type: 'esriFieldTypeString',
        alias: key,
      });
    });
  }

  return fields;
}

function generateServiceInfo(formId: string) {
  return {
    currentVersion: 10.91,
    serviceDescription: 'Field Data Collection ArcGIS Feature Service',
    hasVersionedData: false,
    supportsDisconnectedEditing: false,
    hasStaticData: false,
    maxRecordCount: 5000,
    supportedQueryFormats: 'JSON, geoJSON',
    capabilities: 'Query',
    description: 'Form submission data',
    copyrightText: '',
    spatialReference: { wkid: 4326, latestWkid: 4326 },
    initialExtent: {
      xmin: -180,
      ymin: -90,
      xmax: 180,
      ymax: 90,
      spatialReference: { wkid: 4326 },
    },
    fullExtent: {
      xmin: -180,
      ymin: -90,
      xmax: 180,
      ymax: 90,
      spatialReference: { wkid: 4326 },
    },
    units: 'esriDecimalDegrees',
  };
}

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
    const token = url.searchParams.get('token');
    const service = url.searchParams.get('service');
    const request = url.searchParams.get('request');
    const version = url.searchParams.get('version') || '2.0.0';
    const typeName = url.searchParams.get('typeName');
    const outputFormat = url.searchParams.get('outputFormat') || 'application/json';
    const maxFeatures = parseInt(url.searchParams.get('maxFeatures') || '5000');
    const bbox = url.searchParams.get('bbox');

    if (!token) {
      return new Response('Missing token parameter', { status: 400, headers: corsHeaders });
    }

    if (service !== 'WFS') {
      return new Response('Invalid service parameter. Must be WFS', { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Handle GetCapabilities
    if (request === 'GetCapabilities') {
      const capabilities = generateCapabilities(token, version);
      return new Response(capabilities, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Handle DescribeFeatureType
    if (request === 'DescribeFeatureType') {
      if (!typeName) {
        return new Response('Missing typeName parameter', { status: 400, headers: corsHeaders });
      }

      const formId = typeName.replace('form_', '');
      const schema = await generateFeatureSchema(supabase, token, formId);
      
      return new Response(schema, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=1800',
        },
      });
    }

    // Handle GetFeature
    if (request === 'GetFeature') {
      if (!typeName) {
        return new Response('Missing typeName parameter', { status: 400, headers: corsHeaders });
      }

      const formId = typeName.replace('form_', '');

      // Validate token
      const { data: validatedFormId, error: tokenError } = await supabase
        .rpc('get_form_from_share_token', { p_token: token });

      if (tokenError || validatedFormId !== formId) {
        return new Response('Invalid or expired token', { status: 403, headers: corsHeaders });
      }

      // Get GeoJSON data
      const rpcParams: any = { form_id_input: formId };
      if (bbox) rpcParams.bbox = bbox;

      const { data: geojson, error: geojsonError } = await supabase
        .rpc('get_form_data_geojson', rpcParams);

      if (geojsonError) {
        console.error('GeoJSON error:', geojsonError);
        return new Response('Failed to retrieve features', { status: 500, headers: corsHeaders });
      }

      let features = geojson?.features || [];
      if (maxFeatures && features.length > maxFeatures) {
        features = features.slice(0, maxFeatures);
      }

      const response = {
        type: 'FeatureCollection',
        features,
        totalFeatures: geojson?.features?.length || 0,
        numberReturned: features.length,
      };

      return new Response(JSON.stringify(response), {
        headers: {
          ...corsHeaders,
          'Content-Type': outputFormat.includes('json') ? 'application/json' : 'application/gml+xml',
          'Cache-Control': 'public, max-age=120',
        },
      });
    }

    return new Response('Invalid request parameter', { status: 400, headers: corsHeaders });
  } catch (error: any) {
    console.error('Error in wfs-service:', error);
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }
});

function generateCapabilities(token: string, version: string): string {
  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') + '/functions/v1/wfs-service';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<WFS_Capabilities version="${version}" xmlns="http://www.opengis.net/wfs/2.0">
  <ServiceIdentification>
    <Title>Field Data Collection WFS Service</Title>
    <Abstract>OGC WFS service for form submission data</Abstract>
    <ServiceType>WFS</ServiceType>
    <ServiceTypeVersion>${version}</ServiceTypeVersion>
  </ServiceIdentification>
  <OperationsMetadata>
    <Operation name="GetCapabilities">
      <DCP>
        <HTTP>
          <Get href="${baseUrl}?token=${token}&amp;"/>
        </HTTP>
      </DCP>
    </Operation>
    <Operation name="DescribeFeatureType">
      <DCP>
        <HTTP>
          <Get href="${baseUrl}?token=${token}&amp;"/>
        </HTTP>
      </DCP>
    </Operation>
    <Operation name="GetFeature">
      <DCP>
        <HTTP>
          <Get href="${baseUrl}?token=${token}&amp;"/>
        </HTTP>
      </DCP>
    </Operation>
  </OperationsMetadata>
  <FeatureTypeList>
    <FeatureType>
      <Name>form_data</Name>
      <Title>Form Submission Data</Title>
      <Abstract>Spatial data from form submissions</Abstract>
      <DefaultCRS>urn:ogc:def:crs:EPSG::4326</DefaultCRS>
    </FeatureType>
  </FeatureTypeList>
</WFS_Capabilities>`;
}

async function generateFeatureSchema(supabase: any, token: string, formId: string): Promise<string> {
  const { data: form } = await supabase
    .from('forms')
    .select('title, schema')
    .eq('id', formId)
    .single();

  return `<?xml version="1.0" encoding="UTF-8"?>
<schema targetNamespace="http://fielddata.app" xmlns="http://www.w3.org/2001/XMLSchema">
  <complexType name="form_${formId}Type">
    <complexContent>
      <extension base="gml:AbstractFeatureType">
        <sequence>
          <element name="geometry" type="gml:GeometryPropertyType"/>
          <element name="properties" type="string"/>
          <element name="created_at" type="dateTime"/>
        </sequence>
      </extension>
    </complexContent>
  </complexType>
  <element name="form_${formId}" type="form_${formId}Type" substitutionGroup="gml:AbstractFeature"/>
</schema>`;
}

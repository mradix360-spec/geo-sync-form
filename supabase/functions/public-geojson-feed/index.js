// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const formId = url.searchParams.get('formId');
    const limit = parseInt(url.searchParams.get('limit') || '5000');
    const since = url.searchParams.get('since');
    const bbox = url.searchParams.get('bbox');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!formId) {
      return new Response(JSON.stringify({ error: 'Missing formId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Validate token and get form ID
    const { data: validatedFormId, error: tokenError } = await supabase
      .rpc('get_form_from_share_token', { p_token: token });

    if (tokenError || !validatedFormId) {
      console.error('Token validation error:', tokenError);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the form ID matches
    if (validatedFormId !== formId) {
      return new Response(JSON.stringify({ error: 'Form ID does not match token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get form metadata for ETag
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('title, updated_at')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return new Response(JSON.stringify({ error: 'Form not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check If-None-Match header for caching
    const etag = `"${formId}-${new Date(form.updated_at).getTime()}"`;
    const ifNoneMatch = req.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: { ...corsHeaders, 'ETag': etag },
      });
    }

    // Build RPC parameters
    const rpcParams: any = { form_id_input: formId };
    if (since) rpcParams.since = since;
    if (bbox) {
      // Parse bbox: minLon,minLat,maxLon,maxLat
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(parseFloat);
      if (minLon && minLat && maxLon && maxLat) {
        rpcParams.bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
      }
    }

    // Get GeoJSON data
    const { data: geojson, error: geojsonError } = await supabase
      .rpc('get_form_data_geojson', rpcParams);

    if (geojsonError) {
      console.error('GeoJSON generation error:', geojsonError);
      return new Response(JSON.stringify({ error: 'Failed to generate GeoJSON' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply limit if specified
    let features = geojson?.features || [];
    if (limit && features.length > limit) {
      features = features.slice(0, limit);
    }

    const limitedGeojson = {
      type: 'FeatureCollection',
      features,
      metadata: {
        total: geojson?.features?.length || 0,
        returned: features.length,
        form_id: formId,
        form_title: form.title,
        generated_at: new Date().toISOString(),
      },
    };

    // Return GeoJSON with caching headers
    return new Response(JSON.stringify(limitedGeojson), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/geo+json',
        'ETag': etag,
        'Last-Modified': new Date(form.updated_at).toUTCString(),
        'Cache-Control': 'public, max-age=120',
        'X-Total-Features': String(geojson?.features?.length || 0),
        'X-Returned-Features': String(features.length),
      },
    });
  } catch (error: any) {
    console.error('Error in public-geojson-feed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

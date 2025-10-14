// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use Supabase JWT secret so auth.uid() works in RLS policies
const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET') ?? Deno.env.get('JWT_SECRET') ?? 'your-secret-key-change-in-production';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT token
    try {
      await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session exists and is not expired
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Session not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      // Delete expired session
      await supabaseClient
        .from('sessions')
        .delete()
        .eq('token', token);

      return new Response(
        JSON.stringify({ valid: false, error: 'Session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, full_name, organisation_id, is_active')
      .eq('id', sessionData.user_id)
      .single();

    if (userError || !userData || !userData.is_active) {
      return new Response(
        JSON.stringify({ valid: false, error: 'User not found or inactive' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user roles
    const { data: rolesData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.id);

    const roles = rolesData?.map(r => r.role) || [];

    return new Response(
      JSON.stringify({ 
        valid: true,
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          organisation_id: userData.organisation_id,
          roles
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auth-verify-session function:', error);
    return new Response(
      JSON.stringify({ valid: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user by email
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, full_name, password_hash, organisation_id, is_active')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.error('User lookup error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userData.is_active) {
      return new Response(
        JSON.stringify({ error: 'Account is inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);

    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user roles
    const { data: rolesData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.id);

    const roles = rolesData?.map(r => r.role) || [];

    // Generate JWT token
    const token = btoa(JSON.stringify({
      userId: userData.id,
      email: userData.email,
      exp: Date.now() + 86400000 // 24 hours
    }));

    // Return user data with token
    return new Response(
      JSON.stringify({
        token,
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          roles,
          organisation_id: userData.organisation_id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

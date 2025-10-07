import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      .select('id, email, password_hash, full_name, organisation_id, is_active')
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

    // Verify password using database function
    const { data: verifyResult, error: verifyError } = await supabaseClient
      .rpc('verify_password', {
        user_password_hash: userData.password_hash,
        plain_password: password
      });

    if (verifyError || !verifyResult) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user roles
    const { data: rolesData, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.id);

    if (rolesError) {
      console.error('Roles lookup error:', rolesError);
    }

    const roles = rolesData?.map(r => r.role) || [];

    // Generate JWT token (simple implementation for MVP)
    const token = btoa(JSON.stringify({
      userId: userData.id,
      email: userData.email,
      exp: Date.now() + 86400000, // 24 hours
    }));

    const user = {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      organisation_id: userData.organisation_id,
      roles,
    };

    return new Response(
      JSON.stringify({ token, user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auth-login function:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

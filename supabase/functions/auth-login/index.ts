import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT } from "https://deno.land/x/jose@v5.2.0/index.ts";

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
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and password are required' }),
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
        JSON.stringify({ success: false, error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userData.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Account is inactive' }),
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
      console.error('Password verification error:', verifyError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user roles
    const { data: rolesData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.id);

    const roles = rolesData?.map(r => r.role) || [];

    // Generate custom JWT token with proper Supabase-compatible claims
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const token = await new SignJWT({
      sub: userData.id, // Supabase expects 'sub' for user ID
      email: userData.email,
      role: 'authenticated',
      aud: 'authenticated',
      user_metadata: {
        full_name: userData.full_name,
        organisation_id: userData.organisation_id
      }
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(Deno.env.get('SUPABASE_URL') ?? '')
      .setIssuedAt()
      .setAudience('authenticated')
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .setJti(crypto.randomUUID())
      .sign(new TextEncoder().encode(JWT_SECRET));

    // Store session in database
    const { error: sessionError } = await supabaseClient
      .from('sessions')
      .insert({
        user_id: userData.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Login successful for user:', userData.email);

    return new Response(
      JSON.stringify({ 
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
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
    console.error('Error in auth-login function:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

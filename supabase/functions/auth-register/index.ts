// @ts-nocheck
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
    const { email, password, fullName, phoneNumber, orgName } = await req.json();

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email, password, and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user already exists
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email already registered' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password using database function
    const { data: passwordHash, error: hashError } = await supabaseClient
      .rpc('hash_password', { plain_password: password });

    if (hashError || !passwordHash) {
      console.error('Password hashing error:', hashError);
      throw new Error('Failed to hash password');
    }

    // Generate a new UUID for the user
    const userId = crypto.randomUUID();

    // Insert user into custom users table WITHOUT organization
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .insert({
        id: userId,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        organisation_id: null,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create organization request if provided
    if (orgName && phoneNumber) {
      const { error: requestError } = await supabaseClient
        .from('organisation_requests')
        .insert({
          user_id: userData.id,
          organisation_name: orgName,
          phone_number: phoneNumber,
          status: 'pending'
        });

      if (requestError) {
        console.error('Organization request error:', requestError);
      }
    }

    // Auto-login: create session token
    const { SignJWT } = await import("https://deno.land/x/jose@v5.2.0/index.ts");
    const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET') ?? Deno.env.get('JWT_SECRET') ?? 'your-secret-key-change-in-production';
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = await new SignJWT({
      sub: userData.id,
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

    // Store session
    await supabaseClient
      .from('sessions')
      .insert({
        user_id: userData.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    // Get user roles
    const { data: rolesData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.id);

    const roles = rolesData?.map(r => r.role) || [];

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
    console.error('Error in auth-register function:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

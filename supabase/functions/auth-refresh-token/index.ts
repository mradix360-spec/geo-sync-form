// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify, SignJWT } from "https://deno.land/x/jose@v5.2.0/index.ts";

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
        JSON.stringify({ success: false, error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify current token
    let payload;
    try {
      const result = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      payload = result.payload;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session exists
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete old session
    await supabaseClient
      .from('sessions')
      .delete()
      .eq('token', token);

    // Generate new token with Supabase-compatible claims
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const newToken = await new SignJWT({
      sub: String(payload.sub || payload.userId || sessionData.user_id), // Support both claim formats
      email: String(payload.email || ''),
      role: 'authenticated',
      aud: 'authenticated',
      user_metadata: payload.user_metadata || {}
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(Deno.env.get('SUPABASE_URL') ?? '')
      .setIssuedAt()
      .setAudience('authenticated')
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .setJti(crypto.randomUUID())
      .sign(new TextEncoder().encode(JWT_SECRET));

    // Store new session
    const { error: newSessionError } = await supabaseClient
      .from('sessions')
      .insert({
        user_id: sessionData.user_id,
        token: newToken,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    if (newSessionError) {
      console.error('New session creation error:', newSessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create new session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        token: newToken,
        expiresAt: expiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auth-refresh-token function:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

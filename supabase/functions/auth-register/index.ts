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
    const { email, password, fullName, orgName } = await req.json();

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full name are required' }),
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
        JSON.stringify({ error: 'Email already registered' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let orgId: string | null = null;

    // Create organization if provided
    if (orgName) {
      const { data: orgData, error: orgError } = await supabaseClient
        .from('organisations')
        .insert({ name: orgName, current_users: 1 })
        .select()
        .single();

      if (orgError) {
        console.error('Organization creation error:', orgError);
        throw new Error('Failed to create organization');
      }
      orgId = orgData.id;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password);

    // Create user
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        organisation_id: orgId,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign role
    const role = orgName ? 'org_admin' : 'field_staff';
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: userData.id,
        role: role,
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
    }

    // Generate JWT token
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
      roles: [role],
    };

    return new Response(
      JSON.stringify({ token, user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auth-register function:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

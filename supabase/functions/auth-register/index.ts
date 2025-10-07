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
    const { email, password, fullName, orgName } = await req.json();

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

    let orgId: string | null = null;

    // Create organization if provided, or use default
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
    } else {
      // Assign to default organization if none provided
      orgId = '00000000-0000-0000-0000-000000000001';
    }

    // Hash password using database function
    const { data: passwordHash, error: hashError } = await supabaseClient
      .rpc('hash_password', { plain_password: password });

    if (hashError || !passwordHash) {
      console.error('Password hashing error:', hashError);
      throw new Error('Failed to hash password');
    }

    // Create Supabase Auth user first
    const { data: authData, error: signUpError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        organisation_id: orgId
      }
    });

    if (signUpError || !authData.user) {
      console.error('Auth user creation error:', signUpError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create auth user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user in custom users table with the same ID
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .insert({
        id: authData.user.id, // Use the auth user ID
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
      // Clean up auth user if custom user creation fails
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create user' }),
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

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          organisation_id: userData.organisation_id
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

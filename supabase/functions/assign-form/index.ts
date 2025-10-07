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
    const { formId, userIds } = await req.json();

    if (!formId || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'formId and userIds array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user and verify authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission (org_admin, analyst, or super_admin)
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Error checking permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasPermission = roles?.some(r => 
      ['org_admin', 'analyst', 'super_admin'].includes(r.role)
    );

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Permission denied. Only org admins and analysts can assign forms.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get form and verify it belongs to user's organisation
    const { data: form, error: formError } = await supabaseClient
      .from('forms')
      .select('id, organisation_id, title')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      console.error('Form not found:', formError);
      return new Response(
        JSON.stringify({ error: 'Form not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user's organisation
    const { data: currentUser, error: currentUserError } = await supabaseClient
      .from('users')
      .select('organisation_id')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUser) {
      console.error('Error fetching user organisation:', currentUserError);
      return new Response(
        JSON.stringify({ error: 'Error verifying organisation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify form belongs to same organisation (unless super_admin)
    const isSuperAdmin = roles?.some(r => r.role === 'super_admin');
    if (!isSuperAdmin && form.organisation_id !== currentUser.organisation_id) {
      return new Response(
        JSON.stringify({ error: 'You can only assign forms from your organisation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify all users belong to the same organisation
    const { data: usersToAssign, error: usersError } = await supabaseClient
      .from('users')
      .select('id, organisation_id, full_name, email')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Error fetching users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const invalidUsers = usersToAssign?.filter(u => 
      !isSuperAdmin && u.organisation_id !== form.organisation_id
    ) || [];

    if (invalidUsers.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Some users do not belong to the form\'s organisation',
          invalidUsers: invalidUsers.map(u => ({ id: u.id, email: u.email }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert assignments (upsert handles duplicates via unique constraint)
    const assignments = userIds.map(userId => ({
      form_id: formId,
      user_id: userId
    }));

    const { data: assignedData, error: assignError } = await supabaseClient
      .from('form_assignments')
      .upsert(assignments, { onConflict: 'form_id,user_id' })
      .select('user_id');

    if (assignError) {
      console.error('Error creating assignments:', assignError);
      return new Response(
        JSON.stringify({ error: 'Error creating assignments', details: assignError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log activity
    const activityLogs = userIds.map(userId => ({
      organisation_id: form.organisation_id,
      user_id: user.id,
      action: 'form_assigned',
      object_type: 'form',
      object_id: formId,
      details: {
        assigned_to: userId,
        form_title: form.title
      }
    }));

    await supabaseClient.from('form_activity_log').insert(activityLogs);

    console.log(`Successfully assigned form ${formId} to ${assignedData?.length || 0} users`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        assigned: assignedData?.length || 0,
        message: `Successfully assigned form to ${assignedData?.length || 0} user(s)`,
        users: usersToAssign
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in assign-form function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

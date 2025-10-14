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
    const url = new URL(req.url);
    const formId = url.searchParams.get('formId');

    if (!formId) {
      return new Response(
        JSON.stringify({ error: 'formId parameter is required' }),
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has permission to view assignments
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const canViewAssignments = roles?.some(r => 
      ['org_admin', 'analyst', 'super_admin'].includes(r.role)
    );

    if (!canViewAssignments) {
      return new Response(
        JSON.stringify({ error: 'Permission denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get assigned users with their details
    const { data: assignments, error: assignError } = await supabaseClient
      .from('form_assignments')
      .select(`
        user_id,
        assigned_at,
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('form_id', formId);

    if (assignError) {
      console.error('Error fetching assignments:', assignError);
      return new Response(
        JSON.stringify({ error: 'Error fetching assignments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get roles for assigned users
    const userIds = assignments?.map(a => a.user_id) || [];
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    // Combine data
    const assignedUsers = assignments?.map(assignment => ({
      ...assignment.users,
      assigned_at: assignment.assigned_at,
      roles: userRoles?.filter(r => r.user_id === assignment.user_id).map(r => r.role) || []
    })) || [];

    return new Response(
      JSON.stringify({ 
        success: true,
        count: assignedUsers.length,
        users: assignedUsers
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-assigned-users function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

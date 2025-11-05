import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, requestedRole } = await req.json();
    
    console.log('Role verification request for:', requestedRole);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Verify password based on role
    let isValid = false;
    let roleToAssign: string | null = null;

    if (requestedRole === 'master' && password === '124124') {
      isValid = true;
      roleToAssign = 'master';
    } else if (requestedRole === 'admin' && password === '421421') {
      isValid = true;
      roleToAssign = 'admin';
    } else if (requestedRole === 'user') {
      // User role doesn't require a password
      isValid = true;
      roleToAssign = 'user';
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Use service role to insert role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Delete existing user role first
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    // Insert new role
    const { error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: user.id, role: roleToAssign });

    if (insertError) {
      console.error('Error inserting role:', insertError);
      throw insertError;
    }

    console.log('Role assigned successfully:', roleToAssign, 'to user:', user.id);

    return new Response(
      JSON.stringify({ success: true, role: roleToAssign }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
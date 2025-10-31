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
    console.log('Starting archive expired announcements job...');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all unarchived announcements with deadlines that have passed
    const { data: expiredAnnouncements, error: fetchError } = await supabaseAdmin
      .from('announcements')
      .select('id, title, deadline')
      .eq('archived', false)
      .not('deadline', 'is', null)
      .lt('deadline', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired announcements:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredAnnouncements?.length || 0} expired announcements to archive`);

    if (expiredAnnouncements && expiredAnnouncements.length > 0) {
      // Archive all expired announcements
      const { error: updateError } = await supabaseAdmin
        .from('announcements')
        .update({ archived: true })
        .in('id', expiredAnnouncements.map(a => a.id));

      if (updateError) {
        console.error('Error archiving announcements:', updateError);
        throw updateError;
      }

      console.log('Successfully archived announcements:', expiredAnnouncements.map(a => ({
        id: a.id,
        title: a.title,
        deadline: a.deadline
      })));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        archivedCount: expiredAnnouncements?.length || 0,
        message: `Archived ${expiredAnnouncements?.length || 0} expired announcements`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in archive job:', error);
    return new Response(
      JSON.stringify({ success: false, message: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Sending job notifications...');

    // Get jobs scraped in the last 24 hours that haven't been notified
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: newJobs, error: jobsError } = await supabase
      .from('scraped_jobs')
      .select('*')
      .gte('scraped_at', yesterday)
      .order('match_score', { ascending: false });

    if (jobsError) throw jobsError;

    if (!newJobs || newJobs.length === 0) {
      console.log('No new jobs to notify about');
      return new Response(
        JSON.stringify({ success: true, message: 'No new jobs to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all users with mailboxes (active users)
    const { data: users, error: usersError } = await supabase
      .from('user_mailboxes')
      .select('user_id, email_address');

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      console.log('No users to notify');
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications to each user
    let notificationsSent = 0;
    
    for (const user of users) {
      // Get user's email from auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(user.user_id);
      
      if (authError || !authUser?.email) {
        console.error(`Could not get email for user ${user.user_id}`);
        continue;
      }

      const jobsHtml = newJobs.map(job => `
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0;">${job.title}</h3>
          <p style="margin: 4px 0; color: #666;"><strong>${job.company}</strong> - ${job.location}</p>
          <p style="margin: 4px 0; color: #0066cc;"><strong>${job.salary}</strong></p>
          <p style="margin: 8px 0;">${job.description.substring(0, 150)}...</p>
          <div style="display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">
            ${job.match_score}% Match
          </div>
        </div>
      `).join('');

      try {
        await resend.emails.send({
          from: "CareerSpring <onboarding@resend.dev>",
          to: [authUser.email],
          subject: `🎯 ${newJobs.length} New Job Matches Found!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Your AI Agent Found New Opportunities!</h1>
              <p style="color: #666;">Your CareerSpring AI agent has been working hard and found ${newJobs.length} new job matches that fit your profile.</p>
              
              ${jobsHtml}
              
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/matches" 
                   style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View All Matches & Add to Cart
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; margin-top: 24px;">
                Your AI agent will continue to search for new opportunities daily.
              </p>
            </div>
          `,
        });
        
        notificationsSent++;
        console.log(`Notification sent to ${authUser.email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${authUser.email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent,
        jobsFound: newJobs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-job-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

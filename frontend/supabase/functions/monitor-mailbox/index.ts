import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    console.log('Monitoring mailboxes for new responses...');

    // Get all active mailboxes
    const { data: mailboxes, error: mailboxError } = await supabase
      .from('user_mailboxes')
      .select('*');

    if (mailboxError) throw mailboxError;

    if (!mailboxes || mailboxes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No mailboxes to monitor' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let emailsProcessed = 0;

    for (const mailbox of mailboxes) {
      try {
        // In production, this would use IMAP to check for new emails
        // For demo purposes, we'll simulate finding responses
        console.log(`Checking mailbox: ${mailbox.email_address}`);

        // Get pending applications for this user
        const { data: applications, error: appsError } = await supabase
          .from('job_applications')
          .select('*')
          .eq('user_id', mailbox.user_id)
          .eq('status', 'applied');

        if (appsError) {
          console.error('Error fetching applications:', appsError);
          continue;
        }

        // Simulate finding email responses (in production, read from IMAP)
        if (applications && applications.length > 0 && Math.random() > 0.7) {
          const randomApp = applications[Math.floor(Math.random() * applications.length)];
          
          const mockResponse = `Thank you for your application to ${randomApp.company}. 
We have received your application for the ${randomApp.position} position and are currently reviewing it. 
We will be in touch soon regarding next steps.`;

          // Store the received email
          const { error: emailError } = await supabase
            .from('application_emails')
            .insert({
              application_id: randomApp.id,
              from_email: `careers@${randomApp.company?.toLowerCase().replace(/\s+/g, '')}.com`,
              to_email: mailbox.email_address,
              subject: `RE: Application for ${randomApp.position}`,
              body: mockResponse,
              direction: 'received',
              processed: false,
            });

          if (!emailError) {
            emailsProcessed++;
            console.log(`New email found for application ${randomApp.id}`);
            
            // Trigger email processing
            await supabase.functions.invoke('process-email-responses');
          }
        }

      } catch (error) {
        console.error(`Error monitoring mailbox ${mailbox.email_address}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsProcessed,
        message: `Processed ${emailsProcessed} new emails`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in monitor-mailbox function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

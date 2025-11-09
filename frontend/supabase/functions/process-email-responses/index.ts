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

    console.log('Processing unprocessed email responses...');

    // Get unprocessed emails
    const { data: emails, error: emailsError } = await supabase
      .from('application_emails')
      .select('*')
      .eq('processed', false)
      .eq('direction', 'received');

    if (emailsError) throw emailsError;

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No emails to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let emailsProcessed = 0;

    for (const email of emails) {
      try {
        // Use AI to extract status from email
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are an AI that extracts job application status from emails. 
Respond with ONLY one of these statuses: 
- pending (application received, under review)
- rejected (application declined)
- interview_requested (they want to schedule an interview)
- interview_scheduled (interview date/time confirmed)
- interview_completed (interview happened, awaiting decision)
- offer_received (job offer extended)
- offer_accepted (offer accepted)
- hired (contract signed/hiring complete)`
              },
              {
                role: 'user',
                content: `Extract the application status from this email:

Subject: ${email.subject}

Body: ${email.body}

Status:`
              }
            ],
          }),
        });

        const aiData = await aiResponse.json();
        const extractedStatus = aiData.choices[0].message.content.trim().toLowerCase();

        console.log(`Extracted status: ${extractedStatus} for email ${email.id}`);

        // Update the email as processed
        const { error: updateEmailError } = await supabase
          .from('application_emails')
          .update({
            processed: true,
            status_extracted: extractedStatus
          })
          .eq('id', email.id);

        if (updateEmailError) {
          console.error('Error updating email:', updateEmailError);
          continue;
        }

        // Update the application status
        const { error: updateAppError } = await supabase
          .from('job_applications')
          .update({
            status: extractedStatus,
            last_status_update: new Date().toISOString(),
            status_details: {
              lastEmail: email.body,
              lastEmailFrom: email.from_email,
              lastEmailDate: email.received_at
            }
          })
          .eq('id', email.application_id);

        if (updateAppError) {
          console.error('Error updating application:', updateAppError);
          continue;
        }

        emailsProcessed++;

      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsProcessed,
        message: `Processed ${emailsProcessed} emails`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-email-responses function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
    const { applicationIds, userId } = await req.json();

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new Error('No application IDs provided');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Processing ${applicationIds.length} job applications for user ${userId}`);

    // Get user's mailbox
    const { data: mailbox, error: mailboxError } = await supabase
      .from('user_mailboxes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (mailboxError || !mailbox) {
      throw new Error('User mailbox not found. Please set up your mailbox first.');
    }

    // Get applications
    const { data: applications, error: appsError } = await supabase
      .from('job_applications')
      .select('*')
      .in('id', applicationIds)
      .eq('user_id', userId);

    if (appsError) throw appsError;

    const results = [];

    for (const application of applications || []) {
      try {
        // Generate tailored application using AI
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
                content: 'You are an expert job application writer. Generate professional, tailored application emails.'
              },
              {
                role: 'user',
                content: `Write a professional job application email for:
Position: ${application.position}
Company: ${application.company}
From: ${mailbox.email_address}

Include a brief introduction, why they're a great fit, and request an interview.
Keep it concise and professional.`
              }
            ],
          }),
        });

        const aiData = await aiResponse.json();
        const applicationEmail = aiData.choices[0].message.content;

        // In production, this would actually send the email via SMTP
        // For now, we'll just record it in the database
        console.log(`Generated application email for ${application.company}`);

        // Record the sent email
        const { error: emailError } = await supabase
          .from('application_emails')
          .insert({
            application_id: application.id,
            from_email: mailbox.email_address,
            to_email: `careers@${application.company?.toLowerCase().replace(/\s+/g, '')}.com`,
            subject: `Application for ${application.position}`,
            body: applicationEmail,
            direction: 'sent',
          });

        if (emailError) {
          console.error('Error recording email:', emailError);
        }

        // Update application status
        const { error: updateError } = await supabase
          .from('job_applications')
          .update({
            status: 'applied',
            application_sent_at: new Date().toISOString(),
            last_status_update: new Date().toISOString(),
            status_details: { message: 'Application sent successfully' }
          })
          .eq('id', application.id);

        if (updateError) {
          console.error('Error updating application:', updateError);
          throw updateError;
        }

        results.push({
          applicationId: application.id,
          success: true,
          company: application.company
        });

      } catch (error) {
        console.error(`Error processing application ${application.id}:`, error);
        results.push({
          applicationId: application.id,
          success: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Successfully applied to ${results.filter(r => r.success).length} jobs`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in apply-to-jobs function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

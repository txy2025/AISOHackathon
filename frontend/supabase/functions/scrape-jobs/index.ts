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

    console.log('Starting daily job scraping...');

    // Mock job scraping - in production, this would scrape real job boards
    const mockJobs = [
      {
        job_id: `job_${Date.now()}_1`,
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        salary: '$120,000 - $180,000',
        description: 'We are looking for an experienced software engineer to join our team...',
        match_score: 85,
        source_url: 'https://example.com/jobs/1',
      },
      {
        job_id: `job_${Date.now()}_2`,
        title: 'Product Manager',
        company: 'Innovation Inc',
        location: 'New York, NY',
        salary: '$130,000 - $170,000',
        description: 'Lead product strategy and development for our flagship product...',
        match_score: 78,
        source_url: 'https://example.com/jobs/2',
      },
      {
        job_id: `job_${Date.now()}_3`,
        title: 'UX Designer',
        company: 'Creative Studio',
        location: 'Remote',
        salary: '$90,000 - $130,000',
        description: 'Design beautiful and intuitive user experiences...',
        match_score: 82,
        source_url: 'https://example.com/jobs/3',
      },
    ];

    // Insert scraped jobs
    const { data: insertedJobs, error: insertError } = await supabase
      .from('scraped_jobs')
      .insert(mockJobs)
      .select();

    if (insertError) {
      console.error('Error inserting scraped jobs:', insertError);
      throw insertError;
    }

    console.log(`Scraped ${insertedJobs?.length || 0} new jobs`);

    // Trigger notification function
    const { error: notifyError } = await supabase.functions.invoke('send-job-notifications');
    
    if (notifyError) {
      console.error('Error triggering notifications:', notifyError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobsScraped: insertedJobs?.length || 0,
        message: 'Job scraping completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-jobs function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

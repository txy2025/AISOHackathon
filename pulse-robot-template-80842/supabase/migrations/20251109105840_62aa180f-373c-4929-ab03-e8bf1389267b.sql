-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for job applications with status tracking
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id TEXT NOT NULL,
  company TEXT,
  position TEXT,
  status TEXT NOT NULL DEFAULT 'cart',
  status_details JSONB,
  application_sent_at TIMESTAMP WITH TIME ZONE,
  last_status_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for email communications
CREATE TABLE public.application_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  raw_email TEXT,
  direction TEXT NOT NULL,
  status_extracted TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user mailboxes
CREATE TABLE public.user_mailboxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_address TEXT NOT NULL,
  imap_host TEXT DEFAULT 'outlook.office365.com',
  imap_port INTEGER DEFAULT 993,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for daily job scraping results
CREATE TABLE public.scraped_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  title TEXT,
  company TEXT,
  location TEXT,
  salary TEXT,
  description TEXT,
  match_score INTEGER,
  source_url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_users UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_applications
CREATE POLICY "Users can view their own applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON public.job_applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
  ON public.job_applications FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for application_emails
CREATE POLICY "Users can view emails for their applications"
  ON public.application_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications
      WHERE job_applications.id = application_emails.application_id
      AND job_applications.user_id = auth.uid()
    )
  );

-- RLS Policies for user_mailboxes
CREATE POLICY "Users can view their own mailbox"
  ON public.user_mailboxes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mailbox"
  ON public.user_mailboxes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mailbox"
  ON public.user_mailboxes FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for scraped_jobs (public read)
CREATE POLICY "Anyone can view scraped jobs"
  ON public.scraped_jobs FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_application_emails_application_id ON public.application_emails(application_id);
CREATE INDEX idx_application_emails_processed ON public.application_emails(processed);
CREATE INDEX idx_user_mailboxes_user_id ON public.user_mailboxes(user_id);
CREATE INDEX idx_scraped_jobs_scraped_at ON public.scraped_jobs(scraped_at);

-- Update timestamp triggers
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_mailboxes_updated_at
  BEFORE UPDATE ON public.user_mailboxes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
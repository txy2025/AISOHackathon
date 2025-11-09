import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, ShoppingCart, Briefcase, CheckCircle, Loader2, XCircle, Inbox, Mail, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ApplicationsSummary } from "@/components/ApplicationsSummary";
import { JobCard } from "@/components/JobCard";
import JobMatchCard, { JobMatch } from "@/components/JobMatchCard";
import { InboxEmailCard } from "@/components/InboxEmailCard";
import { EmailDetailDialog } from "@/components/EmailDetailDialog";
import { LikedJobsList } from "@/components/LikedJobsList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

interface ScrapedJob {
  id: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  match_score: number;
  source_url: string;
  scraped_at: string;
}

interface JobApplication {
  id: string;
  job_id: string;
  position: string;
  company: string;
  status: string;
  created_at: string;
  application_sent_at?: string;
  last_status_update?: string;
  status_details?: any;
}

interface EmailResponse {
  id: string;
  application_id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  received_at: string;
  status_extracted: string;
  company: string;
  position: string;
}

const Matches = () => {
  const navigate = useNavigate();
  const [scrapedJobs, setScrapedJobs] = useState<ScrapedJob[]>([]);
  const [likedJobs, setLikedJobs] = useState<JobApplication[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<JobApplication[]>([]);
  const [inboxEmails, setInboxEmails] = useState<EmailResponse[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailResponse | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [applicationDetailOpen, setApplicationDetailOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Use a valid UUID for demo user (without authentication)
  const demoUserId = '00000000-0000-0000-0000-000000000001';
  setUserId(demoUserId);

  loadData(demoUserId).then(() => fetchExternalJobs('1')); // external API uses 
    

    // Show "New Jobs Found" notification after 1 minute
    const newJobsTimer = setTimeout(() => {
      toast({
        title: "🎯 New Jobs Found Today!",
        description: "We've found fresh opportunities matching your profile. Check the New Jobs tab.",
        duration: 5000,
      });
    }, 60000); // 1 minute

    return () => clearTimeout(newJobsTimer);
  }, []);

  const loadData = async (uid: string) => {
    setIsLoading(true);
    try {
      // Load scraped jobs - filter for unique jobs and graduate-level only
      const { data: jobs, error: jobsError } = await supabase
        .from('scraped_jobs')
        .select('*')
        .order('match_score', { ascending: false });

      if (jobsError) throw jobsError;
      
      // Remove duplicates by job_id and filter for graduate-level positions only
      const uniqueGraduateJobs = jobs?.reduce((acc: ScrapedJob[], job) => {
        const exists = acc.find(j => j.job_id === job.job_id);
        const isGraduateLevel = 
          job.title.toLowerCase().includes('intern') ||
          job.title.toLowerCase().includes('trainee') ||
          job.title.toLowerCase().includes('graduate') ||
          job.title.toLowerCase().includes('entry') ||
          job.title.toLowerCase().includes('junior') ||
          job.title.toLowerCase().includes('associate') && !job.title.toLowerCase().includes('senior');
        
        if (!exists && isGraduateLevel) {
          acc.push(job);
        }
        return acc;
      }, []) || [];
      
      setScrapedJobs(uniqueGraduateJobs);

      // Load liked items (changed from cart)
      const { data: liked, error: likedError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', uid)
        .eq('status', 'liked')
        .order('created_at', { ascending: false });

      if (likedError) throw likedError;
      setLikedJobs(liked || []);

      // Load active applications (not cart or rejected)
      const { data: apps, error: appsError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', uid)
        .not('status', 'in', '(cart,rejected)')
        .in('status', ['applied', 'pending'])
        .order('last_status_update', { ascending: false });

      if (appsError) throw appsError;
      setApplications(apps || []);

      // Load rejected applications
      const { data: rejected, error: rejectedError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', uid)
        .eq('status', 'rejected')
        .order('last_status_update', { ascending: false });

      if (rejectedError) throw rejectedError;
      setRejectedApplications(rejected || []);

      // Load inbox emails (all received emails for user's applications)
      const { data: emails, error: emailsError } = await supabase
        .from('application_emails')
        .select(`
          *,
          job_applications!inner (
            user_id,
            position,
            company
          )
        `)
        .eq('job_applications.user_id', uid)
        .eq('direction', 'received')
        .order('received_at', { ascending: false });

      if (emailsError) throw emailsError;
      
      // Transform the data to include position and company
      const transformedEmails = (emails || []).map((email: any) => ({
        ...email,
        position: email.job_applications.position,
        company: email.job_applications.company,
      }));
      
      setInboxEmails(transformedEmails || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
const fetchExternalJobs = async (uid: string) => {
  try {
    const response = await fetch(`http://78.141.223.232:8000/show_jobs?user_id=${uid}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    const recommendations = result.recommendations || [];

    // Map API fields to ScrapedJob format
    const mappedJobs: ScrapedJob[] = recommendations.map((job: any, i: number) => ({
      id: `ext-${i}`,
      job_id: `ext-${i}`,
      title: job.JobTitle || "Unknown Role",
      company: job.Company || "Unknown Company",
      location: job.Remote?.toLowerCase().includes("not") ? "On-site" : "Remote",
      salary: job.Salary || "Not specified",
      description: job.Responsibility || "",
      match_score: job["Matching Score"] || 80,
      source_url: "", // API does not provide it
      scraped_at: new Date().toISOString(),
    }));

    // Append new jobs to scrapedJobs, avoiding duplicates
    setScrapedJobs(prev => {
      const existingIds = new Set(prev.map(j => j.job_id));
      const newOnes = mappedJobs.filter(j => !existingIds.has(j.job_id));
      return [...prev, ...newOnes].sort((a, b) => b.match_score - a.match_score);
    });

    toast({
      title: "✨ AI Recommendations Loaded",
      description: `Found ${mappedJobs.length} personalized jobs for you.`,
      duration: 5000,
    });
  } catch (err) {
    console.error("Error fetching external jobs:", err);
    toast({
      title: "Error loading new jobs",
      description: "Could not fetch recommendations from AI API.",
      variant: "destructive",
    });
  }
};


  const handleLikeJob = async (job: JobMatch) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          user_id: userId,
          job_id: job.id,
          position: job.description.substring(0, 100),
          company: job.company || 'Company',
          status: 'liked',
        });

      if (error) throw error;

      // Remove job from scraped jobs list
      setScrapedJobs(prev => prev.filter(j => j.job_id !== job.id));

      toast({
        title: "Liked! 💚",
        description: `${job.company} added to your liked jobs`,
      });

      loadData(userId);
    } catch (error) {
      console.error('Error liking job:', error);
      toast({
        title: "Error",
        description: "Failed to like job",
        variant: "destructive",
      });
    }
  };

  const handleSaveJob = async (job: JobMatch) => {
    toast({
      title: "Saved! 📑",
      description: `${job.company} saved for later`,
    });
  };

  const handleDislikeJob = async (job: JobMatch) => {
    // Remove job from scraped jobs list when disliked
    setScrapedJobs(prev => prev.filter(j => j.job_id !== job.id));
    
    toast({
      title: "Removed",
      description: "We'll show you similar roles",
    });
  };

  const handleRemoveFromLiked = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Removed",
        description: "Job removed from liked jobs",
      });

      if (userId) loadData(userId);
    } catch (error) {
      console.error('Error removing from liked:', error);
      toast({
        title: "Error",
        description: "Failed to remove job",
        variant: "destructive",
      });
    }
  };

  const handleApplyToSelected = async (jobIds: string[]) => {
    if (!userId || jobIds.length === 0) return;

    setIsApplying(true);
    try {
      // Update selected liked items to "applied" status
      
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: 'applied',
          application_sent_at: new Date().toISOString(),
          last_status_update: new Date().toISOString(),
        })
        .in('id', jobIds);

      if (error) throw error;

      toast({
        title: "Applications Submitted! 🎉",
        description: `Applied to ${jobIds.length} job${jobIds.length !== 1 ? 's' : ''}. Companies will respond soon...`,
      });

      loadData(userId);

      // Simulate company responses after 10 seconds
      setTimeout(async () => {
        await simulateCompanyResponses(jobIds);
      }, 10000);

    } catch (error) {
      console.error('Error applying to jobs:', error);
      toast({
        title: "Error",
        description: "Failed to process applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const simulateCompanyResponses = async (applicationIds: string[]) => {
    if (!userId) return;

    try {
      // Get the applications we just applied to
      const { data: applications } = await supabase
        .from('job_applications')
        .select('*')
        .in('id', applicationIds);

      if (!applications || applications.length === 0) return;

      // Response types in specific order: assignment -> interview -> reject
      const responseTypes = [
        {
          type: 'assignment',
          status: 'interview_requested',
          subject: 'Next Steps - Assignment Required for {position}',
          body: 'Hi there,\n\nThank you for your application. We would like to move you to the next round.\n\nPlease complete the following assessment:\n- Technical Skills Test (60 minutes)\n- Personality Assessment (20 minutes)\n\nLink: https://assessment.example.com\n\nDeadline: 48 hours from now\n\nBest,\n{company} Team',
        },
        {
          type: 'interview',
          status: 'interview_scheduled',
          subject: 'Interview Invitation - {position}',
          body: 'Dear Candidate,\n\nWe are impressed with your application and would like to invite you to an interview.\n\nDate: {date}\nTime: {time}\nLocation: Video Call (Microsoft Teams)\n\nPlease confirm your availability by replying to this email.\n\nBest regards,\n{company} Recruitment Team',
        },
        {
          type: 'rejection',
          status: 'rejected',
          subject: 'Application Update - {position}',
          body: 'Dear Applicant,\n\nThank you for your interest in the {position} role at {company}.\n\nAfter careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.\n\nWe encourage you to apply for future opportunities that may be a better fit.\n\nBest wishes,\n{company} Hiring Team',
        },
      ];

      const getRandomDate = () => {
        const days = Math.floor(Math.random() * 7) + 3;
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      };

      const getRandomTime = () => {
        const hours = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
        return hours[Math.floor(Math.random() * hours.length)];
      };

      let positiveCount = 0;
      let rejectionCount = 0;

      // Process applications sequentially with specific order
      for (let i = 0; i < applications.length; i++) {
        const app = applications[i];
        // Cycle through response types: 0, 1, 2, 0, 1, 2, ...
        const responseType = responseTypes[i % 3];

        // Personalize the email
        const subject = responseType.subject
          .replace('{position}', app.position)
          .replace('{company}', app.company);
        
        const body = responseType.body
          .replace(/{position}/g, app.position)
          .replace(/{company}/g, app.company)
          .replace('{date}', getRandomDate())
          .replace('{time}', getRandomTime());

        // Insert mock email
        await supabase
          .from('application_emails')
          .insert({
            application_id: app.id,
            from_email: `careers@${app.company.toLowerCase().replace(/\s+/g, '')}.com`,
            to_email: 'candidate@example.com',
            subject: subject,
            body: body,
            direction: 'received',
            processed: true,
            status_extracted: responseType.status,
          });

        // Update application status
        await supabase
          .from('job_applications')
          .update({
            status: responseType.status,
            last_status_update: new Date().toISOString(),
            status_details: { 
              message: responseType.type === 'rejection' ? 'Not selected' : 'Positive response received',
              email_received: true 
            }
          })
          .eq('id', app.id);

        if (responseType.type !== 'rejection') {
          positiveCount++;
        } else {
          rejectionCount++;
        }
      }

      // Reload data to show updates
      if (userId) {
        await loadData(userId);
      }

      // Show success notification
      toast({
        title: "📧 Companies Have Responded!",
        description: `You have ${positiveCount} positive responses! Check your Inbox.`,
        duration: 7000,
      });

    } catch (error) {
      console.error('Error simulating company responses:', error);
    }
  };

  // Calculate summary statistics
  const totalApplications = applications.length + rejectedApplications.length + inboxEmails.filter(e => e.status_extracted !== 'rejected').length;
  const pendingResponses = applications.filter(app => app.status === 'applied' || app.status === 'pending').length;
  const interviewsScheduled = inboxEmails.filter(e => e.status_extracted === 'interview_scheduled').length;
  const positiveResponses = inboxEmails.filter(e => e.status_extracted !== 'rejected').length;
  const successRate = totalApplications > 0 
    ? Math.round((positiveResponses / totalApplications) * 100) 
    : 0;

  // Inbox summary statistics
  const assignmentCount = inboxEmails.filter(e => e.status_extracted === 'interview_requested').length;
  const interviewCount = inboxEmails.filter(e => e.status_extracted === 'interview_scheduled').length;
  const contractCount = inboxEmails.filter(e => e.status_extracted === 'offer_received').length;
  const rejectedEmailCount = inboxEmails.filter(e => e.status_extracted === 'rejected').length;

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-y-scroll">
      <AppHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              GradFlow
            </h1>
            <p className="text-foreground/70">
              Your AI agent finds jobs daily. Add to your queue and apply automatically.
            </p>
          </div>
          
          <Button
            onClick={() => navigate("/profile")}
            variant="outline"
            size="lg"
            className="rounded-full"
          >
            <User className="w-4 h-4 mr-2" />
            My Profile
          </Button>
        </div>

        <Tabs defaultValue="new-jobs" className="w-full">
          <div className="sticky top-0 z-10 bg-white pb-4 border-b mb-8">
            <TabsList className="flex w-full flex-nowrap gap-2">
              <TabsTrigger value="new-jobs" className="flex-1 flex items-center gap-2 justify-center">
                <Briefcase className="w-4 h-4" />
                New Jobs ({scrapedJobs.length})
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex-1 flex items-center gap-2 justify-center">
                <ShoppingCart className="w-4 h-4" />
                Liked Jobs ({likedJobs.length})
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex-1 flex items-center gap-2 justify-center">
                <CheckCircle className="w-4 h-4" />
                Applications ({applications.length})
              </TabsTrigger>
              <TabsTrigger value="inbox" className="flex-1 flex items-center gap-2 justify-center">
                <Inbox className="w-4 h-4" />
                Inbox ({inboxEmails.length})
              </TabsTrigger>
              <TabsTrigger value="learning" className="flex-1 flex items-center gap-2 justify-center">
                <XCircle className="w-4 h-4" />
                Learning ({rejectedApplications.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* New Jobs Tab */}
          <TabsContent value="new-jobs">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-xl text-foreground/70">Loading new jobs...</p>
              </div>
            ) : scrapedJobs.length > 0 ? (
              <>
                {/* Banner for new jobs */}
                <Alert className="mb-6 bg-primary/5 border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <AlertDescription className="ml-2">
                    <span className="font-semibold text-primary">
                      While you were away, we found {scrapedJobs.filter(job => {
                        const daysAgo = Math.floor((Date.now() - new Date(job.scraped_at).getTime()) / (1000 * 60 * 60 * 24));
                        return daysAgo === 0;
                      }).length} new job{scrapedJobs.filter(job => {
                        const daysAgo = Math.floor((Date.now() - new Date(job.scraped_at).getTime()) / (1000 * 60 * 60 * 24));
                        return daysAgo === 0;
                      }).length !== 1 ? 's' : ''} that match your profile!
                    </span>
                  </AlertDescription>
                </Alert>

                {/* Added Today Section */}
                {scrapedJobs.filter(job => {
                  const daysAgo = Math.floor((Date.now() - new Date(job.scraped_at).getTime()) / (1000 * 60 * 60 * 24));
                  return daysAgo === 0;
                }).length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">✨ Added Today</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {scrapedJobs.filter(job => {
                        const daysAgo = Math.floor((Date.now() - new Date(job.scraped_at).getTime()) / (1000 * 60 * 60 * 24));
                        return daysAgo === 0;
                      }).map((job, index) => {
                    // Calculate days since posted
                    const postedDaysAgo = Math.floor((Date.now() - new Date(job.scraped_at).getTime()) / (1000 * 60 * 60 * 24));
                    const postedText = postedDaysAgo === 0 ? 'today' : postedDaysAgo === 1 ? 'yesterday' : `${postedDaysAgo} days ago`;

                    // Diverse job descriptions
                    const descriptions = [
                      'Support the product team in building and testing new features. You will analyze user feedback, help prioritize roadmaps, and work directly with engineers to bring ideas to life. Perfect for learning the full product lifecycle.',
                      'Assist in developing web applications using modern frameworks. Daily tasks include writing clean code, debugging issues, participating in code reviews, and learning best practices from senior developers.',
                      'Join marketing campaigns from concept to execution. You will create social media content, analyze campaign metrics, conduct market research, and contribute creative ideas to reach target audiences.',
                      'Help design user experiences that people love. You will create wireframes, conduct user testing, collaborate with developers, and learn industry-standard design tools while building a strong portfolio.',
                      'Support HR operations including recruitment, onboarding, and employee engagement. You will screen candidates, organize interviews, maintain employee records, and help create a positive workplace culture.',
                    ];

                    const matchPoints = [
                      [
                        'Your business administration background fits their requirements',
                        'Previous internship experience matches their expectations',
                        'You have the analytical skills they are looking for',
                      ],
                      [
                        'Your programming coursework aligns with their tech stack',
                        'Portfolio projects demonstrate relevant skills',
                        'Interest in continuous learning matches their culture',
                      ],
                      [
                        'Communication skills stand out in your profile',
                        'Social media experience is exactly what they need',
                        'Creative thinking aligns with campaign-focused role',
                      ],
                      [
                        'Design software proficiency matches their tools',
                        'Your portfolio shows strong visual design sense',
                        'User-centered approach aligns with their methodology',
                      ],
                      [
                        'People skills highlighted in your CV fit perfectly',
                        'Organizational abilities match HR coordination needs',
                        'Interest in workplace culture aligns with their values',
                      ],
                    ];

                    const benefits = [
                      {
                        workArrangement: 'Hybrid (3 days office, 2 days remote)',
                        hasCar: false,
                        freeLunch: true,
                        learningBudget: '€1,000/year',
                        officePerks: ['Modern office', 'Standing desks', 'Game room'],
                        vacationDays: '25 days',
                        otherBenefits: ['Pension contribution', 'Health insurance', 'Phone allowance']
                      },
                      {
                        workArrangement: 'Fully remote with quarterly team meetups',
                        hasCar: false,
                        freeLunch: false,
                        learningBudget: '€1,500/year',
                        officePerks: ['Home office stipend €500', 'Co-working space access'],
                        vacationDays: '28 days',
                        otherBenefits: ['Latest tech equipment', 'Wellness budget €300/year']
                      },
                      {
                        workArrangement: 'Office-based with flexible hours',
                        hasCar: true,
                        carDetails: 'Company lease car after 6 months',
                        freeLunch: true,
                        learningBudget: '€2,000/year',
                        officePerks: ['Rooftop terrace', 'Gym access', 'Coffee bar'],
                        vacationDays: '26 days',
                        otherBenefits: ['Travel allowance', 'Team events monthly', 'Bonus scheme']
                      },
                      {
                        workArrangement: 'Hybrid (2 days office, 3 days remote)',
                        hasCar: false,
                        freeLunch: false,
                        learningBudget: '€750/year',
                        officePerks: ['Creative workspace', 'Design library', 'Collaboration zones'],
                        vacationDays: '24 days',
                        otherBenefits: ['Software subscriptions', 'Conference tickets', 'Mentorship program']
                      },
                      {
                        workArrangement: 'Office-based (9-5 with flexible start)',
                        hasCar: false,
                        freeLunch: true,
                        learningBudget: '€800/year',
                        officePerks: ['Central location', 'Free parking', 'Quiet rooms'],
                        vacationDays: '25 days',
                        otherBenefits: ['Training courses', 'Career coaching', 'Team building budget']
                      },
                    ];

                    const salaries = [
                      { monthly: '€2,000 - €2,500', yearly: '€24,000 - €30,000', notes: 'Plus holiday allowance' },
                      { monthly: '€2,200 - €2,800', yearly: '€26,400 - €33,600', notes: 'Includes 13th month' },
                      { monthly: '€2,500 - €3,000', yearly: '€30,000 - €36,000', notes: 'Plus performance bonus' },
                      { monthly: '€1,800 - €2,300', yearly: '€21,600 - €27,600', notes: 'Plus travel allowance' },
                      { monthly: '€2,100 - €2,600', yearly: '€25,200 - €31,200', notes: 'Competitive benefits package' },
                    ];

                    const jobMatch: JobMatch = {
                      id: job.job_id,
                      matchScore: job.match_score || 85,
                      company: job.company,
                      description: descriptions[index % descriptions.length],
                      location: job.location,
                      salary: job.salary || 'Competitive salary',
                      postedDate: postedText,
                      matchingPoints: matchPoints[index % matchPoints.length],
                      salaryBreakdown: {
                        monthly: salaries[index % salaries.length].monthly,
                        yearly: salaries[index % salaries.length].yearly,
                        type: 'gross' as const,
                        notes: salaries[index % salaries.length].notes
                      },
                      benefits: benefits[index % benefits.length],
                      growthOpportunities: 'Mentorship from senior team members, professional development budget, clear career progression path, and opportunities to attend industry conferences and workshops.',
                      companyCulture: 'Collaborative and supportive work environment with flexible hours, regular team activities, and strong emphasis on work-life balance.',
                    };
                    
                    return (
                      <JobMatchCard
                        key={job.id}
                        job={jobMatch}
                        onApply={handleLikeJob}
                        onSave={handleSaveJob}
                        onDislike={handleDislikeJob}
                      />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Added Previously Section */}
              {scrapedJobs.filter(job => {
                const daysAgo = Math.floor((Date.now() - new Date(job.scraped_at).getTime()) / (1000 * 60 * 60 * 24));
                return daysAgo > 0;
              }).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">📋 Added Previously</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {scrapedJobs.filter(job => {
                      const daysAgo = Math.floor((Date.now() - new Date(job.scraped_at).getTime()) / (1000 * 60 * 60 * 24));
                      return daysAgo > 0;
                    }).map((job, index) => {
                      // Calculate days since posted
                      const postedDaysAgo = Math.floor((Date.now() - new Date(job.scraped_at).getTime()) / (1000 * 60 * 60 * 24));
                      const postedText = postedDaysAgo === 0 ? 'today' : postedDaysAgo === 1 ? 'yesterday' : `${postedDaysAgo} days ago`;

                      // Diverse job descriptions
                      const descriptions = [
                        'Support the product team in building and testing new features. You will analyze user feedback, help prioritize roadmaps, and work directly with engineers to bring ideas to life. Perfect for learning the full product lifecycle.',
                        'Assist in developing web applications using modern frameworks. Daily tasks include writing clean code, debugging issues, participating in code reviews, and learning best practices from senior developers.',
                        'Join marketing campaigns from concept to execution. You will create social media content, analyze campaign metrics, conduct market research, and contribute creative ideas to reach target audiences.',
                        'Help design user experiences that people love. You will create wireframes, conduct user testing, collaborate with developers, and learn industry-standard design tools while building a strong portfolio.',
                        'Support HR operations including recruitment, onboarding, and employee engagement. You will screen candidates, organize interviews, maintain employee records, and help create a positive workplace culture.',
                      ];

                      const matchPoints = [
                        [
                          'Your business administration background fits their requirements',
                          'Previous internship experience matches their expectations',
                          'You have the analytical skills they are looking for',
                        ],
                        [
                          'Your programming coursework aligns with their tech stack',
                          'Portfolio projects demonstrate relevant skills',
                          'Interest in continuous learning matches their culture',
                        ],
                        [
                          'Communication skills stand out in your profile',
                          'Social media experience is exactly what they need',
                          'Creative thinking aligns with campaign-focused role',
                        ],
                        [
                          'Design software proficiency matches their tools',
                          'Your portfolio shows strong visual design sense',
                          'User-centered approach aligns with their methodology',
                        ],
                        [
                          'People skills highlighted in your CV fit perfectly',
                          'Organizational abilities match HR coordination needs',
                          'Interest in workplace culture aligns with their values',
                        ],
                      ];

                      const benefits = [
                        {
                          workArrangement: 'Hybrid (3 days office, 2 days remote)',
                          hasCar: false,
                          freeLunch: true,
                          learningBudget: '€1,000/year',
                          officePerks: ['Modern office', 'Standing desks', 'Game room'],
                          vacationDays: '25 days',
                          otherBenefits: ['Pension contribution', 'Health insurance', 'Phone allowance']
                        },
                        {
                          workArrangement: 'Fully remote with quarterly team meetups',
                          hasCar: false,
                          freeLunch: false,
                          learningBudget: '€1,500/year',
                          officePerks: ['Home office stipend €500', 'Co-working space access'],
                          vacationDays: '28 days',
                          otherBenefits: ['Latest tech equipment', 'Wellness budget €300/year']
                        },
                        {
                          workArrangement: 'Office-based with flexible hours',
                          hasCar: true,
                          carDetails: 'Company lease car after 6 months',
                          freeLunch: true,
                          learningBudget: '€2,000/year',
                          officePerks: ['Rooftop terrace', 'Gym access', 'Coffee bar'],
                          vacationDays: '26 days',
                          otherBenefits: ['Travel allowance', 'Team events monthly', 'Bonus scheme']
                        },
                        {
                          workArrangement: 'Hybrid (2 days office, 3 days remote)',
                          hasCar: false,
                          freeLunch: false,
                          learningBudget: '€750/year',
                          officePerks: ['Creative workspace', 'Design library', 'Collaboration zones'],
                          vacationDays: '24 days',
                          otherBenefits: ['Software subscriptions', 'Conference tickets', 'Mentorship program']
                        },
                        {
                          workArrangement: 'Office-based (9-5 with flexible start)',
                          hasCar: false,
                          freeLunch: true,
                          learningBudget: '€800/year',
                          officePerks: ['Central location', 'Free parking', 'Quiet rooms'],
                          vacationDays: '25 days',
                          otherBenefits: ['Training courses', 'Career coaching', 'Team building budget']
                        },
                      ];

                      const salaries = [
                        { monthly: '€2,000 - €2,500', yearly: '€24,000 - €30,000', notes: 'Plus holiday allowance' },
                        { monthly: '€2,200 - €2,800', yearly: '€26,400 - €33,600', notes: 'Includes 13th month' },
                        { monthly: '€2,500 - €3,000', yearly: '€30,000 - €36,000', notes: 'Plus performance bonus' },
                        { monthly: '€1,800 - €2,300', yearly: '€21,600 - €27,600', notes: 'Plus travel allowance' },
                        { monthly: '€2,100 - €2,600', yearly: '€25,200 - €31,200', notes: 'Competitive benefits package' },
                      ];

                      const jobMatch: JobMatch = {
                        id: job.job_id,
                        matchScore: job.match_score || 85,
                        company: job.company,
                        description: descriptions[index % descriptions.length],
                        location: job.location,
                        salary: job.salary || 'Competitive salary',
                        postedDate: postedText,
                        matchingPoints: matchPoints[index % matchPoints.length],
                        salaryBreakdown: {
                          monthly: salaries[index % salaries.length].monthly,
                          yearly: salaries[index % salaries.length].yearly,
                          type: 'gross' as const,
                          notes: salaries[index % salaries.length].notes
                        },
                        benefits: benefits[index % benefits.length],
                        growthOpportunities: 'Mentorship from senior team members, professional development budget, clear career progression path, and opportunities to attend industry conferences and workshops.',
                        companyCulture: 'Collaborative and supportive work environment with flexible hours, regular team activities, and strong emphasis on work-life balance.',
                      };
                      
                      return (
                        <JobMatchCard
                          key={job.id}
                          job={jobMatch}
                          onApply={handleLikeJob}
                          onSave={handleSaveJob}
                          onDislike={handleDislikeJob}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              </>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-foreground/70 mb-2">No new jobs yet</p>
                <p className="text-foreground/60">Your AI agent searches daily for new opportunities</p>
              </div>
            )}
          </TabsContent>

          {/* Liked Jobs Tab */}
          <TabsContent value="liked">
            <LikedJobsList
              jobs={likedJobs}
              onApplySelected={handleApplyToSelected}
              onRemove={handleRemoveFromLiked}
              isApplying={isApplying}
            />
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <ApplicationsSummary
              totalApplications={totalApplications}
              pendingResponses={pendingResponses}
              interviewsScheduled={interviewsScheduled}
              successRate={successRate}
            />
            
            {applications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {applications.map((app) => {
                  const scrapedJob = scrapedJobs.find(j => j.job_id === app.job_id);
                  return (
                    <div 
                      key={app.id} 
                      onClick={() => {
                        setSelectedApplication(app);
                        setApplicationDetailOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <JobCard
                        title={app.position || 'Position'}
                        company={app.company || 'Company'}
                        status={app.status}
                        applicationSentAt={app.application_sent_at}
                        lastStatusUpdate={app.last_status_update}
                        statusDetails={app.status_details}
                        sourceUrl={scrapedJob?.source_url}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-foreground/70 mb-2">No active applications</p>
                <p className="text-foreground/60">Apply to jobs from your cart to track them here</p>
              </div>
            )}
          </TabsContent>

          {/* Inbox Tab - Email Responses */}
          <TabsContent value="inbox">
            {inboxEmails.length > 0 ? (
              <>
                {/* Inbox Summary Statistics */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 mb-1">Assignment</p>
                    <p className="text-2xl font-bold text-blue-800">{assignmentCount}</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">Interview Planning</p>
                    <p className="text-2xl font-bold text-green-800">{interviewCount}</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-700 mb-1">Contract Signing</p>
                    <p className="text-2xl font-bold text-purple-800">{contractCount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-700 mb-1">Not Selected</p>
                    <p className="text-2xl font-bold text-gray-800">{rejectedEmailCount}</p>
                  </div>
                </div>

                {/* Email List Header */}
                <div className="bg-muted/50 border-b-2 border-border">
                  <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold text-foreground/70 uppercase">
                    <div className="col-span-1 text-center">Icon</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Company</div>
                    <div className="col-span-4">Subject</div>
                    <div className="col-span-2 text-right">Date</div>
                  </div>
                </div>

                {/* Email List */}
                <div className="border rounded-lg overflow-hidden">
                  {inboxEmails.map((email) => (
                    <InboxEmailCard
                      key={email.id}
                      company={email.company}
                      position={email.position}
                      subject={email.subject}
                      body={email.body}
                      receivedAt={email.received_at}
                      status={email.status_extracted}
                      onClick={() => {
                        setSelectedEmail(email);
                        setIsEmailDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-foreground/70 mb-2">No messages yet</p>
                <p className="text-foreground/60">When companies respond to your applications, you'll see their messages here</p>
              </div>
            )}
          </TabsContent>

          {/* Email Detail Dialog */}
          <EmailDetailDialog
            open={isEmailDialogOpen}
            onOpenChange={setIsEmailDialogOpen}
            email={selectedEmail ? {
              company: selectedEmail.company,
              position: selectedEmail.position,
              subject: selectedEmail.subject,
              body: selectedEmail.body,
              receivedAt: selectedEmail.received_at,
              status: selectedEmail.status_extracted,
              from_email: selectedEmail.from_email,
              to_email: selectedEmail.to_email,
            } : null}
          />

          {/* Application Detail Dialog */}
          {selectedApplication && (
            <Dialog open={applicationDetailOpen} onOpenChange={setApplicationDetailOpen}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Application Details</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Job Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{selectedApplication.position}</h3>
                    <p className="text-foreground/70">{selectedApplication.company}</p>
                  </div>

                  {/* Email Sent */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Sent
                    </h4>
                    <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-line text-sm">
                      {`Dear Hiring Manager at ${selectedApplication.company},

I am writing to express my strong interest in the ${selectedApplication.position} position. With my background in software development and passion for creating innovative solutions, I believe I would be an excellent fit for your team.

During my recent internship at TechCorp, I gained hands-on experience with modern development practices and collaborated with cross-functional teams to deliver high-quality products. My academic projects have further strengthened my skills in problem-solving and technical communication.

I am particularly drawn to ${selectedApplication.company} because of your commitment to innovation and your impact in the industry. I am excited about the opportunity to contribute to your mission and grow as a professional.

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and enthusiasm can benefit your team.

Best regards,
[Your Name]`}
                    </div>
                  </div>

                  {/* CV Attached */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      CV Attached
                    </h4>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-foreground/70 mb-3">
                        Your CV was customized and sent as a PDF for this application.
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        Download CV (PDF)
                      </Button>
                    </div>
                  </div>

                  {/* Job Link */}
                  {scrapedJobs.find(j => j.job_id === selectedApplication.job_id)?.source_url && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Original Job Posting
                      </h4>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(scrapedJobs.find(j => j.job_id === selectedApplication.job_id)?.source_url, '_blank')}
                      >
                        View Job Description
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Learning Opportunities (Rejected) Tab */}
          <TabsContent value="learning">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-1">💡 Learning & Growth</h3>
              <p className="text-sm text-blue-700">
                Every "not selected" is a step closer to the right opportunity. These experiences help refine your approach for future applications.
              </p>
            </div>

            {rejectedApplications.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white border rounded-lg">
                    <p className="text-sm text-foreground/60 mb-1">Total Reviewed</p>
                    <p className="text-2xl font-bold">{rejectedApplications.length}</p>
                  </div>
                  <div className="p-4 bg-white border rounded-lg">
                    <p className="text-sm text-foreground/60 mb-1">Keep Applying</p>
                    <p className="text-2xl font-bold">{scrapedJobs.length}</p>
                    <p className="text-xs text-foreground/60">new matches available</p>
                  </div>
                  <div className="p-4 bg-white border rounded-lg">
                    <p className="text-sm text-foreground/60 mb-1">Success Rate</p>
                    <p className="text-2xl font-bold">{successRate}%</p>
                    <p className="text-xs text-foreground/60">interviews secured</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rejectedApplications.map((app) => (
                    <JobCard
                      key={app.id}
                      title={app.position}
                      company={app.company}
                      status={app.status}
                      applicationSentAt={app.application_sent_at}
                      lastStatusUpdate={app.last_status_update}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-foreground/70 mb-2">No learning opportunities yet</p>
                <p className="text-foreground/60">Keep applying - every application is valuable experience</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default Matches;
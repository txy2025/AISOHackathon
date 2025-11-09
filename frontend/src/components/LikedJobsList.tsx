import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, FileText, Trash2, Mail, Eye } from "lucide-react";
import { useState } from "react";

interface LikedJob {
  id: string;
  job_id: string;
  position: string;
  company: string;
  location?: string;
  salary?: string;
  match_score?: number;
  source_url?: string;
  created_at: string;
}

interface LikedJobsListProps {
  jobs: LikedJob[];
  onApplySelected: (jobIds: string[]) => void;
  onRemove: (jobId: string) => void;
  isApplying: boolean;
}

export const LikedJobsList = ({ jobs, onApplySelected, onRemove, isApplying }: LikedJobsListProps) => {
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [cvDialogOpen, setCvDialogOpen] = useState(false);
  const [selectedJobForPreview, setSelectedJobForPreview] = useState<LikedJob | null>(null);
  
  // Mock generated email and CV
  const generateMockEmail = (job: LikedJob) => `Dear Hiring Manager at ${job.company},

I am writing to express my strong interest in the ${job.position} position. With my background in software development and passion for creating innovative solutions, I believe I would be an excellent fit for your team.

During my recent internship at TechCorp, I gained hands-on experience with modern development practices and collaborated with cross-functional teams to deliver high-quality products. My academic projects have further strengthened my skills in problem-solving and technical communication.

I am particularly drawn to ${job.company} because of your commitment to innovation and your impact in the industry. I am excited about the opportunity to contribute to your mission and grow as a professional.

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and enthusiasm can benefit your team.

Best regards,
[Your Name]`;

  const generateMockCV = (job: LikedJob) => `CURRICULUM VITAE

John Doe
Email: john.doe@email.com | Phone: +31 6 1234 5678
LinkedIn: linkedin.com/in/johndoe

SUMMARY
Recent graduate with a strong foundation in software development and a passion for ${job.position} roles. Eager to apply technical skills and creative problem-solving abilities at ${job.company}.

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2020-2024
GPA: 3.8/4.0

EXPERIENCE
Software Development Intern | TechCorp | Summer 2023
• Developed responsive web applications using React and TypeScript
• Collaborated with designers to implement pixel-perfect UI components
• Participated in agile development processes and code reviews

Student Developer | University Innovation Lab | 2022-2024
• Built educational web platforms used by 500+ students
• Mentored junior developers in best practices
• Led a team of 4 developers on a capstone project

SKILLS
• Programming: JavaScript, TypeScript, Python, Java
• Web Development: React, Node.js, HTML/CSS
• Tools: Git, Docker, Figma, Jira
• Soft Skills: Team collaboration, Communication, Problem-solving

PROJECTS
Job Application Tracker - Full-stack web app for managing job applications
E-commerce Platform - Built a scalable online store with payment integration`;

  const handleViewEmail = (job: LikedJob) => {
    setSelectedJobForPreview(job);
    setEmailDialogOpen(true);
  };

  const handleViewCV = (job: LikedJob) => {
    setSelectedJobForPreview(job);
    setCvDialogOpen(true);
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(job => job.id));
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleApply = () => {
    if (selectedJobs.length > 0) {
      onApplySelected(selectedJobs);
      setSelectedJobs([]);
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No liked jobs yet. Start liking jobs to build your queue!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-secondary">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={selectedJobs.length === jobs.length}
            onCheckedChange={handleSelectAll}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All ({selectedJobs.length} of {jobs.length} selected)
          </label>
        </div>
        <Button
          onClick={handleApply}
          disabled={selectedJobs.length === 0 || isApplying}
          size="lg"
        >
          {isApplying ? 'Applying...' : `Apply to ${selectedJobs.length || ''} Selected Job${selectedJobs.length !== 1 ? 's' : ''}`}
        </Button>
      </div>

      {/* Jobs Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/30 border-b">
            <tr>
              <th className="w-12 p-3"></th>
              <th className="text-left p-3 text-sm font-semibold">Position</th>
              <th className="text-left p-3 text-sm font-semibold">Company</th>
              <th className="text-left p-3 text-sm font-semibold hidden md:table-cell">Location</th>
              <th className="text-left p-3 text-sm font-semibold hidden lg:table-cell">Salary</th>
              <th className="text-center p-3 text-sm font-semibold hidden sm:table-cell">Match</th>
              <th className="text-center p-3 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, index) => (
              <tr 
                key={job.id} 
                className={`border-b hover:bg-secondary/20 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-secondary/5'}`}
              >
                <td className="p-3">
                  <Checkbox
                    checked={selectedJobs.includes(job.id)}
                    onCheckedChange={() => handleSelectJob(job.id)}
                  />
                </td>
                <td className="p-3">
                  <div className="text-sm font-medium text-foreground line-clamp-1">
                    {job.position}
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-muted-foreground">
                    {job.company}
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <div className="text-sm text-muted-foreground">
                    {job.location || 'N/A'}
                  </div>
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <div className="text-sm text-muted-foreground">
                    {job.salary || 'Not specified'}
                  </div>
                </td>
                <td className="p-3 text-center hidden sm:table-cell">
                  {job.match_score && (
                    <Badge variant="secondary" className="text-xs">
                      {job.match_score}%
                    </Badge>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      title="Review Email"
                      onClick={() => handleViewEmail(job)}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden xl:inline">Email</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      title="Review CV"
                      onClick={() => handleViewCV(job)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden xl:inline">CV</span>
                    </Button>
                    {job.source_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="View Original Job Post"
                        onClick={() => window.open(job.source_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      title="Remove from Liked Jobs"
                      onClick={() => onRemove(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Email Preview Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Email to {selectedJobForPreview?.company}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted/30 rounded-lg p-6 border border-border">
              <div className="mb-4 pb-4 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">To: careers@{selectedJobForPreview?.company.toLowerCase().replace(/\s+/g, '')}.com</p>
                <p className="text-sm text-muted-foreground">Subject: Application for {selectedJobForPreview?.position}</p>
              </div>
              <div className="whitespace-pre-line text-sm leading-relaxed">
                {selectedJobForPreview && generateMockEmail(selectedJobForPreview)}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Close
              </Button>
              <Button>
                Edit Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CV Preview Dialog */}
      <Dialog open={cvDialogOpen} onOpenChange={setCvDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated CV for {selectedJobForPreview?.position}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted/30 rounded-lg p-6 border border-border">
              <div className="whitespace-pre-line text-sm leading-relaxed font-mono">
                {selectedJobForPreview && generateMockCV(selectedJobForPreview)}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCvDialogOpen(false)}>
                Close
              </Button>
              <Button>
                Edit CV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, X, Bookmark } from "lucide-react";

export interface SalaryBreakdown {
  monthly: string;
  yearly: string;
  type: 'gross' | 'net';
  notes?: string;
}

export interface Benefits {
  workArrangement: string;
  hasCar: boolean;
  carDetails?: string;
  freeLunch: boolean;
  learningBudget?: string;
  officePerks: string[];
  vacationDays?: string;
  otherBenefits: string[];
}

export interface JobMatch {
  id: string;
  matchScore: number;
  description: string;
  location: string;
  company?: string;
  salary?: string;
  matchReason?: string;
  matchingPoints?: string[];
  growthOpportunities?: string;
  companyCulture?: string;
  salaryBreakdown?: SalaryBreakdown;
  benefits?: Benefits;
  postedDate?: string;
}

interface JobMatchCardProps {
  job: JobMatch;
  onApply: (job: JobMatch) => void;
  onSave: (job: JobMatch) => void;
  onDislike: (job: JobMatch) => void;
}

const JobMatchCard = ({ job, onApply, onSave, onDislike }: JobMatchCardProps) => {
  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-orange-100 text-orange-800 border-orange-200";
  };

  return (
    <Card className="glass-card p-4 hover:shadow-elegant-hover transition-all duration-300 hover:-translate-y-1 relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {/* Company Name */}
          {job.company && (
            <h2 className="text-xl font-bold text-foreground mb-1">{job.company}</h2>
          )}
          
          {/* Location & Posted Date */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{job.location}</span>
            </div>
            {job.postedDate && (
              <>
                <span className="text-xs">Posted {job.postedDate}</span>
                <Badge variant="secondary" className="text-xs">
                  {job.postedDate === 'today' ? '✨ Added today!' : `Added ${job.postedDate}`}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Match Score Badge */}
        <Badge
          className={`text-sm font-bold px-3 py-1 ${getMatchColor(job.matchScore)}`}
        >
          {job.matchScore}% Match
        </Badge>
      </div>

      {/* Salary Breakdown */}
      {job.salaryBreakdown ? (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground mb-2">💰 Compensation</p>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <p className="text-xs text-muted-foreground">Monthly</p>
              <p className="text-lg font-bold text-primary">{job.salaryBreakdown.monthly}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Yearly</p>
              <p className="text-lg font-bold text-primary">{job.salaryBreakdown.yearly}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {job.salaryBreakdown.type === 'gross' ? '(Gross salary)' : '(Net salary)'}
            {job.salaryBreakdown.notes && ` - ${job.salaryBreakdown.notes}`}
          </p>
        </div>
      ) : job.salary && (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Salary Range</p>
          <p className="text-xl font-bold text-primary">{job.salary}</p>
        </div>
      )}

      {/* What You'll Actually Do */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <span className="text-primary">📋</span> What you'll actually do
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
      </div>

      {/* Benefits Section */}
      {job.benefits && (
        <div className="mb-4 p-3 bg-secondary/30 rounded-lg border border-secondary">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="text-primary">🎁</span> What you get
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-primary font-medium min-w-[100px]">Work style:</span>
              <span className="text-muted-foreground">{job.benefits.workArrangement}</span>
            </div>
            {job.benefits.freeLunch && (
              <div className="flex items-start gap-2">
                <span className="text-primary font-medium min-w-[100px]">Lunch:</span>
                <span className="text-muted-foreground">Free lunch provided 🍽️</span>
              </div>
            )}
            {job.benefits.hasCar && (
              <div className="flex items-start gap-2">
                <span className="text-primary font-medium min-w-[100px]">Car:</span>
                <span className="text-muted-foreground">{job.benefits.carDetails || 'Company car included'} 🚗</span>
              </div>
            )}
            {job.benefits.learningBudget && (
              <div className="flex items-start gap-2">
                <span className="text-primary font-medium min-w-[100px]">Learning:</span>
                <span className="text-muted-foreground">{job.benefits.learningBudget} annual budget 📚</span>
              </div>
            )}
            {job.benefits.vacationDays && (
              <div className="flex items-start gap-2">
                <span className="text-primary font-medium min-w-[100px]">Vacation:</span>
                <span className="text-muted-foreground">{job.benefits.vacationDays} 🏖️</span>
              </div>
            )}
            {job.benefits.officePerks.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-primary font-medium min-w-[100px]">Office:</span>
                <span className="text-muted-foreground">{job.benefits.officePerks.join(', ')}</span>
              </div>
            )}
            {job.benefits.otherBenefits.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-primary font-medium min-w-[100px]">Other:</span>
                <span className="text-muted-foreground">{job.benefits.otherBenefits.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Growth Opportunities */}
      {job.growthOpportunities && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">📈</span> Your growth path
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{job.growthOpportunities}</p>
        </div>
      )}

      {/* Specific Profile Matches */}
      {job.matchingPoints && job.matchingPoints.length > 0 && (
        <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
            <span>✨</span> Why this matches your profile
          </h4>
          <ul className="space-y-1.5">
            {job.matchingPoints.map((point, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Company Culture */}
      {job.companyCulture && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">🌟</span> Culture & vibe
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{job.companyCulture}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          onClick={() => onApply(job)}
          className="flex-1"
          size="lg"
        >
          I like this job! 👍
        </Button>
        <Button
          onClick={() => onSave(job)}
          variant="outline"
          size="lg"
          className="px-4"
        >
          <Bookmark className="w-5 h-5" />
        </Button>
        <Button
          onClick={() => onDislike(job)}
          variant="outline"
          size="lg"
          className="px-4 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
};

export default JobMatchCard;
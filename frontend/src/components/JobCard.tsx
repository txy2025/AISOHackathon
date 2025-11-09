import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink } from "lucide-react";

interface JobCardProps {
  title: string;
  company: string;
  location?: string;
  salary?: string;
  description?: string;
  matchScore?: number;
  status?: string;
  applicationSentAt?: string;
  lastStatusUpdate?: string;
  statusDetails?: any;
  sourceUrl?: string;
  emailCount?: number;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  showEmails?: boolean;
  onViewEmails?: () => void;
}

export const JobCard = ({
  title,
  company,
  location,
  salary,
  description,
  matchScore,
  status,
  applicationSentAt,
  lastStatusUpdate,
  statusDetails,
  sourceUrl,
  emailCount = 0,
  onAction,
  actionLabel,
  actionDisabled,
  showEmails,
  onViewEmails,
}: JobCardProps) => {
  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-700 border-green-500/20";
    if (score >= 60) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    return "bg-orange-500/10 text-orange-700 border-orange-500/20";
  };

  const getStatusBadge = (statusValue: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      cart: { label: 'In Cart', className: 'bg-blue-500/10 text-blue-700' },
      applied: { label: 'Applied', className: 'bg-purple-500/10 text-purple-700' },
      pending: { label: 'Awaiting Response', className: 'bg-yellow-500/10 text-yellow-700' },
      interview_requested: { label: 'Interview Requested', className: 'bg-green-500/10 text-green-700' },
      interview_scheduled: { label: 'Interview Scheduled', className: 'bg-green-600/10 text-green-800' },
      rejected: { label: 'Not Selected', className: 'bg-gray-500/10 text-gray-700' },
      offer_received: { label: 'Offer Received', className: 'bg-emerald-500/10 text-emerald-700' },
    };
    return statusConfig[statusValue] || { label: statusValue, className: 'bg-gray-500/10 text-gray-700' };
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-2">
      <div className="flex justify-between items-start mb-4">
        {matchScore !== undefined && (
          <Badge className={getMatchColor(matchScore)}>
            {matchScore}% Match
          </Badge>
        )}
        {status && (
          <Badge className={getStatusBadge(status).className}>
            {getStatusBadge(status).label}
          </Badge>
        )}
      </div>

      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-lg font-semibold text-primary mb-1">{company}</p>
      
      {location && <p className="text-sm text-foreground/70 mb-2">{location}</p>}
      {salary && <p className="text-lg font-bold text-green-600 mb-4">{salary}</p>}
      {description && <p className="text-foreground/80 mb-4 line-clamp-3">{description}</p>}

      {(applicationSentAt || lastStatusUpdate) && (
        <div className="text-sm text-foreground/70 space-y-1 mb-4">
          {applicationSentAt && (
            <p>Applied: {new Date(applicationSentAt).toLocaleDateString()}</p>
          )}
          {lastStatusUpdate && (
            <p>Last update: {new Date(lastStatusUpdate).toLocaleDateString()}</p>
          )}
        </div>
      )}

      {showEmails && emailCount > 0 && (
        <Button
          onClick={onViewEmails}
          variant="outline"
          size="sm"
          className="mb-3 w-full"
        >
          <Mail className="w-4 h-4 mr-2" />
          View Messages ({emailCount})
        </Button>
      )}

      <div className="flex gap-2">
        {sourceUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(sourceUrl, '_blank')}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Job
          </Button>
        )}
        
        {onAction && actionLabel && (
          <Button
            onClick={onAction}
            disabled={actionDisabled}
            className="flex-1"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};

import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, FileText, PenTool } from "lucide-react";

interface InboxEmailCardProps {
  company: string;
  position: string;
  subject: string;
  body: string;
  receivedAt: string;
  status: string;
  onClick: () => void;
}

export const InboxEmailCard = ({
  company,
  position,
  subject,
  receivedAt,
  status,
  onClick,
}: InboxEmailCardProps) => {
  const getStatusConfig = (statusValue: string) => {
    const configs: Record<string, { icon: any; label: string; color: string }> = {
      interview_requested: {
        icon: FileText,
        label: 'Assignment',
        color: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
      },
      interview_scheduled: {
        icon: Calendar,
        label: 'Interview Planning',
        color: 'bg-green-500/10 text-green-700 border-green-500/20'
      },
      offer_received: {
        icon: PenTool,
        label: 'Contract Signing',
        color: 'bg-purple-500/10 text-purple-700 border-purple-500/20'
      },
      rejected: {
        icon: Mail,
        label: 'Not Selected',
        color: 'bg-gray-500/10 text-gray-700 border-gray-500/20'
      },
    };
    return configs[statusValue] || {
      icon: Mail,
      label: 'Response',
      color: 'bg-gray-500/10 text-gray-700 border-gray-500/20'
    };
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div 
      onClick={onClick}
      className="grid grid-cols-12 gap-3 px-4 py-2 hover:bg-muted/50 cursor-pointer border-b transition-colors items-center"
    >
      <div className="col-span-1 flex justify-center">
        <StatusIcon className="w-4 h-4 text-primary" />
      </div>
      <div className="col-span-2">
        <Badge className={`${statusConfig.color} text-xs`}>
          {statusConfig.label}
        </Badge>
      </div>
      <div className="col-span-3">
        <p className="font-semibold text-sm truncate">{company}</p>
      </div>
      <div className="col-span-4">
        <p className="text-sm truncate text-foreground/70">{subject}</p>
      </div>
      <div className="col-span-2 text-right">
        <span className="text-xs text-foreground/60">
          {new Date(receivedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
          })}
        </span>
      </div>
    </div>
  );
};

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, FileText, PenTool } from "lucide-react";

interface EmailDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: {
    company: string;
    position: string;
    subject: string;
    body: string;
    receivedAt: string;
    status: string;
    from_email: string;
    to_email: string;
  } | null;
}

export const EmailDetailDialog = ({
  open,
  onOpenChange,
  email,
}: EmailDetailDialogProps) => {
  if (!email) return null;

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

  const statusConfig = getStatusConfig(email.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <StatusIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{email.subject}</DialogTitle>
                <p className="text-sm text-foreground/70 mt-1">
                  {email.company} - {email.position}
                </p>
              </div>
            </div>
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/60">From:</span>
              <span className="font-medium">{email.from_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">To:</span>
              <span className="font-medium">{email.to_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Date:</span>
              <span className="font-medium">
                {new Date(email.receivedAt).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-line text-foreground/90 leading-relaxed">
              {email.body}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

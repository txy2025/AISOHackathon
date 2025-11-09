import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Clock, Calendar, TrendingUp } from "lucide-react";

interface ApplicationsSummaryProps {
  totalApplications: number;
  pendingResponses: number;
  interviewsScheduled: number;
  successRate: number;
}

export const ApplicationsSummary = ({
  totalApplications,
  pendingResponses,
  interviewsScheduled,
  successRate,
}: ApplicationsSummaryProps) => {
  const stats = [
    {
      icon: Briefcase,
      label: "Total Applied",
      value: totalApplications,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Clock,
      label: "Pending Responses",
      value: pendingResponses,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      icon: Calendar,
      label: "Interviews Scheduled",
      value: interviewsScheduled,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: TrendingUp,
      label: "Response Rate",
      value: `${successRate}%`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-foreground/60 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

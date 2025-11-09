import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobMatch } from "@/components/JobMatchCard";
import { X, RotateCcw, MapPin } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

const DislikedJobs = () => {
  const [dislikedJobs, setDislikedJobs] = useState<JobMatch[]>([]);

  useEffect(() => {
    const disliked = JSON.parse(localStorage.getItem("dislikedJobs") || "[]");
    setDislikedJobs(disliked);
  }, []);

  const handleRestore = (job: JobMatch) => {
    const updated = dislikedJobs.filter((j) => j.id !== job.id);
    setDislikedJobs(updated);
    localStorage.setItem("dislikedJobs", JSON.stringify(updated));
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-orange-100 text-orange-800 border-orange-200";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center bg-secondary/30 rounded-full px-4 py-2 mb-4 shadow-sm">
            <X className="w-5 h-5 text-foreground/60 mr-2" />
            <span className="text-sm font-medium text-foreground/70">
              {dislikedJobs.length} Dismissed
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Disliked Jobs
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            {dislikedJobs.length > 0 
              ? "You can always restore these if you change your mind" 
              : "Jobs you dismiss will appear here"}
          </p>
        </div>

        {/* Job Cards Grid */}
        {dislikedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dislikedJobs.map((job) => (
              <Card key={job.id} className="bg-white/90 backdrop-blur-sm p-6 opacity-60 hover:opacity-100 transition-all duration-200 hover:shadow-lg relative border border-gray-200 rounded-2xl">
                {/* Match Score Badge */}
                <Badge
                  className={`absolute top-4 right-4 text-sm font-bold px-3 py-1 ${getMatchColor(
                    job.matchScore
                  )}`}
                >
                  {job.matchScore}% Match
                </Badge>

                {/* Company Name */}
                {job.company && (
                  <p className="text-sm font-semibold text-foreground/70 mb-2">{job.company}</p>
                )}

                {/* Salary */}
                {job.salary && (
                  <p className="text-lg font-bold text-primary mb-4 mt-8">{job.salary}</p>
                )}

                {/* Description */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-foreground mb-3">
                    What you'll actually do:
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">{job.description}</p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-foreground/70 mb-6">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{job.location}</span>
                </div>

                {/* Restore Button */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => handleRestore(job)}
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Restore to Matches
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <X className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-foreground/70 mb-2">
              No disliked jobs yet
            </p>
            <p className="text-foreground/60">
              Jobs you dismiss will appear here
            </p>
          </div>
        )}
      </main>
      
      <AppFooter />
    </div>
  );
};

export default DislikedJobs;
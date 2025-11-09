import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

const EXPERIENCE_TYPES = [
  { id: "internship", label: "Internship(s)", placeholder: "What company or field?" },
  { id: "project", label: "Class / Capstone Project", placeholder: "What was the project? (e.g., 'Marketing plan for a local business')" },
  { id: "parttime", label: "Part-Time Job", placeholder: "What was the job? (e.g., 'Shift supervisor at a coffee shop')" },
  { id: "volunteer", label: "Volunteer Work", placeholder: "What did you do?" },
  { id: "personal", label: "Personal Project", placeholder: "What did you build? (e.g., 'built a website, ran a student club')" },
  { id: "freelance", label: "Freelance / Gig Work", placeholder: "What type of work?" },
  { id: "none", label: "None of the above yet! (That's OK!)", placeholder: "" },
];

const OnboardingStep2 = () => {
  const navigate = useNavigate();
  const [selectedExperiences, setSelectedExperiences] = useState<Record<string, string>>({});

  const toggleExperience = (id: string) => {
    if (id === "none") {
      setSelectedExperiences({ none: "" });
      return;
    }

    if (selectedExperiences[id] !== undefined) {
      const newExp = { ...selectedExperiences };
      delete newExp[id];
      setSelectedExperiences(newExp);
    } else {
      const newExp = { ...selectedExperiences };
      delete newExp.none;
      newExp[id] = "";
      setSelectedExperiences(newExp);
    }
  };

  const updateExperienceDetail = (id: string, detail: string) => {
    setSelectedExperiences({
      ...selectedExperiences,
      [id]: detail,
    });
  };

  const handleNext = () => {
    localStorage.setItem("onboarding_experiences", JSON.stringify(selectedExperiences));
    navigate("/onboarding/step3");
  };

  const handleBack = () => {
    navigate("/onboarding/step1");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "66%" }}></div>
          </div>

          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-display font-bold">
              Let's find your skills. 💡
            </h1>
            <p className="text-xl text-foreground/70">(Hint: You have more than you think.)</p>
            <p className="text-base text-foreground/60 max-w-2xl mx-auto">
              This isn't a resume. We just want to know what you've done. School projects and
              part-time jobs are where the best skills come from!
            </p>
          </div>

          {/* Experience Selection */}
          <div className="glass-card p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-display font-semibold mb-2">
                What kinds of experience do you have?
              </h2>
              <p className="text-gray-600">
                Check all that apply. We'll ask for details in a second.
              </p>
            </div>

            <div className="space-y-4">
              {EXPERIENCE_TYPES.map((exp) => (
                <div key={exp.id}>
                  <label className="flex items-start cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedExperiences[exp.id] !== undefined}
                      onChange={() => toggleExperience(exp.id)}
                      className="mt-1 w-5 h-5 text-primary focus:ring-primary rounded"
                    />
                    <span className="ml-3 text-lg text-gray-900 group-hover:text-primary transition-colors">
                      {exp.label}
                    </span>
                  </label>

                  {/* Detail Input - shows when checked and not "none" */}
                  {selectedExperiences[exp.id] !== undefined && exp.id !== "none" && (
                    <div className="ml-8 mt-3 animate-fade-in">
                      <Input
                        type="text"
                        value={selectedExperiences[exp.id] || ""}
                        onChange={(e) => updateExperienceDetail(exp.id, e.target.value)}
                        placeholder={exp.placeholder}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              size="lg"
              variant="outline"
              onClick={handleBack}
              className="text-lg px-8 py-6 rounded-xl"
            >
              ← Back
            </Button>
            <Button
              size="lg"
              onClick={handleNext}
              disabled={Object.keys(selectedExperiences).length === 0}
              className="text-lg px-8 py-6 rounded-xl"
            >
              Next, let's tag your skills →
            </Button>
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default OnboardingStep2;

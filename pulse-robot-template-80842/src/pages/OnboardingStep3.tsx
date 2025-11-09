import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

// Skill suggestions based on experience type
const SKILL_SUGGESTIONS: Record<string, { label: string; skills: string[] }> = {
  parttime: {
    label: "job",
    skills: [
      "Problem-Solving",
      "Leadership",
      "Organization",
      "Collaboration",
      "Attention to Detail",
      "Customer Service",
      "Time Management",
    ],
  },
  project: {
    label: "project",
    skills: [
      "Research",
      "Communication",
      "Teamwork",
      "Data Literacy",
      "Presentation",
      "Critical Thinking",
      "Creativity",
    ],
  },
  internship: {
    label: "internship",
    skills: [
      "Professional Communication",
      "Industry Knowledge",
      "Project Management",
      "Adaptability",
      "Initiative",
    ],
  },
  volunteer: {
    label: "volunteer work",
    skills: ["Empathy", "Community Engagement", "Flexibility", "Dedication", "Teamwork"],
  },
  personal: {
    label: "personal project",
    skills: ["Self-Motivation", "Innovation", "Problem-Solving", "Technical Skills", "Persistence"],
  },
  freelance: {
    label: "freelance work",
    skills: ["Client Management", "Time Management", "Self-Direction", "Business Acumen", "Reliability"],
  },
};

// Popular tools by field
const TOOL_SUGGESTIONS: Record<string, string[]> = {
  "Tech / Software": ["Python", "JavaScript", "React", "SQL", "Git", "HTML/CSS"],
  Marketing: ["Google Analytics", "Canva", "Mailchimp", "Social Media", "SEO", "Content Writing"],
  Finance: ["Excel", "QuickBooks", "Financial Modeling", "Bloomberg", "Tableau"],
  "Graphic Design": ["Adobe Photoshop", "Illustrator", "Figma", "Canva", "InDesign"],
  "Sales / Business": ["CRM Software", "Excel", "PowerPoint", "Salesforce", "Negotiation"],
  Healthcare: ["EMR Systems", "Patient Care", "Medical Terminology", "HIPAA Compliance"],
  "Writing / Content": ["WordPress", "SEO Writing", "Copywriting", "Editing", "Research"],
  "Human Resources": ["HRIS", "Recruitment", "Employee Relations", "Payroll", "MS Office"],
};

const OnboardingStep3 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [toolInput, setToolInput] = useState("");
  const [experiences, setExperiences] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load data from previous steps
    const storedExp = localStorage.getItem("onboarding_experiences");
    const storedFields = localStorage.getItem("onboarding_fields");

    if (storedExp) setExperiences(JSON.parse(storedExp));
    if (storedFields) setFields(JSON.parse(storedFields));
  }, []);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const addTool = () => {
    if (toolInput.trim() && !tools.includes(toolInput.trim())) {
      setTools([...tools, toolInput.trim()]);
      setToolInput("");
    }
  };

  const removeTool = (tool: string) => {
    setTools(tools.filter((t) => t !== tool));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);

    try {
      // Store all onboarding data (allow empty selections)
      localStorage.setItem("onboarding_skills", JSON.stringify(selectedSkills));
      localStorage.setItem("onboarding_tools", JSON.stringify(tools));
      localStorage.setItem("onboarding_completed", "true");

      // Optional small delay to simulate save
      await new Promise((resolve) => setTimeout(resolve, 300));

      navigate("/matches");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/onboarding/step2");
  };

  // Get suggested tools based on selected fields
  const suggestedTools = fields.flatMap((field) => TOOL_SUGGESTIONS[field] || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "100%" }}></div>
          </div>

          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-display font-bold">
              This is where the magic happens. ✨
            </h1>
            <p className="text-base text-foreground/60 max-w-2xl mx-auto">
              Based on your experiences, you've built valuable skills. Let's tag them so we can match you.
            </p>
            {selectedSkills.length > 0 && (
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <span className="font-semibold">{selectedSkills.length} skills selected</span>
              </div>
            )}
          </div>

          {/* Skills from Experiences */}
          {Object.entries(experiences).map(([expType, detail]) => {
            const suggestion = SKILL_SUGGESTIONS[expType];
            if (!suggestion || expType === "none") return null;

            return (
              <div key={expType} className="glass-card p-8 space-y-4">
                <div>
                  <h2 className="text-xl font-display font-semibold mb-1">
                    Based on your '{detail || suggestion.label}'...
                  </h2>
                  <p className="text-foreground/70 text-sm">
                    Click to add these skills to your profile
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {suggestion.skills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                        selectedSkills.includes(skill)
                          ? "bg-primary text-white shadow-lg"
                          : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {selectedSkills.includes(skill) ? "✓ " : "+ "}
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Tools & Software */}
          <div className="glass-card p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-display font-semibold mb-2">
                Finally, what tools or software do you know?
              </h2>
              <p className="text-foreground/70">
                Start typing to add skills like Python, Excel, Canva, SQL, etc.
              </p>
            </div>

            {/* Tool Input */}
            <div className="flex gap-2">
              <Input
                type="text"
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTool()}
                placeholder="+ Add a skill..."
                className="flex-1"
              />
              <Button onClick={addTool} size="default">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Added Tools */}
            {tools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <span
                    key={tool}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium"
                  >
                    {tool}
                    <button
                      onClick={() => removeTool(tool)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Tools */}
            {suggestedTools.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Popular in your field:</p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(suggestedTools)].slice(0, 8).map((tool) => (
                    <button
                      key={tool}
                      onClick={() => {
                        if (!tools.includes(tool)) {
                          setTools([...tools, tool]);
                        }
                      }}
                      disabled={tools.includes(tool)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        tools.includes(tool)
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 border border-gray-300 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {tools.includes(tool) ? "✓ " : "+ "}
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedSkills.length > 0 && (
            <div className="glass-card p-6 bg-primary/5 border-primary/20">
              <p className="text-sm text-gray-700">
                <strong className="text-primary">Your Profile:</strong> {selectedSkills.length} skills
                {tools.length > 0 && ` + ${tools.length} tools`} identified 🎉
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              size="lg"
              variant="outline"
              onClick={handleBack}
              className="text-lg px-8 py-6 rounded-xl"
              disabled={isSubmitting}
            >
              ← Back
            </Button>
            <Button
              size="lg"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="text-lg px-8 py-6 rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Building your profile...
                </>
              ) : (
                "All done! See my job matches →"
              )}
            </Button>
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default OnboardingStep3;

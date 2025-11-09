import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

const FIELDS = [
  "Marketing",
  "Tech / Software",
  "Finance",
  "Graphic Design",
  "Sales / Business",
  "Healthcare",
  "Writing / Content",
  "Human Resources",
  "I'm not sure yet!",
];

const OnboardingStep1 = () => {
  const navigate = useNavigate();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [showCustomField, setShowCustomField] = useState(false);
  const [customField, setCustomField] = useState("");

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field));
    } else if (selectedFields.length < 3) {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const addCustomField = () => {
    if (customField.trim() && !selectedFields.includes(customField.trim()) && selectedFields.length < 3) {
      setSelectedFields([...selectedFields, customField.trim()]);
      setCustomField("");
      setShowCustomField(false);
    }
  };

  const handleNext = () => {
    if (selectedFields.length > 0 && status) {
      // Store in localStorage
      localStorage.setItem("onboarding_fields", JSON.stringify(selectedFields));
      localStorage.setItem("onboarding_status", status);
      navigate("/onboarding/step2");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "33%" }}></div>
          </div>

          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-display font-bold">
              Welcome to Career Spring! 🌱
            </h1>
            <p className="text-xl text-foreground/70">Let's build your Skills Profile</p>
            <p className="text-base text-foreground/60">
              We'll use this to find jobs that actually match what you can do.
            </p>
          </div>

           {/* Question 1: Field of Interest */}
          <div className="glass-card p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-display font-semibold mb-2">
                What's your main field of interest?
              </h2>
              <p className="text-foreground/70">
                This helps us know what kind of jobs to look for. (Pick 1-3)
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {FIELDS.map((field) => (
                <button
                  key={field}
                  onClick={() => toggleField(field)}
                  disabled={!selectedFields.includes(field) && selectedFields.length >= 3}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                    selectedFields.includes(field)
                      ? "bg-primary text-white shadow-lg scale-105"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {field}
                </button>
              ))}

              {!showCustomField ? (
                <button
                  onClick={() => setShowCustomField(true)}
                  disabled={selectedFields.length >= 3}
                  className="px-6 py-3 rounded-full text-sm font-medium bg-white text-gray-700 border-2 border-dashed border-gray-300 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add another...
                </button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={customField}
                    onChange={(e) => setCustomField(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addCustomField()}
                    placeholder="Type your field..."
                    className="px-4 py-2 rounded-full border-2 border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                  <Button onClick={addCustomField} size="sm" className="rounded-full">
                    Add
                  </Button>
                </div>
              )}
            </div>

            {selectedFields.length > 0 && (
              <p className="text-sm text-gray-500">
                Selected {selectedFields.length} of 3 fields
              </p>
            )}
          </div>

          {/* Question 2: Current Status */}
          <div className="glass-card p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-display font-semibold mb-2">
                What's your current status?
              </h2>
            </div>

            <div className="space-y-3">
              {[
                { value: "student", label: "Student", subtitle: "Looking for an internship or first job" },
                { value: "graduate", label: "Recent Graduate", subtitle: "Graduated in the last 2 years" },
                { value: "changer", label: "Career Changer", subtitle: "Looking to pivot into a new field" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    status === option.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={status === option.value}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="ml-3">
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.subtitle}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleNext}
              disabled={selectedFields.length === 0 || !status}
              className="text-lg px-8 py-6 rounded-xl"
            >
              Next, let's find your skills →
            </Button>
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default OnboardingStep1;

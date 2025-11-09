import { useState } from "react";
import { RefreshCw } from "lucide-react";

const jargonExamples = [
  {
    before: "Fast-paced, dynamic environment",
    after: "You'll be busy. Priorities change often."
  },
  {
    before: "Manage key stakeholders",
    after: "Send updates and get approvals from other teams."
  },
  {
    before: "We're looking for a self-starter",
    after: "Figure things out on your own. Less hand-holding."
  },
  {
    before: "Must be willing to wear many hats",
    after: "You'll do tasks outside your job description."
  },
  {
    before: "Ability to hit the ground running",
    after: "Little training. Start being productive immediately."
  },
  {
    before: "Strong communication skills",
    after: "Write clear emails and explain ideas simply."
  },
  {
    before: "Comfortable with ambiguity",
    after: "Vague instructions. You ask questions to clarify."
  },
  {
    before: "Results-driven",
    after: "Measured by numbers, not effort or hours worked."
  },
  {
    before: "Work cross-functionally",
    after: "Collaborate with different departments regularly."
  },
  {
    before: "Significant growth opportunities",
    after: "Could mean promotions or just more work. Ask!"
  }
];

export const JargonDecoderCard = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % jargonExamples.length);
    }, 300);
  };

  const current = jargonExamples[currentIndex];

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="relative h-56 cursor-pointer group"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-full transition-transform duration-700 ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-red-50 via-orange-50 to-red-100 border-3 border-red-300 rounded-2xl flex items-center justify-center p-6 shadow-xl group-hover:shadow-2xl transition-shadow duration-300"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-center">
              <div className="text-xs font-bold tracking-wider text-red-600 mb-3 uppercase">❌ Corporate Jargon</div>
              <div className="text-xl font-bold text-foreground leading-tight px-2">{current.before}</div>
              <div className="text-xs text-muted-foreground mt-5 font-medium animate-pulse">👆 Click to decode →</div>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-3 border-primary rounded-2xl flex items-center justify-center p-6 shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)"
            }}
          >
            <div className="text-center">
              <div className="text-xs font-bold tracking-wider text-primary mb-3 uppercase">✅ What It Actually Means</div>
              <div className="text-base font-semibold text-foreground leading-relaxed px-2">{current.after}</div>
              <div className="text-xs text-muted-foreground mt-5 font-medium">👆 Click to see jargon ←</div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleNext}
        className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-all duration-200 hover:scale-105"
      >
        <RefreshCw className="w-4 h-4" />
        Try another example
      </button>
    </div>
  );
};

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Target, Zap } from "lucide-react";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { JargonDecoderCard } from "@/components/JargonDecoderCard";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import { Background3D } from "@/components/Background3D";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

const ScrollSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const { ref, isVisible } = useScrollAnimation(0.1);
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-5"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const CareerSpringLanding = () => {
  const navigate = useNavigate();
  const [cvUploaded, setCvUploaded] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    const hasUploadedCV = localStorage.getItem("cvUploaded") === "true";
    const hasCompletedOnboarding = localStorage.getItem("onboarding_completed") === "true";
    setCvUploaded(hasUploadedCV);
    setOnboardingCompleted(hasCompletedOnboarding);
  }, []);

  return (
    <div className="min-h-screen bg-white relative">
      <Background3D />
      <AppHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-transparent pt-20 pb-32 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <AnimatedLogo className="w-32 h-32 mx-auto" animate={true} />
            </div>
            
            <h1 
              className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight opacity-0 animate-fade-in mb-6 max-w-5xl" 
              style={{ animationDelay: "0.3s" }}
            >
              Stop Applying. <span className="text-primary">Start Interviewing.</span>
            </h1>
            
            <p 
              className="text-2xl text-foreground/90 mb-4 leading-relaxed opacity-0 animate-fade-in max-w-3xl font-body font-semibold" 
              style={{ animationDelay: "0.5s" }}
            >
              Tired of sending 100 applications into a black hole? The "entry-level" market is broken. It's not you.
            </p>

            <p 
              className="text-xl text-foreground/70 mb-12 leading-relaxed opacity-0 animate-fade-in max-w-3xl font-body" 
              style={{ animationDelay: "0.6s" }}
            >
              Our AI agent finds jobs that actually match your skills, translates the jargon, and builds a perfect, tailored application in one click.
            </p>
            
            <div 
              className="opacity-0 animate-fade-in flex flex-col sm:flex-row gap-4 items-center justify-center" 
              style={{ animationDelay: "0.7s" }}
            >
              <Button
                onClick={() => navigate(cvUploaded ? "/matches" : "/upload")}
                size="lg"
                className="text-lg px-8 py-6 rounded-full transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
              >
                Activate My AI Agent
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              {onboardingCompleted && (
                <Button
                  onClick={() => navigate("/profile")}
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 rounded-full transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
                >
                  My Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-secondary/20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSection>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-center mb-8">
              The "Entry-Level" Trap
            </h2>
          </ScrollSection>
          
          <ScrollSection delay={100}>
            <p className="text-lg text-foreground/80 leading-relaxed mb-6 font-body">
              Sound familiar? You've done everything right, but the job market feels impossible.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl mt-1">•</span>
                <p className="text-lg text-foreground/80 font-body">"Entry-level" jobs ask for 3-5 years of experience.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl mt-1">•</span>
                <p className="text-lg text-foreground/80 font-body">Job descriptions are a puzzle of corporate jargon ("synergy," "stakeholders," "KPIs") that mean nothing.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl mt-1">•</span>
                <p className="text-lg text-foreground/80 font-body">You're fighting ATS bots that auto-reject your resume before a human ever sees it.</p>
              </li>
            </ul>
          </ScrollSection>

          <ScrollSection delay={200}>
            <blockquote className="border-l-4 border-primary pl-6 py-4 bg-white/80 backdrop-blur-sm rounded-r-xl shadow-sm">
              <p className="text-xl font-semibold text-foreground font-display">
                This is the <span className="text-primary">Experience Paradox</span>. You can't get a job without experience, and you can't get experience without a job. It's designed to make you feel unqualified. You are not.
              </p>
            </blockquote>
          </ScrollSection>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSection>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-center mb-6">
              You're Not Unqualified. You're Just Speaking the Wrong Language.
            </h2>
          </ScrollSection>

          <ScrollSection delay={100}>
            <p className="text-lg text-center text-foreground/80 max-w-3xl mx-auto mb-12 font-body">
              You have the skills. Recruiters just don't see them. Our AI acts as your personal translator, turning your academic and life experience into the professional language employers understand.
            </p>
            
            <div className="max-w-4xl mx-auto space-y-8 mb-20">
              <div className="bg-white/90 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-foreground/60 mb-2 font-body uppercase tracking-wide">BEFORE (Your CV)</p>
                    <p className="text-lg text-foreground/80 font-body">"Final Year Statistics Project"</p>
                  </div>
                  <div className="md:border-l-2 md:border-primary/20 md:pl-6">
                    <p className="text-sm font-semibold text-primary mb-2 font-body uppercase tracking-wide">AFTER (Our Translation)</p>
                    <p className="text-lg text-foreground font-semibold font-body">"Data Analysis: Modeled and analyzed a 5,000-entry dataset to identify key trends."</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-foreground/60 mb-2 font-body uppercase tracking-wide">BEFORE (Your CV)</p>
                    <p className="text-lg text-foreground/80 font-body">"Part-time barista"</p>
                  </div>
                  <div className="md:border-l-2 md:border-primary/20 md:pl-6">
                    <p className="text-sm font-semibold text-primary mb-2 font-body uppercase tracking-wide">AFTER (Our Translation)</p>
                    <p className="text-lg text-foreground font-semibold font-body">"Client Relations & Conflict Resolution: Managed 100+ daily customer interactions and resolved complaints in a high-pressure environment."</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollSection>

          {/* Jargon Decoder Spotlight Section */}
          <ScrollSection>
            <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border-4 border-red-200 rounded-3xl p-12 mb-16 shadow-2xl relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl -z-0" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Zap className="w-8 h-8 text-primary animate-pulse" />
                  <h3 className="text-3xl md:text-4xl font-display font-bold text-center">
                    We translate the jargon
                  </h3>
                  <Zap className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <p className="text-lg text-center text-foreground/80 mb-10 max-w-2xl mx-auto font-body">
                  Job descriptions are full of corporate jargon that makes you feel unqualified. 
                  We translate it into plain English so you can see you're already qualified.
                </p>
                <div className="max-w-lg mx-auto">
                  <JargonDecoderCard />
                </div>
                <p className="text-center text-sm text-foreground/60 mt-8 font-body italic">
                  💡 We decode 100+ common phrases so you know exactly what employers really mean
                </p>
              </div>
            </div>
          </ScrollSection>

          {/* Feature: Beat the Bots */}
          <ScrollSection>
            <div className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-3xl p-10 max-w-4xl mx-auto shadow-xl">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-3xl md:text-4xl font-display font-bold text-center mb-6">
                Beat the Bots. Get the Interview.
              </h3>
              <p className="text-lg text-foreground/80 font-body mb-6 text-center max-w-3xl mx-auto">
                Our <strong>Application Co-Pilot</strong> is your secret weapon to defeat the ATS.
              </p>
              <p className="text-lg text-foreground/80 font-body mb-6 leading-relaxed">
                When you find a job you like, our agent instantly reads the job description and tailors your resume in one click. It automatically highlights the exact keywords and skills the bot is scanning for, ensuring your application gets to a real person.
              </p>
              <p className="text-lg text-foreground/80 font-body leading-relaxed">
                It even writes your cover letter and suggests the perfect email to the hiring manager. No more guesswork.
              </p>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-gradient-to-br from-primary/5 via-secondary/30 to-transparent relative overflow-hidden z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollSection>
            <h2 className="text-4xl sm:text-5xl font-display font-bold mb-6">
              Stop Guessing. Find Your Fit.
            </h2>
          </ScrollSection>
          
          <ScrollSection delay={100}>
            <p className="text-xl text-foreground/80 mb-4 font-body">
              You've done the hard work. You're ready.
            </p>
            <p className="text-xl text-foreground/80 mb-10 font-body">
              Stop fighting a broken system. Let's activate your agent and get you the interview you deserve.
            </p>
          </ScrollSection>

          <ScrollSection delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                onClick={() => navigate(cvUploaded ? "/matches" : "/upload")}
                size="lg"
                className="text-lg px-10 py-6 rounded-full transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl"
              >
                Activate My Agent and Find My Job
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              {onboardingCompleted && (
                <Button
                  onClick={() => navigate("/profile")}
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-6 rounded-full transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl"
                >
                  My Profile
                </Button>
              )}
            </div>
          </ScrollSection>
        </div>
      </section>

      <AppFooter />
    </div>
  );
};

export default CareerSpringLanding;

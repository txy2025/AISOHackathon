import { useNavigate, useLocation } from "react-router-dom";
import { AnimatedLogo } from "@/components/AnimatedLogo";

export const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <header className="bg-white/80 border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => navigate("/")}
          >
            <AnimatedLogo 
              className="w-10 h-10" 
              animate={isLandingPage} 
            />
            <span className="text-2xl font-display font-bold">
              <span className="text-secondary">career</span>
              <span className="text-primary">spring.ai</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AppHeader />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
          <p className="text-2xl text-foreground/70 mb-8">Oops! Page not found</p>
          <Button
            onClick={() => navigate("/")}
            size="lg"
            className="rounded-full transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
          >
            Return to Home
          </Button>
        </div>
      </div>
      
      <AppFooter />
    </div>
  );
};

export default NotFound;

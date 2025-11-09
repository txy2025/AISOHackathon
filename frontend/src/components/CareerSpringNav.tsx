import { Sprout } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const CareerSpringNav = () => {
  const location = useLocation();

  const navLinks = [
    { path: "/matches", label: "Your Matches" },
    { path: "/saved", label: "Saved Careers" },
    { path: "/disliked", label: "Disliked Jobs" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Always links to home */}
          <Link to="/" className="flex items-center gap-2">
            <Sprout className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Career Spring</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-gray-600"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation */}
          <nav className="flex md:hidden gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-xs font-medium transition-colors hover:text-primary",
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-gray-600"
                )}
              >
                {link.label.split(" ")[0]}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default CareerSpringNav;
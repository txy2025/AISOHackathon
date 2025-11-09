import { AnimatedLogo } from "@/components/AnimatedLogo";

export const AppFooter = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-gray-100 py-8 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-foreground/60">
          <AnimatedLogo className="w-6 h-6" animate={false} />
          <span className="text-sm font-body">
            © 2025 <span className="text-secondary">career</span><span className="text-primary">spring.ai</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

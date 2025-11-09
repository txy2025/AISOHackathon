import { useEffect, useState } from "react";

interface AnimatedLogoProps {
  className?: string;
  animate?: boolean;
}

export const AnimatedLogo = ({ className = "", animate = true }: AnimatedLogoProps) => {
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (animate && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [animate, hasAnimated]);

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Soil/Ground */}
      <ellipse
        cx="50"
        cy="88"
        rx="12"
        ry="3"
        fill="hsl(30, 20%, 60%)"
        opacity={animate && !hasAnimated ? "0" : "1"}
      >
        {animate && !hasAnimated && (
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.2s"
            fill="freeze"
          />
        )}
      </ellipse>

      {/* Main Stem */}
      <path
        d="M 50 88 L 50 40"
        stroke="hsl(120, 61%, 27%)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={animate && !hasAnimated ? "48" : "0"}
        strokeDashoffset={animate && !hasAnimated ? "48" : "0"}
      >
        {animate && !hasAnimated && (
          <animate
            attributeName="stroke-dashoffset"
            from="48"
            to="0"
            dur="0.8s"
            begin="0.2s"
            fill="freeze"
          />
        )}
      </path>

      {/* Left Lower Leaf */}
      <path
        d="M 50 65 Q 35 62, 28 55 Q 32 58, 50 62"
        fill="hsl(120, 73%, 75%)"
        opacity={animate && !hasAnimated ? "0" : "1"}
      >
        {animate && !hasAnimated && (
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.2s"
            begin="0.8s"
            fill="freeze"
          />
        )}
      </path>

      {/* Right Lower Leaf */}
      <path
        d="M 50 65 Q 65 62, 72 55 Q 68 58, 50 62"
        fill="hsl(120, 73%, 75%)"
        opacity={animate && !hasAnimated ? "0" : "1"}
      >
        {animate && !hasAnimated && (
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.2s"
            begin="0.9s"
            fill="freeze"
          />
        )}
      </path>

      {/* Left Middle Leaf */}
      <path
        d="M 50 52 Q 32 50, 22 42 Q 28 46, 50 50"
        fill="hsl(120, 70%, 40%)"
        opacity={animate && !hasAnimated ? "0" : "1"}
      >
        {animate && !hasAnimated && (
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.2s"
            begin="1.0s"
            fill="freeze"
          />
        )}
      </path>

      {/* Right Middle Leaf */}
      <path
        d="M 50 52 Q 68 50, 78 42 Q 72 46, 50 50"
        fill="hsl(120, 70%, 40%)"
        opacity={animate && !hasAnimated ? "0" : "1"}
      >
        {animate && !hasAnimated && (
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.2s"
            begin="1.1s"
            fill="freeze"
          />
        )}
      </path>

      {/* Top Leaves - Left */}
      <ellipse
        cx="42"
        cy="38"
        rx="6"
        ry="8"
        fill="hsl(120, 61%, 27%)"
        opacity={animate && !hasAnimated ? "0" : "1"}
        transform="rotate(-25 42 38)"
      >
        {animate && !hasAnimated && (
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.2s"
            begin="1.2s"
            fill="freeze"
          />
        )}
      </ellipse>

      {/* Top Leaves - Center */}
      <ellipse
        cx="50"
        cy="32"
        rx="7"
        ry="10"
        fill="hsl(120, 61%, 27%)"
        opacity={animate && !hasAnimated ? "0" : "1"}
      >
        {animate && !hasAnimated && (
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.2s"
            begin="1.3s"
            fill="freeze"
          />
        )}
      </ellipse>

      {/* Top Leaves - Right */}
      <ellipse
        cx="58"
        cy="38"
        rx="6"
        ry="8"
        fill="hsl(120, 61%, 27%)"
        opacity={animate && !hasAnimated ? "0" : "1"}
        transform="rotate(25 58 38)"
      >
        {animate && !hasAnimated && (
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.2s"
            begin="1.4s"
            fill="freeze"
          />
        )}
      </ellipse>
    </svg>
  );
};

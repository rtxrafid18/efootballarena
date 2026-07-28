import { cn } from "@/lib/utils";

/**
 * Custom geometric football mark — gold panels on a deep stadium sphere.
 * Rolls smoothly (linear, GPU-friendly) with a soft light sweep.
 */
export function BallMark({ className }: { className?: string }) {
  return (
    <span className={cn("ball-mark", className)} aria-hidden>
      <svg viewBox="0 0 64 64" className="ball-mark-svg h-full w-full">
        <defs>
          <radialGradient id="ballSphere" cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor="oklch(0.42 0.03 265)" />
            <stop offset="60%" stopColor="oklch(0.24 0.02 265)" />
            <stop offset="100%" stopColor="oklch(0.15 0.02 265)" />
          </radialGradient>
          <linearGradient id="ballPanel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.92 0.13 90)" />
            <stop offset="100%" stopColor="oklch(0.72 0.15 72)" />
          </linearGradient>
        </defs>

        <circle cx="32" cy="32" r="29" fill="url(#ballSphere)" />

        {/* centre pentagon */}
        <polygon points="32,17 44,26 39.5,40 24.5,40 20,26" fill="url(#ballPanel)" />

        {/* outer panels */}
        <path d="M32 6.5 L46 12 L44 26 L32 17 Z" fill="url(#ballPanel)" opacity="0.55" />
        <path d="M32 6.5 L18 12 L20 26 L32 17 Z" fill="url(#ballPanel)" opacity="0.38" />
        <path d="M58.5 34 L50 45 L39.5 40 L44 26 Z" fill="url(#ballPanel)" opacity="0.42" />
        <path d="M5.5 34 L14 45 L24.5 40 L20 26 Z" fill="url(#ballPanel)" opacity="0.3" />
        <path d="M24.5 40 L39.5 40 L42 55 L22 55 Z" fill="url(#ballPanel)" opacity="0.5" />

        {/* seams */}
        <g
          stroke="oklch(0.88 0.1 88)"
          strokeOpacity="0.35"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M32 17 L32 6.5 M44 26 L58.5 34 M39.5 40 L42 55 M24.5 40 L22 55 M20 26 L5.5 34" />
        </g>

        <circle
          cx="32"
          cy="32"
          r="29"
          fill="none"
          stroke="oklch(0.85 0.13 85)"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
      </svg>
      <span className="ball-mark-sheen" />
    </span>
  );
}

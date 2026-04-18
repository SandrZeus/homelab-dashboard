import type { Check } from "../../types";

interface SparklineProps {
  checks: Check[];
  slots?: number;
  dimmed?: boolean;
}

export function Sparkline({
  checks,
  slots = 30,
  dimmed = false,
}: SparklineProps) {
  const chronological = [...checks].reverse();
  const displayed = chronological.slice(-slots);
  const padding = Array(Math.max(0, slots - displayed.length)).fill(null);
  const bars: (Check | null)[] = [...padding, ...displayed];

  return (
    <div className="sp-sparkline" aria-label={`Last ${slots} checks`}>
      {bars.map((check, i) => (
        <span
          key={i}
          className={
            dimmed || !check
              ? "sp-spark sp-spark--dim"
              : check.success
                ? "sp-spark sp-spark--up"
                : "sp-spark sp-spark--down"
          }
        />
      ))}
    </div>
  );
}

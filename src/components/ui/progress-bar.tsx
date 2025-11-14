interface ProgressBarProps {
  value: number;
  max: number;
  color: "amber" | "blue" | "green";
}

export function ProgressBar({ value, max, color }: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  const accentClasses = {
    amber: "accent-amber-500",
    blue: "accent-blue-500",
    green: "accent-green-500",
  } as const;

  return (
    <progress
      value={Math.max(0, Math.min(100, Math.round(percentage)))}
      max={100}
      className={`w-full h-2 ${accentClasses[color]} rounded-full overflow-hidden`}
    />
  );
}

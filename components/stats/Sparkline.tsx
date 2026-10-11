export function Sparkline({
  values,
  className = "h-8 w-full text-accent",
}: {
  values: number[];
  className?: string;
}) {
  if (values.length < 2) {
    return <div className={className} />;
  }
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const width = 80;
  const height = 28;
  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / (max - min || 1)) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

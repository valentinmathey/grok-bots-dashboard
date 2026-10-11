import type { ReactNode } from "react";

export function ChartFrame({
  height,
  fill = false,
  children,
}: {
  height?: number;
  fill?: boolean;
  children: ReactNode;
}) {
  const minHeight = height ?? 200;
  return (
    <div
      className={`relative w-full min-w-0 ${fill ? "min-h-0 flex-1" : ""}`}
      style={fill ? { minHeight } : { height: minHeight }}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

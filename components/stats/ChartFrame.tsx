import type { ReactNode } from "react";

export function ChartFrame({
  height,
  children,
}: {
  height: number;
  children: ReactNode;
}) {
  return (
    <div className="relative w-full" style={{ height }}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

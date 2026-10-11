"use client";

import type { ReactNode } from "react";
import Link from "next/link";

const BASE =
  "inline-flex max-w-full items-center justify-center gap-1.5 rounded-full border font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const ON = "border-accent bg-accent text-accent-ink";
const OFF = "border-line bg-card text-foreground hover:bg-chip";

export type ChipSize = "md" | "sm";

function sizeClass(size: ChipSize) {
  return size === "sm" ? "min-h-9 px-2.5 text-xs" : "min-h-11 px-3 text-sm";
}

export function chipClass(selected: boolean, className = "", size: ChipSize = "md") {
  return `${BASE} ${sizeClass(size)} ${selected ? ON : OFF} ${className}`.trim();
}

export function FilterChip({
  selected,
  check = false,
  href,
  onClick,
  children,
  className = "",
  size = "md",
}: {
  selected: boolean;
  check?: boolean;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  size?: ChipSize;
}) {
  const cls = chipClass(selected, className, size);
  const body = (
    <>
      {check && selected ? <span aria-hidden>✓</span> : null}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} aria-pressed={selected}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-pressed={selected}>
      {body}
    </button>
  );
}

export function ChipRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex w-full min-w-0 flex-wrap gap-2 ${className}`}>{children}</div>;
}

export function SegmentedControl({
  value,
  options,
  ariaLabel,
  className = "",
}: {
  value: string;
  options: Array<{
    id: string;
    label: ReactNode;
    href?: string;
    onClick?: () => void;
  }>;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`grid w-full min-w-0 gap-1 rounded-2xl bg-chip p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.id === value;
        const cls = `inline-flex min-h-11 items-center justify-center rounded-xl px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          selected
            ? "bg-accent font-semibold text-accent-ink"
            : "font-medium text-muted hover:bg-card hover:text-foreground"
        }`;
        if (option.href) {
          return (
            <Link
              key={option.id}
              href={option.href}
              role="tab"
              aria-selected={selected}
              className={cls}
            >
              {option.label}
            </Link>
          );
        }
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={option.onClick}
            className={cls}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

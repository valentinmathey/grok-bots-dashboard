"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ChevronDown } from "lucide-react";

const INTERACTIVE =
  "a, button, input, textarea, select, summary, label, [role='button'], [data-no-collapse], [data-gallery]";

export function isCardInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (typeof window !== "undefined") {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) {
      return true;
    }
  }
  return Boolean(target.closest(INTERACTIVE));
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useExpandable(defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !headerRef.current) return;
    const el = headerRef.current;
    const frame = window.requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const visible = rect.top >= 8 && rect.bottom <= window.innerHeight - 8;
      if (visible) return;
      el.scrollIntoView({
        block: "nearest",
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return { open, setOpen, headerRef, toggle: () => setOpen((value) => !value) };
}

export function ExpandChevron({ open }: { open: boolean }) {
  return (
    <span
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted"
      aria-hidden
    >
      <ChevronDown
        size={20}
        strokeWidth={1.75}
        className={`transition-transform duration-[220ms] ease-out motion-reduce:transition-none ${
          open ? "rotate-180" : ""
        }`}
      />
    </span>
  );
}

export function ExpandableHeader({
  open,
  onToggle,
  headerRef,
  controlsId,
  children,
  className = "",
}: {
  open: boolean;
  onToggle: () => void;
  headerRef?: RefObject<HTMLElement | null>;
  controlsId: string;
  children: ReactNode;
  className?: string;
}) {
  function onClick(event: MouseEvent<HTMLElement>) {
    if (isCardInteractiveTarget(event.target) && event.target !== event.currentTarget) {
      const node = event.target;
      if (node instanceof Element && node.closest(INTERACTIVE)) {
        return;
      }
    }
    event.stopPropagation();
    onToggle();
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (isCardInteractiveTarget(event.target) && event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onToggle();
  }

  return (
    <div
      ref={headerRef as RefObject<HTMLDivElement>}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-controls={controlsId}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
}

export function ExpandableBody({
  open,
  id,
  children,
  className = "",
}: {
  open: boolean;
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={`grid transition-[grid-template-rows] duration-[220ms] ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`transition-[opacity,transform] duration-[220ms] ease-out motion-reduce:transition-none ${
            open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          } ${className}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function cardCollapseProps(open: boolean, onToggle: () => void) {
  return {
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (!open) return;
      if (isCardInteractiveTarget(event.target)) return;
      onToggle();
    },
  };
}

export function ExpandableCard({
  id,
  open,
  onToggle,
  headerRef,
  header,
  preview,
  children,
  className = "",
}: {
  id?: string;
  open: boolean;
  onToggle: () => void;
  headerRef?: RefObject<HTMLElement | null>;
  header: ReactNode;
  preview?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const bodyId = useId();

  function onCardClick(event: MouseEvent<HTMLElement>) {
    if (!open) return;
    if (isCardInteractiveTarget(event.target)) return;
    onToggle();
  }

  return (
    <article
      id={id}
      className={`surface min-w-0 scroll-mt-20 overflow-hidden rounded-3xl ${className}`}
      onClick={onCardClick}
    >
      <ExpandableHeader
        open={open}
        onToggle={onToggle}
        headerRef={headerRef}
        controlsId={bodyId}
      >
        {header}
        {!open && preview ? preview : null}
      </ExpandableHeader>
      <ExpandableBody open={open} id={bodyId}>
        {children}
      </ExpandableBody>
    </article>
  );
}

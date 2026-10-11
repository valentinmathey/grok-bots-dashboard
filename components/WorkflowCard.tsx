"use client";

import { useId } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CircleAlert,
  ExternalLink,
  Mail,
  MessageCircle,
  Play,
  Webhook,
  Workflow,
} from "lucide-react";
import {
  cardCollapseProps,
  ExpandableBody,
  ExpandableHeader,
  useExpandable,
} from "@/components/ExpandableCard";
import { CardCover, CardHeaderPad } from "@/components/CollapsedCover";
import { MarkdownBody } from "@/components/MarkdownBody";
import { PostCardHeader, type PostCardBot } from "@/components/PostCardHeader";
import { formatDateTime } from "@/lib/format";
import { collapsedCover } from "@/lib/images";
import { asWorkflow, WORKFLOW_STATUS_LABELS } from "@/lib/rich-details";
import type { Post } from "@/lib/types";

const TRIGGER_ICONS: Record<string, typeof Workflow> = {
  webhook: Webhook,
  schedule: CalendarClock,
  telegram: MessageCircle,
  manual: Play,
  email: Mail,
  other: Workflow,
};

const STATUS_CLASS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  inactive: "bg-chip text-muted",
  draft: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
  error: "bg-red-500/15 text-red-800 dark:text-red-200",
  success: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  running: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
};

export function WorkflowCard({
  post,
  href,
  defaultOpen = false,
  bot,
  allowRequest = true,
}: {
  post: Post;
  href?: string;
  defaultOpen?: boolean;
  bot?: PostCardBot | null;
  allowRequest?: boolean;
}) {
  const { open, toggle, headerRef } = useExpandable(defaultOpen);
  const bodyId = useId();
  const details = asWorkflow(post.details);
  if (!details) return null;

  const TriggerIcon = TRIGGER_ICONS[details.trigger_type ?? "other"] ?? Workflow;
  const steps = details.steps?.length
    ? details.steps
    : details.nodes?.map((node) => (node.type ? `${node.name} · ${node.type}` : node.name)) ?? [];

  return (
    <article
      id={`post-${post.id}`}
      className="surface min-w-0 scroll-mt-20 overflow-hidden rounded-3xl"
      {...cardCollapseProps(open, toggle)}
    >
      <CardCover src={collapsedCover(post)?.url} alt={details.workflow_name} />
      <ExpandableHeader
        open={open}
        onToggle={toggle}
        headerRef={headerRef}
        controlsId={bodyId}
      >
        <CardHeaderPad>
          <PostCardHeader
            open={open}
            post={post}
            bot={bot}
            allowRequest={allowRequest}
            kind="workflow"
            title={
              href ? (
                <Link href={href} className="hover:underline">
                  {details.workflow_name}
                </Link>
              ) : (
                details.workflow_name
              )
            }
            titleClassName="mt-2 text-[1.1rem] font-semibold leading-snug tracking-tight"
            meta={
              <>
                {details.status ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[details.status] ?? "bg-chip"}`}
                  >
                    {WORKFLOW_STATUS_LABELS[details.status]}
                  </span>
                ) : null}
                {details.trigger_type ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium">
                    <TriggerIcon size={11} strokeWidth={1.75} />
                    {details.trigger_type}
                  </span>
                ) : null}
              </>
            }
            subtitle={
              !open ? (
                <p className="mt-2 text-sm text-muted">
                  {details.purpose || details.schedule_text || details.trigger_detail || "Workflow n8n"}
                </p>
              ) : null
            }
          />
        </CardHeaderPad>
      </ExpandableHeader>
      <ExpandableBody open={open} id={bodyId} className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
        {details.purpose ? <p className="text-sm leading-6">{details.purpose}</p> : null}
        {details.services?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {details.services.map((service) => (
              <span key={service} className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium">
                {service}
              </span>
            ))}
          </div>
        ) : null}
        {steps.length ? (
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={`${index}-${step}`} className="flex gap-3 text-sm leading-6">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-chip text-[11px] font-semibold">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {details.inputs || details.outputs ? (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {details.inputs ? (
              <p>
                <span className="font-semibold">Entrada. </span>
                {details.inputs}
              </p>
            ) : null}
            {details.outputs ? (
              <p>
                <span className="font-semibold">Salida. </span>
                {details.outputs}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-2xl bg-raised px-3 py-2.5 text-xs">
          {details.runs_7d != null ? <span>{details.runs_7d} corridas / 7d</span> : null}
          {details.errors_7d != null ? (
            <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-300">
              <CircleAlert size={12} strokeWidth={1.75} />
              {details.errors_7d} errores
            </span>
          ) : null}
          {details.last_run_at ? (
            <span>
              Última: {formatDateTime(details.last_run_at)}
              {details.last_run_status ? ` · ${details.last_run_status}` : ""}
            </span>
          ) : null}
          {details.version ? <span>v{details.version}</span> : null}
        </div>
        {details.credentials_needed?.length ? (
          <p className="text-xs text-muted">
            Credenciales: {details.credentials_needed.join(", ")}
          </p>
        ) : null}
        {details.notes ? <p className="text-sm text-muted">{details.notes}</p> : null}
        <div className="flex flex-wrap gap-3">
          {details.workflow_url ? (
            <a
              href={details.workflow_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-accent"
            >
              Abrir en n8n
              <ExternalLink size={13} strokeWidth={1.75} />
            </a>
          ) : null}
          {details.json_url ? (
            <a
              href={details.json_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-muted"
            >
              Export JSON
            </a>
          ) : null}
        </div>
        {post.body_markdown.trim() ? (
          <details className="text-sm text-muted">
            <summary className="cursor-pointer font-medium text-foreground">Ver en markdown</summary>
            <div className="mt-2">
              <MarkdownBody markdown={post.body_markdown} />
            </div>
          </details>
        ) : null}
      </ExpandableBody>
    </article>
  );
}

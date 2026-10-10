"use client";

import { useId } from "react";
import Link from "next/link";
import {
  Cloud,
  Code,
  Cpu,
  Database,
  ExternalLink,
  Globe,
  Newspaper,
  Rocket,
  Shield,
  Smartphone,
  Sparkles,
} from "lucide-react";
import {
  cardCollapseProps,
  ExpandableBody,
  ExpandableHeader,
  ExpandChevron,
  useExpandable,
} from "@/components/ExpandableCard";
import { KindBadge } from "@/components/KindBadge";
import { MarkdownBody } from "@/components/MarkdownBody";
import { MediaImage } from "@/components/MediaImage";
import { formatDate } from "@/lib/format";
import {
  asNewsletter,
  NEWSLETTER_ICON_LABELS,
  type NewsletterIcon,
} from "@/lib/rich-details";
import type { Post } from "@/lib/types";

const SECTION_ICONS: Record<NewsletterIcon, typeof Sparkles> = {
  ai: Sparkles,
  cloud: Cloud,
  security: Shield,
  dev: Code,
  startups: Rocket,
  hardware: Cpu,
  "open-source": Code,
  mobile: Smartphone,
  web: Globe,
  data: Database,
  other: Newspaper,
};

export function NewsletterCard({
  post,
  href,
  defaultOpen = false,
}: {
  post: Post;
  href?: string;
  defaultOpen?: boolean;
}) {
  const { open, toggle, headerRef } = useExpandable(defaultOpen);
  const bodyId = useId();
  const details = asNewsletter(post.details);
  if (!details) return null;

  const headline = details.headline || post.title;
  const storyCount = details.sections.reduce((sum, section) => sum + section.items.length, 0);
  const tldrCount = details.tldr?.length ?? 0;

  return (
    <article
      id={`post-${post.id}`}
      className="surface min-w-0 scroll-mt-20 overflow-hidden rounded-3xl"
      {...cardCollapseProps(open, toggle)}
    >
      <ExpandableHeader
        open={open}
        onToggle={toggle}
        headerRef={headerRef}
        controlsId={bodyId}
        className="p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {details.edition_number != null ? `Edición ${details.edition_number}` : "Newsletter"}
              {details.edition_date
                ? ` · ${formatDate(`${details.edition_date}T12:00:00-03:00`)}`
                : ""}
              {details.reading_minutes ? ` · ${details.reading_minutes} min` : ""}
            </p>
            <div className="mt-1 flex items-start justify-between gap-2">
              <h3 className="text-[1.1rem] font-semibold leading-snug tracking-tight">
                {href ? (
                  <Link href={href} className="hover:underline">
                    {headline}
                  </Link>
                ) : (
                  headline
                )}
              </h3>
              <KindBadge kind="newsletter" />
            </div>
            {!open ? (
              <p className="mt-2 text-sm text-muted">
                {tldrCount ? `${tldrCount} en el TL;DR` : null}
                {tldrCount && storyCount ? " · " : null}
                {storyCount ? `${storyCount} notas` : null}
                {!tldrCount && !storyCount ? "Abrí para leer la edición" : null}
              </p>
            ) : null}
          </div>
          <ExpandChevron open={open} />
        </div>
      </ExpandableHeader>
      <ExpandableBody open={open} id={bodyId} className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
        {details.tldr?.length ? (
          <div className="rounded-2xl bg-raised px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">TL;DR</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm leading-6">
              {details.tldr.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {details.sections.map((section) => {
          const Icon = section.icon ? SECTION_ICONS[section.icon] : Newspaper;
          return (
            <section key={section.title} className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                <Icon size={14} strokeWidth={1.75} className="text-accent" />
                {section.title}
                {section.icon ? (
                  <span className="text-[11px] font-medium text-muted">
                    {NEWSLETTER_ICON_LABELS[section.icon]}
                  </span>
                ) : null}
              </h4>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <article
                    key={`${section.title}-${item.title}`}
                    className="rounded-2xl border border-line p-3"
                  >
                    {item.image_url ? (
                      <MediaImage
                        src={item.image_url}
                        alt={item.title}
                        className="mb-2 max-h-36"
                      />
                    ) : null}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.source ? (
                        <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium">
                          {item.source}
                        </span>
                      ) : null}
                      {item.tags?.map((tag) => (
                        <span key={tag} className="text-[11px] text-muted">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 font-semibold leading-snug">{item.title}</p>
                    {item.summary ? (
                      <p className="mt-1 text-sm leading-6 text-muted">{item.summary}</p>
                    ) : null}
                    {item.why_it_matters ? (
                      <p className="mt-1.5 text-sm leading-6">
                        <span className="font-semibold">Por qué importa. </span>
                        {item.why_it_matters}
                      </p>
                    ) : null}
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-accent"
                      >
                        Leer más
                        <ExternalLink size={13} strokeWidth={1.75} />
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        {details.quote ? (
          <blockquote className="rounded-2xl border-l-4 border-accent bg-accent/8 px-3 py-2.5 text-sm leading-6">
            “{details.quote.text}”
            {details.quote.author ? (
              <footer className="mt-1 text-xs text-muted">— {details.quote.author}</footer>
            ) : null}
          </blockquote>
        ) : null}
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

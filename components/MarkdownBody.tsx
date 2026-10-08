"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { ExternalLink } from "lucide-react";
import { MediaImage } from "@/components/MediaImage";
import { isHttpUrl, promoteBareImageLinks } from "@/lib/images";

const components: Components = {
  table({ children }) {
    return (
      <div className="markdown-table-wrap" role="region" aria-label="Tabla">
        <table>{children}</table>
      </div>
    );
  },
  img({ src, alt }) {
    const href = typeof src === "string" ? src : "";
    if (!href || !isHttpUrl(href)) {
      return null;
    }
    return <MediaImage src={href} alt={alt ?? ""} className="max-h-[22rem]" />;
  },
  a({ href, children }) {
    const url = typeof href === "string" ? href : "";
    const external = Boolean(url && isHttpUrl(url));
    return (
      <a
        href={url || undefined}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="inline-flex items-baseline gap-1"
      >
        <span>{children}</span>
        {external ? (
          <ExternalLink size={12} strokeWidth={1.75} className="shrink-0 opacity-70" />
        ) : null}
      </a>
    );
  },
};

export function MarkdownBody({ markdown }: { markdown: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {promoteBareImageLinks(markdown)}
      </ReactMarkdown>
    </div>
  );
}

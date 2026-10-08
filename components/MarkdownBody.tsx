import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const components: Components = {
  table({ children }) {
    return (
      <div className="markdown-table-wrap" role="region" aria-label="Tabla">
        <table>{children}</table>
      </div>
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
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

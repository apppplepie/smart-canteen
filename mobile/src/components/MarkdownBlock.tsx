import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mdComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="my-1.5 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-1.5 list-disc pl-4 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-1.5 list-decimal pl-4 space-y-0.5">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-gray-300 pl-3 my-2 text-gray-600">{children}</blockquote>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) =>
    className?.includes("language-") ? (
      <pre className="bg-gray-100 rounded-lg p-2 overflow-x-auto text-xs my-2">
        <code>{children}</code>
      </pre>
    ) : (
      <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>
    ),
};

type MarkdownBlockProps = {
  text: string;
  className?: string;
};

/** 移动端统一 Markdown（与 AI 助手气泡风格一致），用于 AI 建议、官方回复等 */
export function MarkdownBlock({ text, className }: MarkdownBlockProps) {
  const t = text?.trim() ?? "";
  if (!t) return null;
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
        {t}
      </ReactMarkdown>
    </div>
  );
}

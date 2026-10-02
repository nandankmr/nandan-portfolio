import type { MDXRemoteProps } from 'next-mdx-remote/rsc';

// Custom components available inside MDX/Markdown posts.
// NOTE: the Hermes writer is only permitted to emit the components defined
// here (see hermes/writer.py sanitizer). Adding a new one requires updating
// both the writer's allowlist and its prompt.
export const mdxComponents: MDXRemoteProps['components'] = {
  // Prose callout: <Callout>text</Callout>
  Callout: ({ children }: { children: React.ReactNode }) => (
    <div className="prose-callout"><p>{children}</p></div>
  ),

  // Pull-quote: a large emphasized line lifted from the post's own text.
  // <PullQuote cite="Source name">the quote</PullQuote>
  PullQuote: ({ children, cite }: { children: React.ReactNode; cite?: string }) => (
    <figure className="prose-pullquote">
      <blockquote>{children}</blockquote>
      {cite ? <figcaption>— {cite}</figcaption> : null}
    </figure>
  ),

  // Stat: a single big number/date with a caption.
  // <Stat value="May 2026" label="rollout begins" />
  Stat: ({ value, label }: { value?: React.ReactNode; label?: React.ReactNode }) => (
    <div className="prose-stat">
      <span className="prose-stat-value">{value}</span>
      {label ? <span className="prose-stat-label">{label}</span> : null}
    </div>
  ),

  // Native Markdown blockquotes (> …) get the quote treatment too.
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="prose-quote">{children}</blockquote>
  ),
};

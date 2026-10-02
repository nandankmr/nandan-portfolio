import { compileMDX } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/lib/mdx-components';
import { mdxOptions, prepareMdxSource } from '@/lib/mdx';

/**
 * Render MDX without letting a compile error take down the page. MDXRemote
 * throws mid-stream on malformed MDX (which escapes the route's error boundary
 * once the shell has flushed); compiling here in a try/catch keeps a bad post
 * contained to a small inline notice instead of a hard 500.
 */
export default async function SafeMdx({ source }: { source: string }) {
  try {
    const { content } = await compileMDX({
      source: prepareMdxSource(source),
      components: mdxComponents,
      options: mdxOptions,
    });
    return <>{content}</>;
  } catch (error) {
    console.error('[SafeMdx] MDX compile failed:', (error as Error).message);
    return (
      <div className="prose-callout">
        <p>This post couldn’t be fully rendered right now. The issue has been logged.</p>
      </div>
    );
  }
}

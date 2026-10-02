import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import type { MDXRemoteProps } from 'next-mdx-remote/rsc';

function escapeMdxAttribute(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '&quot;');
}

function encodeMermaidChart(chart: string): string {
  return Buffer.from(chart, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function prepareMdxSource(source: string): string {
  return source.replace(
    /```mermaid\s*\n([\s\S]*?)```/g,
    (_match, chart: string) => {
      const trimmedChart = chart.trim();
      // Use the raster (/img/) endpoint, not /svg/: mermaid.ink's SVG carries
      // width="100%" with no intrinsic size, so an <img> collapses to ~150px.
      // The PNG has real pixel dimensions and scales correctly via our CSS.
      const src = `https://mermaid.ink/img/${encodeMermaidChart(trimmedChart)}`;
      const alt = escapeMdxAttribute(trimmedChart.split('\n')[0] ?? 'Architecture diagram');
      return `<figure className="mermaid-diagram"><a className="mermaid-expand" href="${src}" data-diagram-lightbox aria-label="Expand diagram"><span aria-hidden="true" /></a><a className="mermaid-image-link" href="${src}" data-diagram-lightbox aria-label="Expand diagram"><img src="${src}" alt="${alt}" loading="lazy" /></a></figure>`;
    }
  );
}

// Shared remark/rehype options for next-mdx-remote RSC
export const mdxOptions: MDXRemoteProps['options'] = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['anchor'] } }],
      [
        rehypePrettyCode,
        {
          theme: 'github-dark',
          keepBackground: true,
          defaultLang: 'plaintext',
        },
      ],
    ],
  },
};

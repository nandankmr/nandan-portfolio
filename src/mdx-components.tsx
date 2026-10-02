import type { MDXComponents } from 'mdx/types';

const components: MDXComponents = {
  blockquote: (props) => <blockquote className="prose-quote" {...props} />,
  pre: (props) => <pre className="prose-code" {...props} />,
  ul: (props) => <ul className="prose-list" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}

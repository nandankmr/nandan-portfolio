'use client';
import { createContext, useContext, useMemo, useState } from 'react';

// Cross-highlighting: hovering a tool lights the projects that used it, and
// hovering a project lights its tools.
type Highlight = {
  tool: string | null;
  project: string[] | null; // tool keys of the hovered project's stack
  setTool: (k: string | null) => void;
  setProject: (keys: string[] | null) => void;
};

const Ctx = createContext<Highlight>({ tool: null, project: null, setTool: () => {}, setProject: () => {} });

export function HighlightProvider({ children }: { children: React.ReactNode }) {
  const [tool, setTool] = useState<string | null>(null);
  const [project, setProject] = useState<string[] | null>(null);
  const value = useMemo(() => ({ tool, project, setTool, setProject }), [tool, project]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useHighlight = () => useContext(Ctx);

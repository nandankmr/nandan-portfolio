import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Nandan Kumar — Senior Full-stack & AI Engineer',
  description:
    'Full-stack AI engineer with 6+ years across SaaS, fintech, and ed-tech. Currently building agentic AI products at Crownstack Technologies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}

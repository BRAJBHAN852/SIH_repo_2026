import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Small Business Brain · Actionable Retail Analytics & Intelligence',
  description:
    'Simple, explainable analytics system for small business analyzing sales, inventory, and expenses to deliver clear actionable recommendations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}

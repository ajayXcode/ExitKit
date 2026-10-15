import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ExitKit Cloud | Cross-Examined Dependency Exits',
  description:
    'Exit risky dependencies safely with observed usage, open-weight AI exit plans, deterministic claim verification, and verified worktree patches.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col justify-between selection:bg-violet-300 selection:text-black">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}


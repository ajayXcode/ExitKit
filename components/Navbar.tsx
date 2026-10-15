'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal, Shield, GitBranch, Layers, PlayCircle, ExternalLink } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Layers },
    { href: '/repos', label: 'Repositories', icon: GitBranch },
    { href: '/new', label: 'New Analysis', icon: PlayCircle },
    { href: '/runs', label: 'Runs', icon: Terminal },
    { href: '/capsules', label: 'Capsules', icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#dfe4f2]/90 backdrop-blur-md border-b border-[#080909]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-epilogue font-black text-2xl tracking-tight text-[#080909]">
              Exit<span className="text-violet-600">Kit</span>
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#f7f8fa] border border-[#080909]/15 text-[#080909]/70 font-semibold">
              v0.1.0
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#080909] text-white shadow-sm'
                      : 'text-[#080909]/80 hover:bg-[#080909]/5 hover:text-[#080909]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/ajayXcode/ExitKit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-md border border-[#080909]/20 hover:bg-[#080909]/5 transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link
            href="/new"
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-[#080909] text-white hover:bg-violet-950 transition-colors shadow-sm"
          >
            Start Exit
          </Link>
        </div>
      </div>
    </header>
  );
}


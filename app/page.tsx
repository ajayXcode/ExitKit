'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
  GitBranch,
  Terminal,
  FileCode,
  Zap,
} from 'lucide-react';
import { demoCapsule } from '@/lib/store';

export default function HomePage() {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText('npx exitkit@latest run . --package anthropic');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f7f8fa] border border-[#080909]/15 text-xs font-mono font-semibold text-[#080909]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          HACKATHON TRACK 2: MAINTENANCE AGENT SKILL
        </div>

        <h1 className="font-epilogue font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-[#080909] max-w-4xl mx-auto leading-[1.08]">
          Exit risky dependencies with cross-examined evidence.
        </h1>

        <p className="text-lg sm:text-xl text-[#080909]/80 max-w-2xl mx-auto font-sans font-normal leading-relaxed">
          Other tools ask you to trust the AI's report. <strong>ExitKit</strong> shows you which of the AI's claims survived being checked against code.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#080909] text-white font-semibold text-sm hover:bg-violet-950 transition-all shadow-md hover:shadow-lg"
          >
            <span>Start Analysis Wizard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/capsules/cap_hermes_anthropic"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#f7f8fa] border border-[#080909]/20 text-[#080909] font-semibold text-sm hover:bg-white transition-all shadow-sm"
          >
            <span>Explore Demo Capsule</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </Link>
        </div>

        {/* CLI Terminal Bar */}
        <div className="pt-6 max-w-xl mx-auto">
          <div className="bg-[#080909] text-white p-3 sm:p-4 rounded-xl flex items-center justify-between font-mono text-xs sm:text-sm shadow-xl">
            <div className="flex items-center gap-2 overflow-x-auto text-emerald-400">
              <span className="text-gray-500">$</span>
              <span>npx exitkit@latest run . --package anthropic</span>
            </div>
            <button
              onClick={copyCommand}
              aria-label="Copy CLI command"
              className="ml-3 p-1.5 rounded-md hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[11px] text-[#080909]/60 font-mono mt-1.5 block">
            Zero-dependency Node engine • Works on Python &amp; JavaScript/TypeScript
          </span>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#080909]/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="font-epilogue font-bold text-lg text-[#080909]">Cross-Examined AI</h2>
            <p className="text-sm text-[#080909]/75 font-sans leading-relaxed">
              Every AI claim is decomposed into atomic statements. Code verifiers determine whether claims are <strong>CONFIRMED</strong>, <strong>REFUTED</strong>, or <strong>UNVERIFIABLE</strong>.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#080909]/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
              <FileCode className="w-5 h-5" />
            </div>
            <h2 className="font-epilogue font-bold text-lg text-[#080909]">Enforced Honesty</h2>
            <p className="text-sm text-[#080909]/75 font-sans leading-relaxed">
              Strict provenance tags enforced in code: <code>[OBSERVED]</code>, <code>[EXECUTED]</code>, and <code>[AI-GENERATED]</code>. The builder forbids mislabeling AI output as facts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#080909]/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <GitBranch className="w-5 h-5" />
            </div>
            <h2 className="font-epilogue font-bold text-lg text-[#080909]">Isolated Worktrees</h2>
            <p className="text-sm text-[#080909]/75 font-sans leading-relaxed">
              Original checkouts are never touched. Changes are applied in disposable git worktrees, verified against test baselines, and certified regression-free.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration Capsule Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#080909]/15 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700">
              LIVE EVIDENCE ARTIFACT
            </span>
            <h2 className="font-epilogue font-black text-2xl sm:text-3xl text-[#080909]">
              Demo Target: {demoCapsule.repository.name}
            </h2>
          </div>
          <Link
            href="/capsules/cap_hermes_anthropic"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#080909] hover:underline"
          >
            <span>VIEW FULL CAPSULE JSON &amp; MARKDOWN</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Capsule Card */}
        <div className="bg-white rounded-2xl border border-[#080909]/15 shadow-md overflow-hidden">
          {/* Capsule Header */}
          <div className="p-6 bg-[#f7f8fa] border-b border-[#080909]/10 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-epilogue font-bold text-lg text-[#080909]">
                  Exiting: <span className="text-violet-600">{demoCapsule.dependency.name}</span>
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  [OBSERVED] {demoCapsule.dependency.spec}
                </span>
              </div>
              <p className="text-xs text-[#080909]/70 font-mono">
                Manifest: {demoCapsule.dependency.manifest} • Difficulty Score: {demoCapsule.footprint.exit_difficulty}/10
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                STATUS: VERIFIED
              </span>
            </div>
          </div>

          {/* Claim Ledger Table */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-epilogue font-bold text-base text-[#080909] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-violet-600" />
                Claim Ledger (Cross-Examined Model Statements)
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">2 Confirmed</span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">1 Refuted</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">1 Unverifiable</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#080909]/10 text-xs font-mono text-[#080909]/60">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Statement</th>
                    <th className="py-2.5 px-3">Verdict</th>
                    <th className="py-2.5 px-3">Verifier Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#080909]/5 font-sans">
                  {demoCapsule.ai_analysis.claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs font-bold text-gray-500">
                        {claim.id}
                      </td>
                      <td className="py-3 px-3 text-sm text-[#080909]">
                        {claim.statement || claim.text}
                      </td>
                      <td className="py-3 px-3">
                        {claim.verdict === 'CONFIRMED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold verdict-confirmed">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            CONFIRMED
                          </span>
                        )}
                        {claim.verdict === 'REFUTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold verdict-refuted">
                            <XCircle className="w-3.5 h-3.5" />
                            REFUTED
                          </span>
                        )}
                        {claim.verdict === 'UNVERIFIABLE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold verdict-unverifiable">
                            <HelpCircle className="w-3.5 h-3.5" />
                            UNVERIFIABLE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-gray-600 truncate max-w-xs">
                        {JSON.stringify(claim.evidence[0])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diff Preview */}
          <div className="p-6 bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border-t border-[#080909]/10">
            <div className="flex items-center justify-between text-slate-400">
              <span>Proposed Patch (Applied in Worktree &amp; Verified)</span>
              <span>exitkit/exit-anthropic</span>
            </div>
            <pre className="overflow-x-auto p-3 bg-black/40 rounded-lg text-emerald-400 leading-relaxed">
              {demoCapsule.proposed_changes.diff}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, GitBranch, Layers } from 'lucide-react';
import { Capsule } from '@/lib/models/types';

export default function CapsulesPage() {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/capsules')
      .then((r) => r.json())
      .then((data) => setCapsules(data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-mono text-sm text-[#080909]/60">
        Loading capsules...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-epilogue font-black text-3xl sm:text-4xl text-[#080909]">
          Dependency Exit Capsules
        </h1>
        <p className="text-sm text-[#080909]/70 font-sans mt-1">
          Evidence-backed artifacts containing observed usages, cross-examined AI claim ledgers, and verified worktree diffs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {capsules.map((cap) => (
          <div
            key={cap.id}
            className="bg-white rounded-2xl border border-[#080909]/15 shadow-sm p-6 space-y-5 hover:border-violet-400 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gray-500">{cap.id}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {cap.proposed_changes.status.toUpperCase()}
                  </span>
                </div>
                <h2 className="font-epilogue font-black text-2xl text-[#080909]">
                  {cap.dependency.name}
                </h2>
                <span className="font-mono text-xs text-gray-500">
                  {cap.repository.name} • {cap.dependency.spec}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-semibold block text-gray-500">
                  Exit Difficulty
                </span>
                <span className="font-epilogue font-black text-2xl text-violet-700">
                  {cap.footprint.exit_difficulty}/10
                </span>
              </div>
            </div>

            <p className="text-xs text-[#080909]/80 line-clamp-2 font-sans bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              {cap.maintenance_problem.text}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-t border-gray-100">
              <div className="flex items-center gap-3 text-gray-600">
                <span>{cap.ai_analysis.accuracy.confirmed} Confirmed</span>
                <span>•</span>
                <span>{cap.ai_analysis.accuracy.refuted} Refuted</span>
                <span>•</span>
                <span>{cap.footprint.symbols.length} Symbols</span>
              </div>

              <Link
                href={`/capsules/${cap.id}`}
                className="inline-flex items-center gap-1.5 font-bold text-[#080909] hover:text-violet-600"
              >
                <span>Inspect Capsule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, ArrowRight, Play, CheckCircle2, Clock } from 'lucide-react';
import { AnalysisRun } from '@/lib/models/types';

export default function RunsPage() {
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/runs')
      .then((r) => r.json())
      .then((data) => setRuns(data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-mono text-sm text-[#080909]/60">
        Loading analysis runs...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-epilogue font-black text-3xl sm:text-4xl text-[#080909]">
            Analysis Pipeline Runs
          </h1>
          <p className="text-sm text-[#080909]/70 font-sans mt-1">
            History of sandboxed pipeline runs, claim cross-examinations, and capsule builds.
          </p>
        </div>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#080909] text-white text-xs font-semibold uppercase tracking-wider hover:bg-violet-950 transition-colors shadow-sm"
        >
          <Play className="w-4 h-4" />
          <span>Launch New Run</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#080909]/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-mono text-gray-500 bg-[#f7f8fa]">
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Repository</th>
                <th className="py-3 px-4">Target Dependency</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Current Step</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-500">
                    {run.id}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#080909]">
                    {run.repoFullName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">
                      {run.packageName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-gray-600 truncate max-w-[150px]">
                    {run.model}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        run.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : run.status === 'running'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {run.status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      )}
                      {run.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                    {run.currentStep}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/runs/${run.id}`}
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#080909] hover:text-violet-600"
                    >
                      <span>View Live</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

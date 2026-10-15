'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Terminal,
  ShieldCheck,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { AnalysisRun } from '@/lib/models/types';

export default function RunDetailPage({ params }: { params: { id: string } }) {
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRun = () => {
    fetch(`/api/runs/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setRun(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRun();
    const interval = setInterval(() => {
      fetchRun();
    }, 1200);

    return () => clearInterval(interval);
  }, [params.id]);

  if (loading || !run) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center font-mono text-sm text-[#080909]/60">
        Loading run details...
      </div>
    );
  }

  const steps = [
    { id: '1/9 scan', label: '1. Scan Manifests' },
    { id: '2/9 risk', label: '2. Risk Scoring' },
    { id: '3/9 select', label: '3. Dependency Selection' },
    { id: '4/9 usages', label: '4. Usages & Footprint' },
    { id: '5/9 baseline', label: '5. Baseline Checks' },
    { id: '6/9 ai_analysis', label: '6. AI Analysis & Plan' },
    { id: '7/9 claim_ledger', label: '7. Claim Ledger' },
    { id: '8/9 patch_worktree', label: '8. Worktree Patch' },
    { id: '9/9 capsule_ready', label: '9. Verified Capsule' },
  ];

  const currentIdx = steps.findIndex((s) => s.id === run.currentStep);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#080909]/15 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-gray-500">{run.id}</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${
                  run.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800 animate-pulse'
                }`}
              >
                {run.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                )}
                {run.status.toUpperCase()}
              </span>
            </div>
            <h1 className="font-epilogue font-black text-2xl sm:text-3xl text-[#080909] flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-violet-600" />
              {run.repoFullName} : <span className="text-violet-600">{run.packageName}</span>
            </h1>
            <p className="text-xs font-mono text-gray-500">
              Ref: {run.ref} • Model: {run.model} • Started: {new Date(run.startedAt).toLocaleTimeString()}
            </p>
          </div>

          {run.capsuleId && (
            <Link
              href={`/capsules/${run.capsuleId}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#080909] text-white text-xs font-semibold uppercase tracking-wider hover:bg-violet-950 transition-colors shadow-md"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Inspect Capsule</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-mono text-gray-600">
            <span>Pipeline Progress ({run.currentStep})</span>
            <span>{run.progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 transition-all duration-500 ease-out"
              style={{ width: `${run.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 9-Step Timeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((st, i) => {
          const isDone = run.status === 'completed' || i < currentIdx;
          const isCurrent = i === currentIdx && run.status === 'running';

          return (
            <div
              key={st.id}
              className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                  : isCurrent
                  ? 'border-violet-500 bg-violet-50/70 text-violet-900 ring-2 ring-violet-400 font-bold'
                  : 'border-gray-200 bg-white text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{st.label}</span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {isCurrent && <Clock className="w-4 h-4 text-violet-600 animate-spin" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Terminal Logs */}
      <div className="bg-[#080909] rounded-2xl p-6 text-slate-100 font-mono text-xs shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold tracking-wider uppercase text-gray-300">
              Live Runner Execution Logs
            </span>
          </div>
          <span className="text-[11px] text-gray-500">
            {run.logs.length} events recorded
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto leading-relaxed">
          {run.logs.map((log, index) => (
            <div key={index} className="flex items-start gap-3 text-emerald-400/90 hover:text-white transition-colors">
              <span className="text-gray-600 select-none">[{index + 1}]</span>
              <span>{log}</span>
            </div>
          ))}
          {run.status === 'running' && (
            <div className="flex items-center gap-2 text-violet-400 animate-pulse pt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
              <span>Running deterministic sandboxed checks...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


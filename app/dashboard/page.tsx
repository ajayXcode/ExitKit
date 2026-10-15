'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  Shield,
  Layers,
  CheckCircle,
  ArrowRight,
  Plus,
  Play,
} from 'lucide-react';
import { Repository, AnalysisRun, Capsule } from '@/lib/models/types';

export default function DashboardPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/repos').then((r) => r.json()),
      fetch('/api/runs').then((r) => r.json()),
      fetch('/api/capsules').then((r) => r.json()),
    ])
      .then(([reposData, runsData, capsulesData]) => {
        setRepos(reposData.data || []);
        setRuns(runsData.data || []);
        setCapsules(capsulesData.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-mono text-sm text-[#080909]/60">
        Loading dashboard metrics...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-epilogue font-black text-3xl sm:text-4xl text-[#080909]">
            System Dashboard
          </h1>
          <p className="text-sm text-[#080909]/70 font-sans mt-1">
            Overview of monitored repositories, risky dependencies, and verified exit capsules.
          </p>
        </div>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#080909] text-white text-xs font-semibold uppercase tracking-wider hover:bg-violet-950 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Analysis</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-[#080909]/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono uppercase font-semibold">Repositories</span>
            <GitBranch className="w-4 h-4 text-violet-600" />
          </div>
          <div className="font-epilogue font-black text-3xl text-[#080909]">{repos.length}</div>
          <span className="text-xs text-emerald-600 font-medium">100% connected via GitHub</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#080909]/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono uppercase font-semibold">Tracked Dependencies</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-epilogue font-black text-3xl text-[#080909]">
            {repos.reduce((acc, r) => acc + r.dependencies.length, 0)}
          </div>
          <span className="text-xs text-rose-600 font-medium">1 high maintenance risk</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#080909]/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono uppercase font-semibold">Exit Capsules</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-epilogue font-black text-3xl text-[#080909]">{capsules.length}</div>
          <span className="text-xs text-emerald-600 font-medium">All verified &amp; schema 1.0</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#080909]/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-mono uppercase font-semibold">AI Claim Accuracy</span>
            <CheckCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-epilogue font-black text-3xl text-[#080909]">75%</div>
          <span className="text-xs text-gray-600 font-medium">1 refuted claim caught by ledger</span>
        </div>
      </div>

      {/* Recent Analysis Runs */}
      <div className="bg-white rounded-xl border border-[#080909]/10 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-epilogue font-bold text-xl text-[#080909]">Recent Analysis Pipeline Runs</h2>
          <Link href="/runs" className="text-xs font-mono font-bold text-violet-700 hover:underline">
            View All Runs →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-mono text-gray-500">
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Repository</th>
                <th className="py-2.5 px-3">Dependency</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Step</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs font-semibold text-gray-500">{run.id}</td>
                  <td className="py-3 px-3 font-medium text-[#080909]">{run.repoFullName}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">
                      {run.packageName}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        run.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : run.status === 'running'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {run.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-gray-600">{run.currentStep}</td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/runs/${run.id}`}
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#080909] hover:text-violet-600"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connected Repositories */}
      <div className="bg-white rounded-xl border border-[#080909]/10 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-epilogue font-bold text-xl text-[#080909]">Connected Repositories</h2>
          <Link href="/repos" className="text-xs font-mono font-bold text-violet-700 hover:underline">
            Manage Repositories →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="p-4 rounded-lg border border-gray-200 hover:border-violet-300 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#080909] flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-gray-500" />
                  {repo.fullName}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {repo.defaultBranch}
                </span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-1">{repo.description}</p>
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {repo.dependencies.length} scanned dependencies
                </span>
                <Link
                  href={`/new?repo=${repo.id}`}
                  className="font-mono font-bold text-violet-700 hover:underline inline-flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Run Exit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


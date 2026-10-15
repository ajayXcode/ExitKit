'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GitBranch, ShieldAlert, Play, Plus, RefreshCw, ExternalLink } from 'lucide-react';
import { Repository } from '@/lib/models/types';

export default function ReposPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [scanningId, setScanningId] = useState<string | null>(null);

  const fetchRepos = () => {
    fetch('/api/repos')
      .then((r) => r.json())
      .then((data) => setRepos(data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName) return;

    await fetch('/api/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: newFullName,
        name: newFullName.split('/')[1] || newFullName,
        description: newDescription || 'Connected via web console',
      }),
    });

    setNewFullName('');
    setNewDescription('');
    setShowAddModal(false);
    fetchRepos();
  };

  const handleScan = async (repoId: string) => {
    setScanningId(repoId);
    try {
      await fetch(`/api/repos/${repoId}/scan`, { method: 'POST' });
      fetchRepos();
    } finally {
      setScanningId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-mono text-sm text-[#080909]/60">
        Loading repositories...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-epilogue font-black text-3xl sm:text-4xl text-[#080909]">
            Repositories
          </h1>
          <p className="text-sm text-[#080909]/70 font-sans mt-1">
            Connected repositories monitored for unbounded versions, vendor lock-in, and hardcoded model IDs.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#080909] text-white text-xs font-semibold uppercase tracking-wider hover:bg-violet-950 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Repository</span>
        </button>
      </div>

      {/* Repositories List */}
      <div className="space-y-6">
        {repos.map((repo) => (
          <div
            key={repo.id}
            className="bg-white rounded-xl border border-[#080909]/10 shadow-sm p-6 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="font-epilogue font-bold text-xl text-[#080909] flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-violet-600" />
                    {repo.fullName}
                  </h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {repo.defaultBranch}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-sans">{repo.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleScan(repo.id)}
                  disabled={scanningId === repo.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanningId === repo.id ? 'animate-spin' : ''}`} />
                  <span>Scan Manifests</span>
                </button>
                <a
                  href={repo.cloneUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600"
                  aria-label="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Detected Dependencies */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                Detected Dependencies ({repo.dependencies.length})
              </h3>

              {repo.dependencies.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-xs font-mono text-gray-500">
                  No dependencies indexed yet. Click "Scan Manifests" to parse requirements.txt and package.json.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {repo.dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-4 rounded-lg border border-gray-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-epilogue font-bold text-base text-[#080909]">
                            {dep.name}
                          </span>
                          <span className="block font-mono text-xs text-gray-500">
                            {dep.spec} ({dep.manifestFile}:{dep.manifestLine})
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                              dep.riskScore > 70
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            Risk: {dep.riskScore}/100
                          </span>
                          <span className="block text-[11px] font-mono text-gray-500 mt-0.5">
                            Difficulty: {dep.exitDifficulty}/10
                          </span>
                        </div>
                      </div>

                      {/* Signals */}
                      {dep.signals.length > 0 && (
                        <div className="space-y-1">
                          {dep.signals.map((sig) => (
                            <div
                              key={sig.id}
                              className="flex items-start gap-1.5 text-xs text-rose-700 bg-rose-50/80 p-1.5 rounded"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              <span>{sig.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-gray-200 text-xs">
                        <span className="text-gray-500 font-mono">
                          {dep.symbolsCount} symbols • {dep.callSitesCount} call sites
                        </span>
                        <Link
                          href={`/new?repo=${repo.id}&package=${dep.name}`}
                          className="inline-flex items-center gap-1 font-mono font-bold text-violet-700 hover:underline"
                        >
                          <Play className="w-3 h-3" />
                          Launch Exit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Connect Repo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h2 className="font-epilogue font-bold text-xl text-[#080909]">
              Connect GitHub Repository
            </h2>
            <form onSubmit={handleAddRepo} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-gray-700 mb-1">
                  Repository Full Name (owner/repo)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. facebook/react or runninwithitmarketing/hermes-skill-deck"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Optional brief description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#080909] hover:bg-violet-950 rounded-lg"
                >
                  Connect &amp; Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

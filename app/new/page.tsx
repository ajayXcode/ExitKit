'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Play, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Repository } from '@/lib/models/types';

function NewAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRepo = searchParams.get('repo') || '';
  const initialPkg = searchParams.get('package') || '';

  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState(initialRepo);
  const [selectedPkg, setSelectedPkg] = useState(initialPkg);
  const [selectedModel, setSelectedModel] = useState('qwen2.5-coder:7b');
  const [ref, setRef] = useState('main');
  const [smokeCmd, setSmokeCmd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/repos')
      .then((r) => r.json())
      .then((data) => {
        const rList = data.data || [];
        setRepos(rList);
        if (!selectedRepoId && rList.length > 0) {
          setSelectedRepoId(rList[0].id);
        }
      });
  }, [selectedRepoId]);

  const currentRepo = repos.find((r) => r.id === selectedRepoId);

  const handleSuggest = () => {
    if (currentRepo && currentRepo.dependencies.length > 0) {
      // Find highest risk score
      const sorted = [...currentRepo.dependencies].sort((a, b) => b.riskScore - a.riskScore);
      setSelectedPkg(sorted[0].name);
    } else {
      setSelectedPkg('anthropic');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepoId || !selectedPkg) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: selectedRepoId,
          packageName: selectedPkg,
          ref,
          model: selectedModel,
          cmd: smokeCmd ? [smokeCmd] : [],
        }),
      });
      const data = await res.json();
      if (data.data && data.data.id) {
        router.push(`/runs/${data.data.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-epilogue font-black text-3xl sm:text-4xl text-[#080909]">
          New Dependency Exit Analysis
        </h1>
        <p className="text-sm text-[#080909]/70 font-sans mt-1">
          Configure sandbox pipeline to map footprints, cross-examine AI claims, and apply verified patches.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#080909]/15 shadow-sm p-8 space-y-8">
        {/* Step 1: Repository & Ref */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-[#080909] text-white text-xs font-mono font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="font-epilogue font-bold text-lg text-[#080909]">Select Target Repository &amp; Ref</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-mono font-semibold text-gray-700">Repository</label>
              <select
                value={selectedRepoId}
                onChange={(e) => {
                  setSelectedRepoId(e.target.value);
                  setSelectedPkg('');
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white font-mono focus:ring-2 focus:ring-violet-600 focus:outline-none"
              >
                {repos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fullName} ({r.dependencies.length} deps)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono font-semibold text-gray-700">Git Ref / Branch</label>
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-violet-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Target Dependency */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#080909] text-white text-xs font-mono font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="font-epilogue font-bold text-lg text-[#080909]">Choose Risky Dependency to Exit</h2>
            </div>
            <button
              type="button"
              onClick={handleSuggest}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-xs font-mono font-bold hover:bg-violet-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Suggest Riskiest</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold text-gray-700">Dependency Package Name</label>
            <input
              type="text"
              required
              placeholder="e.g. anthropic, pyyaml, requests, left-pad"
              value={selectedPkg}
              onChange={(e) => setSelectedPkg(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-violet-600 focus:outline-none"
            />
            {currentRepo && currentRepo.dependencies.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-xs text-gray-500 font-mono">Found in manifests:</span>
                {currentRepo.dependencies.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => setSelectedPkg(d.name)}
                    className={`text-xs font-mono px-2 py-0.5 rounded border transition-colors ${
                      selectedPkg === d.name
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {d.name} (Risk: {d.riskScore})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Model Gateway */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-[#080909] text-white text-xs font-mono font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="font-epilogue font-bold text-lg text-[#080909]">Open-Weight AI Model Gateway</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'qwen2.5-coder:7b', label: 'Qwen 2.5 Coder 7B (Ollama)', desc: 'Local open-weight verified model' },
              { id: 'qwen2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B', desc: 'Optimal AST & structured output' },
              { id: 'deepseek-coder-v2-lite', label: 'DeepSeek Coder V2', desc: 'High accuracy refactoring' },
              { id: 'llama-3.1-70b-instruct', label: 'Llama 3.1 70B', desc: 'Broad open-weight reasoning' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedModel === m.id
                    ? 'border-violet-600 bg-violet-50/50 ring-1 ring-violet-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#080909]">{m.label}</span>
                  {selectedModel === m.id && <Check className="w-4 h-4 text-violet-600" />}
                </div>
                <p className="text-[11px] text-gray-500 font-sans">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Optional Verification Smoke Command */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-[#080909] text-white text-xs font-mono font-bold flex items-center justify-center">
              4
            </span>
            <h2 className="font-epilogue font-bold text-lg text-[#080909]">Custom Smoke Verification Command</h2>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono font-semibold text-gray-700">
              Optional Extra Command (executed in baseline &amp; after worktree)
            </label>
            <input
              type="text"
              placeholder="e.g. curl -f http://127.0.0.1:8000/api/health or python -c 'import agent; agent.run()'"
              value={smokeCmd}
              onChange={(e) => setSmokeCmd(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-violet-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={submitting || !selectedPkg}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#080909] text-white text-sm font-semibold uppercase tracking-wider hover:bg-violet-950 transition-all shadow-md disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{submitting ? 'Dispatching Sandbox...' : 'Run Pipeline'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center font-mono text-sm text-[#080909]/60">
          Loading wizard...
        </div>
      }
    >
      <NewAnalysisContent />
    </Suspense>
  );
}

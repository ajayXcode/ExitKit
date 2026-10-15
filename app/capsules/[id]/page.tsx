'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Download,
  Share2,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  FileCode,
  Terminal,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react';
import { Capsule } from '@/lib/models/types';

export default function CapsuleDetailPage({ params }: { params: { id: string } }) {
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedVerifyCmd, setCopiedVerifyCmd] = useState(false);

  useEffect(() => {
    fetch(`/api/capsules/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setCapsule(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/capsules/${params.id}/verify`, { method: 'POST' });
      const data = await res.json();
      setVerifyResult(data.details || (data.ok ? 'Verified successfully' : 'Verification failed'));
    } catch {
      setVerifyResult('Verification check error');
    } finally {
      setVerifying(false);
    }
  };

  const handleShare = async () => {
    try {
      const res = await fetch(`/api/capsules/${params.id}/share`, { method: 'POST' });
      const data = await res.json();
      if (data.shareUrl) {
        setShareUrl(data.shareUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadJSON = () => {
    if (!capsule) return;
    const blob = new Blob([JSON.stringify(capsule, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capsule-${capsule.dependency.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMD = () => {
    if (!capsule) return;
    const md = `# Dependency Exit Capsule: ${capsule.dependency.name}\n\nRepository: \`${capsule.repository.name}\` at commit \`${capsule.repository.commit}\`\nStatus: ${capsule.proposed_changes.status}\nExit Difficulty: ${capsule.footprint.exit_difficulty}/10\n\n## Maintenance Problem\n${capsule.maintenance_problem.text}\n\n## Claims Accuracy\nTotal: ${capsule.ai_analysis.accuracy.total}, Confirmed: ${capsule.ai_analysis.accuracy.confirmed}, Refuted: ${capsule.ai_analysis.accuracy.refuted}\n\n## Diff\n\`\`\`diff\n${capsule.proposed_changes.diff}\n\`\`\`\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capsule-${capsule.dependency.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !capsule) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center font-mono text-sm text-[#080909]/60">
        Loading capsule...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/capsules"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-600 hover:text-[#080909]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Capsules</span>
        </Link>
      </div>

      {/* Main Capsule Header Card */}
      <div className="bg-white rounded-2xl border border-[#080909]/15 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-gray-100 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-gray-500">{capsule.id}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                STATUS: {capsule.proposed_changes.status.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold badge-observed">
                SCHEMA: {capsule.schema_version}
              </span>
            </div>

            <h1 className="font-epilogue font-black text-3xl sm:text-4xl text-[#080909]">
              Dependency Exit Capsule: <span className="text-violet-600">{capsule.dependency.name}</span>
            </h1>

            <p className="font-mono text-xs text-gray-600">
              Repository: <strong>{capsule.repository.name}</strong> • Commit: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{capsule.repository.commit.slice(0, 10)}</code> • Generated on {new Date(capsule.generated_at).toLocaleString()}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#080909] text-white text-xs font-semibold uppercase tracking-wider hover:bg-violet-950 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Verifying...' : 'Verify Now'}</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 text-[#080909] text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-[#080909] text-xs font-semibold hover:bg-gray-50 transition-colors"
              title="Download JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={handleDownloadMD}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-[#080909] text-xs font-semibold hover:bg-gray-50 transition-colors"
              title="Download Markdown"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>MD</span>
            </button>
          </div>
        </div>

        {/* Verify Result Toast */}
        {verifyResult && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between">
            <span>{verifyResult}</span>
            <button onClick={() => setVerifyResult(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Share Link Modal/Banner */}
        {shareUrl && (
          <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-violet-900">
                Public Share Link Generated (30-day read-only access)
              </span>
              <button onClick={() => setShareUrl(null)} className="text-xs font-bold text-violet-700">✕</button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-violet-300 rounded-md select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setCopiedShare(true);
                  setTimeout(() => setCopiedShare(false), 2000);
                }}
                className="px-3 py-1.5 bg-violet-700 text-white rounded-md text-xs font-semibold hover:bg-violet-800"
              >
                {copiedShare ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* CLI Re-run Command Bar */}
        <div className="bg-[#080909] text-white p-3 rounded-xl flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 overflow-x-auto text-emerald-400">
            <span className="text-gray-500">$</span>
            <span>exitkit verify {capsule.id}.json</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`exitkit verify ${capsule.id}.json`);
              setCopiedVerifyCmd(true);
              setTimeout(() => setCopiedVerifyCmd(false), 2000);
            }}
            className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white"
          >
            {copiedVerifyCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Maintenance Problem Statement */}
        <div className="space-y-2 bg-[#f7f8fa] p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded badge-observed">
              [{capsule.maintenance_problem.tag}]
            </span>
            <span className="text-xs font-mono font-bold text-gray-600">Maintenance Problem</span>
          </div>
          <p className="text-sm text-[#080909] font-sans leading-relaxed">
            {capsule.maintenance_problem.text}
          </p>
        </div>

        {/* Risk Indicators */}
        <div className="space-y-2">
          <h2 className="font-epilogue font-bold text-sm text-[#080909]">Observed Risk Indicators</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {capsule.risk_indicators.map((ind, i) => (
              <div key={i} className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded badge-observed">
                    [{ind.tag}]
                  </span>
                  <span className="text-xs font-mono font-semibold text-rose-800">{ind.id}</span>
                </div>
                <p className="text-xs text-rose-900 font-sans">{ind.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Exit Footprint Map */}
        <div className="space-y-3 bg-violet-50/40 p-5 rounded-xl border border-violet-100">
          <div className="flex items-center justify-between">
            <h2 className="font-epilogue font-bold text-base text-[#080909]">
              Exit Footprint Map
            </h2>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-violet-800">
                Exit Difficulty: {capsule.footprint.exit_difficulty}/10
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center font-mono text-xs">
            <div className="p-3 bg-white rounded-lg border border-violet-100">
              <span className="block text-gray-500">Distinct Symbols</span>
              <span className="font-bold text-lg text-[#080909]">{capsule.footprint.symbols.length}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-violet-100">
              <span className="block text-gray-500">Call Sites</span>
              <span className="font-bold text-lg text-[#080909]">{capsule.footprint.call_sites}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-violet-100">
              <span className="block text-gray-500">Affected Files</span>
              <span className="font-bold text-lg text-[#080909]">{capsule.footprint.files.length}</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-gray-500 text-center">
            Formula: <code>{capsule.footprint.formula}</code>
          </div>
        </div>
      </div>

      {/* Claim Ledger Section */}
      <div className="bg-white rounded-2xl border border-[#080909]/15 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded badge-ai">
                [{capsule.ai_analysis.tag}]
              </span>
              <h2 className="font-epilogue font-black text-2xl text-[#080909]">
                Claim Ledger
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">
              Model: {capsule.ai_analysis.model} • Status: {capsule.ai_analysis.status}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-full verdict-confirmed font-semibold">
              {capsule.ai_analysis.accuracy.confirmed} Confirmed
            </span>
            <span className="px-2.5 py-1 rounded-full verdict-refuted font-semibold">
              {capsule.ai_analysis.accuracy.refuted} Refuted
            </span>
            <span className="px-2.5 py-1 rounded-full verdict-unverifiable font-semibold">
              {capsule.ai_analysis.accuracy.unverifiable} Unverifiable
            </span>
          </div>
        </div>

        {/* Plan from model */}
        {capsule.ai_analysis.plan.length > 0 && (
          <div className="space-y-2 bg-[#f7f8fa] p-4 rounded-xl border border-gray-100">
            <span className="text-xs font-mono font-bold text-gray-600 block">
              Migration Plan Proposed by Model:
            </span>
            <ul className="list-decimal list-inside space-y-1 text-xs text-[#080909]/80 font-sans">
              {capsule.ai_analysis.plan.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Claims Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-mono text-gray-500">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">AI Statement</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Verifier Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {capsule.ai_analysis.claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs font-bold text-gray-500">{claim.id}</td>
                  <td className="py-3 px-3 text-sm text-[#080909] font-medium">{claim.statement || claim.text}</td>
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
                  <td className="py-3 px-3 font-mono text-xs text-gray-600 truncate max-w-sm">
                    {JSON.stringify(claim.evidence[0] || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proposed Patch Diff */}
      <div className="bg-white rounded-2xl border border-[#080909]/15 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded badge-ai">
                [{capsule.proposed_changes.diff_tag}]
              </span>
              <h2 className="font-epilogue font-bold text-xl text-[#080909]">
                Proposed Migration Patch
              </h2>
            </div>
            <p className="text-xs font-mono text-gray-500">
              Target Branch: <code>{capsule.proposed_changes.branch}</code> • Status: <strong>{capsule.proposed_changes.status}</strong>
            </p>
          </div>
        </div>

        <div className="bg-[#080909] rounded-xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
          <pre>{capsule.proposed_changes.diff || '# No diff was proposed'}</pre>
        </div>

        {capsule.proposed_changes.apply_commands.length > 0 && (
          <div className="pt-2 text-xs font-mono text-gray-600 space-y-1">
            <span className="font-bold">Worktree Apply Commands:</span>
            {capsule.proposed_changes.apply_commands.map((cmd, i) => (
              <div key={i} className="text-gray-500"><code>$ {cmd}</code></div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Baseline vs After Checks */}
      <div className="bg-white rounded-2xl border border-[#080909]/15 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded badge-executed">
              [EXECUTED]
            </span>
            <h2 className="font-epilogue font-bold text-xl text-[#080909]">
              Deterministic Verification Checks
            </h2>
          </div>
          <span className="text-xs font-mono text-gray-500">
            {capsule.verification.comparison_method}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-mono text-gray-500">
                <th className="py-2.5 px-3">Check ID</th>
                <th className="py-2.5 px-3">Baseline</th>
                <th className="py-2.5 px-3">After Worktree</th>
                <th className="py-2.5 px-3">Regression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-xs">
              {capsule.verification.comparison.map((comp) => (
                <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-[#080909]">{comp.id}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-semibold ${comp.baseline === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                      {comp.baseline}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-semibold ${comp.after === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                      {comp.after}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {comp.regression ? (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">YES</span>
                    ) : (
                      <span className="text-gray-400">no</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gaps and Unresolved */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#080909]/15 shadow-sm p-6 space-y-3">
          <h2 className="font-epilogue font-bold text-base text-[#080909]">
            Maintenance &amp; Compatibility Gaps ({capsule.gaps.length})
          </h2>
          {capsule.gaps.length === 0 ? (
            <p className="text-xs text-gray-500 font-mono">No gaps recorded</p>
          ) : (
            <ul className="space-y-2">
              {capsule.gaps.map((g, i) => (
                <li key={i} className="text-xs text-[#080909]/80 font-sans flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{g.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#080909]/15 shadow-sm p-6 space-y-3">
          <h2 className="font-epilogue font-bold text-base text-[#080909]">
            Unresolved Items &amp; Limitations ({capsule.unresolved.length})
          </h2>
          {capsule.unresolved.length === 0 ? (
            <p className="text-xs text-gray-500 font-mono">None recorded</p>
          ) : (
            <ul className="space-y-2">
              {capsule.unresolved.map((u, i) => (
                <li key={i} className="text-xs text-[#080909]/80 font-sans flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{u.text}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="pt-2 text-[11px] text-gray-500 italic border-t border-gray-100">
            {capsule.out_of_scope}
          </div>
        </div>
      </div>
    </div>
  );
}

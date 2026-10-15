'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Capsule } from '@/lib/models/types';

export default function SharedCapsulePage({ params }: { params: { token: string } }) {
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [shareInfo, setShareInfo] = useState<{ expiresAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setCapsule(data.data);
          setShareInfo(data.shareInfo);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-mono text-sm text-[#080909]/60">
        Loading shared capsule...
      </div>
    );
  }

  if (error || !capsule) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="font-epilogue font-bold text-xl text-rose-700">Link Expired or Invalid</div>
        <p className="text-xs font-mono text-gray-500">
          This shared Dependency Exit Capsule link has expired or was revoked.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#080909] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Public Share Banner */}
      <div className="p-4 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-between text-xs font-mono text-violet-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-700" />
          <span>PUBLIC VERIFIED CAPSULE VIEW • Read-Only Auditor Mode</span>
        </div>
        {shareInfo && (
          <span className="text-violet-700">
            Expires: {new Date(shareInfo.expiresAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Capsule Summary Card */}
      <div className="bg-white rounded-2xl border border-[#080909]/15 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              STATUS: {capsule.proposed_changes.status.toUpperCase()}
            </span>
            <h1 className="font-epilogue font-black text-3xl text-[#080909]">
              Dependency Exit: <span className="text-violet-600">{capsule.dependency.name}</span>
            </h1>
            <p className="font-mono text-xs text-gray-500">
              Repo: {capsule.repository.name} • Spec: {capsule.dependency.spec} • Generated: {new Date(capsule.generated_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-gray-500 block">Exit Difficulty</span>
            <span className="font-epilogue font-black text-3xl text-violet-700">
              {capsule.footprint.exit_difficulty}/10
            </span>
          </div>
        </div>

        {/* Maintenance Problem */}
        <div className="bg-[#f7f8fa] p-4 rounded-xl border border-gray-100 space-y-1">
          <span className="text-xs font-mono font-bold text-gray-500">[OBSERVED] Problem:</span>
          <p className="text-sm font-sans text-[#080909] leading-relaxed">
            {capsule.maintenance_problem.text}
          </p>
        </div>

        {/* Claim Ledger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-epilogue font-bold text-lg text-[#080909]">
              Cross-Examined AI Claim Ledger
            </h2>
            <div className="flex gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded verdict-confirmed font-semibold">
                {capsule.ai_analysis.accuracy.confirmed} Confirmed
              </span>
              <span className="px-2 py-0.5 rounded verdict-refuted font-semibold">
                {capsule.ai_analysis.accuracy.refuted} Refuted
              </span>
              <span className="px-2 py-0.5 rounded verdict-unverifiable font-semibold">
                {capsule.ai_analysis.accuracy.unverifiable} Unverifiable
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-mono text-gray-500 bg-[#f7f8fa]">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Statement</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Code Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {capsule.ai_analysis.claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs font-bold text-gray-500">{claim.id}</td>
                    <td className="py-3 px-3 text-sm text-[#080909]">{claim.text}</td>
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
                      {JSON.stringify(claim.evidence[0] || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Patch Diff */}
        <div className="space-y-2">
          <h2 className="font-epilogue font-bold text-sm text-[#080909]">Proposed Verified Worktree Patch</h2>
          <div className="p-4 bg-[#080909] text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto shadow-inner">
            <pre>{capsule.proposed_changes.diff}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}


export type ProvenanceTag = 'OBSERVED' | 'EXECUTED' | 'AI-GENERATED';
export type ClaimVerdict = 'CONFIRMED' | 'REFUTED' | 'UNVERIFIABLE';
export type CheckStatus = 'passed' | 'failed' | 'not_run' | 'absent';
export type PatchState = 'proposed' | 'applied' | 'verified';

export interface User {
  id: string;
  name: string;
  email: string;
  githubUsername?: string;
  avatarUrl?: string;
  role: 'owner' | 'maintainer' | 'viewer';
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface DependencySignal {
  id: string;
  tag: 'OBSERVED';
  text: string;
  evidence: Array<{ file?: string; line?: number; spec?: string }>;
}

export interface Dependency {
  id: string;
  name: string;
  ecosystem: 'pip' | 'npm';
  spec: string;
  manifestFile?: string;
  manifestLine?: number;
  riskScore: number;
  exitDifficulty: number;
  symbolsCount: number;
  callSitesCount: number;
  filesCount: number;
  signals: DependencySignal[];
}

export interface Repository {
  id: string;
  orgId: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  cloneUrl: string;
  description: string;
  lastScannedAt?: string;
  dependencies: Dependency[];
}

export interface Claim {
  id: string;
  tag: 'AI-GENERATED';
  source: 'ai';
  text?: string;
  statement?: string;
  type: string;
  params: Record<string, unknown>;
  verdict: ClaimVerdict;
  verdictSource: string;
  evidence: Array<Record<string, unknown>>;
}

export interface CheckEntry {
  tag: ProvenanceTag;
  source: string;
  id: string;
  status: CheckStatus;
  cmd?: string;
  exit?: number;
  seconds?: number;
  reason?: string;
  tail?: string;
  sha256?: string;
  normalized_sha256?: string;
}

export interface CheckComparison {
  id: string;
  baseline: CheckStatus;
  after: CheckStatus;
  regression: boolean;
}

export interface VerificationSummary {
  baseline: CheckEntry[];
  after: CheckEntry[];
  passed: string[];
  failed: string[];
  not_run: Array<{ id: string; reason?: string }>;
  comparison: CheckComparison[];
  comparison_method: string;
}

export interface Footprint {
  symbols: string[];
  call_sites: number;
  files: string[];
  exit_difficulty: number;
  formula: string;
}

export interface ProposedChanges {
  diff_tag: 'AI-GENERATED';
  status: PatchState;
  diff: string;
  branch: string | null;
  worktree: string | null;
  error: string | null;
  apply_commands: string[];
}

export interface Capsule {
  id: string;
  runId: string;
  repoId: string;
  schema_version: '1.0';
  generated_at: string;
  tool: {
    name: 'exitkit';
    version: string;
  };
  repository: {
    name: string;
    path?: string;
    commit: string;
    dirty: boolean;
  };
  dependency: {
    name: string;
    ecosystem: 'pip' | 'npm';
    spec: string;
    manifest: string | null;
  };
  maintenance_problem: {
    tag: 'OBSERVED';
    source: string;
    text: string;
  };
  risk_indicators: Array<{
    tag: 'OBSERVED';
    source: string;
    id: string;
    text: string;
    evidence?: Array<{ file?: string; line?: number }>;
  }>;
  usage_locations: Array<{
    tag: 'OBSERVED';
    source: string;
    file: string;
    line: number;
    text: string;
  }>;
  footprint: Footprint;
  ai_analysis: {
    tag: 'AI-GENERATED';
    source: string;
    status: 'ok' | 'not_run' | 'failed';
    model: string | null;
    reason: string | null;
    plan: string[];
    claims: Claim[];
    accuracy: {
      total: number;
      confirmed: number;
      refuted: number;
      unverifiable: number;
    };
  };
  proposed_changes: ProposedChanges;
  verification: VerificationSummary;
  gaps: Array<{ tag: ProvenanceTag; source: string; text: string }>;
  unresolved: Array<{ tag: ProvenanceTag; source: string; text: string }>;
  out_of_scope: string;
}

export type PipelineStep =
  | '1/9 scan'
  | '2/9 risk'
  | '3/9 select'
  | '4/9 usages'
  | '5/9 baseline'
  | '6/9 ai_analysis'
  | '7/9 claim_ledger'
  | '8/9 patch_worktree'
  | '9/9 capsule_ready';

export interface AnalysisRun {
  id: string;
  repoId: string;
  repoFullName: string;
  ref: string;
  packageName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentStep: PipelineStep;
  progressPercent: number;
  model: string;
  logs: string[];
  capsuleId?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface ShareLink {
  id: string;
  capsuleId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
}

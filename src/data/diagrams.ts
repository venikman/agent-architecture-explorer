export type NodeType = 'llm' | 'io' | 'tool' | 'danger';

export interface DiagramNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  w?: number;
  h?: number;
  description?: string;
}

export interface DiagramArrow {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  curve?: 'straight' | 'curve-down' | 'curve-up';
}

export interface DiagramView {
  id: string;
  title: string;
  subtitle: string;
  nodes: DiagramNode[];
  arrows: DiagramArrow[];
  healthcareNodes?: DiagramNode[];
  healthcareArrows?: DiagramArrow[];
  healthcareNote?: string;
}

export const NODE_COLORS = {
  llm: { fill: '#E6F4E6', border: '#8BC78B', text: '#2E7D32', glow: '#8BC78B55' },
  io: { fill: '#FDE8E4', border: '#F4A49A', text: '#C65D3E', glow: '#F4A49A55' },
  tool: { fill: '#E8E8F8', border: '#9898D0', text: '#5050A0', glow: '#9898D055' },
  danger: { fill: '#FFEBEE', border: '#EF9A9A', text: '#C62828', glow: '#EF9A9A55' },
};

export const ARROW_COLOR = '#9E9E9E';

// ────────────────────────────────────────
// Layout strategy: base flow at y~100-250, tools at y~300-370
// Healthcare nodes go in a clearly separated row at y~460+
// with a visual gap between the two layers
// ────────────────────────────────────────

export const diagrams: DiagramView[] = [
  {
    id: 'augmented-llm',
    title: 'The Augmented LLM',
    subtitle: 'The basic building block of agentic systems',
    nodes: [
      { id: 'in', label: 'In', type: 'io', x: 80, y: 130, w: 80, h: 56 },
      { id: 'llm', label: 'LLM', type: 'llm', x: 300, y: 105, w: 200, h: 100, description: 'Large Language Model — the reasoning core that processes inputs and generates outputs' },
      { id: 'out', label: 'Out', type: 'io', x: 640, y: 130, w: 80, h: 56 },
      { id: 'retrieval', label: 'Retrieval', type: 'tool', x: 190, y: 280, w: 140, h: 60, description: 'Fetches relevant context from knowledge bases' },
      { id: 'tools', label: 'Tools', type: 'tool', x: 355, y: 280, w: 120, h: 60, description: 'External capabilities — APIs, code execution' },
      { id: 'memory', label: 'Memory', type: 'tool', x: 500, y: 280, w: 130, h: 60, description: 'Conversation history and long-term knowledge' },
    ],
    arrows: [
      { from: 'in', to: 'llm' },
      { from: 'llm', to: 'out' },
      { from: 'llm', to: 'retrieval', dashed: true },
      { from: 'retrieval', to: 'llm', dashed: true },
      { from: 'llm', to: 'tools', dashed: true },
      { from: 'tools', to: 'llm', dashed: true },
      { from: 'llm', to: 'memory', dashed: true },
      { from: 'memory', to: 'llm', dashed: true },
    ],
    healthcareNodes: [
      { id: 'phi', label: 'PHI Sanitizer', type: 'danger', x: 100, y: 440, w: 150, h: 60, description: 'REQUIRED: De-identifies patient data before LLM processing. HIPAA Safe Harbor.' },
      { id: 'hitl', label: 'HITL Gate', type: 'danger', x: 280, y: 440, w: 130, h: 60, description: 'REQUIRED: Human must approve all clinical outputs. TX SB 1188, IL WOPRA.' },
      { id: 'audit', label: 'Audit Trail', type: 'danger', x: 440, y: 440, w: 135, h: 60, description: 'REQUIRED: Immutable log of every LLM interaction. HIPAA 2025 Security Rule.' },
      { id: 'encrypt', label: 'Encryption', type: 'danger', x: 605, y: 440, w: 125, h: 60, description: 'REQUIRED: AES-256 at rest, TLS in transit for all data paths.' },
    ],
    healthcareArrows: [
      { from: 'in', to: 'phi', dashed: true },
      { from: 'phi', to: 'llm', label: 'Sanitized' },
      { from: 'llm', to: 'hitl', dashed: true },
      { from: 'hitl', to: 'out', label: 'Approved' },
      { from: 'llm', to: 'audit', dashed: true },
      { from: 'tools', to: 'encrypt', dashed: true },
    ],
    healthcareNote: 'PHI Sanitizer intercepts input. HITL Gate blocks output until human approves. All interactions logged and encrypted.',
  },
  {
    id: 'prompt-chaining',
    title: 'Prompt Chaining',
    subtitle: 'Sequential LLM calls where each output feeds the next',
    nodes: [
      { id: 'in', label: 'In', type: 'io', x: 30, y: 130, w: 75, h: 56 },
      { id: 'llm1', label: 'LLM Call 1', type: 'llm', x: 170, y: 110, w: 160, h: 85, description: 'First processing step — initial analysis' },
      { id: 'gate', label: 'Gate', type: 'tool', x: 400, y: 125, w: 100, h: 60, description: 'Quality gate — evaluates output' },
      { id: 'llm2', label: 'LLM Call 2', type: 'llm', x: 570, y: 110, w: 160, h: 85, description: 'Second processing step — refinement' },
      { id: 'out', label: 'Out', type: 'io', x: 800, y: 130, w: 75, h: 56 },
      { id: 'exit', label: 'Exit', type: 'io', x: 405, y: 260, w: 80, h: 48 },
    ],
    arrows: [
      { from: 'in', to: 'llm1' },
      { from: 'llm1', to: 'gate', label: 'Output 1' },
      { from: 'gate', to: 'llm2', label: 'Pass' },
      { from: 'llm2', to: 'out', label: 'Output 2' },
      { from: 'gate', to: 'exit', label: 'Fail', dashed: true },
    ],
    healthcareNodes: [
      { id: 'audit1', label: 'Audit Step 1', type: 'danger', x: 170, y: 400, w: 140, h: 55, description: 'REQUIRED: Each LLM step logged individually.' },
      { id: 'audit2', label: 'Audit Step 2', type: 'danger', x: 400, y: 400, w: 140, h: 55, description: 'REQUIRED: Full chain must be reconstructable.' },
      { id: 'hitl', label: 'HITL Review', type: 'danger', x: 630, y: 400, w: 140, h: 55, description: 'REQUIRED: Clinician reviews final output.' },
    ],
    healthcareArrows: [
      { from: 'llm1', to: 'audit1', dashed: true },
      { from: 'llm2', to: 'audit2', dashed: true },
      { from: 'llm2', to: 'hitl', dashed: true },
      { from: 'hitl', to: 'out', label: 'Approved' },
    ],
    healthcareNote: 'Every step in the chain audited individually. Human review mandatory before clinical output.',
  },
  {
    id: 'routing',
    title: 'Routing',
    subtitle: 'Classify input and direct to specialized handlers',
    nodes: [
      { id: 'in', label: 'In', type: 'io', x: 40, y: 165, w: 75, h: 56 },
      { id: 'router', label: 'LLM Router', type: 'llm', x: 190, y: 130, w: 170, h: 95, description: 'Classifies input and routes to specialist' },
      { id: 'llm1', label: 'LLM Call 1', type: 'llm', x: 500, y: 50, w: 150, h: 70 },
      { id: 'llm2', label: 'LLM Call 2', type: 'llm', x: 500, y: 155, w: 150, h: 70 },
      { id: 'llm3', label: 'LLM Call 3', type: 'llm', x: 500, y: 260, w: 150, h: 70 },
      { id: 'out', label: 'Out', type: 'io', x: 760, y: 165, w: 75, h: 56 },
    ],
    arrows: [
      { from: 'in', to: 'router' },
      { from: 'router', to: 'llm1', dashed: true },
      { from: 'router', to: 'llm2', dashed: true },
      { from: 'router', to: 'llm3', dashed: true },
      { from: 'llm1', to: 'out', dashed: true },
      { from: 'llm2', to: 'out' },
      { from: 'llm3', to: 'out', dashed: true },
    ],
    healthcareNodes: [
      { id: 'phi', label: 'PHI Filter', type: 'danger', x: 100, y: 430, w: 130, h: 55, description: 'REQUIRED: Strips PHI before routing to prevent data leakage across specialty boundaries.' },
      { id: 'rbac', label: 'RBAC', type: 'danger', x: 280, y: 430, w: 120, h: 55, description: 'REQUIRED: Each specialist only gets minimum necessary data.' },
      { id: 'hitl', label: 'HITL Gate', type: 'danger', x: 450, y: 430, w: 130, h: 55, description: 'REQUIRED: Clinical review before routed output reaches patient.' },
      { id: 'audit', label: 'Route Audit', type: 'danger', x: 630, y: 430, w: 130, h: 55, description: 'REQUIRED: Log which route was chosen and why.' },
    ],
    healthcareArrows: [
      { from: 'in', to: 'phi', dashed: true },
      { from: 'router', to: 'rbac', dashed: true },
      { from: 'out', to: 'hitl', dashed: true },
      { from: 'router', to: 'audit', dashed: true },
    ],
    healthcareNote: 'PHI filtered before routing. RBAC ensures minimum necessary data per specialist. All routing decisions audited.',
  },
  {
    id: 'parallelization',
    title: 'Parallelization',
    subtitle: 'Multiple LLMs work simultaneously, results aggregated',
    nodes: [
      { id: 'in', label: 'In', type: 'io', x: 40, y: 165, w: 75, h: 56 },
      { id: 'llm1', label: 'LLM Call 1', type: 'llm', x: 230, y: 50, w: 150, h: 70 },
      { id: 'llm2', label: 'LLM Call 2', type: 'llm', x: 230, y: 155, w: 150, h: 70 },
      { id: 'llm3', label: 'LLM Call 3', type: 'llm', x: 230, y: 260, w: 150, h: 70 },
      { id: 'agg', label: 'Aggregator', type: 'tool', x: 510, y: 155, w: 145, h: 70, description: 'Combines parallel outputs into a unified result' },
      { id: 'out', label: 'Out', type: 'io', x: 760, y: 165, w: 75, h: 56 },
    ],
    arrows: [
      { from: 'in', to: 'llm1' },
      { from: 'in', to: 'llm2' },
      { from: 'in', to: 'llm3' },
      { from: 'llm1', to: 'agg' },
      { from: 'llm2', to: 'agg' },
      { from: 'llm3', to: 'agg' },
      { from: 'agg', to: 'out' },
    ],
    healthcareNodes: [
      { id: 'bias', label: 'Bias Check', type: 'danger', x: 150, y: 430, w: 135, h: 55, description: 'REQUIRED: Aggregated results checked for demographic bias. FDA diverse population requirement.' },
      { id: 'hitl', label: 'HITL Gate', type: 'danger', x: 340, y: 430, w: 130, h: 55, description: 'REQUIRED: Clinician verifies aggregated recommendation.' },
      { id: 'audit', label: 'Path Audit', type: 'danger', x: 530, y: 430, w: 130, h: 55, description: 'REQUIRED: All parallel paths logged independently for full reconstruction.' },
    ],
    healthcareArrows: [
      { from: 'agg', to: 'bias', dashed: true },
      { from: 'agg', to: 'hitl', dashed: true },
      { from: 'hitl', to: 'out', label: 'Approved' },
      { from: 'agg', to: 'audit', dashed: true },
    ],
    healthcareNote: 'Parallel outputs bias-checked when aggregated. Each path audited independently. Clinician approves final result.',
  },
  {
    id: 'orchestrator',
    title: 'Orchestrator-Workers',
    subtitle: 'Central LLM dynamically delegates to workers',
    nodes: [
      { id: 'in', label: 'In', type: 'io', x: 30, y: 165, w: 75, h: 56 },
      { id: 'orch', label: 'Orchestrator', type: 'llm', x: 170, y: 125, w: 170, h: 95, description: 'Central coordinator that delegates dynamically' },
      { id: 'w1', label: 'Worker 1', type: 'llm', x: 470, y: 50, w: 140, h: 65 },
      { id: 'w2', label: 'Worker 2', type: 'llm', x: 470, y: 150, w: 140, h: 65 },
      { id: 'w3', label: 'Worker 3', type: 'llm', x: 470, y: 250, w: 140, h: 65 },
      { id: 'synth', label: 'Synthesizer', type: 'llm', x: 710, y: 135, w: 150, h: 80, description: 'Combines worker outputs into final response' },
      { id: 'out', label: 'Out', type: 'io', x: 940, y: 150, w: 75, h: 56 },
    ],
    arrows: [
      { from: 'in', to: 'orch' },
      { from: 'orch', to: 'w1', dashed: true },
      { from: 'orch', to: 'w2', dashed: true },
      { from: 'orch', to: 'w3', dashed: true },
      { from: 'w1', to: 'synth', dashed: true },
      { from: 'w2', to: 'synth', dashed: true },
      { from: 'w3', to: 'synth', dashed: true },
      { from: 'synth', to: 'out' },
    ],
    healthcareNodes: [
      { id: 'compliance', label: 'Compliance\nCo-pilot', type: 'danger', x: 120, y: 420, w: 150, h: 55, description: 'REQUIRED: Validates every delegation against compliance rules.' },
      { id: 'phi-bound', label: 'PHI Boundary', type: 'danger', x: 320, y: 420, w: 145, h: 55, description: 'REQUIRED: Each worker only receives minimum necessary data.' },
      { id: 'hitl', label: 'HITL Gate', type: 'danger', x: 520, y: 420, w: 130, h: 55, description: 'REQUIRED: Final synthesized output requires clinician approval.' },
      { id: 'audit', label: 'Delegation\nAudit', type: 'danger', x: 710, y: 420, w: 130, h: 55, description: 'REQUIRED: Every delegation logged with justification.' },
    ],
    healthcareArrows: [
      { from: 'orch', to: 'compliance', dashed: true },
      { from: 'orch', to: 'phi-bound', dashed: true },
      { from: 'synth', to: 'hitl', dashed: true },
      { from: 'hitl', to: 'out', label: 'Approved' },
      { from: 'orch', to: 'audit', dashed: true },
    ],
    healthcareNote: 'Compliance co-pilot validates delegations. PHI boundaries per worker. Clinician approves synthesized output.',
  },
  {
    id: 'evaluator',
    title: 'Evaluator-Optimizer',
    subtitle: 'Generate, evaluate, and refine in a feedback loop',
    nodes: [
      { id: 'in', label: 'In', type: 'io', x: 60, y: 140, w: 80, h: 56 },
      { id: 'gen', label: 'Generator', type: 'llm', x: 250, y: 110, w: 175, h: 95, description: 'Generates candidate solutions' },
      { id: 'eval', label: 'Evaluator', type: 'llm', x: 560, y: 110, w: 175, h: 95, description: 'Assesses quality against criteria' },
      { id: 'out', label: 'Out', type: 'io', x: 850, y: 140, w: 80, h: 56 },
    ],
    arrows: [
      { from: 'in', to: 'gen' },
      { from: 'gen', to: 'eval', label: 'Solution' },
      { from: 'eval', to: 'out', label: 'Accepted' },
      { from: 'eval', to: 'gen', label: 'Rejected', dashed: true, curve: 'curve-down' },
    ],
    healthcareNodes: [
      { id: 'guidelines', label: 'Clinical\nGuidelines', type: 'danger', x: 180, y: 400, w: 145, h: 55, description: 'REQUIRED: Evaluator checks against validated clinical guidelines, not just self-assessment.' },
      { id: 'loop-limit', label: 'Loop Limit', type: 'danger', x: 380, y: 400, w: 130, h: 55, description: 'REQUIRED: Max iteration count. Circuit breaker on feedback cycle.' },
      { id: 'hitl', label: 'HITL Gate', type: 'danger', x: 570, y: 400, w: 130, h: 55, description: 'REQUIRED: Even "accepted" outputs need clinician review.' },
    ],
    healthcareArrows: [
      { from: 'eval', to: 'guidelines', dashed: true },
      { from: 'gen', to: 'loop-limit', dashed: true },
      { from: 'eval', to: 'hitl', dashed: true },
      { from: 'hitl', to: 'out', label: 'Approved' },
    ],
    healthcareNote: 'Self-evaluation never sufficient for healthcare. External clinical guidelines mandatory. Feedback loops need circuit breakers.',
  },
  {
    id: 'autonomous',
    title: 'Autonomous Agent',
    subtitle: 'LLM operates in a loop with environment feedback',
    nodes: [
      { id: 'human', label: 'Human', type: 'io', x: 80, y: 50, w: 120, h: 56, description: 'Human operator providing instructions and oversight' },
      { id: 'llm', label: 'LLM Call', type: 'llm', x: 310, y: 100, w: 190, h: 95, description: 'Agent core — reasons and decides next action' },
      { id: 'env', label: 'Environment', type: 'io', x: 640, y: 50, w: 150, h: 56, description: 'External world — APIs, databases, file systems' },
      { id: 'stop', label: 'Stop', type: 'tool', x: 370, y: 270, w: 100, h: 55, description: 'Exit condition — task complete' },
    ],
    arrows: [
      { from: 'human', to: 'llm', dashed: true },
      { from: 'llm', to: 'env', label: 'Action' },
      { from: 'env', to: 'llm', label: 'Feedback', curve: 'curve-up' },
      { from: 'llm', to: 'stop', dashed: true },
    ],
    healthcareNodes: [
      { id: 'sandbox', label: 'Sandbox', type: 'danger', x: 100, y: 430, w: 130, h: 55, description: 'REQUIRED: All actions in isolated sandbox. No direct clinical system access.' },
      { id: 'hitl-loop', label: 'HITL Every\nN Steps', type: 'danger', x: 280, y: 430, w: 140, h: 55, description: 'REQUIRED: Pause for human review every N iterations. Unlimited autonomy not permitted.' },
      { id: 'killswitch', label: 'Kill Switch', type: 'danger', x: 470, y: 430, w: 130, h: 55, description: 'REQUIRED: Immediate halt. Accessible to any authorized clinician at any time.' },
      { id: 'audit', label: 'Action Audit', type: 'danger', x: 650, y: 430, w: 135, h: 55, description: 'REQUIRED: Every environment action logged with full context.' },
    ],
    healthcareArrows: [
      { from: 'llm', to: 'sandbox', dashed: true },
      { from: 'human', to: 'hitl-loop', dashed: true },
      { from: 'llm', to: 'killswitch', dashed: true },
      { from: 'env', to: 'audit', dashed: true },
    ],
    healthcareNote: 'Autonomous agents in healthcare MUST have sandboxed execution, periodic human checkpoints, and an immediate kill switch.',
  },
];

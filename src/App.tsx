import { motion } from 'motion/react';
import { DiagramCanvas } from '@/components/diagrams/DiagramCanvas';
import { diagrams, NODE_COLORS } from '@/data/diagrams';
import { useAppStore } from '@/stores/appStore';

const sectionMap = [
  { label: 'Workflow Patterns', ids: ['augmented-llm', 'prompt-chaining', 'routing', 'parallelization', 'orchestrator', 'evaluator'] },
  { label: 'Agent Patterns', ids: ['autonomous'] },
];

function Sidebar() {
  const { activeView, setActiveView, healthcareMode, toggleHealthcare } = useAppStore();

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen flex-shrink-0">
      {/* Header */}
      <div className="px-5 py-5 border-b border-border">
        <h1 className="text-sm font-semibold tracking-tight">Agent Architecture</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Interactive Pattern Explorer</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {sectionMap.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-5 mb-1.5">
              <span className="text-[10px] font-mono font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                {section.label}
              </span>
            </div>
            {section.ids.map((id) => {
              const d = diagrams.find(d => d.id === id);
              if (!d) return null;
              const isActive = activeView === id;
              const isHealthcare = id === 'healthcare';
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`w-full text-left px-5 py-2 text-[13px] transition-all duration-150 cursor-pointer flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <div
                    className="w-1.5 h-1.5 flex-shrink-0"
                    style={{
                      background: isHealthcare
                        ? NODE_COLORS.danger.text
                        : isActive ? NODE_COLORS.llm.text : '#d1d5db',
                    }}
                  />
                  {d.title}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Healthcare toggle */}
      <div className="px-5 py-3 border-t border-border">
        <button
          onClick={toggleHealthcare}
          className={`w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-medium transition-all duration-150 cursor-pointer border ${
            healthcareMode
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>{healthcareMode ? '🏥' : '⚙️'}</span>
            Healthcare Mode
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 ${
            healthcareMode ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
          }`}>
            {healthcareMode ? 'ON' : 'OFF'}
          </span>
        </button>
        {healthcareMode && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-[10px] text-destructive/70 mt-2 leading-relaxed"
          >
            Red nodes show non-negotiable components required for healthcare deployment.
          </motion.p>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-4 border-t border-border">
        <div className="text-[10px] font-mono font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">
          Legend
        </div>
        <div className="space-y-1.5">
          {([
            ['LLM', 'llm'],
            ['I/O & Human', 'io'],
            ['Tool / Utility', 'tool'],
            ['Non-Negotiable', 'danger'],
          ] as const).map(([label, type]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-3 border"
                style={{
                  background: NODE_COLORS[type].fill,
                  borderColor: NODE_COLORS[type].border,
                  borderRadius: type === 'io' ? '6px' : 0,
                }}
              />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#9E9E9E" strokeWidth="1.5" /></svg>
            <span className="text-[11px] text-muted-foreground">Definite flow</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#9E9E9E" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
            <span className="text-[11px] text-muted-foreground">Conditional</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MainCanvas() {
  const { activeView, healthcareMode } = useAppStore();
  const diagram = diagrams.find(d => d.id === activeView);
  if (!diagram) return null;

  return (
    <main className="flex-1 flex flex-col h-screen bg-background overflow-hidden">
      {/* Title bar */}
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div key={diagram.id}>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-2.5 mb-1">
              <div
                className="w-[3px] h-4"
                style={{
                  background: diagram.id === 'healthcare' ? NODE_COLORS.danger.text : NODE_COLORS.llm.text,
                }}
              />
              <h2 className="text-lg font-semibold tracking-tight">{diagram.title}</h2>
            </div>
            <p className="text-[13px] text-muted-foreground ml-[15px]">{diagram.subtitle}</p>
          </motion.div>
        </div>
        <div className="flex items-center gap-3">
          {healthcareMode && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] font-mono font-medium px-2 py-1 bg-destructive/10 text-destructive border border-destructive/20"
            >
              🏥 Healthcare constraints active
            </motion.span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            Click any node for details
          </span>
        </div>
      </div>

      {/* Diagram area */}
      <div className="flex-1 p-8 flex items-center justify-center" key={`${diagram.id}-${healthcareMode}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full relative"
        >
          <DiagramCanvas diagram={diagram} healthcareMode={healthcareMode} />
        </motion.div>
      </div>
    </main>
  );
}

export function App() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <MainCanvas />
    </div>
  );
}

export default App;

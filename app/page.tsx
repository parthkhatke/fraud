'use client';

import StatsPanel from '@/components/sidebar/StatsPanel';
import ProcessControls from '@/components/process/ProcessControls';
import ProcessFlowCanvas from '@/components/process/ProcessFlowCanvas';
import ProcessAlertModal from '@/components/process/ProcessAlertModal';
import KnowledgeGraphCanvas from '@/components/graph/KnowledgeGraphCanvas';
import KnowledgeDetailsPanel from '@/components/graph/KnowledgeDetailsPanel';
import PatternAnalysisModal from '@/components/process/PatternAnalysisModal';
import { useFraudSimulation } from '@/context/FraudSimulationContext';

export default function Home() {
  const { patternAnalysis } = useFraudSimulation();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Left stats sidebar */}
      <StatsPanel />

      {/* Main content */}
      <main className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        {/* Top process flow */}
        <section className="basis-1/2 min-h-[280px] rounded-xl bg-white shadow-md border border-slate-200 p-4 flex flex-col">
          <ProcessControls />
          <div className="flex-1 relative">
            <ProcessFlowCanvas />
          </div>
        </section>

        {/* Bottom knowledge graph */}
        <section className="basis-1/2 min-h-[280px] rounded-xl bg-white shadow-md border border-slate-200 p-4 flex gap-4">
          <div className="flex-1 relative">
            <KnowledgeGraphCanvas />
          </div>
          <KnowledgeDetailsPanel />
        </section>
      </main>

      {/* Modals */}
      <ProcessAlertModal />
      {patternAnalysis && <PatternAnalysisModal />}
    </div>
  );
}


'use client';

import StatsPanel from '@/components/sidebar/StatsPanel';
import MLMetricsSection from '@/components/sidebar/MLMetricsSection';
import ProcessControls from '@/components/process/ProcessControls';
import ProcessFlowCanvas from '@/components/process/ProcessFlowCanvas';
import ProcessAlertModal from '@/components/process/ProcessAlertModal';
import PatternAnalysisModal from '@/components/process/PatternAnalysisModal';
import POClustersPanel from '@/components/sidebar/POClustersPanel';
import { useFraudSimulation } from '@/context/FraudSimulationContext';

export default function Home() {
  const { patternAnalysis, sidePanelEntityType, closeSidePanel } = useFraudSimulation();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Top header with stats */}
      <StatsPanel />

      {/* Main content */}
      <main className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        {/* Process flow */}
        <section className="flex-1 min-h-[280px] rounded-xl bg-white shadow-md border border-slate-200 p-4 flex flex-col">
          <ProcessControls />
          <div className="flex-1 relative">
            <ProcessFlowCanvas />
          </div>
        </section>
      </main>

      {/* ML Metrics Section at bottom */}
      <MLMetricsSection />

      {/* Modals */}
      <ProcessAlertModal />
      {patternAnalysis && <PatternAnalysisModal />}

      {/* Side Panel */}
      {sidePanelEntityType && (
        <POClustersPanel 
          entityType={sidePanelEntityType} 
          onClose={closeSidePanel}
        />
      )}
    </div>
  );
}


'use client';

import { useFraudSimulation } from '@/context/FraudSimulationContext';

export default function ProcessControls() {
  const {
    simulationStatus,
    initializeSimulation,
    resumeSimulation,
    resetSimulation,
  } = useFraudSimulation();

  return (
    <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-800">
        Process Simulation & ML Training
      </h2>
      <div className="flex gap-2">
        <button
          onClick={initializeSimulation}
          disabled={simulationStatus === 'running'}
          className="btn btn-primary btn-sm shadow-sm hover:shadow-md transition-all"
        >
          {simulationStatus === 'running' ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Running ML checks...
            </>
          ) : (
            'Initialize Training'
          )}
        </button>
        <button
          onClick={resumeSimulation}
          disabled={simulationStatus !== 'paused'}
          className="btn btn-secondary btn-sm shadow-sm hover:shadow-md transition-all"
        >
          Resume
        </button>
        <button
          onClick={resetSimulation}
          className="btn btn-ghost btn-sm border border-slate-300 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all"
        >
          Reset
        </button>
      </div>
    </div>
  );
}


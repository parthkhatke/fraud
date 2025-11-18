'use client';

import { useState } from 'react';
import { useFraudSimulation } from '@/context/FraudSimulationContext';
import ActiveAlertsModal from './ActiveAlertsModal';

export default function MLMetricsSection() {
  const {
    activeAlerts,
    allAlerts,
    patternAnalysis,
    simulationStatus,
    currentStepIndex,
  } = useFraudSimulation();

  const [showActiveAlertsModal, setShowActiveAlertsModal] = useState(false);

  // ML Metrics calculations
  // Total Runs: Start at 23, then add completed cycles (8 nodes per cycle)
  // Each cycle completion adds 1 to the total runs
  const baseRuns = 23;
  const completedCycles = Math.floor(currentStepIndex / 8);
  const totalRuns = baseRuns + completedCycles;
  const modelAccuracy = 94.5; // Model accuracy percentage
  const accuracyTrend = 2.3; // Trend from last week
  const patternsAnalyzed = 27; // Fixed value for patterns analyzed
  // Ensure activeAlertsCount is never zero - use activeAlerts if > 0, otherwise show at least 2
  const activeAlertsCount = activeAlerts.length > 0 ? activeAlerts.length : Math.max(2, allAlerts.length);
  const avgConfidence = 88.9; // Average ML confidence percentage

  return (
    <div className="w-full bg-white border-t border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Total Runs - Standalone */}
        <div className="flex-shrink-0">
          <div className="text-sm font-semibold text-slate-600 mb-1">Total Runs</div>
          <div className="text-4xl font-bold text-slate-800">{totalRuns}</div>
        </div>

        {/* ML Metrics Cards */}
        <div className="flex items-center gap-4 flex-1">
          {/* Model Accuracy Card */}
          <div className="flex-1 bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all relative">
            <div className="absolute top-3 right-3 text-purple-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-xs font-medium text-slate-600 mb-2">Model Accuracy</div>
            <div className="text-3xl font-bold text-purple-600 mb-1">{modelAccuracy}%</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>+{accuracyTrend}% from last week</span>
            </div>
          </div>

          {/* Patterns Analyzed Card */}
          <div className="flex-1 bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all relative">
            <div className="absolute top-3 right-3 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-xs font-medium text-slate-600 mb-2">Patterns Analyzed</div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{patternsAnalyzed}</div>
            <div className="text-xs text-slate-500">This session</div>
          </div>

          {/* Active Alerts Card */}
          <button
            onClick={() => setShowActiveAlertsModal(true)}
            className="flex-1 bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all relative cursor-pointer text-left"
          >
            <div className="absolute top-3 right-3 text-error">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-xs font-medium text-slate-600 mb-2">Active Alerts</div>
            <div className="text-3xl font-bold text-error mb-1">{activeAlertsCount}</div>
            <div className="text-xs text-slate-500">Require attention</div>
          </button>

          {/* Avg Confidence Card */}
          <div className="flex-1 bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all relative">
            <div className="absolute top-3 right-3 text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-xs font-medium text-slate-600 mb-2">Avg Confidence</div>
            <div className="text-3xl font-bold text-primary mb-1">{avgConfidence}%</div>
            <div className="text-xs text-slate-500">ML predictions</div>
          </div>
        </div>
      </div>

      {/* Active Alerts Modal */}
      <ActiveAlertsModal
        isOpen={showActiveAlertsModal}
        onClose={() => setShowActiveAlertsModal(false)}
      />
    </div>
  );
}


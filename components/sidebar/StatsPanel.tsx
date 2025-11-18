'use client';

import { useState } from 'react';
import { useFraudSimulation } from '@/context/FraudSimulationContext';
import { getRiskLevel } from '@/lib/risk';
import clsx from 'clsx';
import RiskItemsModal from './RiskItemsModal';

export default function StatsPanel() {
  const {
    prs,
    pos,
    invoices,
    activeAlerts,
    tickets,
    pendingActions,
    selectEntity,
    selectProcessNode,
    selectKnowledgeNode,
    setActiveAlertModal,
    simulationStatus,
    sidePanelEntityType,
  } = useFraudSimulation();

  const [showRiskModal, setShowRiskModal] = useState(false);

  // Total exposure in INR
  // PO values are stored in base units, we'll treat them as INR directly
  // This will result in total exposure in lakhs (hundreds of thousands)
  const totalExposure = pos.reduce((sum, po) => sum + po.totalValue, 0);
  const highRiskCount = [...prs, ...pos, ...invoices].filter(
    (item) => item.riskScore >= 0.6
  ).length;

  const latestAlerts = activeAlerts.slice(-5).reverse();

  const handleAlertClick = (alert: typeof activeAlerts[0]) => {
    setActiveAlertModal(alert);
    selectEntity(alert.entityId);
    
    // Map entity type to process node
    const nodeMap: Record<string, string> = {
      PR: 'pr',
      PO: 'po',
      GR: 'gr',
      Invoice: 'invoice',
      Supplier: 'existingSupplier',
    };
    selectProcessNode(nodeMap[alert.entityType] || null);
    selectKnowledgeNode(alert.entityId);
  };

  return (
    <header className="w-full border-b border-slate-200 p-6 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-6">
        {/* Title Section */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-slate-800 whitespace-nowrap">
              Fraud Detection Across Procurement Lifecycle
            </h1>
            <p className="text-sm text-slate-600 flex items-center gap-2 mt-2">
              <span className="w-3 h-3 bg-success rounded-full animate-pulse"></span>
              Real-time Detection
            </p>
          </div>
        </div>

        {/* KPI Cards - Horizontal */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="stat bg-white rounded-lg p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-info/30 transition-all">
            <div className="stat-title text-sm text-slate-600 font-medium">Total Exposure</div>
            <div className="stat-value text-2xl text-info font-bold">
              ₹{totalExposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Risk Summary */}
          <button
            onClick={() => setShowRiskModal(true)}
            className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-error/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">High/Critical Risk</span>
              <span className={clsx(
                'badge badge-lg font-semibold',
                highRiskCount >= 5 ? 'badge-error' : highRiskCount >= 2 ? 'badge-warning' : 'badge-success'
              )}>
                {highRiskCount}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Latest Alerts - Only show when side panel is open, not during training */}
      {latestAlerts.length > 0 && sidePanelEntityType && simulationStatus !== 'running' && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <h2 className="text-xs font-semibold mb-2 text-slate-700">Latest Alerts</h2>
          <div className="flex gap-2 overflow-x-auto">
            {latestAlerts.map((alert) => {
              const severityClass = {
                low: 'badge-success',
                medium: 'badge-warning',
                high: 'badge-error',
                critical: 'badge-error',
              }[alert.severity];

              return (
                <button
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={clsx(
                    'flex-shrink-0 text-left rounded-lg p-2 transition-all hover:shadow-md border min-w-[200px]',
                    severityClass === 'badge-error' 
                      ? 'bg-white border-error/30 hover:border-error/50 hover:bg-error/5'
                      : severityClass === 'badge-warning'
                      ? 'bg-white border-warning/30 hover:border-warning/50 hover:bg-warning/5'
                      : 'bg-white border-info/30 hover:border-info/50 hover:bg-info/5'
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-bold">{alert.entityType}</span>
                    <span className={clsx('badge badge-xs font-bold shadow-sm', severityClass)}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-base-content/80 line-clamp-1 font-medium">
                    {alert.reason}
                  </p>
                  <p className="text-xs text-base-content/60 mt-1 font-mono truncate">{alert.entityId}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}


      {/* Risk Items Modal */}
      <RiskItemsModal isOpen={showRiskModal} onClose={() => setShowRiskModal(false)} />
    </header>
  );
}


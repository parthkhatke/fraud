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
    <aside className="w-64 border-r border-slate-200 p-4 overflow-y-auto bg-white shadow-sm">
      <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">
        Fraud Detection Across Procurement Lifecycle
        </h1>
        <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
          Real-time Detection
        </p>
      </div>

      {/* KPI Cards */}
      <div className="space-y-3 mb-6">
        <div className="stat bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
          <div className="stat-title text-xs text-slate-600 font-medium">Total PRs</div>
          <div className="stat-value text-2xl text-primary font-bold">{prs.length}</div>
        </div>

        <div className="stat bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-secondary/30 transition-all">
          <div className="stat-title text-xs text-slate-600 font-medium">Total POs</div>
          <div className="stat-value text-2xl text-secondary font-bold">{pos.length}</div>
        </div>

        <div className="stat bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-accent/30 transition-all">
          <div className="stat-title text-xs text-slate-600 font-medium">Total Invoices</div>
          <div className="stat-value text-2xl text-accent font-bold">{invoices.length}</div>
        </div>

        <div className="stat bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-info/30 transition-all">
          <div className="stat-title text-xs text-slate-600 font-medium">Total Exposure</div>
          <div className="stat-value text-xl text-info font-bold">
            ₹{totalExposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Risk Summary */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-2 text-slate-700">Risk Summary</h2>
        <button
          onClick={() => setShowRiskModal(true)}
          className="w-full bg-white rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md hover:border-error/30 transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">High/Critical Risk Items</span>
            <span className={clsx(
              'badge badge-lg font-semibold',
              highRiskCount >= 5 ? 'badge-error' : highRiskCount >= 2 ? 'badge-warning' : 'badge-success'
            )}>
              {highRiskCount}
            </span>
          </div>
        </button>
      </div>

      {/* Latest Alerts */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-2">Latest Alerts</h2>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {latestAlerts.length === 0 ? (
            <p className="text-xs text-base-content/60 p-2">No alerts yet</p>
          ) : (
            latestAlerts.map((alert) => {
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
                    'w-full text-left rounded-lg p-3 transition-all hover:shadow-md border',
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
                  <p className="text-xs text-base-content/80 line-clamp-2 font-medium">
                    {alert.reason}
                  </p>
                  <p className="text-xs text-base-content/60 mt-1 font-mono">{alert.entityId}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Pending Actions</h2>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="bg-base-200 rounded-lg p-2 text-xs"
              >
                <div className="font-medium">{action.type}</div>
                <div className="text-base-content/60">{action.entityId}</div>
                <div className="text-base-content/50 mt-1">
                  {action.managerName} - {action.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investigation Tickets */}
      {tickets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2">Investigation Tickets</h2>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-base-200 rounded-lg p-2 text-xs"
              >
                <div className="font-medium">{ticket.id}</div>
                <div className="text-base-content/60">{ticket.entityType} - {ticket.entityId}</div>
                <div className="text-base-content/50 mt-1">
                  Status: <span className="badge badge-xs badge-warning">{ticket.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Items Modal */}
      <RiskItemsModal isOpen={showRiskModal} onClose={() => setShowRiskModal(false)} />
    </aside>
  );
}


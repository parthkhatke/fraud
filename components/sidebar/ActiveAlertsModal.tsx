'use client';

import { useFraudSimulation } from '@/context/FraudSimulationContext';
import clsx from 'clsx';

interface ActiveAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActiveAlertsModal({ isOpen, onClose }: ActiveAlertsModalProps) {
  const { activeAlerts, setActiveAlertModal, selectEntity, selectProcessNode, selectKnowledgeNode } = useFraudSimulation();

  if (!isOpen) return null;

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
    onClose();
  };

  const severityClass = (severity: string) => {
    return {
      low: 'badge-success',
      medium: 'badge-warning',
      high: 'badge-error',
      critical: 'badge-error',
    }[severity] || 'badge-info';
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-2xl">Active Alerts</h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold text-slate-600 mb-2">No Active Alerts</p>
            <p className="text-sm text-slate-500">All alerts have been resolved or dismissed.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const severity = severityClass(alert.severity);
                return (
                  <button
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className={clsx(
                      'w-full text-left rounded-lg p-4 transition-all hover:shadow-md border',
                      severity === 'badge-error' 
                        ? 'bg-white border-error/30 hover:border-error/50 hover:bg-error/5'
                        : severity === 'badge-warning'
                        ? 'bg-white border-warning/30 hover:border-warning/50 hover:bg-warning/5'
                        : 'bg-white border-info/30 hover:border-info/50 hover:bg-info/5'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-slate-800">{alert.entityType}</span>
                        <span className={clsx('badge badge-sm font-bold shadow-sm', severity)}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{alert.entityId}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium mb-2">{alert.reason}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Click to view details</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="modal-action mt-4 pt-4 border-t border-slate-200">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}


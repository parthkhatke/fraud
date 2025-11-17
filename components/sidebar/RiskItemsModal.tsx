'use client';

import { useFraudSimulation } from '@/context/FraudSimulationContext';
import { getRiskLevel } from '@/lib/risk';
import clsx from 'clsx';

export default function RiskItemsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { prs, pos, invoices, setActiveAlertModal, selectEntity, selectProcessNode, selectKnowledgeNode } = useFraudSimulation();

  if (!isOpen) return null;

  // Get all high/critical risk items
  const highRiskItems = [
    ...prs.filter((pr) => pr.riskScore >= 0.6).map((pr) => ({
      type: 'PR' as const,
      id: pr.id,
      number: pr.number,
      riskScore: pr.riskScore,
      entity: pr,
    })),
    ...pos.filter((po) => po.riskScore >= 0.6).map((po) => ({
      type: 'PO' as const,
      id: po.id,
      number: po.number,
      riskScore: po.riskScore,
      entity: po,
    })),
    ...invoices.filter((inv) => inv.riskScore >= 0.6).map((inv) => ({
      type: 'Invoice' as const,
      id: inv.id,
      number: inv.number,
      riskScore: inv.riskScore,
      entity: inv,
    })),
  ].sort((a, b) => b.riskScore - a.riskScore);

  const handleItemClick = (item: typeof highRiskItems[0]) => {
    selectEntity(item.id);
    const nodeMap: Record<string, string> = {
      PR: 'pr',
      PO: 'po',
      Invoice: 'invoice',
    };
    selectProcessNode(nodeMap[item.type] || null);
    selectKnowledgeNode(item.id);
    onClose();
  };

  const riskLevel = (score: number) => getRiskLevel(score);
  const riskClass = (score: number) => {
    const level = riskLevel(score);
    return {
      low: 'badge-success',
      medium: 'badge-warning',
      high: 'badge-error',
      critical: 'badge-error',
    }[level];
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <h3 className="font-bold text-lg mb-4">High/Critical Risk Items</h3>
        
        <div className="flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Number</th>
                  <th>Risk Level</th>
                  <th>Risk Score</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {highRiskItems.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-base-200 cursor-pointer" onClick={() => handleItemClick(item)}>
                    <td>
                      <span className="badge badge-outline">{item.type}</span>
                    </td>
                    <td className="font-mono text-sm">{item.number}</td>
                    <td>
                      <span className={clsx('badge', riskClass(item.riskScore))}>
                        {riskLevel(item.riskScore).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-base-300 rounded-full h-2">
                          <div
                            className={clsx(
                              'h-2 rounded-full',
                              item.riskScore >= 0.8 ? 'bg-error' : 'bg-warning'
                            )}
                            style={{ width: `${item.riskScore * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{(item.riskScore * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td>
                      {item.type === 'PR' && (
                        <div className="text-xs">
                          <div><strong>Requester:</strong> {item.entity.requester.name}</div>
                          <div><strong>Material:</strong> {item.entity.material.description}</div>
                          <div><strong>Value:</strong> ₹{(item.entity.quantity * item.entity.estimatedUnitPrice).toLocaleString('en-IN')}</div>
                        </div>
                      )}
                      {item.type === 'PO' && (
                        <div className="text-xs">
                          <div><strong>Supplier:</strong> {item.entity.supplier.name}</div>
                          <div><strong>Value:</strong> ₹{item.entity.totalValue.toLocaleString('en-IN')}</div>
                          <div><strong>Status:</strong> {item.entity.status}</div>
                        </div>
                      )}
                      {item.type === 'Invoice' && (
                        <div className="text-xs">
                          <div><strong>Supplier:</strong> {item.entity.supplier.name}</div>
                          <div><strong>Amount:</strong> ₹{item.entity.invoiceAmount.toLocaleString('en-IN')}</div>
                          <div><strong>Status:</strong> {item.entity.status}</div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-action mt-4">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}


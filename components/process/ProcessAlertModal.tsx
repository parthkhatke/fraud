'use client';

import { useFraudSimulation } from '@/context/FraudSimulationContext';
import { getRiskLevel } from '@/lib/risk';
import clsx from 'clsx';

export default function ProcessAlertModal() {
  const {
    activeAlertModal,
    setActiveAlertModal,
    invoices,
    pos,
    grs,
    prs,
    suppliers,
    markAlertAsMistake,
    reportAlert,
    downloadAlertReport,
    resumeSimulation,
    openSidePanel,
  } = useFraudSimulation();

  if (!activeAlertModal) return null;

  // Find the entity
  let entity: any = null;
  if (activeAlertModal.entityType === 'Invoice') {
    entity = invoices.find((inv) => inv.id === activeAlertModal.entityId);
  } else if (activeAlertModal.entityType === 'PO') {
    entity = pos.find((po) => po.id === activeAlertModal.entityId);
  } else if (activeAlertModal.entityType === 'GR') {
    entity = grs.find((gr) => gr.id === activeAlertModal.entityId);
  } else if (activeAlertModal.entityType === 'PR') {
    entity = prs.find((pr) => pr.id === activeAlertModal.entityId);
  } else if (activeAlertModal.entityType === 'Supplier') {
    entity = suppliers.find((sup) => sup.id === activeAlertModal.entityId);
  }

  const severityClass = {
    low: 'badge-success',
    medium: 'badge-warning',
    high: 'badge-error',
    critical: 'badge-error',
  }[activeAlertModal.severity];

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className={clsx('badge', severityClass)}>
            {activeAlertModal.severity.toUpperCase()}
          </span>
          Fraud Alert: {activeAlertModal.entityType} {activeAlertModal.entityId}
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Alert Reason</h4>
            <p className="text-sm bg-base-200 p-3 rounded-lg">{activeAlertModal.reason}</p>
          </div>

          {entity && (
            <div>
              <h4 className="font-semibold mb-2">Entity Details</h4>
              <div className="bg-base-200 p-3 rounded-lg space-y-2 text-sm">
                {activeAlertModal.entityType === 'Invoice' && entity && (
                  <>
                    <div><strong>Supplier:</strong> {entity.supplier.name}</div>
                    <div><strong>Amount:</strong> ₹{entity.invoiceAmount.toLocaleString('en-IN')}</div>
                    <div><strong>Status:</strong> {entity.status}</div>
                    <div><strong>PO:</strong> {entity.po.number}</div>
                  </>
                )}
                {activeAlertModal.entityType === 'PO' && entity && (
                  <>
                    <div><strong>Supplier:</strong> {entity.supplier.name}</div>
                    <div><strong>Total Value:</strong> ₹{entity.totalValue.toLocaleString('en-IN')}</div>
                    <div><strong>Status:</strong> {entity.status}</div>
                    <div><strong>Requester:</strong> {entity.pr.requester.name}</div>
                  </>
                )}
                {activeAlertModal.entityType === 'GR' && entity && (
                  <>
                    <div><strong>PO:</strong> {entity.po.number}</div>
                    <div><strong>Received Qty:</strong> {entity.receivedQty}</div>
                    <div><strong>Discrepancy:</strong> {(entity.discrepancyPct * 100).toFixed(1)}%</div>
                  </>
                )}
                {activeAlertModal.entityType === 'PR' && entity && (
                  <>
                    <div><strong>Requester:</strong> {entity.requester.name}</div>
                    <div><strong>Department:</strong> {entity.department}</div>
                    <div><strong>Material:</strong> {entity.material.description}</div>
                  </>
                )}
                {activeAlertModal.entityType === 'Supplier' && entity && (
                  <>
                    <div><strong>Name:</strong> {entity.name}</div>
                    <div><strong>Country:</strong> {entity.country}</div>
                    <div><strong>On-Time Delivery:</strong> {(entity.onTimeDeliveryRate * 100).toFixed(1)}%</div>
                    <div><strong>Risk Score:</strong> {(entity.riskScore * 100).toFixed(0)}%</div>
                  </>
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2">Suggested Actions</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {activeAlertModal.suggestedActions.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ul>
          </div>

          {/* Clickable Entity Buttons */}
          <div>
            <h4 className="font-semibold mb-3">View Related Clusters</h4>
            <div className="flex gap-3">
              <button
                className="btn btn-outline btn-primary flex-1"
                onClick={() => {
                  openSidePanel('PR');
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PR
              </button>
              <button
                className="btn btn-outline btn-primary flex-1"
                onClick={() => {
                  openSidePanel('PO');
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PO
              </button>
              <button
                className="btn btn-outline btn-primary flex-1"
                onClick={() => {
                  openSidePanel('Invoice');
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice Recording
              </button>
            </div>
          </div>
        </div>

        <div className="modal-action gap-2">
          <button
            className="btn btn-error"
            onClick={() => {
              if (activeAlertModal) {
                reportAlert(activeAlertModal.id);
              }
            }}
          >
            Report It
          </button>
          <button
            className="btn btn-warning"
            onClick={() => {
              if (activeAlertModal) {
                markAlertAsMistake(activeAlertModal.id);
              }
            }}
          >
            Mark as Mistake
          </button>
          <button
            className="btn btn-info"
            onClick={() => {
              if (activeAlertModal) {
                downloadAlertReport(activeAlertModal);
              }
            }}
          >
            Download Report
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setActiveAlertModal(null);
              resumeSimulation();
            }}
          >
            Continue
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={() => setActiveAlertModal(null)}></div>
    </div>
  );
}


'use client';

import { useFraudSimulation } from '@/context/FraudSimulationContext';
import { getRiskLevel } from '@/lib/risk';
import clsx from 'clsx';

export default function KnowledgeDetailsPanel() {
  const {
    selectedKnowledgeNodeId,
    prs,
    pos,
    grs,
    invoices,
    suppliers,
  } = useFraudSimulation();

  if (!selectedKnowledgeNodeId) {
    return (
      <div className="w-64 border-l border-slate-200 p-4 bg-white">
        <h3 className="font-semibold mb-2 text-slate-700">Details</h3>
        <p className="text-sm text-slate-500">Select a node to view details</p>
      </div>
    );
  }

  // Find the entity
  let entity: any = null;
  let entityType = '';

  entity = prs.find((pr) => pr.id === selectedKnowledgeNodeId);
  if (entity) entityType = 'PR';

  if (!entity) {
    entity = pos.find((po) => po.id === selectedKnowledgeNodeId);
    if (entity) entityType = 'PO';
  }

  if (!entity) {
    entity = grs.find((gr) => gr.id === selectedKnowledgeNodeId);
    if (entity) entityType = 'GR';
  }

  if (!entity) {
    entity = invoices.find((inv) => inv.id === selectedKnowledgeNodeId);
    if (entity) entityType = 'Invoice';
  }

  if (!entity) {
    entity = suppliers.find((sup) => sup.id === selectedKnowledgeNodeId);
    if (entity) entityType = 'Supplier';
  }

  if (!entity) {
    return (
      <div className="w-64 border-l border-base-300 p-4 bg-base-100">
        <h3 className="font-semibold mb-2">Details</h3>
        <p className="text-sm text-base-content/60">No details available</p>
      </div>
    );
  }

  const riskLevel = entity.riskScore ? getRiskLevel(entity.riskScore) : 'low';
  const riskClass = {
    low: 'badge-success',
    medium: 'badge-warning',
    high: 'badge-error',
    critical: 'badge-error',
  }[riskLevel];

  return (
    <div className="w-64 border-l border-slate-200 p-4 bg-white overflow-y-auto">
      <h3 className="font-semibold mb-3 text-slate-800">
        Entity Details
      </h3>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-base-content/60 mb-1">Type</div>
          <div className="font-medium">{entityType}</div>
        </div>

        {entityType === 'PR' && (
          <>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Number</div>
              <div className="font-medium">{entity.number}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Requester</div>
              <div className="text-sm">{entity.requester.name}</div>
              <div className="text-xs text-base-content/60">{entity.requester.role}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Department</div>
              <div className="text-sm">{entity.department}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Material</div>
              <div className="text-sm">{entity.material.description}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Quantity</div>
              <div className="text-sm">{entity.quantity}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Estimated Value</div>
              <div className="text-sm">
                ₹{(entity.quantity * entity.estimatedUnitPrice).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Status</div>
              <div className="text-sm">{entity.status}</div>
            </div>
          </>
        )}

        {entityType === 'PO' && (
          <>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Number</div>
              <div className="font-medium">{entity.number}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Supplier</div>
              <div className="text-sm">{entity.supplier.name}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Total Value</div>
              <div className="text-sm font-semibold">₹{entity.totalValue.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Status</div>
              <div className="text-sm">{entity.status}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Material</div>
              <div className="text-sm">{entity.material.description}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Quantity</div>
              <div className="text-sm">{entity.quantity}</div>
            </div>
          </>
        )}

        {entityType === 'GR' && (
          <>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Number</div>
              <div className="font-medium">{entity.number}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">PO</div>
              <div className="text-sm">{entity.po.number}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Received Qty</div>
              <div className="text-sm">{entity.receivedQty}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Discrepancy</div>
              <div className="text-sm">
                {(entity.discrepancyPct * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Received At</div>
              <div className="text-sm">{entity.receivedAt}</div>
            </div>
          </>
        )}

        {entityType === 'Invoice' && (
          <>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Number</div>
              <div className="font-medium">{entity.number}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Supplier</div>
              <div className="text-sm">{entity.supplier.name}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Amount</div>
              <div className="text-sm font-semibold">
                ₹{entity.invoiceAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Status</div>
              <div className="text-sm">{entity.status}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">PO</div>
              <div className="text-sm">{entity.po.number}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Invoice Date</div>
              <div className="text-sm">{entity.invoiceDate}</div>
            </div>
          </>
        )}

        {entityType === 'Supplier' && (
          <>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Name</div>
              <div className="font-medium">{entity.name}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Location</div>
              <div className="text-sm">{entity.city}, {entity.country}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Category</div>
              <div className="text-sm">{entity.category}</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">On-Time Delivery</div>
              <div className="text-sm">{(entity.onTimeDeliveryRate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-base-content/60 mb-1">Avg Lead Time</div>
              <div className="text-sm">{entity.avgLeadTimeDays} days</div>
            </div>
          </>
        )}

        <div>
          <div className="text-xs text-base-content/60 mb-1">Risk Level</div>
          <div>
            <span className={clsx('badge badge-sm', riskClass)}>
              {riskLevel.toUpperCase()}
            </span>
            <span className="text-xs text-base-content/60 ml-2">
              ({(entity.riskScore * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


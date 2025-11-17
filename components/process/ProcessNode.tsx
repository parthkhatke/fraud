'use client';

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ProcessNodeData } from '@/lib/types';
import { getRiskBorderClass, getRiskBgClass } from '@/lib/risk';
import { useFraudSimulation } from '@/context/FraudSimulationContext';
import clsx from 'clsx';

export default function ProcessNode({ data, selected }: NodeProps<ProcessNodeData>) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const { handleContextAction, activeAlerts } = useFraudSimulation();

  const riskBorderClass = data.riskScore ? getRiskBorderClass(data.riskScore) : 'border-success';
  const riskBgClass = data.riskScore ? getRiskBgClass(data.riskScore) : 'bg-success';
  const hasAlert = data.hasActiveAlert || false;

  // Find the alert for this node to get entity info
  const alertForNode = activeAlerts.find((alert) => {
    const nodeMap: Record<string, string> = {
      PR: 'pr',
      PO: 'po',
      GR: 'gr',
      Invoice: 'invoice',
      Supplier: 'existingSupplier',
    };
    return nodeMap[alert.entityType] === data.stage;
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    if (hasAlert) {
      e.preventDefault();
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    }
  };

  const handleMenuClick = (
    action: 'Request More Information' | 'Create Investigation Ticket' | 'Run Pattern Analysis (ML)'
  ) => {
    setShowContextMenu(false);
    if (alertForNode) {
      handleContextAction(action, alertForNode.entityType, alertForNode.entityId);
    } else {
      // Fallback if no alert found
      handleContextAction(action, data.stage, '');
    }
  };

  React.useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  return (
    <>
      <div
        className={clsx(
          'px-4 py-3 rounded-lg border-2 shadow-md bg-base-100 min-w-[200px] transition-all duration-300',
          hasAlert
            ? 'border-error bg-error/10'
            : data.isActive
            ? 'border-primary ring-4 ring-primary/20 scale-105'
            : selected
            ? 'border-primary'
            : riskBorderClass,
          hasAlert && 'animate-pulse',
          data.isActive && 'shadow-lg'
        )}
        onContextMenu={handleContextMenu}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="badge badge-sm badge-outline">{data.stage.toUpperCase()}</span>
          {hasAlert && (
            <span className="text-error text-xl">!</span>
          )}
          {!hasAlert && data.riskScore !== undefined && (
            <div className={clsx('w-3 h-3 rounded-full', riskBgClass)} />
          )}
        </div>
        <div className="font-semibold text-sm mb-1">{data.label}</div>
        {data.description && (
          <div className="text-xs text-base-content/70 mb-1">{data.description}</div>
        )}
        {data.stepNumbers.length > 0 && (
          <div className="text-xs text-base-content/50">
            Steps: {data.stepNumbers.join(', ')}
          </div>
        )}
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>

      {showContextMenu && (
        <div
          className="fixed z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg py-2 min-w-[200px]"
          style={{ left: menuPosition.x, top: menuPosition.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 hover:bg-base-200 text-sm"
            onClick={() => handleMenuClick('Request More Information')}
          >
            Request More Information
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-base-200 text-sm"
            onClick={() => handleMenuClick('Create Investigation Ticket')}
          >
            Create Investigation Ticket
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-base-200 text-sm"
            onClick={() => handleMenuClick('Run Pattern Analysis (ML)')}
          >
            Run Pattern Analysis (ML)
          </button>
        </div>
      )}
    </>
  );
}


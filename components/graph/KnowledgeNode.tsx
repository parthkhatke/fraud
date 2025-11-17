'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { getRiskBorderClass, getRiskTextClass } from '@/lib/risk';
import clsx from 'clsx';

interface KnowledgeNodeData {
  label: string;
  type: 'type' | 'instance';
  entityType?: 'PR' | 'PO' | 'GR' | 'Invoice' | 'Supplier';
  riskScore?: number;
  hasAlert?: boolean;
  highlighted?: boolean;
}

export default function KnowledgeNode({ data, selected }: NodeProps<KnowledgeNodeData>) {
  const riskBorderClass = data.riskScore ? getRiskBorderClass(data.riskScore) : 'border-base-300';
  const riskTextClass = data.riskScore ? getRiskTextClass(data.riskScore) : 'text-base-content';
  const hasAlert = data.hasAlert || false;

  if (data.type === 'type') {
    return (
      <div className={clsx(
        'px-4 py-3 rounded-full border-2 shadow-md bg-primary text-primary-content font-semibold min-w-[120px] text-center cursor-pointer transition-all',
        selected && 'ring-2 ring-offset-2 ring-primary',
        selected && 'scale-110 shadow-lg'
      )}>
        {data.label}
        <Handle type="source" position={Position.Right} />
      </div>
    );
  }

  const isHighlighted = data.highlighted || false;
  
  return (
    <>
      <div
        className={clsx(
          'px-3 py-2 rounded-lg border-2 shadow-sm bg-base-100 text-sm min-w-[100px] text-center transition-all',
          hasAlert
            ? 'border-error bg-error/20 ring-2 ring-error'
            : isHighlighted
            ? 'border-primary bg-primary/20 ring-2 ring-primary shadow-lg scale-105'
            : selected
            ? 'border-primary ring-2 ring-primary'
            : riskBorderClass,
          hasAlert && 'animate-pulse',
          isHighlighted && 'animate-pulse'
        )}
      >
        <div className="font-medium">{data.label}</div>
        {data.riskScore !== undefined && (
          <div className={clsx('text-xs mt-1', riskTextClass)}>
            Risk: {(data.riskScore * 100).toFixed(0)}%
          </div>
        )}
        {hasAlert && (
          <div className="text-error text-lg mt-1">!</div>
        )}
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>
    </>
  );
}


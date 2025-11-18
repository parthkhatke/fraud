'use client';

import React, { useState, useMemo } from 'react';
import { useFraudSimulation } from '@/context/FraudSimulationContext';
import { POCluster, PRCluster, InvoiceCluster, FraudPatternDetails } from '@/lib/types';
import { getRiskLevel } from '@/lib/risk';
import clsx from 'clsx';
import FraudPatternDetailsPanel from './FraudPatternDetailsPanel';
import { mockFraudPatternDetails } from '@/lib/mockData';

interface POClustersPanelProps {
  entityType: 'PR' | 'PO' | 'Invoice';
  onClose: () => void;
}

type UnifiedCluster = {
  id: string;
  clusterId: string;
  riskScore: number;
  contractInvolved: number;
  totalAmount: number;
  detectedAt: string;
  entityType: 'PR' | 'PO' | 'Invoice';
  originalData: POCluster | PRCluster | InvoiceCluster;
};

export default function POClustersPanel({ entityType, onClose }: POClustersPanelProps) {
  const { poClusters, prClusters, invoiceClusters } = useFraudSimulation();
  const [sortColumn, setSortColumn] = useState<keyof UnifiedCluster | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedClusterDetails, setSelectedClusterDetails] = useState<string | null>(null);

  // Get clusters based on entity type and unify the structure
  const filteredClusters = useMemo<UnifiedCluster[]>(() => {
    if (entityType === 'PR') {
      return prClusters.map(cluster => ({
        id: cluster.id,
        clusterId: cluster.clusterId,
        riskScore: cluster.riskScore,
        contractInvolved: cluster.requestsInvolved,
        totalAmount: cluster.totalAmount,
        detectedAt: cluster.detectedAt,
        entityType: 'PR' as const,
        originalData: cluster,
      }));
    } else if (entityType === 'Invoice') {
      return invoiceClusters.map(cluster => ({
        id: cluster.id,
        clusterId: cluster.clusterId,
        riskScore: cluster.riskScore,
        contractInvolved: cluster.invoicesInvolved,
        totalAmount: cluster.totalAmount,
        detectedAt: cluster.detectedAt,
        entityType: 'Invoice' as const,
        originalData: cluster,
      }));
    } else {
      // PO clusters
      return poClusters.map(cluster => ({
        id: cluster.id,
        clusterId: cluster.clusterId,
        riskScore: cluster.riskScore,
        contractInvolved: cluster.contractInvolved,
        totalAmount: cluster.totalAmount,
        detectedAt: cluster.detectedAt,
        entityType: 'PO' as const,
        originalData: cluster,
      }));
    }
  }, [entityType, poClusters, prClusters, invoiceClusters]);

  const handleSort = (column: keyof UnifiedCluster) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedClusters = [...filteredClusters].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];
    
    if (sortColumn === 'detectedAt') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const formatAmount = (amount: number): string => {
    // Convert to lakhs (divide by 100000)
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)}L`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
  };

  const getRiskBadgeClass = (riskScore: number) => {
    const level = riskScore >= 80 ? 'high' : riskScore >= 50 ? 'medium' : 'low';
    if (level === 'high') return 'bg-red-100 text-red-800 border-red-300';
    if (level === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getRiskLabel = (riskScore: number): string => {
    if (riskScore >= 80) return 'High';
    if (riskScore >= 50) return 'Medium';
    return 'Low';
  };

  const SortIcon = ({ column }: { column: keyof UnifiedCluster }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="fixed inset-y-0 right-0 w-[1200px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-slate-50">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{entityType} Clusters</h2>
          <p className="text-sm text-gray-600 mt-1">Viewing clusters for {entityType}</p>
        </div>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Close panel"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[250px]">
                {entityType} CLUSTER
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[180px]"
                onClick={() => handleSort('riskScore')}
              >
                <div className="flex items-center gap-2">
                  RISK SCORE
                  <SortIcon column="riskScore" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[180px]"
                onClick={() => handleSort('contractInvolved')}
              >
                <div className="flex items-center gap-2">
                  {entityType === 'PR' ? 'REQUESTS' : entityType === 'Invoice' ? 'INVOICES' : 'CONTRACTS'} INVOLVED
                  <SortIcon column="contractInvolved" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[180px]"
                onClick={() => handleSort('totalAmount')}
              >
                <div className="flex items-center gap-2">
                  TOTAL AMOUNT
                  <SortIcon column="totalAmount" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[200px]"
                onClick={() => handleSort('detectedAt')}
              >
                <div className="flex items-center gap-2">
                  DETECTED AT
                  <SortIcon column="detectedAt" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedClusters.map((cluster) => (
              <tr key={cluster.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">{cluster.clusterId}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                    getRiskBadgeClass(cluster.riskScore)
                  )}>
                    {cluster.riskScore.toFixed(1)} ({getRiskLabel(cluster.riskScore)})
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cluster.contractInvolved}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatAmount(cluster.totalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(cluster.detectedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    onClick={() => {
                      setSelectedClusterDetails(cluster.clusterId);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Fraud Pattern Details Panel */}
      {selectedClusterDetails && (() => {
        const cluster = filteredClusters.find(c => c.clusterId === selectedClusterDetails);
        if (!cluster) return null;
        
        // Use existing details or generate from cluster data
        let details: FraudPatternDetails;
        
        if (mockFraudPatternDetails[selectedClusterDetails]) {
          details = mockFraudPatternDetails[selectedClusterDetails];
        } else {
          // Generate details based on entity type
          if (entityType === 'PR') {
            const prCluster = cluster.originalData as PRCluster;
            const avgAmount = cluster.totalAmount / cluster.contractInvolved;
            details = {
              clusterId: cluster.clusterId,
              riskScore: cluster.riskScore,
              patternType: cluster.riskScore >= 80 ? 'Department Pattern' : cluster.riskScore >= 50 ? 'Repeated Requests' : 'Volume Anomaly',
              patternDescription: `${cluster.contractInvolved} PRs detected with: Same department (${prCluster.department}), Same requisitioner pattern, Unusual request frequency detected`,
              fraudIndicators: [
                'Same Department',
                'Same Requisitioner',
                'High Frequency',
                'Similar Materials',
                cluster.riskScore >= 80 ? 'Above Normal Threshold' : 'Pattern Deviation',
              ],
              approvalThreshold: 800000,
              thresholdLabel: 'Manager',
              averagePOAmount: avgAmount,
              averageBelowThreshold: Math.max(0, 800000 - avgAmount),
              averageBelowThresholdPercent: Math.max(0, ((800000 - avgAmount) / 800000) * 100),
              totalAmount: cluster.totalAmount,
              totalContract: cluster.contractInvolved,
              detectedAt: cluster.detectedAt,
              suspiciousPOs: prCluster.prs.slice(0, cluster.contractInvolved).map((pr, idx) => ({
                poNumber: pr.number,
                date: pr.createdAt,
                amount: pr.quantity * pr.estimatedUnitPrice,
                supplier: pr.supplierShortlist[0]?.name || 'Multiple',
                requisitioner: pr.requester.name,
                material: pr.material.description,
              })),
            };
          } else if (entityType === 'Invoice') {
            const invCluster = cluster.originalData as InvoiceCluster;
            const avgAmount = cluster.totalAmount / cluster.contractInvolved;
            details = {
              clusterId: cluster.clusterId,
              riskScore: cluster.riskScore,
              patternType: cluster.riskScore >= 80 ? 'Invoice Discrepancy' : cluster.riskScore >= 50 ? 'Amount Variance' : 'Timing Pattern',
              patternDescription: `${cluster.contractInvolved} Invoices detected with: Same supplier pattern, Invoice amount discrepancies, Payment timing anomalies`,
              fraudIndicators: [
                'Same Supplier',
                'Amount Discrepancies',
                'Timing Anomalies',
                'Status Patterns',
                cluster.riskScore >= 80 ? 'High Variance' : 'Moderate Variance',
              ],
              approvalThreshold: 1200000,
              thresholdLabel: 'Director',
              averagePOAmount: avgAmount,
              averageBelowThreshold: Math.max(0, 1200000 - avgAmount),
              averageBelowThresholdPercent: Math.max(0, ((1200000 - avgAmount) / 1200000) * 100),
              totalAmount: cluster.totalAmount,
              totalContract: cluster.contractInvolved,
              detectedAt: cluster.detectedAt,
              suspiciousPOs: invCluster.invoices.slice(0, cluster.contractInvolved).map((inv, idx) => ({
                poNumber: inv.number,
                date: inv.invoiceDate,
                amount: inv.invoiceAmount,
                supplier: inv.supplier.name,
                requisitioner: inv.po.pr.requester.name,
                material: inv.po.material.description,
              })),
            };
          } else {
            // PO cluster
            const poCluster = cluster.originalData as POCluster;
            const avgAmount = cluster.totalAmount / cluster.contractInvolved;
            details = {
              clusterId: cluster.clusterId,
              riskScore: cluster.riskScore,
              patternType: cluster.riskScore >= 80 ? 'Split Contract' : cluster.riskScore >= 50 ? 'Repeated Orders' : 'Volume Split',
              patternDescription: `${cluster.contractInvolved} POs detected with: Same supplier, Same requisitioner, Same buyer, Same material pattern detected`,
              fraudIndicators: [
                'Same Supplier',
                'Same Requisitioner',
                'Same Buyer',
                'Same Material',
                cluster.riskScore >= 80 ? 'Below Threshold' : 'Repeated Pattern',
              ],
              approvalThreshold: 1000000,
              thresholdLabel: 'Manager',
              averagePOAmount: avgAmount,
              averageBelowThreshold: Math.max(0, 1000000 - avgAmount),
              averageBelowThresholdPercent: Math.max(0, ((1000000 - avgAmount) / 1000000) * 100),
              totalAmount: cluster.totalAmount,
              totalContract: cluster.contractInvolved,
              detectedAt: cluster.detectedAt,
              suspiciousPOs: poCluster.pos.slice(0, cluster.contractInvolved).map((po, idx) => ({
                poNumber: po.number,
                date: po.createdAt,
                amount: po.totalValue,
                supplier: po.supplier.name,
                requisitioner: po.pr.requester.name,
                material: po.material.description,
              })),
            };
          }
        }
        
        return (
          <FraudPatternDetailsPanel
            details={details}
            onClose={() => setSelectedClusterDetails(null)}
          />
        );
      })()}
    </div>
    </>
  );
}


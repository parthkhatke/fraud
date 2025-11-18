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

interface TopSupplierByExposure {
  rank: number;
  supplier: string;
  totalContract: number;
  totalAmount: number;
}

interface TopEmployeeByExposure {
  rank: number;
  employee: string;
  totalContract: number;
  totalAmount: number;
}

export default function POClustersPanel({ entityType, onClose }: POClustersPanelProps) {
  const { poClusters, prClusters, invoiceClusters, suppliers, employees, pos, prs, invoices } = useFraudSimulation();
  const [sortColumn, setSortColumn] = useState<keyof UnifiedCluster | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedClusterDetails, setSelectedClusterDetails] = useState<string | null>(null);
  const [showDeepAnalytics, setShowDeepAnalytics] = useState(false);

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

  // Generate Deep Analytics Data
  const topSuppliersByExposure = useMemo<TopSupplierByExposure[]>(() => {
    // Aggregate data from all entities based on entity type
    const supplierMap = new Map<string, { totalContract: number; totalAmount: number }>();
    
    if (entityType === 'PO') {
      pos.forEach(po => {
        const supplierId = po.supplier.id;
        const existing = supplierMap.get(supplierId) || { totalContract: 0, totalAmount: 0 };
        supplierMap.set(supplierId, {
          totalContract: existing.totalContract + 1,
          totalAmount: existing.totalAmount + po.totalValue,
        });
      });
    } else if (entityType === 'PR') {
      prs.forEach(pr => {
        pr.supplierShortlist.forEach(supplier => {
          const supplierId = supplier.id;
          const existing = supplierMap.get(supplierId) || { totalContract: 0, totalAmount: 0 };
          const amount = pr.quantity * pr.estimatedUnitPrice;
          supplierMap.set(supplierId, {
            totalContract: existing.totalContract + 1,
            totalAmount: existing.totalAmount + amount,
          });
        });
      });
    } else if (entityType === 'Invoice') {
      invoices.forEach(inv => {
        const supplierId = inv.supplier.id;
        const existing = supplierMap.get(supplierId) || { totalContract: 0, totalAmount: 0 };
        supplierMap.set(supplierId, {
          totalContract: existing.totalContract + 1,
          totalAmount: existing.totalAmount + inv.invoiceAmount,
        });
      });
    }

    // Convert to array and sort by total amount
    const supplierArray = Array.from(supplierMap.entries())
      .map(([supplierId, data]) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        return {
          rank: 0, // Will be set after sorting
          supplier: supplier?.name || supplierId,
          totalContract: data.totalContract,
          totalAmount: data.totalAmount,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    // Add more dummy data to fill the space (15 entries total)
    const dummySuppliers = [
      'Essar Steel India Ltd.',
      'ArcelorMittal Nippon Steel India',
      'SAIL (Steel Authority of India Limited)',
      'Jindal Steel & Power Ltd.',
      'JSW Steel Ltd.',
      'Tata Steel Ltd.',
      'Vedanta Limited',
      'Hindalco Industries Ltd.',
      'NALCO (National Aluminium Company)',
      'Hindustan Zinc Limited',
      'Coal India Limited',
      'Bharat Petroleum Corporation',
      'Indian Oil Corporation',
      'Reliance Industries Limited',
      'Adani Enterprises Ltd.',
    ];
    const dummyAmounts = [
      4310000, 2600000, 2060000, 1870000, 1310000,
      980000, 875000, 720000, 650000, 580000,
      520000, 480000, 420000, 380000, 340000,
    ];
    const dummyContracts = [9, 7, 5, 2, 6, 8, 4, 3, 5, 4, 6, 3, 4, 5, 3];

    // Merge real data with dummy data, avoiding duplicates
    const existingSupplierNames = new Set(supplierArray.map(s => s.supplier));
    dummySuppliers.forEach((supplier, index) => {
      if (!existingSupplierNames.has(supplier) && supplierArray.length < 15) {
        supplierArray.push({
          rank: supplierArray.length + 1,
          supplier: supplier,
          totalContract: dummyContracts[index],
          totalAmount: dummyAmounts[index],
        });
      }
    });

    // Sort again and limit to 15
    return supplierArray
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 15)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [entityType, pos, prs, invoices, suppliers]);

  const topEmployeesByExposure = useMemo<TopEmployeeByExposure[]>(() => {
    // Aggregate data from all entities based on entity type
    const employeeMap = new Map<string, { totalContract: number; totalAmount: number }>();
    
    if (entityType === 'PO') {
      pos.forEach(po => {
        const employeeId = po.pr.requester.id;
        const existing = employeeMap.get(employeeId) || { totalContract: 0, totalAmount: 0 };
        employeeMap.set(employeeId, {
          totalContract: existing.totalContract + 1,
          totalAmount: existing.totalAmount + po.totalValue,
        });
      });
    } else if (entityType === 'PR') {
      prs.forEach(pr => {
        const employeeId = pr.requester.id;
        const existing = employeeMap.get(employeeId) || { totalContract: 0, totalAmount: 0 };
        const amount = pr.quantity * pr.estimatedUnitPrice;
        employeeMap.set(employeeId, {
          totalContract: existing.totalContract + 1,
          totalAmount: existing.totalAmount + amount,
        });
      });
    } else if (entityType === 'Invoice') {
      invoices.forEach(inv => {
        const employeeId = inv.po.pr.requester.id;
        const existing = employeeMap.get(employeeId) || { totalContract: 0, totalAmount: 0 };
        employeeMap.set(employeeId, {
          totalContract: existing.totalContract + 1,
          totalAmount: existing.totalAmount + inv.invoiceAmount,
        });
      });
    }

    // Convert to array and sort by total amount
    const employeeArray = Array.from(employeeMap.entries())
      .map(([employeeId, data]) => {
        const employee = employees.find(e => e.id === employeeId);
        return {
          rank: 0, // Will be set after sorting
          employee: employee?.name || employeeId,
          totalContract: data.totalContract,
          totalAmount: data.totalAmount,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    // Add more dummy data to fill the space (15 entries total)
    const dummyEmployees = [
      'Kavita Rao',
      'Anjali Mehta',
      'Vikram Singh',
      'Rohit Verma',
      'Pooja Desai',
      'Rohan Mehta',
      'Priya Sharma',
      'Amit Patel',
      'Sneha Reddy',
      'Rajesh Kumar',
      'Meera Nair',
      'Karan Malhotra',
      'Divya Iyer',
      'Arjun Deshmukh',
      'Neha Kapoor',
    ];
    const dummyAmounts = [
      6590000, 5210000, 1570000, 1400000, 910000,
      850000, 780000, 720000, 650000, 580000,
      520000, 480000, 420000, 380000, 340000,
    ];
    const dummyContracts = [12, 11, 6, 5, 3, 8, 7, 6, 5, 4, 6, 4, 3, 4, 3];

    // Merge real data with dummy data, avoiding duplicates
    const existingEmployeeNames = new Set(employeeArray.map(e => e.employee));
    dummyEmployees.forEach((employee, index) => {
      if (!existingEmployeeNames.has(employee) && employeeArray.length < 15) {
        employeeArray.push({
          rank: employeeArray.length + 1,
          employee: employee,
          totalContract: dummyContracts[index],
          totalAmount: dummyAmounts[index],
        });
      }
    });

    // Sort again and limit to 15
    return employeeArray
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 15)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [entityType, pos, prs, invoices, employees]);

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
        <div className="flex items-center gap-3">
          {showDeepAnalytics ? (
            <button
              onClick={() => {
                setShowDeepAnalytics(false);
              }}
              className="btn btn-outline btn-sm gap-2"
              title="View Clusters"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              View Clusters
            </button>
          ) : (
            <button
              onClick={() => {
                setShowDeepAnalytics(true);
                // Clear selected cluster details when opening deep analytics
                setSelectedClusterDetails(null);
              }}
              className="btn btn-outline btn-sm gap-2"
              title="Deep Analytics"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Deep Analytics
            </button>
          )}
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
      </div>

      {/* Deep Analytics View */}
      {showDeepAnalytics ? (
        <div className="flex-1 overflow-auto p-6 space-y-8">
          {/* Top Suppliers by Exposure */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Suppliers by Exposure</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SUPPLIER</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TOTAL CONTRACT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TOTAL AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topSuppliersByExposure.map((supplier) => (
                    <tr key={supplier.rank} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-500">#{supplier.rank}</span>
                          <span className="text-sm font-medium text-gray-900">{supplier.supplier}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{supplier.totalContract}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatAmount(supplier.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Employees by Exposure */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Employees by Exposure</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">EMPLOYEE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TOTAL CONTRACT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TOTAL AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topEmployeesByExposure.map((employee) => (
                    <tr key={employee.rank} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-500">#{employee.rank}</span>
                          <span className="text-sm font-medium text-gray-900">{employee.employee}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{employee.totalContract}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatAmount(employee.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
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
      </>
      )}
      
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
            const approvalThreshold = 1200000;
            
            // Generate random "average below threshold" value for realism
            // For invoices, some might be slightly below threshold, so generate random values
            // between 0 and a reasonable percentage of the threshold (0-15% below)
            const randomBelowPercent = Math.random() * 15; // 0-15% below threshold
            const averageBelowThreshold = (approvalThreshold * randomBelowPercent) / 100;
            const averageBelowThresholdPercent = randomBelowPercent;
            
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
              approvalThreshold: approvalThreshold,
              thresholdLabel: 'Director',
              averagePOAmount: avgAmount,
              averageBelowThreshold: averageBelowThreshold,
              averageBelowThresholdPercent: averageBelowThresholdPercent,
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


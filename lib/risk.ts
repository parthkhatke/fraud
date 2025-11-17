import {
  Supplier,
  Employee,
  PO,
  Invoice,
  PatternAnalysisResult,
} from './types';

export function getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore >= 0.8) return 'critical';
  if (riskScore >= 0.6) return 'high';
  if (riskScore >= 0.4) return 'medium';
  return 'low';
}

export function getRiskColor(riskScore: number): 'error' | 'warning' | 'info' | 'success' {
  if (riskScore >= 0.8) return 'error';
  if (riskScore >= 0.6) return 'warning';
  if (riskScore >= 0.4) return 'info';
  return 'success';
}

export function getRiskBorderClass(riskScore: number): string {
  if (riskScore >= 0.8) return 'border-error';
  if (riskScore >= 0.6) return 'border-warning';
  if (riskScore >= 0.4) return 'border-info';
  return 'border-success';
}

export function getRiskBgClass(riskScore: number): string {
  if (riskScore >= 0.8) return 'bg-error';
  if (riskScore >= 0.6) return 'bg-warning';
  if (riskScore >= 0.4) return 'bg-info';
  return 'bg-success';
}

export function getRiskTextClass(riskScore: number): string {
  if (riskScore >= 0.8) return 'text-error';
  if (riskScore >= 0.6) return 'text-warning';
  if (riskScore >= 0.4) return 'text-info';
  return 'text-success';
}

export function computePatternAnalysis(
  pos: PO[],
  invoices: Invoice[]
): PatternAnalysisResult {
  // Top Supplier by Material
  const supplierMaterialMap = new Map<string, {
    supplierName: string;
    materialDescription: string;
    totalValue: number;
    highRiskPOCount: number;
  }>();

  pos.forEach((po) => {
    const key = `${po.supplier.id}-${po.material.id}`;
    const existing = supplierMaterialMap.get(key);
    const isHighRisk = po.riskScore >= 0.6;

    if (existing) {
      existing.totalValue += po.totalValue;
      if (isHighRisk) existing.highRiskPOCount++;
    } else {
      supplierMaterialMap.set(key, {
        supplierName: po.supplier.name,
        materialDescription: po.material.description,
        totalValue: po.totalValue,
        highRiskPOCount: isHighRisk ? 1 : 0,
      });
    }
  });

  const topSupplierByMaterial = Array.from(supplierMaterialMap.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  // Top Employee by Supplier
  const employeeSupplierMap = new Map<string, {
    employeeName: string;
    supplierName: string;
    totalPOValue: number;
    invoiceOnHoldCount: number;
  }>();

  pos.forEach((po) => {
    const key = `${po.pr.requester.id}-${po.supplier.id}`;
    const existing = employeeSupplierMap.get(key);
    const onHoldInvoices = invoices.filter(
      (inv) => inv.po.id === po.id && inv.status === 'On Hold'
    ).length;

    if (existing) {
      existing.totalPOValue += po.totalValue;
      existing.invoiceOnHoldCount += onHoldInvoices;
    } else {
      employeeSupplierMap.set(key, {
        employeeName: po.pr.requester.name,
        supplierName: po.supplier.name,
        totalPOValue: po.totalValue,
        invoiceOnHoldCount: onHoldInvoices,
      });
    }
  });

  const topEmployeeBySupplier = Array.from(employeeSupplierMap.values())
    .sort((a, b) => b.totalPOValue - a.totalPOValue)
    .slice(0, 10);

  return {
    topSupplierByMaterial,
    topEmployeeBySupplier,
  };
}


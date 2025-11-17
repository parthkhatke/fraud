export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Supplier {
  id: string;
  name: string;
  country: string;
  city: string;
  category: 'Raw Material' | 'Services' | 'Packaging' | 'Logistics';
  avgLeadTimeDays: number;
  onTimeDeliveryRate: number; // 0-1
  riskScore: number; // 0-1
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
}

export interface Material {
  id: string;
  code: string;
  description: string;
  category: string;
}

export interface PR {
  id: string;
  number: string;
  requester: Employee;
  department: string;
  material: Material;
  quantity: number;
  estimatedUnitPrice: number;
  createdAt: string;
  status:
    | 'Draft'
    | 'Approved'
    | 'RFQ In Progress'
    | 'PO Created'
    | 'Closed';
  supplierShortlist: Supplier[];
  riskScore: number; // 0-1
}

export interface PO {
  id: string;
  number: string;
  pr: PR;
  supplier: Supplier;
  material: Material;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  createdAt: string;
  status: 'Open' | 'Partially Received' | 'Closed' | 'Blocked';
  riskScore: number;
}

export interface GR {
  id: string;
  number: string;
  po: PO;
  receivedQty: number;
  receivedAt: string;
  discrepancyPct: number; // e.g. 0.1 = 10% short
  riskScore: number;
}

export interface Invoice {
  id: string;
  number: string;
  supplier: Supplier;
  po: PO;
  gr: GR | null;
  invoiceAmount: number;
  currency: 'USD' | 'EUR' | 'INR';
  invoiceDate: string;
  dueDate: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'On Hold';
  riskScore: number;
}

export interface FraudAlert {
  id: string;
  entityType: 'PR' | 'PO' | 'GR' | 'Invoice' | 'Supplier';
  entityId: string;
  reason: string;
  severity: RiskLevel;
  createdAt: string;
  suggestedActions: string[];
  simulationStepIndex?: number; // When to fire in simulation
}

export type ProcessNodeKind =
  | 'pr'
  | 'existingSupplier'
  | 'rfq'
  | 'po'
  | 'gr'
  | 'goodsIssue'
  | 'invoice'
  | 'payment';

export interface ProcessNodeData {
  label: string;
  description?: string;
  stepNumbers: number[];
  stage: ProcessNodeKind;
  riskScore?: number;
  hasActiveAlert?: boolean;
  isActive?: boolean;
}

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface InvestigationTicket {
  id: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  status: 'Open' | 'In Progress' | 'Resolved';
}

export interface PendingAction {
  id: string;
  type: 'Request More Information';
  entityType: string;
  entityId: string;
  managerName: string;
  status: 'Awaiting response';
  createdAt: string;
}

export interface PatternAnalysisResult {
  topSupplierByMaterial: Array<{
    supplierName: string;
    materialDescription: string;
    totalValue: number;
    highRiskPOCount: number;
  }>;
  topEmployeeBySupplier: Array<{
    employeeName: string;
    supplierName: string;
    totalPOValue: number;
    invoiceOnHoldCount: number;
  }>;
}


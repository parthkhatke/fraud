import {
  PR,
  PO,
  Invoice,
  Supplier,
  Employee,
  Material,
  GR,
} from './types';
import { subDays, format } from 'date-fns';

// Seeded random number generator for deterministic results
class SeededRandom {
  private seed: number;
  
  constructor(seed: number = 12345) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
  
  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

// Create a single instance with fixed seed for deterministic generation
const seededRandom = new SeededRandom(12345);

// Helper to generate dates
const randomDate = (daysAgo: number) => {
  return format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
};

// Helper to generate more PRs
export function generateMorePRs(
  count: number,
  existingCount: number,
  employees: Employee[],
  materials: Material[],
  suppliers: Supplier[]
): PR[] {
  const additionalPRs: PR[] = [];
  for (let i = 0; i < count; i++) {
    const randomEmployee = employees[seededRandom.nextInt(employees.length)];
    const randomMaterial = materials[seededRandom.nextInt(materials.length)];
    const randomSupplier = suppliers[seededRandom.nextInt(suppliers.length)];
    
    const quantity = Math.floor(seededRandom.nextRange(50, 550));
    const estimatedUnitPrice = seededRandom.nextRange(20, 220);
    const riskScore = seededRandom.next();
    
    additionalPRs.push({
      id: `PR-${String(existingCount + i + 1).padStart(3, '0')}`,
      number: `PR-2024-${String(existingCount + i + 1).padStart(4, '0')}`,
      requester: randomEmployee,
      department: randomEmployee.department,
      material: randomMaterial,
      quantity,
      estimatedUnitPrice,
      createdAt: randomDate(seededRandom.nextInt(180)),
      status: ['Draft', 'Approved', 'RFQ In Progress', 'PO Created', 'Closed'][seededRandom.nextInt(5)] as any,
      supplierShortlist: [randomSupplier],
      riskScore,
    });
  }
  return additionalPRs;
}

// Helper to generate more POs
export function generateMorePOs(
  count: number,
  existingCount: number,
  prs: PR[],
  suppliers: Supplier[]
): PO[] {
  const additionalPOs: PO[] = [];
  for (let i = 0; i < count; i++) {
    const randomPR = prs[seededRandom.nextInt(prs.length)];
    const randomSupplier = suppliers[seededRandom.nextInt(suppliers.length)];
    
    const quantity = Math.floor(seededRandom.nextRange(50, 550));
    const unitPrice = seededRandom.nextRange(20, 220);
    const totalValue = quantity * unitPrice;
    const riskScore = seededRandom.next();
    
    additionalPOs.push({
      id: `PO-${String(existingCount + i + 1).padStart(3, '0')}`,
      number: `PO-2024-${String(existingCount + i + 1).padStart(4, '0')}`,
      pr: randomPR,
      supplier: randomSupplier,
      material: randomPR.material,
      quantity,
      unitPrice,
      totalValue,
      createdAt: randomDate(seededRandom.nextInt(180)),
      status: ['Open', 'Partially Received', 'Closed', 'Blocked'][seededRandom.nextInt(4)] as any,
      riskScore,
    });
  }
  return additionalPOs;
}

// Helper to generate more Invoices
export function generateMoreInvoices(
  count: number,
  existingCount: number,
  pos: PO[],
  grs: GR[]
): Invoice[] {
  const additionalInvoices: Invoice[] = [];
  for (let i = 0; i < count; i++) {
    const randomPO = pos[seededRandom.nextInt(pos.length)];
    const randomGR = seededRandom.next() > 0.3 ? grs[seededRandom.nextInt(grs.length)] : null;
    
    const invoiceAmount = randomPO.totalValue * (0.95 + seededRandom.next() * 0.1); // ±5% variance
    const riskScore = seededRandom.next();
    const invoiceDaysAgo = seededRandom.nextInt(180);
    
    additionalInvoices.push({
      id: `INV-${String(existingCount + i + 1).padStart(3, '0')}`,
      number: `INV-2024-${String(existingCount + i + 1).padStart(4, '0')}`,
      supplier: randomPO.supplier,
      po: randomPO,
      gr: randomGR,
      invoiceAmount,
      currency: 'INR',
      invoiceDate: randomDate(invoiceDaysAgo),
      dueDate: randomDate(Math.max(0, invoiceDaysAgo - 30)),
      status: ['Pending', 'Approved', 'Paid', 'On Hold'][seededRandom.nextInt(4)] as any,
      riskScore,
    });
  }
  return additionalInvoices;
}


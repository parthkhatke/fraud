'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  Supplier,
  Employee,
  Material,
  PR,
  PO,
  GR,
  Invoice,
  FraudAlert,
  SimulationStatus,
  InvestigationTicket,
  PendingAction,
  PatternAnalysisResult,
  POCluster,
  PRCluster,
  InvoiceCluster,
} from '@/lib/types';
import {
  mockSuppliers,
  mockEmployees,
  mockMaterials,
  mockPRs,
  mockPOs,
  mockGRs,
  mockInvoices,
  mockFraudAlerts,
  allMockPRs,
  allMockPOs,
  allMockInvoices,
  mockPOClusters,
  mockPRClusters,
  mockInvoiceClusters,
} from '@/lib/mockData';
import { computePatternAnalysis } from '@/lib/risk';

interface FraudSimulationContextType {
  // Data
  suppliers: Supplier[];
  employees: Employee[];
  materials: Material[];
  prs: PR[];
  pos: PO[];
  grs: GR[];
  invoices: Invoice[];
  allAlerts: FraudAlert[];
  activeAlerts: FraudAlert[];
  tickets: InvestigationTicket[];
  pendingActions: PendingAction[];
  patternAnalysis: PatternAnalysisResult | null;
  poClusters: POCluster[];
  prClusters: PRCluster[];
  invoiceClusters: InvoiceCluster[];

  // Simulation state
  simulationStatus: SimulationStatus;
  currentStepIndex: number;
  selectedEntity: string | null;
  selectedProcessNodeId: string | null;
  selectedKnowledgeNodeId: string | null;
  activeAlertModal: FraudAlert | null;
  sidePanelEntityType: 'PR' | 'PO' | 'Invoice' | null;

  // Actions
  initializeSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  triggerAlert: (alertId: string) => void;
  handleContextAction: (
    action: 'Request More Information' | 'Create Investigation Ticket' | 'Run Pattern Analysis (ML)',
    entityType: string,
    entityId: string
  ) => void;
  clearPatternAnalysis: () => void;
  selectEntity: (entityId: string | null) => void;
  selectProcessNode: (nodeId: string | null) => void;
  selectKnowledgeNode: (nodeId: string | null) => void;
  setActiveAlertModal: (alert: FraudAlert | null) => void;
  currentActiveNodeId: string | null;
  markAlertAsMistake: (alertId: string) => void;
  reportAlert: (alertId: string) => void;
  downloadAlertReport: (alert: FraudAlert) => void;
  openSidePanel: (entityType: 'PR' | 'PO' | 'Invoice') => void;
  closeSidePanel: () => void;
}

const FraudSimulationContext = createContext<FraudSimulationContextType | undefined>(undefined);

// Define dummy alerts that should always be preserved (defined outside component to avoid recreation)
const getDummyAlerts = (): FraudAlert[] => [
  { ...mockFraudAlerts[0], isDummy: true }, // ALERT-001 - Invoice
  { ...mockFraudAlerts[1], isDummy: true }, // ALERT-002 - PO
  { ...mockFraudAlerts[2], isDummy: true }, // ALERT-003 - Invoice
  { ...mockFraudAlerts[3], isDummy: true }, // ALERT-004 - GR
  { ...(mockFraudAlerts[4] || mockFraudAlerts[0]), isDummy: true }, // ALERT-005 or fallback
];

export function FraudSimulationProvider({ children }: { children: React.ReactNode }) {
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Initialize with 5 dummy alerts that won't affect diagram nodes
  const [activeAlerts, setActiveAlerts] = useState<FraudAlert[]>(() => getDummyAlerts());
  
  const [tickets, setTickets] = useState<InvestigationTicket[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysisResult | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedProcessNodeId, setSelectedProcessNodeId] = useState<string | null>(null);
  const [selectedKnowledgeNodeId, setSelectedKnowledgeNodeId] = useState<string | null>(null);
  const [activeAlertModal, setActiveAlertModal] = useState<FraudAlert | null>(null);
  const [ignoredAlerts, setIgnoredAlerts] = useState<Set<string>>(new Set());
  const [currentActiveNodeId, setCurrentActiveNodeId] = useState<string | null>(null);
  const [sidePanelEntityType, setSidePanelEntityType] = useState<'PR' | 'PO' | 'Invoice' | null>(null);

  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const runSimulationCycle = useCallback(() => {
    // Define node order matching the new flowchart structure
    const nodeOrder = ['identifyRequirement', 'pr', 'plannedDelivery', 'goodsShipment', 'procurementOfMaterial', 'existingSupplier', 'identificationOfVendor', 'selectionOfVendor', 'po', 'goodsIssue', 'invoice', 'payment'];
    
    // Get current position or start from beginning
    let currentNodeIndex = currentActiveNodeId 
      ? nodeOrder.indexOf(currentActiveNodeId) 
      : -1;
    
    // If current node not found, start from beginning
    if (currentNodeIndex < 0) {
      currentNodeIndex = -1; // Will be incremented to 0 on first step
    }
    // If resuming, we stay at current index - the interval will move to next node

    const cycleInterval = setInterval(() => {
      // Move to next node
      currentNodeIndex++;
      
      // If we've completed the cycle, restart from the beginning
      if (currentNodeIndex >= nodeOrder.length) {
        currentNodeIndex = 0; // Reset to start
        // Clear non-dummy alerts for new cycle, but keep dummy alerts
        setActiveAlerts((prev) => prev.filter((alert) => alert.isDummy === true));
      }

      const nextNodeId = nodeOrder[currentNodeIndex];
      setCurrentActiveNodeId(nextNodeId);
      setCurrentStepIndex(currentNodeIndex);

      // Random chance to trigger alert (30% chance at each step after first 2)
      if (currentNodeIndex >= 2 && Math.random() < 0.3) {
        // Find alerts that match this node type
        const nodeTypeMap: Record<string, string[]> = {
          identifyRequirement: ['PR'],
          pr: ['PR'],
          plannedDelivery: ['PR'],
          goodsShipment: ['GR'],
          procurementOfMaterial: ['PR'],
          existingSupplier: ['Supplier'],
          identificationOfVendor: ['PR'],
          selectionOfVendor: ['Supplier'],
          po: ['PO'],
          goodsIssue: ['GR'],
          invoice: ['Invoice'],
          payment: ['Invoice'],
        };

        const possibleEntityTypes = nodeTypeMap[nextNodeId] || [];
        const availableAlerts = mockFraudAlerts.filter(
          (alert) =>
            possibleEntityTypes.includes(alert.entityType) &&
            !ignoredAlerts.has(alert.id) &&
            !activeAlerts.find((a) => a.id === alert.id)
        );

        if (availableAlerts.length > 0) {
          // Pick a random alert
          const alertToFire = availableAlerts[Math.floor(Math.random() * availableAlerts.length)];
          
          // Add alert to list but don't pause simulation or show modal
          setActiveAlerts((prev) => {
            // Only add if not already in the list
            if (!prev.find((a) => a.id === alertToFire.id)) {
              return [...prev, alertToFire];
            }
            return prev;
          });
          // Don't show modal or pause during training
          // setActiveAlertModal(alertToFire);
        }
      }
    }, 1500); // 1.5 seconds per step

    simulationIntervalRef.current = cycleInterval;
  }, [ignoredAlerts, activeAlerts, currentActiveNodeId]);

  const initializeSimulation = useCallback(() => {
    setSimulationStatus('running');
    setCurrentStepIndex(0);
    // Reset to dummy alerts only, preserving them
    setActiveAlerts(getDummyAlerts());
    setActiveAlertModal(null);
    setCurrentActiveNodeId('identifyRequirement'); // Start from Identify Requirement

    // Clear any existing interval
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    // Start the simulation cycle (which will loop automatically)
    runSimulationCycle();
  }, [runSimulationCycle]);

  const pauseSimulation = useCallback(() => {
    setSimulationStatus('paused');
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  const resumeSimulation = useCallback(() => {
    if (simulationStatus === 'paused') {
      setSimulationStatus('running');
      // Move to next node before resuming (since current node already triggered alert)
      const nodeOrder = ['identifyRequirement', 'pr', 'plannedDelivery', 'goodsShipment', 'procurementOfMaterial', 'existingSupplier', 'identificationOfVendor', 'selectionOfVendor', 'po', 'goodsIssue', 'invoice', 'payment'];
      const currentIndex = currentActiveNodeId ? nodeOrder.indexOf(currentActiveNodeId) : -1;
      if (currentIndex >= 0 && currentIndex < nodeOrder.length - 1) {
        // Move to next node
        setCurrentActiveNodeId(nodeOrder[currentIndex + 1]);
        setCurrentStepIndex(currentIndex + 1);
      } else if (currentIndex >= nodeOrder.length - 1) {
        // If at last node, restart cycle
        setCurrentActiveNodeId('identifyRequirement');
        setCurrentStepIndex(0);
        // Clear non-dummy alerts, but keep dummy alerts
        setActiveAlerts((prev) => prev.filter((alert) => alert.isDummy === true));
      }
      // Resume the simulation cycle
      runSimulationCycle();
    }
  }, [simulationStatus, runSimulationCycle, currentActiveNodeId]);

  const resetSimulation = useCallback(() => {
    setSimulationStatus('idle');
    setCurrentStepIndex(0);
    // Reset to dummy alerts only
    setActiveAlerts(getDummyAlerts());
    setActiveAlertModal(null);
    setCurrentActiveNodeId(null);
    setSelectedEntity(null);
    setSelectedProcessNodeId(null);
    setSelectedKnowledgeNodeId(null);

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  const markAlertAsMistake = useCallback((alertId: string) => {
    setIgnoredAlerts((prev) => new Set([...prev, alertId]));
    setActiveAlertModal(null);
    // Automatically resume simulation after a short delay
    setTimeout(() => {
      if (simulationStatus === 'paused') {
        resumeSimulation();
      }
    }, 300);
  }, [simulationStatus, resumeSimulation]);

  const reportAlert = useCallback((alertId: string) => {
    const ticketId = `FRD-2024-${String(tickets.length + 1).padStart(4, '0')}`;
    const alert = mockFraudAlerts.find((a) => a.id === alertId);
    if (alert) {
      const newTicket: InvestigationTicket = {
        id: ticketId,
        entityType: alert.entityType,
        entityId: alert.entityId,
        createdAt: new Date().toISOString(),
        status: 'Open',
      };
      setTickets((prev) => [...prev, newTicket]);
    }
    setActiveAlertModal(null);
    // Automatically resume simulation after a short delay
    setTimeout(() => {
      if (simulationStatus === 'paused') {
        resumeSimulation();
      }
    }, 300);
  }, [tickets.length, simulationStatus, resumeSimulation]);

  const downloadAlertReport = useCallback((alert: FraudAlert) => {
    // Find entity details
    let entity: any = null;
    if (alert.entityType === 'Invoice') {
      entity = mockInvoices.find((inv) => inv.id === alert.entityId);
    } else if (alert.entityType === 'PO') {
      entity = mockPOs.find((po) => po.id === alert.entityId);
    } else if (alert.entityType === 'GR') {
      entity = mockGRs.find((gr) => gr.id === alert.entityId);
    } else if (alert.entityType === 'PR') {
      entity = mockPRs.find((pr) => pr.id === alert.entityId);
    } else if (alert.entityType === 'Supplier') {
      entity = mockSuppliers.find((sup) => sup.id === alert.entityId);
    }

    // Create report content
    const report = {
      alertId: alert.id,
      timestamp: new Date().toISOString(),
      entityType: alert.entityType,
      entityId: alert.entityId,
      severity: alert.severity,
      reason: alert.reason,
      suggestedActions: alert.suggestedActions,
      entityDetails: entity,
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraud-alert-${alert.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Automatically resume simulation after download
    setActiveAlertModal(null);
    setTimeout(() => {
      if (simulationStatus === 'paused') {
        resumeSimulation();
      }
    }, 300);
  }, [simulationStatus, resumeSimulation]);

  const triggerAlert = useCallback((alertId: string) => {
    const alert = mockFraudAlerts.find((a) => a.id === alertId);
    if (alert && !activeAlerts.find((a) => a.id === alertId)) {
      setActiveAlerts((prev) => [...prev, alert]);
      setActiveAlertModal(alert);
    }
  }, [activeAlerts]);

  const handleContextAction = useCallback((
    action: 'Request More Information' | 'Create Investigation Ticket' | 'Run Pattern Analysis (ML)',
    entityType: string,
    entityId: string
  ) => {
    if (action === 'Request More Information') {
      const newAction: PendingAction = {
        id: `PEND-${Date.now()}`,
        type: 'Request More Information',
        entityType,
        entityId,
        managerName: 'John Manager',
        status: 'Awaiting response',
        createdAt: new Date().toISOString(),
      };
      setPendingActions((prev) => [...prev, newAction]);
    } else if (action === 'Create Investigation Ticket') {
      const ticketId = `FRD-2024-${String(tickets.length + 1).padStart(4, '0')}`;
      const newTicket: InvestigationTicket = {
        id: ticketId,
        entityType,
        entityId,
        createdAt: new Date().toISOString(),
        status: 'Open',
      };
      setTickets((prev) => [...prev, newTicket]);
    } else if (action === 'Run Pattern Analysis (ML)') {
      // Toggle pattern analysis - if already open, close it
      if (patternAnalysis) {
        setPatternAnalysis(null);
      } else {
        const analysis = computePatternAnalysis(allMockPOs, allMockInvoices);
        setPatternAnalysis(analysis);
      }
    }
  }, [tickets.length, patternAnalysis]);

  const clearPatternAnalysis = useCallback(() => {
    setPatternAnalysis(null);
  }, []);

  const openSidePanel = useCallback((entityType: 'PR' | 'PO' | 'Invoice') => {
    setSidePanelEntityType(entityType);
  }, []);

  const closeSidePanel = useCallback(() => {
    setSidePanelEntityType(null);
  }, []);

  const value: FraudSimulationContextType = {
    suppliers: mockSuppliers,
    employees: mockEmployees,
    materials: mockMaterials,
    prs: allMockPRs,
    pos: allMockPOs,
    grs: mockGRs,
    invoices: allMockInvoices,
    allAlerts: mockFraudAlerts,
    activeAlerts,
    tickets,
    pendingActions,
    patternAnalysis,
    poClusters: mockPOClusters,
    prClusters: mockPRClusters,
    invoiceClusters: mockInvoiceClusters,
    simulationStatus,
    currentStepIndex,
    selectedEntity,
    selectedProcessNodeId,
    selectedKnowledgeNodeId,
    activeAlertModal,
    sidePanelEntityType,
    initializeSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    triggerAlert,
    handleContextAction,
    selectEntity: setSelectedEntity,
    selectProcessNode: setSelectedProcessNodeId,
    selectKnowledgeNode: setSelectedKnowledgeNodeId,
    setActiveAlertModal,
    clearPatternAnalysis,
    currentActiveNodeId,
    markAlertAsMistake,
    reportAlert,
    downloadAlertReport,
    openSidePanel,
    closeSidePanel,
  };

  return (
    <FraudSimulationContext.Provider value={value}>
      {children}
    </FraudSimulationContext.Provider>
  );
}

export function useFraudSimulation() {
  const context = useContext(FraudSimulationContext);
  if (context === undefined) {
    throw new Error('useFraudSimulation must be used within a FraudSimulationProvider');
  }
  return context;
}


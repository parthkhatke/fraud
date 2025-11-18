'use client';

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ProcessNode from './ProcessNode';
import { useFraudSimulation } from '@/context/FraudSimulationContext';
import { ProcessNodeData } from '@/lib/types';

const nodeTypes = {
  process: ProcessNode,
};

export default function ProcessFlowCanvas() {
  const {
    activeAlerts,
    selectedProcessNodeId,
    currentStepIndex,
    simulationStatus,
    selectProcessNode,
    handleContextAction,
    currentActiveNodeId,
    setActiveAlertModal,
    openSidePanel,
  } = useFraudSimulation();

  // Define process nodes matching the flowchart structure - exact layout
  const initialNodes: Node<ProcessNodeData>[] = useMemo(() => [
    // Top row - Goods flow (y: 0)
    {
      id: 'goodsShipment',
      type: 'process',
      position: { x: 750, y: 0 },
      data: {
        label: 'Goods Shipment',
        description: 'Goods Shipment',
        stepNumbers: [7],
        stage: 'goodsShipment',
        riskScore: 0.4,
      },
    },
    {
      id: 'goodsIssue',
      type: 'process',
      position: { x: 1000, y: 0 },
      data: {
        label: 'Goods Issue to user Dept',
        description: 'Accounting Entry Happens',
        stepNumbers: [18, 19],
        stage: 'goodsIssue',
        riskScore: 0.3,
      },
    },
    {
      id: 'invoice',
      type: 'process',
      position: { x: 1250, y: 0 },
      data: {
        label: 'Invoice Recording',
        description: 'Accounting Entry Happens',
        stepNumbers: [20],
        stage: 'invoice',
        riskScore: 0.75,
      },
    },
    {
      id: 'payment',
      type: 'process',
      position: { x: 1500, y: 0 },
      data: {
        label: 'Payment to Supplier',
        description: 'Accounting Entry Happens',
        stepNumbers: [21],
        stage: 'payment',
        riskScore: 0.2,
      },
    },
    // Middle row - Initial flow and PO (y: 150)
    {
      id: 'identifyRequirement',
      type: 'process',
      position: { x: 0, y: 150 },
      data: {
        label: 'Identify Requirement of user',
        description: 'User Requirement Identification',
        stepNumbers: [1],
        stage: 'identifyRequirement',
        riskScore: 0.2,
      },
    },
    {
      id: 'pr',
      type: 'process',
      position: { x: 250, y: 150 },
      data: {
        label: 'PR',
        description: 'Purchase Request Creation',
        stepNumbers: [2, 3, 4, 5],
        stage: 'pr',
        riskScore: 0.5,
      },
    },
    {
      id: 'plannedDelivery',
      type: 'process',
      position: { x: 500, y: 150 },
      data: {
        label: 'Planned delivery',
        description: 'Check Planned Delivery',
        stepNumbers: [6],
        stage: 'plannedDelivery',
        riskScore: 0.3,
      },
    },
    {
      id: 'po',
      type: 'process',
      position: { x: 1000, y: 150 },
      data: {
        label: 'PO',
        description: 'Purchase Order',
        stepNumbers: [16, 17],
        stage: 'po',
        riskScore: 0.7,
      },
    },
    // Bottom row - Alternative flow / Vendor selection (y: 300)
    {
      id: 'procurementOfMaterial',
      type: 'process',
      position: { x: 750, y: 300 },
      data: {
        label: 'Procurement of material',
        description: 'Material Procurement',
        stepNumbers: [8],
        stage: 'procurementOfMaterial',
        riskScore: 0.5,
      },
    },
    {
      id: 'existingSupplier',
      type: 'process',
      position: { x: 1000, y: 300 },
      data: {
        label: 'Existing Contracted Supplier',
        description: 'Supplier Selection',
        stepNumbers: [9],
        stage: 'existingSupplier',
        riskScore: 0.6,
      },
    },
    {
      id: 'identificationOfVendor',
      type: 'process',
      position: { x: 1250, y: 300 },
      data: {
        label: 'Identification of Vendor / RFQ',
        description: 'Vendor Identification',
        stepNumbers: [10, 11, 12, 13, 14],
        stage: 'identificationOfVendor',
        riskScore: 0.4,
      },
    },
    {
      id: 'selectionOfVendor',
      type: 'process',
      position: { x: 1500, y: 300 },
      data: {
        label: 'Selection of Vendor',
        description: 'Vendor Selection',
        stepNumbers: [15],
        stage: 'selectionOfVendor',
        riskScore: 0.7,
      },
    },
  ], []);

  const initialEdges: Edge[] = useMemo(() => [
    // Main flow - Top row
    { id: 'e1', source: 'identifyRequirement', target: 'pr', animated: false },
    { id: 'e2', source: 'pr', target: 'plannedDelivery', animated: false },
    
    // Planned delivery branches - YES goes to top row, NO goes to bottom row
    { id: 'e3-yes', source: 'plannedDelivery', target: 'goodsShipment', animated: false, label: 'YES', labelStyle: { fill: '#10b981', fontWeight: 600 }, style: { strokeWidth: 2 } },
    { id: 'e3-no', source: 'plannedDelivery', target: 'procurementOfMaterial', animated: false, label: 'NO', labelStyle: { fill: '#ef4444', fontWeight: 600 }, style: { strokeWidth: 2 } },
    
    // Goods shipment path (top row continuation)
    { id: 'e4', source: 'goodsShipment', target: 'goodsIssue', animated: false },
    
    // Procurement path (bottom row)
    { id: 'e5', source: 'procurementOfMaterial', target: 'existingSupplier', animated: false },
    
    // Existing supplier branches - YES goes up to PO, NO continues on bottom row
    { id: 'e6-yes', source: 'existingSupplier', target: 'po', animated: false, label: 'YES', labelStyle: { fill: '#10b981', fontWeight: 600 }, style: { strokeWidth: 2 } },
    { id: 'e6-no', source: 'existingSupplier', target: 'identificationOfVendor', animated: false, label: 'NO', labelStyle: { fill: '#ef4444', fontWeight: 600 }, style: { strokeWidth: 2 } },
    
    // Vendor identification path (bottom row continuation)
    { id: 'e7', source: 'identificationOfVendor', target: 'selectionOfVendor', animated: false },
    { id: 'e8', source: 'selectionOfVendor', target: 'po', animated: false },
    
    // PO to goods issue (merges back to top row)
    { id: 'e9', source: 'po', target: 'goodsIssue', animated: false },
    
    // Final flow (top row)
    { id: 'e10', source: 'goodsIssue', target: 'invoice', animated: false },
    { id: 'e11', source: 'invoice', target: 'payment', animated: false },
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes based on alerts and simulation state
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const alertForNode = activeAlerts.find((alert) => {
          // Skip dummy alerts that shouldn't affect node colors
          if (alert.isDummy) return false;
          const nodeMap: Record<string, string> = {
            PR: 'pr',
            PO: 'po',
            GR: 'goodsIssue',
            Invoice: 'invoice',
            Supplier: 'existingSupplier',
          };
          return nodeMap[alert.entityType] === node.id;
        });

        const isActive = currentActiveNodeId === node.id && simulationStatus === 'running';
        const hasAlert = !!alertForNode;
        
        // Nodes that should have red border outline
        const redBorderNodes = ['pr', 'po', 'invoice'];
        const shouldHaveRedBorder = redBorderNodes.includes(node.id);

        return {
          ...node,
          data: {
            ...node.data,
            hasActiveAlert: hasAlert,
            isActive: isActive,
            hasRedBorder: shouldHaveRedBorder,
          },
          selected: selectedProcessNodeId === node.id,
          style: {
            ...node.style,
            opacity: isActive ? 1 : hasAlert ? 1 : 0.7,
          },
        };
      })
    );
  }, [activeAlerts, selectedProcessNodeId, currentActiveNodeId, simulationStatus, setNodes]);

  // Animate edges during simulation - only animate up to current active node
  React.useEffect(() => {
    if (simulationStatus === 'running' && currentActiveNodeId) {
      const nodeOrder = ['identifyRequirement', 'pr', 'plannedDelivery', 'goodsShipment', 'procurementOfMaterial', 'existingSupplier', 'identificationOfVendor', 'selectionOfVendor', 'po', 'goodsIssue', 'invoice', 'payment'];
      const edgeIds = ['e1', 'e2', 'e3-yes', 'e3-no', 'e4', 'e5', 'e6-yes', 'e6-no', 'e7', 'e8', 'e9', 'e10', 'e11'];
      const currentNodeIndex = nodeOrder.indexOf(currentActiveNodeId);
      
      setEdges((eds) =>
        eds.map((edge) => {
          const edgeIndex = edgeIds.indexOf(edge.id);
          return {
            ...edge,
            animated: edgeIndex >= 0 && edgeIndex <= currentNodeIndex * 2, // Approximate animation
          };
        })
      );
    } else {
      setEdges((eds) => eds.map((edge) => ({ ...edge, animated: false })));
    }
  }, [simulationStatus, currentActiveNodeId, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<ProcessNodeData>) => {
      selectProcessNode(node.id);
      
      // Check if this is a clickable node (PR, PO, or Invoice)
      const clickableNodes: Record<string, 'PR' | 'PO' | 'Invoice'> = {
        pr: 'PR',
        po: 'PO',
        invoice: 'Invoice',
      };
      
      const entityType = clickableNodes[node.data.stage];
      if (entityType) {
        // Open side panel for PR, PO, or Invoice nodes
        openSidePanel(entityType);
        return;
      }
      
      // If node has an alert, show the alert modal
      const alertForNode = activeAlerts.find((alert) => {
        const nodeMap: Record<string, string> = {
          PR: 'pr',
          PO: 'po',
          GR: 'goodsIssue',
          Invoice: 'invoice',
          Supplier: 'existingSupplier',
        };
        return nodeMap[alert.entityType] === node.id;
      });

      if (alertForNode) {
        setActiveAlertModal(alertForNode);
      }
    },
    [selectProcessNode, activeAlerts, setActiveAlertModal, openSidePanel]
  );

  return (
    <div className="flex-1 w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-slate-50"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}


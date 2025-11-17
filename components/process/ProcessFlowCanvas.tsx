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
  } = useFraudSimulation();

  // Define process nodes
  const initialNodes: Node<ProcessNodeData>[] = useMemo(() => [
    {
      id: 'pr',
      type: 'process',
      position: { x: 50, y: 100 },
      data: {
        label: 'PR Generated',
        description: 'Purchase Request Creation',
        stepNumbers: [1, 2, 3, 4, 5],
        stage: 'pr',
        riskScore: 0.5,
      },
    },
    {
      id: 'existingSupplier',
      type: 'process',
      position: { x: 300, y: 100 },
      data: {
        label: 'Existing Contracted Supplier',
        description: 'Supplier Selection',
        stepNumbers: [6],
        stage: 'existingSupplier',
        riskScore: 0.6,
      },
    },
    {
      id: 'rfq',
      type: 'process',
      position: { x: 550, y: 100 },
      data: {
        label: 'RFQ / RFP Process',
        description: 'Request for Quotation',
        stepNumbers: [7, 8, 9, 10, 11, 12, 13, 14],
        stage: 'rfq',
        riskScore: 0.4,
      },
    },
    {
      id: 'po',
      type: 'process',
      position: { x: 800, y: 100 },
      data: {
        label: 'PO Creation & Acknowledgement',
        description: 'Purchase Order',
        stepNumbers: [15, 16, 17],
        stage: 'po',
        riskScore: 0.7,
      },
    },
    {
      id: 'gr',
      type: 'process',
      position: { x: 1050, y: 100 },
      data: {
        label: 'Goods Receipt',
        description: 'Accounting Entry Happens',
        stepNumbers: [18],
        stage: 'gr',
        riskScore: 0.65,
      },
    },
    {
      id: 'goodsIssue',
      type: 'process',
      position: { x: 1300, y: 100 },
      data: {
        label: 'Goods Issue to User Dept.',
        description: 'Accounting Entry Happens',
        stepNumbers: [19],
        stage: 'goodsIssue',
        riskScore: 0.3,
      },
    },
    {
      id: 'invoice',
      type: 'process',
      position: { x: 1550, y: 100 },
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
      position: { x: 1800, y: 100 },
      data: {
        label: 'Payment to Supplier',
        description: 'Accounting Entry Happens',
        stepNumbers: [21],
        stage: 'payment',
        riskScore: 0.2,
      },
    },
  ], []);

  const initialEdges: Edge[] = useMemo(() => [
    { id: 'e1', source: 'pr', target: 'existingSupplier', animated: false },
    { id: 'e2', source: 'existingSupplier', target: 'rfq', animated: false },
    { id: 'e3', source: 'rfq', target: 'po', animated: false },
    { id: 'e4', source: 'po', target: 'gr', animated: false },
    { id: 'e5', source: 'gr', target: 'goodsIssue', animated: false },
    { id: 'e6', source: 'goodsIssue', target: 'invoice', animated: false },
    { id: 'e7', source: 'invoice', target: 'payment', animated: false },
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
          const nodeMap: Record<string, string> = {
            PR: 'pr',
            PO: 'po',
            GR: 'gr',
            Invoice: 'invoice',
            Supplier: 'existingSupplier',
          };
          return nodeMap[alert.entityType] === node.id;
        });

        const isActive = currentActiveNodeId === node.id && simulationStatus === 'running';
        const hasAlert = !!alertForNode;

        return {
          ...node,
          data: {
            ...node.data,
            hasActiveAlert: hasAlert,
            isActive: isActive,
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
      const nodeOrder = ['pr', 'existingSupplier', 'rfq', 'po', 'gr', 'goodsIssue', 'invoice', 'payment'];
      const edgeIds = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7'];
      const currentNodeIndex = nodeOrder.indexOf(currentActiveNodeId);
      const activeEdgeIndex = Math.min(currentNodeIndex, edgeIds.length - 1);
      
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: edgeIds.indexOf(edge.id) <= activeEdgeIndex,
        }))
      );
    } else {
      setEdges((eds) => eds.map((edge) => ({ ...edge, animated: false })));
    }
  }, [simulationStatus, currentActiveNodeId, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectProcessNode(node.id);
      
      // If node has an alert, show the alert modal
      const alertForNode = activeAlerts.find((alert) => {
        const nodeMap: Record<string, string> = {
          PR: 'pr',
          PO: 'po',
          GR: 'gr',
          Invoice: 'invoice',
          Supplier: 'existingSupplier',
        };
        return nodeMap[alert.entityType] === node.id;
      });

      if (alertForNode) {
        setActiveAlertModal(alertForNode);
      }
    },
    [selectProcessNode, activeAlerts, setActiveAlertModal]
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


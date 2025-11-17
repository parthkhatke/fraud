'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
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
import KnowledgeNode from './KnowledgeNode';
import { useFraudSimulation } from '@/context/FraudSimulationContext';

const nodeTypes = {
  knowledge: KnowledgeNode,
};

export default function KnowledgeGraphCanvas() {
  const {
    prs,
    pos,
    grs,
    invoices,
    suppliers,
    activeAlerts,
    selectedKnowledgeNodeId,
    selectKnowledgeNode,
  } = useFraudSimulation();

  const [highlightedTypeNode, setHighlightedTypeNode] = useState<string | null>(null);

  // Generate nodes - limit to high-risk items and cap per type for better visibility
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let xPos = 50;
    const typeY = 150;
    const instanceSpacing = 50; // Increased spacing
    const columnSpacing = 250; // Reduced spacing
    const maxItemsPerType = 12; // Limit items per type

    // Type nodes - positioned vertically
    const types = ['PR', 'PO', 'GR', 'Invoice', 'Supplier'];
    types.forEach((type, idx) => {
      nodes.push({
        id: `type-${type}`,
        type: 'knowledge',
        position: { x: xPos, y: typeY + idx * 100 },
        data: { label: type, type: 'type' as const },
      });
    });

    // Filter and limit PRs - show high-risk first
    const filteredPRs = prs
      .filter(pr => pr.riskScore >= 0.5) // Only show medium-high risk and above
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, maxItemsPerType);
    
    xPos += columnSpacing;
    filteredPRs.forEach((pr, idx) => {
      const y = typeY + (idx - filteredPRs.length / 2) * instanceSpacing;
      nodes.push({
        id: pr.id,
        type: 'knowledge',
        position: { x: xPos, y },
        data: {
          label: pr.number,
          type: 'instance' as const,
          entityType: 'PR' as const,
          riskScore: pr.riskScore,
        },
      });
      edges.push({
        id: `e-type-PR-${pr.id}`,
        source: 'type-PR',
        target: pr.id,
      });
    });

    // Filter and limit POs - show high-risk first
    const filteredPOs = pos
      .filter(po => po.riskScore >= 0.5)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, maxItemsPerType);
    
    xPos += columnSpacing;
    filteredPOs.forEach((po, idx) => {
      const y = typeY + (idx - filteredPOs.length / 2) * instanceSpacing;
      nodes.push({
        id: po.id,
        type: 'knowledge',
        position: { x: xPos, y },
        data: {
          label: po.number,
          type: 'instance' as const,
          entityType: 'PO' as const,
          riskScore: po.riskScore,
        },
      });
      edges.push({
        id: `e-type-PO-${po.id}`,
        source: 'type-PO',
        target: po.id,
      });
      // Link PO to PR (only if PR is in filtered list)
      if (filteredPRs.find(p => p.id === po.pr.id)) {
        edges.push({
          id: `e-${po.pr.id}-${po.id}`,
          source: po.pr.id,
          target: po.id,
          style: { strokeWidth: Math.min(po.totalValue / 5000, 3) },
        });
      }
      // Link PO to Supplier (only if supplier is in filtered list)
      const supplierInGraph = suppliers.find(s => s.id === po.supplier.id && s.riskScore >= 0.5);
      if (supplierInGraph) {
        edges.push({
          id: `e-${po.id}-${po.supplier.id}`,
          source: po.id,
          target: po.supplier.id,
          style: { strokeWidth: Math.min(po.totalValue / 5000, 3) },
        });
      }
    });

    // Filter and limit GRs - show high-risk first
    const filteredGRs = grs
      .filter(gr => gr.riskScore >= 0.5)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, maxItemsPerType);
    
    xPos += columnSpacing;
    filteredGRs.forEach((gr, idx) => {
      const y = typeY + (idx - filteredGRs.length / 2) * instanceSpacing;
      nodes.push({
        id: gr.id,
        type: 'knowledge',
        position: { x: xPos, y },
        data: {
          label: gr.number,
          type: 'instance' as const,
          entityType: 'GR' as const,
          riskScore: gr.riskScore,
        },
      });
      edges.push({
        id: `e-type-GR-${gr.id}`,
        source: 'type-GR',
        target: gr.id,
      });
      // Link GR to PO (only if PO is in filtered list)
      if (filteredPOs.find(p => p.id === gr.po.id)) {
        edges.push({
          id: `e-${gr.po.id}-${gr.id}`,
          source: gr.po.id,
          target: gr.id,
          style: { strokeWidth: Math.min(gr.po.totalValue / 5000, 3) },
        });
      }
    });

    // Filter and limit Invoices - show high-risk first
    const filteredInvoices = invoices
      .filter(inv => inv.riskScore >= 0.5)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, maxItemsPerType);
    
    xPos += columnSpacing;
    filteredInvoices.forEach((inv, idx) => {
      const y = typeY + (idx - filteredInvoices.length / 2) * instanceSpacing;
      nodes.push({
        id: inv.id,
        type: 'knowledge',
        position: { x: xPos, y },
        data: {
          label: inv.number,
          type: 'instance' as const,
          entityType: 'Invoice' as const,
          riskScore: inv.riskScore,
        },
      });
      edges.push({
        id: `e-type-Invoice-${inv.id}`,
        source: 'type-Invoice',
        target: inv.id,
      });
      // Link Invoice to PO (only if PO is in filtered list)
      if (filteredPOs.find(p => p.id === inv.po.id)) {
        edges.push({
          id: `e-${inv.po.id}-${inv.id}`,
          source: inv.po.id,
          target: inv.id,
          style: {
            strokeWidth: Math.min(inv.invoiceAmount / 5000, 3),
            strokeDasharray: inv.gr ? undefined : '5,5',
          },
        });
      }
      // Link Invoice to Supplier (only if supplier is in filtered list)
      const supplierInGraph = suppliers.find(s => s.id === inv.supplier.id && s.riskScore >= 0.5);
      if (supplierInGraph) {
        edges.push({
          id: `e-${inv.id}-${inv.supplier.id}`,
          source: inv.id,
          target: inv.supplier.id,
          style: { strokeWidth: Math.min(inv.invoiceAmount / 5000, 3) },
        });
      }
    });

    // Filter and limit Suppliers - show high-risk first
    const filteredSuppliers = suppliers
      .filter(sup => sup.riskScore >= 0.5)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, maxItemsPerType);
    
    xPos += columnSpacing;
    filteredSuppliers.forEach((sup, idx) => {
      const y = typeY + (idx - filteredSuppliers.length / 2) * instanceSpacing;
      nodes.push({
        id: sup.id,
        type: 'knowledge',
        position: { x: xPos, y },
        data: {
          label: sup.name,
          type: 'instance' as const,
          entityType: 'Supplier' as const,
          riskScore: sup.riskScore,
        },
      });
      edges.push({
        id: `e-type-Supplier-${sup.id}`,
        source: 'type-Supplier',
        target: sup.id,
      });
    });

    return { nodes, edges };
  }, [prs, pos, grs, invoices, suppliers]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes based on alerts and highlighted type
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const alertForNode = activeAlerts.find(
          (alert) => alert.entityId === node.id
        );
        
        // Check if this instance node is connected to the highlighted type node
        let isHighlighted = false;
        if (highlightedTypeNode && node.data.type === 'instance') {
          const typePrefix = highlightedTypeNode.replace('type-', '');
          if (node.data.entityType === typePrefix) {
            isHighlighted = true;
          }
        }
        
        return {
          ...node,
          data: {
            ...node.data,
            hasActiveAlert: !!alertForNode,
            highlighted: isHighlighted,
          },
          selected: selectedKnowledgeNodeId === node.id,
        };
      })
    );
  }, [activeAlerts, selectedKnowledgeNodeId, highlightedTypeNode, setNodes]);

  // Update edges to highlight when connected to highlighted type node
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        let isHighlighted = false;
        if (highlightedTypeNode) {
          // Check if edge connects to the highlighted type node
          if (edge.source === highlightedTypeNode || edge.target === highlightedTypeNode) {
            isHighlighted = true;
          }
        }
        const originalStrokeWidth = typeof edge.style?.strokeWidth === 'number' 
          ? edge.style.strokeWidth 
          : 1;
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isHighlighted ? '#0ea5e9' : undefined, // Primary color
            strokeWidth: isHighlighted ? Math.max(originalStrokeWidth, 3) : originalStrokeWidth,
            opacity: isHighlighted ? 1 : 0.6,
          },
          animated: isHighlighted,
        };
      })
    );
  }, [highlightedTypeNode, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeData = node.data as { type: 'type' | 'instance'; entityType?: string };
      
      if (nodeData.type === 'type') {
        // Toggle highlight for type nodes
        if (highlightedTypeNode === node.id) {
          setHighlightedTypeNode(null);
        } else {
          setHighlightedTypeNode(node.id);
        }
      } else {
        // For instance nodes, select them normally
        selectKnowledgeNode(node.id);
        setHighlightedTypeNode(null); // Clear type highlight when clicking instance
      }
    },
    [selectKnowledgeNode, highlightedTypeNode]
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


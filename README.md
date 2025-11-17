# P2P Fraud Detection Monitor

A comprehensive Next.js web application that simulates fraud detection in a Procure-to-Pay (P2P) process using realistic dummy data.

## Features

- **Real-time Process Flow Visualization**: Interactive React Flow diagram showing the complete P2P process from PR generation to payment
- **Knowledge Graph**: Detailed entity relationship visualization showing connections between PRs, POs, GRs, Invoices, and Suppliers
- **ML Training Simulation**: Simulate fraud detection with animated process flow and automatic alert triggering
- **Fraud Alerts**: Real-time alerts with severity levels and suggested actions
- **Context Actions**: Right-click on alert nodes to:
  - Request More Information
  - Create Investigation Tickets
  - Run Pattern Analysis (ML)
- **Pattern Analysis**: ML-powered analysis showing:
  - Top Supplier by Material
  - Top Employee by Supplier
- **Comprehensive Dashboard**: KPI cards, risk summaries, and alert management

## Tech Stack

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **React Flow** for interactive diagrams
- **Tailwind CSS** for styling
- **DaisyUI** for UI components
- **React Context** for state management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
fraud-dect/
├── app/
│   ├── layout.tsx          # Root layout with context provider
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── components/
│   ├── sidebar/
│   │   └── StatsPanel.tsx  # Left sidebar with KPIs and alerts
│   ├── process/
│   │   ├── ProcessControls.tsx      # Simulation controls
│   │   ├── ProcessFlowCanvas.tsx    # Top process flow diagram
│   │   ├── ProcessNode.tsx          # Custom process node component
│   │   ├── ProcessAlertModal.tsx    # Alert details modal
│   │   └── PatternAnalysisModal.tsx  # Pattern analysis results
│   └── graph/
│       ├── KnowledgeGraphCanvas.tsx # Bottom knowledge graph
│       ├── KnowledgeNode.tsx        # Custom knowledge node
│       └── KnowledgeDetailsPanel.tsx # Entity details panel
├── context/
│   └── FraudSimulationContext.tsx    # Global state management
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── mockData.ts         # Dummy data generator
│   └── risk.ts             # Risk calculation utilities
└── package.json
```

## Usage

### Running the Simulation

1. Click **"Initialize Training"** to start the ML simulation
2. Watch as the process flow animates through each stage
3. Fraud alerts will automatically trigger at predefined steps
4. Use **"Resume"** to continue after alerts
5. Use **"Reset"** to clear the simulation

### Interacting with Alerts

- Click on alerts in the sidebar to view details and highlight related nodes
- Right-click on alert nodes in the process flow to access context actions
- View investigation tickets and pending actions in the sidebar

### Exploring the Knowledge Graph

- Click on nodes to view detailed entity information
- Nodes are color-coded by risk level
- Edges show relationships and are weighted by transaction value
- Dashed edges indicate lower-confidence links

## Data Model

The application uses realistic dummy data including:

- **10-15 Suppliers** with varying risk profiles
- **10-20 Materials** across different categories
- **8-12 Employees** in various roles
- **Network of PRs, POs, GRs, and Invoices** with realistic relationships
- **Pre-defined Fraud Alerts** that trigger during simulation

## Key Features Explained

### Process Flow Stages

The 21-step P2P process is abstracted into 8 main stages:

1. **PR Generated** (Steps 1-5)
2. **Existing Contracted Supplier** (Step 6)
3. **RFQ / RFP Process** (Steps 7-14)
4. **PO Creation & Acknowledgement** (Steps 15-17)
5. **Goods Receipt** (Step 18)
6. **Goods Issue to User Dept.** (Step 19)
7. **Invoice Recording** (Step 20)
8. **Payment to Supplier** (Step 21)

### Risk Scoring

- **Low**: 0-0.4 (Green)
- **Medium**: 0.4-0.6 (Yellow)
- **High**: 0.6-0.8 (Orange)
- **Critical**: 0.8-1.0 (Red)

### Fraud Detection Patterns

The system detects:

- Invoice amounts exceeding PO values
- Repeated high-value orders from high-risk suppliers
- Quantity discrepancies in goods receipt
- Supplier performance issues
- Employee-supplier relationship patterns

## Development

### Adding New Features

- **New Entity Types**: Add to `lib/types.ts` and update mock data generator
- **New Alerts**: Add to `mockFraudAlerts` in `lib/mockData.ts`
- **New Components**: Follow existing component structure in `components/`

### Styling

- Uses DaisyUI theme: `corporate`
- Custom Tailwind classes for risk indicators
- Responsive design with flexbox and grid layouts

## License

This is a demo application for educational purposes.


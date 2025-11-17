'use client';

import { useFraudSimulation } from '@/context/FraudSimulationContext';

export default function PatternAnalysisModal() {
  const { patternAnalysis, clearPatternAnalysis } = useFraudSimulation();

  if (!patternAnalysis) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">Pattern Analysis Results (ML)</h3>

        <div className="space-y-6">
          {/* Top Supplier by Material */}
          <div>
            <h4 className="font-semibold mb-3">Top Supplier by Material</h4>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Material</th>
                    <th>Total Value</th>
                    <th>High Risk PO Count</th>
                  </tr>
                </thead>
                <tbody>
                  {patternAnalysis.topSupplierByMaterial.map((item, idx) => (
                    <tr key={idx}>
                      <td className="font-medium">{item.supplierName}</td>
                      <td>{item.materialDescription}</td>
                      <td>₹{item.totalValue.toLocaleString('en-IN')}</td>
                      <td>
                        <span className="badge badge-error badge-sm">
                          {item.highRiskPOCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Employee by Supplier */}
          <div>
            <h4 className="font-semibold mb-3">Top Employee by Supplier</h4>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Supplier</th>
                    <th>Total PO Value</th>
                    <th>Invoices On Hold</th>
                  </tr>
                </thead>
                <tbody>
                  {patternAnalysis.topEmployeeBySupplier.map((item, idx) => (
                    <tr key={idx}>
                      <td className="font-medium">{item.employeeName}</td>
                      <td>{item.supplierName}</td>
                      <td>₹{item.totalPOValue.toLocaleString('en-IN')}</td>
                      <td>
                        {item.invoiceOnHoldCount > 0 ? (
                          <span className="badge badge-warning badge-sm">
                            {item.invoiceOnHoldCount}
                          </span>
                        ) : (
                          <span className="text-sm text-base-content/60">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button
            className="btn"
            onClick={clearPatternAnalysis}
          >
            Close
          </button>
        </div>
      </div>
      <div
        className="modal-backdrop"
        onClick={clearPatternAnalysis}
      ></div>
    </div>
  );
}


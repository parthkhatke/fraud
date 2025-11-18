'use client';

import React, { useState } from 'react';
import { FraudPatternDetails } from '@/lib/types';
import clsx from 'clsx';
import jsPDF from 'jspdf';

interface FraudPatternDetailsPanelProps {
  details: FraudPatternDetails;
  onClose: () => void;
}

type IndicatorStatus = 'correct' | 'incorrect' | null;

export default function FraudPatternDetailsPanel({ details, onClose }: FraudPatternDetailsPanelProps) {
  const [indicatorStatuses, setIndicatorStatuses] = useState<Record<number, IndicatorStatus>>({});
  const formatAmount = (amount: number): string => {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)}L`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadPDF = () => {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Set up colors
    const redColor = [220, 53, 69] as [number, number, number]; // Red for warnings
    const darkGray = [51, 51, 51] as [number, number, number];
    const lightGray = [128, 128, 128] as [number, number, number];
    
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Header
    doc.setFillColor(redColor[0], redColor[1], redColor[2]);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FRAUD PATTERN DETAILS', margin + 5, yPosition + 6);
    
    yPosition += 15;
    
    // Cluster ID
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cluster ID: ${details.clusterId}`, margin, yPosition);
    yPosition += 10;
    
    // Risk Score and Pattern Type
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(redColor[0], redColor[1], redColor[2]);
    doc.text(`Risk Score: ${details.riskScore.toFixed(1)}`, margin, yPosition);
    
    const patternTypeX = pageWidth - margin - 50;
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pattern Type: ${details.patternType}`, patternTypeX, yPosition);
    yPosition += 15;
    
    // Pattern Description
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Pattern Description:', margin, yPosition);
    yPosition += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    const descriptionLines = doc.splitTextToSize(details.patternDescription, contentWidth);
    doc.text(descriptionLines, margin, yPosition);
    yPosition += (descriptionLines.length * 6) + 10;
    
    // Fraud Indicators
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Fraud Indicators:', margin, yPosition);
    yPosition += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    details.fraudIndicators.forEach((indicator) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`• ${indicator}`, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
    
    // Below Threshold Analysis
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Below Threshold Analysis:', margin, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    
    const analysisData: Array<[string, number]> = [
      [`Approval Threshold: ${formatAmount(details.approvalThreshold)} (${details.thresholdLabel})`, margin],
      [`Average PO Amount: ${formatAmount(details.averagePOAmount)}`, margin + 60],
      [`Average Below Threshold: ${formatAmount(details.averageBelowThreshold)} (${details.averageBelowThresholdPercent.toFixed(1)}% below)`, margin],
      [`Total Amount: ${formatAmount(details.totalAmount)}`, margin + 60],
      [`Total Contract: ${details.totalContract}`, margin],
      [`Detected At: ${formatDateTime(details.detectedAt)}`, margin + 60],
    ];
    
    analysisData.forEach(([text, x]) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(text, x, yPosition);
      if (x === margin) {
        yPosition += 7;
      }
    });
    yPosition += 10;
    
    // Suspicious Purchase Orders
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Suspicious Purchase Orders:', margin, yPosition);
    yPosition += 10;
    
    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 5, contentWidth, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    const colWidths = [30, 25, 25, 40, 35, 35];
    const headers = ['PO NUMBER', 'DATE', 'AMOUNT', 'SUPPLIER', 'REQUISITIONER', 'MATERIAL'];
    let xPos = margin + 2;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPosition);
      xPos += colWidths[i];
    });
    yPosition += 10;
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    
    details.suspiciousPOs.forEach((po) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
        // Redraw header
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPosition - 5, contentWidth, 8, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        xPos = margin + 2;
        headers.forEach((header, i) => {
          doc.text(header, xPos, yPosition);
          xPos += colWidths[i];
        });
        yPosition += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      }
      
      xPos = margin + 2;
      const rowData = [
        po.poNumber,
        formatDate(po.date),
        formatAmount(po.amount),
        po.supplier,
        po.requisitioner,
        po.material,
      ];
      
      rowData.forEach((data, i) => {
        const text = doc.splitTextToSize(String(data), colWidths[i] - 2);
        doc.text(text, xPos, yPosition);
        xPos += colWidths[i];
      });
      yPosition += 8;
    });
    
    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin - 20,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
    }
    
    // Save the PDF
    doc.save(`fraud-pattern-${details.clusterId}-${Date.now()}.pdf`);
  };

  const handleEscalate = () => {
    // Escalate fraud to higher authority
    // In a real application, this would send a notification/email to senior management
    const escalationData = {
      clusterId: details.clusterId,
      riskScore: details.riskScore,
      patternType: details.patternType,
      escalatedAt: new Date().toISOString(),
      escalatedBy: 'Current User', // In real app, get from auth context
    };
    
    // Log escalation (in real app, this would be an API call)
    console.log('Fraud escalated to higher authority:', escalationData);
    
    // Show confirmation (in real app, this could be a toast notification)
    alert(`Fraud pattern ${details.clusterId} has been escalated to higher authority.\n\nRisk Score: ${details.riskScore.toFixed(1)}\nPattern Type: ${details.patternType}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Fraud Pattern Details</h2>
              <p className="text-sm text-gray-600 mt-1">{details.clusterId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleEscalate}
              className="btn btn-error btn-sm"
            >
              Escalate
            </button>
            <button
              onClick={handleDownloadPDF}
              className="btn btn-primary btn-sm gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Risk Score Section */}
          <div className="flex items-center gap-6 pb-4 border-b border-gray-200">
            <div>
              <div className="text-5xl font-bold text-red-600">{details.riskScore.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Pattern Type</div>
              <div className="text-lg font-semibold text-gray-800">{details.patternType}</div>
            </div>
          </div>

          {/* Pattern Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Pattern Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
              {details.patternDescription}
            </p>
          </div>

          {/* Fraud Indicators */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Fraud Indicators</h3>
            <div className="grid grid-cols-2 gap-3">
              {details.fraudIndicators.map((indicator, idx) => {
                const status = indicatorStatuses[idx] || null;
                
                const handleToggle = (newStatus: IndicatorStatus) => {
                  setIndicatorStatuses(prev => {
                    // If clicking the same status, reset to null
                    if (prev[idx] === newStatus) {
                      const updated = { ...prev };
                      delete updated[idx];
                      return updated;
                    }
                    // Otherwise set the new status
                    return { ...prev, [idx]: newStatus };
                  });
                };

                return (
                  <div key={idx} className="flex items-center justify-between gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 flex-1">
                      {status === 'correct' ? (
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : status === 'incorrect' ? (
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={clsx(
                        status === 'incorrect' && 'line-through text-gray-400',
                        status === 'correct' && 'font-medium'
                      )}>{indicator}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle('correct')}
                        className={clsx(
                          'p-1.5 rounded transition-colors',
                          status === 'correct' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                        )}
                        title="Mark as correct"
                        aria-label={`Mark ${indicator} as correct`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggle('incorrect')}
                        className={clsx(
                          'p-1.5 rounded transition-colors',
                          status === 'incorrect' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'
                        )}
                        title="Mark as incorrect"
                        aria-label={`Mark ${indicator} as incorrect`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Below Threshold Analysis */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Below Threshold Analysis</h3>
            <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Approval Threshold</div>
                <div className="text-sm font-semibold text-gray-800">
                  {formatAmount(details.approvalThreshold)} <span className="text-xs text-gray-600">({details.thresholdLabel})</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Average PO Amount</div>
                <div className="text-sm font-semibold text-gray-800">{formatAmount(details.averagePOAmount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Average Below Threshold</div>
                <div className="text-sm font-semibold text-green-600">
                  {formatAmount(details.averageBelowThreshold)} ({details.averageBelowThresholdPercent.toFixed(1)}% below)
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Total Amount</div>
                <div className="text-sm font-semibold text-red-600">{formatAmount(details.totalAmount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Total Contract</div>
                <div className="text-sm font-semibold text-gray-800">{details.totalContract}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Detected At</div>
                <div className="text-sm font-semibold text-gray-800">{formatDateTime(details.detectedAt)}</div>
              </div>
            </div>
          </div>

          {/* Suspicious Purchase Orders */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Suspicious Purchase Orders</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">PO NUMBER</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DATE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">AMOUNT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SUPPLIER</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">REQUISITIONER</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">MATERIAL</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {details.suspiciousPOs.map((po, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{po.poNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(po.date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatAmount(po.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{po.supplier}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{po.requisitioner}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{po.material}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


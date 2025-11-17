import type { Metadata } from 'next';
import './globals.css';
import { FraudSimulationProvider } from '@/context/FraudSimulationContext';

export const metadata: Metadata = {
  title: 'Fraud Detection ',
  description: 'Real-time fraud detection in Procure-to-Pay process',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="frauddetect">
      <body className="bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <FraudSimulationProvider>
          {children}
        </FraudSimulationProvider>
      </body>
    </html>
  );
}


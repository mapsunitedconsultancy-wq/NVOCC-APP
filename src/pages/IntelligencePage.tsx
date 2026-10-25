import React from 'react';
import { useApp } from '../context/AppContext';
import { Activity, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, DollarSign, Ship } from 'lucide-react';

export const IntelligencePage: React.FC = () => {
  const { setActiveView, setViewParam, showToast } = useApp();

  const insights = [
    {
      id: 'ins-1',
      type: 'Risk Alert',
      severity: 'critical',
      title: 'Free Time Expiry Warning: Eurogate Hamburg Terminal',
      description: 'Container MRKU8891234 (Shipment MAPS-240338) has only 18 hours of destination free time remaining. Consignee has not submitted the final Delivery Order (DO). Demurrage will commence at €95 (₹8,500)/day.',
      action: 'View Container & Dispatch Urgent Notice',
      targetView: 'shipments',
      targetParam: 'MAPS-240338'
    },
    {
      id: 'ins-2',
      type: 'Margin Optimization',
      severity: 'success',
      title: 'Carrier Margin Arbitrage: CMA CGM vs Maersk on Mundra-Hamburg',
      description: 'Your realized gross margin on CMA CGM bookings is 18.2% (average ₹48,000/container) compared to 13.4% on Maersk Line on the identical Mundra-Hamburg lane. Shifting 4 monthly bookings will increase net margin by ₹1,40,000.',
      action: 'Compare Rates on Rate Master',
      targetView: 'quotes'
    },
    {
      id: 'ins-3',
      type: 'Client Re-engagement',
      severity: 'warning',
      title: 'Morbi Exporter Volume Drop: Krishna Ceramics',
      description: 'Krishna Ceramics export bookings to Northern Europe dropped 20% compared to Q3. Recent quotes were viewed but unbooked. Propose revised volume rebate under Credit Note framework to capture November ceramic runs.',
      action: 'Create Volume Quote',
      targetView: 'quotes'
    },
    {
      id: 'ins-4',
      type: 'Carrier Reliability Alert',
      severity: 'warning',
      title: 'Carrier Schedule Reliability Drop: Hapag-Lloyd IOS Service',
      description: 'Hapag-Lloyd schedule reliability has dipped from 91% to 77% over the last 30 days due to Cape of Good Hope re-routings. Average transit delay is +6.2 days. Adjust customer ETAs accordingly.',
      action: 'Review Carrier Performance MIS',
      targetView: 'reports'
    },
    {
      id: 'ins-5',
      type: 'Compliance Risk',
      severity: 'critical',
      title: 'Missing EGM Filing: Saled Vessels Approaching ICEGATE 7-Day Deadline',
      description: '2 Export General Manifests (EGM) for vessels MSC JADE (437W) and MAERSK SEOUL have pending custom errors. Section 41 Customs Act penal exposure of ₹50,000 applies if not reconciled within 48h.',
      action: 'Open EGM Filing Desk',
      targetView: 'export_manifest'
    },
    {
      id: 'ins-6',
      type: 'Cash Flow Projection',
      severity: 'warning',
      title: 'Overseas Agent Net Settlement Deficit: Hamburg Port Partner',
      description: 'Net balance with Hamburg Shipping Services GmbH stands at €14,800 debit. Realized collection lag on 3 import D/Os will cause an FX variance of ₹42,000 if not settled before RBI monthly reset.',
      action: 'Reconcile Agent Ledger',
      targetView: 'agent_accounting'
    },
    {
      id: 'ins-7',
      type: 'Demand Forecast',
      severity: 'success',
      title: 'Morbi Ceramic Festival Surge: November Reefer & Heavy Equipment',
      description: 'Q4 ceramic export bookings projected to surge +28% based on won RFQs in Quotation Pipeline. Recommend pre-booking 45 x 20\' Heavy Dry slots with MSC and ONE at current base rates of $950/TEU.',
      action: 'View Quotation Pipeline Funnel',
      targetView: 'quotation_pipeline'
    },
    {
      id: 'ins-8',
      type: 'Container Anomaly Detection',
      severity: 'critical',
      title: 'VGM Weight Variance & Dwell Anomaly: APSEZ CT-2 Mundra',
      description: 'Container MRKU9981245 registered a 1.8 MT variance between shipper declared packing slip (24,800 KG) and port weighbridge VGM (26,600 KG). Solas convention SM1 certificate requires instant re-validation.',
      action: 'Inspect Container Telemetry',
      targetView: 'container_control'
    }
  ];

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#E88B2A]" />
            MAPS AI Logistics Intelligence & Actionable Insights
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            Continuous automated telemetry analysis across container tracking, carrier reliability, and profit margins
          </p>
        </div>

        <span className="px-3 py-1 rounded-full font-mono text-emerald-400 font-bold bg-emerald-950 border border-emerald-800">
          ● Engine Active: Mundra Hub
        </span>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map(item => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 shadow-sm ${
              item.severity === 'critical'
                ? 'bg-rose-950/20 border-rose-800/50'
                : item.severity === 'success'
                ? 'bg-emerald-950/20 border-emerald-800/50'
                : 'bg-amber-950/20 border-amber-800/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    item.severity === 'critical'
                      ? 'bg-rose-900 text-rose-200'
                      : item.severity === 'success'
                      ? 'bg-emerald-900 text-emerald-200'
                      : 'bg-amber-900 text-amber-200'
                  }`}
                >
                  {item.type}
                </span>
                <span className="text-[10px] text-[#A8A299] font-mono">Real-time Telemetry</span>
              </div>

              <h3 className="font-bold text-sm text-[#F4EFE6] mt-2 leading-snug">{item.title}</h3>
              <p className="text-zinc-300 text-xs mt-1.5 leading-relaxed">{item.description}</p>
            </div>

            <div className="pt-3 border-t border-[#1C2D4A] flex justify-end">
              <button
                onClick={() => {
                  setActiveView(item.targetView);
                  if (item.targetParam) setViewParam(item.targetParam);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#E88B2A] font-bold text-xs border border-[#26395A] transition-all"
              >
                {item.action} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

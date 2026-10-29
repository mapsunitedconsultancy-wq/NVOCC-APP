import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Ship,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Star,
  Smartphone,
  Bot,
  Zap,
  Clock,
  DollarSign,
  ChevronDown,
  Building2,
  Mail,
  Phone,
  MapPin,
  Play
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const { showToast, setActiveView } = useApp();

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [demoFirm, setDemoFirm] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoShipments, setDemoShipments] = useState('50 - 150 Shipments/mo');

  const handleBookDemo = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDemoModal(false);
    showToast('success', 'Demo Scheduled', `Thank you ${demoName || 'Partner'}! Our Gandhidham team will call ${demoPhone || 'you'} within 15 minutes.`);
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-[#F4EFE6] font-sans selection:bg-[#E88B2A]/30">
      {/* 1. Top Announcement & Navigation */}
      <nav className="h-16 border-b border-[#1C2D4A] bg-[#0A1628]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onEnterApp}>
          <div className="w-8 h-8 rounded-lg bg-[#E88B2A] flex items-center justify-center font-black text-slate-950">
            <Ship className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-display font-bold text-lg text-[#F4EFE6] tracking-tight">
            MAPS NVOCC PRO
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs text-[#A8A299] font-medium">
          <a href="#features" className="hover:text-[#F4EFE6]">Features</a>
          <a href="#comparison" className="hover:text-[#F4EFE6]">vs eBMS & Logi-Sys</a>
          <a href="#pricing" className="hover:text-[#F4EFE6]">Pricing</a>
          <a href="#testimonials" className="hover:text-[#F4EFE6]">Testimonials</a>
          <a href="#faq" className="hover:text-[#F4EFE6]">FAQ</a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('login')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveView('register')}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20 cursor-pointer"
          >
            Register Firm (8-Digit OTP)
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="py-16 sm:py-24 px-6 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E88B2A]/15 border border-[#E88B2A]/30 text-[#E88B2A] text-xs font-semibold">
          <span>Built exclusively for Gandhidham, Mundra & Kandla NVOCCs</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#F4EFE6] max-w-4xl mx-auto leading-tight">
          The modern NVOCC software built for <span className="text-[#E88B2A]">Gandhidham</span>.
        </h1>

        <p className="text-base sm:text-lg text-[#A8A299] max-w-2xl mx-auto leading-relaxed">
          Replace eBMS, Softlink Logi-Sys, and WhatsApp chaos with an all-in-one operating system that costs 1/3 and goes live in 2 weeks.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E88B2A]/25"
          >
            <Play className="w-4 h-4 fill-current" />
            Try Live Interactive Application
          </button>

          <button
            onClick={() => setShowDemoModal(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A] font-bold text-sm transition-all"
          >
            Book 30-Min Onsite Demo
          </button>
        </div>

        {/* Hero Dashboard Preview Card */}
        <div className="mt-12 rounded-2xl border-2 border-[#26395A] bg-[#0F1D33] p-4 sm:p-6 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C2D4A] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-mono text-[#A8A299] ml-2">app.mapsfreight.com — Command Center</span>
            </div>
            <span className="text-emerald-400 font-mono">Live Sync Active</span>
          </div>
          <div className="py-8 grid grid-cols-1 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl bg-[#16263F] border border-[#26395A]">
              <span className="text-[10px] uppercase font-bold text-[#A8A299]">Active Shipments</span>
              <p className="text-2xl font-bold font-mono text-[#F4EFE6] mt-1">25 Jobs</p>
            </div>
            <div className="p-4 rounded-xl bg-[#16263F] border border-[#26395A]">
              <span className="text-[10px] uppercase font-bold text-[#A8A299]">Monthly Freight</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">₹58,40,000</p>
            </div>
            <div className="p-4 rounded-xl bg-[#16263F] border border-rose-800/40">
              <span className="text-[10px] uppercase font-bold text-rose-300">Demurrage Radar</span>
              <p className="text-2xl font-bold font-mono text-rose-200 mt-1">1 Critical</p>
            </div>
            <div className="p-4 rounded-xl bg-[#16263F] border border-[#26395A]">
              <span className="text-[10px] uppercase font-bold text-[#A8A299]">TEU Throughput</span>
              <p className="text-2xl font-bold font-mono text-[#E88B2A] mt-1">128 TEU</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Social Proof Stats Bar */}
      <section className="border-y border-[#1C2D4A] bg-[#0F1D33]/60 py-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold font-mono text-[#E88B2A]">500+</p>
            <p className="text-xs text-[#A8A299] mt-1">Containers Managed Daily</p>
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-emerald-400">₹50 Cr+</p>
            <p className="text-xs text-[#A8A299] mt-1">Ocean Freight Processed</p>
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-sky-400">99.9%</p>
            <p className="text-xs text-[#A8A299] mt-1">System Uptime Guarantee</p>
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-[#F4EFE6]">24 Hours</p>
            <p className="text-xs text-[#A8A299] mt-1">Gandhidham Onsite Support</p>
          </div>
        </div>
      </section>

      {/* 4. Problem vs Solution */}
      <section id="features" className="py-16 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-[#F4EFE6]">
            Still running your NVOCC on Excel + Tally + WhatsApp?
          </h2>
          <p className="text-xs sm:text-sm text-[#A8A299]">
            Traditional legacy systems cost ₹10 Lakhs in upfront fees and take 6 months to implement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'End-to-End Shipment Tracking', desc: 'From factory stuffing in Morbi to discharge in Hamburg, full ISO 6346 validation.' },
            { title: 'Legal House B/L (HBL) Engine', desc: 'Generate 3 original negotiable Bs/L with carrier seal, digital signature, and clauses.' },
            { title: 'LCL Consolidation Meter', desc: 'Visual tank gauge showing CBM and weight utilization with pro-rata cost allocation.' },
            { title: 'Automated WhatsApp Gateway', desc: 'Connected directly to Meta & AiSensy. Clients receive automated milestone alerts.' },
            { title: 'GST Tax Invoicing & SAC Codes', desc: 'Section 31 compliant tax invoices with CGST/SGST/IGST and UPI QR codes.' },
            { title: 'Multi-Currency Agent Ledgers', desc: 'EUR, USD and JPY accounting with automatic mark-to-market FX gain/loss.' }
          ].map((feat, i) => (
            <div key={i} className="p-5 rounded-xl bg-[#0F1D33] border border-[#26395A] space-y-2">
              <h3 className="font-bold text-sm text-[#E88B2A]">{feat.title}</h3>
              <p className="text-xs text-[#A8A299] leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Competitor Comparison Table */}
      <section id="comparison" className="py-16 px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E88B2A]/20 text-[#E88B2A] border border-[#E88B2A]/40">
            Market Comparison
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-[#F4EFE6]">
            How MAPS NVOCC Pro Compares
          </h2>
        </div>

        <div className="border border-[#26395A] rounded-xl overflow-hidden bg-[#0F1D33]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16263F] text-[#A8A299] border-b border-[#26395A] font-semibold text-[11px]">
                <tr>
                  <th className="p-3.5">Feature & Metric</th>
                  <th className="p-3.5 text-[#E88B2A] font-bold text-sm">MAPS NVOCC Pro</th>
                  <th className="p-3.5">eBMS Solutions</th>
                  <th className="p-3.5">Softlink Logi-Sys</th>
                  <th className="p-3.5">CargoWise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2D4A]">
                <tr>
                  <td className="p-3.5 font-bold text-[#F4EFE6]">Monthly Subscription</td>
                  <td className="p-3.5 font-bold font-mono text-emerald-400">₹25,000 / mo</td>
                  <td className="p-3.5 text-zinc-400">₹30,000 - ₹50,000/mo AMC</td>
                  <td className="p-3.5 text-zinc-400">₹25,000 - ₹45,000/mo</td>
                  <td className="p-3.5 text-zinc-400">$3,000+ USD/mo</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#F4EFE6]">Setup & Implementation</td>
                  <td className="p-3.5 font-bold font-mono text-emerald-400">₹0 (Included)</td>
                  <td className="p-3.5 text-rose-400 font-bold">₹5 - ₹15 Lakhs setup</td>
                  <td className="p-3.5 text-rose-400 font-bold">₹3 - ₹8 Lakhs setup</td>
                  <td className="p-3.5 text-rose-400 font-bold">$25,000+ setup</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#F4EFE6]">Go-Live Deployment</td>
                  <td className="p-3.5 font-bold text-emerald-400">Immediate / 2 Weeks</td>
                  <td className="p-3.5 text-zinc-400">3 - 6 Months</td>
                  <td className="p-3.5 text-zinc-400">2 - 4 Months</td>
                  <td className="p-3.5 text-zinc-400">6 - 12 Months</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#F4EFE6]">WhatsApp Gateway</td>
                  <td className="p-3.5 text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Native AiSensy API</td>
                  <td className="p-3.5 text-rose-400">Manual / Third-party</td>
                  <td className="p-3.5 text-zinc-400">Add-on cost</td>
                  <td className="p-3.5 text-rose-400">No WhatsApp</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#F4EFE6]">Customer Self-Service Portal</td>
                  <td className="p-3.5 text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Included Free</td>
                  <td className="p-3.5 text-zinc-400">Extra license</td>
                  <td className="p-3.5 text-zinc-400">Extra charge</td>
                  <td className="p-3.5 text-zinc-400">Enterprise only</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#F4EFE6]">Local Support in Kutch</td>
                  <td className="p-3.5 text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Gandhidham Sector 10</td>
                  <td className="p-3.5 text-zinc-400">Chennai Support</td>
                  <td className="p-3.5 text-zinc-400">Mumbai Support</td>
                  <td className="p-3.5 text-zinc-400">Australia / Global</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. Pricing Cards */}
      <section id="pricing" className="py-16 px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E88B2A]/20 text-[#E88B2A] border border-[#E88B2A]/40">
            Transparent Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-[#F4EFE6]">
            Simple, Transparent Monthly SaaS Plans
          </h2>
          <p className="text-xs text-[#A8A299]">No hidden setup fees. No AMC surprises.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: 'Starter Plan', price: '₹5,000', period: '/month', desc: 'Ideal for new freight forwarders', feats: ['1-3 Ops Users', '50 Shipments/month', 'Basic HBL & Invoicing', 'Email & WhatsApp alerts'] },
            { title: 'Growth Plan', price: '₹25,000', period: '/month', badge: 'MOST POPULAR', desc: 'Mid-sized Gandhidham NVOCCs', feats: ['5-10 Users', '200 Shipments/month', 'All 15 Modules Included', 'Customer Self-Service Portal', 'Multi-Currency Agent Ledgers', 'Monthly MIS Review'], highlight: true },
            { title: 'Pro Plan', price: '₹40,000', period: '/month', desc: 'High-volume liner agencies', feats: ['10-30 Users', 'Unlimited Shipments', 'Advanced Analytics & AI', 'Custom Carrier Branding', 'API & Tally Prime Connector', 'Dedicated Account SPOC'] },
            { title: 'Enterprise', price: 'Custom', period: '', desc: 'Port-wide multi-branch setups', feats: ['30+ Users', 'PCS 1x Live Mundra Gateway', 'Direct Shipping Line EDI', 'White-label Domain', '24/7 Onsite Emergency Ops'] }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between ${
                plan.highlight
                  ? 'bg-[#0F1D33] border-[#E88B2A] ring-2 ring-[#E88B2A]/30 shadow-xl'
                  : 'bg-[#0F1D33]/70 border-[#26395A]'
              }`}
            >
              <div>
                {plan.badge && (
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#E88B2A] text-[#0A1628] uppercase inline-block mb-2">
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-bold text-base text-[#F4EFE6]">{plan.title}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-mono text-[#E88B2A]">{plan.price}</span>
                  <span className="text-xs text-[#A8A299]">{plan.period}</span>
                </div>
                <p className="text-xs text-[#A8A299] mt-1">{plan.desc}</p>

                <div className="pt-4 border-t border-[#1C2D4A] mt-4 space-y-2 text-xs">
                  {plan.feats.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-zinc-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setShowDemoModal(true)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                    plan.highlight
                      ? 'bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] shadow-md shadow-[#E88B2A]/20'
                      : 'bg-[#16263F] hover:bg-[#1D3251] text-[#F4EFE6] border border-[#26395A]'
                  }`}
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Testimonials */}
      <section id="testimonials" className="py-16 px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-[#F4EFE6]">
            Trusted by Gujarat Logistics Leaders
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Ketan Shah', title: 'Managing Director, Kutch Ocean Liners', text: '“Switching from eBMS to MAPS NVOCC Pro saved us ₹6 Lakhs in annual AMC fees alone. Plus, having the team physically in Gandhidham Sector 10 gives us instant peace of mind.”' },
            { name: 'Dinesh Patel', title: 'Director, Morbi Ceramic Logistics', text: '“Our European buyers in Hamburg love the tracking link and instant HBL downloads. It stopped 80% of routine status phone calls.”' },
            { name: 'Sanjay Jadeja', title: 'Head of Ops, West Coast Maritime', text: '“The LCL consolidation gauge and automated GST invoice generation cut our documentation time from 45 minutes per booking down to 4 minutes.”' }
          ].map((t, i) => (
            <div key={i} className="p-5 rounded-xl bg-[#0F1D33] border border-[#26395A] space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, s) => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic">{t.text}</p>
              <div className="pt-2 border-t border-[#1C2D4A]">
                <h4 className="font-bold text-xs text-[#F4EFE6]">{t.name}</h4>
                <p className="text-[10px] text-[#A8A299]">{t.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="py-16 px-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#F4EFE6]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            { q: 'How long does implementation take?', a: 'Under 2 weeks. We import all your existing parties, carrier contracts, and HBL templates from day one.' },
            { q: 'Do you integrate with Tally Prime?', a: 'Yes! Automated XML and ODBC sync feeds all sales invoices and agent debits directly into your Tally Prime ledgers.' },
            { q: 'What about Mundra Port PCS 1x?', a: 'MAPS NVOCC Pro is architected for National Port Community System (PCS 1x) electronic gate-in and customs clearance.' },
            { q: 'Can we switch easily from eBMS or Logi-Sys?', a: 'Yes, our migration toolkit extracts party masters, containers, and historical billing files with zero operational downtime.' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#0F1D33] border border-[#26395A] space-y-1.5">
              <h4 className="font-bold text-sm text-[#F4EFE6]">{item.q}</h4>
              <p className="text-xs text-[#A8A299] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Final CTA & Footer */}
      <footer className="border-t border-[#1C2D4A] bg-[#0A1628] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-[#1C2D4A] text-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#E88B2A] flex items-center justify-center font-bold text-slate-950">
                <Ship className="w-4 h-4 text-slate-950" />
              </div>
              <span className="font-bold text-base text-[#F4EFE6]">MAPS NVOCC PRO</span>
            </div>
            <p className="text-[#A8A299] mt-1 max-w-sm">
              2nd Floor, Gurukul City Center, Plot 20, Sector 10, Gandhidham, Kutch, Gujarat 370201
            </p>
            <p className="text-[#6E6A64] mt-1">A product of MAPS Tech & AI (mapsai.in)</p>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-[#F4EFE6] font-semibold">Support Desk: +91 2836 123456</p>
            <p className="text-[#A8A299]">Direct Mobile: +91 98765 43210</p>
            <p className="text-emerald-400">Email: ops@mapsfreight.com</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#6E6A64]">
          <p>© 2026 MAPS Freight Solutions Pvt Ltd. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Security Standards</span>
          </div>
        </div>
      </footer>

      {/* Demo Booking Modal */}
      {showDemoModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowDemoModal(false)}
          title="Schedule a 30-Minute Onsite Demo in Gandhidham"
          subtitle="See how MAPS NVOCC Pro automates 90% of your daily operations"
          maxWidth="md"
        >
          <form onSubmit={handleBookDemo} className="space-y-3 text-xs">
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Your Full Name</label>
              <input
                type="text"
                required
                value={demoName}
                onChange={e => setDemoName(e.target.value)}
                placeholder="e.g. Ramesh Thakkar"
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">NVOCC / Forwarding Firm Name</label>
              <input
                type="text"
                required
                value={demoFirm}
                onChange={e => setDemoFirm(e.target.value)}
                placeholder="e.g. Kutch Sea Lines"
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Mobile Number (for WhatsApp reminder)</label>
              <input
                type="tel"
                required
                value={demoPhone}
                onChange={e => setDemoPhone(e.target.value)}
                placeholder="+91 98250 00000"
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6] font-mono"
              />
            </div>
            <div>
              <label className="block text-[#A8A299] mb-1 font-semibold">Monthly Container Volume</label>
              <select
                value={demoShipments}
                onChange={e => setDemoShipments(e.target.value)}
                className="w-full bg-[#16263F] border border-[#26395A] rounded-lg p-2 text-[#F4EFE6]"
              >
                <option value="Under 50 Shipments/mo">Under 50 Shipments / month</option>
                <option value="50 - 150 Shipments/mo">50 - 150 Shipments / month</option>
                <option value="150 - 500 Shipments/mo">150 - 500 Shipments / month</option>
                <option value="500+ Shipments/mo">500+ Shipments / month</option>
              </select>
            </div>

            <div className="pt-3 border-t border-[#1C2D4A] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="px-3 py-1.5 rounded bg-[#16263F] text-[#A8A299]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg font-bold bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] shadow-md shadow-[#E88B2A]/20"
              >
                Confirm Demo Request
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

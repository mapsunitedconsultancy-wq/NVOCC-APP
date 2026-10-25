/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { PrintModal } from './components/common/PrintModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { ShipmentDetailPage } from './pages/ShipmentDetailPage';
import { CreateShipmentModal } from './pages/CreateShipmentModal';
import { HblPage } from './pages/HblPage';
import { CreateHblModal } from './pages/CreateHblModal';
import { MblPage } from './pages/MblPage';
import { ConsolidationPage } from './pages/ConsolidationPage';
import { ContainerControlPage } from './pages/ContainerControlPage';
import { RateMasterPage } from './pages/RateMasterPage';
import { QuoteBuilderPage } from './pages/QuoteBuilderPage';
import { InvoicingPage } from './pages/InvoicingPage';
import { CreateInvoiceModal } from './pages/CreateInvoiceModal';
import { PartyMasterPage } from './pages/PartyMasterPage';
import { AgentAccountingPage } from './pages/AgentAccountingPage';
import { DocumentVaultPage } from './pages/DocumentVaultPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { PublicTrackingPage } from './pages/PublicTrackingPage';
import { CommunicationHubPage } from './pages/CommunicationHubPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { LandingPage } from './pages/LandingPage';
import { PublicContainerTrackingView } from './components/container-control/PublicContainerTrackingView';
import { DeliveryOrderPage } from './pages/DeliveryOrderPage';
import { CreateDeliveryOrderModal } from './pages/CreateDeliveryOrderModal';

// V4 New Modules
import { ExportManifestPage } from './pages/ExportManifestPage';
import { ImportManifestPage } from './pages/ImportManifestPage';
import { ShippingInstructionsPage } from './pages/ShippingInstructionsPage';
import { QuotationPipelinePage } from './pages/QuotationPipelinePage';
import { ChaTrackerPage } from './pages/ChaTrackerPage';
import { TruckingJobsPage } from './pages/TruckingJobsPage';
import { DangerousGoodsPage } from './pages/DangerousGoodsPage';

// V4 Global Modals
import { ApprovalQueueModal } from './components/common/ApprovalQueueModal';
import { AccountSettingsModal } from './components/common/AccountSettingsModal';

const AppContent: React.FC = () => {
  const { activeView, setActiveView, viewParam, setViewParam, currentUser } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal dialog states
  const [showNewShipmentModal, setShowNewShipmentModal] = useState(false);
  const [showNewHblModal, setShowNewHblModal] = useState(false);
  const [showNewDoModal, setShowNewDoModal] = useState(false);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [showApprovalQueueModal, setShowApprovalQueueModal] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);

  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for Global Search Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(prev => !prev);
      }
      // '/' opens search when not in input
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      // '?' opens Keyboard Shortcuts legend
      if (e.key === '?' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowNewShipmentModal(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setShowNewHblModal(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        setShowNewInvoiceModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Landing Page standalone view
  if (activeView === 'landing_page') {
    return (
      <>
        <LandingPage onEnterApp={() => setActiveView('dashboard')} />
        <ToastContainer />
      </>
    );
  }

  // Public Tracking standalone view
  if (activeView === 'public_tracking') {
    return (
      <div className="min-h-screen bg-[#0A1628] text-[#F4EFE6] p-4 sm:p-8">
        <PublicTrackingPage
          initialShipmentId={viewParam || 'MAPS-240342'}
          onNavigateHome={() => setActiveView('dashboard')}
        />
        <ToastContainer />
      </div>
    );
  }

  // Public Container Control Tracking view (/ccontrol/[container])
  if (activeView === 'ccontrol_public') {
    return (
      <div className="min-h-screen bg-[#0A1628] text-[#F4EFE6]">
        <PublicContainerTrackingView
          containerNumber={viewParam || 'MSKU2345678'}
          onBack={() => setActiveView('container_control')}
        />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0A1628] text-[#F4EFE6] overflow-hidden">
      {/* Top Navigation */}
      <Header
        onOpenNewShipment={() => setShowNewShipmentModal(true)}
        onOpenNewHbl={() => setShowNewHblModal(true)}
        onOpenNewDo={() => setShowNewDoModal(true)}
        onOpenNewInvoice={() => setShowNewInvoiceModal(true)}
        onOpenSearch={() => setShowGlobalSearch(true)}
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        onOpenApprovals={() => setShowApprovalQueueModal(true)}
        onOpenAccountSettings={() => setShowAccountSettingsModal(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop + Mobile Drawer) */}
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1550px] w-full mx-auto pb-28 lg:pb-28">
          {/* Module 1: Dashboard */}
          {activeView === 'dashboard' && (
            <DashboardPage
              onOpenNewShipment={() => setShowNewShipmentModal(true)}
              onOpenNewHbl={() => setShowNewHblModal(true)}
              onOpenNewDo={() => setShowNewDoModal(true)}
              onOpenNewInvoice={() => setShowNewInvoiceModal(true)}
              onOpenNewQuote={() => setShowQuoteBuilder(true)}
            />
          )}

          {/* Module 2: Shipments (List vs Detail) */}
          {activeView === 'shipments' && (
            viewParam && !viewParam.startsWith('filter:') ? (
              <ShipmentDetailPage
                shipmentId={viewParam}
                onBack={() => setViewParam(undefined)}
              />
            ) : (
              <ShipmentsPage
                onOpenNewShipment={() => setShowNewShipmentModal(true)}
                onSelectShipment={id => setViewParam(id)}
              />
            )
          )}

          {/* Module 3: House Bill of Lading */}
          {activeView === 'hbl' && (
            <HblPage onOpenNewHbl={() => setShowNewHblModal(true)} />
          )}

          {/* Module: Delivery Orders (DO) */}
          {activeView === 'delivery_orders' && (
            <DeliveryOrderPage onOpenNewDo={() => setShowNewDoModal(true)} />
          )}

          {/* Module 4: Master Bill of Lading */}
          {activeView === 'mbl' && <MblPage />}

          {/* Module 5: LCL Consolidation Engine */}
          {activeView === 'consolidation' && <ConsolidationPage />}

          {/* Module: Container Control & Fleet Tracking */}
          {activeView === 'container_control' && <ContainerControlPage />}

          {/* Module 6: Rates & Quotes */}
          {activeView === 'quotes' && (
            showQuoteBuilder ? (
              <QuoteBuilderPage onBack={() => setShowQuoteBuilder(false)} />
            ) : (
              <RateMasterPage onOpenNewQuote={() => setShowQuoteBuilder(true)} />
            )
          )}

          {/* Module 7: Invoicing & Billing */}
          {activeView === 'invoicing' && (
            <InvoicingPage onOpenNewInvoice={() => setShowNewInvoiceModal(true)} />
          )}

          {/* Module 8: Party Master CRM */}
          {activeView === 'crm' && <PartyMasterPage />}

          {/* Module 9: Agent Accounting */}
          {activeView === 'agent_accounting' && <AgentAccountingPage />}

          {/* Module 10: Document Vault */}
          {activeView === 'vault' && (
            <DocumentVaultPage onOpenNewShipment={() => setShowNewShipmentModal(true)} />
          )}

          {/* Module 11: Customer Self-Service Portal */}
          {activeView === 'customer_portal' && <CustomerPortalPage />}

          {/* Module 12: Communication Hub */}
          {activeView === 'communication' && <CommunicationHubPage />}

          {/* Module 13: Reports & MIS */}
          {activeView === 'reports' && <ReportsPage />}

          {/* Module 14: Settings & Admin */}
          {activeView === 'settings' && <SettingsPage />}

          {/* Module 15: AI Intelligence & Insights */}
          {activeView === 'intelligence' && <IntelligencePage />}

          {/* V4 Module 1: Export General Manifest (EGM) */}
          {activeView === 'export_manifest' && <ExportManifestPage />}

          {/* V4 Module 2: Import General Manifest (IGM) */}
          {activeView === 'import_manifest' && <ImportManifestPage />}

          {/* V4 Module 3: Shipping Instructions (SI) */}
          {activeView === 'shipping_instructions' && <ShippingInstructionsPage />}

          {/* V4 Module 4: Quotation Pipeline */}
          {activeView === 'quotation_pipeline' && <QuotationPipelinePage />}

          {/* V4 Module 5: CHA & Shipping Bill Tracker */}
          {activeView === 'cha_tracker' && <ChaTrackerPage />}

          {/* V4 Module 6: Trucking & Drayage */}
          {activeView === 'trucking_jobs' && <TruckingJobsPage />}

          {/* V4 Module 7: Dangerous Goods (IMDG) */}
          {activeView === 'dangerous_goods' && <DangerousGoodsPage />}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <CreateShipmentModal
        isOpen={showNewShipmentModal}
        onClose={() => setShowNewShipmentModal(false)}
      />

      <CreateHblModal
        isOpen={showNewHblModal}
        onClose={() => setShowNewHblModal(false)}
      />

      <CreateDeliveryOrderModal
        isOpen={showNewDoModal}
        onClose={() => setShowNewDoModal(false)}
      />

      <CreateInvoiceModal
        isOpen={showNewInvoiceModal}
        onClose={() => setShowNewInvoiceModal(false)}
      />

      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* V4 Unified Approvals Queue Gatekeeper */}
      <ApprovalQueueModal
        isOpen={showApprovalQueueModal}
        onClose={() => setShowApprovalQueueModal(false)}
      />

      {/* Top-Right User Account & Profile Settings Modal */}
      <AccountSettingsModal
        isOpen={showAccountSettingsModal}
        onClose={() => setShowAccountSettingsModal(false)}
      />

      <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
      <PrintModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentItem } from '../../types';
import { Archive, Plus, Upload, Search, FileText, CheckCircle2, Eye, Download, ArrowRight } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface DocumentVaultProps {
  onOpenNewShipment: () => void;
}

export const DocumentVaultPage: React.FC<DocumentVaultProps> = ({ onOpenNewShipment }) => {
  const { documents, addDocument, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ocrModalDoc, setOcrModalDoc] = useState<DocumentItem | null>(null);

  const filteredDocs = documents.filter(doc => {
    const matchSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.shipmentId && doc.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = categoryFilter === 'all' || doc.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchSearch && matchCat;
  });

  const handleSimulateUpload = () => {
    const nextSeq = Math.floor(100 + Math.random() * 900);
    const newDoc: DocumentItem = {
      id: 'doc-' + Date.now(),
      shipmentId: 'MAPS-240342',
      title: `Export Packing Slip & Weight Cert #${nextSeq}`,
      category: 'Packing List',
      fileName: `EXP-PACKING-${nextSeq}.pdf`,
      fileSize: '740 KB',
      uploadedAt: '15 Oct 2026 12:10',
      uploadedBy: 'Utsav Panchal',
      status: 'Verified',
      ocrExtracted: {
        totalPackages: '1,100 Cartons',
        tareWeight: '3,880 KG',
        netCargo: '25,480 KG',
        container: 'MSKU2345678'
      }
    };
    addDocument(newDoc);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2D4A]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[#F4EFE6] flex items-center gap-2">
            <Archive className="w-6 h-6 text-[#E88B2A]" />
            Digital Document Vault & AI OCR Processing
          </h1>
          <p className="text-xs text-[#A8A299] mt-0.5">
            20+ compliant document types, automated metadata extraction, and encrypted cloud storage
          </p>
        </div>

        <button
          onClick={handleSimulateUpload}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
        >
          <Upload className="w-4 h-4" />
          Upload Document (AI Scan)
        </button>
      </div>

      {/* AI Extraction Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-[#0F1D33] to-[#0F1D33] border border-purple-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#F4EFE6]">AI Trade Document Parser</h3>
            <p className="text-xs text-[#A8A299]">Upload any PDF Commercial Invoice or Bill of Entry to auto-populate shipments</p>
          </div>
        </div>

        <button
          onClick={onOpenNewShipment}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shrink-0"
        >
          Create Shipment from Scanned Invoice <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Controls */}
      <div className="bg-[#0F1D33] border border-[#26395A] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#A8A299] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search document title, filename, shipment #..."
            className="w-full bg-[#16263F] border border-[#26395A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4EFE6] placeholder-[#6E6A64] focus:outline-none focus:border-[#E88B2A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-[#16263F] border border-[#26395A] rounded-lg px-3 py-1.5 text-xs text-[#F4EFE6]"
          >
            <option value="all">All Document Categories</option>
            <option value="commercial invoice">Commercial Invoice</option>
            <option value="vgm certificate">VGM Certificate</option>
            <option value="customs leo">Customs LEO</option>
            <option value="packing list">Packing List</option>
            <option value="hbl">House Bill of Lading</option>
            <option value="phytosanitary">Phytosanitary Cert</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredDocs.map(doc => (
          <div
            key={doc.id}
            className="p-4 rounded-xl bg-[#0F1D33] border border-[#26395A] hover:border-[#E88B2A]/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#E88B2A] uppercase tracking-wider">
                  {doc.category}
                </span>
                <span className="text-[10px] font-mono text-[#6E6A64]">{doc.fileSize}</span>
              </div>
              <h3 className="font-bold text-sm text-[#F4EFE6] mt-1 group-hover:text-[#E88B2A] transition-colors">
                {doc.title}
              </h3>
              <p className="font-mono text-[10px] text-zinc-400 mt-0.5">{doc.fileName}</p>
              
              {doc.ocrExtracted && (
                <div className="mt-3 p-2 bg-[#16263F] rounded border border-[#1C2D4A] space-y-1 font-mono text-[10px]">
                  <span className="font-sans text-[9px] font-bold text-purple-300 uppercase block">
                    OCR Extracted Data:
                  </span>
                  {Object.entries(doc.ocrExtracted).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[#6E6A64] font-sans capitalize">{k}:</span>
                      <span className="text-[#F4EFE6] font-semibold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-[#1C2D4A] flex items-center justify-between text-[10px] text-[#6E6A64]">
              <span>Uploaded: {doc.uploadedAt}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOcrModalDoc(doc)}
                  className="text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* OCR View Dialog */}
      {ocrModalDoc && (
        <Modal
          isOpen={true}
          onClose={() => setOcrModalDoc(null)}
          title={`Document Details: ${ocrModalDoc.title}`}
          subtitle={`Uploaded by ${ocrModalDoc.uploadedBy} on ${ocrModalDoc.uploadedAt}`}
          maxWidth="lg"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#16263F] rounded-lg border border-[#26395A] space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-[#A8A299]">File Name:</span>
                <span className="font-bold text-[#F4EFE6]">{ocrModalDoc.fileName}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#A8A299]">Category:</span>
                <span className="text-[#E88B2A]">{ocrModalDoc.category}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#A8A299]">Status:</span>
                <span className="text-emerald-400 font-bold">{ocrModalDoc.status}</span>
              </div>
            </div>

            {ocrModalDoc.ocrExtracted && (
              <div className="p-3 bg-purple-950/30 rounded-lg border border-purple-800/40 space-y-2 font-mono">
                <h4 className="font-bold text-xs text-purple-300">Parsed OCR Key-Value Fields</h4>
                {Object.entries(ocrModalDoc.ocrExtracted).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[11px]">
                    <span className="text-[#A8A299] capitalize">{k}:</span>
                    <span className="text-[#F4EFE6] font-bold">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-[#1C2D4A] flex justify-end gap-2">
              <button
                onClick={() => setOcrModalDoc(null)}
                className="px-4 py-1.5 rounded bg-[#16263F] text-[#F4EFE6]"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

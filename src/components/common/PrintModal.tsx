import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, Download, X, ShieldCheck, Check, Copy, ExternalLink, QrCode, FileText, CheckCircle2, Loader2, Share2, Eye, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { formatINR, formatUSD, numberToWordsINR } from '../../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const PrintModal: React.FC = () => {
  const { activePrintDoc, setActivePrintDoc, firmDetails, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'front' | 'annexure' | 'terms' | 'all'>('front');
  const [selectedCopy, setSelectedCopy] = useState<'ORIGINAL 1' | 'ORIGINAL 2' | 'ORIGINAL 3' | 'COPY NON-NEGOTIABLE' | 'TELEX RELEASED'>('ORIGINAL 1');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewMode, setPreviewMode] = useState<'pdf' | 'document'>((activePrintDoc?.type === 'DO' || activePrintDoc?.type === 'HBL') ? 'pdf' : 'document');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>((activePrintDoc?.type === 'DO' || activePrintDoc?.type === 'HBL') ? 82 : 100);

  const printDocRef = useRef<HTMLDivElement>(null);

  const type = activePrintDoc?.type;
  const data = activePrintDoc?.data || {};

  const getHblContainerRows = () => {
    if (data.containers && Array.isArray(data.containers) && data.containers.length > 0) {
      return data.containers;
    }

    const defaultContainers = [
      { containerNumber: 'CBHU5692536', containerType: '20GP', sealNumber: '262547', packageCount: '992', packageDescription: 'BOXES', grossWeightKg: 27800.0, netWeightKg: 27400.0, volumeCbm: 0 },
      { containerNumber: 'CNCU1526300', containerType: '20GP', sealNumber: '262615', packageCount: '900', packageDescription: 'BOXES', grossWeightKg: 27800.0, netWeightKg: 27400.0, volumeCbm: 0 },
      { containerNumber: 'FCIU2348783', containerType: '20GP', sealNumber: '262619', packageCount: '900', packageDescription: 'BOXES', grossWeightKg: 27800.0, netWeightKg: 27400.0, volumeCbm: 0 },
      { containerNumber: 'LCUU0190645', containerType: '20GP', sealNumber: '262527', packageCount: '992', packageDescription: 'BOXES', grossWeightKg: 27800.0, netWeightKg: 27400.0, volumeCbm: 0 },
      { containerNumber: 'LCUU0193686', containerType: '20GP', sealNumber: '262624', packageCount: '900', packageDescription: 'BOXES', grossWeightKg: 27800.0, netWeightKg: 27400.0, volumeCbm: 0 },
      { containerNumber: 'MSCU1387966', containerType: '20GP', sealNumber: '262621', packageCount: '900', packageDescription: 'BOXES', grossWeightKg: 27800.0, netWeightKg: 27400.0, volumeCbm: 0 },
      { containerNumber: 'PMLU2036516', containerType: '20GP', sealNumber: '262535', packageCount: '992', packageDescription: 'BOXES', grossWeightKg: 27800.0, netWeightKg: 27400.0, volumeCbm: 0 },
      { containerNumber: 'RFCU2220078', containerType: '20GP', sealNumber: '262526', packageCount: '895', packageDescription: 'BOXES', grossWeightKg: 27800.0, netWeightKg: 27400.0, volumeCbm: 0 },
      { containerNumber: 'TCKU2294610', containerType: '20GP', sealNumber: '262549', packageCount: '992', packageDescription: 'BOXES', grossWeightKg: 27800.0, netWeightKg: 27400.0, volumeCbm: 0 },
      { containerNumber: 'YMLU2830171', containerType: '20GP', sealNumber: '262608', packageCount: '900', packageDescription: 'BOXES', grossWeightKg: 27800.0, netWeightKg: 27400.0, volumeCbm: 0 }
    ];

    const text = data.containerAndSeals || '';
    const containerMatches = text.match(/[A-Z]{4}\d{7}/g);
    if (!containerMatches || containerMatches.length === 0) {
      return defaultContainers;
    }
    const sealMatches = text.match(/KL\d+|SEAL[-:\s]*[A-Z0-9]+/gi) || ['KL789412'];
    
    return containerMatches.map((cntr: string, idx: number) => {
      const gross = Math.round((data.grossWeightKg || 24000) / containerMatches.length);
      const net = Math.round(gross * 0.92);
      const cbm = Number(((data.measurementCbm || 65) / containerMatches.length).toFixed(1));
      const seal = sealMatches[idx] ? sealMatches[idx].replace(/seal[-:\s]*/i, '') : `KL${789412 + idx}`;
      return {
        containerNumber: cntr,
        containerType: cntr.includes('40') || cntr.startsWith('MSK') ? "40' HIGH CUBE DRY" : "20' STANDARD DRY",
        sealNumber: seal,
        packageCount: data.packageCountAndType || '1,100 BAGS ON PALLETS',
        packageDescription: data.cargoDescription ? data.cargoDescription.split('\n')[0] : 'GENERAL CARGO (FCL/FCL)',
        grossWeightKg: gross,
        netWeightKg: net,
        volumeCbm: cbm
      };
    });
  };

  // Check if string contains modern CSS color functions that html2canvas cannot parse
  const hasModernColor = (s: unknown): s is string => {
    return typeof s === 'string' && (s.includes('oklch') || s.includes('oklab') || s.includes('lab(') || s.includes('color-mix') || s.includes('color('));
  };

  // Convert modern CSS color notations (oklch, oklab, etc.) into standard sRGB rgb/rgba format for html2canvas
  const convertModernColorToRgb = (val: string): string => {
    if (typeof val !== 'string' || !hasModernColor(val)) return val;

    // 1. Convert oklch(...)
    let res = val.replace(/oklch\(\s*([^/,\s)]+)(?:[\s,]+)([^/,\s)]+)(?:[\s,]+)([^/,\s)]+)(?:\s*(?:\/|,)\s*([^/,\s)]+))?\s*\)/gi, (_match, lStr, cStr, hStr, aStr) => {
      let l = parseFloat(lStr) || 0;
      if (lStr.includes('%')) l = l / 100;
      const c = cStr === 'none' ? 0 : parseFloat(cStr) || 0;
      let h = 0;
      if (hStr && hStr !== 'none') {
        if (hStr.endsWith('deg')) h = parseFloat(hStr) || 0;
        else if (hStr.endsWith('rad')) h = (parseFloat(hStr) || 0) * (180 / Math.PI);
        else if (hStr.endsWith('turn')) h = (parseFloat(hStr) || 0) * 360;
        else h = parseFloat(hStr) || 0;
      }
      let alpha = 1;
      if (aStr) {
        if (aStr.includes('%')) alpha = (parseFloat(aStr) || 100) / 100;
        else if (aStr !== 'none') alpha = parseFloat(aStr) ?? 1;
      }

      const hRad = h * (Math.PI / 180);
      const a = c * Math.cos(hRad);
      const b = c * Math.sin(hRad);

      const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;

      const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

      const toSrgb = (x: number) => {
        x = Math.max(0, Math.min(1, x));
        return Math.round((x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255);
      };

      if (alpha < 1) {
        return `rgba(${toSrgb(r)}, ${toSrgb(g)}, ${toSrgb(bl)}, ${Math.max(0, Math.min(1, alpha))})`;
      }
      return `rgb(${toSrgb(r)}, ${toSrgb(g)}, ${toSrgb(bl)})`;
    });

    // 2. Convert oklab(...)
    res = res.replace(/oklab\(\s*([^/,\s)]+)(?:[\s,]+)([^/,\s)]+)(?:[\s,]+)([^/,\s)]+)(?:\s*(?:\/|,)\s*([^/,\s)]+))?\s*\)/gi, (_match, lStr, aStr, bStr, alphaStr) => {
      let l = parseFloat(lStr) || 0;
      if (lStr.includes('%')) l = l / 100;
      const a = aStr === 'none' ? 0 : parseFloat(aStr) || 0;
      const b = bStr === 'none' ? 0 : parseFloat(bStr) || 0;
      let alpha = 1;
      if (alphaStr) {
        if (alphaStr.includes('%')) alpha = (parseFloat(alphaStr) || 100) / 100;
        else if (alphaStr !== 'none') alpha = parseFloat(alphaStr) ?? 1;
      }

      const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;

      const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

      const toSrgb = (x: number) => {
        x = Math.max(0, Math.min(1, x));
        return Math.round((x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255);
      };

      if (alpha < 1) {
        return `rgba(${toSrgb(r)}, ${toSrgb(g)}, ${toSrgb(bl)}, ${Math.max(0, Math.min(1, alpha))})`;
      }
      return `rgb(${toSrgb(r)}, ${toSrgb(g)}, ${toSrgb(bl)})`;
    });

    // 3. Fallback for any other unsupported functions like color(...) or color-mix(...)
    if (res.includes('color(') || res.includes('color-mix(')) {
      res = res.replace(/color\([^)]+\)/gi, 'rgb(30, 41, 59)')
               .replace(/color-mix\([^)]+\)/gi, 'rgba(30, 41, 59, 0.5)');
    }

    return res;
  };

  const createSafeComputedStyle = (realStyle: CSSStyleDeclaration): CSSStyleDeclaration => {
    return new Proxy(realStyle, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return (propName: string) => {
            const raw = target.getPropertyValue(propName);
            return hasModernColor(raw) ? convertModernColorToRgb(raw) : raw;
          };
        }
        if (prop === 'item') {
          return (idx: number) => target.item(idx);
        }
        let val: any;
        try {
          val = Reflect.get(target, prop, target);
        } catch {
          val = '';
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        if (hasModernColor(val)) {
          return convertModernColorToRgb(val);
        }
        return val;
      }
    });
  };

  const handlePrint = () => {
    if (previewMode === 'pdf') {
      setPreviewMode('document');
      setTimeout(() => {
        window.print();
      }, 80);
    } else {
      window.print();
    }
  };

  const generatePdfObject = async (targetEl: HTMLElement): Promise<jsPDF> => {
    const origWindowGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(elt: Element, pseudoElt?: string | null) {
      const real = origWindowGetComputedStyle.call(window, elt, pseudoElt);
      return createSafeComputedStyle(real);
    };

    try {
      // High-DPI canvas capture with modern color translation in clone
      const canvas = await html2canvas(targetEl, {
        scale: 2.4,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: targetEl.scrollWidth,
        windowHeight: targetEl.scrollHeight,
        onclone: (clonedDoc: Document) => {
          const win = clonedDoc.defaultView || window;
          const origCloned = win.getComputedStyle;
          win.getComputedStyle = function(elt: Element, pseudoElt?: string | null) {
            const real = origCloned.call(win, elt, pseudoElt);
            return createSafeComputedStyle(real);
          };

          // Remove scroll/overflow clipping on all parents in the clone
          let curr: HTMLElement | null = clonedDoc.getElementById(targetEl.id) || clonedDoc.body;
          while (curr && curr !== clonedDoc.body) {
            curr.style.overflow = 'visible';
            curr.style.maxHeight = 'none';
            curr.style.height = 'auto';
            curr = curr.parentElement;
          }
          if (clonedDoc.body) {
            clonedDoc.body.style.overflow = 'visible';
            clonedDoc.body.style.maxHeight = 'none';
            clonedDoc.body.style.height = 'auto';
          }

          // Sanitize inline styles in clonedDoc
          const allEls = clonedDoc.querySelectorAll('*');
          allEls.forEach((node) => {
            if (node instanceof HTMLElement && node.style && node.style.cssText && hasModernColor(node.style.cssText)) {
              node.style.cssText = convertModernColorToRgb(node.style.cssText);
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pageHeight = 295;

      if (type === 'HBL') {
        const page1El = document.getElementById('hbl-page-1');
        const page2El = document.getElementById('hbl-page-2');

        const pagesToRender: HTMLElement[] = [];
        if (page1El) pagesToRender.push(page1El);
        if (page2El) pagesToRender.push(page2El);

        if (pagesToRender.length === 0 && targetEl) {
          pagesToRender.push(targetEl);
        }

        const marginX = 6;
        const marginY = 6;
        const maxWidth = pdfWidth - (marginX * 2); // 198 mm
        const maxHeight = pdfHeight - (marginY * 2); // 285 mm

        for (let i = 0; i < pagesToRender.length; i++) {
          const el = pagesToRender[i];
          const pageCanvas = await html2canvas(el, {
            scale: 2.4,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            windowWidth: el.scrollWidth,
            windowHeight: el.scrollHeight,
            onclone: (clonedDoc: Document) => {
              const win = clonedDoc.defaultView || window;
              const origCloned = win.getComputedStyle;
              win.getComputedStyle = function(elt: Element, pseudoElt?: string | null) {
                const real = origCloned.call(win, elt, pseudoElt);
                return createSafeComputedStyle(real);
              };

              let curr: HTMLElement | null = clonedDoc.getElementById(el.id) || clonedDoc.body;
              while (curr && curr !== clonedDoc.body) {
                curr.style.overflow = 'visible';
                curr.style.maxHeight = 'none';
                curr.style.height = 'auto';
                curr = curr.parentElement;
              }
              if (clonedDoc.body) {
                clonedDoc.body.style.overflow = 'visible';
                clonedDoc.body.style.maxHeight = 'none';
                clonedDoc.body.style.height = 'auto';
              }

              const allEls = clonedDoc.querySelectorAll('*');
              allEls.forEach((node) => {
                if (node instanceof HTMLElement && node.style && node.style.cssText && hasModernColor(node.style.cssText)) {
                  node.style.cssText = convertModernColorToRgb(node.style.cssText);
                }
              });
            }
          });

          const pImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
          const pImgRatio = pageCanvas.width / pageCanvas.height;
          let renderWidth = maxWidth;
          let renderHeight = renderWidth / pImgRatio;

          if (renderHeight > maxHeight) {
            renderHeight = maxHeight;
            renderWidth = renderHeight * pImgRatio;
          }

          const posX = marginX + ((maxWidth - renderWidth) / 2);
          const posY = marginY;

          if (i > 0) {
            pdf.addPage();
          }
          pdf.addImage(pImgData, 'JPEG', posX, posY, renderWidth, renderHeight);
        }

        return pdf;
      }

      if (type === 'DO') {
        // Proportionally scale to guarantee 100% of the document fits inside A4 with clean margins
        const marginX = 8;
        const marginY = 8;
        const maxWidth = pdfWidth - (marginX * 2); // 194 mm
        const maxHeight = pdfHeight - (marginY * 2); // 281 mm

        const imgRatio = canvas.width / canvas.height;
        let renderWidth = maxWidth;
        let renderHeight = renderWidth / imgRatio;

        if (renderHeight > maxHeight) {
          renderHeight = maxHeight;
          renderWidth = renderHeight * imgRatio;
        }

        const posX = marginX + ((maxWidth - renderWidth) / 2);
        const posY = marginY;

        pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);
      } else if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      } else {
        let position = 0;
        let heightLeft = pdfHeight;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 5) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      }

      return pdf;
    } finally {
      window.getComputedStyle = origWindowGetComputedStyle;
    }
  };

  // Auto-generate high-res PDF preview stream whenever active document changes
  useEffect(() => {
    let isCancelled = false;

    // Reset previous blob
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    if (!activePrintDoc) return;

    if (type === 'DO' || type === 'HBL') {
      setPreviewMode('pdf');
      setZoomLevel(82);
    }

    const timer = setTimeout(async () => {
      const targetEl = (
        type === 'DO' ? document.getElementById('delivery-order-doc') :
        type === 'HBL' ? (document.getElementById('hbl-document-set') || document.getElementById('hbl-page-1') || printDocRef.current) :
        printDocRef.current
      ) || printDocRef.current;
      if (!targetEl) return;

      setIsGeneratingPreview(true);
      try {
        const pdf = await generatePdfObject(targetEl);
        if (!isCancelled && pdf) {
          const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      } catch (err) {
        console.error('Auto preview PDF generation failed:', err);
      } finally {
        if (!isCancelled) {
          setIsGeneratingPreview(false);
        }
      }
    }, 220);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activePrintDoc?.type, activePrintDoc?.data?.id, activePrintDoc?.data?.doNumber, activePrintDoc?.data?.hblNumber, activeTab]);

  const handleDownloadFullHbl = async () => {
    setIsGeneratingPdf(true);
    showToast('info', 'Compiling Full HBL', 'Rendering all 3 pages (Face, Annexure & Terms)...');

    // If not already in 'all' view, switch so all 3 pages are mounted in DOM
    if (activeTab !== 'all') {
      setActiveTab('all');
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    const origWindowGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(elt: Element, pseudoElt?: string | null) {
      const real = origWindowGetComputedStyle.call(window, elt, pseudoElt);
      return createSafeComputedStyle(real);
    };

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const pageIds = ['hbl-page-1', 'hbl-page-2', 'hbl-page-3'];
      let addedCount = 0;

      for (let i = 0; i < pageIds.length; i++) {
        let pageEl = document.getElementById(pageIds[i]);
        if (!pageEl) {
          pageEl = document.getElementById(`hbl-export-page-${i + 1}`);
        }
        if (!pageEl) continue;

        const canvas = await html2canvas(pageEl, {
          scale: 2.2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc: Document) => {
            const win = clonedDoc.defaultView || window;
            const origCloned = win.getComputedStyle;
            win.getComputedStyle = function(elt: Element, pseudoElt?: string | null) {
              const real = origCloned.call(win, elt, pseudoElt);
              return createSafeComputedStyle(real);
            };

            const allEls = clonedDoc.querySelectorAll('*');
            allEls.forEach((node) => {
              if (node instanceof HTMLElement && node.style && node.style.cssText && hasModernColor(node.style.cssText)) {
                node.style.cssText = convertModernColorToRgb(node.style.cssText);
              }
            });
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgH = (canvas.height * pdfWidth) / canvas.width;

        if (addedCount > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, imgH));
        addedCount++;
      }

      const cleanDocNumber = (data.hblNumber || 'HBL').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `HBL_${cleanDocNumber}_COMPLETE_SET.pdf`;
      pdf.save(fileName);

      showToast('success', 'Complete HBL Downloaded', `${fileName} (All 3 Pages) saved.`);
    } catch (err: any) {
      console.error('PDF compilation error:', err);
      showToast('warning', 'Direct Print Fallback', 'Opening print preview for all pages.');
      window.print();
    } finally {
      window.getComputedStyle = origWindowGetComputedStyle;
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    const cleanDocNumber = (
      type === 'HBL' ? data.hblNumber :
      type === 'MBL' ? data.mblNumber :
      type === 'DO' ? (data.doNumber || data.id) :
      type === 'INVOICE' ? data.invoiceNumber :
      type === 'QUOTE' ? data.quoteNumber :
      type === 'DGD' ? `${data.unNumber || 'UN'}_${data.hblNumber || 'DGD'}` :
      type === 'ARRIVAL_NOTICE' ? (data.hblNumber || data.lineIgmNumber || 'ARRIVAL') :
      type === 'VGM' ? (data.containerNumber || data.id || 'VGM') :
      type === 'COVER_NOTE' ? (data.policyNumber || data.id || 'COVER_NOTE') :
      type === 'CREDIT_NOTE' ? (data.creditNoteNumber || 'CREDIT_NOTE') :
      type === 'DEBIT_NOTE' ? (data.debitNoteNumber || 'DEBIT_NOTE') :
      'Document'
    ).replace(/[^a-zA-Z0-9_-]/g, '_');

    const fileName = `${type}_${cleanDocNumber}.pdf`;

    // Fast path: if preview PDF blob is already generated, download directly!
    if (pdfBlobUrl) {
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = fileName;
      a.click();
      showToast('success', 'Download Complete', `${fileName} saved to your computer.`);
      return;
    }

    const element = (
      type === 'DO' ? document.getElementById('delivery-order-doc') :
      type === 'HBL' ? (document.getElementById('hbl-document-set') || document.getElementById('hbl-page-1') || printDocRef.current) :
      printDocRef.current
    ) || printDocRef.current;
    if (!element) return;

    setIsGeneratingPdf(true);
    showToast('info', 'Generating PDF', 'Rendering high-resolution vector document...');

    try {
      const pdf = await generatePdfObject(element);
      pdf.save(fileName);
      showToast('success', 'Download Complete', `${fileName} saved to your computer.`);
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('warning', 'Opening Print Dialog', 'Direct PDF render fallback initiated.');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const trackingUrl = `https://mapsnvocc.in/tracking/${data.shipmentId || data.hblNumber || data.mblNumber || data.doNumber || 'MAPS-DIRECT'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(true);
    showToast('success', 'Link Copied', 'Direct document verification link copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getWatermarkText = () => {
    if (type === 'HBL') {
      if (selectedCopy === 'COPY NON-NEGOTIABLE') return 'NON-NEGOTIABLE COPY';
      if (selectedCopy === 'TELEX RELEASED') return 'SURRENDERED / TELEX RELEASE';
      return selectedCopy;
    }
    if (type === 'MBL') {
      if (data.status === 'Telex Released' || data.status === 'Surrendered') return 'SURRENDERED / TELEX RELEASE';
      return 'CARRIER MASTER B/L';
    }
    if (type === 'DO') return 'OFFICIAL DELIVERY ORDER';
    if (type === 'INVOICE') return 'ORIGINAL FOR RECIPIENT';
    if (type === 'QUOTE') return 'OFFICIAL QUOTATION';
    if (type === 'DGD') return 'IMO DANGEROUS GOODS DECLARATION';
    if (type === 'ARRIVAL_NOTICE') return 'CARGO ARRIVAL ADVICE';
    if (type === 'VGM') return 'SOLAS VGM VERIFIED GROSS MASS';
    if (type === 'COVER_NOTE') return 'MARINE INSURANCE COVER NOTE';
    if (type === 'CREDIT_NOTE') return 'GST CREDIT NOTE';
    if (type === 'DEBIT_NOTE') return 'GST DEBIT NOTE';
    return 'ORIGINAL';
  };

  if (!activePrintDoc) return null;

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="print-modal-container relative w-full max-w-5xl bg-[#0F1D33] border border-[#26395A] rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#1C2D4A] flex flex-wrap items-center justify-between gap-3 bg-[#16263F] shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#E88B2A]/20 text-[#E88B2A] border border-[#E88B2A]/30 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {type === 'DO' ? 'DELIVERY ORDER' :
               type === 'HBL' ? 'HOUSE BILL OF LADING' :
               type === 'DGD' ? 'IMO DANGEROUS GOODS' :
               type === 'ARRIVAL_NOTICE' ? 'ARRIVAL NOTICE' :
               type === 'VGM' ? 'SOLAS VGM CERTIFICATE' :
               type === 'COVER_NOTE' ? 'MARINE INSURANCE' :
               type === 'CREDIT_NOTE' ? 'CREDIT NOTE' :
               type === 'DEBIT_NOTE' ? 'DEBIT NOTE' :
               type} Document Suite
            </span>
            <div>
              <span className="text-sm font-bold text-[#F4EFE6] font-mono block">
                {type === 'HBL' ? `House B/L ${data.hblNumber}` :
                 type === 'MBL' ? data.mblNumber :
                 type === 'DO' ? `Delivery Order ${data.doNumber}` :
                 type === 'INVOICE' ? data.invoiceNumber :
                 type === 'QUOTE' ? data.quoteNumber :
                 type === 'DGD' ? `IMO DGD ${data.unNumber} (${data.hblNumber || 'Hazmat'})` :
                 type === 'ARRIVAL_NOTICE' ? `Arrival Notice ${data.hblNumber || data.vesselVoyage || ''}` :
                 type === 'VGM' ? `VGM Declaration ${data.containerNumber || ''}` :
                 type === 'COVER_NOTE' ? `Marine Policy ${data.policyNumber || 'MAPS/MCI/2026'}` :
                 type === 'CREDIT_NOTE' ? `Credit Note ${data.creditNoteNumber || 'MAPS/CN/24-25'}` :
                 type === 'DEBIT_NOTE' ? `Debit Note ${data.debitNoteNumber || 'MAPS/DN/24-25'}` :
                 'Document'}
              </span>
              <span className="text-[10px] text-[#A8A299]">
                Verified Digital Ocean Document • MAPS NVOCC Gandhidham
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Copy Selector for HBL */}
            {type === 'HBL' && (
              <select
                value={selectedCopy}
                onChange={e => setSelectedCopy(e.target.value as any)}
                className="bg-[#0F1D33] border border-[#26395A] rounded-lg px-2.5 py-1.5 text-xs text-[#F4EFE6] font-semibold focus:outline-none focus:border-[#E88B2A]"
                title="Select Bill of Lading watermark copy"
              >
                <option value="ORIGINAL 1">Original 1 of 3 (First Original)</option>
                <option value="ORIGINAL 2">Original 2 of 3 (Second Original)</option>
                <option value="ORIGINAL 3">Original 3 of 3 (Third Original)</option>
                <option value="COPY NON-NEGOTIABLE">Non-Negotiable Copy</option>
                <option value="TELEX RELEASED">Telex Released / Surrendered</option>
              </select>
            )}

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              title={`Download official ${type === 'DO' ? 'Delivery Order' : type === 'HBL' ? 'Combined Transport B/L' : type} PDF`}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {type === 'HBL' ? 'Download HBL (PDF)' :
                     type === 'DO' ? 'Download Delivery Order (PDF)' :
                     type === 'DGD' ? 'Download DGD (PDF)' :
                     type === 'ARRIVAL_NOTICE' ? 'Download Arrival Notice (PDF)' :
                     type === 'VGM' ? 'Download VGM Certificate (PDF)' :
                     type === 'COVER_NOTE' ? 'Download Cover Note (PDF)' :
                     type === 'CREDIT_NOTE' ? 'Download Credit Note (PDF)' :
                     type === 'DEBIT_NOTE' ? 'Download Debit Note (PDF)' :
                     'Download PDF'}
                  </span>
                </>
              )}
            </button>

            {/* Print / Save as PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#E88B2A] hover:bg-[#d47b1c] text-[#0A1628] transition-all shadow-md shadow-[#E88B2A]/20"
              title="Open browser print dialog for A4 printing"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>

            {/* Share / Copy Verification Link */}
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg bg-[#0F1D33] hover:bg-[#1D3251] text-[#A8A299] hover:text-[#F4EFE6] border border-[#26395A] transition-colors"
              title="Copy verified online tracking link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={() => setActivePrintDoc(null)}
              className="p-1.5 rounded-lg text-[#A8A299] hover:text-[#F4EFE6] hover:bg-[#1D3251] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar for HBL: Page 1 (Face) vs Page 2 (Annexure) vs All Pages */}
        {type === 'HBL' && (
          <div className="px-6 py-1.5 bg-[#0A1628] border-b border-[#1C2D4A] flex items-center justify-between text-xs no-print">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setActiveTab('front')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors text-xs flex items-center gap-1.5 ${
                  activeTab === 'front'
                    ? 'bg-[#E88B2A] text-[#0A1628]'
                    : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                <span>Page 1: Combined Transport B/L</span>
              </button>
              <button
                onClick={() => setActiveTab('annexure')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors text-xs flex items-center gap-1.5 ${
                  activeTab === 'annexure'
                    ? 'bg-[#E88B2A] text-[#0A1628]'
                    : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                <span>Page 2: Container Annexure</span>
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors text-xs flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-[#E88B2A] text-[#0A1628]'
                    : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
                title="View both pages together"
              >
                <span>All Pages (Whole HBL)</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#A8A299]">
              <span>B/L No: <strong className="text-[#F4EFE6] font-mono">{data.hblNumber || 'LCMUNJEALMU2600407'}</strong></span>
            </div>
          </div>
        )}

        {/* Preview View Mode & Scaling Bar */}
        <div className="px-4 sm:px-6 py-2 bg-[#0C1524] border-b border-[#1C2D4A] flex flex-wrap items-center justify-between gap-3 text-xs no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#A8A299]">Preview Mode:</span>
            <div className="flex items-center bg-[#16263F] p-0.5 rounded-lg border border-[#26395A]">
              <button
                onClick={() => setPreviewMode('pdf')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewMode === 'pdf'
                    ? 'bg-[#E88B2A] text-[#0A1628] shadow-sm'
                    : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Preview</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  previewMode === 'pdf' ? 'bg-black/20 text-[#0A1628]' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}>
                  Exact PDF
                </span>
              </button>

              <button
                onClick={() => setPreviewMode('document')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  previewMode === 'document'
                    ? 'bg-[#E88B2A] text-[#0A1628] shadow-sm'
                    : 'text-[#A8A299] hover:text-[#F4EFE6]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Document Sheet</span>
              </button>
            </div>
          </div>

          {/* Right-hand controls */}
          <div className="flex items-center gap-3">
            {previewMode === 'document' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#A8A299]">Zoom:</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                  className="p-1 rounded bg-[#16263F] hover:bg-[#1E3860] text-[#F4EFE6] border border-[#26395A]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-[#F4EFE6] w-10 text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                  className="p-1 rounded bg-[#16263F] hover:bg-[#1E3860] text-[#F4EFE6] border border-[#26395A]"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className={`px-2 py-0.5 rounded text-[10px] border ${
                    zoomLevel === 100
                      ? 'bg-[#E88B2A]/20 text-[#E88B2A] border-[#E88B2A]/40'
                      : 'bg-[#16263F] hover:bg-[#1E3860] text-[#A8A299] border-[#26395A]'
                  }`}
                >
                  100%
                </button>
                <button
                  onClick={() => setZoomLevel(type === 'DO' ? 80 : 75)}
                  className={`px-2 py-0.5 rounded text-[10px] border ${
                    zoomLevel === (type === 'DO' ? 80 : 75)
                      ? 'bg-[#E88B2A]/20 text-[#E88B2A] border-[#E88B2A]/40'
                      : 'bg-[#16263F] hover:bg-[#1E3860] text-[#A8A299] border-[#26395A]'
                  }`}
                  title="Fit whole A4 page to screen"
                >
                  Fit Page
                </button>
              </div>
            )}

            {previewMode === 'pdf' && (
              <div className="flex items-center gap-2 text-[11px] text-[#A8A299]">
                {isGeneratingPreview ? (
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating high-res PDF...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Official A4 PDF Ready
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Printable Paper / PDF Area */}
        <div className="preview-viewport relative flex-1 min-h-[560px] max-h-[calc(96vh-140px)] overflow-hidden bg-[#131b26] flex justify-center items-center">
          {/* 1. PDF Preview View (Embedded Native Chrome PDF Viewer) */}
          {previewMode === 'pdf' && (
            <div className="w-full h-full p-2 sm:p-4 flex flex-col items-center justify-center no-print">
              {pdfBlobUrl ? (
                <iframe
                  src={`${pdfBlobUrl}#toolbar=1&navpanes=0&view=FitH`}
                  className="w-full h-full max-w-4xl min-h-[560px] rounded-xl border border-[#26395A] shadow-2xl bg-[#525659]"
                  title="Official PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-[#A8A299]">
                  <Loader2 className="w-10 h-10 text-[#E88B2A] animate-spin mb-3" />
                  <p className="text-base font-bold text-[#F4EFE6]">
                    Rendering Official {type === 'DO' ? 'Delivery Order' : type === 'HBL' ? 'Combined Transport B/L' : type} PDF...
                  </p>
                  <p className="text-xs text-[#A8A299] mt-1 max-w-md">
                    Building high-resolution vector PDF in exact {type === 'HBL' ? 'Combined Transport B/L & Container Annexure' : 'official'} format
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. Document Sheet View (and always mounted for capture) */}
          <div
            className={`print-area-wrapper w-full h-full overflow-y-auto p-4 sm:p-8 flex justify-center ${
              previewMode === 'pdf' ? 'absolute -left-[99999px] -top-[99999px] pointer-events-none opacity-0' : ''
            }`}
          >
            <div
              style={previewMode === 'document' ? { transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' } : undefined}
              className="w-full max-w-[850px] flex justify-center"
            >
              <div
                id="printable-document"
                ref={printDocRef}
                className={`printable-area w-full bg-white text-zinc-900 shadow-2xl rounded-sm border border-zinc-300 text-xs leading-relaxed font-sans relative overflow-hidden ${
                  (type === 'DO' || type === 'HBL') ? 'p-2 sm:p-3' : 'p-8 sm:p-10'
                }`}
              >
            
            {/* Background Watermark */}
            {type !== 'DO' && type !== 'HBL' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.035] z-0">
                <span className="text-8xl font-black rotate-[-35deg] tracking-widest text-black uppercase text-center">
                  {getWatermarkText()}
                </span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
               1. HOUSE BILL OF LADING (HBL) — EXACT OFFICIAL TEMPLATE FORMAT
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'HBL' && (() => {
              const blNumber = data.hblNumber || 'LCMUNJEALMU2600407';
              const isDraft = data.status === 'Draft' || !data.status || blNumber.includes('DRAFT');
              const blNumberDisplay = blNumber.includes('(DRAFT)') ? blNumber : (isDraft ? `${blNumber} (DRAFT)` : blNumber);

              const shipperName = data.shipperName || 'ALL-WAYS LOGISTICS INDIA PVT LTD';
              const shipperAddress = data.shipperAddress || 'UNIT NO. 201-205, 2ND FLOOR TOWER 05 RPS INFINIA\n12/6 MILESTONE,\nSARAI KHAWAJA SECTOR 27C MATHURA ROAD\nFARIDABAD HARYANA-121003';

              const consigneeFull = data.consigneeText || 'INTERNATIONAL EVENTFREIGHT LLC\nSHAMS BUSINESS CENTRE SHARJAH\nSHARJHA UNITED ARAB EMIRATES\nPHONE:971589836400\nEMAIL: UMARSAIF@INTLEVENTFREIGHT.COM';
              const consigneeLines = consigneeFull.split('\n');
              const consigneeName = consigneeLines[0] || 'INTERNATIONAL EVENTFREIGHT LLC';
              const consigneeRest = consigneeLines.slice(1).join('\n');

              const notifyFull = data.notifyPartyText || data.notifyParty || data.consigneeText || 'INTERNATIONAL EVENTFREIGHT LLC\nSHAMS BUSINESS CENTRE SHARJAH\nSHARJHA UNITED ARAB EMIRATES\nPHONE:971589836400\nEMAIL: UMARSAIF@INTLEVENTFREIGHT.COM';
              const notifyLines = notifyFull.split('\n');
              const notifyName = notifyLines[0] || 'INTERNATIONAL EVENTFREIGHT LLC';
              const notifyRest = notifyLines.slice(1).join('\n');

              const placeOfAcceptance = data.placeOfReceipt || data.placeOfAcceptance || 'MUNDRA';
              const preCarriageBy = data.preCarriageBy || '';
              const portOfLoading = data.portOfLoading || 'MUNDRA';
              const portOfDischarge = data.portOfDischarge || 'JEBEL ALI';

              const nvoccDefaultDelivery = `${firmDetails?.tradeName || 'MAPS NVOCC PRO'} (DESTINATION AGENT)\n${(firmDetails?.registeredAddress || '2nd Floor, Gurukul City Center, Plot 20, Sector 10, Gandhidham, Kutch, Gujarat 370201').toUpperCase()}\nEMAIL: ${(firmDetails?.email || 'ops@mapsfreight.com').toUpperCase()}\nTEL: ${firmDetails?.phone || '+91 2836 123456'}`;

              const rawDelivery = data.deliveryContact || data.destinationAgent || '';
              const deliveryContact = (rawDelivery && !rawDelivery.toUpperCase().includes('LANCIA') && !rawDelivery.toUpperCase().includes('LANCER'))
                ? rawDelivery
                : nvoccDefaultDelivery;
              const deliveryLines = deliveryContact.split('\n');

              const oceanVesselVoyage = `${data.oceanVessel || 'DP WORLD CHENNAI'} / ${data.voyageNo || '014'}`;
              const placeOfDelivery = data.placeOfDelivery || 'JEBEL ALI';

              const containersList = getHblContainerRows();
              const totalPackages = data.packageCountAndType?.split(' ')[0] || data.packageCount || '9363';

              const defaultCargoDesc = `SAID TO CONTAIN / WEIGH & MEASURE

10 X 20GP CONTAINERS
9363 BOXES
PORCELAIN GLAZED VITRIFIED TILES
H.S.CODE \` 69072100
600X1200X20 \` 1800 BOXES
600X1200X20 \` 2700 BOXES
INVOICE NO. EXT-60/2026-27 DATE: 07.10.2026
SB: 7557678 DT: 08.10.2026
TOTAL GROSS WT. 139000 KGS
TOTAL NET WT. 137000 KGS
TOTAL 4863 BOXES PACKED ON 154 PALLETS
PORCELAIN GLAZED VITRIFIED TILES
H.S.CODE \` 69072100
600X1200X9 \` 4113 BOXES
600X1200X20 \` 750 BOXES
INVOICE NO. EXT-61/2026-27 DATE: 08.10.2026
SB: 7583063 DT: 08-10-2026
TOTAL GROSS WT. 139000 KGS
TOTAL NET WT. 137000 KGS

14 DAYS FREE DETENTION AT DESTINATION

SHIPPER\`S LOAD, STOW, COUNT & CUSTOM SEALED. ALL
DESTINATION CHARGES INCLUDING GROUND RENT/PORT STORAGE
AT POD WILL BE ON A/C OF CONSIGNEE. LINE OR CARRIERS NOT
LIABLE FOR ANY CLAIMS IF CARGO FOUND IN DAMAGE CONDITION.
CONTENTS AND PACKAGES DECLARED BY SHIPPER-QUALITY,
QUANTITY AND NATURE OF THE CARGO STUFFED INSIDE THE
CONTAINER IS UNKNOWN TO CARRIER. EMPTY CONTAINER
RETURNED IN SOUND CONDITION TO THE LINE\`S NOMINATED DEPOT
ON CONSIGNEE\`S COST AND RISK. SHIPMENT TO BE CLEARED
WITHIN 30 DAYS OF DISCHARGE AT FPOD FAILING WHICH CARRIER
OR ITS AGENTS RESERVE ALL THE RIGHTS TO GET BACK EMPTY
CONTAINER IN LINER CUSTODY.`;

              const cargoDescription = data.cargoDescription || defaultCargoDesc;

              const grossWtFormatted = typeof data.grossWeightKg === 'number'
                ? `${data.grossWeightKg.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} KGS`
                : (data.grossWeightKg || '278,000.000 KGS');

              const netWtFormatted = typeof data.netWeightKg === 'number'
                ? `${data.netWeightKg.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} KGS`
                : (data.netWeightKg || '274,000.000 KGS');

              const freightTerm = data.freightTerm ? `*FREIGHT ${data.freightTerm.toUpperCase()}*` : '*FREIGHT PREPAID*';
              const freightPayableAt = data.freightPayableAt || 'MUNDRA';
              const numberOfOriginals = data.numberOfOriginals ? `${data.numberOfOriginals} (${data.numberOfOriginals === 3 ? 'THREE' : data.numberOfOriginals})` : '3 (THREE)';
              const placeAndDateOfIssue = `${data.placeOfIssue || 'MUNDRA'}, ${data.dateOfIssue || '12-OCT-2026'}`;

              const rawCarrierName = data.carrierName || '';
              const carrierName = (rawCarrierName && !rawCarrierName.toUpperCase().includes('LANCIA'))
                ? rawCarrierName
                : (firmDetails?.legalName || 'MAPS Freight Solutions Pvt Ltd').toUpperCase();

              const rawAgents = data.asAgentsCarrier || '';
              const asAgentsCarrier = (rawAgents && !rawAgents.toUpperCase().includes('LANCER'))
                ? rawAgents
                : (firmDetails?.tradeName || 'MAPS NVOCC Pro').toUpperCase();

              const showPage1 = previewMode === 'pdf' || activeTab === 'front' || activeTab === 'all';
              const showPage2 = previewMode === 'pdf' || activeTab === 'annexure' || activeTab === 'all';

              return (
                <div id="hbl-document-set" className="w-full max-w-[760px] mx-auto space-y-6">
                  {/* ─────────────────────────────────────────────────────────────
                      PAGE 1: COMBINED TRANSPORT BILL OF LADING
                      ───────────────────────────────────────────────────────────── */}
                  {showPage1 && (
                    <div
                      id="hbl-page-1"
                      className="relative z-10 bg-white text-black font-sans text-[8px] leading-tight select-text w-full p-2"
                    >
                      {/* Document Title Header */}
                      <div className="text-center py-1 mb-1">
                        <h1 className="text-[13px] font-bold tracking-wider uppercase text-black font-sans">
                          COMBINED TRANSPORT BILL OF LADING
                        </h1>
                      </div>

                      {/* Main Boxed Layout */}
                      <div className="border border-black divide-y divide-black bg-white">
                        {/* Row 1: Left (Shipper, Consignee, Notify) & Right (BL Number + Barcode, Image, Terms) */}
                        <div className="grid grid-cols-2 divide-x divide-black">
                          {/* Left Column: Stacked Shipper, Consignee, Notify */}
                          <div className="divide-y divide-black flex flex-col justify-between">
                            {/* SHIPPER */}
                            <div className="p-2 min-h-[72px]">
                              <div className="font-bold uppercase text-[7.5px] text-black mb-0.5">SHIPPER</div>
                              <div className="font-bold text-[8.5px] leading-snug">{shipperName}</div>
                              <div className="whitespace-pre-line text-[8px] leading-snug text-black mt-0.5">
                                {shipperAddress}
                              </div>
                            </div>

                            {/* CONSIGNEE */}
                            <div className="p-2 min-h-[88px]">
                              <div className="font-bold uppercase text-[7.5px] text-black mb-0.5">CONSIGNEE</div>
                              <div className="font-bold text-[8.5px] leading-snug">{consigneeName}</div>
                              <div className="whitespace-pre-line text-[8px] leading-snug text-black mt-0.5">
                                {consigneeRest}
                              </div>
                            </div>

                            {/* NOTIFY PARTY */}
                            <div className="p-2 min-h-[72px]">
                              <div className="font-bold uppercase text-[7.5px] text-black mb-0.5">NOTIFY PARTY</div>
                              <div className="font-bold text-[8.5px] leading-snug">{notifyName}</div>
                              <div className="whitespace-pre-line text-[8px] leading-snug text-black mt-0.5">
                                {notifyRest}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Stacked (1) B/L Number + Barcode, (2) Image, (3) Terms */}
                          <div className="divide-y divide-black flex flex-col justify-between">
                            {/* 1. B/L Number & Barcode */}
                            <div className="flex flex-col">
                              {/* Top row of B/L block: B/L NUMBER | Number */}
                              <div className="flex border-b border-black text-[8px]">
                                <div className="w-[110px] p-1.5 font-bold uppercase text-[7.5px] text-black border-r border-black shrink-0">
                                  B/L NUMBER
                                </div>
                                <div className="p-1.5 font-bold font-mono text-[8.5px] text-black tracking-wide truncate">
                                  {blNumberDisplay}
                                </div>
                              </div>

                              {/* Barcode Graphic centered cleanly below B/L Number */}
                              <div className="py-2 px-4 flex justify-center items-center">
                                <svg className="w-[75%] max-w-[240px] h-7" viewBox="0 0 160 30" preserveAspectRatio="none">
                                  <rect x="0" y="0" width="3" height="30" fill="black" />
                                  <rect x="5" y="0" width="1" height="30" fill="black" />
                                  <rect x="8" y="0" width="4" height="30" fill="black" />
                                  <rect x="14" y="0" width="2" height="30" fill="black" />
                                  <rect x="18" y="0" width="1" height="30" fill="black" />
                                  <rect x="21" y="0" width="3" height="30" fill="black" />
                                  <rect x="26" y="0" width="2" height="30" fill="black" />
                                  <rect x="30" y="0" width="5" height="30" fill="black" />
                                  <rect x="37" y="0" width="2" height="30" fill="black" />
                                  <rect x="41" y="0" width="1" height="30" fill="black" />
                                  <rect x="44" y="0" width="3" height="30" fill="black" />
                                  <rect x="49" y="0" width="4" height="30" fill="black" />
                                  <rect x="55" y="0" width="1" height="30" fill="black" />
                                  <rect x="58" y="0" width="2" height="30" fill="black" />
                                  <rect x="62" y="0" width="4" height="30" fill="black" />
                                  <rect x="68" y="0" width="2" height="30" fill="black" />
                                  <rect x="72" y="0" width="1" height="30" fill="black" />
                                  <rect x="75" y="0" width="3" height="30" fill="black" />
                                  <rect x="80" y="0" width="5" height="30" fill="black" />
                                  <rect x="87" y="0" width="2" height="30" fill="black" />
                                  <rect x="91" y="0" width="1" height="30" fill="black" />
                                  <rect x="94" y="0" width="4" height="30" fill="black" />
                                  <rect x="100" y="0" width="2" height="30" fill="black" />
                                  <rect x="104" y="0" width="3" height="30" fill="black" />
                                  <rect x="109" y="0" width="1" height="30" fill="black" />
                                  <rect x="112" y="0" width="4" height="30" fill="black" />
                                  <rect x="118" y="0" width="2" height="30" fill="black" />
                                  <rect x="122" y="0" width="5" height="30" fill="black" />
                                  <rect x="129" y="0" width="2" height="30" fill="black" />
                                  <rect x="133" y="0" width="1" height="30" fill="black" />
                                  <rect x="136" y="0" width="3" height="30" fill="black" />
                                  <rect x="141" y="0" width="4" height="30" fill="black" />
                                  <rect x="147" y="0" width="2" height="30" fill="black" />
                                  <rect x="151" y="0" width="1" height="30" fill="black" />
                                  <rect x="154" y="0" width="4" height="30" fill="black" />
                                </svg>
                              </div>
                            </div>

                            {/* 2. Image Placeholder (Solid Black Box with "Insert image here") */}
                            <div className="bg-black text-white flex items-center justify-center p-3 text-center font-bold text-[10px] tracking-widest uppercase select-none h-[88px]">
                              Insert image here
                            </div>

                            {/* 3. Legal Terms Block */}
                            <div className="p-2 text-[6.5px] leading-[1.25] text-justify text-black space-y-1">
                              <p>
                                Received the Carrier the Goods as specified below in apparent good order and condition unless otherwise stated to be transported to such place as agreed, authorised or permitted herein and subject to all terms and conditions appearing on the front and reverse of this Bill of Lading which the Merchant agrees by accepting this Bill of Lading, any local privileges and customs notwithstanding.
                              </p>
                              <p>
                                The particulars given below as stated by the shipper and the weight, measure, quantity, condition, contents and the value of goods are unknown to the carrier. In WITNESS whereof one (1) original Bill of Lading has been signed if not otherwise stated hereafter, the same being accomplished, the other(s). If any, to be void. If required by the Carrier one (1) original Bill of Lading must be surrendered duly endorsed in exchange for the Goods or Delivery Order.
                              </p>
                              <p>
                                One of the MTD(s) must be surrendered duly endorsed in exchange for the goods. In witness where of the original MTD all this tenor and date have been singed in the number indicated below one of which being accomplished the other(s) to be voide
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Acceptance, Pre-Carriage, POL, POD & Delivery Contact */}
                        <div className="grid grid-cols-12 divide-x divide-black">
                          {/* Left 7 cols: 2x2 grid */}
                          <div className="col-span-7 divide-y divide-black">
                            <div className="grid grid-cols-2 divide-x divide-black">
                              <div className="p-1.5 min-h-[36px]">
                                <div className="font-bold uppercase text-[7px] text-black">PLACE OF ACCEPTANCE</div>
                                <div className="font-bold text-[8.5px] uppercase mt-0.5">{placeOfAcceptance}</div>
                              </div>
                              <div className="p-1.5 min-h-[36px]">
                                <div className="font-bold uppercase text-[7px] text-black">PRE-CARRIAGE BY</div>
                                <div className="font-bold text-[8.5px] uppercase mt-0.5">{preCarriageBy}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-black">
                              <div className="p-1.5 min-h-[36px]">
                                <div className="font-bold uppercase text-[7px] text-black">PORT OF LOADING</div>
                                <div className="font-bold text-[8.5px] uppercase mt-0.5">{portOfLoading}</div>
                              </div>
                              <div className="p-1.5 min-h-[36px]">
                                <div className="font-bold uppercase text-[7px] text-black">PORT OF DISCHARGE</div>
                                <div className="font-bold text-[8.5px] uppercase mt-0.5">{portOfDischarge}</div>
                              </div>
                            </div>
                          </div>

                          {/* Right 5 cols: TO OBTAIN DELIVERY CONTACT */}
                          <div className="col-span-5 p-1.5 min-h-[72px] flex flex-col justify-between">
                            <div>
                              <div className="font-bold uppercase text-[7px] text-black mb-0.5">TO OBTAIN DELIVERY CONTACT</div>
                              <div className="font-bold text-[8px] leading-tight uppercase">
                                {deliveryLines[0]}
                              </div>
                              <div className="text-[7px] leading-tight whitespace-pre-line uppercase mt-0.5">
                                {deliveryLines.slice(1).join('\n')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Vessel / Place of Delivery / Modes of Transport */}
                        <div className="grid grid-cols-4 divide-x divide-black text-[7.5px]">
                          <div className="p-1.5 min-h-[34px]">
                            <div className="font-bold uppercase text-[7px] text-black">OCEAN VESSEL / VOYAGE</div>
                            <div className="font-bold text-[8.5px] uppercase mt-0.5">{oceanVesselVoyage}</div>
                          </div>
                          <div className="p-1.5 min-h-[34px]">
                            <div className="font-bold uppercase text-[7px] text-black">PLACE OF DELIVERY</div>
                            <div className="font-bold text-[8.5px] uppercase mt-0.5">{placeOfDelivery}</div>
                          </div>
                          <div className="p-1.5 min-h-[34px]">
                            <div className="font-bold uppercase text-[7px] text-black">MODES/MEANS OF TRANSPORT</div>
                            <div className="font-bold text-[8.5px] uppercase mt-0.5">{data.modesOfTransport || ''}</div>
                          </div>
                          <div className="p-1.5 min-h-[34px]">
                            <div className="font-bold uppercase text-[7px] text-black">ROUTE/PLACE OF TRANSPORT</div>
                            <div className="font-bold text-[8.5px] uppercase mt-0.5">{data.routePlaceOfTransport || ''}</div>
                          </div>
                        </div>

                        {/* Row 4: Cargo Particulars Header Table */}
                        <div>
                          <div className="grid grid-cols-12 divide-x divide-black text-[7px] font-bold uppercase text-black text-center bg-white border-b border-black">
                            <div className="col-span-2 py-1 px-1 text-left">
                              <div>CONTAINER NO</div>
                              <div>MARKS & NUMBERS</div>
                            </div>
                            <div className="col-span-1 py-1 px-1 flex items-center justify-center">
                              NO OF PKGS
                            </div>
                            <div className="col-span-5 py-1 px-1 flex items-center justify-center">
                              DESCRIPTION OF GOODS & PACKAGES
                            </div>
                            <div className="col-span-3 py-1 px-1 flex items-center justify-center">
                              TOTAL GR. WT. (KGS)
                            </div>
                            <div className="col-span-1 py-1 px-1 flex items-center justify-center">
                              VOL (CBM)
                            </div>
                          </div>

                          {/* Cargo Particulars Body */}
                          <div className="grid grid-cols-12 divide-x divide-black min-h-[320px] text-[8px] leading-tight bg-white">
                            {/* Col 1: Container / Marks */}
                            <div className="col-span-2 p-1.5 text-black font-mono text-[7.5px] whitespace-pre-line">
                              {data.marksAndNumbers || ''}
                            </div>

                            {/* Col 2: No of Pkgs */}
                            <div className="col-span-1 p-1.5 text-center font-bold text-black text-[8.5px]">
                              {totalPackages}
                            </div>

                            {/* Col 3: Description of Goods & Packages */}
                            <div className="col-span-5 p-1.5 flex flex-col justify-between">
                              <div className="space-y-1">
                                <div className="font-bold uppercase text-[8px] text-black">
                                  SAID TO CONTAIN / WEIGH & MEASURE
                                </div>
                                <div className="whitespace-pre-line text-[7.5px] leading-snug text-black">
                                  {cargoDescription}
                                </div>
                              </div>
                            </div>

                            {/* Col 4: Total Gr. Wt & Floating Stamps */}
                            <div className="col-span-3 p-1.5 flex flex-col justify-between">
                              <div className="text-left font-bold text-black">
                                <div className="text-[8.5px]">{grossWtFormatted}</div>
                                <div className="text-[7.5px] mt-1 text-black font-semibold">NET WT</div>
                                <div className="text-[8.5px]">{netWtFormatted}</div>
                              </div>

                              {/* Stamps: Shipped on Board, Freight Prepaid, FCL/CY, Draft */}
                              <div className="my-2 space-y-2 text-center">
                                <div className="font-bold text-[9px] uppercase tracking-wider text-black">
                                  SHIPPED ON BOARD
                                </div>
                                <div className="font-bold text-[10px] uppercase tracking-wide text-black">
                                  {freightTerm}
                                </div>
                                <div className="text-right text-[7.5px] font-bold text-black pr-2">
                                  <div>FCL/FCL</div>
                                  <div>CY/CY</div>
                                </div>
                                <div className="font-black text-[13px] tracking-widest text-black uppercase">
                                  DRAFT
                                </div>
                              </div>
                            </div>

                            {/* Col 5: Volume CBM */}
                            <div className="col-span-1 p-1.5 text-center font-bold text-black text-[8px]">
                              {data.measurementCbm ? `${data.measurementCbm}` : ''}
                            </div>
                          </div>

                          {/* Particulars above furnished by consignor/consignee */}
                          <div className="border-t border-black py-0.5 text-center font-bold text-[7px] uppercase tracking-wider text-black">
                            PARTICULAR ABOVE FURNISHED BY CONSIGNOR/CONSIGNEE
                          </div>
                        </div>

                        {/* Row 5: Freight Terms & Issue Particulars */}
                        <div className="grid grid-cols-4 divide-x divide-black text-[7.5px]">
                          <div className="p-1.5">
                            <div className="font-bold uppercase text-[7px] text-black">PREPAID / COLLECT</div>
                            <div className="font-bold text-[8.5px] uppercase mt-0.5">{freightTerm}</div>
                          </div>
                          <div className="p-1.5">
                            <div className="font-bold uppercase text-[7px] text-black">FREIGHT PAYABLE AT</div>
                            <div className="font-bold text-[8.5px] uppercase mt-0.5">{freightPayableAt}</div>
                          </div>
                          <div className="p-1.5">
                            <div className="font-bold uppercase text-[7px] text-black">NO.OF ORIGINAL B/L(S)</div>
                            <div className="font-bold text-[8.5px] uppercase mt-0.5">{numberOfOriginals}</div>
                          </div>
                          <div className="p-1.5">
                            <div className="font-bold uppercase text-[7px] text-black">PLACE AND DATE OF ISSUE</div>
                            <div className="font-bold text-[8.5px] uppercase mt-0.5">{placeAndDateOfIssue}</div>
                          </div>
                        </div>

                        {/* Row 6: Jurisdiction Clause & Carrier Signature */}
                        <div className="grid grid-cols-12 divide-x divide-black">
                          {/* Jurisdiction and Law Clause */}
                          <div className="col-span-8 p-1.5 text-[6px] leading-[1.2] text-justify space-y-0.5 text-black">
                            <p>
                              <strong className="font-bold">Jurisdiction and Law Clause</strong>The contract by or contained in this Bill of Lading is governed by the LAW of UAE and any claim or dispute arising hereunder or in connection herewith shall be determined by the courts in UAE and no other courts.
                            </p>
                            <p>
                              <strong className="font-bold">Excess value Description : Refer to Clause 6(4) on reverse side.</strong>The Merchant is responsible for returning any container, with interior clean, free of any dangerous goods placards, labels or markings, at the designed place, and within 60 days following to the date of release, failing which the container shall be construed at lost. The Merchant shall settle any loss or expense whatsoever arising out of the foregoing, including but not limited to liquidated damages equivalent to the sound market value - or the depreciated value to Carrier.
                            </p>
                            <p>
                              The carrier is entitled to collect a deposit from the Merchant at the time of release of the container which shall be remitted as security for payment of any sums due to the carrier, in particulation for payment of all detention and Demurrage and/or container indemnity as referred above. Demurrage/Detention if any as per Line Tariff. Carrier will not be liable for any Misdeclaration of H.S. Code/NCM and all costs and consequences arising of the Misdeclaration will be on account of shippers.
                            </p>
                            <p>
                              The Contract evidenced by or contained in this Bill of Lading shall be governed by the law of UAE and any claim or dispute arising hereunder or in connection herewith shall (without prejudice to the Carrier's right to commence proceedings in any other jurisdiction) be subject to the jurisdiction of the Courts of UAE.
                            </p>
                          </div>

                          {/* Carrier Signature Box */}
                          <div className="col-span-4 p-1.5 flex flex-col justify-between text-[7.5px] min-h-[92px]">
                            <div>
                              <div className="font-bold uppercase text-black">
                                FOR: <span className="text-[8px]">{carrierName}</span>
                              </div>
                            </div>

                            <div className="my-1">
                              <div className="h-6"></div>
                              <div className="font-bold uppercase text-[7px] text-black">
                                AS AGENTS/CARRIER
                              </div>
                              <div className="font-bold uppercase text-[7.5px] text-black">
                                {asAgentsCarrier}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Disclaimer & Page Number */}
                      <div className="pt-1 flex items-center justify-between text-[7px] font-bold uppercase text-black">
                        <div>
                          THE GOODS AND INSTRUCTIONS ARE ACCEPTED AND DEALT WITH SUBJECT TO THE STANDARD CONDITION PRINTED OVERLEAF/
                        </div>
                        <div>
                          PAGE 1
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Document Sheet Divider when viewing All Pages */}
                  {previewMode === 'document' && activeTab === 'all' && (
                    <div className="page-break my-6 border-t-2 border-dashed border-zinc-300 text-center relative no-print">
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                        ▼ PAGE BREAK — ANNEXURE (PAGE 2) BELOW ▼
                      </span>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      PAGE 2: CONTAINER ANNEXURE
                      ───────────────────────────────────────────────────────────── */}
                  {showPage2 && (
                    <div
                      id="hbl-page-2"
                      className="relative z-10 bg-white text-black font-sans text-[8.5px] leading-tight select-text w-full p-4 sm:p-6 min-h-[900px] flex flex-col justify-between"
                    >
                      <div>
                        {/* Centered Heading */}
                        <div className="text-center my-3 pb-1">
                          <h2 className="text-[12px] font-bold text-black uppercase tracking-normal">
                            Annexure for BL {blNumber}
                          </h2>
                        </div>

                        {/* Annexure Table */}
                        <div className="w-full border-t border-b border-black">
                          <table className="w-full text-left border-collapse text-[8px]">
                            <thead>
                              <tr className="border-b border-black text-black font-bold">
                                <th className="py-1 px-1">Container No</th>
                                <th className="py-1 px-1">Container Type</th>
                                <th className="py-1 px-1">Agent Seal No</th>
                                <th className="py-1 px-1">Pkg Cnt</th>
                                <th className="py-1 px-1">Pkg Description</th>
                                <th className="py-1 px-1 text-right">Gross Wt</th>
                                <th className="py-1 px-1 text-right">Net Wt</th>
                                <th className="py-1 px-1 text-right">CBM</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                              {containersList.map((cntr: any, idx: number) => (
                                <tr key={idx} className="leading-snug">
                                  <td className="py-1 px-1 font-mono font-medium">{cntr.containerNumber}</td>
                                  <td className="py-1 px-1 font-mono">{cntr.containerType || '20GP'}</td>
                                  <td className="py-1 px-1 font-mono">{cntr.sealNumber}</td>
                                  <td className="py-1 px-1">{cntr.packageCount}</td>
                                  <td className="py-1 px-1 uppercase">{cntr.packageDescription || 'BOXES'}</td>
                                  <td className="py-1 px-1 text-right font-mono">
                                    {typeof cntr.grossWeightKg === 'number'
                                      ? cntr.grossWeightKg.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                                      : (cntr.grossWeightKg || '27,800.000')}
                                  </td>
                                  <td className="py-1 px-1 text-right font-mono">
                                    {typeof cntr.netWeightKg === 'number'
                                      ? cntr.netWeightKg.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                                      : (cntr.netWeightKg || '27,400.000')}
                                  </td>
                                  <td className="py-1 px-1 text-right font-mono">
                                    {cntr.volumeCbm !== undefined ? cntr.volumeCbm : '0'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Page 2 Bottom Footer */}
                      <div className="pt-4 flex justify-end text-[8px] font-bold uppercase text-black">
                        PAGE 2
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════════════════════════
               1D. DELIVERY ORDER (DO) — EXACT OFFICIAL TEMPLATE FORMAT
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'DO' && (() => {
              // Format deliverToParty text
              const rawDeliverTo = data.deliverToParty || '';
              const consigneeName = data.consigneeName || 'ANANTA METAL RECYCLING PRIVATE LIMITED';
              let deliverToText = rawDeliverTo;
              if (!deliverToText) {
                deliverToText = `UNIQUE SPEDITORER PVT LTD or bearer ${consigneeName}`;
              } else if (!deliverToText.toLowerCase().includes('or bearer') && deliverToText !== consigneeName) {
                deliverToText = `${deliverToText} or bearer ${consigneeName}`;
              }

              // CFS lines
              const cfsParts = (data.cfsName || 'MUNDHRA CFS, MUNDRA').split(',').map((s: string) => s.trim()).filter(Boolean);
              const cfsLine1 = cfsParts[0] || 'MUNDHRA CFS';
              const cfsLine2 = cfsParts.slice(1).join(', ') || data.dischargePort || 'MUNDRA';

              // Containers list
              const containersList = (data.containers && data.containers.length > 0) ? data.containers : [
                {
                  containerNumber: 'FCIU2316385',
                  sealNumber: '1132934',
                  sizeType: '20GP',
                  doValidTill: data.validTillDate || '25-10-2026'
                }
              ];

              return (
                <div id="delivery-order-doc" className="relative z-10 font-sans bg-white text-black border border-black text-[9.5px] leading-normal select-text">
                  {/* Header: Logo + Maps Nvocc - pro + Address */}
                  <div className="border-b border-black py-2.5 px-4 flex items-center justify-between bg-white">
                    {/* Orange Waves / Wings Logo */}
                    <div className="w-16 shrink-0">
                      <svg className="w-14 h-11" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 52 C28 52, 48 42, 68 25 C52 33, 36 37, 20 39 Z" fill="#E8611E" />
                        <path d="M15 43 C38 43, 64 30, 90 10 C72 20, 52 27, 30 31 Z" fill="#F07C1C" />
                        <path d="M22 34 C48 32, 80 18, 110 4 C88 14, 66 19, 44 23 Z" fill="#F7941D" />
                        <path d="M30 25 C58 20, 88 10, 118 0 C96 8, 74 13, 54 15 Z" fill="#FBBA15" />
                      </svg>
                    </div>

                    {/* Centered Company Details */}
                    <div className="flex-1 text-center pr-16">
                      <h1 className="text-[16px] font-bold text-black tracking-normal leading-snug">
                        Maps Nvocc - pro
                      </h1>
                      <div className="text-[9px] text-black mt-0.5 leading-relaxed">
                        <div>Office No. 101, First Floor Iconic Business Centre, Plot No. 101</div>
                        <div>Sector-8, Gandhidham – Kutch, Gujarat – 370201</div>
                        <div>
                          GST NO:24AABCL9894R1ZH &nbsp;&nbsp;&nbsp;&nbsp; PAN: AABCL9894R
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title Bar */}
                  <div className="border-b border-black py-1.5 text-center bg-white">
                    <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-black leading-normal">
                      DELIVERY ORDER
                    </h2>
                  </div>

                  {/* TO Section */}
                  <div className="border-b border-black px-4 py-2.5 text-[9.5px] leading-relaxed text-black bg-white">
                    <div>TO,</div>
                    <div>THE MANAGER,</div>
                    <div className="uppercase">{cfsLine1},</div>
                    <div className="uppercase">{cfsLine2}</div>
                  </div>

                  {/* 2-Column Info Grid */}
                  <div className="border-b border-black px-4 py-2.5 text-[9.5px] leading-relaxed bg-white">
                    <div className="grid grid-cols-2 gap-x-8">
                      {/* Left Column */}
                      <div className="space-y-1">
                        <div className="flex items-baseline">
                          <span className="w-[145px] shrink-0 text-black">DO Number:</span>
                          <span className="font-bold text-black uppercase">{data.doNumber}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[145px] shrink-0 text-black">Vessel/Voyage:</span>
                          <span className="font-bold text-black uppercase">{data.vesselVoyage}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[145px] shrink-0 text-black">Load Port:</span>
                          <span className="font-bold text-black uppercase">{data.loadPort}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[145px] shrink-0 text-black">Final Place of Delivery:</span>
                          <span className="font-bold text-black uppercase">{data.finalPlaceOfDelivery || data.dischargePort}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[145px] shrink-0 text-black">BL Number:</span>
                          <span className="font-bold text-black uppercase">{data.blNumber}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[145px] shrink-0 text-black">Cargo Description:</span>
                          <span className="font-bold text-black uppercase">{data.cargoDescription}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[145px] shrink-0 text-black">HS CODE :</span>
                          <span className="font-bold text-black uppercase">{data.hsCode || '76020010'}</span>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-1">
                        <div className="flex items-baseline">
                          <span className="w-[120px] shrink-0 text-black">DO Date:</span>
                          <span className="font-bold text-black uppercase">{data.doDate}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[120px] shrink-0 text-black">Arrival Date:</span>
                          <span className="font-bold text-black uppercase">{data.arrivalDate}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[120px] shrink-0 text-black">Discharge Port:</span>
                          <span className="font-bold text-black uppercase">{data.dischargePort}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[120px] shrink-0 text-black">Destuffing Type:</span>
                          <span className="font-bold text-black uppercase">{data.destuffingType || 'FACTORY DE-STUFF'}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[120px] shrink-0 text-black">BL Date:</span>
                          <span className="font-bold text-black uppercase">{data.blDate}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[120px] shrink-0 text-black">No. of Packages:</span>
                          <span className="font-bold text-black uppercase">{data.packageCount || '1 LOT'}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-[120px] shrink-0 text-black">Total Gross WT:</span>
                          <span className="font-bold text-black uppercase">{data.totalGrossWt || '25.730 MT'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Consignee & Notify Party Box */}
                  <div className="border-b border-black grid grid-cols-2 text-[9.5px] leading-relaxed bg-white">
                    {/* Consignee Column */}
                    <div className="px-4 py-2.5 border-r border-black min-h-[75px]">
                      <div className="font-bold uppercase mb-0.5">CONSIGNEE:</div>
                      <div className="font-bold uppercase text-[10px] leading-snug">{consigneeName}</div>
                      <div className="text-black uppercase mt-0.5 leading-snug whitespace-pre-line text-[9px]">
                        {data.consigneeAddress || 'SURVEY NO. 112, 114 AND 115, PLOT NO. 5,\nPORT BIZ INDUSTRIAL PARK, MUNDRA GANDHIDHAM\nROAD, VILL. HATDI MUNDRA INDIA 370410'}
                      </div>
                    </div>

                    {/* Notify Party Column */}
                    <div className="px-4 py-2.5 min-h-[75px]">
                      <div className="font-bold uppercase mb-0.5">NOTIFY PARTY:</div>
                      <div className="font-bold uppercase text-[10px]">{data.notifyParty || 'SAME AS CONSIGNEE'}</div>
                    </div>
                  </div>

                  {/* Letter Directive + Containers Table */}
                  <div className="border-b border-black px-4 py-2.5 text-[9.5px] leading-relaxed bg-white">
                    <p className="mb-0.5">Dear Sir/Madam,</p>
                    <p className="leading-snug">
                      Please deliver to <span className="font-bold">{deliverToText}</span> the following containers.
                    </p>
                    <p className="mt-0.5 mb-2.5">
                      It is required to take proper receipt for the same.
                    </p>

                    {/* Centered Containers Table with Non-Collapsing Separated Borders */}
                    <div className="my-2.5 flex justify-center">
                      <table className="w-full max-w-[530px] border-separate border-spacing-0 border-t border-l border-black text-center text-[9px]">
                        <thead>
                          <tr className="bg-white">
                            <th className="border-r border-b border-black py-1.5 px-3 uppercase font-bold text-black text-center tracking-normal leading-normal">
                              CONTAINER NUMBER
                            </th>
                            <th className="border-r border-b border-black py-1.5 px-3 uppercase font-bold text-black text-center tracking-normal leading-normal">
                              SEAL NUMBER
                            </th>
                            <th className="border-r border-b border-black py-1.5 px-3 uppercase font-bold text-black text-center tracking-normal leading-normal">
                              SIZE/TYPE
                            </th>
                            <th className="border-r border-b border-black py-1.5 px-3 uppercase font-bold text-black text-center tracking-normal leading-normal">
                              DO VALID TILL
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {containersList.map((c: any, idx: number) => (
                            <tr key={idx} className="bg-white">
                              <td className="border-r border-b border-black py-1.5 px-3 text-black uppercase text-center font-normal leading-normal">
                                {c.containerNumber}
                              </td>
                              <td className="border-r border-b border-black py-1.5 px-3 text-black uppercase text-center font-normal leading-normal">
                                {c.sealNumber}
                              </td>
                              <td className="border-r border-b border-black py-1.5 px-3 text-black uppercase text-center font-normal leading-normal">
                                {c.sizeType || '20GP'}
                              </td>
                              <td className="border-r border-b border-black py-1.5 px-3 text-black uppercase text-center font-normal leading-normal">
                                {c.doValidTill || data.validTillDate || '25-10-2026'}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-white">
                            <td
                              colSpan={4}
                              className="border-r border-b border-black py-1.5 px-3 font-bold text-center text-black uppercase leading-normal"
                            >
                              TOTAL CONTAINERS: {data.totalContainersSummary || `${String(containersList.length).padStart(2, '0')}X20'`}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Empty Containers Return Section */}
                  <div className="border-b border-black px-4 py-2.5 text-[9.5px] leading-relaxed bg-white">
                    <p className="text-black mb-0.5">
                      Empty Containers to be returned at below mentioned location within DO validity only.
                    </p>
                    <p className="font-bold text-black uppercase text-[10px]">
                      {data.emptyReturnDepot || 'KDPP TERMINALS'}
                    </p>
                    <p className="text-black uppercase mt-0.5 leading-snug whitespace-pre-line text-[9px]">
                      {data.emptyReturnAddress || 'Samagoga Survey no.120/1,- Near Borana yash\nwater plant ,Pragpar-,Vill - Nana Kapaya Kutch - 370421'}
                    </p>
                    <p className="font-bold text-black mt-1 text-[9.5px]">
                      CONT: {data.emptyReturnContact || '8488006739'}/ MAIL ID : {data.emptyReturnEmail || 'docs.mundra@kdppcontainer.com'}
                    </p>
                  </div>

                  {/* Footer / Sign-off */}
                  <div className="px-4 py-3 text-[9.5px] leading-relaxed min-h-[110px] flex flex-col justify-between bg-white">
                    <div>
                      <p className="font-bold text-black">For Maps Nvocc - pro,</p>
                      <div className="h-10"></div>
                      <p className="font-bold text-black">As Agents.</p>
                    </div>
                    <p className="font-bold text-black mt-2">
                      Please note this is a computer-generated document, hence no signature and stamp required.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════════════════════════
               2. MASTER BILL OF LADING (MBL)
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'MBL' && (
              <div className="relative z-10">
                {/* Carrier Top Header */}
                <div className="border-2 border-zinc-900 pb-3 mb-0 bg-zinc-900 text-white p-4 rounded-t-sm flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#E88B2A] uppercase block">
                      GLOBAL OCEAN CARRIER MASTER BILL OF LADING
                    </span>
                    <h1 className="text-xl font-black tracking-wider uppercase font-serif">
                      {data.carrierName}
                    </h1>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      SCAC Code: <strong className="text-white">{data.carrierScac || 'MSCU'}</strong> • FMC Carrier Lic. #019284
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 uppercase block">Carrier MBL Number:</span>
                    <span className="font-mono text-xl font-black text-[#E88B2A] tracking-wider block">
                      {data.mblNumber}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-300">
                      Booking Ref: {data.carrierBookingRef}
                    </span>
                  </div>
                </div>

                {/* MBL Particulars Box */}
                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-2 text-xs">
                  <div className="p-3 border-r-2 border-zinc-900 min-h-[95px]">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      Shipper (Freight Forwarder / Consolidator):
                    </span>
                    <p className="font-bold text-zinc-950 text-[11px] uppercase">
                      {firmDetails.legalName}
                    </p>
                    <p className="text-zinc-600 text-[10px] whitespace-pre-line mt-0.5">
                      {firmDetails.registeredAddress}<br />
                      FMC Org: 028491 • GSTIN: {firmDetails.gstin}
                    </p>
                  </div>

                  <div className="p-3 min-h-[95px]">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      Consignee / Destination Agent:
                    </span>
                    <p className="font-bold text-zinc-950 text-[11px] uppercase">
                      {data.consigneeName || 'HAMBURG SHIPPING SERVICES GMBH (DESTINATION AGENT)'}
                    </p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">
                      Altenwerder Hauptstrasse 12, D-21129 Hamburg, Germany<br />
                      Phone: +49 40 3344 550 • Customs Agent ID: DE-HAM-8821
                    </p>
                  </div>
                </div>

                {/* Routing & Vessel Row */}
                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-4 text-xs">
                  <div className="p-2.5 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block">Ocean Vessel / Voy:</span>
                    <span className="font-bold text-zinc-950 text-[11px] font-mono">{data.vesselVoyage}</span>
                  </div>
                  <div className="p-2.5 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block">Port of Loading:</span>
                    <span className="font-bold text-zinc-950 text-[11px]">{data.pol}</span>
                  </div>
                  <div className="p-2.5 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block">Port of Discharge:</span>
                    <span className="font-bold text-zinc-950 text-[11px] text-sky-700">{data.pod}</span>
                  </div>
                  <div className="p-2.5">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block">Transit ETD / ETA:</span>
                    <span className="font-bold text-zinc-950 text-[10px] font-mono">{data.etd} &rarr; {data.eta}</span>
                  </div>
                </div>

                {/* Container Manifest Table */}
                <div className="border-x-2 border-b-2 border-zinc-900 p-3 bg-zinc-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[8.5px] font-bold text-zinc-600 uppercase tracking-wider">
                      Master Container Manifest & VGM Certification:
                    </span>
                    <span className="font-mono text-[10px] font-bold text-emerald-700">
                      Totals: {data.totalContainers || data.containerNumbers.length} Box ({data.totalTeu} TEU) • {data.totalWeightKg?.toLocaleString()} KG Gross
                    </span>
                  </div>

                  <div className="border border-zinc-300 rounded overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-zinc-200 text-zinc-700 font-bold border-b border-zinc-300">
                        <tr>
                          <th className="p-1.5">Container Number</th>
                          <th className="p-1.5">Seal Number</th>
                          <th className="p-1.5">Size/Type</th>
                          <th className="p-1.5">Status</th>
                          <th className="p-1.5 text-right">VGM Weight (KG)</th>
                          <th className="p-1.5">Manifested Linked HBLs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 font-mono">
                        {data.containerNumbers.map((c: string, idx: number) => (
                          <tr key={idx}>
                            <td className="p-1.5 font-bold text-zinc-950">{c}</td>
                            <td className="p-1.5 font-bold text-zinc-700">KL{789410 + idx}</td>
                            <td className="p-1.5">40' HIGH CUBE DRY</td>
                            <td className="p-1.5 font-sans">
                              <span className="px-1.5 py-0.2 rounded text-[8.5px] bg-emerald-100 text-emerald-800 font-semibold">
                                FCL / FCL
                              </span>
                            </td>
                            <td className="p-1.5 text-right font-bold text-zinc-900">
                              {(data.totalWeightKg / data.containerNumbers.length).toLocaleString('en-IN')} KG
                            </td>
                            <td className="p-1.5 font-sans">
                              {(data.linkedHbls || []).map((h: string, hIdx: number) => (
                                <span key={`${h}-${idx}-${hIdx}`} className="inline-block px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-300 text-zinc-800 font-mono text-[9px] mr-1">
                                  {h}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ocean Freight Details */}
                <div className="border-x-2 border-b-2 border-zinc-900 p-3 grid grid-cols-3 text-xs bg-white">
                  <div>
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block">Total Ocean Freight:</span>
                    <span className="font-mono text-base font-black text-emerald-700">{formatUSD(data.freightAmountUSD)}</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block">Payment Status:</span>
                    <span className="font-sans font-bold text-zinc-950 uppercase">{data.paymentStatus} at Origin (Mundra)</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block">Carrier BL Status:</span>
                    <span className="font-sans font-bold text-purple-700 uppercase">{data.status}</span>
                  </div>
                </div>

                {/* Carrier Signatures & Endorsement */}
                <div className="border-x-2 border-b-2 border-zinc-900 p-3.5 grid grid-cols-2 rounded-b-sm bg-zinc-50">
                  <div className="text-[9px] text-zinc-600 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-zinc-900 uppercase block">Carrier Release & Telex Endorsement:</span>
                      <p className="mt-1">
                        CARGO TO BE DELIVERED AGAINST PROPER SURRENDER OF CARRIER BILL OF LADING OR AUTHORIZED ELECTRONIC TELEX RELEASE NOTICE TO DISCHARGE PORT AGENT.
                      </p>
                    </div>
                    <div className="mt-3 font-mono text-[8.5px] text-zinc-500">
                      EDI TRANSMISSION ID: #EDI315-{data.mblNumber}-MUNDRA • APSEZ CT-2
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end text-right">
                    <p className="text-[10px] font-bold text-zinc-950">
                      For {data.carrierName} As Carrier<br />
                      <span className="text-[8.5px] text-zinc-500">Signed at Port of Loading (INMUN)</span>
                    </p>

                    <div className="my-2 flex items-center gap-3">
                      <div className="w-16 h-16 border-2 border-dashed border-sky-600 rounded-full flex flex-col items-center justify-center text-[7.5px] font-bold text-sky-800 rotate-[-8deg] p-1 bg-sky-50">
                        {data.carrierScac || 'MSCU'}
                        <span className="text-[6px] font-mono">CARRIER SEAL</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 mt-0.5" />
                      </div>
                      <div className="border-b-2 border-zinc-900 w-36 text-center pb-0.5">
                        <span className="font-serif italic text-sm text-zinc-900 font-bold">Liner Operations</span>
                      </div>
                    </div>
                    <p className="text-[8.5px] text-zinc-500 uppercase font-semibold">Authorized Carrier Agent Signature</p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
               3. TAX INVOICE TEMPLATE
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'INVOICE' && (
              <div>
                <div className="border-b-2 border-zinc-900 pb-4 mb-4 flex justify-between items-start">
                  <div>
                    <h1 className="font-bold text-lg text-zinc-900 tracking-wider uppercase">{firmDetails.legalName}</h1>
                    <p className="text-zinc-600 text-[10px] max-w-md mt-0.5 leading-tight">
                      {firmDetails.registeredAddress}<br />
                      Phone: {firmDetails.phone} | Email: {firmDetails.financeEmail}<br />
                      State: Gujarat (State Code: 24)
                    </p>
                    <div className="flex gap-4 mt-2 font-mono text-[10px] font-bold text-zinc-800">
                      <span>GSTIN: {firmDetails.gstin}</span>
                      <span>PAN: {firmDetails.pan}</span>
                      <span>IEC: {firmDetails.iec}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <h2 className="text-2xl font-black font-serif text-zinc-950 uppercase tracking-tight">TAX INVOICE</h2>
                    <span className="inline-block px-2.5 py-0.5 bg-zinc-900 text-white font-bold text-[10px] rounded uppercase mt-1">
                      ORIGINAL FOR RECIPIENT
                    </span>
                    <div className="mt-3 text-left bg-zinc-100 p-2.5 rounded border border-zinc-300 font-mono text-[11px] space-y-1">
                      <div><span className="text-zinc-500 font-sans text-[10px]">Invoice No:</span> <strong>{data.invoiceNumber}</strong></div>
                      <div><span className="text-zinc-500 font-sans text-[10px]">Invoice Date:</span> {data.invoiceDate}</div>
                      <div><span className="text-zinc-500 font-sans text-[10px]">Due Date:</span> {data.dueDate}</div>
                      <div><span className="text-zinc-500 font-sans text-[10px]">Place of Supply:</span> {data.placeOfSupply}</div>
                      <div><span className="text-zinc-500 font-sans text-[10px]">Tax Payable on RCM:</span> <strong className="text-zinc-900">NO</strong></div>
                      <div><span className="text-zinc-500 font-sans text-[10px]">LUT ARN (Zero-Rated Export):</span> <strong className="text-zinc-800">AD240326001928K</strong></div>
                    </div>
                    {/* Official GST e-Invoice IRN Authentication */}
                    <div className="mt-2 text-left bg-emerald-50 border border-emerald-300 p-2 rounded flex items-center justify-between">
                      <div className="space-y-0.5 font-mono text-[8.5px] text-emerald-950">
                        <span className="font-extrabold uppercase tracking-wider block text-emerald-800 text-[8px]">NIC / GST e-Invoice Authenticated:</span>
                        <div className="truncate max-w-[210px] text-zinc-700">IRN: 8e91f092b3490bca2341908efc091...</div>
                        <div className="text-emerald-800 font-semibold">Ack No: 112610992341 • Ack Date: {data.invoiceDate}</div>
                      </div>
                      <div className="w-8 h-8 p-0.5 bg-white border border-emerald-400 rounded shrink-0">
                        <QrCode className="w-full h-full text-zinc-900" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill To & Ship To */}
                <div className="grid grid-cols-2 gap-4 border border-zinc-300 rounded p-3 mb-4 bg-zinc-50">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Details of Receiver / Billed To:</span>
                    <h3 className="font-bold text-zinc-900 text-sm">{data.billToPartyName}</h3>
                    <p className="text-zinc-600 text-[11px] whitespace-pre-line mt-0.5">{data.billToAddress}</p>
                    <p className="font-mono font-bold text-[11px] text-zinc-900 mt-2">GSTIN: {data.billToGstin}</p>
                    <p className="text-zinc-600 text-[10px]">State: {data.billToState} ({data.billToStateCode})</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Shipment & Reference:</span>
                    <div className="space-y-1 text-[11px]">
                      <div><span className="text-zinc-500">Shipment Job No:</span> <strong className="font-mono">{data.shipmentId || 'N/A'}</strong></div>
                      <div><span className="text-zinc-500">House B/L No:</span> <strong className="font-mono">{data.hblId || 'N/A'}</strong></div>
                      <div><span className="text-zinc-500">Customer Ref / PO:</span> <span className="font-mono">{data.referenceNo || 'PO-DIRECT'}</span></div>
                      <div><span className="text-zinc-500">Payment Terms:</span> <span>{data.paymentTerms || '15 Days Credit'}</span></div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border border-zinc-300 text-[11px] mb-4">
                  <thead className="bg-zinc-200 font-bold text-zinc-700 border-b border-zinc-300">
                    <tr>
                      <th className="p-2 text-left">SN</th>
                      <th className="p-2 text-left">SAC / HSN</th>
                      <th className="p-2 text-left">Description of Service</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate (INR)</th>
                      <th className="p-2 text-right">Taxable Val</th>
                      <th className="p-2 text-right">GST %</th>
                      <th className="p-2 text-right">GST (INR)</th>
                      <th className="p-2 text-right">Total (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono">
                    {(data.lineItems || []).map((item: any, idx: number) => (
                      <tr key={item.id || idx}>
                        <td className="p-2 font-sans">{idx + 1}</td>
                        <td className="p-2">{item.hsnSacCode}</td>
                        <td className="p-2 font-sans font-medium text-zinc-900">{item.description}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">{item.rate.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right font-bold">{item.amount.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right">{item.gstRate}%</td>
                        <td className="p-2 text-right">{item.gstAmount.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right font-bold text-zinc-900">{item.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tax & Total Summary */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="border border-zinc-300 rounded p-3 text-[10px] space-y-1 bg-zinc-50">
                    <span className="font-bold text-zinc-900 uppercase block mb-1">Amount Chargeable in Words:</span>
                    <p className="font-semibold text-zinc-900 italic text-xs">{numberToWordsINR(data.grandTotal)}</p>
                    <div className="pt-2 border-t border-zinc-200 mt-2">
                      <span className="font-bold text-zinc-700 uppercase block">Bank Details for Electronic Remittance (NEFT / RTGS / UPI):</span>
                      <p className="font-mono mt-0.5">
                        Bank: {firmDetails.bankAccounts[0].bankName} ({firmDetails.bankAccounts[0].branch})<br />
                        A/C No: <strong>{firmDetails.bankAccounts[0].accountNumber}</strong> • IFSC: <strong>{firmDetails.bankAccounts[0].ifsc}</strong><br />
                        UPI ID: <strong>{firmDetails.bankAccounts[0].upiId}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="border border-zinc-300 rounded p-3 text-[11px] font-mono space-y-1.5 bg-zinc-50">
                    <div className="flex justify-between">
                      <span className="font-sans text-zinc-600">Subtotal Taxable Amount:</span>
                      <span className="font-bold">{formatINR(data.subTotal)}</span>
                    </div>
                    {data.cgstTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans text-zinc-600">Central GST (CGST 9%):</span>
                        <span>{formatINR(data.cgstTotal)}</span>
                      </div>
                    )}
                    {data.sgstTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans text-zinc-600">State GST (SGST 9%):</span>
                        <span>{formatINR(data.sgstTotal)}</span>
                      </div>
                    )}
                    {data.igstTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans text-zinc-600">Integrated GST (IGST 18%):</span>
                        <span>{formatINR(data.igstTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-zinc-300 pt-1.5 font-sans text-sm font-bold text-zinc-950">
                      <span>Total Invoice Value:</span>
                      <span className="font-mono text-base text-zinc-900">{formatINR(data.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Export / SEZ LUT Endorsement */}
                <div className="mb-3 p-2 bg-amber-50 border border-amber-300 rounded text-[9.5px] font-mono text-amber-950 font-bold text-center">
                  SUPPLY MEANT FOR EXPORT OF SERVICES UNDER LETTER OF UNDERTAKING (LUT) WITHOUT PAYMENT OF INTEGRATED TAX (LUT ARN: AD240326001928K)
                </div>

                {/* Signatory */}
                <div className="border-t border-zinc-300 pt-3 flex justify-between items-end">
                  <div className="text-[10px] text-zinc-500">
                    E. & O.E. • This is a computer generated invoice requiring no physical signature.
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-600 mb-1">For {firmDetails.legalName}</p>
                    <p className="font-serif italic font-bold text-base text-zinc-900 border-b border-zinc-800 pb-0.5 inline-block min-w-[150px] text-center">
                      Aman Dana
                    </p>
                    <p className="text-[9px] text-zinc-500 uppercase font-semibold block mt-0.5">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
               4. QUOTATION TEMPLATE
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'QUOTE' && (
              <div>
                <div className="border-b-2 border-zinc-900 pb-4 mb-4 flex justify-between items-start">
                  <div>
                    <h1 className="font-bold text-lg text-zinc-900 uppercase">{firmDetails.legalName}</h1>
                    <p className="text-zinc-600 text-[10px]">{firmDetails.registeredAddress}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold font-serif text-zinc-950 uppercase">FREIGHT QUOTATION</h2>
                    <p className="font-mono font-bold text-xs mt-1">{data.quoteNumber}</p>
                    <p className="text-zinc-500 text-[10px]">Valid Until: {data.validUntil}</p>
                  </div>
                </div>

                <div className="bg-zinc-100 p-3 rounded mb-4 text-[11px] grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Customer:</span>
                    <p className="font-bold text-zinc-900">{data.customerName}</p>
                    <p className="text-zinc-600">{data.customerEmail} | {data.customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Routing & Equipment:</span>
                    <p className="font-bold text-zinc-900">{data.polName} &rarr; {data.podName}</p>
                    <p className="text-zinc-600">Equipment: {data.equipmentType} | Preferred Carrier: {data.carrierName}</p>
                  </div>
                </div>

                <div className="border border-zinc-300 rounded p-4 mb-4 bg-zinc-50 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="font-sans font-medium text-zinc-700">Base Ocean Freight:</span>
                    <span className="font-bold text-zinc-900">{formatUSD(data.baseFreightUSD)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans font-medium text-zinc-700">Surcharges (BAF/CAF/GRI):</span>
                    <span className="font-bold text-zinc-900">{formatUSD(data.surchargesUSD)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans font-medium text-zinc-700">Origin Local Charges (THC & DOC):</span>
                    <span className="font-bold text-zinc-900">{formatINR(data.localChargesINR)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-300 pt-2 font-sans text-sm font-bold text-zinc-950">
                    <span>Total Estimated Cost:</span>
                    <span className="font-mono text-base text-amber-700">{formatINR(data.totalPriceINR)}</span>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-600 space-y-1">
                  <p className="font-bold text-zinc-800">Terms of Offer:</p>
                  <p>&bull; Rate subject to carrier space & equipment availability at Mundra.</p>
                  <p>&bull; Standard free time at POD: 14 calendar days from discharge.</p>
                  <p>&bull; Payment Terms: {data.paymentTerms}</p>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
               5. CONSOLIDATED MANIFEST
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'MANIFEST' && (
              <div>
                <div className="border-b-2 border-zinc-900 pb-3 mb-3 text-center">
                  <h1 className="font-black text-base uppercase tracking-wider">{firmDetails.legalName}</h1>
                  <h2 className="text-lg font-serif font-black uppercase text-zinc-900">CONSOLIDATED CARGO MANIFEST</h2>
                  <p className="text-[10px] text-zinc-600 font-mono">Port of Loading: Mundra (INMUN) | Terminal: MICT</p>
                </div>
                <div className="border border-zinc-300 rounded p-3 mb-3 text-[11px] grid grid-cols-3 gap-2 bg-zinc-50 font-mono">
                  <div><strong>Container No:</strong> {data.containerNumber || 'MSKU2345678'}</div>
                  <div><strong>Vessel/Voy:</strong> {data.vessel || 'MSC JADE 437W'}</div>
                  <div><strong>Seal No:</strong> {data.seal || 'KL789412'}</div>
                  <div><strong>Capacity Utilized:</strong> {data.utilization || '92%'}</div>
                  <div><strong>Total Weight:</strong> {data.totalWeight || '26,450 KG'}</div>
                  <div><strong>Total CBM:</strong> {data.totalCbm || '68.2 CBM'}</div>
                </div>
                <p className="text-[10px] text-zinc-500 font-semibold uppercase mb-1">Manifested Consignments / Linked HBLs:</p>
                <div className="border border-zinc-300 rounded overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-zinc-200 font-bold border-b border-zinc-300">
                      <tr>
                        <th className="p-1.5">HBL Number</th>
                        <th className="p-1.5">Shipper</th>
                        <th className="p-1.5">Consignee</th>
                        <th className="p-1.5">Packages</th>
                        <th className="p-1.5 text-right">Weight (KG)</th>
                        <th className="p-1.5 text-right">CBM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {(data.hbls || []).map((h: any, i: number) => (
                        <tr key={i}>
                          <td className="p-1.5 font-mono font-bold">{h.hblNumber || h}</td>
                          <td className="p-1.5">Krishna Ceramics</td>
                          <td className="p-1.5">Mueller GmbH</td>
                          <td className="p-1.5">450 Bags</td>
                          <td className="p-1.5 text-right font-mono">11,200</td>
                          <td className="p-1.5 text-right font-mono">28.5</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
               6. AGENT STATEMENT
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'STATEMENT' && (
              <div>
                <div className="border-b-2 border-zinc-900 pb-3 mb-3 flex justify-between items-start">
                  <div>
                    <h1 className="font-bold text-base uppercase text-zinc-900">{firmDetails.legalName}</h1>
                    <p className="text-zinc-600 text-[10px]">Overseas Agency Accounting Desk</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-serif font-black uppercase text-zinc-950">STATEMENT OF ACCOUNT</h2>
                    <p className="text-[10px] font-mono text-zinc-600">Period: October 2026</p>
                  </div>
                </div>
                <div className="bg-zinc-100 p-3 rounded mb-3 text-[11px]">
                  <strong>Agent:</strong> {data.agentName || 'Hamburg Shipping Services GmbH'}<br />
                  <span className="text-zinc-600">Ledger Currency: {data.currency || 'EUR'} | Net Balance: {data.balance || 'EUR 4,280 (Credit)'}</span>
                </div>
                <table className="w-full border border-zinc-300 text-[10px] text-left">
                  <thead className="bg-zinc-200 font-bold border-b border-zinc-300">
                    <tr>
                      <th className="p-1.5">Date</th>
                      <th className="p-1.5">Description</th>
                      <th className="p-1.5">HBL / Ref</th>
                      <th className="p-1.5 text-right">Debit ({data.currency})</th>
                      <th className="p-1.5 text-right">Credit ({data.currency})</th>
                      <th className="p-1.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono">
                    <tr>
                      <td className="p-1.5 font-sans">12 Oct 2026</td>
                      <td className="p-1.5 font-sans">Destination THC & DO Fee</td>
                      <td className="p-1.5">HBL-240342-01</td>
                      <td className="p-1.5 text-right font-bold text-rose-700">140.00</td>
                      <td className="p-1.5 text-right">-</td>
                      <td className="p-1.5 text-center font-sans text-emerald-700 font-bold">Matched</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-sans">08 Oct 2026</td>
                      <td className="p-1.5 font-sans">Profit Share Split Mundra-Hamburg</td>
                      <td className="p-1.5">HBL-240310-01</td>
                      <td className="p-1.5 text-right">-</td>
                      <td className="p-1.5 text-right font-bold text-emerald-700">350.00</td>
                      <td className="p-1.5 text-center font-sans text-emerald-700 font-bold">Matched</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
               7. IMO DANGEROUS GOODS DECLARATION (DGD)
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'DGD' && (
              <div className="font-sans text-xs bg-white text-zinc-950">
                <div className="border-2 border-zinc-900 grid grid-cols-12 bg-white">
                  <div className="col-span-8 p-3 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">1. Shipper / Consignor (Full Name, Address, Contact):</span>
                    <p className="font-bold text-zinc-950 text-xs">{data.shipperName || 'KRISHNA CHEMICALS & MINERALS EXPORTS'}</p>
                    <p className="text-[10px] text-zinc-700 whitespace-pre-line leading-tight">Plot 120, GIDC Chemical Zone, Panoli, Gujarat - 394116, India</p>
                    <p className="text-[9px] font-mono text-zinc-600 mt-1">GSTIN: 24AABCK9901C1Z4 • Emergency 24h: {data.emergencyContact || '+91 98250 99911'}</p>
                  </div>
                  <div className="col-span-4 p-3 flex flex-col justify-between bg-rose-50/60">
                    <div>
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-700 text-white tracking-widest inline-block mb-1">
                        SOLAS / IMDG CODE
                      </span>
                      <h2 className="text-base font-black text-rose-950 font-serif leading-tight">
                        MULTIMODAL DANGEROUS GOODS DECLARATION
                      </h2>
                      <p className="text-[8.5px] text-zinc-600 font-mono mt-1">Ref No: <strong>{data.id || 'DGD-MUN-2026-088'}</strong></p>
                    </div>
                    <div className="text-[9px] text-zinc-600 pt-1 border-t border-rose-200">
                      <span>IMDG Amendment: <strong>41-22</strong></span>
                    </div>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-[10px]">
                  <div className="col-span-8 p-3 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">2. Consignee / Importer:</span>
                    <p className="font-bold text-zinc-950 text-xs">{data.consigneeName || 'MUELLER CHEMIE GMBH & CO. KG'}</p>
                    <p className="text-[10px] text-zinc-700">Industriestrasse 44, D-21107 Hamburg, Germany</p>
                  </div>
                  <div className="col-span-4 p-3 bg-zinc-50">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">3. Carrier / MTO:</span>
                    <p className="font-bold text-zinc-950 text-xs uppercase">{firmDetails.legalName}</p>
                    <p className="text-[9px] text-zinc-600 leading-tight">{firmDetails.registeredAddress}</p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-4 text-[10px] bg-zinc-50">
                  <div className="p-2 border-r-2 border-zinc-900">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase block">Port of Loading:</span>
                    <p className="font-bold text-zinc-950 text-xs">MUNDRA PORT, INDIA (INMUN)</p>
                  </div>
                  <div className="p-2 border-r-2 border-zinc-900">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase block">Port of Discharge:</span>
                    <p className="font-bold text-zinc-950 text-xs">{data.pod || 'HAMBURG, GERMANY (DEHAM)'}</p>
                  </div>
                  <div className="p-2 border-r-2 border-zinc-900">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase block">Ocean Vessel & Voyage:</span>
                    <p className="font-bold text-zinc-950 text-xs font-mono">{data.vesselName || 'MSC JADE'} / {data.voyageNumber || '437W'}</p>
                  </div>
                  <div className="p-2">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase block">Linked HBL No:</span>
                    <p className="font-mono font-bold text-amber-700 text-xs">{data.hblNumber || 'MAPS-HBL-240398-01'}</p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 p-2.5 bg-rose-50/40">
                  <span className="text-[8.5px] font-extrabold text-rose-950 uppercase tracking-wider block mb-1">
                    DANGEROUS GOODS DESCRIPTION & CLASSIFICATION (IMDG CODE CHAPTER 5.4):
                  </span>
                  <div className="border border-rose-300 rounded overflow-hidden bg-white">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-rose-100/70 text-rose-950 font-bold border-b border-rose-300">
                        <tr>
                          <th className="p-2">UN Number</th>
                          <th className="p-2">Proper Shipping Name</th>
                          <th className="p-2">Class / Div</th>
                          <th className="p-2">Packing Group</th>
                          <th className="p-2">Flash Point</th>
                          <th className="p-2">Marine Pollutant</th>
                          <th className="p-2">EmS Code</th>
                          <th className="p-2 text-right">Net Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-200 font-mono">
                        <tr>
                          <td className="p-2 font-bold text-rose-800">{data.unNumber || 'UN1230'}</td>
                          <td className="p-2 font-sans font-bold text-zinc-950">{data.properShippingName || 'METHANOL'}</td>
                          <td className="p-2 font-bold">{data.imdgClass || '3 (6.1)'}</td>
                          <td className="p-2 font-bold text-amber-800">PG {data.packingGroup || 'II'}</td>
                          <td className="p-2">{data.flashPoint || '11°C c.c.'}</td>
                          <td className="p-2">{data.marinePollutant ? 'YES (P)' : 'NO'}</td>
                          <td className="p-2 text-sky-800 font-bold">{data.emsNumber || 'F-E, S-D'}</td>
                          <td className="p-2 text-right font-bold text-zinc-950">{Number(data.netQuantityKg || 18000).toLocaleString()} KG</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 p-3 text-[10px]">
                  <div className="col-span-6 pr-3 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block mb-1">Package Particulars & Container:</span>
                    <p className="font-bold text-zinc-950 text-[11px]">{data.packageType || '80 STEEL DRUMS (1A1) ON 20 PALLETS'}</p>
                    <p className="font-mono text-zinc-700 mt-1">Container: <strong>MSKU7712904</strong> (20GP) • Seal: <strong>KL889104</strong></p>
                    <p className="text-[9px] text-zinc-600 mt-1">Gross Mass: {(Number(data.grossWeightKg || 19500)).toLocaleString()} KG</p>
                  </div>
                  <div className="col-span-6 pl-3">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block mb-1">24-Hour Emergency Contact Phone:</span>
                    <p className="font-mono font-bold text-rose-900 text-xs bg-rose-50 p-1.5 rounded border border-rose-200">
                      {data.emergencyContact || 'CHEMTREC / DR. K. MEHTA: +91 98250 99911'}
                    </p>
                    <p className="text-[8.5px] text-zinc-500 mt-1">Special Handling: Keep away from sources of ignition. Segregation Group: Acids / Flammables as per IMDG.</p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-2 text-[9.5px]">
                  <div className="p-3 border-r-2 border-zinc-900 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-zinc-900 uppercase block mb-1">Shipper's Declaration:</span>
                      <p className="text-[8.5px] leading-tight text-zinc-600 italic">
                        I hereby declare that the contents of this consignment are fully and accurately described above by the Proper Shipping Name, and are classified, packaged, marked and labelled/placarded, and are in all respects in proper condition for transport according to the applicable international and national government regulations.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-300 mt-2 flex justify-between items-end">
                      <div>
                        <span className="text-zinc-500 block text-[8px]">Signatory:</span>
                        <strong className="text-zinc-900">Dr. K. Mehta (Authorized Shipper)</strong>
                      </div>
                      <span className="font-mono text-[9px] text-zinc-500">Date: {new Date().toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col justify-between bg-zinc-50">
                    <div>
                      <span className="font-bold text-zinc-900 uppercase block mb-1">Container Packing Certificate:</span>
                      <p className="text-[8.5px] leading-tight text-zinc-600 italic">
                        The undersigned hereby certifies that the cargo has been loaded into a clean, sound container; properly segregated in accordance with Chapter 7.2 of the IMDG Code; properly braced and secured; and correctly placarded with Class placards on all 4 sides.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-300 mt-2 flex justify-between items-end">
                      <div>
                        <span className="text-zinc-500 block text-[8px]">MTO / Carrier Surveyor:</span>
                        <strong className="text-zinc-950 font-serif italic text-xs">Utsav Panchal (Port Operations)</strong>
                      </div>
                      <span className="font-mono text-[9px] text-zinc-500">Mundra Port Terminal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
               8. CARGO ARRIVAL NOTICE & FREIGHT ADVICE
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'ARRIVAL_NOTICE' && (
              <div className="font-sans text-xs bg-white text-zinc-950">
                <div className="border-2 border-zinc-900 pb-3 p-4 flex justify-between items-start bg-zinc-50">
                  <div>
                    <h1 className="font-bold text-base uppercase text-zinc-950 tracking-wider">{firmDetails.legalName}</h1>
                    <p className="text-[10px] text-zinc-600 font-medium">Multimodal Transport Operator • Container Agency Desk</p>
                    <p className="text-[9.5px] text-zinc-600 mt-0.5">
                      {firmDetails.registeredAddress} • Phone: {firmDetails.phone} • Email: {firmDetails.email}
                    </p>
                    <p className="font-mono text-[9.5px] font-bold text-zinc-800 mt-1">
                      GSTIN: {firmDetails.gstin} • PAN: {firmDetails.pan} • MTO Reg: MTO/DGS/2026/0912
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 bg-sky-900 text-white font-bold text-[9px] rounded uppercase tracking-wider mb-1">
                      INBOUND VESSEL NOTICE
                    </span>
                    <h2 className="text-lg font-black font-serif text-zinc-950 uppercase">CARGO ARRIVAL NOTICE</h2>
                    <p className="text-[9.5px] text-zinc-600 font-mono">Date: {new Date().toLocaleDateString('en-GB')}</p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-2 p-3 text-[10px]">
                  <div className="pr-3 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block mb-1">TO: Consignee / Importer:</span>
                    <p className="font-bold text-zinc-950 text-xs">{data.consignee || data.consigneeName || 'KUTCH CHEMICAL INDUSTRIES LTD'}</p>
                    <p className="text-zinc-700 text-[10px] mt-0.5">Survey 112, GIDC Phase II, Mundra - 370421, Gujarat</p>
                    <p className="font-mono text-[9px] text-zinc-600 mt-1">GSTIN: {data.consigneeGstin || '24AAACK1122C1Z4'} • IEC: {data.consigneeIec || '0308001294'}</p>
                  </div>
                  <div className="pl-3 bg-zinc-50/50">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block mb-1">Vessel & Inward Manifest Details:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div><span className="text-zinc-500">Vessel/Voy:</span> <strong className="font-mono">{data.vesselVoyage || 'MSC JADE / 439W'}</strong></div>
                      <div><span className="text-zinc-500">ETA Mundra:</span> <strong className="text-emerald-700 font-mono">{data.eta || '28-10-2026'}</strong></div>
                      <div><span className="text-zinc-500">Line IGM No:</span> <strong className="font-mono">{data.lineIgmNumber || '249110'}</strong></div>
                      <div><span className="text-zinc-500">Item No:</span> <strong className="font-mono">{data.itemNumber || '018'}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 p-3">
                  <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Consignment & Container Schedule:</span>
                  <table className="w-full text-[10px] border border-zinc-300">
                    <thead className="bg-zinc-100 font-bold border-b border-zinc-300">
                      <tr>
                        <th className="p-2 text-left">House B/L No</th>
                        <th className="p-2 text-left">Container No</th>
                        <th className="p-2 text-left">Size/Type</th>
                        <th className="p-2 text-left">Seal No</th>
                        <th className="p-2 text-left">Package Count & Cargo Description</th>
                        <th className="p-2 text-right">Gross Wt (KG)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 font-mono">
                      <tr>
                        <td className="p-2 font-bold text-[#E88B2A]">{data.hblNumber || 'LCMUNHAM2600299'}</td>
                        <td className="p-2 font-bold text-zinc-950">{data.containerNumber || 'MSCU7710924'}</td>
                        <td className="p-2">{data.sizeType || '40HC'}</td>
                        <td className="p-2">{data.sealNumber || 'MSC88192'}</td>
                        <td className="p-2 font-sans font-medium">{data.packageCount || '80 DRUMS'} - {data.cargoDescription || 'INDUSTRIAL ADHESIVES'}</td>
                        <td className="p-2 text-right">{Number(data.grossWeightKg || 24500).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-2 p-3 text-[10px] bg-amber-50/50">
                  <div className="pr-3 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-amber-950 uppercase block mb-1">Estimated Inbound Delivery Order Charges:</span>
                    <div className="space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between"><span>Destination Terminal Handling (THC):</span> <span>₹14,500</span></div>
                      <div className="flex justify-between"><span>Delivery Order Issuance Fee:</span> <span>₹4,500</span></div>
                      <div className="flex justify-between"><span>CFS De-stuffing / Terminal Pass-thru:</span> <span>₹16,500</span></div>
                      <div className="flex justify-between"><span>Goods & Services Tax (GST 18%):</span> <span>₹6,390</span></div>
                      <div className="flex justify-between border-t border-amber-300 pt-1 font-bold text-amber-950 text-xs">
                        <span>Total Payable for DO Release:</span>
                        <span>₹{Number(data.chargesEstimateINR || 41890).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pl-3">
                    <span className="text-[8.5px] font-bold text-zinc-800 uppercase block mb-1">Requirements for Delivery Order Release:</span>
                    <ul className="list-disc pl-4 space-y-1 text-[9px] text-zinc-700">
                      <li>Surrender of duly endorsed Original Bill of Lading (3/3) or Bank Guarantee.</li>
                      <li>Payment of destination THC, DO charges, and applicable CFS pass-through fees.</li>
                      <li>Submission of empty container return security deposit / detention bond.</li>
                      <li>14 calendar days free time from vessel discharge; detention applicable thereafter per carrier tariff.</li>
                    </ul>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 p-3 flex justify-between items-end text-[9px] text-zinc-600 bg-white">
                  <div>
                    <span>Designated CFS: <strong>{data.cfsName || 'MUNDHRA CFS, MUNDRA PORT'}</strong></span><br />
                    <span>Free Time: <strong>14 Calendar Days from Discharge</strong></span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-900 uppercase">{firmDetails.legalName}</p>
                    <p className="font-serif italic text-xs text-zinc-800">Inbound Import Documentation Desk</p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
               9. SOLAS VERIFIED GROSS MASS (VGM) DECLARATION
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'VGM' && (
              <div className="font-sans text-xs bg-white text-zinc-950">
                <div className="border-2 border-zinc-900 p-4 pb-3 flex justify-between items-start bg-zinc-50">
                  <div>
                    <h1 className="font-bold text-base uppercase text-zinc-950 tracking-wider">{firmDetails.legalName}</h1>
                    <p className="text-[10px] text-zinc-600">Multimodal Transport Operator & Port Logistics Provider</p>
                    <p className="text-[9px] text-zinc-600">{firmDetails.registeredAddress} • GSTIN: {firmDetails.gstin}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-900 text-white font-bold text-[9px] rounded uppercase tracking-wider mb-1">
                      SOLAS CHAPTER VI REG 2
                    </span>
                    <h2 className="text-base font-black font-serif text-zinc-950 uppercase">VERIFIED GROSS MASS (VGM) CERTIFICATE</h2>
                    <p className="text-[9.5px] font-mono text-zinc-600">DG Shipping MSN 04/2016 Compliant</p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-2 p-3 text-[10px]">
                  <div className="pr-3 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block mb-0.5">Shipper / Exporter:</span>
                    <p className="font-bold text-zinc-950 text-xs">{data.shipperName || 'KRISHNA CERAMICS & TILES PVT LTD'}</p>
                    <p className="text-zinc-700 text-[10px]">Morbi, Gujarat, India • GSTIN: 24AABCK1234D1Z5</p>
                  </div>
                  <div className="pl-3">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block mb-0.5">Shipment & Booking Reference:</span>
                    <p className="font-mono text-zinc-900">Shipment ID: <strong>{data.id || 'MAPS-240342'}</strong></p>
                    <p className="font-mono text-zinc-900">HBL No: <strong>{data.hblNo || 'MAPS-HBL-240342-01'}</strong> • MBL No: <strong>{data.mblNo || 'MSKUMUN991024'}</strong></p>
                    <p className="text-zinc-600 text-[9px]">Vessel: {data.vesselName || 'MSC JADE'} / {data.voyageNumber || '437W'} • POL: MUNDRA (INMUN)</p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 p-3">
                  <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Verified Gross Mass Weight Breakdown:</span>
                  <div className="grid grid-cols-4 gap-3 bg-zinc-50 p-3 rounded border border-zinc-300 font-mono text-center">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-sans block">Container No:</span>
                      <strong className="text-zinc-950 text-xs">{data.containers?.[0]?.containerNumber || 'MSKU2345678'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-sans block">Tare Weight:</span>
                      <span className="text-zinc-800 text-xs font-bold">3,880 KG</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-sans block">Cargo + Packing Mass:</span>
                      <span className="text-zinc-800 text-xs font-bold">24,800 KG</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-300 rounded p-1">
                      <span className="text-[9px] text-emerald-800 font-sans font-bold block">TOTAL VGM (KG):</span>
                      <strong className="text-emerald-950 text-sm font-black">28,680 KG</strong>
                    </div>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 p-3 text-[10px] space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-bold text-zinc-900 block">Weighing Method Used:</span>
                      <p className="font-semibold text-emerald-800">Method 1 — Calibrated Port Terminal Weighbridge</p>
                      <p className="text-[9px] text-zinc-600">APSEZ Container Terminal Weighbridge Station #04, Mundra Port</p>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-900 block">Weighbridge Certificate / Ticket:</span>
                      <p className="font-mono text-zinc-800">Ticket No: <strong>WB-MUN-2026-991204</strong></p>
                      <p className="font-mono text-[9px] text-zinc-600">Timestamp: {new Date().toLocaleDateString('en-GB')} 11:42 IST</p>
                    </div>
                  </div>
                  <div className="p-2 bg-zinc-100 rounded text-[8.5px] text-zinc-600 italic">
                    "This is to certify that the gross mass of the container listed above has been verified in accordance with SOLAS regulation VI/2 and DG Shipping Merchant Shipping Notice 04/2016."
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 p-3 flex justify-between items-end text-[9px] text-zinc-600 bg-white">
                  <div>
                    <span>Weighbridge Calibration Validity: <strong>31-DEC-2026</strong></span><br />
                    <span>Transmitted to Terminal EDI: <strong>CONFIRMED (APSEZ GATE-IN UNLOCKED)</strong></span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-950 uppercase">{firmDetails.legalName}</p>
                    <p className="font-serif italic text-xs text-zinc-800">Authorized Marine Cargo Weighing Officer</p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
               10. MARINE TRANSIT INSURANCE COVER NOTE
               ══════════════════════════════════════════════════════════════════════════ */}
            {type === 'COVER_NOTE' && (
              <div className="font-sans text-xs bg-white text-zinc-950">
                <div className="border-2 border-zinc-900 p-4 pb-3 flex justify-between items-start bg-zinc-50">
                  <div>
                    <h1 className="font-bold text-base uppercase text-zinc-950 tracking-wider">{firmDetails.legalName}</h1>
                    <p className="text-[10px] text-zinc-600">Marine Insurance Transit Brokerage & Port Agency</p>
                    <p className="text-[9px] text-zinc-600">{firmDetails.registeredAddress} • GSTIN: {firmDetails.gstin}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 bg-amber-900 text-white font-bold text-[9px] rounded uppercase tracking-wider mb-1">
                      OPEN CARGO COVER
                    </span>
                    <h2 className="text-base font-black font-serif text-zinc-950 uppercase">MARINE CARGO INSURANCE COVER NOTE</h2>
                    <p className="text-[9.5px] font-mono text-zinc-600">Policy Ref: <strong>MAPS/MCI/2026/0419</strong></p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-2 p-3 text-[10px]">
                  <div className="pr-3 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block mb-0.5">Underwriting Insurer:</span>
                    <p className="font-bold text-zinc-950 text-xs">THE NEW INDIA ASSURANCE CO. LTD</p>
                    <p className="text-zinc-700 text-[10px]">Gandhidham Divisional Office, Kutch, Gujarat</p>
                    <p className="font-mono text-[9px] text-zinc-600 mt-1">Open Cover Policy No: 140200/21/26/00000412</p>
                  </div>
                  <div className="pl-3">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block mb-0.5">Insured Exporter / Consignee:</span>
                    <p className="font-bold text-zinc-950 text-xs">{data.shipperName || 'KRISHNA CERAMICS & TILES PVT LTD'}</p>
                    <p className="text-zinc-700 text-[10px]">Destination Consignee: {data.consigneeName || 'MUELLER GMBH, GERMANY'}</p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 p-3 text-[10px] space-y-2">
                  <div className="grid grid-cols-3 gap-2 bg-zinc-50 p-2.5 rounded border border-zinc-300 font-mono">
                    <div><span className="text-zinc-500 font-sans block text-[9px]">Sum Insured (CIF + 10%):</span> <strong className="text-emerald-800 text-xs">₹32,50,000 ($38,720)</strong></div>
                    <div><span className="text-zinc-500 font-sans block text-[9px]">Voyage:</span> <strong className="text-zinc-900 text-xs">Mundra (INMUN) &rarr; Hamburg (DEHAM)</strong></div>
                    <div><span className="text-zinc-500 font-sans block text-[9px]">Vessel:</span> <strong className="text-zinc-900 text-xs">{data.vesselName || 'MSC JADE'} 437W</strong></div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-zinc-900 block">Scope of Coverage:</span>
                    <p className="text-[9.5px] text-zinc-800 leading-tight">
                      &bull; <strong>Institute Cargo Clauses (A) 2009:</strong> All Risks of loss or damage to subject matter.<br />
                      &bull; <strong>Institute War Clauses (Cargo) & Institute Strikes Clauses (Cargo)</strong> included.<br />
                      &bull; <strong>Both-to-Blame Collision & General Average:</strong> Covered as per York-Antwerp Rules.
                    </p>
                    <p className="text-[9px] text-zinc-500">Deductible / Excess: 0.25% of consignment value each incident.</p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 p-3 flex justify-between items-end text-[9px] text-zinc-600 bg-white">
                  <div>
                    <span>Survey & Claims Settling Agent: <strong>WK WEBSTER & CO, HAMBURG</strong></span><br />
                    <span>Certificate Validity: <strong>From Port Gate-in until Final Delivery at Hamburg CFS</strong></span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-950 uppercase">{firmDetails.legalName}</p>
                    <p className="font-serif italic text-xs text-zinc-800">Authorized Insurance Operations Signatory</p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
               11. GST CREDIT NOTE / DEBIT NOTE
               ══════════════════════════════════════════════════════════════════════════ */}
            {(type === 'CREDIT_NOTE' || type === 'DEBIT_NOTE') && (
              <div className="font-sans text-xs bg-white text-zinc-950">
                <div className="border-2 border-zinc-900 p-4 pb-3 flex justify-between items-start bg-zinc-50">
                  <div>
                    <h1 className="font-bold text-base uppercase text-zinc-950 tracking-wider">{firmDetails.legalName}</h1>
                    <p className="text-[10px] text-zinc-600">{firmDetails.registeredAddress}</p>
                    <p className="font-mono text-[9px] text-zinc-800">GSTIN: {firmDetails.gstin} • State: Gujarat (24)</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 bg-rose-900 text-white font-bold text-[9px] rounded uppercase tracking-wider mb-1">
                      SECTION 34 CGST ACT
                    </span>
                    <h2 className="text-lg font-black font-serif text-zinc-950 uppercase">
                      {type === 'CREDIT_NOTE' ? 'GST CREDIT NOTE' : 'GST DEBIT NOTE'}
                    </h2>
                    <p className="text-[9.5px] font-mono text-zinc-600">Note No: <strong>{data.creditNoteNumber || data.debitNoteNumber || 'MAPS/CN/24-25/0014'}</strong></p>
                    <p className="text-[9px] text-zinc-500">Date: {new Date().toLocaleDateString('en-GB')}</p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-2 p-3 text-[10px]">
                  <div className="pr-3 border-r-2 border-zinc-900">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block mb-0.5">Recipient (Billed To):</span>
                    <p className="font-bold text-zinc-950 text-xs">{data.customerName || data.billToPartyName || 'KRISHNA CERAMICS & TILES PVT LTD'}</p>
                    <p className="font-mono text-[9px] text-zinc-700">GSTIN: {data.gstin || '24AABCK1234D1Z5'} • State: Gujarat (24)</p>
                  </div>
                  <div className="pl-3">
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase block mb-0.5">Original Invoice Details:</span>
                    <p className="font-mono text-zinc-900">Original Invoice No: <strong>{data.originalInvoiceNumber || 'MAPS/INV/24-25/0042'}</strong></p>
                    <p className="text-zinc-600">Reason: <strong className="text-zinc-800">{data.reason || 'Post-Sale Rate Discount / Demurrage Adjustment'}</strong></p>
                  </div>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 p-3">
                  <table className="w-full text-[10px] border border-zinc-300">
                    <thead className="bg-zinc-100 font-bold border-b border-zinc-300">
                      <tr>
                        <th className="p-2 text-left">Description of Adjustment</th>
                        <th className="p-2 text-left">SAC Code</th>
                        <th className="p-2 text-right">Differential Taxable (₹)</th>
                        <th className="p-2 text-right">GST Rate</th>
                        <th className="p-2 text-right">GST Adjustment (₹)</th>
                        <th className="p-2 text-right">Total Net Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 font-mono">
                      <tr>
                        <td className="p-2 font-sans font-medium text-zinc-950">{data.description || 'Special volume rebate on Mundra-Hamburg container freight'}</td>
                        <td className="p-2">996521</td>
                        <td className="p-2 text-right">₹15,000</td>
                        <td className="p-2 text-right">18%</td>
                        <td className="p-2 text-right">₹2,700</td>
                        <td className="p-2 text-right font-bold text-rose-800">₹17,700</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-x-2 border-b-2 border-zinc-900 p-3 flex justify-between items-end text-[9px] text-zinc-600 bg-white">
                  <div>
                    <span>Chargeable in Words: <strong>Seventeen Thousand Seven Hundred Rupees Only</strong></span><br />
                    <span>This credit will reflect in GSTR-1 Table 9B amendment.</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-950 uppercase">{firmDetails.legalName}</p>
                    <p className="font-serif italic text-xs text-zinc-800">Authorized Accounts Signatory</p>
                  </div>
                </div>
              </div>
            )}

          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

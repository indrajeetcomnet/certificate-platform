import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Eye,
  EyeOff,
  Type,
  Palette,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  ChevronLeft,
  ChevronRight,
  Feather,
  Crown,
  Medal,
  Shield,
  QrCode,
  Star,
  X,
  FileText,
  Magnet,
  Maximize2,
  Trophy,
  User,
  Layers,
  Check,
  Move,
  Upload,
  Pencil,
  PenTool,
  Sliders,
  Image as ImageIcon,
  Download,
  ChevronDown
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import CertificateIdCustomizer from './CertificateIdCustomizer';
import PaintColorPicker from '../ui/PaintColorPicker';
import FontFamilySelector, { FONT_OPTIONS } from '../ui/FontFamilySelector';
import {
  printCertificate,
  downloadCertificatePng,
  downloadCertificateSvg,
  downloadCertificateJson,
} from '../../utils/certificateExport';
import { useToast } from '../../context/ToastContext';
import { create as createCertApi, update as updateCertApi } from '../../api/certificatesApi';
import { getAllUsers } from '../../api/usersApi';

// Standard ISO 216 A4 Dimensions at 96 DPI (Landscape: 1123 x 794, Portrait: 794 x 1123)
const A4_WIDTH_LANDSCAPE = 1123;
const A4_HEIGHT_LANDSCAPE = 794;

// Default Template Definitions (Open & 100% User Modifiable)
const TEMPLATE_PRESETS = {
  'imperial-gold': {
    name: 'Imperial Gold Champion',
    theme: 'gold',
    bgClass: '#FDFBF7',
    borderStyle: 'double-gold',
    borderColor: '#B45309',
    elements: [
      {
        id: 'inst-logo',
        type: 'seal',
        x: 561,
        y: 105,
        sealType: 'crest',
        label: 'OFFICIAL ACCREDITATION',
        color: '#B45309',
        size: 52,
      },
      {
        id: 'inst-title',
        type: 'text',
        x: 561,
        y: 160,
        text: 'APEX SPORTS FEDERATION',
        fontFamily: 'cinzel',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#92400E',
        letterSpacing: '0.15em',
        textAlign: 'center',
        textTransform: 'uppercase',
      },
      {
        id: 'cert-title',
        type: 'text',
        x: 561,
        y: 220,
        text: 'CERTIFICATE OF ACHIEVEMENT',
        fontFamily: 'cinzel',
        fontSize: 32,
        fontWeight: '900',
        color: '#1C1917',
        letterSpacing: '0.08em',
        textAlign: 'center',
        textTransform: 'uppercase',
      },
      {
        id: 'award-subtitle',
        type: 'text',
        x: 561,
        y: 285,
        text: 'THIS OFFICIAL CREDENTIAL IS PROUDLY CONFERRED UPON',
        fontFamily: 'inter',
        fontSize: 11,
        fontWeight: '600',
        color: '#78716C',
        letterSpacing: '0.12em',
        textAlign: 'center',
        textTransform: 'uppercase',
      },
      {
        id: 'recipient-name',
        type: 'text',
        x: 561,
        y: 375,
        text: '{{recipient_name}}',
        sampleText: 'Indrajeet Sharma',
        fontFamily: 'playfair',
        fontSize: 44,
        fontWeight: 'bold',
        color: '#B45309',
        textAlign: 'center',
        underline: true,
      },
      {
        id: 'citation-body',
        type: 'text',
        x: 561,
        y: 470,
        text: 'For exemplary competitive excellence, athletic discipline, and securing 1st Place Gold Medal in the Game City National Invitational 2026.',
        fontFamily: 'inter',
        fontSize: 13,
        fontWeight: 'normal',
        color: '#44403C',
        textAlign: 'center',
        maxWidth: 720,
        lineHeight: 1.6,
      },
      {
        id: 'date-text',
        type: 'text',
        x: 230,
        y: 625,
        text: 'Date: {{issue_date}}',
        sampleText: 'Date: 17 November 2026',
        fontFamily: 'inter',
        fontSize: 12,
        fontWeight: '500',
        color: '#57534E',
        textAlign: 'center',
      },
      {
        id: 'gold-seal',
        type: 'seal',
        x: 561,
        y: 615,
        sealType: 'gold-medal',
        label: '#1 RANK GOLD',
        color: '#D97706',
        size: 68,
      },
      {
        id: 'signer-title',
        type: 'signature',
        x: 890,
        y: 615,
        signerName: 'Alexander Vance',
        signerTitle: 'Federation Director & Chief Official',
        fontFamily: 'signature',
        fontSize: 26,
        color: '#1C1917',
        textAlign: 'center',
      },
      {
        id: 'unique-number-pill',
        type: 'unique-code',
        x: 561,
        y: 725,
        code: '{{unique_code}}',
        sampleCode: 'GC-2026-ATH-GOLD-01',
        fontSize: 11,
        fontFamily: 'mono',
        color: '#1C1917',
      },
    ],
  },
  'royal-silver': {
    name: 'Royal Silver Medalist',
    theme: 'silver',
    bgClass: '#FAF9F5',
    borderStyle: 'double-silver',
    borderColor: '#64748B',
    elements: [
      {
        id: 'inst-title',
        type: 'text',
        x: 561,
        y: 130,
        text: 'APEX ATHLETIC FEDERATION',
        fontFamily: 'cinzel',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
        letterSpacing: '0.15em',
        textAlign: 'center',
        textTransform: 'uppercase',
      },
      {
        id: 'cert-title',
        type: 'text',
        x: 561,
        y: 200,
        text: 'DISTINGUISHED ATHLETE AWARD',
        fontFamily: 'cinzel',
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: '0.08em',
        textAlign: 'center',
        textTransform: 'uppercase',
      },
      {
        id: 'award-subtitle',
        type: 'text',
        x: 561,
        y: 275,
        text: 'PROUDLY CONFERRED UPON',
        fontFamily: 'inter',
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        letterSpacing: '0.12em',
        textAlign: 'center',
      },
      {
        id: 'recipient-name',
        type: 'text',
        x: 561,
        y: 365,
        text: '{{recipient_name}}',
        sampleText: 'Sarah Chen',
        fontFamily: 'playfair',
        fontSize: 44,
        fontWeight: 'bold',
        color: '#334155',
        textAlign: 'center',
        underline: true,
      },
      {
        id: 'citation-body',
        type: 'text',
        x: 561,
        y: 460,
        text: 'In recognition of securing 2nd Place Silver Medal and demonstrating championship tenacity across all tournament heats.',
        fontFamily: 'inter',
        fontSize: 13,
        fontWeight: 'normal',
        color: '#334155',
        textAlign: 'center',
        maxWidth: 720,
        lineHeight: 1.6,
      },
      {
        id: 'date-text',
        type: 'text',
        x: 230,
        y: 625,
        text: 'Date: {{issue_date}}',
        sampleText: 'Date: 17 November 2026',
        fontFamily: 'inter',
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
      },
      {
        id: 'silver-seal',
        type: 'seal',
        x: 561,
        y: 615,
        sealType: 'silver-medal',
        label: '#2 RANK SILVER',
        color: '#64748B',
        size: 66,
      },
      {
        id: 'signer-title',
        type: 'signature',
        x: 890,
        y: 615,
        signerName: 'Sarah Jenkins',
        signerTitle: 'President of Officials',
        fontFamily: 'alex-brush',
        fontSize: 26,
        color: '#0F172A',
        textAlign: 'center',
      },
      {
        id: 'unique-number-pill',
        type: 'unique-code',
        x: 561,
        y: 725,
        code: '{{unique_code}}',
        sampleCode: 'GC-2026-ATH-SILV-02',
        fontSize: 11,
        fontFamily: 'mono',
        color: '#0F172A',
      },
    ],
  },
  'emerald-fellow': {
    name: 'Emerald Distinction',
    theme: 'emerald',
    bgClass: '#F8FAF7',
    borderStyle: 'emerald-crest',
    borderColor: '#047857',
    elements: [
      {
        id: 'inst-logo',
        type: 'seal',
        x: 561,
        y: 105,
        sealType: 'academic-shield',
        label: 'ATHLETIC DISTINCTION',
        color: '#047857',
        size: 52,
      },
      {
        id: 'inst-title',
        type: 'text',
        x: 561,
        y: 160,
        text: 'GAME CITY SPORTS ACADEMY',
        fontFamily: 'cinzel',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#065F46',
        letterSpacing: '0.15em',
        textAlign: 'center',
        textTransform: 'uppercase',
      },
      {
        id: 'cert-title',
        type: 'text',
        x: 561,
        y: 220,
        text: 'HONORARY FELLOWSHIP',
        fontFamily: 'cinzel',
        fontSize: 32,
        fontWeight: '900',
        color: '#064E3B',
        letterSpacing: '0.08em',
        textAlign: 'center',
        textTransform: 'uppercase',
      },
      {
        id: 'award-subtitle',
        type: 'text',
        x: 561,
        y: 285,
        text: 'FOR SPECIAL MERIT & ENDURING SPORTSMANSHIP',
        fontFamily: 'inter',
        fontSize: 11,
        fontWeight: '600',
        color: '#65A30D',
        letterSpacing: '0.12em',
        textAlign: 'center',
      },
      {
        id: 'recipient-name',
        type: 'text',
        x: 561,
        y: 375,
        text: '{{recipient_name}}',
        sampleText: 'Indrajeet Sharma',
        fontFamily: 'playfair',
        fontSize: 44,
        fontWeight: 'bold',
        color: '#047857',
        textAlign: 'center',
        underline: true,
      },
      {
        id: 'citation-body',
        type: 'text',
        x: 561,
        y: 470,
        text: 'Conferred in recognition of leadership, record-breaking athletic endurance, and distinction in the official arena tournament series.',
        fontFamily: 'inter',
        fontSize: 13,
        fontWeight: 'normal',
        color: '#1F2937',
        textAlign: 'center',
        maxWidth: 720,
        lineHeight: 1.6,
      },
      {
        id: 'date-text',
        type: 'text',
        x: 230,
        y: 625,
        text: 'Date: {{issue_date}}',
        sampleText: 'Date: 17 November 2026',
        fontFamily: 'inter',
        fontSize: 12,
        color: '#047857',
        textAlign: 'center',
      },
      {
        id: 'emerald-seal',
        type: 'seal',
        x: 561,
        y: 615,
        sealType: 'academic-shield',
        label: 'CERTIFIED HONORS',
        color: '#047857',
        size: 68,
      },
      {
        id: 'signer-title',
        type: 'signature',
        x: 890,
        y: 615,
        signerName: 'Marcus Thorne',
        signerTitle: 'Academy Director & Head Coach',
        fontFamily: 'dancing',
        fontSize: 26,
        color: '#064E3B',
        textAlign: 'center',
      },
      {
        id: 'unique-number-pill',
        type: 'unique-code',
        x: 561,
        y: 725,
        code: '{{unique_code}}',
        sampleCode: 'GCSA-2026-HON-009',
        fontSize: 11,
        fontFamily: 'mono',
        color: '#064E3B',
      },
    ],
  },
};

export default function CertificateBoardDesigner({
  institutionId,
  initialCertificate = null,
  isEditing = false,
  onCertificateIssued,
  className = '',
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Virtual Canvas dimensions
  const [orientation, setOrientation] = useState(
    initialCertificate?.orientation || 'landscape'
  );
  const canvasWidth = orientation === 'landscape' ? A4_WIDTH_LANDSCAPE : A4_HEIGHT_LANDSCAPE;
  const canvasHeight = orientation === 'landscape' ? A4_HEIGHT_LANDSCAPE : A4_WIDTH_LANDSCAPE;

  // Canvas visual style & colors
  const [bgClass, setBgClass] = useState(
    initialCertificate?.bgClass || '#FDFBF7'
  );
  const [borderStyle, setBorderStyle] = useState(
    initialCertificate?.borderStyle || 'double-gold'
  );
  const [borderColor, setBorderStyleColor] = useState(
    initialCertificate?.borderColor || '#B45309'
  );
  const [boardTheme, setBoardTheme] = useState(
    initialCertificate?.boardTheme || 'gold'
  );

  // Core Certificate Data
  const [competitionTitle, setCompetitionTitle] = useState(
    initialCertificate?.title || 'Game City National Invitational 2026'
  );
  const [recipientName, setRecipientName] = useState(
    initialCertificate?.recipientName || 'Indrajeet Sharma'
  );
  const [recipientEmail, setRecipientEmail] = useState(
    initialCertificate?.recipientEmail || 'indrajeet@example.com'
  );
  const [citationText, setCitationText] = useState(
    initialCertificate?.description ||
      'For exemplary competitive excellence, athletic discipline, and securing 1st Place Gold Medal in the Game City National Invitational 2026.'
  );
  const [activeUniqueCode, setActiveUniqueCode] = useState(
    initialCertificate?.uniqueCode || 'GC-2026-ATH-GOLD-01'
  );

  // Elements Array
  const [elements, setElements] = useState(() => {
    if (initialCertificate?.templateData) {
      try {
        const parsed = JSON.parse(initialCertificate.templateData);
        if (parsed.elements && Array.isArray(parsed.elements)) return parsed.elements;
      } catch {}
    }
    return TEMPLATE_PRESETS['imperial-gold'].elements;
  });

  // History stack for Undo / Redo
  const [history, setHistory] = useState([elements]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = (newElements) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(newElements);
    if (updated.length > 30) updated.shift();
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setElements(history[newIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setElements(history[newIdx]);
    }
  };

  // Selection & Interaction
  const [selectedId, setSelectedId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [activeGuides, setActiveGuides] = useState([]);
  const [isInlineEditing, setIsInlineEditing] = useState(null);
  const [activeColorPickerPopover, setActiveColorPickerPopover] = useState(false);

  // Left Drawer state (Canva-style vertical rail)
  const [activeRailTab, setActiveRailTab] = useState('design'); // 'design' | 'text' | 'elements' | 'recipient' | 'serial' | 'signatures' | 'layers'
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Download Menu & Progress state
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideDownload = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideDownload);
    return () => document.removeEventListener('mousedown', handleOutsideDownload);
  }, []);

  // Custom Signature state
  const [customSignerName, setCustomSignerName] = useState('Alexander Vance');
  const [customSignerTitle, setCustomSignerTitle] = useState('Federation Director & Chief Official');
  const [customSignerFont, setCustomSignerFont] = useState('signature');
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState(null);
  const signatureFileInputRef = useRef(null);

  // Zoom & Desk measurement
  const deskRef = useRef(null);
  const canvasRef = useRef(null);
  const [zoomScale, setZoomScale] = useState(0.85);

  // Athletes list
  const [registeredAthletes, setRegisteredAthletes] = useState([]);

  // Direct Issuance Modal state
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issuedResult, setIssuedResult] = useState(null);

  // Load athletes
  useEffect(() => {
    getAllUsers()
      .then((res) => {
        const users = (res.data || []).filter((u) => u.role === 'USER' || !u.role);
        setRegisteredAthletes(users);
      })
      .catch(() => setRegisteredAthletes([]));
  }, []);

  // Compute Auto-Fit Zoom Scale
  const fitToScreen = useCallback(() => {
    if (!deskRef.current) return;
    const availWidth = deskRef.current.clientWidth - 48;
    const availHeight = deskRef.current.clientHeight - 48;
    if (availWidth > 100 && availHeight > 100) {
      const scaleW = availWidth / canvasWidth;
      const scaleH = availHeight / canvasHeight;
      const autoScale = Math.min(scaleW, scaleH);
      setZoomScale(Math.max(0.4, Math.min(1.2, Number(autoScale.toFixed(2)))));
    }
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    fitToScreen();
    window.addEventListener('resize', fitToScreen);
    return () => window.removeEventListener('resize', fitToScreen);
  }, [fitToScreen]);

  // Sync recipient name and citation to canvas elements
  useEffect(() => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === 'recipient-name') return { ...el, sampleText: recipientName };
        if (el.id === 'citation-body' && citationText) return { ...el, text: citationText };
        return el;
      })
    );
  }, [recipientName, citationText]);

  // Selected element
  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedId) || null,
    [elements, selectedId]
  );

  // Update selected element property
  const updateSelected = (property, value) => {
    if (!selectedId) return;
    const nextElements = elements.map((el) =>
      el.id === selectedId ? { ...el, [property]: value } : el
    );
    setElements(nextElements);
    pushHistory(nextElements);
  };

  // Center selected element horizontally
  const centerSelectedX = () => {
    if (!selectedId) return;
    const next = elements.map((el) =>
      el.id === selectedId ? { ...el, x: Math.round(canvasWidth / 2) } : el
    );
    setElements(next);
    pushHistory(next);
  };

  // Duplicate selected element
  const duplicateSelected = () => {
    if (!selectedElement) return;
    const duplicated = {
      ...selectedElement,
      id: `elem-${Date.now()}`,
      x: Math.min(canvasWidth - 80, selectedElement.x + 30),
      y: Math.min(canvasHeight - 60, selectedElement.y + 30),
    };
    const next = [...elements, duplicated];
    setElements(next);
    setSelectedId(duplicated.id);
    pushHistory(next);
    showToast('Element duplicated', 'info');
  };

  // Delete selected element
  const deleteSelected = () => {
    if (!selectedId) return;
    const next = elements.filter((el) => el.id !== selectedId);
    setElements(next);
    setSelectedId(null);
    pushHistory(next);
    showToast('Element removed', 'info');
  };

  // Handle signature upload file
  const handleSignatureFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG, JPG, SVG)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedSignatureUrl(reader.result);
      showToast('Signature image loaded! Click "Place on Canvas"', 'success');
    };
    reader.readAsDataURL(file);
  };

  // ─────────────────────────────────────────────────────────────
  // FLAWLESS CANVA-STYLE DRAG & DROP ENGINE
  // ─────────────────────────────────────────────────────────────
  const handleStartDrag = (e, elemId) => {
    if (previewMode) return;
    e.stopPropagation();
    setSelectedId(elemId);
    setIsInlineEditing(null);
    setActiveColorPickerPopover(false);

    const startClientX = e.clientX || (e.touches && e.touches[0].clientX);
    const startClientY = e.clientY || (e.touches && e.touches[0].clientY);
    const elem = elements.find((el) => el.id === elemId);
    if (!elem) return;

    const origX = elem.x;
    const origY = elem.y;

    const onPointerMove = (moveEvent) => {
      moveEvent.preventDefault();
      const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
      const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);

      const deltaX = (currentX - startClientX) / zoomScale;
      const deltaY = (currentY - startClientY) / zoomScale;

      let newX = Math.round(Math.max(40, Math.min(canvasWidth - 40, origX + deltaX)));
      let newY = Math.round(Math.max(30, Math.min(canvasHeight - 30, origY + deltaY)));

      const guides = [];

      if (snapEnabled) {
        // Snap to center X
        const centerX = Math.round(canvasWidth / 2);
        if (Math.abs(newX - centerX) <= 8) {
          newX = centerX;
          guides.push({ type: 'v', pos: centerX, label: 'Center' });
        }
        // Snap to middle Y
        const centerY = Math.round(canvasHeight / 2);
        if (Math.abs(newY - centerY) <= 8) {
          newY = centerY;
          guides.push({ type: 'h', pos: centerY, label: 'Middle' });
        }
        // Snap to other elements
        elements.forEach((other) => {
          if (other.id !== elemId) {
            if (Math.abs(newX - other.x) <= 6) {
              newX = other.x;
              guides.push({ type: 'v', pos: other.x, label: 'Align X' });
            }
            if (Math.abs(newY - other.y) <= 6) {
              newY = other.y;
              guides.push({ type: 'h', pos: other.y, label: 'Align Y' });
            }
          }
        });
      }

      setActiveGuides(guides);

      setElements((prev) =>
        prev.map((el) => (el.id === elemId ? { ...el, x: newX, y: newY } : el))
      );
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      setActiveGuides([]);
      setElements((current) => {
        pushHistory(current);
        return current;
      });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  // ─────────────────────────────────────────────────────────────
  // 8-HANDLE CORNER & EDGE RESIZE ENGINE
  // ─────────────────────────────────────────────────────────────
  const handleStartResize = (e, handle, elem) => {
    if (previewMode) return;
    e.stopPropagation();

    const startClientX = e.clientX || (e.touches && e.touches[0].clientX);
    const startClientY = e.clientY || (e.touches && e.touches[0].clientY);

    const origFontSize = elem.fontSize || 14;
    const origSize = elem.size || 60;
    const origMaxWidth = elem.maxWidth || 700;

    const onResizeMove = (moveEvent) => {
      moveEvent.preventDefault();
      const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
      const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);

      const deltaX = (currentX - startClientX) / zoomScale;
      const deltaY = (currentY - startClientY) / zoomScale;

      const isCorner = ['nw', 'ne', 'se', 'sw'].includes(handle);
      const isHorizontal = ['e', 'w'].includes(handle);

      if (elem.type === 'text') {
        if (isCorner) {
          let factor = (deltaX + deltaY) / 2;
          if (handle === 'nw') factor = -(deltaX + deltaY) / 2;
          else if (handle === 'ne') factor = (deltaX - deltaY) / 2;
          else if (handle === 'sw') factor = (-deltaX + deltaY) / 2;

          const newFontSize = Math.max(9, Math.min(84, Math.round(origFontSize + factor * 0.2)));
          setElements((prev) =>
            prev.map((el) => (el.id === elem.id ? { ...el, fontSize: newFontSize } : el))
          );
        } else if (isHorizontal) {
          const widthDelta = handle === 'e' ? deltaX : -deltaX;
          const newMaxWidth = Math.max(180, Math.min(1050, Math.round(origMaxWidth + widthDelta * 2)));
          setElements((prev) =>
            prev.map((el) => (el.id === elem.id ? { ...el, maxWidth: newMaxWidth } : el))
          );
        }
      } else if (elem.type === 'seal') {
        let factor = (deltaX + deltaY) / 2;
        if (handle === 'nw') factor = -(deltaX + deltaY) / 2;
        const newSize = Math.max(34, Math.min(150, Math.round(origSize + factor * 0.4)));
        setElements((prev) =>
          prev.map((el) => (el.id === elem.id ? { ...el, size: newSize } : el))
        );
      } else if (elem.type === 'signature') {
        const factor = (deltaX + deltaY) / 2;
        const newFontSize = Math.max(16, Math.min(54, Math.round(origFontSize + factor * 0.2)));
        const newSize = Math.max(30, Math.min(120, Math.round(origSize + factor * 0.3)));
        setElements((prev) =>
          prev.map((el) => (el.id === elem.id ? { ...el, fontSize: newFontSize, size: newSize } : el))
        );
      }
    };

    const onResizeUp = () => {
      window.removeEventListener('pointermove', onResizeMove);
      window.removeEventListener('pointerup', onResizeUp);
      window.removeEventListener('touchmove', onResizeMove);
      window.removeEventListener('touchend', onResizeUp);
      setElements((current) => {
        pushHistory(current);
        return current;
      });
    };

    window.addEventListener('pointermove', onResizeMove, { passive: false });
    window.addEventListener('pointerup', onResizeUp);
    window.addEventListener('touchmove', onResizeMove, { passive: false });
    window.addEventListener('touchend', onResizeUp);
  };

  // ─────────────────────────────────────────────────────────────
  // OPEN CANVAS: ADD ELEMENTS FREELY
  // ─────────────────────────────────────────────────────────────
  const addElement = (elementDef) => {
    const newId = `elem-${Date.now()}`;
    const newElement = {
      id: newId,
      x: Math.round(canvasWidth / 2),
      y: Math.round(canvasHeight / 2),
      ...elementDef,
    };
    const next = [...elements, newElement];
    setElements(next);
    setSelectedId(newId);
    pushHistory(next);
    showToast(`Added ${elementDef.type || 'element'}`, 'success');
  };

  // ── EXPORT ENGINES: PRINT & DOWNLOAD ──

  // 1. Pixel-perfect A4 Printing (Isolated iframe, 0 margins, zero mislocation)
  const handlePrint = () => {
    setSelectedId(null);
    setIsInlineEditing(null);
    setActiveColorPickerPopover(false);
    const board = document.getElementById('printable-certificate-board');
    printCertificate(board, orientation);
  };

  // 2. High-Res PNG Download
  const handleDownloadPng = async () => {
    setDownloading(true);
    setDownloadMenuOpen(false);
    setSelectedId(null);
    setIsInlineEditing(null);
    setActiveColorPickerPopover(false);
    try {
      const board = document.getElementById('printable-certificate-board');
      const safeTitle = (competitionTitle || 'certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeRecipient = (recipientName || 'honors').replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadCertificatePng(board, `${safeTitle}_${safeRecipient}`, orientation);
      showToast('High-Resolution PNG downloaded!', 'success');
    } catch {
      showToast('Export failed, please try vector SVG download', 'error');
    } finally {
      setDownloading(false);
    }
  };

  // 3. Vector SVG Download
  const handleDownloadSvg = () => {
    setDownloadMenuOpen(false);
    setSelectedId(null);
    setIsInlineEditing(null);
    setActiveColorPickerPopover(false);
    const board = document.getElementById('printable-certificate-board');
    const safeTitle = (competitionTitle || 'certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadCertificateSvg(board, `${safeTitle}_vector`, orientation);
    showToast('Vector SVG downloaded!', 'success');
  };

  // 4. Template JSON Export
  const handleDownloadJson = () => {
    setDownloadMenuOpen(false);
    const templateData = {
      elements,
      bgClass,
      borderStyle,
      borderColor,
      boardTheme,
      orientation,
      competitionTitle,
      recipientName,
      recipientEmail,
      citationText,
      activeUniqueCode,
    };
    const safeTitle = (competitionTitle || 'certificate-template').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadCertificateJson(templateData, `${safeTitle}-design.json`);
    showToast('Design JSON exported!', 'success');
  };

  // Save / Issue Certificate
  const handleIssueCertificate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!recipientName.trim() || !recipientEmail.trim()) {
      showToast('Please provide recipient name and email in the Recipient tab', 'error');
      setActiveRailTab('recipient');
      setDrawerOpen(true);
      return;
    }

    setIssueLoading(true);
    try {
      const templateData = JSON.stringify({
        elements,
        bgClass,
        borderStyle,
        borderColor,
        boardTheme,
        orientation,
        canvasWidth,
        canvasHeight,
      });

      const payload = {
        title: competitionTitle || 'Official Certificate of Achievement',
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        description: citationText.trim(),
        uniqueCode: activeUniqueCode,
        template: 'designer',
        templateData,
      };

      let result;
      if (isEditing && initialCertificate?.id) {
        result = await updateCertApi(initialCertificate.id, payload);
        showToast('Certificate successfully updated!', 'success');
      } else {
        result = await createCertApi(payload);
        showToast('Certificate issued successfully!', 'success');
      }

      setIssuedResult(result.data || payload);
      setIssueModalOpen(false);

      if (onCertificateIssued) {
        onCertificateIssued(result.data || payload);
      } else {
        navigate('/certificates');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save certificate', 'error');
    } finally {
      setIssueLoading(false);
    }
  };

  // Left Rail Tab Navigation Items
  const railTabs = [
    { id: 'design', label: 'Design', icon: Palette, title: 'Styles, Colors & Borders' },
    { id: 'text', label: 'Text', icon: Type, title: 'Add & Style Typography' },
    { id: 'elements', label: 'Elements', icon: Award, title: 'Medals, Badges & Seals' },
    { id: 'recipient', label: 'Recipient', icon: User, title: 'Athlete Credentials' },
    { id: 'serial', label: 'Serial ID', icon: ShieldCheck, title: 'Unique Code Generator' },
    { id: 'signatures', label: 'Signatures', icon: Feather, title: 'Calligraphy & Custom Signatures' },
    { id: 'layers', label: 'Layers', icon: Layers, title: 'Element Layers' },
  ];

  const handleRailClick = (tabId) => {
    if (activeRailTab === tabId && drawerOpen) {
      setDrawerOpen(false);
    } else {
      setActiveRailTab(tabId);
      setDrawerOpen(true);
    }
  };

  // Get active CSS font family class
  const getFontFamilyClass = (fontKey) => {
    const found = FONT_OPTIONS.find((f) => f.id === fontKey);
    return found ? found.className : 'font-sans';
  };

  return (
    <div className={`w-full h-full flex-1 flex flex-col bg-[#F3F3ED] text-stone-900 select-none overflow-hidden relative ${className}`}>
      
      {/* ── 1. SINGLE UNIFIED TOP BAR (HEIGHT: 48px, BADGES & FEED BUTTONS REMOVED) ── */}
      <header className="h-12 bg-white border-b border-stone-200/90 px-3 sm:px-4 flex items-center justify-between gap-3 z-30 shrink-0">
        
        {/* Left: Back button, Studio Logo, Editable Document Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/certificates"
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="Return to Certificates"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-stone-950 shadow-xs">
            <Trophy className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={competitionTitle}
              onChange={(e) => setCompetitionTitle(e.target.value)}
              placeholder="Certificate Title..."
              className="text-xs font-black text-stone-900 bg-transparent hover:bg-stone-100 focus:bg-white px-2 py-0.5 rounded border border-transparent focus:border-amber-400 focus:outline-none transition-colors max-w-[240px] truncate"
              title="Click to rename document title"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 border border-amber-500/20 hidden md:inline">
              A4 Studio
            </span>
          </div>
        </div>

        {/* Center: Undo/Redo, Zoom Controls, Orientation, Preview Mode */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Undo / Redo */}
          <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200/80">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1 text-stone-600 hover:text-stone-950 disabled:opacity-30 disabled:cursor-not-allowed rounded"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1 text-stone-600 hover:text-stone-950 disabled:opacity-30 disabled:cursor-not-allowed rounded"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Orientation Switcher */}
          <div className="hidden sm:flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200/80 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setOrientation('landscape');
                setTimeout(fitToScreen, 100);
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                orientation === 'landscape' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Landscape
            </button>
            <button
              type="button"
              onClick={() => {
                setOrientation('portrait');
                setTimeout(fitToScreen, 100);
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                orientation === 'portrait' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Portrait
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200/80">
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.max(0.4, Number((prev - 0.08).toFixed(2))))}
              className="p-1 text-stone-500 hover:text-stone-900 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[10px] font-bold text-stone-700">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.min(1.4, Number((prev + 0.08).toFixed(2))))}
              className="p-1 text-stone-500 hover:text-stone-900 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={fitToScreen}
              className="px-1.5 py-0.5 text-[9px] font-bold text-amber-800 hover:text-stone-900 bg-amber-500/10 rounded ml-0.5"
              title="Fit to Window"
            >
              Fit
            </button>
          </div>

          {/* Magnetic Snap Guides Toggle */}
          <button
            type="button"
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`p-1.5 rounded-lg border transition-colors ${
              snapEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-stone-100 text-stone-400 border-stone-200 hover:text-stone-700'
            }`}
            title={snapEnabled ? 'Magnetic Snap Guides ON' : 'Magnetic Snap Guides OFF'}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>

          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              previewMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200'
            }`}
            title="Preview final printout"
          >
            {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{previewMode ? 'Exit Preview' : 'Preview'}</span>
          </button>
        </div>

        {/* Right: Download Menu & Print & Primary Save/Issue Action */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Download Dropdown */}
          <div ref={downloadMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              disabled={downloading}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              title="Download Certificate"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">{downloading ? 'Exporting...' : 'Download'}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {downloadMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-stone-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400 border-b border-stone-100 mb-1">
                  Export Options
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-50 text-stone-800 flex items-center gap-2 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                    PNG
                  </div>
                  <div>
                    <div className="text-xs font-bold group-hover:text-amber-900">High-Res PNG</div>
                    <div className="text-[10px] text-stone-400">Crisp 300 DPI image</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-50 text-stone-800 flex items-center gap-2 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                    PDF
                  </div>
                  <div>
                    <div className="text-xs font-bold group-hover:text-emerald-900">Save as PDF / Print</div>
                    <div className="text-[10px] text-stone-400">Direct A4 vector document</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-50 text-stone-800 flex items-center gap-2 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                    SVG
                  </div>
                  <div>
                    <div className="text-xs font-bold group-hover:text-blue-900">Vector SVG</div>
                    <div className="text-[10px] text-stone-400">Lossless vector artwork</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-stone-100 text-stone-800 flex items-center gap-2 transition-colors border-t border-stone-100 mt-1 pt-1.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-[10px]">
                    JSON
                  </div>
                  <div>
                    <div className="text-xs font-bold">Template Data</div>
                    <div className="text-[10px] text-stone-400">Backup certificate layout</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Quick Print Button (Zero Margins, Isolated A4) */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
            title="Direct A4 Print (Zero Margins)"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Primary Save / Issue Certificate Action */}
          <Button
            size="sm"
            variant="primary"
            icon={Award}
            onClick={() => setIssueModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold border-none shadow-xs text-xs px-3.5 py-1.5"
          >
            {isEditing ? 'Save Certificate' : 'Issue Certificate'}
          </Button>
        </div>

      </header>

      {/* ── 2. MAIN WORKSPACE (SLIM RAIL + COLLAPSIBLE DRAWER + HERO ARTBOARD) ── */}
      <div className="flex-1 w-full flex overflow-hidden relative">

        {/* ── 2A. SLIM CANVA VERTICAL RAIL (WIDTH: 60px) ── */}
        <aside className="w-[60px] bg-white border-r border-stone-200/90 flex flex-col items-center py-2 gap-1 z-20 shrink-0">
          {railTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeRailTab === tab.id && drawerOpen;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleRailClick(tab.id)}
                className={`w-[50px] py-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-center ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-900 font-extrabold shadow-xs border border-amber-500/30'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                }`}
                title={tab.title}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-700' : 'text-stone-600'}`} />
                <span className="text-[9.5px] leading-tight font-bold">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* ── 2B. COLLAPSIBLE TOOL DRAWER (WIDTH: 290px) ── */}
        {drawerOpen && activeRailTab && (
          <aside className="w-[290px] bg-white border-r border-stone-200/90 flex flex-col z-20 shadow-lg shrink-0 overflow-hidden animate-in slide-in-from-left-2 duration-150">
            
            {/* Drawer Header */}
            <div className="h-10 px-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-black text-stone-900 tracking-tight flex items-center gap-1.5 uppercase">
                {railTabs.find((t) => t.id === activeRailTab)?.label}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                title="Collapse Panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
              
              {/* TAB 1: DESIGN & BACKGROUND THEMES + MS PAINT COLOR PICKER */}
              {activeRailTab === 'design' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-stone-500 mb-2">
                      Starting Presets
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {Object.entries(TEMPLATE_PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setElements(preset.elements);
                            setBgClass(preset.bgClass);
                            setBorderStyle(preset.borderStyle);
                            setBorderStyleColor(preset.borderColor || '#B45309');
                            setBoardTheme(preset.theme);
                            pushHistory(preset.elements);
                            showToast(`Loaded ${preset.name}`, 'info');
                          }}
                          className="w-full text-left p-2 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-bold text-stone-900 group-hover:text-amber-900">{preset.name}</div>
                            <div className="text-[10px] text-stone-400 capitalize">{preset.theme} style</div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Apply
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* MS Paint Style Saturation & Color Box for Canvas Background */}
                  <div>
                    <PaintColorPicker
                      label="Canvas Background Tone"
                      color={bgClass}
                      onChange={(c) => setBgClass(c)}
                    />
                  </div>

                  {/* Border Style & Custom Border Color */}
                  <div className="space-y-3">
                    <label className="block text-[11px] font-black uppercase text-stone-500">
                      Border Style & Color
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'double-gold', label: 'Gold Filigree' },
                        { id: 'double-silver', label: 'Silver Double' },
                        { id: 'emerald-crest', label: 'Emerald Frame' },
                        { id: 'modern-thin', label: 'Modern Thin' },
                        { id: 'none', label: 'Borderless' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBorderStyle(b.id)}
                          className={`p-1.5 rounded-xl border text-center text-[11px] font-bold transition-all ${
                            borderStyle === b.id
                              ? 'bg-amber-50 text-amber-900 border-amber-400 shadow-xs'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>

                    <PaintColorPicker
                      label="Border Line Color"
                      color={borderColor}
                      onChange={(c) => setBorderStyleColor(c)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: TEXT COMPONENTS WITH FONT SELECTOR */}
              {activeRailTab === 'text' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-stone-500">
                    Click any block to insert customizable text with executive typography:
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      addElement({
                        type: 'text',
                        text: 'CERTIFICATE TITLE',
                        fontFamily: 'cinzel',
                        fontSize: 32,
                        fontWeight: '900',
                        color: '#1C1917',
                        letterSpacing: '0.08em',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-400 text-left transition-all group"
                  >
                    <div className="font-cinzel text-base font-bold text-stone-900 group-hover:text-amber-900">
                      Add Main Heading
                    </div>
                    <div className="text-[10px] text-stone-400">Cinzel serif luxury font</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      addElement({
                        type: 'text',
                        text: '{{recipient_name}}',
                        sampleText: recipientName || 'Athlete Full Name',
                        fontFamily: 'playfair',
                        fontSize: 44,
                        fontWeight: 'bold',
                        color: '#B45309',
                        textAlign: 'center',
                        underline: true,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-400 text-left transition-all group"
                  >
                    <div className="font-playfair text-lg font-bold text-amber-700">
                      Add Recipient Name
                    </div>
                    <div className="text-[10px] text-stone-400">Playfair Display centerpiece font</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      addElement({
                        type: 'text',
                        text: 'In recognition of outstanding athletic discipline, dedication, and sportsmanship.',
                        fontFamily: 'inter',
                        fontSize: 13,
                        fontWeight: 'normal',
                        color: '#44403C',
                        textAlign: 'center',
                        maxWidth: 700,
                        lineHeight: 1.6,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-400 text-left transition-all group"
                  >
                    <div className="text-xs font-medium text-stone-800">Add Citation Statement</div>
                    <div className="text-[10px] text-stone-400">Multi-line body paragraph</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      addElement({
                        type: 'text',
                        text: 'THIS OFFICIAL CREDENTIAL IS CONFERRED UPON',
                        fontFamily: 'inter',
                        fontSize: 11,
                        fontWeight: '600',
                        color: '#78716C',
                        letterSpacing: '0.12em',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-400 text-left transition-all group"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      Add Subtitle Line
                    </div>
                    <div className="text-[10px] text-stone-400">Conferred upon / In honor of</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      addElement({
                        type: 'text',
                        text: `Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
                        fontFamily: 'inter',
                        fontSize: 12,
                        fontWeight: '500',
                        color: '#57534E',
                        textAlign: 'center',
                      })
                    }
                    className="w-full p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left transition-colors"
                  >
                    <div className="text-xs font-medium text-stone-700">Add Date Text</div>
                  </button>
                </div>
              )}

              {/* TAB 3: ELEMENTS & BADGES */}
              {activeRailTab === 'elements' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-stone-500">
                    Click to place official medals, crests, and honors directly on the canvas:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        addElement({
                          type: 'seal',
                          sealType: 'gold-medal',
                          label: '#1 GOLD MEDAL',
                          color: '#D97706',
                          size: 68,
                        })
                      }
                      className="p-3 rounded-xl border border-stone-200 bg-amber-50/50 hover:bg-amber-100/60 flex flex-col items-center gap-1.5 transition-all text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 flex items-center justify-center shadow-xs">
                        <Crown className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-amber-900 text-[11px]">Gold Medal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        addElement({
                          type: 'seal',
                          sealType: 'silver-medal',
                          label: '#2 SILVER MEDAL',
                          color: '#64748B',
                          size: 68,
                        })
                      }
                      className="p-3 rounded-xl border border-stone-200 bg-slate-50 hover:bg-slate-100 flex flex-col items-center gap-1.5 transition-all text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-stone-950 flex items-center justify-center shadow-xs">
                        <Medal className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800 text-[11px]">Silver Medal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        addElement({
                          type: 'seal',
                          sealType: 'crest',
                          label: 'OFFICIAL ACCREDITATION',
                          color: '#B45309',
                          size: 54,
                        })
                      }
                      className="p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 flex flex-col items-center gap-1.5 transition-all text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-stone-800 text-[11px]">Federation Crest</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        addElement({
                          type: 'seal',
                          sealType: 'academic-shield',
                          label: 'VERIFIED DISTINCTION',
                          color: '#047857',
                          size: 54,
                        })
                      }
                      className="p-3 rounded-xl border border-stone-200 bg-emerald-50/50 hover:bg-emerald-100/60 flex flex-col items-center gap-1.5 transition-all text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-emerald-900 text-[11px]">Honor Shield</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: RECIPIENT ATHLETE CREDENTIALS */}
              {activeRailTab === 'recipient' && (
                <div className="space-y-3">
                  {registeredAthletes.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Select Registered Athlete
                      </label>
                      <select
                        onChange={(e) => {
                          const athlete = registeredAthletes.find((u) => u.id === e.target.value);
                          if (athlete) {
                            setRecipientName(athlete.displayName || athlete.username);
                            setRecipientEmail(athlete.email || `${athlete.username}@arena.platform`);
                            showToast(`Selected ${athlete.displayName || athlete.username}`, 'info');
                          }
                        }}
                        className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-stone-200 bg-stone-50"
                      >
                        <option value="">-- Choose Athlete --</option>
                        {registeredAthletes.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.displayName || a.username} ({a.email || 'No Email'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Indrajeet Sharma"
                      className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. athlete@example.com"
                      className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Citation Statement
                    </label>
                    <textarea
                      rows={3}
                      value={citationText}
                      onChange={(e) => setCitationText(e.target.value)}
                      className="w-full text-xs font-normal px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: SERIAL ID / UNIQUE CODE */}
              {activeRailTab === 'serial' && (
                <div className="space-y-4">
                  <CertificateIdCustomizer
                    onFormatChange={(code) => {
                      setActiveUniqueCode(code);
                      setElements((prev) =>
                        prev.map((el) =>
                          el.type === 'unique-code'
                            ? { ...el, sampleCode: code, code }
                            : el
                        )
                      );
                    }}
                    initialCode={activeUniqueCode}
                  />

                  <div className="pt-2 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() =>
                        addElement({
                          type: 'unique-code',
                          code: activeUniqueCode,
                          sampleCode: activeUniqueCode,
                          fontSize: 11,
                          fontFamily: 'mono',
                          color: '#1C1917',
                        })
                      }
                      className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Verification Pill to Canvas</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 6: CUSTOM SIGNATURES & IMAGE UPLOAD */}
              {activeRailTab === 'signatures' && (
                <div className="space-y-4">
                  
                  {/* Option 1: Upload Signature Image */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                    <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>Upload Real Signature Image</span>
                    </div>
                    <p className="text-[10px] text-stone-500 leading-tight">
                      Upload scanned signature PNG/JPG/SVG with transparent or white background:
                    </p>

                    <input
                      ref={signatureFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureFileUpload}
                      className="hidden"
                    />

                    {uploadedSignatureUrl ? (
                      <div className="space-y-2">
                        <div className="h-16 bg-white rounded-lg border border-stone-200 p-1 flex items-center justify-center relative">
                          <img
                            src={uploadedSignatureUrl}
                            alt="Uploaded Signature"
                            className="max-h-full max-w-full object-contain filter contrast-125"
                          />
                          <button
                            type="button"
                            onClick={() => setUploadedSignatureUrl(null)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            addElement({
                              type: 'signature',
                              signatureMode: 'image',
                              imageUrl: uploadedSignatureUrl,
                              signerName: customSignerName,
                              signerTitle: customSignerTitle,
                              size: 54,
                              color: '#1C1917',
                            });
                          }}
                          className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Place Uploaded Signature</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => signatureFileInputRef.current?.click()}
                        className="w-full py-2.5 border-2 border-dashed border-stone-300 hover:border-amber-400 rounded-lg text-stone-600 hover:text-amber-800 bg-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span>Choose Signature File...</span>
                      </button>
                    )}
                  </div>

                  {/* Option 2: Custom Typed Calligraphy Signature */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                    <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                      <Feather className="w-3.5 h-3.5 text-amber-600" />
                      <span>Custom Calligraphy Signer</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                        Signatory Full Name
                      </label>
                      <input
                        type="text"
                        value={customSignerName}
                        onChange={(e) => setCustomSignerName(e.target.value)}
                        placeholder="e.g. Dr. Michael Harrison"
                        className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                        Official Title / Role
                      </label>
                      <input
                        type="text"
                        value={customSignerTitle}
                        onChange={(e) => setCustomSignerTitle(e.target.value)}
                        placeholder="e.g. Director of Athletics"
                        className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                        Calligraphy Style
                      </label>
                      <select
                        value={customSignerFont}
                        onChange={(e) => setCustomSignerFont(e.target.value)}
                        className="w-full text-xs font-bold px-2 py-1 rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="signature">Great Vibes (Royal Script)</option>
                        <option value="alex-brush">Alex Brush (Executive Cursive)</option>
                        <option value="dancing">Dancing Script (Artistic Pen)</option>
                        <option value="pinyon">Pinyon Script (Classic Aristocrat)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addElement({
                          type: 'signature',
                          signatureMode: 'text',
                          signerName: customSignerName,
                          signerTitle: customSignerTitle,
                          fontFamily: customSignerFont,
                          fontSize: 26,
                          color: '#1C1917',
                          textAlign: 'center',
                        });
                      }}
                      className="w-full py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Signature</span>
                    </button>
                  </div>

                </div>
              )}

              {/* TAB 7: ELEMENT LAYERS TREE */}
              {activeRailTab === 'layers' && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-stone-500 mb-2">
                    Click to select element on canvas:
                  </p>
                  {elements.map((elem, idx) => (
                    <div
                      key={elem.id}
                      onClick={() => setSelectedId(elem.id)}
                      className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        selectedId === elem.id
                          ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] text-stone-400 font-mono">#{idx + 1}</span>
                        <span className="text-xs truncate capitalize">
                          {elem.text ? `"${elem.text.slice(0, 18)}..."` : elem.label || elem.type}
                        </span>
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-600">
                        {elem.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </aside>
        )}

        {/* ── 2C. MASSIVE FULL-WINDOW ARTBOARD STAGE (THE BIG BOARD) ── */}
        <main
          ref={deskRef}
          onClick={() => {
            setSelectedId(null);
            setActiveColorPickerPopover(false);
          }}
          className="flex-1 w-full h-full flex items-center justify-center overflow-auto bg-[#EBEBE6] p-4 relative"
        >
          {/* Virtual Canvas wrapper scaled via CSS Transform */}
          <div
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              transform: `scale(${zoomScale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s ease-out',
            }}
            className="shrink-0 relative shadow-2xl select-none"
          >
            {/* ── THE PRINTABLE CERTIFICATE CANVAS (HERO OF THE SCREEN) ── */}
            <div
              id="printable-certificate-board"
              ref={canvasRef}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(null);
                setIsInlineEditing(null);
                setActiveColorPickerPopover(false);
              }}
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                backgroundColor: bgClass,
              }}
              className="relative shadow-2xl overflow-hidden border border-stone-300 select-none"
            >

              {/* ── LUXURY BORDER SYSTEM (USER COLORABLE) ── */}
              {borderStyle === 'double-gold' && (
                <>
                  <div
                    style={{ borderColor }}
                    className="absolute inset-5 rounded-xl border-2 pointer-events-none"
                  >
                    <div
                      style={{ borderColor: `${borderColor}66` }}
                      className="absolute inset-1.5 rounded-lg border"
                    />
                  </div>
                  <div style={{ borderColor }} className="absolute top-7 left-7 w-6 h-6 border-t-2 border-l-2 pointer-events-none" />
                  <div style={{ borderColor }} className="absolute top-7 right-7 w-6 h-6 border-t-2 border-r-2 pointer-events-none" />
                  <div style={{ borderColor }} className="absolute bottom-7 left-7 w-6 h-6 border-b-2 border-l-2 pointer-events-none" />
                  <div style={{ borderColor }} className="absolute bottom-7 right-7 w-6 h-6 border-b-2 border-r-2 pointer-events-none" />
                </>
              )}

              {borderStyle === 'double-silver' && (
                <>
                  <div
                    style={{ borderColor }}
                    className="absolute inset-5 rounded-xl border-2 pointer-events-none"
                  >
                    <div
                      style={{ borderColor: `${borderColor}55` }}
                      className="absolute inset-1.5 rounded-lg border"
                    />
                  </div>
                  <div style={{ borderColor }} className="absolute top-7 left-7 w-6 h-6 border-t-2 border-l-2 pointer-events-none" />
                  <div style={{ borderColor }} className="absolute top-7 right-7 w-6 h-6 border-t-2 border-r-2 pointer-events-none" />
                  <div style={{ borderColor }} className="absolute bottom-7 left-7 w-6 h-6 border-b-2 border-l-2 pointer-events-none" />
                  <div style={{ borderColor }} className="absolute bottom-7 right-7 w-6 h-6 border-b-2 border-r-2 pointer-events-none" />
                </>
              )}

              {borderStyle === 'emerald-crest' && (
                <>
                  <div
                    style={{ borderColor }}
                    className="absolute inset-5 rounded-xl border-2 pointer-events-none"
                  >
                    <div
                      style={{ borderColor: `${borderColor}55` }}
                      className="absolute inset-1.5 rounded-lg border"
                    />
                  </div>
                  <div style={{ borderColor }} className="absolute top-7 left-7 w-6 h-6 border-t-2 border-l-2 pointer-events-none" />
                  <div style={{ borderColor }} className="absolute top-7 right-7 w-6 h-6 border-t-2 border-r-2 pointer-events-none" />
                  <div style={{ borderColor }} className="absolute bottom-7 left-7 w-6 h-6 border-b-2 border-l-2 pointer-events-none" />
                  <div style={{ borderColor }} className="absolute bottom-7 right-7 w-6 h-6 border-b-2 border-r-2 pointer-events-none" />
                </>
              )}

              {borderStyle === 'modern-thin' && (
                <div
                  style={{ borderColor }}
                  className="absolute inset-6 rounded-lg border pointer-events-none"
                />
              )}

              {/* ── REAL-TIME MAGNETIC SNAP GUIDE LINES ── */}
              {activeGuides.map((guide, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    zIndex: 40,
                    ...(guide.type === 'v'
                      ? {
                          left: `${guide.pos}px`,
                          top: 0,
                          bottom: 0,
                          width: '1px',
                          borderLeft: '1.5px dashed #EC4899',
                        }
                      : {
                          top: `${guide.pos}px`,
                          left: 0,
                          right: 0,
                          height: '1px',
                          borderTop: '1.5px dashed #EC4899',
                        }),
                  }}
                >
                  <span className="absolute top-2 left-2 bg-pink-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                    {guide.label}
                  </span>
                </div>
              ))}

              {/* ── RENDER ALL CANVAS ELEMENTS ── */}
              {elements.map((elem) => {
                const isSelected = selectedId === elem.id && !previewMode;

                // Rendered text computation
                let displayText = elem.text || '';
                if (elem.id === 'recipient-name') displayText = recipientName || elem.sampleText;
                if (elem.id === 'date-text') displayText = `Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                if (elem.id === 'citation-body' && citationText) displayText = citationText;

                return (
                  <div
                    key={elem.id}
                    onPointerDown={(e) => handleStartDrag(e, elem.id)}
                    onDoubleClick={() => {
                      if (elem.type === 'text') setIsInlineEditing(elem.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${elem.x}px`,
                      top: `${elem.y}px`,
                      transform: 'translate(-50%, -50%)',
                      cursor: previewMode ? 'default' : 'grab',
                      zIndex: isSelected ? 30 : 10,
                      touchAction: 'none',
                    }}
                    className={`group transition-shadow duration-75 select-none ${
                      isSelected ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white' : ''
                    }`}
                  >
                    
                    {/* Small Pencil icon button to edit text on component */}
                    {isSelected && elem.type === 'text' && !isInlineEditing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsInlineEditing(elem.id);
                        }}
                        className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg z-50 transition-transform hover:scale-110 cursor-pointer"
                        title="Click to edit text (or double click)"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}

                    {/* 1. TEXT ELEMENT */}
                    {elem.type === 'text' && (
                      <div>
                        {isInlineEditing === elem.id ? (
                          <textarea
                            autoFocus
                            defaultValue={displayText}
                            onBlur={(e) => {
                              updateSelected('text', e.target.value);
                              setIsInlineEditing(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setIsInlineEditing(null);
                            }}
                            style={{
                              fontSize: `${elem.fontSize || 14}px`,
                              color: elem.color || '#1C1917',
                              fontWeight: elem.fontWeight || 400,
                              textAlign: elem.textAlign || 'center',
                              maxWidth: elem.maxWidth ? `${elem.maxWidth}px` : 'none',
                            }}
                            className={`bg-white/95 border-2 border-amber-500 rounded p-1 shadow-lg outline-none resize-none leading-tight ${getFontFamilyClass(elem.fontFamily)}`}
                          />
                        ) : (
                          <div
                            style={{
                              fontSize: `${elem.fontSize || 14}px`,
                              color: elem.color || '#1C1917',
                              fontWeight: elem.fontWeight || 400,
                              textAlign: elem.textAlign || 'center',
                              letterSpacing: elem.letterSpacing || 'normal',
                              textTransform: elem.textTransform || 'none',
                              textDecoration: elem.underline ? 'underline' : 'none',
                              textUnderlineOffset: '6px',
                              maxWidth: elem.maxWidth ? `${elem.maxWidth}px` : 'none',
                              lineHeight: elem.lineHeight || 1.3,
                            }}
                            className={`px-2 py-0.5 whitespace-pre-wrap ${getFontFamilyClass(elem.fontFamily)}`}
                          >
                            {displayText}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. UNIQUE CODE PILL ELEMENT */}
                    {elem.type === 'unique-code' && (
                      <div className="flex flex-col items-center gap-0.5 px-3.5 py-1 rounded-xl border shadow-xs bg-amber-50/95 border-amber-300">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-mono font-black text-stone-900 tracking-wider text-[11px]">
                            {previewMode ? (activeUniqueCode || elem.sampleCode) : elem.code}
                          </span>
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-amber-800">
                          Official Tamper-Proof Credential
                        </span>
                      </div>
                    )}

                    {/* 3. SEAL / MEDAL ELEMENT */}
                    {elem.type === 'seal' && (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div
                          style={{
                            width: `${elem.size || 58}px`,
                            height: `${elem.size || 58}px`,
                            borderColor: elem.color || '#D97706',
                          }}
                          className="rounded-full border-2 p-1 bg-gradient-to-br from-amber-100 via-white to-amber-200/90 shadow-md flex items-center justify-center"
                        >
                          {elem.sealType === 'gold-medal' ? (
                            <Crown style={{ width: `${(elem.size || 58) * 0.48}px`, height: `${(elem.size || 58) * 0.48}px`, color: elem.color || '#D97706' }} />
                          ) : elem.sealType === 'silver-medal' ? (
                            <Medal style={{ width: `${(elem.size || 58) * 0.48}px`, height: `${(elem.size || 58) * 0.48}px`, color: elem.color || '#64748B' }} />
                          ) : elem.sealType === 'academic-shield' ? (
                            <ShieldCheck style={{ width: `${(elem.size || 58) * 0.48}px`, height: `${(elem.size || 58) * 0.48}px`, color: elem.color || '#047857' }} />
                          ) : (
                            <Award style={{ width: `${(elem.size || 58) * 0.48}px`, height: `${(elem.size || 58) * 0.48}px`, color: elem.color || '#D97706' }} />
                          )}
                        </div>
                        {elem.label && (
                          <span
                            style={{ color: elem.color || '#D97706' }}
                            className="text-[9px] font-black uppercase tracking-wider mt-0.5 whitespace-nowrap"
                          >
                            {elem.label}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 4. SIGNATURE ELEMENT (CUSTOM UPLOADED IMAGE OR TYPED CALLIGRAPHY) */}
                    {elem.type === 'signature' && (
                      <div className="flex flex-col items-center text-center">
                        {elem.signatureMode === 'image' && elem.imageUrl ? (
                          <img
                            src={elem.imageUrl}
                            alt={elem.signerName || 'Signature'}
                            style={{
                              maxHeight: `${elem.size || 54}px`,
                              maxWidth: '180px',
                            }}
                            className="object-contain filter contrast-125 mb-1 pointer-events-none select-none"
                          />
                        ) : (
                          <div
                            style={{ fontSize: `${elem.fontSize || 26}px`, color: elem.color || '#1C1917' }}
                            className={`leading-none pb-1 ${getFontFamilyClass(elem.fontFamily || 'signature')}`}
                          >
                            {elem.signerName || 'Official Signature'}
                          </div>
                        )}
                        <div
                          style={{ borderColor: elem.color || '#94A3B8' }}
                          className="w-44 border-b my-0.5"
                        />
                        <div
                          style={{ color: elem.color || '#475569' }}
                          className="text-[10px] font-bold text-stone-600 uppercase tracking-wider mt-0.5"
                        >
                          {elem.signerTitle || 'Authorized Official'}
                        </div>
                      </div>
                    )}

                    {/* ── 8 SELECTION & RESIZE HANDLES ── */}
                    {isSelected && (
                      <>
                        {/* 4 Corners */}
                        <div
                          onPointerDown={(e) => handleStartResize(e, 'nw', elem)}
                          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-amber-600 rounded-full cursor-nwse-resize z-40 shadow-xs"
                        />
                        <div
                          onPointerDown={(e) => handleStartResize(e, 'ne', elem)}
                          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-amber-600 rounded-full cursor-nesw-resize z-40 shadow-xs"
                        />
                        <div
                          onPointerDown={(e) => handleStartResize(e, 'se', elem)}
                          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-amber-600 rounded-full cursor-nwse-resize z-40 shadow-xs"
                        />
                        <div
                          onPointerDown={(e) => handleStartResize(e, 'sw', elem)}
                          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-amber-600 rounded-full cursor-nesw-resize z-40 shadow-xs"
                        />

                        {/* 4 Edges */}
                        <div
                          onPointerDown={(e) => handleStartResize(e, 'e', elem)}
                          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-3 bg-white border-2 border-amber-600 rounded-xs cursor-ew-resize z-40"
                        />
                        <div
                          onPointerDown={(e) => handleStartResize(e, 'w', elem)}
                          className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-3 bg-white border-2 border-amber-600 rounded-xs cursor-ew-resize z-40"
                        />

                        {/* ── CONTEXTUAL FLOATING QUICK-BAR (CANVA-STYLE DIRECT ON CANVAS) ── */}
                        <div
                          className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-md text-stone-900 px-2 py-1 rounded-xl text-[10px] font-bold shadow-xl border border-stone-200 pointer-events-auto z-50 whitespace-nowrap"
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <span className="text-amber-700 capitalize font-extrabold mr-1">{elem.type}</span>

                          {/* TEXT QUICK TOOLS */}
                          {elem.type === 'text' && (
                            <>
                              {/* Pencil / Pen Edit Text button */}
                              <button
                                type="button"
                                onClick={() => setIsInlineEditing(elem.id)}
                                className="p-1 rounded hover:bg-stone-100 text-stone-700 hover:text-amber-700"
                                title="Edit Text Directly"
                              >
                                <PenTool className="w-3 h-3" />
                              </button>

                              {/* Multi-category Font Family Menu */}
                              <FontFamilySelector
                                value={elem.fontFamily || 'cinzel'}
                                onChange={(fontId) => updateSelected('fontFamily', fontId)}
                              />

                              {/* Font Size controls */}
                              <div className="flex items-center gap-0.5 border-l border-stone-200 pl-1">
                                <button
                                  type="button"
                                  onClick={() => updateSelected('fontSize', Math.max(9, (elem.fontSize || 14) - 2))}
                                  className="px-1 hover:text-amber-600 font-mono"
                                  title="Decrease Font Size"
                                >
                                  -
                                </button>
                                <span className="font-mono text-[9px] text-stone-600">{elem.fontSize || 14}px</span>
                                <button
                                  type="button"
                                  onClick={() => updateSelected('fontSize', Math.min(84, (elem.fontSize || 14) + 2))}
                                  className="px-1 hover:text-amber-600 font-mono"
                                  title="Increase Font Size"
                                >
                                  +
                                </button>
                              </div>

                              {/* Bold / Underline */}
                              <button
                                type="button"
                                onClick={() => updateSelected('fontWeight', elem.fontWeight === 'bold' ? 'normal' : 'bold')}
                                className={`p-1 rounded ${elem.fontWeight === 'bold' ? 'bg-amber-100 text-amber-900' : 'text-stone-600'}`}
                                title="Bold"
                              >
                                <Bold className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSelected('underline', !elem.underline)}
                                className={`p-1 rounded ${elem.underline ? 'bg-amber-100 text-amber-900' : 'text-stone-600'}`}
                                title="Underline"
                              >
                                <Underline className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}

                          {/* MS Paint Style Color Picker Popover Button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveColorPickerPopover(!activeColorPickerPopover)}
                              className="p-1 rounded hover:bg-stone-100 flex items-center gap-1 border border-stone-200 ml-0.5"
                              title="Change Color (Paint Spectrum Box)"
                            >
                              <div
                                className="w-3 h-3 rounded-full border border-stone-400"
                                style={{ backgroundColor: elem.color || '#1C1917' }}
                              />
                              <Palette className="w-2.5 h-2.5 text-stone-600" />
                            </button>

                            {activeColorPickerPopover && (
                              <div
                                className="absolute left-0 top-full mt-2 w-64 z-50 animate-in fade-in zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <PaintColorPicker
                                  label="Component Color"
                                  color={elem.color || '#1C1917'}
                                  onChange={(c) => updateSelected('color', c)}
                                />
                              </div>
                            )}
                          </div>

                          {/* Center horizontally */}
                          <button
                            type="button"
                            onClick={centerSelectedX}
                            title="Center horizontally"
                            className="p-1 hover:text-amber-600 text-stone-600"
                          >
                            <AlignCenter className="w-3 h-3" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={duplicateSelected}
                            title="Duplicate"
                            className="p-1 hover:text-amber-600 text-stone-600"
                          >
                            <Copy className="w-3 h-3" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={deleteSelected}
                            title="Delete"
                            className="p-1 hover:text-rose-600 text-stone-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}

                  </div>
                );
              })}

            </div>
          </div>
        </main>

      </div>

      {/* ── 3. DIRECT ISSUANCE & CONFIRMATION MODAL ── */}
      <Modal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        title={isEditing ? 'Confirm Certificate Update' : 'Ready to Issue Certificate'}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{competitionTitle || 'Official Certificate of Achievement'}</span>
            </div>
            <div className="text-xs text-amber-800">
              Conferred upon <strong className="text-stone-900">{recipientName}</strong> ({recipientEmail})
            </div>
            <div className="font-mono text-xs text-stone-600">
              Serial ID: <strong>{activeUniqueCode}</strong>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIssueModalOpen(false)}
              disabled={issueLoading}
            >
              Back to Studio
            </Button>
            <Button
              variant="primary"
              icon={Award}
              loading={issueLoading}
              onClick={handleIssueCertificate}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold"
            >
              {isEditing ? 'Save Changes' : 'Confirm & Issue'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

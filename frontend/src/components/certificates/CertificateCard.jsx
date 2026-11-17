import React, { useState } from 'react';
import { Award, Copy, Check, Eye, Edit2, Trash2, CheckCircle2, Clock } from 'lucide-react';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import CertificateTemplate from './CertificateTemplate';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function CertificateCard({
  certificate,
  onEdit,
  onDelete,
  canManage = true,
  className = '',
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  if (!certificate) return null;

  const {
    id,
    title,
    recipientName,
    uniqueCode,
    issuedAt,
    institutionName,
    institution,
    verified = true,
  } = certificate;

  const displayInstName = institutionName || institution?.name || 'Institution';

  const handleCopyCode = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(uniqueCode);
      setCopied(true);
      showToast('Certificate code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy code', 'error');
    }
  };

  return (
    <>
      <div
        className={`bg-white border border-stone-200/90 rounded-2xl shadow-xs hover:shadow-md hover:border-amber-400/80 transition-all p-5 flex flex-col justify-between ${className}`}
      >
        <div className="space-y-3.5">
          {/* Header / status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-5 h-5 text-amber-700" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-black text-stone-900 truncate leading-tight">
                  {title}
                </h4>
                <p className="text-xs font-bold text-stone-600 truncate mt-0.5">{displayInstName}</p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                verified
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/80'
              }`}
            >
              {verified ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
              {verified ? 'Verified' : 'Pending'}
            </span>
          </div>

          {/* Recipient info: High contrast, pure light theme */}
          <div className="bg-stone-50 border border-stone-200/90 p-3.5 rounded-xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-500">Recipient</div>
            <div className="text-sm font-black text-stone-900">
              {recipientName}
            </div>
            {certificate.recipientEmail && (
              <div className="text-xs font-semibold text-stone-600">{certificate.recipientEmail}</div>
            )}
          </div>

          {/* Unique code (copyable): High visibility light badge */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-stone-200/90 bg-stone-100/70 text-xs">
            <code className="font-mono font-bold text-stone-900 truncate mr-2 select-all text-xs">
              {uniqueCode}
            </code>
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copy Certificate Code"
              className="text-stone-600 hover:text-stone-900 p-1.5 rounded-lg hover:bg-stone-200/70 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Footer & actions */}
        <div className="mt-4 pt-3.5 border-t border-stone-200/80 flex items-center justify-between text-xs font-bold text-stone-700">
          <span className="font-semibold text-stone-600">{formatDate(issuedAt)}</span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewModalOpen(true)}
              title="Preview Certificate"
              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>

            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit?.(certificate)}
                  title="Edit Certificate"
                  className="p-1.5 rounded-lg text-stone-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(id)}
                  title="Delete Certificate"
                  className="p-1.5 rounded-lg text-stone-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal for full visual preview */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Certificate Preview"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        <CertificateTemplate certificate={certificate} />
      </Modal>
    </>
  );
}

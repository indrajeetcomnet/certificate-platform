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
      <Card
        className={`p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between ${className}`}
      >
        <div className="space-y-3">
          {/* Header / status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{displayInstName}</p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                verified
                  ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300'
              }`}
            >
              {verified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {verified ? 'Verified' : 'Pending'}
            </span>
          </div>

          {/* Recipient info */}
          <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg space-y-1">
            <div className="text-xs text-gray-500">Recipient</div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {recipientName}
            </div>
            {certificate.recipientEmail && (
              <div className="text-xs text-gray-400">{certificate.recipientEmail}</div>
            )}
          </div>

          {/* Unique code (copyable) */}
          <div className="flex items-center justify-between p-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs">
            <code className="font-mono text-gray-700 dark:text-gray-300 truncate mr-2">
              {uniqueCode}
            </code>
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copy Certificate Code"
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Footer & actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <span>{formatDate(issuedAt)}</span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewModalOpen(true)}
              title="Preview Certificate"
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>

            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit?.(certificate)}
                  title="Edit Certificate"
                  className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(id)}
                  title="Delete Certificate"
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

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

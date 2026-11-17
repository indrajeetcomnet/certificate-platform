import React, { useState, useMemo } from 'react';
import { Award, Search, LayoutGrid, List, CheckCircle2, Clock, Trash2, Edit2, Eye } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SearchBar from '../ui/SearchBar';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import CertificateCard from './CertificateCard';
import Modal from '../ui/Modal';
import CertificateTemplate from './CertificateTemplate';
import { formatDate } from '../../utils/formatters';

export default function CertificateList({
  certificates = [],
  loading = false,
  onEdit,
  onDelete,
  className = '',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const [previewCert, setPreviewCert] = useState(null);
  const pageSize = 6;

  // Filtered by recipient name, email, or unique code
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return certificates;
    const q = searchQuery.toLowerCase();
    return certificates.filter((c) => {
      const name = (c.recipientName || '').toLowerCase();
      const email = (c.recipientEmail || '').toLowerCase();
      const code = (c.uniqueCode || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      return name.includes(q) || email.includes(q) || code.includes(q) || title.includes(q);
    });
  }, [certificates, searchQuery]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls: Search + View toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <SearchBar
            placeholder="Filter by recipient, code, or title..."
            onSearch={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-gray-500 font-medium">
            {filtered.length} {filtered.length === 1 ? 'Certificate' : 'Certificates'}
          </span>
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-xs'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-xs'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {paginatedItems.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Certificates Found"
          description={
            searchQuery
              ? `No certificates match "${searchQuery}".`
              : 'No certificates have been issued yet.'
          }
          className="py-12"
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItems.map((cert) => (
            <CertificateCard
              key={cert.id || cert.uniqueCode}
              certificate={cert}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0 border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Issued</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedItems.map((cert) => (
                  <tr key={cert.id || cert.uniqueCode} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 max-w-[160px] truncate">
                      {cert.title}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{cert.recipientName}</div>
                      <div className="text-[11px] text-gray-400">{cert.recipientEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">
                      {cert.uniqueCode}
                    </td>
                    <td className="py-3 px-4">{formatDate(cert.issuedAt)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewCert(cert)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit?.(cert)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(cert.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Modal for preview from table */}
      {previewCert && (
        <Modal
          isOpen={Boolean(previewCert)}
          onClose={() => setPreviewCert(null)}
          title="Certificate Details"
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setPreviewCert(null)}>
              Close
            </Button>
          }
        >
          <CertificateTemplate certificate={previewCert} />
        </Modal>
      )}
    </div>
  );
}

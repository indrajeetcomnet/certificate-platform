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
          <span className="text-xs text-stone-600 font-bold">
            {filtered.length} {filtered.length === 1 ? 'Certificate' : 'Certificates'}
          </span>
          <div className="inline-flex rounded-xl border border-stone-200 p-0.5 bg-stone-100">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
        <Card className="overflow-hidden p-0 border border-stone-200/90 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-600 font-extrabold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Issued</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {paginatedItems.map((cert) => (
                  <tr key={cert.id || cert.uniqueCode} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-black text-stone-900 max-w-[160px] truncate">
                      {cert.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{cert.recipientName}</div>
                      <div className="text-[11px] font-medium text-stone-600">{cert.recipientEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                      <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                        {cert.uniqueCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-semibold">{formatDate(cert.issuedAt)}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewCert(cert)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit?.(cert)}
                          className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(cert.id)}
                          className="p-1.5 text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
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

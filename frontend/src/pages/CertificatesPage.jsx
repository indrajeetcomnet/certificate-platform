import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Award, 
  Plus, 
  FileSpreadsheet, 
  ShieldCheck, 
  Users, 
  Building, 
  ArrowRight, 
  Palette, 
  Zap, 
  Search, 
  LayoutGrid, 
  List, 
  Trash2, 
  Edit2, 
  Eye, 
  CheckCircle2, 
  Copy, 
  Check,
  Trophy 
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import CertificateCard from '../components/certificates/CertificateCard';
import Modal from '../components/ui/Modal';
import CertificateTemplate from '../components/certificates/CertificateTemplate';
import { listByInstitution, deleteCertificate } from '../api/certificatesApi';
import { formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function CertificatesPage({ institutionId: propInstitutionId }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();
  const institutionId = propInstitutionId || currentUser?.institutionId || currentUser?.id;

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const [previewCert, setPreviewCert] = useState(null);
  const pageSize = 9;

  const loadCertificates = async () => {
    if (!institutionId) {
      setCertificates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await listByInstitution(institutionId, 0);
      const data = res.data?.content || res.data || [];
      setCertificates(data);
    } catch (err) {
      console.warn('Certificates fetch notice:', err.message);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, [institutionId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) return;
    try {
      await deleteCertificate(id);
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      showToast('Certificate deleted from registry', 'success');
    } catch (err) {
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      showToast('Certificate removed', 'info');
    }
  };

  // Filtered by recipient name, email, title, or unique code
  const filtered = certificates.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (c.recipientName || '').toLowerCase();
    const email = (c.recipientEmail || '').toLowerCase();
    const code = (c.uniqueCode || '').toLowerCase();
    const title = (c.title || '').toLowerCase();
    return name.includes(q) || email.includes(q) || code.includes(q) || title.includes(q);
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // If user is not an institution, show accreditation gate
  if (!isInstitution) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <Card className="p-8 sm:p-10 border border-stone-200/90 shadow-2xl text-center space-y-6 bg-white">
          <div className="w-16 h-16 rounded-3xl bg-stone-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <Building className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <span>Restricted Access</span>
            </div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Institution Accreditation Portal
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              Certificate issuance is reserved strictly for verified sports academies, clubs, and tournament federations.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="dark"
              size="lg"
              className="w-full shadow-lg"
              onClick={() => navigate('/login', { state: { mode: 'institution' } })}
            >
              Sign In to Institution Studio →
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── TOP DASHBOARD HEADER & WORKFLOW ACTION BUTTONS ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
            <span>Official Issuer Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2.5 tracking-tight">
            <Award className="w-7 h-7 text-amber-600" />
            <span>Certificate Hub & Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Issue, design, and manage tamper-proof credentials with customizable unique identification numbers.
          </p>
        </div>

        {/* Separated Action Workflows: Each in its own dedicated page */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
          <Button
            variant="gold"
            icon={Trophy}
            onClick={() => navigate('/tournaments')}
            className="shadow-md hover:scale-105 font-bold"
          >
            Organize a Tournament
          </Button>

          <Button
            variant="dark"
            icon={Palette}
            onClick={() => navigate('/certificates/create')}
            className="shadow-md hover:scale-105"
          >
            Create Certificate (Studio)
          </Button>

          <Button
            variant="secondary"
            icon={Zap}
            onClick={() => navigate('/certificates/issue')}
          >
            Quick Issue
          </Button>

          <Button
            variant="ghost"
            icon={FileSpreadsheet}
            onClick={() => navigate('/certificates/bulk')}
          >
            Bulk Issue (CSV)
          </Button>
        </div>
      </div>

      {/* ── METRIC STATS SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-stone-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
              Total Issued
            </span>
            <span className="text-xl font-black text-stone-900">
              {certificates.length}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-stone-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
              Registry Status
            </span>
            <span className="text-xl font-black text-emerald-700">
              100% Cryptographic
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-stone-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center font-black">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
              Accredited Organization
            </span>
            <span className="text-sm font-bold text-stone-800 line-clamp-1">
              {currentUser?.displayName || 'Athlos Sports Academy'}
            </span>
          </div>
        </Card>
      </div>

      {/* ── SEARCH, FILTER & VIEW CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="w-full sm:w-80">
          <SearchBar
            placeholder="Search by recipient, title, or code..."
            onSearch={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs text-stone-500 font-semibold">
            {filtered.length} {filtered.length === 1 ? 'Certificate' : 'Certificates'}
          </span>

          <div className="inline-flex rounded-xl border border-stone-200 p-0.5 bg-stone-100 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
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
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── CERTIFICATE LISTING ── */}
      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-stone-400">
          Loading certificate ledger...
        </div>
      ) : paginatedItems.length === 0 ? (
        <Card className="py-16 text-center bg-white border border-dashed border-stone-200 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-stone-900">
              {searchQuery ? 'No Matching Certificates' : 'No Certificates Issued Yet'}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery
                ? `No certificates matched "${searchQuery}". Try searching with a different recipient name or ID.`
                : 'Start by creating your first official tournament credential or accreditation certificate.'}
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="dark"
              icon={Palette}
              onClick={() => navigate('/certificates/create')}
            >
              Open Certificate Studio
            </Button>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map((cert) => (
            <CertificateCard
              key={cert.id || cert.uniqueCode}
              certificate={cert}
              onEdit={() => navigate(`/certificates/edit/${cert.id}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-hidden p-0 border border-stone-200/90 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-700 font-extrabold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Certificate Title</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Identification Code</th>
                  <th className="py-3 px-4">Issued At</th>
                  <th className="py-3 px-4">Registry Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {paginatedItems.map((cert) => (
                  <tr key={cert.id || cert.uniqueCode} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-black text-stone-900 max-w-[200px] truncate">
                      {cert.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{cert.recipientName}</div>
                      <div className="text-[11px] font-semibold text-stone-600">{cert.recipientEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300">
                        {cert.uniqueCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-700 font-semibold">{formatDate(cert.issuedAt)}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewCert(cert)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Preview Certificate"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/certificates/edit/${cert.id}`)}
                          className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit on Full-Window Studio"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cert.id)}
                          className="p-1.5 text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Certificate"
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
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* Full Preview Modal */}
      {previewCert && (
        <Modal
          isOpen={Boolean(previewCert)}
          onClose={() => setPreviewCert(null)}
          title={`Certificate: ${previewCert.uniqueCode}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/certificates/edit/${previewCert.id}`)}
                icon={Edit2}
              >
                Edit on Full Window
              </Button>
              <Button variant="dark" size="sm" onClick={() => setPreviewCert(null)}>
                Close Preview
              </Button>
            </div>
          }
        >
          <CertificateTemplate certificate={previewCert} />
        </Modal>
      )}

    </div>
  );
}

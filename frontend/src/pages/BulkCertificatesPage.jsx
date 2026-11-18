import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Award, 
  Building2, 
  Layers, 
  Hash, 
  Zap 
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { bulkCreate } from '../api/certificatesApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function BulkCertificatesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();
  const institutionId = currentUser?.institutionId || currentUser?.id;

  const [batchTitle, setBatchTitle] = useState('Game City Tournament Certificate 2026');
  const [batchDescription, setBatchDescription] = useState('Official award conferred for tournament participation and excellence.');
  const [idPrefix, setIdPrefix] = useState('ATHLOS-2026');
  
  const [recipients, setRecipients] = useState([
    { recipientName: 'Indrajeet Sharma', recipientEmail: 'indrajeet@example.com' },
    { recipientName: 'Marcus Vance', recipientEmail: 'marcus@example.com' },
    { recipientName: 'Sarah Chen', recipientEmail: 'sarah@example.com' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [issuedResults, setIssuedResults] = useState(null);

  const handleAddRow = () => {
    setRecipients((prev) => [...prev, { recipientName: '', recipientEmail: '' }]);
  };

  const handleRemoveRow = (index) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setRecipients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // CSV Template download
  const handleDownloadSampleCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,recipientName,recipientEmail\nIndrajeet Sharma,indrajeet@example.com\nMarcus Vance,marcus@example.com\nSarah Chen,sarah@example.com';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'certificates_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded sample CSV template', 'info');
  };

  // Parse uploaded CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const parsed = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts[0]) {
          parsed.push({
            recipientName: parts[0] || '',
            recipientEmail: parts[1] || '',
          });
        }
      }

      if (parsed.length > 0) {
        setRecipients(parsed);
        showToast(`Imported ${parsed.length} recipients from CSV!`, 'success');
      } else {
        showToast('No valid recipient rows found in CSV', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmitBatch = async (e) => {
    e.preventDefault();
    const validRows = recipients.filter((r) => r.recipientName.trim().length > 0);
    if (validRows.length === 0) {
      showToast('Please add at least one recipient with a name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const cleanPrefix = (idPrefix || 'CERT').trim().toUpperCase();
      const certificatesPayload = validRows.map((r, index) => {
        const seqNumber = String(index + 1).padStart(4, '0');
        const customCode = `${cleanPrefix}-${seqNumber}`;
        return {
          title: batchTitle.trim(),
          recipientName: r.recipientName.trim(),
          recipientEmail: r.recipientEmail.trim() || null,
          description: batchDescription.trim() || null,
          institutionId: institutionId,
          uniqueCode: customCode,
          templateData: JSON.stringify({ template: 'modern', uniqueCode: customCode }),
        };
      });

      const res = await bulkCreate(certificatesPayload);
      const list = res.data || [];
      setIssuedResults(list);
      showToast(`Batch of ${list.length} certificates generated successfully!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Bulk issuance failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isInstitution) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <Card className="p-8 sm:p-10 border border-stone-200/90 shadow-2xl text-center space-y-6 bg-white">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center mx-auto shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-stone-900">
              Institution Accreditation Required
            </h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              Bulk certificate generation is reserved strictly for official institutions.
            </p>
          </div>
          <Button
            variant="dark"
            size="lg"
            className="w-full"
            onClick={() => navigate('/login', { state: { mode: 'institution' } })}
          >
            Sign In to Institution Gateway
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 p-4 sm:p-6 lg:p-8 bg-[#F5F5F0] min-h-[calc(100vh-4rem)]">
      
      {/* ── TOP HEADER ── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/certificates')}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="Return to Certificates Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 border border-amber-500/20">
                Bulk Workflow
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-stone-500 font-medium">Batch Issuance & Series IDs</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2 mt-0.5">
              <FileSpreadsheet className="w-6 h-6 text-amber-600" />
              <span>Bulk Certificate Issuance</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          <Button
            variant="secondary"
            onClick={handleDownloadSampleCsv}
            icon={Download}
          >
            Download CSV Template
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/certificates')}
          >
            All Certificates
          </Button>
        </div>
      </div>

      {/* ── SUCCESS STATE OVERLAY ── */}
      {issuedResults ? (
        <Card className="max-w-4xl mx-auto p-8 space-y-6 bg-white border border-stone-200 shadow-xl">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-stone-900">
              {issuedResults.length} Certificates Issued Successfully!
            </h3>
            <p className="text-sm text-stone-500">
              All credentials are cryptographically recorded in the verification registry.
            </p>
          </div>

          {/* Results table */}
          <div className="max-h-80 overflow-y-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Recipient</th>
                  <th className="py-2.5 px-4">Assigned Serial Code</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {issuedResults.map((c, i) => (
                  <tr key={c.id || i} className="hover:bg-stone-50/50">
                    <td className="py-2.5 px-4 font-mono text-stone-400">{i + 1}</td>
                    <td className="py-2.5 px-4 font-bold text-stone-900">{c.recipientName}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-amber-700">{c.uniqueCode}</td>
                    <td className="py-2.5 px-4 text-emerald-600 font-semibold">✓ Verified</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="dark"
              onClick={() => navigate('/certificates')}
            >
              Go to Certificate Ledger
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIssuedResults(null)}
            >
              Issue Another Batch
            </Button>
          </div>
        </Card>
      ) : (
        /* ── BATCH FORM & RECIPIENT TABLE ── */
        <form onSubmit={handleSubmitBatch} className="space-y-6">
          
          {/* Section 1: Batch Details & Serial Number Customizer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="p-5 space-y-3 bg-white">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                Batch Metadata
              </span>
              <Input
                label="Certificate Title"
                value={batchTitle}
                onChange={(e) => setBatchTitle(e.target.value)}
                placeholder="e.g. Invitational Participant Award"
                required
              />
              <Input
                label="Description"
                value={batchDescription}
                onChange={(e) => setBatchDescription(e.target.value)}
                placeholder="e.g. Official Tournament Credential"
              />
            </Card>

            <Card className="p-5 space-y-3 bg-white">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                Identification Number Series
              </span>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Series Code Prefix
                </label>
                <input
                  type="text"
                  value={idPrefix}
                  onChange={(e) => setIdPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="e.g. ATHLOS-2026, GC-SERIES"
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Codes will be sequenced as: <br />
                <code className="font-mono font-bold text-amber-700">
                  {idPrefix || 'CERT'}-0001, {idPrefix || 'CERT'}-0002...
                </code>
              </p>
            </Card>

            <Card className="p-5 space-y-3 bg-white flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                  CSV Import
                </span>
                <p className="text-xs text-stone-500 mt-1">
                  Upload a spreadsheet of recipients with columns <code>recipientName,recipientEmail</code>.
                </p>
              </div>

              <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/50 cursor-pointer transition-colors text-xs font-bold text-stone-700">
                <Upload className="w-4 h-4 text-stone-500" />
                <span>Upload CSV File</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </Card>
          </div>

          {/* Section 2: Recipient Rows */}
          <Card className="p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900">
                  Recipients List ({recipients.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Add, edit, or remove recipients for this issuance batch
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={Plus}
                onClick={handleAddRow}
              >
                Add Recipient Row
              </Button>
            </div>

            <div className="space-y-3">
              {recipients.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-3 items-center p-2 rounded-xl bg-stone-50/60 border border-stone-200/80"
                >
                  <div className="col-span-1 text-center font-mono text-xs font-bold text-stone-400">
                    #{idx + 1}
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={row.recipientName}
                      onChange={(e) => handleRowChange(idx, 'recipientName', e.target.value)}
                      placeholder="Recipient Full Name"
                      required
                      className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="email"
                      value={row.recipientEmail}
                      onChange={(e) => handleRowChange(idx, 'recipientEmail', e.target.value)}
                      placeholder="recipient@example.com (Optional)"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={recipients.length <= 1}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors disabled:opacity-30"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">
                Ready to issue {recipients.filter((r) => r.recipientName.trim()).length} verified certificates
              </span>

              <Button
                type="submit"
                variant="dark"
                size="lg"
                loading={submitting}
                icon={CheckCircle2}
                className="shadow-lg"
              >
                Issue Batch Now
              </Button>
            </div>
          </Card>

        </form>
      )}

    </div>
  );
}

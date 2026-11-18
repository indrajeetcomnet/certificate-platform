import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Award, 
  ArrowLeft, 
  Zap, 
  UserCheck, 
  Building2, 
  CheckCircle2, 
  Eye, 
  Palette, 
  Copy, 
  Check 
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import CertificateIdCustomizer from '../components/certificates/CertificateIdCustomizer';
import CertificateTemplate from '../components/certificates/CertificateTemplate';
import { create } from '../api/certificatesApi';
import { getAll as getAllBadges } from '../api/badgesApi';
import { getAllUsers } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CertificateIssuePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();
  const institutionId = currentUser?.institutionId || currentUser?.id;

  const [athletes, setAthletes] = useState([]);
  const [badges, setBadges] = useState([]);
  const [awardBadgeId, setAwardBadgeId] = useState('');
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issuedResult, setIssuedResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [formData, setFormData] = useState({
    title: 'Certificate of Excellence',
    recipientName: '',
    recipientEmail: '',
    description: 'In recognition of outstanding performance, sportsmanship, and competitive athletic achievement.',
    template: 'modern',
    expiresAt: '',
    uniqueCode: '',
  });

  useEffect(() => {
    setLoadingAthletes(true);
    getAllUsers()
      .then((res) => {
        const users = (res.data || []).filter((u) => u.role === 'USER' || !u.role);
        setAthletes(users);
      })
      .catch(() => setAthletes([]))
      .finally(() => setLoadingAthletes(false));

    getAllBadges()
      .then((res) => setBadges(res.data || []))
      .catch(() => setBadges([]));
  }, []);

  const handleSelectAthlete = (e) => {
    const val = e.target.value;
    if (!val) {
      setFormData((prev) => ({ ...prev, recipientName: '', recipientEmail: '' }));
      return;
    }
    const found = (athletes || []).find((u) => u && String(u.id) === val);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        recipientName: found.displayName || found.username || '',
        recipientEmail: found.email || `${found.username}@arena.platform`,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.recipientName.trim()) {
      showToast('Title and recipient name are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        recipientName: formData.recipientName.trim(),
        recipientEmail: formData.recipientEmail.trim() || null,
        description: formData.description.trim() || null,
        institutionId: institutionId,
        awardBadgeId: awardBadgeId ? Number(awardBadgeId) : null,
        uniqueCode: formData.uniqueCode.trim() || null,
        templateData: JSON.stringify({ template: formData.template }),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      const res = await create(payload);
      setIssuedResult(res.data);
      showToast('Official Certificate issued successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to issue certificate', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (issuedResult?.uniqueCode) {
      navigator.clipboard.writeText(issuedResult.uniqueCode);
      setCopiedCode(true);
      showToast('Code copied to clipboard', 'info');
      setTimeout(() => setCopiedCode(false), 2000);
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
              Issuing certificates is reserved strictly for official institutions.
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
                Single Issue
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-stone-500 font-medium">Fast Credential Generation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2 mt-0.5">
              <Zap className="w-6 h-6 text-amber-600" />
              <span>Issue Single Certificate</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          <Button
            variant="secondary"
            onClick={() => navigate('/certificates/create')}
            icon={Palette}
          >
            Open Board Designer
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
      {issuedResult ? (
        <Card className="max-w-2xl mx-auto p-8 text-center space-y-6 bg-white border border-stone-200 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-stone-900">
              Certificate Successfully Issued!
            </h3>
            <p className="text-sm text-stone-500">
              Official verified credential issued to{' '}
              <strong className="text-stone-900 font-bold">{issuedResult.recipientName}</strong>
            </p>
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl border border-dashed border-stone-300 max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Verification Code
              </span>
              <span className="font-mono text-base font-black text-stone-900">
                {issuedResult.uniqueCode}
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyCode}
              icon={copiedCode ? Check : Copy}
            >
              {copiedCode ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="dark"
              onClick={() => navigate(`/certificates/verify/${issuedResult.uniqueCode}`)}
              icon={Eye}
            >
              View Public Verification Page
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIssuedResult(null);
                setFormData((prev) => ({ ...prev, recipientName: '', recipientEmail: '' }));
              }}
            >
              Issue Another Certificate
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/certificates')}
            >
              Back to Overview
            </Button>
          </div>
        </Card>
      ) : (
        /* ── TWO-COLUMN FORM & LIVE PREVIEW ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Input Form + Identification Number Customizer */}
          <div className="lg:col-span-6 space-y-4">
            
            <Card className="p-6 space-y-4 bg-white border border-stone-200/90 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3 flex items-center justify-between">
                <span>Credential Specifications</span>
                <span className="text-[11px] font-normal text-stone-400">Step 1 of 2</span>
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Athlete Dropdown Quick-Select */}
                {athletes.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Quick Select Registered Athlete (Optional)
                    </label>
                    <select
                      onChange={handleSelectAthlete}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      <option value="">-- Choose an athlete from directory or type custom --</option>
                      {(athletes || []).filter(Boolean).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.displayName || u.username || 'User'} (@{u.username || 'user'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Input
                  label="Certificate Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. National Athletics Champion 2026"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Recipient Full Name"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="e.g. Indrajeet Patil"
                    required
                  />

                  <Input
                    label="Recipient Email"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    placeholder="athlete@example.com"
                  />
                </div>

                <TextArea
                  label="Recognition / Achievement Citation"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="In recognition of outstanding performance..."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Visual Palette
                    </label>
                    <select
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      <option value="modern">Modern Electric</option>
                      <option value="classic">Classic Amber</option>
                      <option value="gold">Imperial Gold</option>
                    </select>
                  </div>

                  <Input
                    label="Expiration Date (Optional)"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>

                {/* Optional Honor Badge Award */}
                {badges.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Award Verified Badge with Certificate (Optional)
                    </label>
                    <select
                      value={awardBadgeId}
                      onChange={(e) => setAwardBadgeId(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      <option value="">-- No Badge (Certificate Only) --</option>
                      {badges.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (Rank #{b.rank} - {b.category || 'General'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-stone-400 mt-1">
                      If awarded, recipient automatically receives this verified badge on their profile and feed rotator.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="dark"
                    loading={submitting}
                    icon={CheckCircle2}
                    className="w-full shadow-lg"
                  >
                    Confirm & Issue Official Certificate
                  </Button>
                </div>
              </form>
            </Card>

            {/* Unique Identification Number Customizer */}
            <CertificateIdCustomizer
              value={formData.uniqueCode}
              onChange={(newCode) => setFormData((prev) => ({ ...prev, uniqueCode: newCode }))}
            />

          </div>

          {/* Right: Live Interactive Certificate Preview */}
          <div className="lg:col-span-6 space-y-3 sticky top-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-stone-500">
                Live Credential Rendering
              </span>
              <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                {formData.uniqueCode || 'AUTO-ALLOCATED'}
              </span>
            </div>

            <Card className="p-4 bg-stone-950 shadow-2xl border-stone-800">
              <CertificateTemplate
                certificate={{
                  title: formData.title || 'Certificate Title',
                  recipientName: formData.recipientName || 'Athlete Name',
                  recipientEmail: formData.recipientEmail || 'athlete@example.com',
                  description: formData.description || 'Achievement citation statement...',
                  uniqueCode: formData.uniqueCode || 'CERT-PREVIEW-2026',
                  issuedAt: new Date().toISOString(),
                  institutionName: currentUser?.displayName || 'Athlos Sports Academy',
                  verified: true,
                }}
              />
            </Card>
          </div>

        </div>
      )}

    </div>
  );
}

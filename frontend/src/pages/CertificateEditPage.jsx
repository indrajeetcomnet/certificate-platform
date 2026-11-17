import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Award, 
  ArrowLeft, 
  Save, 
  ShieldCheck, 
  Eye, 
  Building2, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import CertificateBoardDesigner from '../components/certificates/CertificateBoardDesigner';
import CertificateIdCustomizer from '../components/certificates/CertificateIdCustomizer';
import CertificateTemplate from '../components/certificates/CertificateTemplate';
import { getById, update } from '../api/certificatesApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CertificateEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();
  const institutionId = currentUser?.institutionId || currentUser?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [certificate, setCertificate] = useState(null);

  // Editable Form fields
  const [formData, setFormData] = useState({
    title: '',
    recipientName: '',
    recipientEmail: '',
    description: '',
    uniqueCode: '',
    template: 'modern',
    expiresAt: '',
  });

  const [editMode, setEditMode] = useState('canvas'); // 'canvas' | 'form'

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getById(id)
      .then((res) => {
        const cert = res.data;
        setCertificate(cert);
        setFormData({
          title: cert.title || '',
          recipientName: cert.recipientName || '',
          recipientEmail: cert.recipientEmail || '',
          description: cert.description || '',
          uniqueCode: cert.uniqueCode || '',
          template: cert.templateData ? (JSON.parse(cert.templateData)?.template || 'modern') : 'modern',
          expiresAt: cert.expiresAt ? cert.expiresAt.substring(0, 10) : '',
        });
      })
      .catch((err) => {
        showToast(err.response?.data?.message || 'Certificate not found', 'error');
        navigate('/certificates');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveForm = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.title.trim() || !formData.recipientName.trim()) {
      showToast('Title and recipient name are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        recipientName: formData.recipientName.trim(),
        recipientEmail: formData.recipientEmail.trim() || null,
        description: formData.description.trim() || null,
        institutionId: institutionId,
        uniqueCode: formData.uniqueCode.trim() || certificate.uniqueCode,
        templateData: certificate.templateData || JSON.stringify({ template: formData.template }),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      const res = await update(id, payload);
      setCertificate(res.data);
      showToast('Certificate updated successfully!', 'success');
      navigate('/certificates');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update certificate', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isInstitution) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <Card className="p-8 sm:p-10 border border-stone-200/90 shadow-2xl text-center space-y-6 bg-white">
          <div className="w-16 h-16 rounded-3xl bg-stone-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-stone-900">
              Institution Accreditation Required
            </h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              Editing certificates is restricted to authorized institution staff and tournament organizers.
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <LoadingSpinner size="lg" />
        <span className="text-sm font-bold text-stone-500">Loading certificate #{id}...</span>
      </div>
    );
  }

  if (editMode === 'canvas') {
    return (
      <div className="w-full h-full flex-1 flex flex-col overflow-hidden">
        <CertificateBoardDesigner
          institutionId={institutionId}
          initialCertificate={certificate}
          isEditing={true}
          onCertificateIssued={() => {
            showToast('Certificate updated successfully!', 'success');
            navigate('/certificates');
          }}
          className="w-full h-full flex-1 rounded-none border-none shadow-none"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 p-4 sm:p-6 lg:p-8 bg-[#F5F5F0] min-h-[calc(100vh-4rem)]">
      
      {/* ── TOP ACTION HEADER ── */}
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
                Full-Window Editor
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="font-mono text-xs font-bold text-stone-600">
                {formData.uniqueCode || certificate?.uniqueCode}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2 mt-0.5">
              <Award className="w-6 h-6 text-amber-600" />
              <span>Editing: {formData.title || 'Official Certificate'}</span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          <div className="inline-flex rounded-xl bg-stone-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setEditMode('canvas')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                editMode === 'canvas'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              🎨 Board Studio
            </button>
            <button
              type="button"
              onClick={() => setEditMode('form')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                editMode === 'form'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              📝 Quick Metadata
            </button>
          </div>

          <Button
            variant="secondary"
            onClick={() => navigate(`/certificates/verify/${formData.uniqueCode || certificate?.uniqueCode}`)}
            icon={Eye}
          >
            Public Verification
          </Button>

          <Button
            variant="dark"
            loading={saving}
            icon={Save}
            onClick={handleSaveForm}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* ── MODE 1: VISUAL BOARD STUDIO (FULL WINDOW) ── */}
      {editMode === 'canvas' ? (
        <div className="w-full">
          <CertificateBoardDesigner
            institutionId={institutionId}
            initialCertificate={certificate}
            isEditing={true}
            onCertificateIssued={() => {
              showToast('Certificate updated successfully!', 'success');
              navigate('/certificates');
            }}
          />
        </div>
      ) : (
        /* ── MODE 2: EXPANSIVE METADATA FORM WITH LIVE PREVIEW ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Metadata & ID Form */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-black text-stone-900 border-b border-stone-100 pb-3">
                Certificate Credentials
              </h3>

              <Input
                label="Certificate Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Certified Full Stack Champion"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Recipient Full Name"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  required
                />
                <Input
                  label="Recipient Email"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  placeholder="recipient@example.com"
                />
              </div>

              <TextArea
                label="Recognition Citation"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="In recognition of outstanding athletic excellence..."
              />

              <Input
                label="Expiration Date (Optional)"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />

              <Button
                variant="dark"
                loading={saving}
                icon={Save}
                onClick={handleSaveForm}
                className="w-full"
              >
                Save & Update Certificate
              </Button>
            </Card>

            {/* Identification Number Customizer */}
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
                {formData.uniqueCode || certificate.uniqueCode}
              </span>
            </div>

            <Card className="p-4 bg-white shadow-xl border border-stone-200">
              <CertificateTemplate
                certificate={{
                  ...certificate,
                  title: formData.title || certificate.title,
                  recipientName: formData.recipientName || certificate.recipientName,
                  recipientEmail: formData.recipientEmail || certificate.recipientEmail,
                  description: formData.description || certificate.description,
                  uniqueCode: formData.uniqueCode || certificate.uniqueCode,
                }}
              />
            </Card>
          </div>

        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { Award, CheckCircle2, Copy, Check } from 'lucide-react';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { create, update } from '../../api/certificatesApi';
import { required, email as emailValidator } from '../../utils/validators';
import { useToast } from '../../context/ToastContext';

export default function CertificateForm({
  initialData = null,
  institutionId = 1,
  onSuccess,
  onCancel,
  className = '',
}) {
  const { showToast } = useToast();
  const isEditing = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    recipientName: initialData?.recipientName || '',
    recipientEmail: initialData?.recipientEmail || '',
    template: initialData?.template || 'modern',
    expiresAt: initialData?.expiresAt ? initialData.expiresAt.substring(0, 10) : '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [createdCertificate, setCreatedCertificate] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const validate = () => {
    const errs = {};
    const titleErr = required(formData.title, 'Title');
    if (titleErr) errs.title = titleErr;

    const nameErr = required(formData.recipientName, 'Recipient name');
    if (nameErr) errs.recipientName = nameErr;

    const emailErr = required(formData.recipientEmail, 'Recipient email') || emailValidator(formData.recipientEmail);
    if (emailErr) errs.recipientEmail = emailErr;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        institutionId: institutionId,
        templateData: JSON.stringify({ template: formData.template }),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      let result;
      if (isEditing) {
        result = await update(initialData.id, payload);
        showToast('Certificate updated successfully', 'success');
        onSuccess?.(result.data);
      } else {
        result = await create(payload);
        const cert = result?.data;
        if (!cert) {
          throw new Error('Server returned empty certificate response');
        }
        setCreatedCertificate(cert);
        showToast('Certificate created successfully!', 'success');
        onSuccess?.(cert);
      }
    } catch (err) {
      console.error('Failed to save certificate', err);
      showToast(err.response?.data?.message || err.message || 'Failed to save certificate.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (createdCertificate?.uniqueCode) {
      navigator.clipboard.writeText(createdCertificate.uniqueCode);
      setCopiedCode(true);
      showToast('Code copied to clipboard', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleResetForNew = () => {
    setCreatedCertificate(null);
    setFormData({
      title: '',
      description: '',
      recipientName: '',
      recipientEmail: '',
      template: 'modern',
      expiresAt: '',
    });
  };

  // If newly created certificate exists, show success state with code
  if (createdCertificate) {
    return (
      <Card className={`p-6 text-center space-y-4 ${className}`}>
        <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Certificate Issued Successfully!
        </h3>
        <p className="text-sm text-gray-500">
          Certificate has been generated for{' '}
          <strong className="text-gray-900 dark:text-gray-200">
            {createdCertificate.recipientName}
          </strong>
        </p>

        {/* Unique Code display */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 max-w-sm mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block text-left">Unique Verification Code</span>
            <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">
              {createdCertificate.uniqueCode}
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

        <div className="flex justify-center gap-3 pt-2">
          <Button variant="secondary" onClick={handleResetForNew}>
            Issue Another
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-5 border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Certificate' : 'Issue New Certificate'}
          </h3>
          <p className="text-xs text-gray-500">
            Fill in the details to generate an official verified certificate
          </p>
        </div>
        <Award className="w-6 h-6 text-blue-600" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Certificate Title"
          name="title"
          placeholder="e.g. Certified Full Stack Developer"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Recipient Full Name"
            name="recipientName"
            placeholder="e.g. Jane Doe"
            value={formData.recipientName}
            onChange={handleChange}
            error={errors.recipientName}
            required
          />

          <Input
            label="Recipient Email"
            name="recipientEmail"
            type="email"
            placeholder="jane@example.com"
            value={formData.recipientEmail}
            onChange={handleChange}
            error={errors.recipientEmail}
            required
          />
        </div>

        <TextArea
          label="Description / Recognition Statement"
          name="description"
          placeholder="In recognition of outstanding project performance and milestone completion..."
          value={formData.description}
          onChange={handleChange}
          rows={3}
          maxLength={300}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Visual Template
            </label>
            <select
              name="template"
              value={formData.template}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="modern">Modern Blue</option>
              <option value="classic">Classic Amber</option>
              <option value="gold">Gold Honor</option>
            </select>
          </div>

          <Input
            label="Expiry Date (Optional)"
            name="expiresAt"
            type="date"
            value={formData.expiresAt}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" loading={submitting}>
            {isEditing ? 'Update Certificate' : 'Generate Certificate'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

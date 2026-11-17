import React, { useState } from 'react';
import { Plus, Trash2, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import { bulkCreate } from '../../api/certificatesApi';
import { useToast } from '../../context/ToastContext';

export default function BulkCertificateForm({
  institutionId = 1,
  onSuccess,
  onCancel,
  className = '',
}) {
  const { showToast } = useToast();

  const [sharedData, setSharedData] = useState({
    title: '',
    description: '',
    template: 'modern',
    expiresAt: '',
  });

  const [recipients, setRecipients] = useState([
    { name: '', email: '' },
    { name: '', email: '' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedList, setCompletedList] = useState(null);

  const handleSharedChange = (e) => {
    const { name, value } = e.target;
    setSharedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecipientChange = (index, field, value) => {
    setRecipients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddRow = () => {
    setRecipients((prev) => [...prev, { name: '', email: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (recipients.length <= 1) return;
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  // CSV parsing
  const handleCsvUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      const parsedRows = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip header if line contains 'name' and 'email'
        if (i === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('email')) {
          continue;
        }
        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2 && parts[0] && parts[1]) {
          parsedRows.push({ name: parts[0], email: parts[1] });
        }
      }

      if (parsedRows.length > 0) {
        setRecipients(parsedRows);
        showToast(`Imported ${parsedRows.length} recipients from file`, 'success');
      } else {
        showToast('No valid name,email rows found in file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sharedData.title.trim()) {
      showToast('Certificate title is required', 'error');
      return;
    }

    const validRecipients = recipients.filter((r) => r.name.trim() && r.email.trim());
    if (validRecipients.length === 0) {
      showToast('Please add at least one recipient with name and email', 'error');
      return;
    }

    setSubmitting(true);
    setProgress(15);

    const payload = validRecipients.map((r) => ({
      title: sharedData.title.trim(),
      description: sharedData.description.trim(),
      recipientName: r.name.trim(),
      recipientEmail: r.email.trim(),
      institutionId: institutionId,
      templateData: JSON.stringify({ template: sharedData.template }),
      expiresAt: sharedData.expiresAt ? new Date(sharedData.expiresAt).toISOString() : null,
    }));

    try {
      setProgress(50);
      const res = await bulkCreate(payload);
      setProgress(100);
      const created = res?.data;
      if (!created || !Array.isArray(created) || created.length === 0) {
        throw new Error('Server returned invalid or empty bulk certificate response');
      }

      setCompletedList(created);
      showToast(`Successfully created ${created.length} certificates!`, 'success');
      onSuccess?.(created);
    } catch (err) {
      console.error('Bulk create failed', err);
      showToast(err.response?.data?.message || err.message || 'Bulk certificate creation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedList) {
    return (
      <Card className={`p-6 text-center space-y-4 ${className}`}>
        <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Bulk Issuance Complete!
        </h3>
        <p className="text-sm text-gray-500">
          Generated {completedList.length} certificates for {sharedData.title}.
        </p>

        <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 text-left text-xs">
          {completedList.map((item, idx) => (
            <div key={idx} className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{item.recipientName}</p>
                <p className="text-gray-400">{item.recipientEmail}</p>
              </div>
              <code className="font-mono text-blue-600 dark:text-blue-400">{item.uniqueCode}</code>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={() => {
              setCompletedList(null);
              setRecipients([{ name: '', email: '' }]);
              setProgress(0);
            }}
          >
            Issue Another Batch
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          Bulk Issue Certificates
        </h3>
        <p className="text-xs text-gray-500">
          Enter shared certificate parameters and add multiple recipients manually or upload CSV
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Shared parameters */}
        <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Certificate Details
          </h4>

          <Input
            label="Certificate Title"
            name="title"
            placeholder="e.g. Hackathon 2026 Winner"
            value={sharedData.title}
            onChange={handleSharedChange}
            required
          />

          <TextArea
            label="Description Statement"
            name="description"
            placeholder="For outstanding participation and completion..."
            value={sharedData.description}
            onChange={handleSharedChange}
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Visual Template
              </label>
              <select
                name="template"
                value={sharedData.template}
                onChange={handleSharedChange}
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
              value={sharedData.expiresAt}
              onChange={handleSharedChange}
            />
          </div>
        </div>

        {/* CSV Import */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Import CSV File (Optional)
          </label>
          <FileUpload
            accept=".csv,text/csv"
            label=""
            helperText="CSV format: name, email (with or without headers)"
            onUpload={handleCsvUpload}
            preview={false}
          />
        </div>

        {/* Recipients Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Recipients ({recipients.length})
            </h4>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={handleAddRow}
            >
              Add Row
            </Button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {recipients.map((recipient, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}.</span>
                <input
                  type="text"
                  placeholder="Recipient Name"
                  value={recipient.name}
                  onChange={(e) => handleRecipientChange(idx, 'name', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={recipient.email}
                  onChange={(e) => handleRecipientChange(idx, 'email', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  disabled={recipients.length <= 1}
                  className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar during bulk creation */}
        {submitting && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Issuing certificates...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" loading={submitting}>
            Generate {recipients.filter((r) => r.name.trim()).length || ''} Certificates
          </Button>
        </div>
      </form>
    </Card>
  );
}

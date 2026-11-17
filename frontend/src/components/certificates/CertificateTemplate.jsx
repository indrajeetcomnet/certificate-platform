import React from 'react';
import { Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export default function CertificateTemplate({
  certificate,
  template = 'modern', // 'modern', 'classic', 'gold'
  className = '',
}) {
  if (!certificate) return null;

  const {
    title = 'Certificate of Achievement',
    recipientName = 'Recipient Name',
    description = 'In recognition of outstanding performance and contribution.',
    uniqueCode = 'CERT-0000-0000',
    issuedAt = new Date().toISOString(),
    institution = {},
    institutionName = institution?.name || 'Institution of Excellence',
    verified = true,
  } = certificate;

  const borderStyles = {
    modern: 'border-4 border-blue-500/40 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30',
    classic: 'border-8 border-double border-amber-600/50 bg-gradient-to-br from-amber-50/30 via-white to-amber-50/20',
    gold: 'border-4 border-amber-400 bg-radial from-amber-100/30 via-white to-amber-50/30',
  }[template] || 'border-4 border-blue-500/40 bg-white';

  return (
    <div
      className={`relative p-8 sm:p-12 rounded-2xl shadow-xl overflow-hidden text-center flex flex-col justify-between min-h-[420px] ${borderStyles} ${className}`}
    >
      {/* Corner decorative accents */}
      <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-500/60 pointer-events-none" />
      <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-500/60 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-500/60 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-500/60 pointer-events-none" />

      {/* Header / Institution logo */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
          {institution.logoUrl ? (
            <img
              src={institution.logoUrl}
              alt={institutionName}
              className="w-10 h-10 object-contain rounded-full"
            />
          ) : (
            <Award className="w-8 h-8" />
          )}
        </div>
        <span className="text-xs font-semibold tracking-widest uppercase text-stone-500">
          {institutionName}
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-wide mt-2">
          {title}
        </h2>
      </div>

      {/* Recipient body */}
      <div className="my-6 space-y-2">
        <p className="text-xs uppercase tracking-widest text-stone-500 font-medium">
          This is proudly presented to
        </p>
        <div className="text-xl sm:text-3xl font-serif font-extrabold text-blue-700 border-b border-stone-300 inline-block px-6 pb-1">
          {recipientName}
        </div>
        <p className="text-xs sm:text-sm text-stone-700 max-w-lg mx-auto pt-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Footer details & verification badge */}
      <div className="pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <div className="text-left">
          <p className="font-semibold text-stone-700">Date Issued</p>
          <p>{formatDate(issuedAt)}</p>
        </div>

        {/* Verification seal */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-[11px]">
            {verified ? 'Officially Verified' : 'Pending Verification'}
          </span>
        </div>

        <div className="text-right">
          <p className="font-semibold text-stone-700">Certificate ID</p>
          <code className="font-mono text-stone-900 font-bold">{uniqueCode}</code>
        </div>
      </div>
    </div>
  );
}

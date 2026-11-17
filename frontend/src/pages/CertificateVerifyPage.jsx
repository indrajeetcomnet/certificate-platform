import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, ShieldCheck } from 'lucide-react';
import CertificateVerify from '../components/certificates/CertificateVerify';

export default function CertificateVerifyPage() {
  const { code } = useParams();

  return (
    <div className="min-h-screen bg-[#F8F8F5] text-stone-900 py-10 px-4 sm:px-6">
      {/* Top minimal header with link back to landing page */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-950 transition-colors bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs hover:shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-xs shadow-xs">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black text-stone-900 block leading-tight">CertPlatform</span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Public Registry</span>
          </div>
        </div>
      </div>

      <CertificateVerify initialCode={code || ''} />
    </div>
  );
}

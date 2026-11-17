import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Award, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  FileSpreadsheet, 
  Zap, 
  Building2 
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import CertificateBoardDesigner from '../components/certificates/CertificateBoardDesigner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CertificateCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();
  const institutionId = currentUser?.institutionId || currentUser?.id;

  const handleCertificateIssued = (created) => {
    showToast(`Certificate "${created.title}" successfully created!`, 'success');
    navigate('/certificates');
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
              Certificate design and issuance is restricted to verified sports academies and official organizations.
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
    <div className="w-full h-full flex-1 flex flex-col overflow-hidden">
      <CertificateBoardDesigner
        institutionId={institutionId}
        onCertificateIssued={handleCertificateIssued}
        className="w-full h-full flex-1 rounded-none border-none shadow-none"
      />
    </div>
  );
}

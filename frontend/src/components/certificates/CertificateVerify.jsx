import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import CertificateTemplate from './CertificateTemplate';
import { verify } from '../../api/certificatesApi';

export default function CertificateVerify({
  initialCode = '',
  className = '',
}) {
  const [code, setCode] = useState(initialCode);
  const [searchedCode, setSearchedCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const performVerification = async (codeToVerify) => {
    if (!codeToVerify || !codeToVerify.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const cleanCode = codeToVerify.trim().toUpperCase();
    setSearchedCode(cleanCode);

    try {
      const res = await verify(cleanCode);
      if (res.data && res.data.verified) {
        setResult(res.data.certificate || res.data);
      } else {
        setError(res.data?.message || 'Certificate verification failed. The provided code does not exist in the official ledger.');
      }
    } catch (err) {
      console.warn('Verification request error', err);
      setError('Certificate verification failed. The provided code does not exist in the official ledger.');
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      performVerification(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    performVerification(code);
  };

  return (
    <div className={`space-y-6 max-w-4xl mx-auto ${className}`}>
      {/* Header card */}
      <Card className="p-8 text-center space-y-4 bg-white/90 border border-stone-200/90 shadow-premium">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 border border-amber-300 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Verify Certificate Authenticity
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mt-1">
            Enter the unique identification code (`CERT-XXXX-XXXX-XXXX`) to check its authentic issuance status on the registry.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto pt-2">
          <input
            type="text"
            placeholder="e.g. CERT-A109-88F2-39C1"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-2.5 text-sm font-mono tracking-wider rounded-xl border border-stone-300 bg-stone-50/70 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 uppercase placeholder:text-stone-400"
          />
          <Button
            type="submit"
            variant="dark"
            size="md"
            icon={Search}
            loading={loading}
            disabled={!code.trim()}
          >
            Verify
          </Button>
        </form>
      </Card>

      {/* Loading state */}
      {loading && <LoadingSpinner text="Checking credentials on the registry..." className="py-8" />}

      {/* Verified result */}
      {result && !loading && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Authentic Certificate Verified</h4>
                <p className="text-xs opacity-90">
                  This certificate has been cryptographically validated and is officially active.
                </p>
              </div>
            </div>
            <code className="text-xs font-mono font-bold bg-white dark:bg-gray-800 px-2.5 py-1 rounded border border-green-300 dark:border-green-700">
              {searchedCode}
            </code>
          </div>

          {/* Visual Certificate Card */}
          <CertificateTemplate
            certificate={{
              ...result,
              uniqueCode: result.uniqueCode || searchedCode,
              institutionName: result.institutionName || result.institution?.name,
            }}
          />
        </div>
      )}

      {/* Error / Not Found state */}
      {error && !loading && (
        <Card className="p-8 text-center space-y-3 border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-700 dark:text-red-400">
            Invalid or Unverified Credential
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
            {error}
          </p>
        </Card>
      )}
    </div>
  );
}

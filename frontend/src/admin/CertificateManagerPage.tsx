import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CertificateManager from './CertificateManager';
import { useCerts } from './CertificateContext';
import { authHeaders } from '../auth';
import { API_BASE } from '../config';
import toast from 'react-hot-toast';

type CompletionCertificate = {
  id: number;
  certificateID: number;
  serialNumber: string;
  completionType: string;
  certificateTitle: string;
  createdAt: string;
};

const PAGE_ROUTES = [
  '/certificates/attendance',
  '/certificates/internship',
  '/certificates/acceptance',
  '/certificates/completion',
];

const CertificateManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    certificateStats,
    adminCertificates,
    saveStatus,
    loadIntoEditor,
    loadAdminCertificates,
  } = useCerts();
  const [completionCertificates, setCompletionCertificates] = useState<CompletionCertificate[]>([]);

  const loadCompletionCertificates = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/completion_certificates.php`, {
        headers: authHeaders(),
      });
      const records = await response.json();
      if (!response.ok) {
        throw new Error(records.message || 'Unable to load completion certificates.');
      }
      setCompletionCertificates(records);
    } catch (error) {
      console.error('Unable to load completion certificates:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to load completion certificates.');
    }
  }, []);

  const handleLoadSaved = async () => {
    await Promise.all([loadAdminCertificates(), loadCompletionCertificates()]);
  };

  const handleLoad = (c: any) => {
    const pageIndex = loadIntoEditor(c);
    navigate(PAGE_ROUTES[pageIndex] || PAGE_ROUTES[0]);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-[1400px]">
        <CertificateManager
          certificateStats={certificateStats}
          adminCertificates={adminCertificates}
          completionCertificates={completionCertificates}
          saveStatus={saveStatus}
          onLoadSaved={handleLoadSaved}
          onLoadIntoEditor={handleLoad}
        />
      </div>
    </div>
  );
};

export default CertificateManagerPage;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CertificateManager from './CertificateManager';
import { useCerts } from './CertificateContext';

const PAGE_ROUTES = ['/admin/certificates/attendance', '/admin/certificates/internship', '/admin/certificates/acceptance'];

const CertificateManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    certificateStats,
    adminCertificates,
    saveStatus,
    loadIntoEditor,
    loadAdminCertificates,
  } = useCerts();

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
          saveStatus={saveStatus}
          onLoadSaved={loadAdminCertificates}
          onLoadIntoEditor={handleLoad}
        />
      </div>
    </div>
  );
};

export default CertificateManagerPage;
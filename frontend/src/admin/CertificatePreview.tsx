import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authHeaders } from '../auth';
import { API_BASE } from '../config';

type CertificateData = {
  id: number;
  studentName: string;
  collegeName: string;
  fromDate: string;
  toDate: string;
  date: string;
  certificateTitle: string;
  projectTitle: string;
  certificateContent: string;
  signatoryTitle: string;
  attendanceTotalDays: string;
  attendanceDaysAttended: string;
  attendancePercentage: string;
  signatureImage: string;
  wishMessage: string;
  internshipTitle: string;
  internshipCompletionTitle: string;
  position: string;
  department: string;
  reportingManager: string;
  location: string;
  hideReportingManager: boolean;
  hidePosition: boolean;
  hideDepartment: boolean;
  hideLocation: boolean;
  serialNumber: string;
  qrCode: string;
};

type CertificatePreviewProps = {
  certificateId: number;
  onClose: () => void;
};

const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return dateStr;
};

const CertificatePreview: React.FC<CertificatePreviewProps> = ({ certificateId, onClose }) => {
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [certificateId]);

  const fetchCertificate = async () => {
    try {
      const res = await fetch(`${API_BASE}/list.php`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load');
      const allCerts = await res.json();
      const found = allCerts.find((c: CertificateData) => c.id === certificateId);
      if (found) {
        setCert(found);
      } else {
        toast.error('Certificate not found');
        onClose();
      }
    } catch (e) {
      toast.error('Failed to load certificate');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const parseContent = (content: string, page: CertificateData) => {
    let parsed = content;
    const isAcceptance = page.certificateTitle?.includes('ACCEPTANCE');

    let positionText = page.position || '';
    let departmentText = page.department || '';
    let reportingManagerText = page.reportingManager || '';
    let locationText = page.location || '';

    if (page.hidePosition) positionText = '';
    if (page.hideDepartment) departmentText = '';
    if (page.hideReportingManager) reportingManagerText = '';
    if (page.hideLocation) locationText = '';

    parsed = parsed
      .replace(/{{student Name}}/g, `<strong>${page.studentName}</strong>`)
      .replace(/{{college Name}}/g, isAcceptance ? `${page.collegeName}` : `<strong>${page.collegeName}</strong>`)
      .replace(/{{from Date}}/g, isAcceptance ? `${formatDateForDisplay(page.fromDate)}` : `<strong>${formatDateForDisplay(page.fromDate)}</strong>`)
      .replace(/{{to Date}}/g, isAcceptance ? `${formatDateForDisplay(page.toDate)}` : `<strong>${formatDateForDisplay(page.toDate)}</strong>`)
      .replace(/{{project Title}}/g, `<strong>${page.projectTitle || ''}</strong>`)
      .replace(/{{internship Title}}/g, `<strong>${page.internshipTitle || ''}</strong>`)
      .replace(/{{internship Completion Title}}/g, `<strong>${page.internshipCompletionTitle || ''}</strong>`)
      .replace(/{{position}}/g, positionText)
      .replace(/{{department}}/g, departmentText)
      .replace(/{{reportingManager}}/g, reportingManagerText)
      .replace(/{{location}}/g, locationText);

    if (page.hidePosition) parsed = parsed.replace(/.*\*\*Position:\*\*.*\n?/g, '');
    if (page.hideDepartment) parsed = parsed.replace(/.*\*\*Department:\*\*.*\n?/g, '');
    if (page.hideReportingManager) parsed = parsed.replace(/.*\*\*Reporting Manager:\*\*.*\n?/g, '');
    if (page.hideLocation) parsed = parsed.replace(/.*\*\*Location:\*\*.*\n?/g, '');

    parsed = parsed.replace(/\n\s*\n\s*\n/g, '\n\n');
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`);
    return parsed;
  };

  const Watermark = () => (
    <img
      src="/images/android-chrome-192x192.png"
      alt="watermark"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "320px",
        transform: "translate(-50%, -50%)",
        opacity: 0.05,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 1,
      }}
    />
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-slate-500">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!cert) return null;

  const isAttendance = cert.certificateTitle?.includes('ATTENDANCE');
  const isAcceptance = cert.certificateTitle?.includes('ACCEPTANCE');

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center overflow-y-auto py-10 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-[850px] w-full relative" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          ✕
        </button>

        {/* Certificate Label */}
        <div className="px-6 pt-6 flex justify-center">
          <span className="bg-blue-900 text-white px-4 py-1 rounded-full text-xs font-bold">
            {cert.certificateTitle}
          </span>
        </div>

        {/* Certificate Preview */}
        <div className="p-6 flex justify-center">
          <section
            className="relative border border-slate-300 shadow-2xl bg-white flex flex-col overflow-hidden"
            style={{
              width: '794px',
              height: '1123px',
              backgroundImage: "url('/images/bg.png')",
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              fontFamily: "'Times New Roman', serif",
              padding: isAcceptance ? '150px 80px 60px 80px' : '180px 90px 80px 90px',
              transform: 'scale(0.55)',
              transformOrigin: 'top center',
              marginBottom: '-450px',
            }}
          >
            <Watermark />

            {cert.serialNumber && (
              <div className="text-right text-[16px] font-bold text-black mb-1">
                Serial No: {cert.serialNumber}
              </div>
            )}

            <div className="text-right text-[16px] font-bold text-black mb-6">
              {formatDateForDisplay(cert.date)}
            </div>

            <div className="text-center mb-2">
              <h2 className="text-[20px] font-bold border-b-2 border-black inline-block pb-2 mb-2 uppercase tracking-tight">
                {cert.certificateTitle}
              </h2>
            </div>

            <div>
              <div
                className="text-[18px] leading-[1.9] mb-8 text-justify text-black whitespace-pre-line"
                style={{ textIndent: "40px" }}
                dangerouslySetInnerHTML={{
                  __html: parseContent(cert.certificateContent || '', cert),
                }}
              />

              {isAttendance && (
                <div className="mt-6 text-[16px] leading-[1.8] text-black">
                  <p className="mb-3 font-bold uppercase text-left">Attendance Details</p>
                  <div className="space-y-1 ml-4 text-left">
                    <p><span className="font-bold">Total No. of Days Allotted:</span> {cert.attendanceTotalDays}</p>
                    <p><span className="font-bold">No. of Days Attended:</span> {cert.attendanceDaysAttended}</p>
                    <p><span className="font-bold">Percentage of Attendance:</span> {cert.attendancePercentage}</p>
                  </div>
                </div>
              )}

              {cert.wishMessage && (
                <p
                  className="mt-8 text-center text-[17px] leading-[1.8] text-black font-normal"
                  dangerouslySetInnerHTML={{
                    __html: cert.wishMessage.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  }}
                />
              )}
            </div>

            {isAcceptance ? (
              <div className="flex flex-col items-start mt-6">
                <div className="text-left">
                  {cert.signatureImage && (
                    <img src={cert.signatureImage} alt="signature" className="w-32 h-auto mb-2" />
                  )}
                  <p className="text-[14px] mt-2 font-bold">Mahalakshmi Ganesan</p>
                  <p className="text-[13px]">Director</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end mt-16">
                <div className="pr-4 text-center">
                  {cert.signatureImage && (
                    <img src={cert.signatureImage} alt="signature" className="w-32 h-auto mb-2 mx-auto" />
                  )}
                  <p className="text-[15px] font-bold uppercase">{cert.signatoryTitle}</p>
                </div>
              </div>
            )}

            {cert.qrCode && (
              <div style={{ marginTop: "-150px", marginLeft: "-3px" }}>
                <img src={cert.qrCode} alt="QR Code" style={{ width: "120px", height: "120px" }} />
                <p style={{ fontSize: '16px', textAlign: 'start', marginLeft: "5px", marginTop: '2px', color: '#000' }}>
                  Scan QR to verify
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;

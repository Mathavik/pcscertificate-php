import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCerts, CertificateFields } from './CertificateContext';
import { authHeaders } from '../auth';
import { API_BASE } from '../config';
import toast from 'react-hot-toast';

// Certificate Completion uses its own dedicated editor/page.
// It shares only the saved data slot (index 3) with the CertificateContext.
const PAGE_INDEX = 3;
const PAGE_LABEL = 'CERTIFICATE COMPLETION';
const CERTIFICATE_BACKGROUND = "url('/document/PCS-Certificate-NOV26-RGB.jpeg')";
const COMPLETION_TYPES = ['Internship', 'Course', 'Project'] as const;
const DEFAULT_CERTIFICATE_NUMBER = 'PCS-COC-26-27/';
const COMPLETION_OPTIONS_PATTERN = /<!--completionCertificateOptions:([\s\S]*?)-->/;

type CompletionOptions = {
  certificateNumber: string;
  completionTypes: string[];
};

const readCompletionOptions = (content: string): CompletionOptions => {
  const marker = content.match(COMPLETION_OPTIONS_PATTERN);
  if (!marker) {
    return { certificateNumber: DEFAULT_CERTIFICATE_NUMBER, completionTypes: [] };
  }

  const [encodedNumber, encodedTypes = ''] = marker[1].split('|');
  try {
    return {
      certificateNumber: decodeURIComponent(encodedNumber),
      completionTypes: decodeURIComponent(encodedTypes)
        .split(',')
        .filter((type) => COMPLETION_TYPES.includes(type as (typeof COMPLETION_TYPES)[number])),
    };
  } catch (error) {
    console.error('Unable to read Certificate Completion options:', error);
    return { certificateNumber: DEFAULT_CERTIFICATE_NUMBER, completionTypes: [] };
  }
};

const writeCompletionOptions = (content: string, options: CompletionOptions) => {
  const cleanContent = content.replace(COMPLETION_OPTIONS_PATTERN, '').trimEnd();
  const marker = `<!--completionCertificateOptions:${encodeURIComponent(options.certificateNumber)}|${encodeURIComponent(options.completionTypes.join(','))}-->`;
  return cleanContent ? `${cleanContent}\n\n${marker}` : marker;
};

const CompletionCertificate: React.FC = () => {
  const {
    pagesData,
    reviewName,
    pendingScrollRef,
    handleChange,
  } = useCerts();

  const pageRef = useRef<HTMLElement | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const index = PAGE_INDEX;
  const page = pagesData[index];
  const completionOptions = readCompletionOptions(page?.certificateContent || '');

  const updateCompletionOptions = (options: CompletionOptions) => {
    handleChange(index, 'certificateContent', writeCompletionOptions(page.certificateContent, options));
  };

  const saveCompletionCertificate = async () => {
    if (completionOptions.completionTypes.length === 0) {
      toast.error('Please select Internship, Course, or Project before saving.');
      return false;
    }

    const payload = {
      serialNumber: completionOptions.certificateNumber.trim(),
      completionType: completionOptions.completionTypes,
      certificateTitle: page.certificateTitle.trim().replace(/\s+/g, ' ').toUpperCase(),
    };

    try {
      setIsSaving(true);
      const response = await fetch(`${API_BASE}/completion_certificates.php`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const saved = await response.json();
      if (!response.ok) {
        throw new Error(saved.message || 'Unable to save completion certificate.');
      }

      updateCompletionOptions({ ...completionOptions, completionTypes: [] });
      toast.success('Completion Certificate Saved!');
      return true;
    } catch (error) {
      console.error('Unable to save Certificate Completion:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to save completion certificate.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (pendingScrollRef.current === index && pageRef.current) {
      const element = pageRef.current;
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      pendingScrollRef.current = null;
    }
  }, [index, pendingScrollRef]);

  // Keeps only characters that are safe for a file name
  const sanitizeFileName = (value: string) =>
    (value || '')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const buildPdfFileName = () => {
    const title = sanitizeFileName(page?.certificateTitle) || PAGE_LABEL;
    const student = sanitizeFileName(reviewName[index]) || sanitizeFileName(page?.studentName);
    return student ? `${title}_${student}.pdf` : `${title}.pdf`;
  };

  const downloadPDF = async () => {
    const element = pageRef.current;
    if (!element) return;

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(buildPdfFileName());
    } catch (error) {
      console.error('Error generating Certificate Completion PDF:', error);
    }
  };

  const Watermark = () => (
    <img
      src="/document/PNG/PCS-Icon-Watermark.png"
      alt=""
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '60%',
        left: '50%',
        width: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 1,
      }}
    />
  );

  const renderInputs = (p: CertificateFields) => (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 h-fit sticky top-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">✏️ EDIT {p.certificateTitle}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Each save creates a new completion certificate record</p>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={async () => {
            if (!editMode) {
              setEditMode(true);
              return;
            }
            const ok = await saveCompletionCertificate();
            if (ok) {
              setEditMode(false);
            }
          }}
          className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          {isSaving ? 'Saving...' : editMode ? '💾 Save' : '✏️ Edit'}
        </button>
      </div>

      <fieldset className="mt-4 space-y-4 border-0 p-0 m-0" disabled={!editMode}>
        <div>
          <label htmlFor="completion-certificate-number" className="block text-[10px] font-bold uppercase">
            Certificate No
          </label>
          <input
            id="completion-certificate-number"
            value={completionOptions.certificateNumber}
            onChange={(e) =>
              updateCompletionOptions({ ...completionOptions, certificateNumber: e.target.value })
            }
            className="mt-1 w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <span className="block text-[10px] font-bold uppercase">Internship / Course / Project</span>
          <div className="mt-2 flex flex-wrap gap-4">
            {COMPLETION_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={completionOptions.completionTypes.includes(type)}
                  onChange={(e) => {
                    const completionTypes = e.target.checked
                      ? [...completionOptions.completionTypes, type]
                      : completionOptions.completionTypes.filter((selectedType) => selectedType !== type);
                    updateCompletionOptions({ ...completionOptions, completionTypes });
                  }}
                  className="h-4 w-4"
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      </fieldset>
    </div>
  );

  if (!page) return null;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-[1700px]">
        <div className="flex flex-col gap-12">
          <div className="grid gap-6 lg:grid-cols-[400px_1fr] pb-8">
            {renderInputs(page)}
            <div className="flex flex-col items-center gap-4">
              <div className="w-full flex justify-end py-2">
                <button
                  onClick={downloadPDF}
                  className="bg-blue-900 text-white text-xs px-4 py-2 rounded-full shadow-md hover:bg-blue-800 transition-all"
                >
                  ⬇ Download PDF
                </button>
              </div>
              <span className="bg-blue-900 text-white px-4 py-1 rounded-full text-xs font-bold">{PAGE_LABEL}</span>
              <div className="w-full overflow-x-auto">
                <div className="flex justify-center min-w-[1123px]">
                  <section
                    ref={pageRef}
                    className="relative border border-slate-300 shadow-2xl bg-white flex flex-col"
                    style={{
                      width: '1123px',
                      height: '794px',
                      backgroundImage: CERTIFICATE_BACKGROUND,
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      fontFamily: "'Times New Roman', serif",
                      padding: '115px 125px 75px 125px',
                    }}
                  >
                    <Watermark />
                    <img
                      src="/document/PNG/PCS-Logo-WT.png"
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '2%',
                        left: '69%',
                        width: '28%',
                        height: '14%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    />
                    <div
                      className="absolute z-10 text-right text-[12px] font-semibold text-white"
                      style={{
                        top: '12%',
                        right: '3.5%',
                        width: '20%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      Progress. Connect. Succeed.
                    </div>
                    <img
                      src="/document/PNG/PCS-Ribbon-Banner.png"
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '38%',
                        left: '20%',
                        width: '50%',
                        height: '7%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    />
                    <img
                      src="/document/PNG/PCS-R-Badge.png"
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '16%',
                        left: '78%',
                        width: '17%',
                        height: '50%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    />
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 100 100"
                      style={{
                        position: 'absolute',
                        top: '47.5%',
                        left: '86.5%',
                        width: '9%',
                        height: 'auto',
                        transform: 'translate(-50%, -50%)',
                        overflow: 'visible',
                        pointerEvents: 'none',
                        zIndex: 3,
                      }}
                    >
                      <defs>
                        <path id="completion-badge-top" d="M 12,50 A 38,38 0 0,0 88,50" />
                        <path id="completion-badge-bottom" d="M 12,50 A 38,38 0 0,1 88,50" />
                      </defs>
                      <text
                        fill="#ffffff"
                        fontFamily="Arial, sans-serif"
                        fontSize="8"
                        fontWeight="bold"
                        letterSpacing="0.5"
                      >
                        <textPath href="#completion-badge-top" startOffset="50%" textAnchor="middle">
                          EXCELLENCE IN
                        </textPath>
                      </text>
                      <text
                        fill="#ffffff"
                        fontFamily="Arial, sans-serif"
                        fontSize="8"
                        fontWeight="bold"
                        letterSpacing="0.5"
                      >
                        <textPath href="#completion-badge-bottom" startOffset="50%" textAnchor="middle">
                          PROGRAMMING
                        </textPath>
                      </text>
                    </svg>
                    <img
                      src="/document/PNG/PCS-Icon.png"
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '47.5%',
                        left: '86.5%',
                        width: '4.3%',
                        height: '6.5%',
                        objectFit: 'contain',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 4,
                      }}
                    />
                    <img
                      src="/document/PNG/PCS-Location-Icon.png"
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '72%',
                        left: '81.5%',
                        width: '1.2%',
                        height: '2%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    />
                    <img
                      src="/document/PNG/PCS-Mail-Icon.png"
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '78.5%',
                        left: '81.5%',
                        width: '1.2%',
                        height: '2%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    />
                    <img
                      src="/document/PNG/PCS-Website-Icon.png"
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '84.5%',
                        left: '81.5%',
                        width: '1.2%',
                        height: '2%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    />

                    <div
                      className="absolute z-10 text-center font-extrabold leading-none text-[#211d5b]"
                      style={{
                        top: '18%',
                        left: '14%',
                        width: '62%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      <div style={{ fontSize: '50px' }}>CERTIFICATE</div>
                      <div style={{ marginTop: '3px', fontSize: '32px' }}>OF COMPLETION</div>
                    </div>
                    <div
                      className="absolute left-[45%] top-[34.5%] z-10 -translate-x-1/2 whitespace-nowrap text-center text-[18px] font-bold text-[#211d5b]"
                      style={{ fontFamily: "'WF Visual Sans', sans-serif" }}
                    >
                      Certificate No: {completionOptions.certificateNumber}
                    </div>

                    <div
                      className="absolute z-10 text-center text-[20px] font-bold text-[#211d5b]"
                      style={{
                        top: '39.3%',
                        left: '20%',
                        width: '50%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      This Certificate is Proudly Presented to
                    </div>
                    <div
                      className="absolute z-10 border-b-2 border-[#211d5b]"
                      style={{ top: '53%', left: '15%', width: '57%' }}
                    />
                    <div
                      className="absolute z-10 text-center text-[16px] font-bold text-[#211d5b]"
                      style={{
                        top: '54.3%',
                        left: '15%',
                        width: '57%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      for successfully completing the
                    </div>
                    <div
                      className="absolute left-[45%] top-[60%] z-10 flex -translate-x-1/2 justify-center gap-5 whitespace-nowrap text-[22px] font-bold uppercase text-[#211d5b]"
                      style={{ fontFamily: "'WF Visual Sans', sans-serif" }}
                    >
                      {COMPLETION_TYPES.map((type) => {
                        const checked = completionOptions.completionTypes.includes(type);
                        return (
                          <span key={type} className="inline-flex items-center gap-3">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 border-[#211d5b] text-[16px] leading-none">
                              {checked ? '✓' : ''}
                            </span>
                            {type}
                          </span>
                        );
                      })}
                    </div>
                    <div
                      className="absolute z-10 text-[16px] font-bold text-[#211d5b]"
                      style={{
                        top: '67%',
                        left: '15%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      on
                    </div>
                    <div
                      className="absolute z-10 border-b-2 border-[#211d5b] text-center text-[15px] font-bold text-[#211d5b]"
                      style={{
                        top: '66.6%',
                        left: '19%',
                        width: '53%',
                        minHeight: '22px',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    />
                    <div
                      className="absolute z-10 flex text-[15px] font-bold text-[#211d5b]"
                      style={{
                        top: '71.2%',
                        left: '20%',
                        width: '50%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      <div className="flex w-1/2 items-end gap-2">
                        <span>from</span>
                        <span className="flex-1 border-b-2 border-[#211d5b] text-center" />
                      </div>
                      <div className="ml-6 flex w-1/2 items-end gap-2">
                        <span>to</span>
                        <span className="flex-1 border-b-2 border-[#211d5b] text-center" />
                      </div>
                    </div>
                    <div
                      className="absolute z-10 text-center text-[14px] font-semibold leading-[1.45] text-[#211d5b]"
                      style={{
                        top: '76.5%',
                        left: '14%',
                        width: '60%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      <div>
                        During the session the performance of the candidate was found to be good.
                      </div>
                      <div>
                        We congratulate them on this accomplishment and wish them continued
                      </div>
                      <div>success in their future endeavors.</div>
                    </div>
                    <div
                      className="absolute z-10 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#ed0b72]"
                      style={{
                        top: '69.5%',
                        left: '83%',
                        width: '14%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      PLACE..
                    </div>
                    <div
                      className="absolute z-10 text-center text-[14px] font-semibold text-black"
                      style={{
                        top: '71.2%',
                        left: '83%',
                        width: '14%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      Surandai
                    </div>
                    <div
                      className="absolute z-10 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#ed0b72]"
                      style={{
                        top: '76%',
                        left: '83%',
                        width: '14%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      CONNECT..
                    </div>
                    <div
                      className="absolute z-10 whitespace-nowrap text-center text-[13px] font-semibold text-black"
                      style={{
                        top: '77.7%',
                        left: '83%',
                        width: '16%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      contact@pcstech.in
                    </div>
                    <div
                      className="absolute z-10 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#ed0b72]"
                      style={{
                        top: '82%',
                        left: '83%',
                        width: '14%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      SEARCH..
                    </div>
                    <div
                      className="absolute z-10 text-center text-[13px] font-semibold text-black"
                      style={{
                        top: '83.7%',
                        left: '83%',
                        width: '14%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      www.pcstech.in
                    </div>
                    <div
                      className="absolute z-10 text-center text-[10px] font-semibold text-black"
                      style={{
                        top: '86%',
                        left: '83%',
                        width: '15%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      /f pcstechsurandai
                    </div>
                    <div
                      className="absolute z-10 text-[14px] font-bold text-[#211d5b]"
                      style={{
                        top: '94%',
                        left: '15%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      Date Of Issue
                    </div>
                    <div
                      className="absolute z-10 text-center text-[14px] font-bold text-[#211d5b]"
                      style={{
                        top: '94%',
                        left: '57%',
                        width: '20%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      Authorized Signatory
                    </div>

                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionCertificate;

import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { toJpeg, toPng } from 'html-to-image';
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
const getDefaultCertificateNumber = () => {
  const startYear = new Date().getFullYear();
  const endYear = (startYear + 1) % 100;
  return `PCS-COC-${String(startYear % 100).padStart(2, '0')}-${String(endYear).padStart(2, '0')}/`;
};
const CERT_WIDTH = 1123;
// Badge overlay: centre of the round badge inside PCS-R-Badge.png, and overlay size.
// Move BADGE_CENTER_X / BADGE_CENTER_Y if the text ring is not exactly concentric with the badge.
const BADGE_CENTER_X = '86.5%';
const BADGE_CENTER_Y = '48.5%';
const BADGE_SVG_WIDTH = '17.9%';
const CERT_HEIGHT = 794;
const COMPLETION_OPTIONS_PATTERN = /<!--completionCertificateOptions:([\s\S]*?)-->/;

type CompletionOptions = {
  certificateNumber: string;
  completionTypes: string[];
};

const readCompletionOptions = (content: string): CompletionOptions => {
  const marker = content.match(COMPLETION_OPTIONS_PATTERN);
  if (!marker) {
    return { certificateNumber: getDefaultCertificateNumber(), completionTypes: [] };
  }

  const [encodedNumber, encodedTypes = ''] = marker[1].split('|');
  try {
    return {
      certificateNumber: decodeURIComponent(encodedNumber).replace(
        /^PCS-COC-\d{2}-\d{2}\//,
        getDefaultCertificateNumber()
      ),
      completionTypes: decodeURIComponent(encodedTypes)
        .split(',')
        .filter((type) => COMPLETION_TYPES.includes(type as (typeof COMPLETION_TYPES)[number])),
    };
  } catch (error) {
    console.error('Unable to read Certificate Completion options:', error);
    return { certificateNumber: getDefaultCertificateNumber(), completionTypes: [] };
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
    pendingScrollRef,
    handleChange,
  } = useCerts();

  const pageRef = useRef<HTMLElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const index = PAGE_INDEX;
  const page = pagesData[index];
  const completionOptions = readCompletionOptions(page?.certificateContent || '');
  const [previewCompletionTypes, setPreviewCompletionTypes] = useState<string[]>(
    () => completionOptions.completionTypes
  );
  const [previewCertificateNumber, setPreviewCertificateNumber] = useState(
    () => completionOptions.certificateNumber
  );
  const certificateNumberPrefix = getDefaultCertificateNumber();
  const certificateNumberSuffix = completionOptions.certificateNumber.replace(
    certificateNumberPrefix,
    ''
  );

  const updateCompletionOptions = (options: CompletionOptions) => {
    handleChange(index, 'certificateContent', writeCompletionOptions(page.certificateContent, options));
  };

  const saveCompletionCertificate = async () => {
    if (completionOptions.completionTypes.length === 0) {
      toast.error('Please select Internship, Course, or Project before saving.');
      return false;
    }

    const payload = {
      serialNumber: `${certificateNumberPrefix}${certificateNumberSuffix}`.trim(),
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

      setPreviewCompletionTypes(completionOptions.completionTypes);
      setPreviewCertificateNumber(payload.serialNumber);
      updateCompletionOptions({
        ...completionOptions,
        certificateNumber: certificateNumberPrefix,
        completionTypes: [],
      });
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

  // Fit the 1123px certificate into the available width (preview only, PDF stays full size)
  const hasPage = Boolean(page);
  useEffect(() => {
    const wrapper = previewWrapRef.current;
    if (!wrapper) return;
    const updateScale = () => {
      const available = wrapper.clientWidth;
      if (available > 0) {
        setPreviewScale(Math.min(1, available / CERT_WIDTH));
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapper);
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [hasPage]);

  const buildPdfFileName = () => `${PAGE_LABEL}.pdf`;

  // Waits until fonts and every <img> inside the certificate are fully loaded,
  // so the capture never happens with half-loaded assets.
  const waitForAssets = async (element: HTMLElement) => {
    try {
      if ((document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
    } catch {
      /* ignore */
    }
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );
  };

  // Primary method: html-to-image uses the browser's own renderer (SVG foreignObject),
  // so the PDF looks exactly like the preview (object-fit, transforms, fonts, spacing).
  const captureWithHtmlToImage = async (element: HTMLElement) => {
    const options = {
      width: CERT_WIDTH,
      height: CERT_HEIGHT,
      canvasWidth: CERT_WIDTH,
      canvasHeight: CERT_HEIGHT,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#ffffff',
      style: {
        boxShadow: 'none',
        margin: '0',
        transform: 'none',
        border: '1px solid transparent', // keep same box size, hide the grey border
      },
    };
    // Warm-up render: makes sure fonts / background image / <img> are embedded.
    await toPng(element, options);
    return toJpeg(element, { ...options, quality: 0.95 });
  };

  // Fallback method: html2canvas
  const captureWithHtml2Canvas = async (element: HTMLElement) => {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: CERT_WIDTH,
      height: CERT_HEIGHT,
      windowWidth: CERT_WIDTH,
      windowHeight: CERT_HEIGHT,
      scrollX: 0,
      scrollY: -window.scrollY,
      onclone: (doc) => {
        const cloned = doc.querySelector('[data-certificate-root="true"]') as HTMLElement | null;
        doc.querySelectorAll('[data-gradient-text="true"]').forEach((node) => {
          const el = node as HTMLElement;
          el.style.backgroundImage = 'none';
          el.style.webkitTextFillColor = '#7a206c';
          el.style.color = '#7a206c';
        });
        doc.querySelectorAll('[data-preview-scale="true"]').forEach((node) => {
          const el = node as HTMLElement;
          el.style.transform = 'none';
          el.style.width = `${CERT_WIDTH}px`;
          el.style.height = `${CERT_HEIGHT}px`;
        });
        if (cloned) {
          cloned.style.boxShadow = 'none';
          cloned.style.width = `${CERT_WIDTH}px`;
          cloned.style.height = `${CERT_HEIGHT}px`;
        }
      },
    });
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const downloadPDF = async () => {
    const element = pageRef.current;
    if (!element) return;

    try {
      await waitForAssets(element);

      let imgData: string;
      try {
        imgData = await captureWithHtmlToImage(element);
      } catch (primaryError) {
        console.warn('html-to-image failed, falling back to html2canvas:', primaryError);
        imgData = await captureWithHtml2Canvas(element);
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // 1123 x 794 px is the A4 landscape ratio, so the image fills the whole page.
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      pdf.save(buildPdfFileName());
    } catch (error) {
      console.error('Error generating Certificate Completion PDF:', error);
      toast.error('Unable to generate Certificate Completion PDF.');
    }
  };

  const Watermark = () => (
    <img
      src="/document/PNG/PCS-Icon-Watermark.png"
      alt=""
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '56%',
        left: '45%',
        width: '35%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 1,
      }}
    />
  );

  const renderInputs = (p: CertificateFields) => (
    <div className="w-full min-w-0 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 h-fit sticky top-10">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
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
          className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          {isSaving ? 'Saving...' : editMode ? '💾 Save' : '✏️ Edit'}
        </button>
      </div>

      <fieldset className="mt-4 space-y-4 border-0 p-0 m-0" disabled={!editMode}>
        <div>
          <label htmlFor="completion-certificate-number" className="block text-[10px] font-bold uppercase">
            Certificate No
          </label>
          <div className="mt-1 flex w-full items-center rounded border bg-white text-sm">
            <span className="border-r bg-slate-100 px-2 py-2 text-slate-700">
              {certificateNumberPrefix}
            </span>
            <input
              id="completion-certificate-number"
              aria-label="Certificate number suffix"
              value={certificateNumberSuffix}
              onChange={(e) => {
                const certificateNumber = `${certificateNumberPrefix}${e.target.value}`;
                setPreviewCertificateNumber(certificateNumber);
                updateCompletionOptions({ ...completionOptions, certificateNumber });
              }}
              className="min-w-0 flex-1 px-3 py-2 outline-none"
            />
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-bold uppercase">Internship / Course / Project</span>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {COMPLETION_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={completionOptions.completionTypes.includes(type)}
                  onChange={(e) => {
                    const completionTypes = e.target.checked
                      ? [...completionOptions.completionTypes, type]
                      : completionOptions.completionTypes.filter((selectedType) => selectedType !== type);
                    setPreviewCompletionTypes(completionTypes);
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
          <div className="grid gap-6 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] pb-8">
            {renderInputs(page)}
            <div className="flex min-w-0 flex-col items-center gap-4">
              <div className="w-full flex justify-end py-2">
                <button
                  onClick={downloadPDF}
                  className="bg-blue-900 text-white text-xs px-4 py-2 rounded-full shadow-md hover:bg-blue-800 transition-all"
                >
                  ⬇ Download PDF
                </button>
              </div>
              <span className="bg-blue-900 text-white px-4 py-1 rounded-full text-xs font-bold">{PAGE_LABEL}</span>
              <div ref={previewWrapRef} className="w-full min-w-0">
                <div
                  style={{
                    width: `${CERT_WIDTH * previewScale}px`,
                    height: `${CERT_HEIGHT * previewScale}px`,
                    margin: '0 auto',
                    position: 'relative',
                  }}
                >
                <div
                  data-preview-scale="true"
                  style={{
                    width: `${CERT_WIDTH}px`,
                    height: `${CERT_HEIGHT}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <section
                    ref={pageRef}
                    data-certificate-root="true"
                    className="relative border border-slate-300 shadow-2xl bg-white flex flex-col"
                    style={{
                      width: `${CERT_WIDTH}px`,
                      height: `${CERT_HEIGHT}px`,
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
                        top: '1.5%',
                        left: '69%',
                        width: '28%',
                        height: '14%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    />
                    <div
                      className="absolute z-[3] whitespace-nowrap text-right text-white"
                      style={{
                        top: '13.5%',
                        left: '80%',
                        width: '17%',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '15px',
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
                        height: '7.5%',
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
                        top: '16.8%',
                        left: '78%',
                        width: '17%',
                        height: '50%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    />
                    {/* Badge ring text + stars. Units: 1 = 1px of the 460px reference badge. */}
                    <svg
                      aria-hidden="true"
                      viewBox="-230 -230 460 460"
                      style={{
                        position: 'absolute',
                        top: BADGE_CENTER_Y,
                        left: BADGE_CENTER_X,
                        width: BADGE_SVG_WIDTH,
                        height: 'auto',
                        aspectRatio: '1 / 1',
                        transform: 'translate(-50%, -50%)',
                        overflow: 'visible',
                        pointerEvents: 'none',
                        zIndex: 3,
                      }}
                    >
                      <defs>
                        {/* top arc: left -> right over the top (clockwise) */}
                        <path id="completion-badge-arc-top" d="M -119.5,0 A 119.5,119.5 0 0 1 119.5,0" />
                        {/* bottom arc: left -> right under the bottom (counter-clockwise) */}
                        <path id="completion-badge-arc-bottom" d="M -146.5,0 A 146.5,146.5 0 0 0 146.5,0" />
                      </defs>
                      <text
                        fill="#ffffff"
                        fontFamily="'WF Visual Sans', Arial, sans-serif"
                        fontSize="33"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        <textPath
                          href="#completion-badge-arc-top"
                          startOffset="50%"
                          textLength="267"
                          lengthAdjust="spacing"
                        >
                          EXCELLENCE IN
                        </textPath>
                      </text>
                      <text
                        fill="#ffffff"
                        fontFamily="'WF Visual Sans', Arial, sans-serif"
                        fontSize="33"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        <textPath
                          href="#completion-badge-arc-bottom"
                          startOffset="50%"
                          textLength="310"
                          lengthAdjust="spacing"
                        >
                          PROGRAMMING
                        </textPath>
                      </text>
                      <polygon points="-128.0,-12.0 -124.6,-2.6 -114.7,-2.3 -122.6,3.8 -119.8,13.3 -128.0,7.7 -136.2,13.3 -133.4,3.8 -141.3,-2.3 -131.4,-2.6" fill="#ffb81c" />
                      <polygon points="128.0,-12.0 131.4,-2.6 141.3,-2.3 133.4,3.8 136.2,13.3 128.0,7.7 119.8,13.3 122.6,3.8 114.7,-2.3 124.6,-2.6" fill="#ffb81c" />
                    </svg>
                    <img
                      src="/document/PNG/PCS-Icon.png"
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '48.5%',
                        left: '86.5%',
                        width: '5.2%',
                        height: '7.8%',
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
                        top: '71.8%',
                        left: '80%',
                        width: '0.8%',
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
                        top: '77.9%',
                        left: '80%',
                        width: '0.8%',
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
                        top: '84.2%',
                        left: '80%',
                        width: '0.8%',
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
                      <div style={{ fontSize: '60px' }}>CERTIFICATE</div>
                      <div style={{ marginTop: '3px', fontSize: '33px' }}>
                        <span
                          data-gradient-text="true"
                          style={{
                            display: 'inline-block',
                            backgroundImage:
                              'linear-gradient(90deg, #2b1f62 0%, #4a2067 30%, #6f206b 55%, #8f206d 78%, #ab2070 100%)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            color: 'transparent',
                          }}
                        >
                          OF COMPLETION
                        </span>
                      </div>
                    </div>
                    <div
                      className="absolute left-[45%] top-[34%] z-10 -translate-x-1/2 whitespace-nowrap text-center text-[17px] font-bold text-[#211d5b]"
                      style={{ fontFamily: "'WF Visual Sans', sans-serif" }}
                    >
                      Certificate No: {previewCertificateNumber}
                    </div>

                    <div
                      className="absolute z-10 text-center text-[22px] font-bold text-[#211d5b]"
                      style={{
                        top: '39%',
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
                        const checked = previewCompletionTypes.includes(type);
                        return (
                          <span key={type} className="inline-flex items-center gap-3">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 border-[#211d5b] text-[16px] leading-none">
                              {checked ? (
                                <svg
                                  viewBox="0 0 24 24"
                                  width="16"
                                  height="16"
                                  aria-hidden="true"
                                  style={{ display: 'block' }}
                                >
                                  <path
                                    d="M4.5 12.5 L9.5 17.5 L19.5 6.5"
                                    fill="none"
                                    stroke="#211d5b"
                                    strokeWidth="3.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : null}
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
                      className="absolute z-10 flex text-[16px] font-bold text-[#211d5b]"
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
                      className="absolute z-10 text-center text-[16px] font-semibold leading-[1.45] text-[#211d5b]"
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
                      className="absolute z-10 text-center text-[12px] font-bold uppercase tracking-[0.12em] text-[#ed0b72]"
                      style={{
                        top: '70%',
                        left: '77%',
                        width: '14%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      PLACE..
                    </div>
                    <div
                      className="absolute z-10 text-center text-[15px] font-semibold text-black"
                      style={{
                        top: '71.5%',
                        left: '77.2%',
                        width: '14%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      Surandai
                    </div>
                    <div
                      className="absolute z-10 text-center text-[12px] font-bold uppercase tracking-[0.12em] text-[#ed0b72]"
                      style={{
                        top: '76%',
                        left: '77.7%',
                        width: '14%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      CONNECT..
                    </div>
                    <div
                      className="absolute z-10 whitespace-nowrap text-center text-[14px] font-semibold text-black"
                      style={{
                        top: '77.7%',
                        left: '79.3%',
                        width: '16%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      Contact@pcstech.in
                    </div>
                    <div
                      className="absolute z-10 text-center text-[12px] font-bold uppercase tracking-[0.12em] text-[#ed0b72]"
                      style={{
                        top: '82%',
                        left: '77.5%',
                        width: '14%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      SEARCH..
                    </div>
                    <div
                      className="absolute z-10 text-center text-[14px] font-semibold text-black"
                      style={{
                        top: '83.7%',
                        left: '79.2%',
                        width: '14%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      www.pcstech.in
                    </div>
                    <div
                      className="absolute z-10 flex items-center gap-[3px] whitespace-nowrap text-[10px] font-semibold text-black"
                      style={{
                        top: '86.8%',
                        left: '81.5%',
                        width: '15%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      <img
                        src="/document/PNG/Facebook, LinkedIn, and Instagram Icons.png"
                        alt="Facebook, LinkedIn, and Instagram"
                        className="h-auto w-12 shrink-0"
                      />
                      <span>/ pcstechsurandai</span>
                    </div>
                    <div
                      className="absolute z-10 text-[16px] font-bold text-[#211d5b]"
                      style={{
                        top: '93%',
                        left: '15%',
                        fontFamily: "'WF Visual Sans', Arial, sans-serif",
                      }}
                    >
                      Date Of Issue
                    </div>
                    <div
                      className="absolute z-10 text-center text-[16px] font-bold text-[#211d5b]"
                      style={{
                        top: '93%',
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
    </div>
  );
};

export default CompletionCertificate;
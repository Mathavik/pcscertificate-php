import React, { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCerts, formatDateForDisplay, CertificateFields } from './CertificateContext';

const PAGE_LABELS: Record<number, string> = {
  0: 'CERTIFICATE 1 - ATTENDANCE CERTIFICATE',
  1: 'CERTIFICATE 2 - INTERNSHIP COMPLETION CERTIFICATE',
  2: 'CERTIFICATE 3 - ACCEPTANCE CERTIFICATE',
};

const SingleCertificatePage: React.FC<{ index: number }> = ({ index }) => {
  const ctx = useCerts();
  const {
    pagesData,
    qrCodes,
    serialNumbers,
    currentCertificateIds,
    reviewName,
    pendingScrollRef,
    handleSaveCertificate,
    handleChange,
    parseContent,
  } = ctx;

  const pageRefs = useRef<Array<HTMLElement | null>>([null, null, null]);
  const textareaRefs = useRef<Array<HTMLTextAreaElement | null>>([null, null, null]);

  useEffect(() => {
    if (pendingScrollRef.current === index) {
      const ref = pageRefs.current[index];
      if (ref) {
        setTimeout(() => {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      pendingScrollRef.current = null;
    }
  }, [index, pendingScrollRef]);

  const setPageRef = (idx: number) => (element: HTMLElement | null) => {
    pageRefs.current[idx] = element;
  };

  const Watermark = () => {
    return (
      <>
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
      </>
    );
  };

  const downloadSinglePDF = async (idx: number) => {
    const page = pageRefs.current[idx];
    if (!page) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const canvas = await html2canvas(page, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.5);
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`${pagesData[idx].certificateTitle}_${pagesData[idx].studentName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const page = pagesData[index];

  const renderCertificateInputs = (p: CertificateFields, idx: number) => {
    return (
      <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 h-fit sticky top-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">✏️ EDIT {p.certificateTitle}</h3>
            {currentCertificateIds[idx] !== undefined ? (
              <p className="text-[10px] text-slate-500 mt-1">Editing saved certificate id={currentCertificateIds[idx]}</p>
            ) : (
              <p className="text-[10px] text-slate-500 mt-1">New certificate will be created on save</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleSaveCertificate(idx)}
            className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            💾 Save
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase">Date</label>
          <input
            type="date"
            value={p.date}
            onChange={(e) => handleChange(idx, 'date', e.target.value)}
            className="mt-1 w-full border px-3 py-2 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase">
            Certificate Title
          </label>
          <input
            value={p.certificateTitle}
            onChange={(e) => handleChange(idx, "certificateTitle", e.target.value)}
            onBlur={(e) =>
              handleChange(
                idx,
                "certificateTitle",
                e.target.value.trim().replace(/\s+/g, " ").toUpperCase()
              )
            }
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase">Student Name</label>
            <input
              value={p.studentName}
              onChange={(e) => handleChange(idx, "studentName", e.target.value.toUpperCase())}
              className="mt-1 w-full border px-3 py-2 text-sm rounded uppercase"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase">College Name</label>
            <input
              value={p.collegeName}
              onChange={(e) => handleChange(idx, 'collegeName', e.target.value)}
              className="mt-1 w-full border px-3 py-2 text-sm rounded"
            />
          </div>

          {!p.certificateTitle.includes('ACCEPTANCE') && (
            <div>
              <label className="block text-[10px] font-bold uppercase">Internship Title</label>
              <input
                value={p.internshipTitle}
                onChange={(e) => handleChange(idx, 'internshipTitle', e.target.value.toUpperCase())}
                className="mt-1 w-full border px-3 py-2 text-sm rounded uppercase"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase">From Date</label>
              <input
                type="date"
                value={p.fromDate}
                onChange={(e) => handleChange(idx, 'fromDate', e.target.value)}
                className="mt-1 w-full border px-3 py-2 text-sm rounded"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase">To Date</label>
              <input
                type="date"
                value={p.toDate}
                onChange={(e) => handleChange(idx, 'toDate', e.target.value)}
                className="mt-1 w-full border px-3 py-2 text-sm rounded"
              />
            </div>
          </div>

          {(p.certificateTitle.includes('ATTENDANCE') || p.certificateTitle.includes('INTERNSHIP')) && (
            <div>
              <label className="block text-[10px] font-bold uppercase">Department</label>
              <input
                value={p.department}
                onChange={(e) => handleChange(idx, 'department', e.target.value)}
                className="mt-1 w-full border px-3 py-2 text-sm rounded"
              />
            </div>
          )}

          {p.certificateTitle.includes('ACCEPTANCE') && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase">Internship Title</label>
                <input
                  value={p.internshipTitle}
                  onChange={(e) => handleChange(idx, 'internshipTitle', e.target.value)}
                  className="mt-1 w-full border px-3 py-2 text-sm rounded"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase">Position</label>
                  <label className="flex items-center gap-1 text-[9px]">
                    <input
                      type="checkbox"
                      checked={p.hidePosition}
                      onChange={(e) => handleChange(idx, 'hidePosition', e.target.checked)}
                      className="w-3 h-3"
                    />
                    Hide
                  </label>
                </div>
                <input
                  value={p.position}
                  onChange={(e) => handleChange(idx, 'position', e.target.value)}
                  className="mt-1 w-full border px-3 py-2 text-sm rounded"
                  disabled={p.hidePosition}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase">Department</label>
                  <label className="flex items-center gap-1 text-[9px]">
                    <input
                      type="checkbox"
                      checked={p.hideDepartment}
                      onChange={(e) => handleChange(idx, 'hideDepartment', e.target.checked)}
                      className="w-3 h-3"
                    />
                    Hide
                  </label>
                </div>
                <input
                  value={p.department}
                  onChange={(e) => handleChange(idx, 'department', e.target.value)}
                  className="mt-1 w-full border px-3 py-2 text-sm rounded"
                  disabled={p.hideDepartment}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase">Reporting Manager</label>
                  <label className="flex items-center gap-1 text-[9px]">
                    <input
                      type="checkbox"
                      checked={p.hideReportingManager}
                      onChange={(e) => handleChange(idx, 'hideReportingManager', e.target.checked)}
                      className="w-3 h-3"
                    />
                    Hide
                  </label>
                </div>
                <input
                  value={p.reportingManager}
                  onChange={(e) => handleChange(idx, 'reportingManager', e.target.value)}
                  className="mt-1 w-full border px-3 py-2 text-sm rounded"
                  disabled={p.hideReportingManager}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase">Location</label>
                  <label className="flex items-center gap-1 text-[9px]">
                    <input
                      type="checkbox"
                      checked={p.hideLocation}
                      onChange={(e) => handleChange(idx, 'hideLocation', e.target.checked)}
                      className="w-3 h-3"
                    />
                    Hide
                  </label>
                </div>
                <input
                  value={p.location}
                  onChange={(e) => handleChange(idx, 'location', e.target.value)}
                  className="mt-1 w-full border px-3 py-2 text-sm rounded"
                  disabled={p.hideLocation}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase">Internship Completion Title</label>
                <input
                  value={p.internshipCompletionTitle}
                  onChange={(e) => handleChange(idx, 'internshipCompletionTitle', e.target.value)}
                  className="mt-1 w-full border px-3 py-2 text-sm rounded"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase">Signature Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  handleChange(idx, 'signatureImage', reader.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
            className="mt-1 w-full text-sm"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase">Content</label>
          <textarea
            ref={(el) => (textareaRefs.current[idx] = el)}
            value={p.certificateContent}
            onChange={(e) => handleChange(idx, 'certificateContent', e.target.value)}
            className="mt-1 w-full h-32 border px-3 py-2 text-sm rounded"
          />
          <select
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return;
              const textarea = textareaRefs.current[idx];
              if (!textarea) return;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const currentText = p.certificateContent;
              let newText;
              if (start !== null && end !== null) {
                newText = currentText.substring(0, start) + value + currentText.substring(end);
              } else {
                newText = currentText + " " + value;
              }
              handleChange(idx, "certificateContent", newText);
              setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + value.length;
                textarea.focus();
              }, 0);
            }}
            className="mt-2 w-full text-sm border rounded px-2 py-1"
          >
            <option value="">-- Insert Field --</option>
            <option value="{{student Name}}">Student Name</option>
            <option value="{{college Name}}">College Name</option>
            <option value="{{from Date}}">From Date</option>
            <option value="{{to Date}}">To Date</option>
            <option value="{{project Title}}">Project Title</option>
            <option value="{{internship Title}}">Internship Title</option>
            <option value="{{position}}">Position</option>
            <option value="{{department}}">Department</option>
            <option value="{{reportingManager}}">Reporting Manager</option>
            <option value="{{location}}">Location</option>
            <option value="{{internship Completion Title}}">Internship Completion Title</option>
          </select>
        </div>

        {p.certificateTitle.includes('ATTENDANCE') && (
          <div className="p-3 bg-white border rounded space-y-2">
            <label className="block text-[10px] font-bold text-blue-600 uppercase">Attendance Stats</label>
            <input
              placeholder="Total Days"
              value={p.attendanceTotalDays}
              onChange={(e) => handleChange(idx, 'attendanceTotalDays', e.target.value)}
              className="w-full border-b py-1 text-xs outline-none"
            />
            <input
              placeholder="Days Attended"
              value={p.attendanceDaysAttended}
              onChange={(e) => handleChange(idx, 'attendanceDaysAttended', e.target.value)}
              className="w-full border-b py-1 text-xs outline-none"
            />
            <input
              placeholder="Percentage"
              value={p.attendancePercentage}
              readOnly
              className="w-full border-b py-1 text-xs outline-none bg-gray-100"
            />
          </div>
        )}

        {!p.certificateTitle.includes('ACCEPTANCE') && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Wish Message</label>
            <textarea
              value={p.wishMessage}
              onChange={(e) => handleChange(idx, 'wishMessage', e.target.value)}
              className="mt-1 w-full h-20 rounded border border-slate-300 px-3 py-2 text-sm resize-none"
            />
          </div>
        )}
      </div>
    );
  };

  const isAttendance = page.certificateTitle.includes('ATTENDANCE');
  const isAcceptance = page.certificateTitle.includes('ACCEPTANCE');
  const sectionPadding = isAcceptance ? '150px 80px 60px 80px' : '180px 90px 80px 90px';

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-12">
          <div className="grid gap-6 lg:grid-cols-[400px_1fr] pb-8">
            {renderCertificateInputs(page, index)}
            <div className="flex flex-col items-center gap-4">
              <div className="w-full flex justify-end py-2">
                <button
                  onClick={() => downloadSinglePDF(index)}
                  className="bg-blue-900 text-white text-xs px-4 py-2 rounded-full shadow-md hover:bg-blue-800 transition-all"
                >
                  ⬇ Download PDF
                </button>
              </div>
              <span className="bg-blue-900 text-white px-4 py-1 rounded-full text-xs font-bold">{PAGE_LABELS[index]}</span>
              <section
                ref={setPageRef(index)}
                className="relative border border-slate-300 shadow-2xl bg-white flex flex-col"
                style={{
                  width: '794px',
                  height: '1123px',
                  backgroundImage: "url('/images/bg.png')",
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  fontFamily: "'Times New Roman', serif",
                  padding: sectionPadding,
                }}
              >
                <Watermark />
                {serialNumbers[index] && (
                  <div className="text-right text-[16px] font-bold text-black mb-1">
                    Serial No: {serialNumbers[index]}
                  </div>
                )}
                <div className="text-right text-[16px] font-bold text-black mb-6">
                  {formatDateForDisplay(page.date)}
                </div>
                <div className="text-center mb-2">
                  <h2 className="text-[20px] font-bold border-b-2 border-black inline-block pb-2 mb-2 uppercase tracking-tight">
                    {page.certificateTitle}
                  </h2>
                </div>
                <div>
                  <div
                    className={isAcceptance
                      ? "text-[15px] leading-[1.5] mb-3 text-justify text-black whitespace-pre-line"
                      : "text-[18px] leading-[1.9] mb-8 text-justify text-black whitespace-pre-line"}
                    style={isAcceptance ? undefined : { textIndent: "40px" }}
                    dangerouslySetInnerHTML={{
                      __html: parseContent(page.certificateContent, { ...page, studentName: reviewName[index] }),
                    }}
                  />
                  {isAttendance && (
                    <div className="mt-6 text-[16px] leading-[1.8] text-black">
                      <p className="mb-3 font-bold uppercase text-left">Attendance Details</p>
                      <div className="space-y-1 ml-4 text-left">
                        <p><span className="font-bold">Total No. of Days Allotted:</span> {page.attendanceTotalDays}</p>
                        <p><span className="font-bold">No. of Days Attended:</span> {page.attendanceDaysAttended}</p>
                        <p><span className="font-bold">Percentage of Attendance:</span> {page.attendancePercentage}</p>
                      </div>
                    </div>
                  )}
                  {!isAcceptance && (
                    <p
                      className="mt-8 text-center text-[17px] leading-[1.8] text-black font-normal"
                      dangerouslySetInnerHTML={{
                        __html: page.wishMessage.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      }}
                    />
                  )}
                </div>
                {isAcceptance ? (
                  <div className="flex flex-col items-start mt-6">
                    <div className="text-left">
                      {page.signatureImage && (
                        <img src={page.signatureImage} alt="signature" className="w-32 h-auto mb-2" />
                      )}
                      <p className="text-[14px] mt-2 font-bold">Mahalakshmi Ganesan</p>
                      <p className="text-[13px]">Director</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end mt-16">
                    <div className="pr-4 text-center">
                      {page.signatureImage && (
                        <img src={page.signatureImage} alt="signature" className="w-32 h-auto mb-2 mx-auto" />
                      )}
                      <p className="text-[15px] font-bold uppercase">{page.signatoryTitle}</p>
                    </div>
                  </div>
                )}
                {qrCodes[index] && (
                  <div style={{ marginTop: "-150px", marginLeft: "-3px" }}>
                    <img
                      src={qrCodes[index]}
                      alt="QR Code"
                      style={{ width: "120px", height: "120px" }}
                    />
                    <p style={{ fontSize: '16px', textAlign: 'start', marginLeft: "5px", marginTop: '2px', color: '#000' }}>
                      Scan QR to verify
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleCertificatePage;
import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { authHeaders } from '../auth';
import { API_BASE } from '../config';

export type CertificateFields = {
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
};

export type SavedCertificate = CertificateFields & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  serialNumber?: string;
  qrCode?: string;
};

export const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
};

export const defaultFields: CertificateFields = {
  studentName: "Ms SRIJANNADEVI V M",
  collegeName: "Rani Anna Government College for Women, Tirunelveli",
  fromDate: "2025-12-12",
  toDate: "2026-03-30",
  date: '2026-03-30',
  certificateTitle: 'ATTENDANCE CERTIFICATE',
  projectTitle: 'ENTERPRISE WORKFLOW AUTOMATION SYSTEM',
  certificateContent: 'This is to certify that {{student Name}} final year {{department}} student of {{college Name}} has successfully attended the Internship on "{{project Title}}" at PCS Software Solutions from {{from Date}} to {{to Date}}. During this period, the student was present and actively participated in all the scheduled sessions. The student has demonstrated consistent attendance and engagement throughout the period.',
  signatoryTitle: 'For PCS Software Solutions',
  attendanceTotalDays: '84 (exclude Sundays and other government holidays)',
  attendanceDaysAttended: '73',
  attendancePercentage: '87%',
  signatureImage: "/images/signature.png",
  wishMessage: "We wish every success in their future career.",
  internshipTitle: "Internship cum College Project",
  internshipCompletionTitle: "Internship Completion Certificate",
  position: "Intern – Project Trainee",
  department: "Web Development",
  reportingManager: "Surya G, Training Head",
  location: "Surandai-Tenkasi, Tamil Nadu",
  hideReportingManager: false,
  hidePosition: false,
  hideDepartment: false,
  hideLocation: false,
};

export const defaultPages: CertificateFields[] = [
  {
    ...defaultFields,
    certificateTitle: 'ATTENDANCE CERTIFICATE',
  },
  {
    ...defaultFields,
    certificateTitle: 'INTERNSHIP COMPLETION CERTIFICATE',
    certificateContent: `This is to certify that {{student Name}}, a student of {{college Name}} in {{department}}, has successfully completed the Internship on "{{project Title}}" under the guidance of PCS Software Solutions from {{from Date}} to {{to Date}}. The performance during this period was found to be Good.`,
    wishMessage: "We wish the student all the best in all future endeavours."
  },
  {
    ...defaultFields,
    certificateTitle: 'ACCEPTANCE CERTIFICATE',
    certificateContent: `Dear {{student Name}},

We are pleased to inform you that you have been selected to undergo an {{internship Title}} at **PCS Software Solutions**, as part of your academic curriculum.

**Internship & Project Details:**
• **Position:** {{position}}
• **Department:** {{department}}
• **Internship Duration:** {{from Date}} to {{to Date}}
• **College:** {{college Name}}
• **Reporting Manager:** {{reportingManager}}
• **Location:** {{location}}

This internship offers practical exposure and guided project work under professional mentorship, aligned with academic requirements and university standards. You are also expected to maintain professional conduct and follow company rules and confidentiality policies throughout the internship.

Upon successful completion, you will receive an {{internship Completion Title}} and a **Project Evaluation Letter**, and we look forward to supporting your academic and professional growth.

Warm regards,

**FOR PCS SOFTWARE SOLUTIONS**`
  }
];

type CertificateContextValue = {
  pagesData: CertificateFields[];
  qrCodes: string[];
  serialNumbers: string[];
  currentCertificateIds: Array<number | undefined>;
  reviewName: string[];
  adminCertificates: SavedCertificate[];
  certificateStats: Array<{ certificateTitle: string; count: number }>;
  saveStatus: string;
  loadedCertificateId: number | undefined;
  pendingScrollRef: { current: number | null };
  handleSaveCertificate: (index: number) => Promise<void>;
  loadIntoEditor: (c: SavedCertificate) => number;
  loadAdminCertificates: () => Promise<void>;
  handleChange: (index: number, key: keyof CertificateFields, value: any) => void;
  parseContent: (content: string, page: CertificateFields) => string;
};

const CertificateContext = createContext<CertificateContextValue | undefined>(undefined);

export const CertificateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [qrCodes, setQrCodes] = useState<string[]>(['', '', '']);
  const [serialNumbers, setSerialNumbers] = useState<string[]>(['', '', '']);
  const [pagesData, setPagesData] = useState<CertificateFields[]>(defaultPages);
  const [adminCertificates, setAdminCertificates] = useState<SavedCertificate[]>([]);
  const [certificateStats, setCertificateStats] = useState<Array<{ certificateTitle: string; count: number }>>([]);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [currentCertificateIds, setCurrentCertificateIds] = useState<Array<number | undefined>>([undefined, undefined, undefined]);
  const [loadedCertificateId, setLoadedCertificateId] = useState<number | undefined>(undefined);
  const loadedSnapshot = useRef<Array<CertificateFields | null>>([null, null, null]);
  const [reviewName, setReviewName] = useState<string[]>([defaultFields.studentName, defaultFields.studentName, defaultFields.studentName]);
  const pendingScrollRef = useRef<number | null>(null);

  const parseContent = (content: string, page: CertificateFields) => {
    let parsed = content;
    const isAcceptance = page.certificateTitle.includes('ACCEPTANCE');

    let positionText = page.position;
    let departmentText = page.department;
    let reportingManagerText = page.reportingManager;
    let locationText = page.location;

    if (page.hidePosition) positionText = '';
    if (page.hideDepartment) departmentText = '';
    if (page.hideReportingManager) reportingManagerText = '';
    if (page.hideLocation) locationText = '';

    parsed = parsed
      .replace(/{{student Name}}/g, `<strong>${page.studentName}</strong>`)
      .replace(/{{college Name}}/g, isAcceptance ? `${page.collegeName}` : `<strong>${page.collegeName}</strong>`)
      .replace(/{{from Date}}/g, isAcceptance ? `${formatDateForDisplay(page.fromDate)}` : `<strong>${formatDateForDisplay(page.fromDate)}</strong>`)
      .replace(/{{to Date}}/g, isAcceptance ? `${formatDateForDisplay(page.toDate)}` : `<strong>${formatDateForDisplay(page.toDate)}</strong>`)
      .replace(/{{project Title}}/g, `<strong>${page.projectTitle}</strong>`)
      .replace(/{{internship Title}}/g, `<strong>${page.internshipTitle}</strong>`)
      .replace(/{{internship Completion Title}}/g, `<strong>${page.internshipCompletionTitle}</strong>`)
      .replace(/{{position}}/g, positionText)
      .replace(/{{department}}/g, departmentText)
      .replace(/{{reportingManager}}/g, reportingManagerText)
      .replace(/{{location}}/g, locationText);

    if (page.hidePosition) {
      parsed = parsed.replace(/.*\*\*Position:\*\*.*\n?/g, '');
    }
    if (page.hideDepartment) {
      parsed = parsed.replace(/.*\*\*Department:\*\*.*\n?/g, '');
    }
    if (page.hideReportingManager) {
      parsed = parsed.replace(/.*\*\*Reporting Manager:\*\*.*\n?/g, '');
    }
    if (page.hideLocation) {
      parsed = parsed.replace(/.*\*\*Location:\*\*.*\n?/g, '');
    }

    parsed = parsed.replace(/\n\s*\n\s*\n/g, '\n\n');
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`);
    return parsed;
  };

  const handleSaveCertificate = async (index: number) => {
    const page = pagesData[index];
    const payload = { ...page, certificateTitle: page.certificateTitle.trim().replace(/\s+/g, " ").toUpperCase() };
    const snapshot = loadedSnapshot.current[index];
    const isEdit = !!snapshot && JSON.stringify(page) !== JSON.stringify(snapshot);
    const existingId = isEdit ? currentCertificateIds[index] : undefined;
    let endpoint;
    if (isEdit) {
      endpoint = `${API_BASE}/update.php?id=${existingId}`;
    } else {
      endpoint = `${API_BASE}/create.php`;
    }

    try {
      setSaveStatus(isEdit ? "Updating..." : "Saving...");
      const res = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");

      const saved = await res.json();

      // Update QR codes
      setQrCodes((prev) => {
        const copy = [...prev];
        if (index === 1) {
          copy[index] = saved.qrCode || '';
        } else if (index === 0) {
          copy[index] = isEdit ? (saved.qrCode || '') : '';
        } else {
          copy[index] = '';
        }
        return copy;
      });

      // Update serial numbers
      setSerialNumbers((prev) => {
        const copy = [...prev];
        copy[index] = saved.serialNumber || '';
        return copy;
      });

      setSaveStatus(`${isEdit ? 'Updated' : 'Saved'} id=${saved.id}`);

      toast.success(
        isEdit
          ? ' Certificate Updated Successfully!'
          : ' Certificate Saved Successfully!',
        {
          duration: 3000,
          position: 'top-right',
        }
      );

      // ALWAYS reset ID to undefined so next save is POST
      setCurrentCertificateIds((prev) => {
        const updated = [...prev];
        updated[index] = undefined;
        return updated;
      });
      // Clear the loaded snapshot so the next save behaves as Create
      loadedSnapshot.current[index] = null;

      // ALWAYS clear student name input (review keeps showing it)
      setPagesData((prev) => {
        const newData = [...prev];
        newData[index] = { ...newData[index], studentName: "" };
        return newData;
      });

      // Reload admin certificates list
      await loadAdminCertificates();
    } catch (e) {
      console.error(e);
      setSaveStatus("Save failed");
      toast.error('❌ Save Failed!', {
        duration: 3000,
        position: 'top-right',
      });
    }
  };

  const loadIntoEditor = (c: SavedCertificate) => {
    // If a different certificate is already loaded, clear it first
    if (loadedCertificateId !== undefined && loadedCertificateId !== c.id) {
      // Clear all pages back to defaults
      setPagesData(defaultPages);
      setCurrentCertificateIds([undefined, undefined, undefined]);
      loadedSnapshot.current = [null, null, null];
      setReviewName([defaultFields.studentName, defaultFields.studentName, defaultFields.studentName]);
    }

    // Map certificate type to editor page index
    let pageIndex = 0;
    const title = (c.certificateTitle || "").toUpperCase();
    if (title.includes("ACCEPTANCE")) pageIndex = 2;
    else if (title.includes("INTERNSHIP") || title.includes("PROJECT")) pageIndex = 1;
    else if (title.includes("ATTENDANCE")) pageIndex = 0;

    const loadedFields: CertificateFields = {
      studentName: c.studentName || "",
      collegeName: c.collegeName || "",
      fromDate: c.fromDate || "",
      toDate: c.toDate || "",
      date: c.date || "",
      certificateTitle: (c.certificateTitle || pagesData[pageIndex].certificateTitle).toUpperCase(),
      projectTitle: c.projectTitle || pagesData[pageIndex].projectTitle,
      certificateContent: c.certificateContent || pagesData[pageIndex].certificateContent,
      signatoryTitle: c.signatoryTitle || pagesData[pageIndex].signatoryTitle,
      attendanceTotalDays: c.attendanceTotalDays || pagesData[pageIndex].attendanceTotalDays,
      attendanceDaysAttended: c.attendanceDaysAttended || pagesData[pageIndex].attendanceDaysAttended,
      attendancePercentage: c.attendancePercentage || pagesData[pageIndex].attendancePercentage,
      signatureImage: c.signatureImage || pagesData[pageIndex].signatureImage,
      wishMessage: c.wishMessage || pagesData[pageIndex].wishMessage,
      internshipTitle: c.internshipTitle || pagesData[pageIndex].internshipTitle,
      internshipCompletionTitle: c.internshipCompletionTitle || pagesData[pageIndex].internshipCompletionTitle,
      position: c.position || pagesData[pageIndex].position,
      department: c.department || pagesData[pageIndex].department,
      reportingManager: c.reportingManager || pagesData[pageIndex].reportingManager,
      location: c.location || pagesData[pageIndex].location,
      hideReportingManager: !!c.hideReportingManager,
      hidePosition: !!c.hidePosition,
      hideDepartment: !!c.hideDepartment,
      hideLocation: !!c.hideLocation,
    };
    loadedSnapshot.current[pageIndex] = loadedFields;

    setPagesData((current) => {
      const copy = [...current];
      copy[pageIndex] = { ...loadedFields };
      return copy;
    });
    setReviewName((prev) => {
      const copy = [...prev];
      copy[pageIndex] = c.studentName || "";
      return copy;
    });
    setCurrentCertificateIds((prev) => {
      const copy = [...prev];
      copy[pageIndex] = c.id;
      return copy;
    });
    setLoadedCertificateId(c.id);
    setSaveStatus(`Loaded id=${c.id} into editor - Ready to Save`);
    setQrCodes((prev) => {
      const copy = [...prev];
      copy[pageIndex] = c.qrCode || '';
      return copy;
    });
    setSerialNumbers((prev) => {
      const copy = [...prev];
      copy[pageIndex] = c.serialNumber || '';
      return copy;
    });
    pendingScrollRef.current = pageIndex;
    return pageIndex;
  };

  const loadAdminCertificates = async () => {
    try {
      const [certRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/list.php`, { headers: authHeaders() }),
        fetch(`${API_BASE}/stats.php`, { headers: authHeaders() }),
      ]);
      if (!certRes.ok || !statsRes.ok) throw new Error("Load failed");
      const certData = await certRes.json();
      const statsData = await statsRes.json();
      setAdminCertificates(certData);
      setCertificateStats(statsData);
    } catch (e) {
      console.error(e);
      setSaveStatus("Unable to load certificates");
    }
  };

  const handleChange = (index: number, key: keyof CertificateFields, value: any) => {
    if (key === 'studentName') {
      setReviewName((prev) => {
        const copy = [...prev];
        copy[index] = value;
        return copy;
      });
    }
    setPagesData((current) =>
      current.map((page, pageIndex) => {
        if (pageIndex !== index) return page;

        let updatedPage = { ...page, [key]: value };

        if (key === 'attendanceTotalDays' || key === 'attendanceDaysAttended') {
          const total = parseInt(updatedPage.attendanceTotalDays);
          const attended = parseInt(updatedPage.attendanceDaysAttended);

          if (!isNaN(total) && !isNaN(attended) && total > 0) {
            const percentage = ((attended / total) * 100).toFixed(0);
            updatedPage.attendancePercentage = `${percentage}%`;
          } else {
            updatedPage.attendancePercentage = '';
          }
        }

        return updatedPage;
      })
    );
  };

  const value: CertificateContextValue = {
    pagesData,
    qrCodes,
    serialNumbers,
    currentCertificateIds,
    reviewName,
    adminCertificates,
    certificateStats,
    saveStatus,
    loadedCertificateId,
    pendingScrollRef,
    handleSaveCertificate,
    loadIntoEditor,
    loadAdminCertificates,
    handleChange,
    parseContent,
  };

  return <CertificateContext.Provider value={value}>{children}</CertificateContext.Provider>;
};

export const useCerts = () => {
  const ctx = useContext(CertificateContext);
  if (!ctx) throw new Error("useCerts must be used within CertificateProvider");
  return ctx;
};
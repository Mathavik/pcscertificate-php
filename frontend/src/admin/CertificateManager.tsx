import React, { useState, useEffect } from 'react';
import { SavedCertificate } from './CertificateContext';
import toast from 'react-hot-toast';

export type SavedCompletionCertificate = {
  id: number;
  certificateID: number;
  serialNumber: string;
  completionType: string;
  certificateTitle: string;
  studentName: string;
  courseTitle: string;
  fromDate: string | null;
  toDate: string | null;
  dateOfIssue: string | null;
  signatureImage: string | null;
  createdAt: string;
};

type CertificateManagerProps = {
  certificateStats: Array<{ certificateTitle: string; count: number }>;
  adminCertificates: SavedCertificate[];
  completionCertificates?: SavedCompletionCertificate[];
  saveStatus: string;
  onLoadSaved: () => void | Promise<void>;
  onLoadIntoEditor: (c: SavedCertificate) => void;
  onLoadCompletionIntoEditor?: (c: SavedCompletionCertificate) => void;
};

type CertificateManagerEntry = {
  id: number;
  source: 'certificate' | 'completion';
  certificateTitle: string;
  studentName?: string;
  collegeName?: string;
  fromDate?: string;
  toDate?: string;
  date?: string;
  serialNumber?: string;
  completionType?: string;
  certificateID?: number;
  certificate?: SavedCertificate;
};

const isCompletionCertificate = (title: string) =>
  title.trim().toUpperCase().startsWith('CERTIFICATE COMPLETION');

const CertificateManager: React.FC<CertificateManagerProps> = ({
  certificateStats,
  adminCertificates,
  completionCertificates = [],
  saveStatus,
  onLoadSaved,
  onLoadIntoEditor,
  onLoadCompletionIntoEditor,
}) => {
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); 
  const [selectedYear, setSelectedYear] = useState<string>('');   
  
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Search by student name
  const [searchQuery, setSearchQuery] = useState('');

  const PAGE_SIZE = 10;
  const [certificatePage, setCertificatePage] = useState(1);
  const [completionPage, setCompletionPage] = useState(1);
  const managerEntries: CertificateManagerEntry[] = [
    ...adminCertificates
      .filter((certificate) => !isCompletionCertificate(certificate.certificateTitle))
      .map((certificate) => ({
        id: certificate.id || 0,
        source: 'certificate' as const,
        certificateTitle: certificate.certificateTitle,
        studentName: certificate.studentName,
        collegeName: certificate.collegeName,
        fromDate: certificate.fromDate,
        toDate: certificate.toDate,
        date: certificate.date,
        certificate,
      })),
    ...completionCertificates.map((certificate) => ({
      id: certificate.id,
      source: 'completion' as const,
      certificateTitle: certificate.certificateTitle,
      studentName: certificate.studentName,
      date: certificate.dateOfIssue || certificate.createdAt?.slice(0, 10) || '',
      serialNumber: certificate.serialNumber,
      completionType: certificate.completionType,
      certificateID: certificate.certificateID,
    })),
  ];

  useEffect(() => {
    setCertificatePage(1);
    setCompletionPage(1);
  }, [selectedTitle, selectedYear, selectedMonth, searchQuery, completionCertificates.length]);

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

  const parseCertDate = (raw?: string): { day: string; month: string; year: string } | null => {
    if (!raw) return null;
    // Support DD.MM.YYYY
    const dotParts = raw.split('.');
    if (dotParts.length === 3 && dotParts[2].length === 4) {
      return { day: dotParts[0], month: dotParts[1], year: dotParts[2] };
    }
    // Support YYYY-MM-DD
    if (raw.includes('-')) {
      const parts = raw.split('-');
      if (parts.length === 3) return { day: parts[2], month: parts[1], year: parts[0] };
    }
    return null;
  };

  const handleLoadClick = (certificate: SavedCertificate) => {
    onLoadIntoEditor(certificate);
    toast.success(`${certificate.studentName || 'Certificate'} loaded successfully!`, {
      duration: 3000,
      position: 'top-right',
    });
  };

  const availableYears = Array.from(
    new Set(
      managerEntries
        .map((c) => {
          const parsed = parseCertDate(c.date);
          return parsed ? parsed.year : null;
        })
        .filter((year): year is string => year !== null)
    )
  ).sort();

  const monthsList = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isCompletionTitleSelected = selectedTitle
    ? isCompletionCertificate(selectedTitle)
    : false;

  const filteredCertificates = managerEntries.filter((c) => {
    if (c.source === 'certificate' && c.certificateTitle === 'ATTENDANCE CERTIFICATE') return false;

    const matchesTitle = selectedTitle ? c.certificateTitle === selectedTitle : true;

    // Only apply month/year filtering when a filter is actually selected
    const parsed = parseCertDate(c.date);
    const matchesYear = selectedYear ? (parsed ? parsed.year === selectedYear : false) : true;
    const matchesMonth = selectedMonth ? (parsed ? parsed.month === selectedMonth : false) : true;

    // Case-insensitive partial match on student name
    const matchesSearch = normalizedQuery
      ? `${c.studentName ?? ''} ${c.serialNumber ?? ''}`.toLowerCase().includes(normalizedQuery)
      : true;

    return matchesTitle && matchesYear && matchesMonth && matchesSearch;
  });

  const clearAllFilters = () => {
    setSelectedTitle(null);
    setSelectedMonth('');
    setSelectedYear('');
    setSearchQuery('');
  };

  const activeFilterCount =
    (selectedTitle ? 1 : 0) +
    (selectedYear ? 1 : 0) +
    (selectedMonth ? 1 : 0) +
    (normalizedQuery ? 1 : 0);

  const filteredSavedCompletion = completionCertificates.filter((completion) =>
    filteredCertificates.some((entry) => entry.source === 'completion' && entry.id === completion.id)
  );
  const filteredSavedCertificates = filteredCertificates.filter(
    (entry) => entry.source === 'certificate'
  );
  const certificateTotalPages = Math.max(1, Math.ceil(filteredSavedCertificates.length / PAGE_SIZE));
  const completionTotalPages = Math.max(1, Math.ceil(filteredSavedCompletion.length / PAGE_SIZE));
  const safeCertificatePage = Math.min(certificatePage, certificateTotalPages);
  const safeCompletionPage = Math.min(completionPage, completionTotalPages);
  const certificateStartIndex = (safeCertificatePage - 1) * PAGE_SIZE;
  const completionStartIndex = (safeCompletionPage - 1) * PAGE_SIZE;
  const paginatedCertificates = filteredSavedCertificates.slice(
    certificateStartIndex,
    certificateStartIndex + PAGE_SIZE
  );
  const paginatedCompletions = filteredSavedCompletion.slice(
    completionStartIndex,
    completionStartIndex + PAGE_SIZE
  );

  const renderPagination = (
    count: number,
    current: number,
    total: number,
    start: number,
    setPage: (page: number) => void
  ) => total > 1 ? (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-600">
        Showing {start + 1}–{Math.min(start + PAGE_SIZE, count)} of {count}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(current - 1)}
          disabled={current <= 1}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹ Prev
        </button>
        {Array.from({ length: total }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setPage(page)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${page === current ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setPage(current + 1)}
          disabled={current >= total}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next ›
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Certificate Manager</h2>
          <p className="text-sm text-slate-600">Load saved certificates and review stored entries.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLoadSaved} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">🔄 Load Saved</button>
          {saveStatus && <span className="text-sm text-slate-700">{saveStatus}</span>}
        </div>
      </div>
 {/* Certificate Stats */}
      {(certificateStats.length > 0 || completionCertificates.length > 0) && (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ...certificateStats.filter(
              (stat) =>
                stat.certificateTitle !== 'ATTENDANCE CERTIFICATE' &&
                !isCompletionCertificate(stat.certificateTitle)
            ),
            ...(completionCertificates.length > 0
              ? [{
                  certificateTitle: 'CERTIFICATE COMPLETION',
                  count: completionCertificates.length,
                }]
              : []),
          ]
            .map((stat) => (
              <div
                key={stat.certificateTitle}
                onClick={() => setSelectedTitle(selectedTitle === stat.certificateTitle ? null : stat.certificateTitle)}
                className={`rounded-lg p-4 text-center cursor-pointer transition-all ${selectedTitle === stat.certificateTitle ? 'bg-blue-500 text-white shadow-lg scale-105' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                <p className={`text-xs uppercase font-semibold ${selectedTitle === stat.certificateTitle ? 'text-white' : 'text-slate-600'}`}>{stat.certificateTitle}</p>
                <p className={`text-2xl font-bold ${selectedTitle === stat.certificateTitle ? 'text-white' : 'text-blue-900'}`}>{stat.count}</p>
              </div>
            ))}
        </div>
      )}
      {/* Filter toggle button */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {isFilterOpen ? 'Hide Filter' : 'Filter'}
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
              {activeFilterCount}
            </span>
          )}
          <span className={`text-xs transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
      </div>

      {/* Date Filters */}
      {isFilterOpen && (
      <div className="mt-4 flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 z-50 relative">
        {/* YEAR FILTER */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filter Year</label>
          <button
            type="button"
            onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }}
            className="flex items-center justify-between w-40 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none text-left"
          >
            <span>{selectedYear ? selectedYear : 'All Years'}</span>
            <span className="text-xs text-slate-400">▼</span>
          </button>

          {isYearOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsYearOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-40 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl z-20 py-1">
                <button
                  onClick={() => { setSelectedYear(''); setIsYearOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${selectedYear === '' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                >
                  All Years
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => { setSelectedYear(year); setIsYearOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${selectedYear === year ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* MONTH FILTER */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filter Month BY Date Feild</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
              className="flex items-center justify-between w-44 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none text-left"
            >
              <span>{selectedMonth ? monthsList.find(m => m.value === selectedMonth)?.label : 'All Months'}</span>
              <span className="text-xs text-slate-400">▼</span>
            </button>
            {selectedMonth && (
              <span className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                total certificates: {filteredCertificates.length}
              </span>
            )}
          </div>

          {isMonthOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMonthOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-44 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl z-20 py-1">
                <button
                  onClick={() => { setSelectedMonth(''); setIsMonthOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${selectedMonth === '' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                >
                  All Months
                </button>
                {monthsList.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => { setSelectedMonth(m.value); setIsMonthOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${selectedMonth === m.value ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* SEARCH BY STUDENT NAME */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Search Student Name</label>
          <div className="relative w-64">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Student Name..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 pr-8 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {(selectedTitle || selectedYear || selectedMonth || normalizedQuery) && (
          <button
            onClick={clearAllFilters}
            className="mt-5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-2 transition-all"
          >
            ❌ Clear All Filters
          </button>
        )}
      </div>
      )}

     

      {filteredCertificates.length === 0 ? (
        <div className="mt-6 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
          No certificates found matching the selected filters.
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="ml-2 text-blue-600 font-semibold underline hover:text-blue-800"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <>
          {(selectedTitle || selectedYear || selectedMonth || normalizedQuery) && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50/50 px-3 py-2 text-sm text-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Active Filters:</span>
                {selectedTitle && <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">{selectedTitle}</span>}
                {selectedYear && <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">Year: {selectedYear}</span>}
                {selectedMonth && (
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                    Month: {monthsList.find((month) => month.value === selectedMonth)?.label}
                  </span>
                )}
                {normalizedQuery && (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                    Student Name: {searchQuery.trim()}
                  </span>
                )}
              </div>
            </div>
          )}

          {(!selectedTitle || isCompletionTitleSelected) && (
            <section className="mt-5">
              <h3 className="mb-2 text-sm font-bold uppercase text-slate-700">CERTIFICATE COMPLETION</h3>
              {filteredSavedCompletion.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-600">
                  No Certificate Completion records found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">ID</th>
                        <th className="px-3 py-2 text-left font-semibold">Student / Serial No</th>
                        <th className="px-3 py-2 text-left font-semibold">Course Type</th>
                        <th className="px-3 py-2 text-left font-semibold">Certificate</th>
                        <th className="px-3 py-2 text-left font-semibold">Date</th>
                        <th className="px-3 py-2 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paginatedCompletions.map((completion) => (
                        <tr key={`completion-${completion.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-3 py-2">{completion.id}</td>
                          <td className="px-3 py-2">
                            {completion.studentName}
                            <div className="text-xs text-slate-500">{completion.serialNumber}</div>
                          </td>
                          <td className="px-3 py-2">{completion.completionType}</td>
                          <td className="px-3 py-2">{completion.certificateTitle}</td>
                          <td className="px-3 py-2 font-medium text-slate-600">
                            {formatDateForDisplay(completion.dateOfIssue || completion.createdAt?.slice(0, 10) || '')}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => onLoadCompletionIntoEditor?.(completion)}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs text-white transition-colors hover:bg-emerald-700"
                            >
                              Load
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(
                    filteredSavedCompletion.length,
                    safeCompletionPage,
                    completionTotalPages,
                    completionStartIndex,
                    setCompletionPage
                  )}
                </div>
              )}
            </section>
          )}

          {(!selectedTitle || !isCompletionTitleSelected) && (
            <section className="mt-6">
              <h3 className="mb-2 text-sm font-bold uppercase text-slate-700">
                {selectedTitle || 'INTERNSHIP COMPLETION CERTIFICATE'}
              </h3>
              {filteredSavedCertificates.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-600">
                  No certificate records found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">ID</th>
                        <th className="px-3 py-2 text-left font-semibold">Student</th>
                        <th className="px-3 py-2 text-left font-semibold">College</th>
                        <th className="px-3 py-2 text-left font-semibold">Certificate</th>
                        <th className="px-3 py-2 text-left font-semibold">From</th>
                        <th className="px-3 py-2 text-left font-semibold">To</th>
                        <th className="px-3 py-2 text-left font-semibold">Date</th>
                        <th className="px-3 py-2 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paginatedCertificates.map((entry) => (
                        <tr key={`certificate-${entry.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-3 py-2">{entry.id}</td>
                          <td className="px-3 py-2">{entry.studentName}</td>
                          <td className="px-3 py-2">{entry.collegeName}</td>
                          <td className="px-3 py-2">{entry.certificateTitle}</td>
                          <td className="px-3 py-2">{formatDateForDisplay(entry.fromDate || '')}</td>
                          <td className="px-3 py-2">{formatDateForDisplay(entry.toDate || '')}</td>
                          <td className="px-3 py-2 font-medium text-slate-600">
                            {formatDateForDisplay(entry.date || '')}
                          </td>
                          <td className="px-3 py-2">
                            {entry.certificate && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (entry.certificate) handleLoadClick(entry.certificate);
                                }}
                                className="rounded bg-emerald-600 px-2 py-1 text-xs text-white transition-colors hover:bg-emerald-700"
                              >
                                Load
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(
                    filteredSavedCertificates.length,
                    safeCertificatePage,
                    certificateTotalPages,
                    certificateStartIndex,
                    setCertificatePage
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}

    </div>
  );
};

export default CertificateManager;
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import CertificatePreview from './CertificatePreview';
import { authHeaders } from '../auth';
import { API_BASE } from '../config';

type CollegeCertificate = {
  id: number;
  studentName: string;
  collegeName: string;
  certificateTitle: string;
  internshipTitle: string;
  department: string;
  fromDate: string;
  toDate: string;
  date: string;
  serialNumber: string;
};

const CollegeCertificates: React.FC = () => {
  const [colleges, setColleges] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [certificates, setCertificates] = useState<CollegeCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [previewCertId, setPreviewCertId] = useState<number | null>(null);
  const [selectedCertTitle, setSelectedCertTitle] = useState<string>('');
  const [selectedInternshipTitle, setSelectedInternshipTitle] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [isCertTitleOpen, setIsCertTitleOpen] = useState(false);
  const [isInternshipTitleOpen, setIsInternshipTitleOpen] = useState(false);
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);

  // Search by student name
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCollege, selectedCertTitle, selectedInternshipTitle, selectedDepartment, searchQuery, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const res = await fetch(`${API_BASE}/colleges.php`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load colleges');
      const data = await res.json();
      setColleges(data);
    } catch (e) {
      toast.error('Failed to load college list');
    } finally {
      setCollegesLoading(false);
    }
  };

  const fetchCertificates = async (college: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/college_certificates.php?collegeName=${encodeURIComponent(college)}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load certificates');
      const data = await res.json();
      setCertificates(data);
    } catch (e) {
      toast.error('Failed to load certificates');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCollegeSelect = (college: string) => {
    setSelectedCollege(college);
    setIsDropdownOpen(false);
    setSelectedCertTitle('');
    setSelectedInternshipTitle('');
    setSelectedDepartment('');
    setSearchQuery('');
    setSelectedYear('');
    setSelectedMonth('');
    setIsFilterOpen(false);
    if (college) {
      fetchCertificates(college);
    } else {
      setCertificates([]);
    }
  };

  const handleView = (cert: CollegeCertificate) => {
    setPreviewCertId(cert.id);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dateStr;
  };

  const certificateTitles = Array.from(
    new Set(certificates.map((c) => c.certificateTitle).filter(Boolean))
  ).sort();

  const internshipTitles = Array.from(
    new Set(certificates.map((c) => c.internshipTitle).filter(Boolean))
  ).sort();

  const departments = Array.from(
    new Set(certificates.map((c) => c.department).filter(Boolean))
  ).sort();

  const parseCertDate = (raw: string): { day: string; month: string; year: string } | null => {
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

  const availableYears = Array.from(
    new Set(
      certificates
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

  const filteredCertificates = certificates.filter((c) => {
    const matchesCertTitle = selectedCertTitle ? c.certificateTitle === selectedCertTitle : true;
    const matchesInternshipTitle = selectedInternshipTitle ? (c.internshipTitle || '') === selectedInternshipTitle : true;
    const matchesDepartment = selectedDepartment ? (c.department || '') === selectedDepartment : true;
    // Case-insensitive partial match on student name
    const matchesSearch = normalizedQuery
      ? String(c.studentName ?? '').toLowerCase().includes(normalizedQuery)
      : true;

    // Only apply month/year filtering when a filter is actually selected
    const parsed = parseCertDate(c.date);
    const matchesYear = selectedYear ? (parsed ? parsed.year === selectedYear : false) : true;
    const matchesMonth = selectedMonth ? (parsed ? parsed.month === selectedMonth : false) : true;

    return matchesCertTitle && matchesInternshipTitle && matchesDepartment && matchesSearch && matchesYear && matchesMonth;
  });

  const distinctStudentCountForInternship = (title: string) =>
    new Set(
      certificates
        .filter((c) => (c.internshipTitle || '') === title)
        .map((c) => c.studentName)
    ).size;

  const clearFilters = () => {
    setSelectedCertTitle('');
    setSelectedInternshipTitle('');
    setSelectedDepartment('');
    setSearchQuery('');
    setSelectedYear('');
    setSelectedMonth('');
  };

  const hasActiveSearch = !!searchQuery.trim();

  const activeFilterCount =
    (selectedCertTitle ? 1 : 0) +
    (selectedInternshipTitle ? 1 : 0) +
    (selectedDepartment ? 1 : 0) +
    (selectedYear ? 1 : 0) +
    (selectedMonth ? 1 : 0) +
    (hasActiveSearch ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(filteredCertificates.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedCertificates = filteredCertificates.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">College Certificates</h1>
        <p className="text-sm text-slate-500 mt-1">Select a college to view all issued certificates</p>
      </div>

      {/* Certificate Preview */}
      {previewCertId && (
        <CertificatePreview
          certificateId={previewCertId}
          onClose={() => setPreviewCertId(null)}
        />
      )}

      {/* College Dropdown + Total Count */}
      <div className="mb-6 relative z-[60]">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          Select College
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={collegesLoading}
          className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400 focus:border-blue-500 focus:outline-none transition-colors"
        >
          <span className={selectedCollege ? 'text-slate-800' : 'text-slate-400'}>
            {collegesLoading
              ? 'Loading colleges...'
              : selectedCollege
              ? selectedCollege
              : '-- Select a College --'}
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute top-full left-0 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl z-20 py-1">
              <button
                onClick={() => handleCollegeSelect('')}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 transition-colors ${
                  selectedCollege === '' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
                }`}
              >
                -- All Colleges --
              </button>
              {colleges.map((college) => (
                <button
                  key={college}
                  onClick={() => handleCollegeSelect(college)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 transition-colors ${
                    selectedCollege === college ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
                  }`}
                >
                  {college}
                </button>
              ))}
            </div>
          </>
        )}
          </div>

          {/* Total count badge next to college dropdown */}
          {selectedCollege && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</span>
              <span className="text-2xl font-bold text-blue-700 leading-none">{certificates.length}</span>
            </div>
          )}

          {/* Filter toggle button - right aligned in the same row */}
          {certificates.length > 0 && (
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="ml-auto inline-flex items-center gap-2 self-start rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
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
          )}
        </div>
      </div>

      {/* Certificate & Internship Title Filters */}
      {selectedCollege && certificates.length > 0 && isFilterOpen && (
        <div className="mb-6 flex flex-wrap items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 z-50 relative">
          {/* Certificate Title Filter */}
          <div className="flex flex-col gap-1 relative">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Filter Certificate
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsCertTitleOpen(!isCertTitleOpen); setIsInternshipTitleOpen(false); setIsDepartmentOpen(false); }}
                className="flex items-center justify-between w-60 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none text-left"
              >
                <span className="truncate">{selectedCertTitle || '-- All Certificates --'}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isCertTitleOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {selectedCertTitle && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Count</span>
                  <span className="text-lg font-bold text-blue-700 leading-none">
                    {certificates.filter((c) => c.certificateTitle === selectedCertTitle).length}
                  </span>
                </div>
              )}
            </div>
            {isCertTitleOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsCertTitleOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-60 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl z-20 py-1">
                  <button
                    onClick={() => { setSelectedCertTitle(''); setIsCertTitleOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${selectedCertTitle === '' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                  >
                    -- All Certificates --
                  </button>
                  {certificateTitles.map((title) => (
                    <button
                      key={title}
                      onClick={() => { setSelectedCertTitle(title); setIsCertTitleOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${selectedCertTitle === title ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Internship Title Filter */}
          <div className="flex flex-col gap-1 relative">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Filter Internship Title
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsInternshipTitleOpen(!isInternshipTitleOpen); setIsCertTitleOpen(false); setIsDepartmentOpen(false); }}
                className="flex items-center justify-between w-72 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none text-left"
              >
                <span className="truncate">{selectedInternshipTitle || '-- All Internship Titles --'}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isInternshipTitleOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {selectedInternshipTitle && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Students</span>
                  <span className="text-lg font-bold text-blue-700 leading-none">
                    {distinctStudentCountForInternship(selectedInternshipTitle)}
                  </span>
                </div>
              )}
            </div>
            {isInternshipTitleOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsInternshipTitleOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-72 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl z-20 py-1">
                  <button
                    onClick={() => { setSelectedInternshipTitle(''); setIsInternshipTitleOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${selectedInternshipTitle === '' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                  >
                    -- All Internship Titles --
                  </button>
                  {internshipTitles.map((title) => (
                    <button
                      key={title}
                      onClick={() => { setSelectedInternshipTitle(title); setIsInternshipTitleOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${selectedInternshipTitle === title ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Department Filter */}
          <div className="flex flex-col gap-1 relative">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Filter Department
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsDepartmentOpen(!isDepartmentOpen); setIsCertTitleOpen(false); setIsInternshipTitleOpen(false); }}
                className="flex items-center justify-between w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none text-left"
              >
                <span className="truncate">{selectedDepartment || '-- All Departments --'}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDepartmentOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {selectedDepartment && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-1 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Count</span>
                  <span className="text-lg font-bold text-purple-700 leading-none">
                    {certificates.filter((c) => (c.department || '') === selectedDepartment).length}
                  </span>
                </div>
              )}
            </div>
            {isDepartmentOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDepartmentOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl z-20 py-1">
                  <button
                    onClick={() => { setSelectedDepartment(''); setIsDepartmentOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${selectedDepartment === '' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                  >
                    -- All Departments --
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => { setSelectedDepartment(dept); setIsDepartmentOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${selectedDepartment === dept ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* YEAR FILTER */}
          <div className="flex flex-col gap-1 relative">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Filter Year
            </label>
            <button
              type="button"
              onClick={() => { setIsYearOpen(!isYearOpen); setIsCertTitleOpen(false); setIsInternshipTitleOpen(false); setIsDepartmentOpen(false); setIsMonthOpen(false); }}
              className="flex items-center justify-between w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none text-left"
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
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Filter Month BY Date Feild
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsMonthOpen(!isMonthOpen); setIsCertTitleOpen(false); setIsInternshipTitleOpen(false); setIsDepartmentOpen(false); setIsYearOpen(false); }}
                className="flex items-center justify-between w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none text-left"
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
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Search Student Name
            </label>
            <div className="relative w-64">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Student Name..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {(selectedCertTitle || selectedInternshipTitle || selectedDepartment || selectedYear || selectedMonth || hasActiveSearch) && (
            <button
              onClick={clearFilters}
              className="mt-5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-2 transition-all"
            >
              ❌ Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {!selectedCollege ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Select a college from the dropdown to view certificates
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading certificates...</div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          No certificates found for this college
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          No certificates found matching the selected filters.
          <button onClick={clearFilters} className="ml-2 text-blue-600 font-semibold underline hover:text-blue-800">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {selectedCollege}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Certificate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Internship Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">From</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">To</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{cert.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{cert.studentName}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        {cert.certificateTitle}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{cert.internshipTitle || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(cert.fromDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(cert.toDate)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(cert.date)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleView(cert)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-3 py-1.5 rounded font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-600">
                Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredCertificates.length)} of {filteredCertificates.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ‹ Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${pg === safePage ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CollegeCertificates;

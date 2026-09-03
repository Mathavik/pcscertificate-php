import React, { useState } from 'react';
import { SavedCertificate } from '../pages/certificate';
// 1. Import toast and Toaster
import toast, { Toaster } from 'react-hot-toast';

type AdminDashboardProps = {
  certificateStats: Array<{ certificateTitle: string; count: number }>;
  adminCertificates: SavedCertificate[];
  saveStatus: string;
  onLoadSaved: () => void;
  onLoadIntoEditor: (c: SavedCertificate) => void;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  certificateStats,
  adminCertificates,
  saveStatus,
  onLoadSaved,
  onLoadIntoEditor,
}) => {
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); 
  const [selectedYear, setSelectedYear] = useState<string>('');   
  
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

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

  // Load button click handler with Toast
  const handleLoadClick = (certificate: SavedCertificate) => {
    onLoadIntoEditor(certificate);
    // Student பெயர் அல்லது ID-ஐ வைத்து Toast message-ஐக் காண்பிக்கிறோம்
    toast.success(`${certificate.studentName || 'Certificate'} loaded successfully!`, {
      duration: 3000,
      position: 'top-right',
    });
  };

  const availableYears = Array.from(
    new Set(
      adminCertificates
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

  const filteredCertificates = adminCertificates.filter((c) => {
    if (c.certificateTitle === 'ATTENDANCE CERTIFICATE') return false;

    const matchesTitle = selectedTitle ? c.certificateTitle === selectedTitle : true;

    // Only apply month/year filtering when a filter is actually selected
    const parsed = parseCertDate(c.date);
    const matchesYear = selectedYear ? (parsed ? parsed.year === selectedYear : false) : true;
    const matchesMonth = selectedMonth ? (parsed ? parsed.month === selectedMonth : false) : true;

    return matchesTitle && matchesYear && matchesMonth;
  });

  const clearAllFilters = () => {
    setSelectedTitle(null);
    setSelectedMonth('');
    setSelectedYear('');
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      {/* 2. Add Toaster Component at the root level of your return JSX */}
      <Toaster />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Admin Dashboard</h2>
          <p className="text-sm text-slate-600">Load saved certificates and review stored entries.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLoadSaved} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">🔄 Load Saved</button>
          {saveStatus && <span className="text-sm text-slate-700">{saveStatus}</span>}
        </div>
      </div>

      {/* Date Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 z-50 relative">
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
          <button
            type="button"
            onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
            className="flex items-center justify-between w-44 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none text-left"
          >
            <span>{selectedMonth ? monthsList.find(m => m.value === selectedMonth)?.label : 'All Months'}</span>
            <span className="text-xs text-slate-400">▼</span>
          </button>

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

        {(selectedTitle || selectedYear || selectedMonth) && (
          <button
            onClick={clearAllFilters}
            className="mt-5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-2 transition-all"
          >
            ❌ Clear All Filters
          </button>
        )}
      </div>

      {/* Certificate Stats */}
      {certificateStats.length > 0 && (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {certificateStats
            .filter((stat) => stat.certificateTitle !== 'ATTENDANCE CERTIFICATE') 
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

      {filteredCertificates.length === 0 ? (
        <div className="mt-6 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
          No certificates found matching the selected filters.
          {(selectedTitle || selectedYear || selectedMonth) && (
            <button
              onClick={clearAllFilters}
              className="ml-2 text-blue-600 font-semibold underline hover:text-blue-800"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          {(selectedTitle || selectedYear || selectedMonth) && (
            <div className="mb-3 flex items-center justify-between bg-blue-50/50 px-3 py-2 rounded-lg text-sm text-slate-700">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-semibold">Active Filters:</span>
                {selectedTitle && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{selectedTitle}</span>}
                {selectedYear && <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs">Year: {selectedYear}</span>}
                {selectedMonth && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                    Month: {monthsList.find(m => m.value === selectedMonth)?.label}
                  </span>
                )}
              </div>
            </div>
          )}

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
              {filteredCertificates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">{c.id}</td>
                  <td className="px-3 py-2">{c.studentName}</td>
                  <td className="px-3 py-2">{c.collegeName}</td>
                  <td className="px-3 py-2">{c.certificateTitle}</td>
                  <td className="px-3 py-2">{formatDateForDisplay(c.fromDate)}</td>
                  <td className="px-3 py-2">{formatDateForDisplay(c.toDate)}</td>
                  <td className="px-3 py-2 font-medium text-slate-600">{formatDateForDisplay(c.date)}</td>
                  <td className="px-3 py-2">
                    {/* 3. Replaced onClick with handleLoadClick */}
                    <button 
                      onClick={() => handleLoadClick(c)} 
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-2 py-1 rounded"
                    >
                      Load
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE = "http://192.168.18.173/pcsCertificate/backend/public";

type CertificateStat = {
  certificateTitle: string;
  count: number;
};

type RecentCertificate = {
  id: number;
  studentName: string;
  collegeName: string;
  certificateTitle: string;
  date: string;
  createdAt: string;
};

const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CertificateStat[]>([]);
  const [recentCerts, setRecentCerts] = useState<RecentCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch(`${API_BASE}/stats.php`),
        fetch(`${API_BASE}/list.php`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (listRes.ok) {
        const listData = await listRes.json();
        setRecentCerts(listData.slice(0, 5));
      }
    } catch (e) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const totalCertificates = stats.reduce((sum, s) => sum + s.count, 0);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dateStr;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toaster />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your certificate system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Certificates</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{totalCertificates}</p>
        </div>
        {stats.map((stat) => (
          <div key={stat.certificateTitle} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{stat.certificateTitle}</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/certificates/attendance')}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          + Create New Certificate
        </button>
      </div>

      {/* Recent Certificates */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Recent Certificates</h2>
        </div>
        {recentCerts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            No certificates found. Create your first one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase">ID</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase">Student</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase">College</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase">Certificate</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCerts.map((cert) => (
                  <tr key={cert.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3">{cert.id}</td>
                    <td className="px-5 py-3 font-medium">{cert.studentName}</td>
                    <td className="px-5 py-3 text-slate-600 truncate max-w-[200px]">{cert.collegeName}</td>
                    <td className="px-5 py-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        {cert.certificateTitle}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(cert.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;

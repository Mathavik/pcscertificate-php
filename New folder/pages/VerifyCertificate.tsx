import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// ✅ Correct API base – points to your PHP public folder
const API = "http://192.168.1.7/pcsCertificate/backend/public";

interface CertificateData {
    serialNumber: string;
    studentName: string;
    collegeName: string;
    projectTitle: string;
    certificateTitle: string;
    fromDate: string;
    toDate: string;
    issuedDate?: string;
    grade?: string;
}

export default function VerifyCertificate() {
    const { serialNumber } = useParams();
    const [certificate, setCertificate] = useState<CertificateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        // ✅ Correct endpoint: verify.php with serialNumber as query parameter
        fetch(`${API}/verify.php?serialNumber=${serialNumber}`)
            .then((res) => {
                if (!res.ok) throw new Error("Certificate not found");
                return res.json();
            })
            .then((data) => {
                setCertificate(data);
                setError(null);
            })
            .catch((err) => {
                setError(err.message || "Failed to verify certificate");
                setCertificate(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [serialNumber]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium text-lg">Verifying Certificate...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !certificate) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
                    <p className="text-gray-500 mb-6">{error || "Certificate not found. Please check the serial number and try again."}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition duration-200 shadow-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Header with Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <img
                            src="/images/Frame.png"
                            alt="PCS Software Solutions"
                            className="h-12 w-auto"
                        />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
                        Certificate Verification
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-base mt-1">
                        Verify the authenticity of your certificate
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100/50 border border-white/50 overflow-hidden">

                    {/* Card Header */}
                    <div className="bg-[#03045E] px-6 py-5">
                        <h2 className="text-white text-xl font-bold flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Verify Certificate
                        </h2>
                    </div>

                    {/* Verified Badge & Serial */}
                    <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-semibold text-sm">Verified Certificate</span>
                        </div>
                    </div>

                    {/* Certificate Details */}
                    <div className="p-6 sm:p-8">
                        {/* Serial Number Input-like display */}
                        <div className="mb-6">
                            <label className="block text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                                Certificate Serial Number
                            </label>
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                <span className="text-gray-800 font-mono text-sm font-medium tracking-wider">
                                    {certificate.serialNumber}
                                </span>
                            </div>
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                            <div className="col-span-1 sm:col-span-2">
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium block mb-1">
                                    Student Name
                                </label>
                                <p className="text-gray-800 text-lg font-semibold">
                                    {certificate.studentName}
                                </p>
                            </div>

                            <div className="col-span-1 sm:col-span-2">
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium block mb-1">
                                    College / Institution
                                </label>
                                <p className="text-gray-700 text-base">
                                    {certificate.collegeName}
                                </p>
                            </div>

                            <div className="col-span-1 sm:col-span-2">
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium block mb-1">
                                    Internship Title
                                </label>
                                <p className="text-gray-700 text-base bg-blue-50/50 px-4 py-2 rounded-lg border border-blue-100/50 inline-block">
                                    {certificate.projectTitle}
                                </p>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium block mb-1">
                                    Certificate Type
                                </label>
                                <p className="text-gray-700 text-sm font-medium">
                                    {certificate.certificateTitle}
                                </p>
                            </div>

                            {certificate.grade && (
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider font-medium block mb-1">
                                        Grade / Performance
                                    </label>
                                    <p className="text-gray-700 text-sm font-medium">
                                        {certificate.grade}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium block mb-1">
                                    From Date
                                </label>
                                <p className="text-gray-700 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {certificate.fromDate}
                                </p>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium block mb-1">
                                    To Date
                                </label>
                                <p className="text-gray-700 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {certificate.toDate}
                                </p>
                            </div>
                        </div>

                        {/* Verification footer */}
                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>This certificate is digitally verified</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                <span>Live verification</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-10 text-xs text-gray-400 border-t border-gray-200/50 pt-6">
                    <p>© {new Date().getFullYear()} PCS Software Solutions — All Rights Reserved.</p>
                </div>
            </div>
        </div>
    );
}
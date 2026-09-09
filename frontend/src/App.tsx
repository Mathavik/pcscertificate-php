import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import VerifyCertificate from "./pages/VerifyCertificate";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLayout from "./admin/AdminLayout";
import DashboardOverview from "./admin/DashboardOverview";
import CollegeCertificates from "./admin/CollegeCertificates";
import AttendanceCertificate from "./admin/AttendanceCertificate";
import InternshipCertificate from "./admin/InternshipCertificate";
import AcceptanceCertificate from "./admin/AcceptanceCertificate";
import CertificateManagerPage from "./admin/CertificateManagerPage";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function RequireAdmin({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("authUser") || "{}");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (user.role?.toLowerCase() !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-right" />

      <Routes>
        <Route
          path="/"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="certificates/attendance" element={<AttendanceCertificate />} />
          <Route path="certificates/internship" element={<InternshipCertificate />} />
          <Route path="certificates/acceptance" element={<AcceptanceCertificate />} />
          <Route path="certificates/manager" element={<CertificateManagerPage />} />
          <Route path="colleges" element={<CollegeCertificates />} />
        </Route>

        {/* Legacy /admin paths redirect to root equivalents */}
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/certificates/attendance" element={<Navigate to="/certificates/attendance" replace />} />
        <Route path="/admin/certificates/internship" element={<Navigate to="/certificates/internship" replace />} />
        <Route path="/admin/certificates/acceptance" element={<Navigate to="/certificates/acceptance" replace />} />
        <Route path="/admin/certificates/manager" element={<Navigate to="/certificates/manager" replace />} />
        <Route path="/admin/colleges" element={<Navigate to="/colleges" replace />} />

        <Route path="/verify/:serialNumber" element={<VerifyCertificate />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

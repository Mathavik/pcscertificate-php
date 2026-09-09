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
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-right" />

      <Routes>
        <Route path="/verify/:serialNumber" element={<VerifyCertificate />} />

        {/* Admin Routes with Sidebar */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="certificates/attendance" element={<AttendanceCertificate />} />
          <Route path="certificates/internship" element={<InternshipCertificate />} />
          <Route path="certificates/acceptance" element={<AcceptanceCertificate />} />
          <Route path="certificates/manager" element={<CertificateManagerPage />} />
          <Route path="colleges" element={<CollegeCertificates />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

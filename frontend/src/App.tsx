import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import CertificateGenerator from "./pages/certificate";
import VerifyCertificate from "./pages/VerifyCertificate";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLayout from "./admin/AdminLayout";
import DashboardOverview from "./admin/DashboardOverview";
import CollegeCertificates from "./admin/CollegeCertificates";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
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
        {/* <Route
          path="/"
          element={
            <RequireAuth>
              <CertificateGenerator />
            </RequireAuth>
          }
        /> */}
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
          <Route path="editor" element={<CertificateGenerator />} />
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

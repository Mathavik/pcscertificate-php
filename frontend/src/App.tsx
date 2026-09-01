import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import CertificateGenerator from "./pages/certificate";
import VerifyCertificate from "./pages/VerifyCertificate";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// பக்கத்தின் மேல் பகுதிக்கு ஸ்க்ரோல் செய்யும் காம்பொனென்ட்
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Protected route wrapper – user must be logged in
function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      {/* ScrollToTop காம்பொனென்ட்டை BrowserRouter-க்குள் சேர்த்துள்ளோம் */}
      <ScrollToTop />
      <Toaster position="top-right" />

      {/* Page Routes */}
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <CertificateGenerator />
            </RequireAuth>
          }
        />
        <Route path="/verify/:serialNumber" element={<VerifyCertificate />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <CertificateGenerator />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
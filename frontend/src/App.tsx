import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import CertificateGenerator from "./pages/certificate";
import VerifyCertificate from "./pages/VerifyCertificate";

// import Ban from "./pages/eventsPage/ban";

// பக்கத்தின் மேல் பகுதிக்கு ஸ்க்ரோல் செய்யும் காம்பொனென்ட்
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      {/* ScrollToTop காம்பொனென்ட்டை BrowserRouter-க்குள் சேர்த்துள்ளோம் */}
      <ScrollToTop />


      {/* Page Routes */}
      <Routes>
        <Route path="/" element={<CertificateGenerator />} />
         <Route path="/verify/:serialNumber" element={<VerifyCertificate />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
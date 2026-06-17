import { Route, Routes } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import UploadAdmission from "@/components/pages/UploadAdmission";
import AdmissionsList from "@/components/pages/AdmissionsList";
import AdmissionDetail from "@/components/pages/AdmissionDetail";
import AdmissionReview from "@/components/pages/AdmissionReview";

export default function RenderRoutes() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4">
        <Routes>
          <Route path="/" element={<UploadAdmission />} />
          <Route path="/admissions" element={<AdmissionsList />} />
          <Route path="/admissions/:id" element={<AdmissionDetail />} />
          <Route path="/admissions/:id/review" element={<AdmissionReview />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

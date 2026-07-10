import { Route, Routes } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import UploadAdmission from "@/components/pages/UploadAdmission";
import AdmissionsList from "@/components/pages/AdmissionsList";
import AdmissionDetail from "@/components/pages/AdmissionDetail";
import AdmissionReview from "@/components/pages/AdmissionReview";
import SignIn from "@/components/pages/SignIn";

export default function RenderRoutes() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4">
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <UploadAdmission />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admissions"
            element={
              <ProtectedRoute>
                <AdmissionsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admissions/:id"
            element={
              <ProtectedRoute>
                <AdmissionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admissions/:id/review"
            element={
              <ProtectedRoute>
                <AdmissionReview />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

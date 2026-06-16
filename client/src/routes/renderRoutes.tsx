import { Route, Routes } from "react-router-dom";
import Home from "@/components/pages/Home";

export default function RenderRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

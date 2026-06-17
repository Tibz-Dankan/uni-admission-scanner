import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import RenderRoutes from "./routes/renderRoutes";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <BrowserRouter>
      <RenderRoutes />
      <ToastContainer position="top-right" autoClose={4000} />
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter } from "react-router-dom";
import RenderRoutes from "./routes/renderRoutes";

function App() {
  return (
    <BrowserRouter>
      <RenderRoutes />
    </BrowserRouter>
  );
}

export default App;

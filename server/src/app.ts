import cors from "cors";
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import errorController from "./controllers/errorController";
import statusRoutes from "./routes/statusRoutes";
import admissionRoutes from "./routes/admissionRoutes";

const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://soroto-uni-scanner.netlify.app"
        : "*",
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
});
app.use(limiter);

app.use("/api/v1/status", statusRoutes);
app.use("/api/v1/admissions", admissionRoutes);

app.use((req, res) => {
  res.status(404).json({ status: "fail", message: "Route not found" });
});

app.use(errorController);

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

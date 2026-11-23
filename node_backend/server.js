import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const { PORT } = await import("./config.js");
const { connectDatabase } = await import("./db.js");
const { default: imageRoutes } = await import("./routes/imageRoutes.js");
const { default: authRoutes } = await import("./routes/authRoutes.js");
const { default: billingRoutes } = await import("./routes/billingRoutes.js");
const { default: jobRoutes } = await import("./routes/jobRoutes.js");

const app = express();

// nginx sits in front of this service; trust one proxy hop for client IPs.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({ message: "ImageSR Node.js Express backend is running" });
});

app.get("/healthz", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/jobs", jobRoutes);

app.use("/", imageRoutes);
app.use("/api/images", imageRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message = err.code === "LIMIT_FILE_SIZE" ? "File exceeds the 20 MB limit." : err.message;
    return res.status(status).json({ message });
  }
  if (err?.message?.startsWith("Unsupported image format")) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

await connectDatabase();

app.listen(PORT, () => {
  console.log(`Node backend running on http://localhost:${PORT}`);
});

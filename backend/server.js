const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDatabase = require("./config/database");
const { seedDatabase } = require("./database/seed");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

// ===============================
// CORS CONFIGURATION
// ===============================
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (/\.vercel\.app$/i.test(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);

// ===============================
// MIDDLEWARE
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// ROUTES
// ===============================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// ===============================
// HEALTH CHECK
// ===============================
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    environment: process.env.NODE_ENV,
    time: new Date()
  });
});

// ===============================
// ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Server error"
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    if (String(process.env.AUTO_SEED_ON_DEPLOY || "false").toLowerCase() === "true") {
      console.log("[startup] AUTO_SEED_ON_DEPLOY=true, checking seed state...");
      const seedResult = await seedDatabase({
        connect: false,
        wipeExisting: false,
        onlyIfEmpty: false,
        onlyIfNeverSeeded: true,
        exitOnFinish: false
      });

      if (seedResult?.skipped) {
        console.log(`[startup] seed skipped (${seedResult.reason || "unknown"}).`);
      } else {
        console.log(`[startup] seed executed successfully (commit=${seedResult?.seededByCommit || "unknown"}).`);
      }
    } else {
      console.log("[startup] AUTO_SEED_ON_DEPLOY=false, skipping auto-seed check.");
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

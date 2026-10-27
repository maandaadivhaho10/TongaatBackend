const express = require("express");
const http = require("http");

const pool = require("./config/database");
const fundingRoutes = require("./routes/fundingRoutes/fundingRoutes");

const cors = require("cors");
const cookieParser = require("cookie-parser");

// ======================================================
// SOCKET.IO
// ======================================================

const initializeChatSocket = require("./socket/chatSocket");

// ======================================================
// ROUTES
// ======================================================

const authRoutes = require("./routes/authRoutes");

const otpRoutes = require("./routes/otpRoutes");

const rfqRoutes = require("./routes/rfqRoutes");

const tenderRoutes = require("./routes/tenderRoutes");

const tenderResponseRoutes = require(
  "./routes/tenderResponseRoutes"
);

const supplierRoutes = require(
  "./routes/supplierRoutes"
);

const businessProfileRoutes = require(
  "./routes/RegisterSMME/businessProfileRoutes"
);

const businessMaturityRoutes = require(
  "./routes/RegisterSMME/businessMaturityRoutes"
);

const advisoryRoutes = require(
  "./routes/BissnessAdvisory/advisoryRoutes"
);

const taxComplianceRoutes = require(
  "./routes/taxCompliance/taxComplianceRoutes"
);

const tenderDetailsRoutes = require(
  "./routes/TenderRoutes/tenderDetailsRoutes"
);

const rfqDetailsRoutes = require(
  "./routes/RFQ/rfqDetailsRoutes"
);

const esdActivityRoutes = require(
  "./routes/ESDActities/esdActivityRoutes"
);

const authRoutes1 = require(
  "./routes/AuthRoutes/authRoutes"
);

const dashboardStatsRoutes = require(
  "./routes/DashboardstatsRoutes/dashboardStatsRoutes"
);

const chatRoutes = require(
  "./routes/ChatRoutes/chatRoutes"
);

const landingOpportunityRoutes =
    require("./routes/LandingOpportunityRoutes/landingOpportunityRoutes");
    const contactRoutes = require("./routes/ContactUs/contactRoutes");

// ======================================================
// INITIALIZE EXPRESS
// ======================================================

const app = express();

// ======================================================
// CORS CONFIGURATION
// ======================================================

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

app.use(cors(corsOptions));

// ======================================================
// GLOBAL MIDDLEWARE
// ======================================================

app.use(cookieParser());

app.use(express.json());

// Log incoming HTTP requests.
app.use((req, res, next) => {
  console.log(
    "Incoming request:",
    req.method,
    req.originalUrl
  );

  next();
});

// ======================================================
// AUTHENTICATION ROUTES
// ======================================================

app.use("/api/auth", authRoutes1);

app.use("/api/auth1", authRoutes);

app.use("/api/otp", otpRoutes);

// ======================================================
// SMME REGISTRATION ROUTES
// ======================================================

app.use(
  "/business-profile",
  businessProfileRoutes
);

app.use(
  "/business-maturity",
  businessMaturityRoutes
);

app.use(
  "/registration",
  require("./routes/RegisterSMME/registrationStatusRoutes")
);

// ======================================================
// BUSINESS ADVISORY ROUTES
// ======================================================

app.use(
  "/api/advisory",
  advisoryRoutes
);




// ======================================================
// RFQ ROUTES
// ======================================================

app.use(
  "/api/rfq",
  rfqRoutes
);

app.use(
  "/api/rfqs",
  rfqDetailsRoutes
);

// ======================================================
// TENDER ROUTES
// ======================================================

app.use(
  "/api/tender",
  tenderRoutes
);

app.use(
  "/api/tender-responses",
  tenderResponseRoutes
);

app.use(
  "/api/tenders",
  tenderDetailsRoutes
);

// ======================================================
// ESD ACTIVITIES / EVENTS
// ======================================================

app.use(
  "/api/esd-activities",
  esdActivityRoutes
);

// ======================================================
// SUPPLIER ROUTES
// ======================================================

app.use(
  "/api/suppliers",
  supplierRoutes
);

// ======================================================
// TAX COMPLIANCE ROUTES
// ======================================================

// Fixed: Added the missing "/" before api.
app.use(
  "/api/tax-compliance",
  taxComplianceRoutes
);

// ======================================================
// DASHBOARD ROUTES
// ======================================================



app.use(
  "/api/dashboard",
  dashboardStatsRoutes
);

// ======================================================
// CHAT APPLICATION ROUTES
// ======================================================

// POST /api/chat/conversations
// GET  /api/chat/conversations
// GET  /api/chat/conversations/:conversationId/messages
// POST /api/chat/conversations/:conversationId/messages

app.use(
  "/api/chat",
  chatRoutes
);


//landing page Opportunities
app.use("/api/landing/opportunities", landingOpportunityRoutes);



//Contact Us
app.use("/api/contact", contactRoutes);
// ======================================================
// CREATE HTTP SERVER
// ======================================================

app.use("/api/funding", fundingRoutes);

// Socket.IO needs access to the HTTP server.
// Instead of app.listen(), we create an HTTP server.

const httpServer = http.createServer(app);

// ======================================================
// INITIALIZE SOCKET.IO
// ======================================================

// Attach Socket.IO to the same server as Express.
const io = initializeChatSocket(httpServer);

// Make Socket.IO accessible inside controllers.
//
// Example:
// const io = req.app.get("io");

app.set("io", io);

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  console.log("======================================");
  console.log("TONGAAT HULETT ESD PORTAL");
  console.log("======================================");

  console.log(
    `Express server running on http://localhost:${PORT}`
  );

  console.log("Socket.IO initialized successfully");

  console.log(
    `Chat API: http://localhost:${PORT}/api/chat`
  );

  console.log("======================================");

  // ====================================================
  // CHECK MYSQL CONNECTION
  // ====================================================

  try {
    const connection = await pool.getConnection();

    console.log("MySQL database connected successfully");

    connection.release();

  } catch (error) {
    console.error(
      "Database connection failed:",
      error.message
    );
  }
});
const express = require("express");
const pool = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const opportunityRoutes = require("./routes/opportunityRoutes");
const opportunityResponseRoutes = require("./routes/opportunityResponseRoutes");
const otpRoutes = require("./routes/otpRoutes");
const rfqRoutes = require("./routes/rfqRoutes");
const tenderRoutes = require("./routes/tenderRoutes");
const tenderResponseRoutes =
    require("./routes/tenderResponseRoutes");
    const supplierRoutes =
    require("./routes/supplierRoutes");
    const businessProfileRoutes =  require("./routes/RegisterSMME/businessProfileRoutes");
    const businessMaturityRoutes = require(
    "./routes/RegisterSMME//businessMaturityRoutes"
);
const advisoryRoutes = require("./routes/BissnessAdvisory/advisoryRoutes");
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


const authRoutes1 = require("./routes/AuthRoutes/authRoutes");
const genderRoutes = require("./routes/GenderRoutes/genderRoutes");
const dashboardStatsRoutes = require(
  "./routes/DashboardstatsRoutes/dashboardStatsRoutes"
);
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(cookieParser());
app.use(express.json());

// ======================== AUTH ========================
// Authentication routes
app.use("/api/auth", authRoutes1);


app.use("/api/auth1", authRoutes);

// app.use("/api/auth", refreshRoutes);

app.use("/api/otp", otpRoutes);

app.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.originalUrl);
    next();
});


// ======================== SMME ========================
app.use("/business-profile", businessProfileRoutes);
app.use(
    "/business-maturity",
    businessMaturityRoutes
);
app.use(
  "/registration",
  require("./routes/RegisterSMME/registrationStatusRoutes")
);



app.use("/api/advisory", advisoryRoutes);






// ======================== OPPORTUNITIES ========================

app.use("/api/opportunities", opportunityRoutes);

app.use("/api", opportunityResponseRoutes);


// ======================== RFQ ========================

app.use("/api/rfq", rfqRoutes);

app.use(
    "/api/rfqs",
    rfqDetailsRoutes
);


// ======================== TENDERS ========================

app.use("/api/tender", tenderRoutes);
app.use(
    "/api/tender-responses",
    tenderResponseRoutes
);
app.use(
    "/api/tenders",
    tenderDetailsRoutes
);


// ======================== EVENT========================


app.use("/api/esd-activities", esdActivityRoutes);

// ======================== GET ALL SUPPILIES ========================
app.use(
    "/api/suppliers",
    supplierRoutes
);
app.use("api/tax-compliance", taxComplianceRoutes);

// ========================Stats ========================
app.use("/api/dashboard", genderRoutes);
app.use("/api/dashboard", dashboardStatsRoutes);

// ======================== SERVER ========================

const PORT = 5000;

app.listen(PORT, async () => {

    console.log(`Server running on http://localhost:${PORT}`);

    try {

        const connection = await pool.getConnection();

        console.log("MySQL database connected");

        connection.release();

    } catch (error) {

        console.error(
            "Database connection failed:",
            error.message
        );
    }
});
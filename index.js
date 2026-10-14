const express = require("express");
const pool = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const mentorshipRoutes = require("./routes/mentorshiproutes");
const meetingRoutes = require("./routes/meetingRoutes");
const meetingParticipantRoutes = require("./routes/meetingParticipantRoutes");
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

const cors = require("cors");
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// ======================== AUTH ========================

app.use("/api/auth", authRoutes);

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



app.use("/advisory", advisoryRoutes);

app.use("/api/mentorship", mentorshipRoutes);


// ======================== MEETINGS ========================

app.use("/api/meetings", meetingRoutes);

app.use(
    "/api/meeting-participants",
    meetingParticipantRoutes
);


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
app.use("/tax-compliance", taxComplianceRoutes);

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
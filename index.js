const express = require("express");
const pool = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const inputRequestRoutes = require("./routes/inputRequestRoutes");
const tonnageRoutes = require("./routes/tonnageroutes");
const advisoryRoutes = require("./routes/advisoryroutes");
const mentorshipRoutes = require("./routes/mentorshiproutes");
const meetingRoutes = require("./routes/meetingRoutes");
const meetingParticipantRoutes = require("./routes/meetingParticipantRoutes");
const workshopRoutes = require("./routes/workshopRoutes");
const workshopParticipantRoutes = require("./routes/workshopParticipantRoutes");

const opportunityRoutes = require("./routes/opportunityRoutes");
const opportunityResponseRoutes = require("./routes/opportunityResponseRoutes");

const otpRoutes = require("./routes/otpRoutes");
const rfqRoutes = require("./routes/rfqRoutes");
const tenderRoutes = require("./routes/tenderRoutes");
const tenderResponseRoutes =
    require("./routes/tenderResponseRoutes");

const app = express();

app.use(express.json());


// ======================== AUTH ========================

app.use("/api/auth", authRoutes);

app.use("/api/otp", otpRoutes);


// ======================== FARMER ========================

app.use("/api/input-requests", inputRequestRoutes);

app.use("/api/tonnage", tonnageRoutes);


// ======================== SMME ========================

app.use("/api/advisory", advisoryRoutes);

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


// ======================== TENDERS ========================

app.use("/api/tender", tenderRoutes);
app.use(
    "/api/tender-responses",
    tenderResponseRoutes
);


// ======================== WORKSHOPS ========================

app.use("/api/workshops", workshopRoutes);

app.use(
    "/api/workshop-participants",
    workshopParticipantRoutes
);


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
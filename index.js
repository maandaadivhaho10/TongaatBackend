const express = require("express");
const pool = require("./config/database");
const farmerRoutes =
    require("./routes/farmerRoutes");

const smmeRoutes =
    require("./routes/smmeRoutes");
const authRoutes=require("./routes/authRoutes");
const inputRequestRoutes =
    require("./routes/inputRequestRoutes");
const tonnageRoutes = require("./routes/tonnageroutes");
const advisoryRoutes = require("./routes/advisoryroutes");
const mentorshipRoutes = require("./routes/mentorshiproutes");
const meetingRoutes = require("./routes/meetingRoutes");
const meetingParticipantRoutes =
    require("./routes/meetingParticipantRoutes");

const workshopRoutes = require("./routes/workshopRoutes");
const workshopParticipantRoutes =
    require("./routes/workshopParticipantRoutes");
    const opportunityRoutes =
    require("./routes/opportunityRoutes");
    const edRegister= require("./routes/EDregisterRoute");



const app = express();

app.use(express.json());


app.use(
    "/api/farmer",
    farmerRoutes
);

app.use("/api/auth", edRegister)

app.use(
    "/api/smme",
    smmeRoutes
);
app.use(
    "/api/input-requests",
    inputRequestRoutes
);
app.use("/api/auth",authRoutes);

app.use("/api/advisory", advisoryRoutes);

app.use("/api/mentorship", mentorshipRoutes);

app.use("/api/tonnage", tonnageRoutes);

//meetings
app.use("/api/meetings", meetingRoutes);

//meeting participants
app.use(
    "/api/meeting-participants",
    meetingParticipantRoutes
);

//opportunities
app.use("/api/opportunities", opportunityRoutes);

//workshops
app.use("/api/workshops", workshopRoutes);

//workshop participants
app.use( "/api/workshop-participants",
    workshopParticipantRoutes
);

const PORT = 5000;


app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    try {
        const connection = await pool.getConnection();
        console.log("MySQL database connected");
        connection.release();
    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
});
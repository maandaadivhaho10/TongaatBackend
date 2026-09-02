const express = require("express");
const userRoutes = require("./routes/userRoutes");
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


const app = express();

app.use(express.json());


app.use(
    "/api/farmer",
    farmerRoutes
);

app.use("/api/auth", authRoutes);

app.use(
    "/api/smme",
    smmeRoutes
);
app.use(
    "/api/input-requests",
    inputRequestRoutes
);

app.use("/api/advisory", advisoryRoutes);

app.use("/api/mentorship", mentorshipRoutes);

app.use("/api/tonnage", tonnageRoutes);


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
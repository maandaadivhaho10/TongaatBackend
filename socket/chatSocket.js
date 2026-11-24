
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

// ======================================================
// INITIALIZE CHAT SOCKET
// ======================================================

const initializeChatSocket = (httpServer) => {

  const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    "http://localhost:3000,http://localhost:5173"
  )
    .split(",")
    .map(origin => origin.trim());

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // ====================================================
  // AUTHENTICATE EVERY SOCKET CONNECTION
  // ====================================================

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token || typeof token !== "string") {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
        { algorithms: ["HS256"] }
      );

      const userId = Number(decoded.user_id);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return next(new Error("Invalid user"));
      }

      const [users] = await db.execute(
        `
        SELECT user_id, role_id, status
        FROM \`user\`
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
      );

      if (users.length === 0) {
        return next(new Error("User not found"));
      }

      const user = users[0];

      if (user.status !== "ACTIVE") {
        return next(new Error("Account is not active"));
      }

      if (![1, 2].includes(Number(user.role_id))) {
        return next(new Error("Access denied"));
      }

      socket.data.userId = Number(user.user_id);
      socket.data.roleId = Number(user.role_id);

      next();

    } catch (error) {
      console.error(
        "Socket authentication error:",
        error.message
      );

      next(new Error("Invalid or expired token"));
    }
  });

  // ====================================================
  // HANDLE CONNECTED USERS
  // ====================================================

  io.on("connection", (socket) => {

    const userId = socket.data.userId;
    const roleId = socket.data.roleId;

    console.log(`Chat connected: User ${userId}`);

    socket.join(`user:${userId}`);

    if (roleId === 2) {
      socket.join("ed:support");
    }

    socket.on("disconnect", (reason) => {
      console.log(
        `Chat disconnected: User ${userId} - ${reason}`
      );
    });

  });

  return io;
};

module.exports = initializeChatSocket;

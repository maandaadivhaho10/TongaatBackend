
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

// ======================================================
// INITIALIZE CHAT SOCKET
// ======================================================

const initializeChatSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
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

      // Use the SAME JWT secret as your REST auth middleware.
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
        { algorithms: ["HS256"] }
      );

      const userId = Number(decoded.user_id);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return next(new Error("Invalid user"));
      }

      // Retrieve the user's CURRENT role from MySQL.
      // Do not trust a role supplied by the frontend.
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
      console.error("Socket authentication error:", error.message);
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

    // Each user gets a private notification room.
    socket.join(`user:${userId}`);

    // All authorized ED Team members join the
    // shared support notification room.
    if (roleId === 2) {
      socket.join("ed:support");
    }

    // We deliberately do not allow clients to
    // join arbitrary user or conversation rooms.

    socket.on("disconnect", (reason) => {
      console.log(
        `Chat disconnected: User ${userId} - ${reason}`
      );
    });
  });

  return io;
};

module.exports = initializeChatSocket;

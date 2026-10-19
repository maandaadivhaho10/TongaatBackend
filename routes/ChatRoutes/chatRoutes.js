const express = require("express");
const {
  createChatConversation,
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  getDirectChat,
  sendDirectChatMessage, openSupplierConversation,
} = require("../../controllers/ChatController/chatController");
const authenticateToken = require("../../middleware/authMiddleware");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

const router = express.Router();

// Direct supplier chat: no subject or conversation ID required.
router.get("/direct", authenticateToken, authorizeRoles(1), getDirectChat);
router.post("/direct/messages", authenticateToken, authorizeRoles(1), sendDirectChatMessage);

// Existing endpoints remain available for compatibility and ED replies.
router.post("/conversations", authenticateToken, authorizeRoles(1), createChatConversation);
router.get("/conversations", authenticateToken, authorizeRoles(1, 2), getChatConversations);
router.get("/conversations/:conversationId/messages", authenticateToken, authorizeRoles(1, 2), getChatMessages);
router.post("/conversations/:conversationId/messages", authenticateToken, authorizeRoles(1, 2), sendChatMessage);

module.exports = router;

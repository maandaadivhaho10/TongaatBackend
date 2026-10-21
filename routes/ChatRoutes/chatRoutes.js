const express = require("express");

const {
  createChatConversation,
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  getDirectChat,
  sendDirectChatMessage,
  openSupplierConversation,
} = require("../../controllers/ChatController/chatController");

const authenticateToken = require(
  "../../middleware/authMiddleware"
);

const {
  authorizeRoles,
} = require("../../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// SUPPLIER DIRECT CHAT
// =====================================================

// Supplier retrieves direct chat.
router.get(
  "/direct",
  authenticateToken,
  authorizeRoles(1),
  getDirectChat
);

// Supplier sends direct message.
router.post(
  "/direct/messages",
  authenticateToken,
  authorizeRoles(1),
  sendDirectChatMessage
);

// =====================================================
// ED TEAM: OPEN SUPPLIER CONVERSATION
// =====================================================

router.post(
  "/conversations/direct",
  authenticateToken,
  authorizeRoles(2),
  openSupplierConversation
);

// =====================================================
// EXISTING CHAT ENDPOINTS
// =====================================================

// Supplier creates conversation.
router.post(
  "/conversations",
  authenticateToken,
  authorizeRoles(1),
  createChatConversation
);

// Retrieve conversations.
router.get(
  "/conversations",
  authenticateToken,
  authorizeRoles(1, 2),
  getChatConversations
);

// Retrieve conversation messages.
router.get(
  "/conversations/:conversationId/messages",
  authenticateToken,
  authorizeRoles(1, 2),
  getChatMessages
);

// Send message to conversation.
router.post(
  "/conversations/:conversationId/messages",
  authenticateToken,
  authorizeRoles(1, 2),
  sendChatMessage
);

module.exports = router;
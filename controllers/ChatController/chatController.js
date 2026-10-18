const {
  createConversation,
  getConversations,
  getConversationMessages,
  sendConversationMessage,
  getConversationById,
  sendDirectSupportMessage,
  getDirectSupportChat,
} = require("../../UserService/ChatService/chatService");

const validId = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const sendError = (res, error, fallback) => {
  console.error(fallback, error);
  const status = error.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: status === 500 ? fallback : error.message,
  });
};

const emitMessage = (req, conversation, savedMessage) => {
  try {
    const io = req.app.get("io");
    if (!io || !conversation) return;
    const eventData = {
      conversation_id: Number(conversation.conversation_id),
      message: savedMessage,
    };
    io.to(`user:${conversation.smme_user_id}`).emit("chat:new_message", eventData);
    io.to("ed:support").emit("chat:new_message", eventData);
  } catch (error) {
    console.error("Socket message notification error:", error);
  }
};

const createChatConversation = async (req, res) => {
  try {
    const userId = Number(req.user?.user_id);
    if (!validId(userId)) return res.status(401).json({ success: false, message: "Invalid authentication information" });
    if (Number(req.user?.role_id) !== 1) return res.status(403).json({ success: false, message: "Only suppliers can create conversations" });
    const subject = req.body?.subject;
    if (typeof subject !== "string" || !subject.trim()) return res.status(400).json({ success: false, message: "Conversation subject is required" });
    if (subject.trim().length > 200) return res.status(400).json({ success: false, message: "Subject cannot exceed 200 characters" });
    const conversation = await createConversation(userId, subject.trim());
    try {
      req.app.get("io")?.to("ed:support").emit("chat:new_conversation", conversation);
    } catch (error) { console.error("Socket conversation notification error:", error); }
    return res.status(200).json({ success: true, message: "Support conversation ready", data: conversation });
  } catch (error) { return sendError(res, error, "Failed to create conversation"); }
};

const getChatConversations = async (req, res) => {
  try {
    const userId = Number(req.user?.user_id);
    const roleId = Number(req.user?.role_id);
    if (!validId(userId)) return res.status(401).json({ success: false, message: "Invalid authentication information" });
    if (![1, 2].includes(roleId)) return res.status(403).json({ success: false, message: "Access denied" });
    const conversations = await getConversations(userId, roleId);
    return res.status(200).json({ success: true, message: "Conversations retrieved successfully", total: conversations.length, data: conversations });
  } catch (error) { return sendError(res, error, "Failed to retrieve conversations"); }
};

const getChatMessages = async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = Number(req.user?.user_id);
    const roleId = Number(req.user?.role_id);
    if (!validId(conversationId)) return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    if (!validId(userId)) return res.status(401).json({ success: false, message: "Invalid authentication information" });
    if (![1, 2].includes(roleId)) return res.status(403).json({ success: false, message: "Access denied" });
    const data = await getConversationMessages(conversationId, userId, roleId);
    return res.status(200).json({ success: true, message: "Messages retrieved successfully", data });
  } catch (error) { return sendError(res, error, "Failed to retrieve messages"); }
};

const sendChatMessage = async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const senderId = Number(req.user?.user_id);
    const roleId = Number(req.user?.role_id);
    const message = req.body?.message;
    if (!validId(conversationId)) return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    if (!validId(senderId)) return res.status(401).json({ success: false, message: "Invalid authentication information" });
    if (![1, 2].includes(roleId)) return res.status(403).json({ success: false, message: "Access denied" });
    if (typeof message !== "string" || !message.trim()) return res.status(400).json({ success: false, message: "Message cannot be empty" });
    if (message.trim().length > 5000) return res.status(400).json({ success: false, message: "Message cannot exceed 5000 characters" });
    const savedMessage = await sendConversationMessage(conversationId, senderId, roleId, message.trim());
    const conversation = await getConversationById(conversationId);
    emitMessage(req, conversation, savedMessage);
    return res.status(201).json({ success: true, message: "Message sent successfully", data: savedMessage });
  } catch (error) { return sendError(res, error, "Failed to send message"); }
};

// Supplier: load direct chat without selecting a conversation.
const getDirectChat = async (req, res) => {
  try {
    const userId = Number(req.user?.user_id);
    if (!validId(userId)) return res.status(401).json({ success: false, message: "Invalid authentication information" });
    if (Number(req.user?.role_id) !== 1) return res.status(403).json({ success: false, message: "Only suppliers can access direct chat" });
    const data = await getDirectSupportChat(userId);
    return res.status(200).json({ success: true, message: "Support chat retrieved successfully", data });
  } catch (error) { return sendError(res, error, "Failed to retrieve support chat"); }
};

// Supplier: send directly; first send creates the chat automatically.
const sendDirectChatMessage = async (req, res) => {
  try {
    const userId = Number(req.user?.user_id);
    const message = req.body?.message;
    if (!validId(userId)) return res.status(401).json({ success: false, message: "Invalid authentication information" });
    if (Number(req.user?.role_id) !== 1) return res.status(403).json({ success: false, message: "Only suppliers can send direct support messages" });
    if (typeof message !== "string" || !message.trim()) return res.status(400).json({ success: false, message: "Message cannot be empty" });
    if (message.trim().length > 5000) return res.status(400).json({ success: false, message: "Message cannot exceed 5000 characters" });
    const data = await sendDirectSupportMessage(userId, message.trim());
    if (data.is_new_conversation) {
      try {
        req.app.get("io")?.to("ed:support").emit("chat:new_conversation", {
          ...data.conversation,
          first_name: data.message.first_name,
          last_name: data.message.last_name,
        });
      } catch (error) { console.error("Socket conversation notification error:", error); }
    }
    emitMessage(req, data.conversation, data.message);
    return res.status(201).json({ success: true, message: "Message sent to ED Team successfully", data });
  } catch (error) { return sendError(res, error, "Failed to send direct message"); }
};

module.exports = {
  createChatConversation,
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  getDirectChat,
  sendDirectChatMessage,
};

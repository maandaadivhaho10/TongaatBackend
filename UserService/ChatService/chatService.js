const db = require("../../config/database");

const httpError = (message, statusCode) => Object.assign(new Error(message), { statusCode });

// Legacy endpoint retained for compatibility. Reuses the supplier's direct chat.
const createConversation = async (userId, subject = "ED Team Support") => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute(
      "SELECT user_id, role_id FROM `user` WHERE user_id = ? FOR UPDATE", [userId]
    );
    if (!users.length || Number(users[0].role_id) !== 1) throw httpError("Supplier not found", 403);
    const [existing] = await connection.execute(
      `SELECT conversation_id, smme_user_id, subject, status, created_at, updated_at
       FROM chat_conversation WHERE smme_user_id = ? ORDER BY conversation_id ASC LIMIT 1 FOR UPDATE`,
      [userId]
    );
    if (existing.length) {
      await connection.commit();
      return existing[0];
    }
    const [insert] = await connection.execute(
      "INSERT INTO chat_conversation (smme_user_id, subject, status) VALUES (?, ?, 'OPEN')",
      [userId, subject || "ED Team Support"]
    );
    await connection.execute(
      "INSERT INTO chat_conversation_member (conversation_id, user_id) VALUES (?, ?)",
      [insert.insertId, userId]
    );
    await connection.commit();
    return { conversation_id: insert.insertId, smme_user_id: userId, subject: subject || "ED Team Support", status: "OPEN" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getConversations = async (userId, roleId) => {
  if (![1, 2].includes(Number(roleId))) throw httpError("Access denied", 403);
  const isSmme = Number(roleId) === 1;
  const [rows] = await db.execute(
    `SELECT c.conversation_id, c.smme_user_id, c.subject, c.status, c.created_at, c.updated_at,
            u.first_name, u.last_name, u.email,
            (SELECT m.message FROM chat_message m WHERE m.conversation_id = c.conversation_id
             ORDER BY m.created_at DESC, m.message_id DESC LIMIT 1) AS last_message,
            (SELECT m.created_at FROM chat_message m WHERE m.conversation_id = c.conversation_id
             ORDER BY m.created_at DESC, m.message_id DESC LIMIT 1) AS last_message_at,
            (SELECT COUNT(*) FROM chat_message m WHERE m.conversation_id = c.conversation_id) AS total_messages
     FROM chat_conversation c
     JOIN \`user\` u ON u.user_id = c.smme_user_id
     ${isSmme ? "WHERE c.smme_user_id = ?" : ""}
     ORDER BY COALESCE((SELECT MAX(m.created_at) FROM chat_message m
                        WHERE m.conversation_id = c.conversation_id), c.created_at) DESC,
              c.conversation_id DESC`,
    isSmme ? [userId] : []
  );
  return rows;
};

const getConversationById = async (conversationId) => {
  const [rows] = await db.execute(
    `SELECT conversation_id, smme_user_id, subject, status, created_at, updated_at
     FROM chat_conversation WHERE conversation_id = ? LIMIT 1`, [conversationId]
  );
  return rows[0] || null;
};

const getConversationMessages = async (conversationId, userId, roleId) => {
  if (![1, 2].includes(Number(roleId))) throw httpError("Access denied", 403);
  const conversation = await getConversationById(conversationId);
  if (!conversation) throw httpError("Conversation not found", 404);
  if (Number(roleId) === 1 && Number(conversation.smme_user_id) !== Number(userId)) {
    throw httpError("Access denied", 403);
  }
  const [messages] = await db.execute(
    `SELECT m.message_id, m.conversation_id, m.sender_id, m.message, m.message_type,
            m.file_url, m.created_at, u.first_name, u.last_name, u.role_id
     FROM chat_message m JOIN \`user\` u ON u.user_id = m.sender_id
     WHERE m.conversation_id = ? ORDER BY m.created_at ASC, m.message_id ASC`,
    [conversationId]
  );
  return { conversation, total_messages: messages.length, messages };
};

const sendConversationMessage = async (conversationId, senderId, roleId, message) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT conversation_id, smme_user_id, status FROM chat_conversation
       WHERE conversation_id = ? FOR UPDATE`, [conversationId]
    );
    if (!rows.length) throw httpError("Conversation not found", 404);
    if (Number(roleId) === 1 && Number(rows[0].smme_user_id) !== Number(senderId)) {
      throw httpError("You cannot send messages to this conversation", 403);
    }
    if (![1, 2].includes(Number(roleId))) throw httpError("Access denied", 403);
    if (rows[0].status !== "OPEN") throw httpError("This conversation is not open", 409);
    await connection.execute(
      `INSERT INTO chat_conversation_member (conversation_id, user_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE user_id = user_id`, [conversationId, senderId]
    );
    const [insert] = await connection.execute(
      `INSERT INTO chat_message (conversation_id, sender_id, message, message_type)
       VALUES (?, ?, ?, 'TEXT')`, [conversationId, senderId, message]
    );
    await connection.execute(
      "UPDATE chat_conversation SET updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ?", [conversationId]
    );
    const [messages] = await connection.execute(
      `SELECT m.message_id, m.conversation_id, m.sender_id, m.message, m.message_type,
              m.file_url, m.created_at, u.first_name, u.last_name, u.role_id
       FROM chat_message m JOIN \`user\` u ON u.user_id = m.sender_id
       WHERE m.message_id = ?`, [insert.insertId]
    );
    await connection.commit();
    return messages[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Supplier's direct chat: first message creates it, subsequent messages reuse it.
const sendDirectSupportMessage = async (userId, message) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // Serialize concurrent first sends for this supplier.
    const [users] = await connection.execute(
      "SELECT user_id, role_id FROM `user` WHERE user_id = ? FOR UPDATE", [userId]
    );
    if (!users.length || Number(users[0].role_id) !== 1) throw httpError("Supplier account not found", 403);
    const [existing] = await connection.execute(
      `SELECT conversation_id, smme_user_id, subject, status FROM chat_conversation
       WHERE smme_user_id = ? ORDER BY conversation_id ASC LIMIT 1 FOR UPDATE`, [userId]
    );
    let conversation = existing[0];
    let isNewConversation = false;
    if (!conversation) {
      const [insert] = await connection.execute(
        "INSERT INTO chat_conversation (smme_user_id, subject, status) VALUES (?, 'ED Team Support', 'OPEN')",
        [userId]
      );
      conversation = { conversation_id: insert.insertId, smme_user_id: userId, subject: "ED Team Support", status: "OPEN" };
      isNewConversation = true;
    }
    if (conversation.status !== "OPEN") throw httpError("Your support chat is closed. Please contact the ED Team.", 409);
    await connection.execute(
      `INSERT INTO chat_conversation_member (conversation_id, user_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE user_id = user_id`, [conversation.conversation_id, userId]
    );
    const [insert] = await connection.execute(
      `INSERT INTO chat_message (conversation_id, sender_id, message, message_type)
       VALUES (?, ?, ?, 'TEXT')`, [conversation.conversation_id, userId, message]
    );
    await connection.execute(
      "UPDATE chat_conversation SET updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ?",
      [conversation.conversation_id]
    );
    const [messages] = await connection.execute(
      `SELECT m.message_id, m.conversation_id, m.sender_id, m.message, m.message_type,
              m.file_url, m.created_at, u.first_name, u.last_name, u.role_id
       FROM chat_message m JOIN \`user\` u ON u.user_id = m.sender_id
       WHERE m.message_id = ?`, [insert.insertId]
    );
    await connection.commit();
    return { conversation, message: messages[0], is_new_conversation: isNewConversation };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getDirectSupportChat = async (userId) => {
  const [rows] = await db.execute(
    `SELECT conversation_id FROM chat_conversation WHERE smme_user_id = ?
     ORDER BY conversation_id ASC LIMIT 1`, [userId]
  );
  if (!rows.length) return { conversation: null, total_messages: 0, messages: [] };
  return getConversationMessages(rows[0].conversation_id, userId, 1);
};
// =====================================================
// ED TEAM: FIND OR CREATE SUPPLIER DIRECT CONVERSATION
// =====================================================

const findOrCreateSupplierConversation = async (
  supplierUserId
) => {
  const userId = Number(supplierUserId);

  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0
  ) {
    throw httpError("Invalid supplier user ID", 400);
  }

  // createConversation already:
  // 1. Verifies the user has role_id = 1.
  // 2. Checks whether a conversation exists.
  // 3. Creates one only when necessary.
  // 4. Adds the supplier to chat_conversation_member.
  // 5. Uses a transaction and locks the supplier row.

  const conversation = await createConversation(
    userId,
    "ED Team Support"
  );

  return conversation;
};

module.exports = {
  createConversation,
  getConversations,
  getConversationMessages,
  sendConversationMessage,
  getConversationById,
  sendDirectSupportMessage,
  getDirectSupportChat,findOrCreateSupplierConversation
};

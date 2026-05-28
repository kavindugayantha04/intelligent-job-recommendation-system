const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  sendMessage,
  getHistory,
  editMessage,
  deleteMessage,
  deleteConversation,
  createConversation,
} = require("../controllers/chatController");

router.use(auth);

router.post("/send", sendMessage);
router.get("/history", getHistory);
router.post("/new", createConversation);
router.put("/edit/:id", editMessage);
router.delete("/delete/:id", deleteMessage);
router.delete("/conversation/:conversationId", deleteConversation);

module.exports = router;

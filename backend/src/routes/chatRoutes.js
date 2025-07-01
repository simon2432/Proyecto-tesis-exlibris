const express = require("express");
const router = express.Router();
const {
  chatWithAssistant,
  describeBook,
} = require("../controllers/chatController");

router.post("/chat", chatWithAssistant);
router.post("/chat/describe", describeBook);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  searchGoogleBooks,
  generateBookDescription,
} = require("../controllers/bookController");

router.get("/search", searchGoogleBooks);
router.post("/generate-description", generateBookDescription);

module.exports = router;

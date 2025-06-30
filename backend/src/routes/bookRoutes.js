const express = require("express");
const router = express.Router();
const { searchGoogleBooks } = require("../controllers/bookController");

router.get("/search", searchGoogleBooks);

module.exports = router;

const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");

// 🔥 Change this to POST
router.post("/recommend/:userId", recommendationController.getRecommendations);

module.exports = router;
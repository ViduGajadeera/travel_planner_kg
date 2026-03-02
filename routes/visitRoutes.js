// routes/visitRoutes.js
const express = require("express");
const router = express.Router();
const visitController = require("../controllers/visitController");

router.get("/:userId/recent-visits", visitController.getRecentVisits);

module.exports = router;
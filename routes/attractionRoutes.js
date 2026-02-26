const express = require("express");
const router = express.Router();
const { createAttraction } = require("../controllers/attractionController");

router.post("/create", createAttraction);

module.exports = router;
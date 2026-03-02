const express = require("express");
const cors = require("cors");
require("dotenv").config();

const createConstraints = require("./config/constraints");
const userRoutes = require("./routes/userRoutes");
const attractionRoutes = require("./routes/attractionRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const visitRoutes = require("./routes/visitRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes); 
app.use("/attractions", attractionRoutes);
app.use("/api", recommendationRoutes);
app.use("/visits", visitRoutes);

app.get("/", (req, res) => {
  res.send("Dynamic Travel Knowledge Graph API Running");
});

app.listen(process.env.PORT, async () => {
  console.log(`Server running on port ${process.env.PORT}`);
  await createConstraints();
});
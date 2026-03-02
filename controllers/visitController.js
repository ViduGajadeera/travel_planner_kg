require("dotenv").config();
const driver = require("../db/neo4j");

// ---------------- View Past Visits (last 3 months) ----------------
exports.getRecentVisits = async (req, res) => {
  const { userId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[v:VISITED]->(a:Attraction)
      WHERE v.visitedAt >= datetime() - duration({months: 3})
      RETURN a.name AS attraction, v.visitedAt AS visitedAt
      ORDER BY v.visitedAt DESC
      `,
      { userId }
    );

    const visits = result.records.map(r => ({
      attraction: r.get("attraction"),
      visitedAt: r.get("visitedAt")
    }));

    return res.json({ userId, recentVisits: visits });
  } catch (err) {
    console.error("Failed to fetch recent visits:", err);
    return res.status(500).json({ error: "Failed to fetch recent visits" });
  } finally {
    await session.close();
  }
};
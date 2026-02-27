const driver = require("../db/neo4j");

exports.registerUser = async (req, res) => {
  const { id, name, preferences } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: "User id and name are required" });
  }

  const session = driver.session();

  try {
    // Single write transaction
    const result = await session.executeWrite(async (tx) => {
      return await tx.run(
        `
        // Create user node
        MERGE (u:User {id: $id})
        SET u.name = $name
        WITH u
        // Add preferences and create relationships
        UNWIND $preferences AS pref
          MERGE (c:Category {name: pref})
          MERGE (u)-[:LIKES]->(c)
        RETURN u.id AS id, u.name AS name, collect(c.name) AS preferences
        `,
        {
          id,
          name,
          preferences: Array.isArray(preferences) ? preferences : []
        }
      );
    });

    // Return user data
    const user = result.records.length
      ? result.records[0].toObject()
      : { id, name, preferences: [] };

    res.json({
      message: "User created successfully",
      user
    });

  } catch (error) {
    console.error("User registration failed:", error);
    res.status(500).json({ error: "User registration failed" });
  } finally {
    await session.close();
  }
};
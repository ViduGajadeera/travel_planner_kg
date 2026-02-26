const driver = require("../db/neo4j");

exports.registerUser = async (req, res) => {
  const { id, name, preferences } = req.body;
  const session = driver.session();

  try {
    await session.run(
      `
      MERGE (u:User {id: $id})
      SET u.name = $name
      `,
      { id, name }
    );

    for (let type of preferences) {
      await session.run(
        `
        MERGE (t:LocationType {name: $type})
        MERGE (u:User {id: $id})
        MERGE (u)-[:LIKES]->(t)
        `,
        { id, type }
      );
    }

    res.json({ message: "User registered with preferences successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "User registration failed" });
  } finally {
    await session.close();
  }
};
const driver = require("../db/neo4j"); // Adjust path to your neo4j driver

async function syncCategoriesFromKG() {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      // 1️⃣ Get all unique LocationTypes linked to Attractions
      MATCH (a:Attraction)-[:BELONGS_TO_TYPE]->(t:LocationType)
      WITH DISTINCT t.name AS typeName

      // 2️⃣ Create Category nodes if not already present
      MERGE (c:Category {name: typeName})

      // 3️⃣ Return all created/updated categories
      RETURN c.name AS category
      ORDER BY category
      `
    );

    const categories = result.records.map((r) => r.get("category"));
    console.log("Categories synced from KG:", categories);
  } catch (error) {
    console.error("Failed to sync categories from KG:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

// Run the script
syncCategoriesFromKG();
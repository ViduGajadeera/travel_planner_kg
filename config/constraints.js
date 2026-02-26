const driver = require("../db/neo4j");

const createConstraints = async () => {
  const session = driver.session();
  try {
    await session.run(`
      CREATE CONSTRAINT user_id IF NOT EXISTS
      FOR (u:User)
      REQUIRE u.id IS UNIQUE
    `);

    await session.run(`
      CREATE CONSTRAINT attraction_name IF NOT EXISTS
      FOR (a:Attraction)
      REQUIRE a.name IS UNIQUE
    `);

    await session.run(`
      CREATE CONSTRAINT category_name IF NOT EXISTS
      FOR (c:Category)
      REQUIRE c.name IS UNIQUE
    `);

    await session.run(`
      CREATE CONSTRAINT city_name IF NOT EXISTS
      FOR (c:City)
      REQUIRE c.name IS UNIQUE
    `);

    console.log("Constraints created successfully");
  } catch (error) {
    console.error("Constraint error:", error);
  } finally {
    await session.close();
  }
};

module.exports = createConstraints;
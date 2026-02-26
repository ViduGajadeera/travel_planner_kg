const driver = require("../db/neo4j");

exports.createAttraction = async (req, res) => {
  const { name, category, city, suitableWeather } = req.body;
  const session = driver.session();

  try {
    await session.run(
      `
      MERGE (a:Attraction {name: $name})
      MERGE (c:Category {name: $category})
      MERGE (ci:City {name: $city})
      MERGE (w:Weather {type: $suitableWeather})
      
      MERGE (a)-[:BELONGS_TO]->(c)
      MERGE (a)-[:LOCATED_IN]->(ci)
      MERGE (a)-[:SUITABLE_FOR]->(w)
      `,
      { name, category, city, suitableWeather }
    );

    res.json({ message: "Attraction added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Attraction creation failed" });
  } finally {
    await session.close();
  }
};
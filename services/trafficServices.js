const axios = require("axios");
const driver = require("../db/neo4j");

const TOMTOM_API_KEY = "YOUR_TOMTOM_API_KEY";

function calculateTrafficLevel(freeFlowSpeed, currentSpeed) {
  const ratio = currentSpeed / freeFlowSpeed;

  if (ratio > 0.8) return "Low";
  if (ratio > 0.5) return "Medium";
  return "High";
}

exports.updateTrafficForAttraction = async (cityName, lat, lon) => {
  const session = driver.session();

  try {
    const response = await axios.get(
      `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json`,
      {
        params: {
          point: `${lat},${lon}`,
          key: TOMTOM_API_KEY
        }
      }
    );

    const data = response.data.flowSegmentData;

    const currentSpeed = data.currentSpeed;
    const freeFlowSpeed = data.freeFlowSpeed;

    const trafficLevel = calculateTrafficLevel(
      freeFlowSpeed,
      currentSpeed
    );

    await session.run(
      `
      MERGE (c:City {name: $cityName})
      MERGE (t:Traffic {city: $cityName})
      SET t.level = $trafficLevel,
          t.currentSpeed = $currentSpeed,
          t.freeFlowSpeed = $freeFlowSpeed,
          t.updatedAt = datetime()
      MERGE (c)-[:HAS_TRAFFIC]->(t)
      `,
      {
        cityName,
        trafficLevel,
        currentSpeed,
        freeFlowSpeed
      }
    );

    console.log(`Traffic updated for ${cityName}`);
  } catch (error) {
    console.error("TomTom Traffic error:", error.response?.data || error.message);
  } finally {
    await session.close();
  }
};
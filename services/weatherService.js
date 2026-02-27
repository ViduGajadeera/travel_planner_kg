require("dotenv").config();
const axios = require("axios");
const driver = require("../db/neo4j");

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

if (!WEATHER_API_KEY) {
  throw new Error("WEATHER_API_KEY missing in .env");
}

/**
 * Update weather information for a city in Neo4j
 * @param {string} cityName - Name of the city
 */
exports.updateCityWeather = async (cityName) => {
  if (!cityName) {
    console.error("City name is required");
    return;
  }

  const session = driver.session();

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: cityName,
          appid: WEATHER_API_KEY,
          units: "metric"
        }
      }
    );

    const weatherType = response.data.weather[0].main;
    const temperature = response.data.main.temp;

    // Update Neo4j with weather info
    await session.run(
      `
      MERGE (c:City {name: $cityName})
      MERGE (w:Weather {city: $cityName})
      SET w.type = $weatherType,
          w.temperature = $temperature,
          w.updatedAt = datetime()
      MERGE (c)-[:HAS_WEATHER]->(w)
      `,
      { cityName, weatherType, temperature }
    );

    console.log(`✅ Weather updated for ${cityName}: ${weatherType}, ${temperature}°C`);
  } catch (error) {
    console.error("❌ Weather update failed:", error.response?.data || error.message);
  } finally {
    await session.close();
  }
};
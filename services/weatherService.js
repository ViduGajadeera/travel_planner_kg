const axios = require("axios");
const driver = require("../db/neo4j");

const API_KEY = "9ec70c722f973996c3bdf35ac454f56a";

exports.updateCityWeather = async (cityName) => {
  const session = driver.session();

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
    );

    const weatherType = response.data.weather[0].main;
    const temperature = response.data.main.temp;

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

    console.log(`Weather updated for ${cityName}`);
  } catch (error) {
    console.error("Weather update failed:", error.message);
  } finally {
    await session.close();
  }
};
// controllers/recommendationController.js
require("dotenv").config();
const driver = require("../db/neo4j");
const { getTrafficInfo } = require("../services/trafficServices");
const axios = require("axios");

const HERE_API_KEY = process.env.HERE_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

async function fetchCityForPlace(placeName) {
  try {
    const res = await axios.get("https://geocode.search.hereapi.com/v1/geocode", {
      params: { q: `${placeName}, Sri Lanka`, apiKey: HERE_API_KEY, limit: 1 }
    });
    const item = res.data.items?.[0];
    if (!item) return null;
    return item.address.city || item.address.district || item.address.county || item.address.state || null;
  } catch {
    return null;
  }
}

async function fetchWeather(city, lat, lon) {
  try {
    let url;
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    } else if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    } else {
      return "Unknown";
    }

    const res = await axios.get(url);
    return `${res.data.weather[0].main} (${res.data.main.temp.toFixed(1)}°C)`;
  } catch {
    return "Unknown";
  }
}

exports.getRecommendations = async (req, res) => {
  const { userId } = req.params;
  // support passing coords via query (GET) or body (POST)
  let { originLat, originLon } = req.query;
  const { latitude, longitude } = req.body || {};

  // fall back to body parameters if query not present
  if ((!originLat || !originLon) && latitude && longitude) {
    originLat = latitude;
    originLon = longitude;
  }

  if (!originLat || !originLon) {
    return res.status(400).json({ error: "Origin latitude and longitude required" });
  }

  const session = driver.session();

  try {
    // Get all attractions user likes
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[:LIKES]->(cat:Category)<-[:BELONGS_TO]-(a:Attraction)
      RETURN a.name AS attraction, 
             cat.name AS category, 
             a.latitude AS lat, 
             a.longitude AS lon
      `,
      { userId }
    );

    let attractions = result.records.map(r => ({
      attraction: r.get("attraction"),
      category: r.get("category"),
      lat: r.get("lat"),
      lon: r.get("lon")
    }));

    // Calculate distance for each attraction
    for (let a of attractions) {
      try {
        const traffic = await getTrafficInfo(
          originLat,
          originLon,
          a.lat,
          a.lon
        );

        a.distanceKm = parseFloat(traffic.distanceKm);
        a.traffic = traffic;
      } catch {
        a.distanceKm = Infinity;
        a.traffic = null;
      }
    }

    // Sort by shortest distance
    attractions.sort((a, b) => a.distanceKm - b.distanceKm);

    // Select 5 from different categories
    const selected = [];
    const usedCategories = new Set();

    for (let a of attractions) {
      if (!usedCategories.has(a.category)) {
        selected.push(a);
        usedCategories.add(a.category);
      }
      if (selected.length === 5) break;
    }

    // Enrich with city + weather
    const recommendations = [];

    for (let a of selected) {
      let city = null;

      const cityRes = await session.run(
        `MATCH (a:Attraction {name:$attraction})-[:LOCATED_IN]->(c:City)
         RETURN c.name AS city`,
        { attraction: a.attraction }
      );

      if (cityRes.records.length) {
        city = cityRes.records[0].get("city");
      } else {
        city = await fetchCityForPlace(a.attraction);
      }

      const weather = await fetchWeather(city, a.lat, a.lon);

      recommendations.push({
        attraction: a.attraction,
        category: a.category,
        city,
        weather,
        distanceKm: a.distanceKm,
        traffic: a.traffic
      });
    }

    res.json({
      userId,
      recommendations
    });

  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  } finally {
    await session.close();
  }
};
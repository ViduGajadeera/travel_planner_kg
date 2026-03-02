require("dotenv").config();
const driver = require("../db/neo4j");
const { getTrafficInfo } = require("../services/trafficServices");
const { autoDetectVisit, calculateDistanceKm } = require("../services/visitService");
const axios = require("axios");

const HERE_API_KEY = process.env.HERE_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// ------------------ Helper Functions ----------------
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

// Bad weather conditions to skip
const BAD_WEATHER = ["Rain", "Thunderstorm", "Snow", "Extreme"];
const HEAVY_TRAFFIC = ["Heavy traffic", "Traffic jam", "Congestion"];

// ---------------- Recommendation API ----------------
exports.getRecommendations = async (req, res) => {
  const { userId } = req.params;
  let { originLat, originLon } = req.query;
  const { latitude, longitude } = req.body || {};

  if ((!originLat || !originLon) && latitude && longitude) {
    originLat = latitude;
    originLon = longitude;
  }

  if (!originLat || !originLon) {
    return res.status(400).json({ error: "Origin latitude and longitude required" });
  }

  originLat = parseFloat(originLat);
  originLon = parseFloat(originLon);

  // Auto-detect visits
  await autoDetectVisit(userId, originLat, originLon);

  const session = driver.session();

  try {
    // ---------------- Skip attractions visited in last 3 months ----------------
    const result = await session.run(
      `
      MATCH (u:User {id: $userId})-[:LIKES]->(cat:Category)<-[:BELONGS_TO]-(a:Attraction)
      WHERE a.latitude IS NOT NULL AND a.longitude IS NOT NULL
        AND NOT EXISTS {
          MATCH (u)-[v:VISITED]->(a)
          WHERE v.visitedAt >= datetime() - duration({months: 3})
        }
      RETURN a.name AS attraction, cat.name AS category, a.latitude AS lat, a.longitude AS lon
      `,
      { userId }
    );

    let attractions = result.records.map(r => ({
      attraction: r.get("attraction"),
      category: r.get("category"),
      lat: r.get("lat"),
      lon: r.get("lon")
    }));

    // ---------------- Calculate distance + traffic ----------------
    for (let a of attractions) {
      if (a.lat == null || a.lon == null) {
        a.distanceKm = Infinity;
        a.traffic = null;
        continue;
      }

      const straight = calculateDistanceKm(originLat, originLon, a.lat, a.lon);
      try {
        const traffic = await getTrafficInfo(originLat, originLon, a.lat, a.lon);
        a.distanceKm = parseFloat(traffic.distanceKm) || Infinity;
        a.traffic = traffic;
      } catch {
        a.distanceKm = Infinity;
        a.traffic = null;
      }

      a.straightDistanceKm = straight;
    }

    // Filter out attractions with heavy traffic
    attractions = attractions.filter(a => !a.traffic || !HEAVY_TRAFFIC.includes(a.traffic.trafficStatus));

    // Sort by nearest
    attractions.sort((a, b) => a.distanceKm - b.distanceKm);

    // ---------------- Two-stage selection ----------------
    const selected = [];
    const usedCategories = new Set();
    const MAX_RECOMMENDATIONS = 9; // <-- updated to 8

    // Stage 1: pick one per category
    for (let a of attractions) {
      if (usedCategories.has(a.category)) continue;

      let city = null;
      const cityRes = await session.run(
        `MATCH (a:Attraction {name:$attraction})-[:LOCATED_IN]->(c:City) RETURN c.name AS city`,
        { attraction: a.attraction }
      );
      city = cityRes.records.length ? cityRes.records[0].get("city") : await fetchCityForPlace(a.attraction);

      const weather = await fetchWeather(city, a.lat, a.lon);

      if (BAD_WEATHER.some(w => weather.includes(w))) continue;

      selected.push({ ...a, city, weather });
      usedCategories.add(a.category);
      if (selected.length === MAX_RECOMMENDATIONS) break;
    }

    // Stage 2: fill remaining slots by closest attractions
    if (selected.length < MAX_RECOMMENDATIONS) {
      for (let a of attractions) {
        if (selected.find(s => s.attraction === a.attraction)) continue;

        let city = null;
        const cityRes = await session.run(
          `MATCH (a:Attraction {name:$attraction})-[:LOCATED_IN]->(c:City) RETURN c.name AS city`,
          { attraction: a.attraction }
        );
        city = cityRes.records.length ? cityRes.records[0].get("city") : await fetchCityForPlace(a.attraction);

        const weather = await fetchWeather(city, a.lat, a.lon);

        if (BAD_WEATHER.some(w => weather.includes(w))) continue;

        selected.push({ ...a, city, weather });
        if (selected.length === MAX_RECOMMENDATIONS) break;
      }
    }

    return res.json({
      userId,
      origin: { originLat, originLon },
      recommendations: selected
    });

  } catch (err) {
    console.error("Recommendation error:", err);
    return res.status(500).json({ error: "Failed to fetch recommendations", details: err.message });
  } finally {
    await session.close();
  }
};
require("dotenv").config();
const axios = require("axios");

const HERE_API_KEY = process.env.HERE_API_KEY;

if (!HERE_API_KEY) {
  throw new Error("HERE_API_KEY missing in .env");
}

/**
 * Get real-time traffic-aware route information
 * @param {number|string} originLat
 * @param {number|string} originLon
 * @param {number|string} destLat
 * @param {number|string} destLon
 */

function getPeakTimeISO(hour = 8) {
  const now = new Date();
  now.setHours(hour, 0, 0, 0);
  return now.toISOString();
}
async function getTrafficInfo(originLat, originLon, destLat, destLon) {
  try {
    const response = await axios.get(
      "https://router.hereapi.com/v8/routes",
      {
        params: {
          transportMode: "car",
          origin: `${originLat},${originLon}`,
          destination: `${destLat},${destLon}`,
          routingMode: "fast",
          return: "summary,travelSummary",
          traffic: "enabled",
          departureTime: "any", // ← use real-time instead of simulated
          apiKey: HERE_API_KEY,
        },
      }
    );

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error("No route found");
    }

    const summary = response.data.routes[0].sections[0].summary;

    const baseDuration = summary.baseDuration; // without traffic
    const trafficDuration = summary.duration;  // with traffic
    const hasTraffic = trafficDuration > baseDuration;

    return {
  distanceKm: (summary.length / 1000).toFixed(2),
  baseDurationMinutes: (baseDuration / 60).toFixed(2),
  trafficDurationMinutes: (trafficDuration / 60).toFixed(2),
  trafficDelayMinutes: ((trafficDuration - baseDuration) / 60).toFixed(2),
  trafficStatus: hasTraffic ? "Congested" : "Normal Flow"
};

  } catch (error) {
    console.error(
      "HERE Routing Error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = { getTrafficInfo };
const path = require("path");
// always load the root .env file even if the script is started from a subdirectory
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
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
 * @returns {Object} - Traffic info including distance, duration, delay, and status
 */
async function getTrafficInfo(originLat, originLon, destLat, destLon) {
  // basic validation, avoid making request when coordinates are missing
  if (
    originLat == null || originLon == null ||
    destLat == null   || destLon == null ||
    isNaN(parseFloat(originLat)) || isNaN(parseFloat(originLon)) ||
    isNaN(parseFloat(destLat))   || isNaN(parseFloat(destLon))
  ) {
    // invalid inputs; log and return unknown traffic
    console.warn("getTrafficInfo called with invalid coordinates", {
      originLat, originLon, destLat, destLon
    });
    return {
      distanceKm: null,
      baseDurationMinutes: null,
      trafficDurationMinutes: null,
      trafficDelayMinutes: null,
      trafficStatus: "Unknown"
    };
  }

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
          departureTime: "any", // use real-time traffic
          apiKey: HERE_API_KEY,
        },
      }
    );

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = response.data.routes[0];
    const sections = route.sections || [];
    if (sections.length === 0) {
      throw new Error("Route contains no sections");
    }

    // When a route is split into multiple sections the summary on the first
    // section only describes that piece.  To get a stable distance/duration we
    // must combine all of them; sometimes HERE returns different numbers when
    // the road is broken into two or more parts and that was causing the
    // values to “jump” each time.
    let totalLength = 0;
    let totalBaseDuration = 0;
    let totalTrafficDuration = 0;

    sections.forEach((s, idx) => {
      const sum = s.summary;
      totalLength += sum.length;
      totalBaseDuration += sum.baseDuration;
      totalTrafficDuration += sum.duration;
      if (sections.length > 1) {
        console.debug(`section ${idx + 1}/${sections.length}`, {
          length: sum.length,
          baseDuration: sum.baseDuration,
          duration: sum.duration,
        });
      }
    });

    const hasTraffic = totalTrafficDuration > totalBaseDuration;

    return {
      distanceKm: (totalLength / 1000).toFixed(2),
      baseDurationMinutes: (totalBaseDuration / 60).toFixed(2),
      trafficDurationMinutes: (totalTrafficDuration / 60).toFixed(2),
      trafficDelayMinutes: ((totalTrafficDuration - totalBaseDuration) / 60).toFixed(2),
      trafficStatus: hasTraffic ? "Congested" : "Normal Flow"
    };

  } catch (error) {
    console.error(
      "HERE Routing Error:",
      error.response?.data || error.message
    );
    return {
      distanceKm: null,
      baseDurationMinutes: null,
      trafficDurationMinutes: null,
      trafficDelayMinutes: null,
      trafficStatus: "Unknown"
    };
  }
}

module.exports = { getTrafficInfo };
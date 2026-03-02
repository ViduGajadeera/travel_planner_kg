const driver = require("../db/neo4j");

function toRadians(value) {
  return (value * Math.PI) / 180;
}

// Haversine formula
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function autoDetectVisit(userId, userLat, userLon) {
  const session = driver.session();

  try {
    // Get all attractions with coordinates
    const result = await session.run(`
      MATCH (a:Attraction)
      WHERE a.latitude IS NOT NULL AND a.longitude IS NOT NULL
      RETURN a.name AS name, a.latitude AS lat, a.longitude AS lon
    `);

    for (const record of result.records) {
      const attraction = record.get("name");
      const lat = record.get("lat");
      const lon = record.get("lon");

      const distance = calculateDistanceKm(
        userLat,
        userLon,
        lat,
        lon
      );

      if (distance <= 1) {
        // within 1km → mark visited
        await session.run(
          `
          MATCH (u:User {id: $userId})
          MATCH (a:Attraction {name: $attraction})
          MERGE (u)-[v:VISITED]->(a)
          SET v.visitedAt = datetime()
          `,
          { userId, attraction }
        );

        console.log(`Visit detected: ${attraction}`);
      }
    }
  } catch (err) {
    console.error("Visit detection failed:", err.message);
  } finally {
    await session.close();
  }
}

module.exports = { autoDetectVisit, calculateDistanceKm };
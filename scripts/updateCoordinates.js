const path = require("path");
// ensure env variables are available even when script runs from scripts/ folder
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const fs = require("fs");
const csv = require("csv-parser");
const driver = require("../db/neo4j"); // adjust path if needed

// CSV is located in project root
const inputFile = path.resolve(__dirname, "../SriLanka_Locations.csv");

async function updateLocations() {
  const session = driver.session();
  const updates = [];

  // Read CSV and prepare updates
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  fs.createReadStream(inputFile)
    .on("error", (err) => { console.error("ReadStream error:", err); })
    .pipe(csv())
    .on("data", (row) => {
      const name = row.Location_Name?.trim();
      const city = row.Located_City?.trim();
      const latitude = parseFloat(row.Latitude);
      const longitude = parseFloat(row.Longitude);

      if (!name || !city || isNaN(latitude) || isNaN(longitude)) return;

      updates.push({ name, city, latitude, longitude });
    })
    .on("end", async () => {
      console.log(`Total locations to update: ${updates.length}`);

      try {
        for (let i = 0; i < updates.length; i++) {
          const { name, city, latitude, longitude } = updates[i];

          await session.run(
            `
            MATCH (a:Attraction {name: $name})
            MATCH (c:City {name: $city})
            MERGE (a)-[:LOCATED_IN]->(c)
            SET a.latitude = $latitude, a.longitude = $longitude
            `,
            { name, city, latitude, longitude }
          );

          console.log(`Updated ${i + 1}/${updates.length}: ${name}`);
        }

        console.log("All locations updated with coordinates.");
      } catch (error) {
        console.error("Neo4j update error:", error);
      } finally {
        await session.close();
        await driver.close();
      }
    });
}

updateLocations();
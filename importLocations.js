const fs = require("fs");
const csv = require("csv-parser");
const driver = require("./db/neo4j");

const BATCH_SIZE = 500;

const importLocations = async () => {
  const session = driver.session();
  const uniqueLocations = new Map();

  console.log("Reading dataset...");

  fs.createReadStream("Reviews.csv")
    .pipe(csv())
    .on("data", (row) => {
      const locationName = row.Location_Name?.trim();
      const city = row.Located_City?.trim();
      const locationType = row.Location_Type?.trim();

      if (!locationName || !city || !locationType) return;

      const key = `${locationName}-${city}`;

      // Keep only unique locations
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, {
          locationName,
          city,
          locationType
        });
      }
    })
    .on("end", async () => {
      console.log(`Unique locations found: ${uniqueLocations.size}`);

      const locationsArray = Array.from(uniqueLocations.values());

      try {
        for (let i = 0; i < locationsArray.length; i += BATCH_SIZE) {
          const batch = locationsArray.slice(i, i + BATCH_SIZE);

          await session.run(
            `
            UNWIND $batch AS row

            MERGE (a:Attraction {name: row.locationName})
            MERGE (c:City {name: row.city})
            MERGE (t:LocationType {name: row.locationType})

            MERGE (a)-[:LOCATED_IN]->(c)
            MERGE (a)-[:BELONGS_TO_TYPE]->(t)
            `,
            { batch }
          );

          console.log(`Inserted batch ${i / BATCH_SIZE + 1}`);
        }

        console.log(" Location import completed successfully");
      } catch (error) {
        console.error("Import Error:", error);
      } finally {
        await session.close();
        await driver.close();
      }
    });
};

importLocations();
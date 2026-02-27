require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");

const HERE_API_KEY = process.env.HERE_API_KEY;

if (!HERE_API_KEY) {
  throw new Error("HERE_API_KEY missing in .env");
}

const inputFile = "Reviews.csv";
const outputFile = "Unique_Locations_With_Coordinates.csv";

const uniqueLocations = new Map();

async function geocodeLocation(name, city) {
  try {
    const query = `${name}, ${city}, Sri Lanka`;

    const response = await axios.get(
      "https://geocode.search.hereapi.com/v1/geocode",
      {
        params: {
          q: query,
          apiKey: HERE_API_KEY,
        },
      }
    );

    if (!response.data.items.length) {
      console.log(`No result found for ${query}`);
      return { latitude: null, longitude: null };
    }

    const position = response.data.items[0].position;

    return {
      latitude: position.lat,
      longitude: position.lng,
    };
  } catch (error) {
    console.error("Geocoding error:", error.response?.data || error.message);
    return { latitude: null, longitude: null };
  }
}

async function processCSV() {
  console.log("Reading dataset...");

  fs.createReadStream(inputFile)
    .pipe(csv())
    .on("data", (row) => {
      const locationName = row.Location_Name?.trim();
      const city = row.Located_City?.trim();
      const locationType = row.Location_Type?.trim();

      if (!locationName || !city || !locationType) return;

      const key = `${locationName}-${city}`;

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

      const finalResults = [];
      const locationsArray = Array.from(uniqueLocations.values());

      for (let i = 0; i < locationsArray.length; i++) {
        const location = locationsArray[i];

        console.log(
          `Geocoding ${i + 1}/${locationsArray.length}: ${location.locationName}`
        );

        const { latitude, longitude } = await geocodeLocation(
          location.locationName,
          location.city
        );

        finalResults.push({
          Location_Name: location.locationName,
          Located_City: location.city,
          Location_Type: location.locationType,
          Latitude: latitude,
          Longitude: longitude
        });

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      writeOutput(finalResults);
    });
}

function writeOutput(data) {
  const headers = Object.keys(data[0]);

  const csvContent =
    headers.join(",") +
    "\n" +
    data
      .map((row) =>
        headers.map((header) => `"${row[header] ?? ""}"`).join(",")
      )
      .join("\n");

  fs.writeFileSync(outputFile, csvContent);

  console.log("Geocoding completed.");
  console.log("Saved file:", outputFile);
}

processCSV();
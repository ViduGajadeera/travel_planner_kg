const path = require("path");
// make sure .env from project root is loaded when running from \"scripts\" directory
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { getTrafficInfo } = require("../services/trafficServices");

async function main() {

  // Example: Colombo → Galle
  //const originLat = 6.9271;
  //const originLon = 79.8612;

  //const destLat = 6.0320;
 // const destLon = 80.2168;

 // Colombo Fort → Maharagama
const originLat = 6.9394;  // Colombo Fort
const originLon = 79.8476;

const destLat = 6.87143;    // Maharagama
const destLon = 80.12106;

  try {
    const traffic = await getTrafficInfo(
      originLat,
      originLon,
      destLat,
      destLon
    );

    console.log("Traffic Result:");
    console.log(traffic);

  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

main();
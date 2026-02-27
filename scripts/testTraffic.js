require("dotenv").config();
const { getTrafficInfo } = require("../services/trafficServices");

async function main() {

  // Example: Colombo → Galle
  //const originLat = 6.9271;
  //const originLon = 79.8612;

  //const destLat = 6.0320;
 // const destLon = 80.2168;

 // Colombo Fort → Maharagama
const originLat = 6.9344;  // Colombo Fort
const originLon = 79.8428;

const destLat = 6.8490;    // Maharagama
const destLon = 79.9260;

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
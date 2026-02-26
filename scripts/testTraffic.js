require('dotenv').config();
const traffic = require('../services/trafficServices');

async function main() {
  // default to Galle, Sri Lanka if no arguments provided
  const defaultCity = 'Galle';
  // pick a point on the main Galle Road where traffic data is available
  const defaultLat = '6.0376';
  const defaultLon = '80.2135';

  let [city, lat, lon] = process.argv.slice(2);
  if (!city || !lat || !lon) {
    console.warn('No arguments supplied, defaulting to Galle coordinates');
    city = defaultCity;
    lat = defaultLat;
    lon = defaultLon;
  }

  try {
    await traffic.updateTrafficForAttraction(city, lat, lon);
    console.log('Traffic service executed successfully');
  } catch (err) {
    console.error('Traffic service error:', err);
    process.exitCode = 1;
  }
}

main();

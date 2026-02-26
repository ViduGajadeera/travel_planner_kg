require('dotenv').config();
const neo4j = require('neo4j-driver');

async function main() {
  const uri = process.env.NEO4J_URI || process.argv[2];
  const user = process.env.NEO4J_USERNAME || process.argv[3] || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || process.argv[4];

  if (!uri || !password) {
    console.error('Usage: set NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD or pass as args: node scripts/check_neo4j.js <URI> <USER> <PASSWORD>');
    process.exit(2);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  try {
    await driver.verifyConnectivity();
    console.log('Driver connectivity: OK');

    const session = driver.session();
    try {
      const res = await session.executeRead(tx => tx.run('RETURN 1 AS v'));
      const v = res.records[0].get('v');
      console.log('Test query returned:', v.toString());
    } finally {
      await session.close();
    }
  } catch (err) {
    console.error('Connection failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await driver.close();
  }
}

main();

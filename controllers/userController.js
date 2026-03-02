const driver = require("../db/neo4j");
const bcrypt = require("bcrypt");

// POST /api/register
exports.register = async (req, res) => {
  const { name, email, password, preferences } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const session = driver.session();

  try {
    // Check if email exists
    const existing = await session.run(
      `MATCH (u:User {email:$email}) RETURN u`,
      { email }
    );

    if (existing.records.length) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user node with system-generated ID
    const result = await session.run(
      `
      CREATE (u:User {
        id: apoc.create.uuid(),
        name: $name,
        email: $email,
        password: $hashed
      })
      RETURN u.id AS id, u.name AS name, u.email AS email
      `,
      { name, email, hashed }
    );

    const user = result.records[0].toObject();

    // Create preferences relationships if provided
    if (preferences?.length) {
      for (let pref of preferences) {
        await session.run(
          `
          MATCH (u:User {email:$email}), (c:Category {name:$category})
          MERGE (u)-[:LIKES]->(c)
          `,
          { email, category: pref }
        );
      }
    }

    res.json({ message: "User registered successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  } finally {
    await session.close();
  }
};

// POST /api/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const session = driver.session();

  try {
    // Fetch user node by email
    const result = await session.run(
      `MATCH (u:User {email: $email}) 
       RETURN u.id AS id, u.name AS name, u.email AS email, u.password AS password`,
      { email }
    );

    if (result.records.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.records[0].toObject();
    const hashedPassword = user.password;

    // Compare password
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Login successful
    return res.json({
      message: "Login successful",
      userId: user.id,
      name: user.name,
      email: user.email,
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  } finally {
    await session.close();
  }
};
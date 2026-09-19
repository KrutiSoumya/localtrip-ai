const prisma = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===== REGISTER =====
exports.register = async (req, res) => {
  try {
    const {
  email,
  password,
  name,
  agency_name
} = req.body;

if (!email || !password || !agency_name) {
return res.status(400).json({
  error: "Email, password and agency name required",
});
    }

    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

const hashedPassword = await bcrypt.hash(password, 10);

const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
    name: name || null,
    agency_name,
  },
});

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    res.status(500).json({
      error: "Registration failed",
      details: error.message,
    });
  }
};

// ===== LOGIN =====
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if body exists
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // plain text check (since DB uses plain password)
const isPasswordValid = await bcrypt.compare(password, user.password);

if (!isPasswordValid) {
  return res.status(401).json({ error: "Invalid credentials" });
}
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    res.status(500).json({
      error: "Login failed",
      details: error.message,
    });
  }
};
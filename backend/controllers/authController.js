
const prisma = require("../services/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

console.log("AUTH CONTROLLER LOADED FROM:", __filename);

// ===== REGISTER =====
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      agencyName,
      agency_name,
    } = req.body;

    // Accept either agencyName (frontend) or agency_name
    const agencyNameValue = agencyName || agency_name;

    // Validate required fields
    if (!email || !password || !agencyNameValue) {
      return res.status(400).json({
        error: "Email, password and agency name required",
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }

    // Check whether the user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        agency_name: agencyNameValue,
      },
    });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        agency_name: user.agency_name,
      },
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      error: "Registration failed",
      details: error.message,
    });
  }
};

// ===== LOGIN =====
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    // Compare submitted password with stored password hash
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Generate authentication token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // Temporary debug logs to verify the active controller
    console.log(
      "LOGIN CONTROLLER VERSION WITH USER OBJECT IS RUNNING"
    );

    console.log("Authenticated user:", {
      id: user.id,
      email: user.email,
      name: user.name,
      agency_name: user.agency_name,
    });

    // Return token and authenticated user's actual details
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        agency_name: user.agency_name,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Login failed",
      details: error.message,
    });
  }
};

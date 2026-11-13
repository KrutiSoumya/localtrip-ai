const crypto = require("crypto");

const algorithm = "aes-256-cbc";

// Derive a 32-byte encryption key
const secretKey = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_SECRET || "default_secret_key")
  .digest();

// Encrypt sensitive data
const encrypt = (text) => {
  if (!text) return text;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
};

// Decrypt sensitive data
const decrypt = (combined) => {
  if (!combined || !combined.includes(":")) return combined;

  const [ivHex, encrypted] = combined.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

// Create a deterministic hash for duplicate detection
const hashValue = (value) => {
  if (!value) return null;

  return crypto
    .createHmac("sha256", secretKey)
    .update(String(value).trim().toLowerCase())
    .digest("hex");
};

module.exports = {
  encrypt,
  decrypt,
  hashValue,
};
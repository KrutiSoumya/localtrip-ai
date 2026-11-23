const prisma = require("../services/db");
const { getAgentUpiId, setAgentUpiId, setAgentProfileSettings } = require("../services/agentPaymentConfig");

const fs = require("fs");
const path = require("path");


const DESTINATIONS_FILE = path.join(
  __dirname,
  "../data/destinations.json"
);

// Read all destinations
function readDestinations() {
  const data = fs.readFileSync(DESTINATIONS_FILE, "utf8");
  return JSON.parse(data);
}

// Save destinations
function writeDestinations(destinations) {
  fs.writeFileSync(
    DESTINATIONS_FILE,
    JSON.stringify(destinations, null, 2),
    "utf8"
  );
}

// Return active destinations
function getActiveDestinations() {
  const destinations = readDestinations();

  return destinations.filter(
    destination => destination.active !== false
  );
}

// Save agent configuration
const saveAgentConfig = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    if (!userId) return res.status(401).json({ error: "User ID not found" });
    const settings = { name: req.body.name, contact: req.body.contact, currency_preference: req.body.currency_preference };
    await setAgentProfileSettings(userId, settings);
    return res.json({ message: "Agent configuration saved successfully", config: settings });
  } catch (error) {
    console.error("Save agent config error:", error);
    return res.status(500).json({ error: "Failed to save agent configuration" });
  }
};

// Get active destinations
const getDestinations = async (req, res) => {
  try {
    const destinations = getActiveDestinations();

    res.json(destinations);

  } catch (error) {
    console.error("Get destinations error:", error);
    res.status(500).json({
      error: "Failed to fetch destinations"
    });
  }
};

// Add a new destination
const addDestination = async (req, res) => {
  try {
    const destination = req.body;

    if (!destination.name) {
      return res.status(400).json({
        error: "Destination name is required"
      });
    }

    const destinations = readDestinations();

    const exists = destinations.some(
      item =>
        item.name.toLowerCase() ===
        destination.name.trim().toLowerCase()
    );

    if (exists) {
      return res.status(409).json({
        error: "Destination already exists"
      });
    }

    destinations.push({
      ...destination,
      name: destination.name.trim(),
      active: destination.active !== false
    });

    writeDestinations(destinations);

    res.status(201).json({
      message: "Destination added successfully",
      destination
    });

  } catch (error) {
    console.error("Add destination error:", error);
    res.status(500).json({
      error: "Failed to add destination"
    });
  }
};

// Activate or deactivate a destination
const updateDestinationStatus = async (req, res) => {
  try {
    const { name } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res.status(400).json({
        error: "Active must be true or false"
      });
    }

    const destinations = readDestinations();

    const index = destinations.findIndex(
      item =>
        item.name.toLowerCase() === name.toLowerCase()
    );

    if (index === -1) {
      return res.status(404).json({
        error: "Destination not found"
      });
    }

    destinations[index].active = active;

    writeDestinations(destinations);

    res.json({
      message: "Destination status updated successfully",
      destination: destinations[index]
    });

  } catch (error) {
    console.error("Update destination status error:", error);
    res.status(500).json({
      error: "Failed to update destination status"
    });
  }
};

// Delete a destination
const deleteDestination = async (req, res) => {
  try {
    const { name } = req.params;

    const destinations = readDestinations();

    const updatedDestinations = destinations.filter(
      item =>
        item.name.toLowerCase() !== name.toLowerCase()
    );

    if (updatedDestinations.length === destinations.length) {
      return res.status(404).json({
        error: "Destination not found"
      });
    }

    writeDestinations(updatedDestinations);

    res.json({
      message: "Destination deleted successfully"
    });

  } catch (error) {
    console.error("Delete destination error:", error);
    res.status(500).json({
      error: "Failed to delete destination"
    });
  }
};


const getAgentPaymentConfig = async (req, res) => {
  try { return res.json({ upi_id: await getAgentUpiId(req.user.id) || "" }); }
  catch (error) { console.error("Get agent payment config error:", error); return res.status(500).json({ message: "Could not load payment settings" }); }
};
const saveAgentPaymentConfig = async (req, res) => {
  try {
    const upiId = String(req.body.upi_id || "").trim();
    await setAgentUpiId(req.user.id, upiId);
    return res.json({ message: "Payment settings saved", upi_id: upiId });
  } catch (error) { console.error("Save agent payment config error:", error); return res.status(500).json({ message: "Could not save payment settings" }); }
};

module.exports = {
  getAgentPaymentConfig,
  saveAgentPaymentConfig,
  saveAgentConfig,
  getDestinations,
  addDestination,
  updateDestinationStatus,
  deleteDestination
};

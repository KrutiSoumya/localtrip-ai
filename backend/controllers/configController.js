const prisma = require("../services/db");

const safeParseDestinations = (value) => {
  try {
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// POST /api/config/agent
const saveAgentConfig = async (req, res) => {
  try {
    const { name, contact, currency_preference } = req.body;

    const existing = await prisma.agentConfig.findFirst();

    const data = {
      name,
      preferences: JSON.stringify({
        contact,
        currency_preference,
      }),
    };

    const config = existing
      ? await prisma.agentConfig.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.agentConfig.create({
          data: {
            ...data,
            destinations_dataset: JSON.stringify([]),
          },
        });

    res.json(config);
  } catch (error) {
    res.status(500).json({
      message: "Error saving agent config",
      error: error.message,
    });
  }
};

// GET /api/config/destinations
const getDestinations = async (req, res) => {
  try {
    const config = await prisma.agentConfig.findFirst();

    const destinations = safeParseDestinations(config?.destinations_dataset);

    res.json(destinations);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching destinations",
      error: error.message,
    });
  }
};

// POST /api/config/destinations
const addDestination = async (req, res) => {
  try {
    const { name, attractions, avg_cost_per_day } = req.body;

    let config = await prisma.agentConfig.findFirst();

    if (!config) {
      config = await prisma.agentConfig.create({
        data: {
          name: "LocalTrip Agency",
          destinations_dataset: JSON.stringify([]),
        },
      });
    }

    const destinations = safeParseDestinations(config.destinations_dataset);

    destinations.push({
      name,
      attractions,
      avg_cost_per_day,
    });

    const updated = await prisma.agentConfig.update({
      where: { id: config.id },
      data: {
        destinations_dataset: JSON.stringify(destinations),
      },
    });

    res.json({
      message: "Destination added successfully",
      destinations,
      config: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding destination",
      error: error.message,
    });
  }
};

// DELETE /api/config/destinations/:name
const deleteDestination = async (req, res) => {
  try {
    const destinationName = req.params.name;

    const config = await prisma.agentConfig.findFirst();

    if (!config) {
      return res.status(404).json({ message: "Agent config not found" });
    }

    const destinations = safeParseDestinations(config.destinations_dataset);

    const filtered = destinations.filter(
      (destination) =>
        destination.name.toLowerCase() !== destinationName.toLowerCase()
    );

    const updated = await prisma.agentConfig.update({
      where: { id: config.id },
      data: {
        destinations_dataset: JSON.stringify(filtered),
      },
    });

    res.json({
      message: "Destination deleted successfully",
      destinations: filtered,
      config: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting destination",
      error: error.message,
    });
  }
};

module.exports = {
  saveAgentConfig,
  getDestinations,
  addDestination,
  deleteDestination,
};
const prisma = require("../services/db");

// Save full itinerary with nested days
const saveItinerary = async (req, res) => {
  try {
    const { leadId, title, summary, days } = req.body;

    const itinerary = await prisma.itinerary.create({
      data: {
        leadId: Number(leadId),
        title,
        summary,
        days: {
          create: days,
        },
      },
      include: {
        days: true,
      },
    });

    res.status(201).json(itinerary);
  } catch (error) {
    res.status(500).json({ message: "Error saving itinerary", error: error.message });
  }
};

// Get itinerary by lead ID
const getItineraryByLeadId = async (req, res) => {
  try {
    const leadId = Number(req.params.leadId);

    const itineraries = await prisma.itinerary.findMany({
      where: { leadId },
      include: {
        days: {
          orderBy: { day_number: "asc" },
        },
        quotations: true,
        bookings: true,
      },
    });

    res.json(itineraries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching itinerary", error: error.message });
  }
};

// Update one itinerary day only
const updateItineraryDay = async (req, res) => {
  try {
    const dayId = Number(req.params.dayId);

    const updatedDay = await prisma.itineraryDay.update({
      where: { id: dayId },
      data: req.body,
    });

    res.json(updatedDay);
  } catch (error) {
    res.status(500).json({ message: "Error updating itinerary day", error: error.message });
  }
};

module.exports = {
  saveItinerary,
  getItineraryByLeadId,
  updateItineraryDay,
};
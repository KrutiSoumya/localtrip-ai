const prisma = require("../services/db");

// Create a new itinerary
const saveItinerary = async (req, res) => {
  try {
    const {
      leadId,
      title,
      summary,
      days,
    } = req.body;

    if (!leadId) {
      return res.status(400).json({
        message: "leadId is required",
      });
    }

    if (!title) {
      return res.status(400).json({
        message: "title is required",
      });
    }

    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({
        message: "At least one itinerary day is required",
      });
    }

    const itinerary = await prisma.itinerary.create({
      data: {
        leadId: Number(leadId),
        title,
        summary: summary || null,

        days: {
          create: days.map((day) => ({
            day_number: Number(day.day_number),
            title: day.title || null,
            activities: day.activities || "",
            meals: day.meals || null,
            hotel: day.hotel || null,
            transport: day.transport || null,
          })),
        },
      },

      include: {
        days: {
          orderBy: {
            day_number: "asc",
          },
        },
      },
    });

    return res.status(201).json(itinerary);
  } catch (error) {
    console.error("Error saving itinerary:", error);

    return res.status(500).json({
      message: "Error saving itinerary",
      error: error.message,
    });
  }
};


// Update an existing itinerary
const updateItinerary = async (req, res) => {
  try {
    const itineraryId = Number(req.params.id);

    if (!itineraryId) {
      return res.status(400).json({
        message: "Invalid itinerary ID",
      });
    }

    const {
      title,
      summary,
      days,
    } = req.body;

    const existing = await prisma.itinerary.findUnique({
      where: {
        id: itineraryId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Itinerary not found",
      });
    }

    const itinerary = await prisma.itinerary.update({
      where: {
        id: itineraryId,
      },

      data: {
        ...(title !== undefined && {
          title,
        }),

        ...(summary !== undefined && {
          summary: summary || null,
        }),
      },
    });

    // If days were supplied, replace the existing day records.
    if (Array.isArray(days)) {
      await prisma.itineraryDay.deleteMany({
        where: {
          itineraryId,
        },
      });

      await prisma.itineraryDay.createMany({
        data: days.map((day) => ({
          itineraryId,

          day_number: Number(day.day_number),

          title: day.title || null,

          activities: day.activities || "",

          meals: day.meals || null,

          hotel: day.hotel || null,

          transport: day.transport || null,
        })),
      });
    }

    const updated = await prisma.itinerary.findUnique({
      where: {
        id: itineraryId,
      },

      include: {
        days: {
          orderBy: {
            day_number: "asc",
          },
        },
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Error updating itinerary:", error);

    return res.status(500).json({
      message: "Error updating itinerary",
      error: error.message,
    });
  }
};


// Get itinerary by lead ID
const getItineraryByLeadId = async (req, res) => {
  try {
    const leadId = Number(req.params.leadId);

    if (!leadId) {
      return res.status(400).json({
        message: "Invalid lead ID",
      });
    }

    const itineraries = await prisma.itinerary.findMany({
      where: {
        leadId,
      },

      include: {
        days: {
          orderBy: {
            day_number: "asc",
          },
        },

        quotations: true,

        bookings: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(itineraries);
  } catch (error) {
    console.error("Error fetching itinerary:", error);

    return res.status(500).json({
      message: "Error fetching itinerary",
      error: error.message,
    });
  }
};


// Update one itinerary day
const updateItineraryDay = async (req, res) => {
  try {
    const dayId = Number(req.params.dayId);

    if (!dayId) {
      return res.status(400).json({
        message: "Invalid day ID",
      });
    }

    const updatedDay = await prisma.itineraryDay.update({
      where: {
        id: dayId,
      },

      data: {
        ...(req.body.day_number !== undefined && {
          day_number: Number(req.body.day_number),
        }),

        ...(req.body.title !== undefined && {
          title: req.body.title,
        }),

        ...(req.body.activities !== undefined && {
          activities: req.body.activities,
        }),

        ...(req.body.meals !== undefined && {
          meals: req.body.meals,
        }),

        ...(req.body.hotel !== undefined && {
          hotel: req.body.hotel,
        }),

        ...(req.body.transport !== undefined && {
          transport: req.body.transport,
        }),
      },
    });

    return res.json(updatedDay);
  } catch (error) {
    console.error("Error updating itinerary day:", error);

    return res.status(500).json({
      message: "Error updating itinerary day",
      error: error.message,
    });
  }
};


module.exports = {
  saveItinerary,
  updateItinerary,
  getItineraryByLeadId,
  updateItineraryDay,
};
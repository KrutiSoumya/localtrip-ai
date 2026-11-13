
const prisma = require("../services/db");

// Normalize activities for the Prisma Json field.
// Keep arrays as arrays; wrap legacy strings in a single-element array.
const normalizeActivities = (activities) => {
  if (Array.isArray(activities)) {
    return activities;
  }

  if (typeof activities === "string" && activities.trim()) {
    return [activities.trim()];
  }

  return [];
};

// Verify that the authenticated user owns the itinerary through its lead.
const findOwnedItinerary = async (itineraryId, userId) => {
  return prisma.itinerary.findFirst({
    where: {
      id: itineraryId,
      lead: {
        userId,
      },
    },
  });
};

// Create a new itinerary
const saveItinerary = async (req, res) => {
  try {
    const {
      leadId,
      title,
      summary,
      days,
      status = "approved",
    } = req.body;

    const parsedLeadId = Number(leadId);
    const userId = Number(req.user?.id);

    if (
      leadId === undefined ||
      leadId === null ||
      leadId === "" ||
      !Number.isInteger(parsedLeadId) ||
      parsedLeadId <= 0
    ) {
      return res.status(400).json({
        message: "A valid numeric leadId is required",
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: parsedLeadId,
        userId,
      },
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "title is required",
      });
    }

    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({
        message: "At least one itinerary day is required",
      });
    }

    if (!["approved", "draft"].includes(status)) {
      return res.status(400).json({
        message: "status must be approved or draft",
      });
    }

    for (const day of days) {
      if (
        !day ||
        !Number.isInteger(Number(day.day_number)) ||
        Number(day.day_number) < 1
      ) {
        return res.status(400).json({
          message:
            "Each itinerary day must have a valid positive day_number",
        });
      }
    }

    const itinerary = await prisma.$transaction(async (tx) => {
      const savedItinerary = await tx.itinerary.create({
        data: {
          leadId: lead.id,
          title: title.trim(),
          summary: summary || null,
          status,

          days: {
            create: days.map((day) => ({
              day_number: Number(day.day_number),
              title: day.title || null,
              activities: normalizeActivities(day.activities),
              meals: day.meals || null,
              hotel: day.hotel || null,
              transport: day.transport || null,
              accommodation: day.accommodation || null,
              accommodation_cost: Number(day.accommodation_cost) || 0,
              transport_cost: Number(day.transport_cost) || 0,
              estimated_cost: Number(day.estimated_cost) || 0,
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

      await tx.lead.update({
        where: {
          id: lead.id,
        },
        data: {
          last_contact: new Date(),
          interaction_count: {
            increment: 1,
          },
        },
      });

      return savedItinerary;
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
    const userId = Number(req.user?.id);

    if (!Number.isInteger(itineraryId) || itineraryId <= 0) {
      return res.status(400).json({
        message: "Invalid itinerary ID",
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const existing = await findOwnedItinerary(itineraryId, userId);

    if (!existing) {
      return res.status(404).json({
        message: "Itinerary not found",
      });
    }

    const { title, summary, days, status } = req.body;

    if (
      title !== undefined &&
      (typeof title !== "string" || !title.trim())
    ) {
      return res.status(400).json({
        message: "title must be a non-empty string",
      });
    }

    if (
      status !== undefined &&
      !["approved", "draft"].includes(status)
    ) {
      return res.status(400).json({
        message: "status must be approved or draft",
      });
    }

    if (days !== undefined) {
      if (!Array.isArray(days)) {
        return res.status(400).json({
          message: "days must be an array",
        });
      }

      for (const day of days) {
        if (
          !day ||
          !Number.isInteger(Number(day.day_number)) ||
          Number(day.day_number) < 1
        ) {
          return res.status(400).json({
            message:
              "Each itinerary day must have a valid positive day_number",
          });
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.itinerary.update({
        where: {
          id: itineraryId,
        },
        data: {
          ...(title !== undefined && {
            title: title.trim(),
          }),
          ...(summary !== undefined && {
            summary: summary || null,
          }),
          ...(status !== undefined && {
            status,
          }),
        },
      });

      if (Array.isArray(days)) {
        await tx.itineraryDay.deleteMany({
          where: {
            itineraryId,
          },
        });

        if (days.length > 0) {
          await tx.itineraryDay.createMany({
            data: days.map((day) => ({
              itineraryId,
              day_number: Number(day.day_number),
              title: day.title || null,
              activities: normalizeActivities(day.activities),
              meals: day.meals || null,
              hotel: day.hotel || null,
              transport: day.transport || null,
              accommodation: day.accommodation || null,
              accommodation_cost: Number(day.accommodation_cost) || 0,
              transport_cost: Number(day.transport_cost) || 0,
              estimated_cost: Number(day.estimated_cost) || 0,
            })),
          });
        }
      }

      return tx.itinerary.findUnique({
        where: {
          id: itineraryId,
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
      });
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

// Get one saved itinerary by its ID
const getItineraryById = async (req, res) => {
  try {
    const itineraryId = Number(req.params.id);
    const userId = Number(req.user?.id);

    if (!Number.isInteger(itineraryId) || itineraryId <= 0) {
      return res.status(400).json({
        message: "Invalid itinerary ID",
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const itinerary = await prisma.itinerary.findFirst({
      where: {
        id: itineraryId,
        lead: {
          userId,
        },
      },
      include: {
        days: {
          orderBy: {
            day_number: "asc",
          },
        },
        quotations: true,
        bookings: true,
        lead: true,
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerary not found",
      });
    }

    return res.json(itinerary);
  } catch (error) {
    console.error("Error fetching itinerary by ID:", error);

    return res.status(500).json({
      message: "Error fetching itinerary",
      error: error.message,
    });
  }
};

// Get itineraries by lead ID
const getItineraryByLeadId = async (req, res) => {
  try {
    const leadId = Number(req.params.leadId);
    const userId = Number(req.user?.id);

    if (!Number.isInteger(leadId) || leadId <= 0) {
      return res.status(400).json({
        message: "Invalid lead ID",
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        userId,
      },
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const itineraries = await prisma.itinerary.findMany({
      where: {
        leadId: lead.id,
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
    console.error("Error fetching itineraries by lead:", error);

    return res.status(500).json({
      message: "Error fetching itineraries",
      error: error.message,
    });
  }
};

// Update one itinerary day
const updateItineraryDay = async (req, res) => {
  try {
    const dayId = Number(req.params.dayId);
    const userId = Number(req.user?.id);

    if (!Number.isInteger(dayId) || dayId <= 0) {
      return res.status(400).json({
        message: "Invalid day ID",
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const existingDay = await prisma.itineraryDay.findUnique({
      where: {
        id: dayId,
      },
    });

    if (!existingDay) {
      return res.status(404).json({
        message: "Itinerary day not found",
      });
    }

    const ownedItinerary = await findOwnedItinerary(
      existingDay.itineraryId,
      userId
    );

    if (!ownedItinerary) {
      return res.status(404).json({
        message: "Itinerary day not found",
      });
    }

    const data = {};

    if (req.body.day_number !== undefined) {
      const dayNumber = Number(req.body.day_number);

      if (!Number.isInteger(dayNumber) || dayNumber < 1) {
        return res.status(400).json({
          message: "Invalid day_number",
        });
      }

      data.day_number = dayNumber;
    }

    if (req.body.title !== undefined) {
      data.title = req.body.title;
    }

    if (req.body.activities !== undefined) {
      data.activities = normalizeActivities(req.body.activities);
    }

    if (req.body.meals !== undefined) {
      data.meals = req.body.meals;
    }

    if (req.body.hotel !== undefined) {
      data.hotel = req.body.hotel;
    }

    if (req.body.transport !== undefined) {
      data.transport = req.body.transport;
    }

    if (req.body.accommodation !== undefined) {
      data.accommodation = req.body.accommodation;
    }

    if (req.body.accommodation_cost !== undefined) {
      data.accommodation_cost = Number(req.body.accommodation_cost);
    }

    if (req.body.transport_cost !== undefined) {
      data.transport_cost = Number(req.body.transport_cost);
    }

    if (req.body.estimated_cost !== undefined) {
      data.estimated_cost = Number(req.body.estimated_cost);
    }

    const updatedDay = await prisma.itineraryDay.update({
      where: {
        id: dayId,
      },
      data,
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
  getItineraryById,
  getItineraryByLeadId,
  updateItineraryDay,
};

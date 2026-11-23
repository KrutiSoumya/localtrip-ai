
const prisma = require("../services/db");

// ===== CREATE BOOKING =====
const createBooking = async (req, res) => {
  try {
    const { leadId, itineraryId } = req.body;
    const userId = req.user.id;

    const parsedLeadId = Number(leadId);
    const parsedItineraryId = Number(itineraryId);

    // Validate IDs
    if (
      !Number.isInteger(parsedLeadId) ||
      !Number.isInteger(parsedItineraryId) ||
      parsedLeadId <= 0 ||
      parsedItineraryId <= 0
    ) {
      return res.status(400).json({
        message: "Valid leadId and itineraryId are required",
      });
    }

    // Verify that the lead belongs to the logged-in user
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

    // Verify that the itinerary belongs to this lead
    const itinerary = await prisma.itinerary.findFirst({
      where: {
        id: parsedItineraryId,
        leadId: parsedLeadId,
      },
      include: {
        days: true,
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerary not found for this lead",
      });
    }

    // Prevent duplicate bookings for the same itinerary
    const existingBooking = await prisma.booking.findFirst({
      where: {
        itineraryId: parsedItineraryId,
      },
    });

    if (existingBooking) {
      return res.status(409).json({
        message: "A booking already exists for this itinerary",
        booking: existingBooking,
      });
    }

    // Calculate the internal quotation amount from itinerary costs
    const totalPrice = itinerary.days.reduce((total, day) => {
      return total + Number(day.estimated_cost || 0);
    }, 0);

    // Create quotation, booking and update lead in one transaction
    const booking = await prisma.$transaction(async (tx) => {

      // Create a minimal internal quotation
      const quotation = await tx.quotation.create({
        data: {
          itineraryId: parsedItineraryId,
          total_price: Math.max(0, Math.round(totalPrice)),
          currency: "INR",
          notes: "Internal quotation created during booking approval.",
        },
      });

      // Create confirmed booking
      const newBooking = await tx.booking.create({
        data: {
          leadId: parsedLeadId,
          itineraryId: parsedItineraryId,
          quotationId: quotation.id,
          status: "Confirmed",
          paymentStatus: "Not Due",
          travelDate: lead.travel_date,
          returnDate: lead.travel_date ? new Date(new Date(lead.travel_date).getTime() + Math.max(itinerary.days.length, 0) * 86400000) : null,
        },
        include: {
          lead: true,
          itinerary: true,
          quotation: true,
        },
      });

      // Update lead status
      await tx.lead.update({
        where: {
          id: parsedLeadId,
        },
        data: {
          status: "Confirmed",
        },
      });

      return newBooking;
    });

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
    });

  } catch (error) {
    console.error("Booking creation error:", error);

    return res.status(500).json({
      message: "Error creating booking",
      error: error.message,
    });
  }
};


// ===== GET ALL BOOKINGS =====
const getAllBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: {
        lead: {
          userId,
        },
      },
      orderBy: {
        bookedAt: "desc",
      },
      include: {
        lead: true,
        itinerary: true,
        quotation: true,
        invoice: true,
      },
    });

    return res.json(bookings);

  } catch (error) {
    console.error("Get all bookings error:", error);

    return res.status(500).json({
      message: "Error fetching bookings",
      error: error.message,
    });
  }
};


// ===== UPCOMING BOOKINGS =====
const getUpcomingBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const next7Days = new Date();

    next7Days.setDate(now.getDate() + 7);

    const bookings = await prisma.booking.findMany({
      where: {
        travelDate: {
          gte: now,
          lte: next7Days,
        },
        lead: {
          userId,
        },
      },
      orderBy: {
        travelDate: "asc",
      },
      include: {
        lead: true,
        itinerary: true,
        quotation: true,
        invoice: true,
      },
    });

    return res.json(bookings);

  } catch (error) {
    console.error("Upcoming bookings error:", error);

    return res.status(500).json({
      message: "Error fetching upcoming bookings",
      error: error.message,
    });
  }
};


// ===== UPDATE BOOKING STATUS =====
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await prisma.booking.findFirst({ where: { id: Number(req.params.id), lead: { userId: req.user.id } } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: req.body.status } });
    return res.json(updated);
  } catch (error) {
    console.error("Booking update error:", error);
    return res.status(500).json({ message: "Error updating booking" });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getUpcomingBookings,
  updateBookingStatus,
};

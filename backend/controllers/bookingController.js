const prisma = require("../services/db");

// ===== CREATE BOOKING =====
const createBooking = async (req, res) => {
  try {
    const { leadId, itineraryId, quotationId } = req.body;
    const userId = req.user.id;

    // Verify that the lead belongs to the logged-in user
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

    // Verify that the itinerary belongs to this lead
    const itinerary = await prisma.itinerary.findFirst({
      where: {
        id: itineraryId,
        leadId,
      },
    });

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerary not found for this lead",
      });
    }

    // Verify that the quotation belongs to this itinerary
    const quotation = await prisma.quotation.findFirst({
      where: {
        id: quotationId,
        itineraryId,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        message: "Quotation not found for this itinerary",
      });
    }

    // Create booking only after all ownership checks pass
    const booking = await prisma.booking.create({
      data: {
        leadId,
        itineraryId,
        quotationId,
        status: "Confirmed",
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: {
        id: leadId,
      },
      data: {
        status: "Confirmed",
      },
    });

    res.json(booking);
  } catch (error) {
    console.error("Booking creation error:", error);

    res.status(500).json({
      message: "Error creating booking",
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

        // Only bookings belonging to the logged-in user's leads
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
      },
    });

    res.json(bookings);
  } catch (error) {
    console.error("Upcoming bookings error:", error);

    res.status(500).json({
      message: "Error fetching upcoming bookings",
      error: error.message,
    });
  }
};


// ===== UPDATE PAYMENT =====
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const bookingId = parseInt(id, 10);
    const userId = req.user.id;

    // Verify that the booking belongs to the logged-in user's lead
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        lead: {
          userId,
        },
      },
    });

    if (!existingBooking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const booking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        paymentStatus,
      },
    });

    res.json(booking);
  } catch (error) {
    console.error("Payment status update error:", error);

    res.status(500).json({
      message: "Error updating payment status",
      error: error.message,
    });
  }
};


module.exports = {
  createBooking,
  getUpcomingBookings,
  updatePaymentStatus,
};

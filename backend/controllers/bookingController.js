const prisma = require("../services/db");

// ===== CREATE BOOKING =====
const createBooking = async (req, res) => {
  try {
    const { leadId, itineraryId, quotationId } = req.body;

    const booking = await prisma.booking.create({
      data: {
        leadId,
        itineraryId,
        quotationId,
        status: "Confirmed",
      },
    });

    // update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "Confirmed" },
    });

    res.json(booking);
  } catch (error) {
    res.status(500).json({
      message: "Error creating booking",
      error: error.message,
    });
  }
};

// ===== UPCOMING BOOKINGS =====
const getUpcomingBookings = async (req, res) => {
  try {
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    const bookings = await prisma.booking.findMany({
      where: {
        travelDate: {
          gte: now,
          lte: next7Days,
        },
      },
      orderBy: {
        travelDate: "asc",
      },
      include: {
        lead: true,
        itinerary: true,
      },
    });

    res.json(bookings);
  } catch (error) {
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

    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { paymentStatus },
    });

    res.json(booking);
  } catch (error) {
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
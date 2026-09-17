const prisma = require("../services/db");
const { generatePDF } = require("../services/pdfService");

// POST /api/pdf/itinerary
const generateItineraryPDF = async (req, res) => {
  try {
    const { itinerary_id } = req.body;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: Number(itinerary_id) },
      include: {
        lead: true,
        days: { orderBy: { day_number: "asc" } },
        quotations: true,
      },
    });

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    const agentConfig = await prisma.agentConfig.findFirst();
    const latestQuotation = itinerary.quotations?.[0];

    const data = {
      agency_name: agentConfig?.name || "LocalTrip Agency",
      agency_contact: "N/A",
      agency_email: "agent@example.com",

      customer_name: itinerary.lead.customer_name,
      customer_email: itinerary.lead.email || "N/A",
      customer_phone: itinerary.lead.phone,
      destination: itinerary.lead.destination || "N/A",

      days: itinerary.days.map((day) => ({
        day: day.day_number,
        activity: day.activities,
        location: itinerary.lead.destination || "N/A",
        cost: "N/A",
      })),

      total_budget: latestQuotation?.total_price || itinerary.lead.budget || 0,
      currency: latestQuotation?.currency || "GBP",
      ai_confidence_label: itinerary.lead.score_label || "N/A",
    };

    const pdfBuffer = await generatePDF("itinerary", data);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=itinerary-${itinerary.id}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      message: "Error generating itinerary PDF",
      error: error.message,
    });
  }
};

// POST /api/pdf/quotation
const generateQuotationPDF = async (req, res) => {
  try {
    const { quotation_id } = req.body;

    const quotation = await prisma.quotation.findUnique({
      where: { id: Number(quotation_id) },
      include: {
        itinerary: {
          include: {
            lead: true,
            days: true,
          },
        },
      },
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const agentConfig = await prisma.agentConfig.findFirst();

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayQuoteCount = await prisma.quotation.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(todayQuoteCount).padStart(3, "0");
    const quoteReference = `QT-${dateStr}-${sequence}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);

    const breakdown = quotation.breakdown || {};

    const data = {
      agency_name: agentConfig?.name || "LocalTrip Agency",
      agency_contact: "N/A",
      agency_email: "agent@example.com",

      quote_reference: quoteReference,
      date_issued: new Date().toISOString().slice(0, 10),
      validity_date: validUntil.toISOString().slice(0, 10),

      customer_name: quotation.itinerary.lead.customer_name,
      destination: quotation.itinerary.lead.destination || "N/A",
      group_size: quotation.itinerary.lead.group_size || "N/A",

      accommodation_cost: breakdown.accommodation || "N/A",
      transport_cost: breakdown.transport || "N/A",
      activities: breakdown.activities || [],

      profit_margin: breakdown.profit_margin || "N/A",
      grand_total: `${quotation.currency} ${quotation.total_price}`,

      ai_summary:
        quotation.notes ||
        "This quotation has been generated based on the selected itinerary and customer preferences.",

      agent_name: agentConfig?.name || "LocalTrip Agent",
    };

    const pdfBuffer = await generatePDF("quotation", data);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=quotation-${quotation.id}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      message: "Error generating quotation PDF",
      error: error.message,
    });
  }
};

// GET /api/pdf/booking-confirmation/:id
const generateBookingConfirmationPDF = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        lead: true,
        itinerary: true,
        quotation: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const agentConfig = await prisma.agentConfig.findFirst();

    const data = {
      agency_name: agentConfig?.name || "LocalTrip Agency",
      booking_id: booking.id,
      customer_name: booking.lead.customer_name,
      destination: booking.lead.destination || "N/A",
      itinerary_title: booking.itinerary.title,
      total_price: `${booking.quotation.currency} ${booking.quotation.total_price}`,
      booking_status: booking.status,
      payment_status: booking.paymentStatus,
      booked_at: booking.bookedAt.toISOString().slice(0, 10),
      travel_date: booking.travelDate
        ? booking.travelDate.toISOString().slice(0, 10)
        : "N/A",
    };

    const pdfBuffer = await generatePDF("booking-confirmation", data);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=booking-confirmation-${booking.id}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      message: "Error generating booking confirmation PDF",
      error: error.message,
    });
  }
};

module.exports = {
  generateItineraryPDF,
  generateQuotationPDF,
  generateBookingConfirmationPDF,
};
const prisma = require("../services/db");

const {
  buildQuote,
  detectPricingAnomalies,
} = require("../services/quotationService");

// ===== CREATE QUOTATION =====
const createQuotation = async (req, res) => {
  try {
    const {
      lead_id,
      itineraryId,
      itinerary,
      margin = 0,
      group_size = 1,
      currency = "INR",
      notes,
    } = req.body;

    const userId = req.user.id;

    let finalItineraryId = itineraryId
      ? Number(itineraryId)
      : null;

    // If lead_id is supplied, verify that the lead belongs
    // to the logged-in user.
    if (lead_id) {
      const lead = await prisma.lead.findFirst({
        where: {
          id: Number(lead_id),
          userId,
        },
      });

      if (!lead) {
        return res.status(404).json({
          message: "Lead not found",
        });
      }
    }

    // If itineraryId is supplied, verify ownership through
    // the associated lead.
    if (finalItineraryId) {
      const existingItinerary = await prisma.itinerary.findFirst({
        where: {
          id: finalItineraryId,
          lead: {
            userId,
          },
        },
      });

      if (!existingItinerary) {
        return res.status(404).json({
          message: "Itinerary not found",
        });
      }

      // If both lead_id and itineraryId are supplied,
      // make sure they belong together.
      if (
        lead_id &&
        existingItinerary.leadId !== Number(lead_id)
      ) {
        return res.status(400).json({
          message: "Itinerary does not belong to the specified lead",
        });
      }
    }

    // If no itineraryId was supplied, find the latest
    // itinerary belonging to the verified lead.
    if (!finalItineraryId && lead_id) {
      const existingItinerary =
        await prisma.itinerary.findFirst({
          where: {
            leadId: Number(lead_id),
            lead: {
              userId,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      if (existingItinerary) {
        finalItineraryId = existingItinerary.id;
      }
    }

    if (!finalItineraryId) {
      return res.status(400).json({
        message: "itineraryId or lead_id is required",
      });
    }

    if (!itinerary || !Array.isArray(itinerary.days)) {
      return res.status(400).json({
        message: "Valid itinerary with days is required",
      });
    }

    const quote = buildQuote(
      itinerary,
      Number(margin),
      Number(group_size)
    );

    const destination =
      itinerary.destination ||
      itinerary.destination_name ||
      null;

    const durationDays =
      itinerary.duration_days ||
      itinerary.days.length ||
      1;

    const anomalyCheck = destination
      ? detectPricingAnomalies(
          quote.breakdown,
          destination,
          durationDays
        )
      : {
          anomalies: [],
          detected: false,
          message:
            "Destination not available for pricing anomaly detection.",
        };

    const storedBreakdown = {
      ...quote.breakdown,
      anomaly_check: anomalyCheck,
    };

    const quotation = await prisma.quotation.create({
      data: {
        itineraryId: finalItineraryId,
        total_price: Math.round(quote.group_total),
        currency: currency || "INR",
        notes: notes || null,
        breakdown: storedBreakdown,
      },
    });

    res.status(201).json({
      message: "Quotation created successfully",
      quotation,
      pricing: {
        per_person: quote.per_person,
        group_total: quote.group_total,
        margin_applied: quote.margin_applied,
        breakdown: quote.breakdown,
      },
      anomaly_check: anomalyCheck,
    });

  } catch (error) {
    console.error("Quotation creation error:", error);

    res.status(500).json({
      message: "Error creating quotation",
      error: error.message,
    });
  }
};


// ===== GET QUOTATIONS BY LEAD =====
const getQuotationByLeadId = async (req, res) => {
  try {
    const leadId = Number(req.params.leadId);
    const userId = req.user.id;

    if (!leadId) {
      return res.status(400).json({
        message: "Invalid lead ID",
      });
    }

    // Verify the lead belongs to the logged-in user.
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

    const quotations = await prisma.quotation.findMany({
      where: {
        itinerary: {
          leadId,
          lead: {
            userId,
          },
        },
      },
      include: {
        itinerary: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(quotations);

  } catch (error) {
    console.error("Quotation fetch error:", error);

    res.status(500).json({
      message: "Error fetching quotation",
      error: error.message,
    });
  }
};


module.exports = {
  createQuotation,
  getQuotationByLeadId,
};
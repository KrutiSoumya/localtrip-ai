const prisma = require("../services/db");

// Create quotation with full breakdown JSON
const createQuotation = async (req, res) => {
  try {
    const { itineraryId, total_price, currency, notes, breakdown } = req.body;

    const quotation = await prisma.quotation.create({
      data: {
        itineraryId: Number(itineraryId),
        total_price: Number(total_price),
        currency: currency || "GBP",
        notes,
        breakdown,
      },
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({
      message: "Error creating quotation",
      error: error.message,
    });
  }
};

// Get quotations by lead ID
const getQuotationByLeadId = async (req, res) => {
  try {
    const leadId = Number(req.params.leadId);

    const quotations = await prisma.quotation.findMany({
      where: {
        itinerary: {
          leadId,
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
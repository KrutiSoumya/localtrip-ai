const prisma = require("../services/db");

// ===== SUMMARY =====
const getSummary = async (req, res) => {
  try {
    const totalLeads = await prisma.lead.count();

    const confirmedBookings = await prisma.booking.count({
      where: {
        status: "Confirmed",
      },
    });

    const budgetStats = await prisma.lead.aggregate({
      _avg: {
        budget: true,
      },
    });

    const conversion_rate =
      totalLeads === 0 ? 0 : confirmedBookings / totalLeads;

    res.json({
      total_leads: totalLeads,
      confirmed_bookings: confirmedBookings,
      conversion_rate,
      conversion_rate_percentage: Number((conversion_rate * 100).toFixed(2)),
      average_budget: budgetStats._avg.budget || 0,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching analytics summary",
      error: error.message,
    });
  }
};

// ===== TOP DESTINATIONS =====
const getTopDestinations = async (req, res) => {
  try {
    const destinations = await prisma.lead.groupBy({
      by: ["destination"],
      where: {
        destination: {
          not: null,
        },
      },
      _count: {
        destination: true,
      },
      orderBy: {
        _count: {
          destination: "desc",
        },
      },
      take: 5,
    });

    const cleaned = destinations
      .filter((item) => item.destination && item.destination.trim() !== "")
      .map((item) => ({
        destination: item.destination,
        count: item._count.destination,
      }));

    res.json(cleaned);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching top destinations",
      error: error.message,
    });
  }
};

// ===== LEADS BY MONTH =====
const getLeadsByMonth = async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM "Lead"
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt")
    `;

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching leads by month",
      error: error.message,
    });
  }
};

// ===== REVENUE & PAYMENTS =====
const getRevenueStats = async (req, res) => {
  try {
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        status: "Confirmed",
      },
      include: {
        quotation: true,
        lead: true,
      },
    });

    const unpaidBookings = confirmedBookings.filter(
      (booking) => booking.paymentStatus === "Pending"
    );

    const total_revenue = confirmedBookings.reduce((sum, booking) => {
      return sum + (booking.quotation?.total_price || 0);
    }, 0);

    const pending_payments = unpaidBookings.reduce((sum, booking) => {
      return sum + (booking.quotation?.total_price || 0);
    }, 0);

    res.json({
      total_revenue,
      pending_payments,
      unpaid_bookings: unpaidBookings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching revenue stats",
      error: error.message,
    });
  }
};

// ===== AI ACCEPTANCE RATE =====
const getAIUsageStats = async (req, res) => {
  try {
    const total = await prisma.aILog.count();

    const accepted = await prisma.aILog.count({
      where: {
        action: "accept", // make sure this matches your schema values
      },
    });

    const acceptance_rate =
      total === 0 ? 0 : Number(((accepted / total) * 100).toFixed(2));

    res.json({
      total_requests: total,
      accepted_requests: accepted,
      acceptance_rate_percentage: acceptance_rate,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching AI usage stats",
      error: error.message,
    });
  }
};

// ===== URGENT LEADS =====
const getUrgentLeads = async (req, res) => {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const leads = await prisma.lead.findMany({
      where: {
        last_contact: {
          lt: threeDaysAgo,
        },
        status: {
          notIn: ["Confirmed", "Lost"],
        },
      },
      orderBy: [
        { score: "desc" },
        { last_contact: "asc" }, // older contact first
      ],
      take: 5,
    });

    const result = leads.map((lead) => {
      const days_since_contact = lead.last_contact
        ? Math.floor((now - new Date(lead.last_contact)) / (1000 * 60 * 60 * 24))
        : null;

      let urgency = "Low";
      if (days_since_contact >= 7) urgency = "High";
      else if (days_since_contact >= 4) urgency = "Medium";

      return {
        id: lead.id,
        customer_name: lead.customer_name,
        status: lead.status,
        score: lead.score,
        days_since_contact,
        urgency,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching urgent leads",
      error: error.message,
    });
  }
};

module.exports = {
  getSummary,
  getTopDestinations,
  getLeadsByMonth,
  getRevenueStats,
  getAIUsageStats,
  getUrgentLeads,
};
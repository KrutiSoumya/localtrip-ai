
const prisma = require("../services/db");

const COLORS = [
  "#0f766e",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#9ca3af",
];

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatLakhs = (amount) => {
  const value = Number(amount || 0);

  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }

  return formatCurrency(value);
};

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Fetch only this agent's leads
    const leads = await prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // Fetch only bookings belonging to this agent's leads
    const bookings = await prisma.booking.findMany({
      where: {
        lead: {
          userId,
        },
      },
      include: {
        lead: true,
        quotation: true,
        invoice: true,
      },
      orderBy: {
        bookedAt: "asc",
      },
    });

    const confirmedBookings = bookings.filter(
      (booking) => ["Confirmed", "Completed"].includes(booking.status)
    );

    const confirmedLeadIds = new Set(
      confirmedBookings.map((booking) => booking.leadId)
    );

    const totalLeads = leads.length;
    const convertedLeads = confirmedLeadIds.size;

    const totalRevenue = bookings.reduce((sum, booking) =>
      sum + (booking.invoice?.status === "Paid" ? Number(booking.invoice.final_amount || 0) : 0), 0);

    const conversionRate =
      totalLeads === 0
        ? 0
        : (convertedLeads / totalLeads) * 100;

    const paidCount = bookings.filter(booking => booking.invoice?.status === "Paid").length;
    const averageDealSize = paidCount === 0 ? 0 : totalRevenue / paidCount;
    const awaitingPayment = bookings.filter(booking => ["Sent", "Overdue"].includes(booking.invoice?.status)).reduce((sum, booking) => sum + Number(booking.invoice.final_amount || 0), 0);
    const expectedRevenue = confirmedBookings.filter(booking => booking.paymentStatus !== "Paid").reduce((sum, booking) => sum + Number(booking.quotation?.total_price || 0), 0);

    // Monthly leads for the last 6 months
    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );

    const leadsPerMonth = [];

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(
        sixMonthsAgo.getFullYear(),
        sixMonthsAgo.getMonth() + i,
        1
      );

      const monthEnd = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        1
      );

      const monthLeads = leads.filter((lead) => {
        const created = new Date(lead.createdAt);
        return created >= monthStart && created < monthEnd;
      });

      const converted = monthLeads.filter(
        (lead) => confirmedLeadIds.has(lead.id)
      ).length;

      leadsPerMonth.push({
        month: monthStart.toLocaleString("en-IN", {
          month: "short",
        }),
        leads: monthLeads.length,
        converted,
      });
    }

    // Weekly bookings and revenue for the last 8 weeks
    const bookingsOverTime = [];

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setDate(
        weekStart.getDate() - weekStart.getDay()
      );

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekBookings = confirmedBookings.filter(
        (booking) => {
          const bookedAt = new Date(booking.bookedAt);
          return bookedAt >= weekStart && bookedAt < weekEnd;
        }
      );

      const weekRevenue = weekBookings.reduce((sum, booking) =>
        sum + (booking.invoice?.status === "Paid" ? Number(booking.invoice.final_amount || 0) : 0), 0);

      bookingsOverTime.push({
        week: `Wk ${8 - i}`,
        bookings: weekBookings.length,
        revenue: weekRevenue,
      });
    }

    // Top destinations from confirmed bookings
    const destinationCounts = {};

    confirmedBookings.forEach((booking) => {
      const destination = booking.lead?.destination?.trim();

      if (destination) {
        destinationCounts[destination] =
          (destinationCounts[destination] || 0) + 1;
      }
    });

    const topDestinations = Object.entries(destinationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }));

    // Conversion by lead source
    const sourceNames = [
      "WhatsApp",
      "Email",
      "Referral",
      "Walk In",
      "Instagram",
    ];

    const conversionBySource = sourceNames.map((source) => {
      const sourceLeads = leads.filter(
        (lead) => lead.source === source
      );

      const converted = sourceLeads.filter(
        (lead) => confirmedLeadIds.has(lead.id)
      ).length;

      return {
        source,
        leads: sourceLeads.length,
        converted,
      };
    });

    // Summary
    const summary = {
      totalRevenue: formatLakhs(totalRevenue),
      awaitingPayment: formatLakhs(awaitingPayment),
      expectedRevenue: formatLakhs(expectedRevenue),
      totalLeads,
      conversionRate: `${conversionRate.toFixed(1)}%`,
      avgDealSize: formatCurrency(averageDealSize),
      revenueTrend: "Live data",
      leadsTrend: "Live data",
      conversionTrend: "Live data",
      dealTrend: "Live data",
    };

    return res.status(200).json({
      leadsPerMonth,
      bookingsOverTime,
      topDestinations,
      conversionBySource,
      summary,
      topAgents: [],
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return res.status(500).json({
      message: "Failed to fetch analytics",
    });
  }
};

// ===== SUMMARY =====
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalLeads = await prisma.lead.count({
      where: { userId },
    });

    const confirmedBookings = await prisma.booking.count({
      where: {
        status: { in: ["Confirmed", "Completed"] },
        lead: { userId },
      },
    });

    const conversionRate =
      totalLeads === 0 ? 0 : confirmedBookings / totalLeads;

    const userBookings = await prisma.booking.findMany({ where: { lead: { userId } }, include: { quotation: true, invoice: true } });
    const paidRevenue = userBookings.reduce((sum, b) => sum + (b.invoice?.status === "Paid" ? Number(b.invoice.final_amount || 0) : 0), 0);
    const awaitingPayment = userBookings.filter(b => ["Sent", "Overdue"].includes(b.invoice?.status)).reduce((sum, b) => sum + Number(b.invoice.final_amount || 0), 0);
    const expectedRevenue = userBookings.filter(b => b.status === "Confirmed" && b.paymentStatus !== "Paid").reduce((sum, b) => sum + Number(b.quotation?.total_price || 0), 0);

    const budgetStats = await prisma.lead.aggregate({
      where: { userId },
      _avg: { budget: true },
    });

    return res.json({
      total_leads: totalLeads,
      confirmed_bookings: confirmedBookings,
      conversion_rate: conversionRate,
      conversion_rate_percentage: Number(
        (conversionRate * 100).toFixed(2)
      ),
      average_budget: budgetStats._avg.budget || 0,
      total_revenue: paidRevenue,
      awaiting_payment: awaitingPayment,
      expected_revenue: expectedRevenue,
    });
  } catch (error) {
    console.error("Summary error:", error);
    return res.status(500).json({
      message: "Error fetching analytics summary",
    });
  }
};

// ===== TOP DESTINATIONS =====
const getTopDestinations = async (req, res) => {
  try {
    const destinations = await prisma.lead.groupBy({
      by: ["destination"],
      where: {
        userId: req.user.id,
        destination: { not: null },
      },
      _count: { destination: true },
      orderBy: {
        _count: { destination: "desc" },
      },
      take: 5,
    });

    return res.json(
      destinations
        .filter((item) => item.destination?.trim())
        .map((item) => ({
          destination: item.destination,
          count: item._count.destination,
        }))
    );
  } catch (error) {
    console.error("Top destinations error:", error);
    return res.status(500).json({
      message: "Error fetching top destinations",
    });
  }
};

// ===== LEADS BY MONTH =====
const getLeadsByMonth = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const leads = await prisma.lead.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const counts = {};

    leads.forEach((lead) => {
      const key = new Date(lead.createdAt).toISOString().slice(0, 7);
      counts[key] = (counts[key] || 0) + 1;
    });

    return res.json(
      Object.entries(counts).map(([month, count]) => ({
        month,
        count,
      }))
    );
  } catch (error) {
    console.error("Leads by month error:", error);
    return res.status(500).json({
      message: "Error fetching leads by month",
    });
  }
};

// ===== REVENUE & PAYMENTS =====
const getRevenueStats = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ where: { lead: { userId: req.user.id } }, include: { quotation: true, invoice: true, lead: true } });
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.invoice?.status === "Paid" ? Number(b.invoice.final_amount || 0) : 0), 0);
    const awaitingPayment = bookings.filter(b => ["Sent", "Overdue"].includes(b.invoice?.status)).reduce((sum, b) => sum + Number(b.invoice.final_amount || 0), 0);
    const expectedRevenue = bookings.filter(b => b.status === "Confirmed" && b.paymentStatus !== "Paid").reduce((sum, b) => sum + Number(b.quotation?.total_price || 0), 0);
    return res.json({ total_revenue: totalRevenue, awaiting_payment: awaitingPayment, expected_revenue: expectedRevenue, unpaid_bookings: bookings.filter(b => b.status === "Confirmed" && b.paymentStatus !== "Paid") });
  } catch (error) {
    console.error("Revenue error:", error);
    return res.status(500).json({ message: "Error fetching revenue stats" });
  }
};

// ===== AI ACCEPTANCE RATE =====
const getAIUsageStats = async (req, res) => {
  try {
    // Retained as a separate endpoint.
    // User-level filtering depends on the AILog ownership fields.
    const total = await prisma.aILog.count();

    const accepted = await prisma.aILog.count({
      where: { action: "accept" },
    });

    return res.json({
      total_requests: total,
      accepted_requests: accepted,
      acceptance_rate_percentage:
        total === 0 ? 0 : Number(((accepted / total) * 100).toFixed(2)),
    });
  } catch (error) {
    console.error("AI usage error:", error);
    return res.status(500).json({
      message: "Error fetching AI usage stats",
    });
  }
};

// ===== URGENT LEADS =====
const getUrgentLeads = async (req, res) => {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(
      now.getTime() - 3 * 24 * 60 * 60 * 1000
    );

    const leads = await prisma.lead.findMany({
      where: {
        userId: req.user.id,
        last_contact: { lt: threeDaysAgo },
        status: { notIn: ["Confirmed", "Lost"] },
      },
      orderBy: [
        { score: "desc" },
        { last_contact: "asc" },
      ],
      take: 5,
    });

    const result = leads.map((lead) => {
      const daysSinceContact = lead.last_contact
        ? Math.floor(
            (now - new Date(lead.last_contact)) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      let urgency = "Low";
      if (daysSinceContact >= 7) urgency = "High";
      else if (daysSinceContact >= 4) urgency = "Medium";

      return {
        id: lead.id,
        customer_name: lead.customer_name,
        status: lead.status,
        score: lead.score,
        days_since_contact: daysSinceContact,
        urgency,
      };
    });

    return res.json(result);
  } catch (error) {
    console.error("Urgent leads error:", error);
    return res.status(500).json({
      message: "Error fetching urgent leads",
    });
  }
};

module.exports = {
  getAnalytics,
  getSummary,
  getTopDestinations,
  getLeadsByMonth,
  getRevenueStats,
  getAIUsageStats,
  getUrgentLeads,
};

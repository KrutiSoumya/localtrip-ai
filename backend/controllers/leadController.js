const prisma = require("../services/db");
const { encrypt, decrypt } = require("../utils/encryption");
const { sanitize } = require("../utils/sanitizer");
const {
  prioritiseFollowUps,
  calculateLeadScore,
} = require("../services/leadScorer");

// Create a new lead
const createLead = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      customer_name,
      phone,
      email,
      inquiry_text,
      destination,
      duration,
      travel_date,
      budget,
      group_size,
      preferences,
      status,
      last_contact,
      interaction_count,
      ...otherData
    } = req.body;

    // Basic validation
    if (!customer_name || !phone || !inquiry_text) {
      return res.status(400).json({
        message: "customer_name, phone and inquiry_text are required",
      });
    }

    // Check for possible duplicate by fuzzy customer name
    const possibleDuplicates = await prisma.lead.findMany({
      where: {
        userId,
        customer_name: {
          contains: customer_name,
          mode: "insensitive",
        },
      },
    });

    // Since phone/email are encrypted in DB, decrypt before comparing
    const duplicate = possibleDuplicates.find((lead) => {
      const decryptedPhone = decrypt(lead.phone);
      const decryptedEmail = lead.email
        ? decrypt(lead.email)
        : null;

      return (
        decryptedPhone === phone ||
        decryptedEmail === email ||
        lead.customer_name
          .toLowerCase()
          .includes(customer_name.toLowerCase())
      );
    });

    if (duplicate) {
      return res.json({
        duplicate: true,
        existing_lead_id: duplicate.id,
      });
    }

    // Calculate lead score before creating the lead
    const calculatedScore = calculateLeadScore({
      budget,
      travel_date,
      interaction_count,
    });

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        ...otherData,

        customer_name,

        phone: encrypt(phone),
        email: email ? encrypt(email) : null,

        inquiry_text: sanitize(inquiry_text),

        destination: destination
          ? sanitize(destination)
          : null,

        duration:
          duration !== undefined
            ? Number(duration)
            : null,

        travel_date: travel_date
          ? new Date(travel_date)
          : null,

        budget:
          budget !== undefined
            ? Number(budget)
            : null,

        group_size:
          group_size !== undefined
            ? Number(group_size)
            : null,

        preferences: preferences
          ? sanitize(preferences)
          : null,

        status: status || "New",

        // Persist calculated lead score
        score: calculatedScore.score,
        score_label: calculatedScore.status,

        last_contact: last_contact
          ? new Date(last_contact)
          : null,

        interaction_count:
          interaction_count !== undefined
            ? Number(interaction_count)
            : 0,

        userId,
      },
    });

    res.status(201).json({
      duplicate: false,
      lead: {
        ...lead,
        phone: decrypt(lead.phone),
        email: lead.email
          ? decrypt(lead.email)
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating lead",
      error: error.message,
    });
  }
};

// Get all leads for logged-in user
const getLeads = async (req, res) => {
  try {
    const userId = req.user.id;

    const leads = await prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const decryptedLeads = leads.map((lead) => ({
      ...lead,
      phone: decrypt(lead.phone),
      email: decrypt(lead.email),
    }));

    res.json(decryptedLeads);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching leads",
      error: error.message,
    });
  }
};

// Get priority leads for logged-in user
const getPriorityLeads = async (req, res) => {
  try {
    const userId = req.user.id;

    const leads = await prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const priorityLeads = prioritiseFollowUps(leads);

    const decryptedLeads = priorityLeads.map((lead) => ({
      ...lead,
      phone: decrypt(lead.phone),
      email: decrypt(lead.email),
    }));

    res.json(decryptedLeads);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching priority leads",
      error: error.message,
    });
  }
};

// Get one lead by ID
const getLeadById = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        itineraries: true,
        bookings: true,
      },
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    res.json({
      ...lead,
      phone: decrypt(lead.phone),
      email: decrypt(lead.email),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching lead",
      error: error.message,
    });
  }
};

// Update lead status
const updateLeadStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingLead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    res.json({
      ...updatedLead,
      phone: decrypt(updatedLead.phone),
      email: decrypt(updatedLead.email),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating lead status",
      error: error.message,
    });
  }
};

// Delete lead
const deleteLead = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingLead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    await prisma.lead.delete({
      where: { id },
    });

    res.json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting lead",
      error: error.message,
    });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
  getPriorityLeads,
};


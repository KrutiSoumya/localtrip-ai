const prisma = require("../services/db");
const { encrypt, decrypt } = require("../utils/encryption");
const { sanitize } = require("../utils/sanitizer");

// Create a new lead
const createLead = async (req, res) => {
  try {
    const userId = req.user.id;

    const { customer_name, phone, email } = req.body;

    // Check for possible duplicate by fuzzy customer name
    const possibleDuplicates = await prisma.lead.findMany({
      where: {
        userId,
        customer_name: {
          contains: customer_name || "",
          mode: "insensitive",
        },
      },
    });

    // Since phone/email are encrypted in DB, decrypt before comparing
    const duplicate = possibleDuplicates.find((lead) => {
      const decryptedPhone = decrypt(lead.phone);
      const decryptedEmail = decrypt(lead.email);

      return (
        decryptedPhone === phone ||
        decryptedEmail === email ||
        lead.customer_name
          .toLowerCase()
          .includes((customer_name || "").toLowerCase())
      );
    });

    if (duplicate) {
      return res.json({
        duplicate: true,
        existing_lead_id: duplicate.id,
      });
    }

    const lead = await prisma.lead.create({
      data: {
        ...req.body,

        phone: encrypt(phone),
        email: encrypt(email),

        inquiry_text: sanitize(req.body.inquiry_text),
        preferences: sanitize(req.body.preferences),

        userId,
      },
    });

    res.status(201).json({
      duplicate: false,
      lead: {
        ...lead,
        phone: decrypt(lead.phone),
        email: decrypt(lead.email),
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
const getAllLeads = async (req, res) => {
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
      return res.status(404).json({ message: "Lead not found" });
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

    const existingLead = await prisma.lead.findFirst({
      where: { id, userId },
    });

    if (!existingLead) {
      return res.status(404).json({ message: "Lead not found" });
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
      where: { id, userId },
    });

    if (!existingLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    await prisma.lead.delete({
      where: { id },
    });

    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting lead",
      error: error.message,
    });
  }
};

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
};
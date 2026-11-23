
const prisma = require("../services/db");

const {
  encrypt,
  decrypt,
  hashValue,
} = require("../utils/encryption");

const { sanitize } = require("../utils/sanitizer");

const {
  prioritiseFollowUps,
  calculateLeadScore,
} = require("../services/leadScorer");

console.log("LEAD CONTROLLER LOADED:", __filename);


// =====================================================
// CONSTANTS
// =====================================================

const ALLOWED_SOURCES = [
  "WhatsApp",
  "Email",
  "Referral",
  "Walk In",
  "Instagram",
];

const ALLOWED_STATUSES = [
  "New",
  "Contacted",
  "Quoted",
  "Confirmed",
  "Cancelled",
  "Inactive",
];


// =====================================================
// HELPERS
// =====================================================

// Decrypt contact details before returning a lead
const decryptLead = (lead) => {
  if (!lead) return lead;

  return {
    ...lead,
    phone: lead.phone ? decrypt(lead.phone) : null,
    email: lead.email ? decrypt(lead.email) : null,
  };
};


// Parse optional dates safely
const parseOptionalDate = (value) => {
  if (!value) return null;

  let parsedDate;

  if (typeof value === "string") {
    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateMatch) {
      const [, year, month, day] = dateMatch;

      parsedDate = new Date(
        Date.UTC(
          Number(year),
          Number(month) - 1,
          Number(day)
        )
      );
    } else {
      parsedDate = new Date(value);
    }
  } else {
    parsedDate = new Date(value);
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};


// =====================================================
// CREATE LEAD
// =====================================================

const createLead = async (req, res) => {
  try {
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
      groupType,
      preferences,
      source,
      status,
      last_contact,
      interaction_count,
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (
      !customer_name ||
      !phone ||
      !inquiry_text
    ) {
      return res.status(400).json({
        message:
          "Customer name, phone number, and inquiry are required",
      });
    }

    // Validate source
    if (source && !ALLOWED_SOURCES.includes(source)) {
      return res.status(400).json({
        message: "Invalid lead source",
        allowedSources: ALLOWED_SOURCES,
      });
    }

    // Validate status
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid lead status",
      });
    }

    // Validate numeric fields
    if (
      duration !== undefined &&
      duration !== null &&
      (!Number.isFinite(Number(duration)) || Number(duration) < 1)
    ) {
      return res.status(400).json({
        message: "Duration must be a valid positive number",
      });
    }

    if (
      budget !== undefined &&
      budget !== null &&
      (!Number.isFinite(Number(budget)) || Number(budget) < 0)
    ) {
      return res.status(400).json({
        message: "Budget must be a valid non-negative number",
      });
    }

    if (
      group_size !== undefined &&
      group_size !== null &&
      (!Number.isFinite(Number(group_size)) || Number(group_size) < 1)
    ) {
      return res.status(400).json({
        message: "Group size must be a valid positive number",
      });
    }

    if (
      interaction_count !== undefined &&
      interaction_count !== null &&
      (!Number.isInteger(Number(interaction_count)) ||
        Number(interaction_count) < 0)
    ) {
      return res.status(400).json({
        message: "Interaction count must be a non-negative integer",
      });
    }

    // Parse dates
    const parsedTravelDate = parseOptionalDate(travel_date);
    const parsedLastContact = parseOptionalDate(last_contact);

    if (travel_date && !parsedTravelDate) {
      return res.status(400).json({
        message: "Invalid travel date",
      });
    }

    if (last_contact && !parsedLastContact) {
      return res.status(400).json({
        message: "Invalid last contact date",
      });
    }

    // Normalize contact details
    const normalizedPhone = String(phone).trim();

    const normalizedEmail = email
      ? String(email).trim()
      : null;

    const normalizedSource = source
      ? source.trim()
      : null;

    // Validate normalized source
    if (
      normalizedSource &&
      !ALLOWED_SOURCES.includes(normalizedSource)
    ) {
      return res.status(400).json({
        message: "Invalid lead source",
        allowedSources: ALLOWED_SOURCES,
      });
    }

    // Generate deterministic hashes
    const phoneHash = hashValue(normalizedPhone);

    const emailHash = normalizedEmail
      ? hashValue(normalizedEmail)
      : null;

    // Check duplicates using hashes
    const duplicateConditions = [
      { phoneHash },
    ];

    if (emailHash) {
      duplicateConditions.push({ emailHash });
    }

    const duplicateLead = await prisma.lead.findFirst({
      where: {
        userId,
        OR: duplicateConditions,
      },
    });

    if (duplicateLead) {
      return res.status(409).json({
        message:
          "A lead with this phone number or email already exists",
        leadId: duplicateLead.id,
      });
    }

    // Fallback duplicate check for older leads without hashes
    const legacyLeads = await prisma.lead.findMany({
      where: {
        userId,
        OR: [
          { phoneHash: null },
          ...(emailHash ? [{ emailHash: null }] : []),
        ],
      },
      select: {
        id: true,
        phone: true,
        email: true,
      },
    });

    const legacyDuplicate = legacyLeads.find((lead) => {
      let existingPhone = null;
      let existingEmail = null;

      try {
        existingPhone = lead.phone
          ? decrypt(lead.phone)
          : null;

        existingEmail = lead.email
          ? decrypt(lead.email)
          : null;
      } catch (error) {
        console.error(
          `Could not decrypt legacy lead ${lead.id}:`,
          error.message
        );

        return false;
      }

      const phoneMatches =
        existingPhone &&
        existingPhone.trim() === normalizedPhone;

      const emailMatches =
        normalizedEmail &&
        existingEmail &&
        existingEmail.trim().toLowerCase() ===
          normalizedEmail.toLowerCase();

      return phoneMatches || emailMatches;
    });

    if (legacyDuplicate) {
      return res.status(409).json({
        message:
          "A lead with this phone number or email already exists",
        leadId: legacyDuplicate.id,
      });
    }

    // Calculate lead score
    const score = calculateLeadScore({
      budget,
      travel_date: parsedTravelDate,
      duration,
      group_size,
      interaction_count,
    });

    // Create lead
    const newLead = await prisma.lead.create({
      data: {
        customer_name: sanitize(customer_name.trim()),

        phone: encrypt(normalizedPhone),

        email: normalizedEmail
          ? encrypt(normalizedEmail)
          : null,

        phoneHash,
        emailHash,

        inquiry_text: sanitize(inquiry_text),

        destination: destination
          ? sanitize(destination)
          : null,

        preferences: preferences
          ? sanitize(preferences)
          : null,

        // Lead acquisition source for Analytics
        source: normalizedSource,

        duration:
          duration !== undefined && duration !== null
            ? Number(duration)
            : null,

        travel_date: parsedTravelDate,

        budget:
          budget !== undefined && budget !== null
            ? Number(budget)
            : null,

        group_size:
          group_size !== undefined && group_size !== null
            ? Number(group_size)
            : null,

        groupType: groupType
          ? sanitize(groupType)
          : null,

        status: status || "New",

        score: score.score,
        score_label: score.status || "Cold",

        last_contact: parsedLastContact,

        interaction_count:
          interaction_count !== undefined &&
          interaction_count !== null
            ? Number(interaction_count)
            : 0,

        userId,
      },
    });

    return res.status(201).json({
      message: "Lead created successfully",
      lead: decryptLead(newLead),
    });

  } catch (error) {
    console.error("CREATE LEAD ERROR:", error);

    return res.status(500).json({
      message: "Failed to create lead",
      details: error.message,
      code: error.code || null,
    });
  }
};


// =====================================================
// GET ALL LEADS
// =====================================================

const getLeads = async (req, res) => {
  try {
    const userId = req.user.id;

    const leads = await prisma.lead.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(
      leads.map(decryptLead)
    );

  } catch (error) {
    console.error("GET LEADS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch leads",
    });
  }
};


// =====================================================
// GET PRIORITY LEADS
// =====================================================

const getPriorityLeads = async (req, res) => {
  try {
    const userId = req.user.id;

    const leads = await prisma.lead.findMany({
      where: {
        userId,
        status: {
          notIn: ["Confirmed", "Cancelled", "Inactive"],
        },
      },
      orderBy: {
        score: "desc",
      },
    });

    const prioritisedLeads = prioritiseFollowUps(leads);

    return res.status(200).json(
      prioritisedLeads.map(decryptLead)
    );

  } catch (error) {
    console.error("GET PRIORITY LEADS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch priority leads",
    });
  }
};


// =====================================================
// GET SINGLE LEAD
// =====================================================

const getLeadById = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid lead ID",
      });
    }

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

    return res.status(200).json(
      decryptLead(lead)
    );

  } catch (error) {
    console.error("GET LEAD BY ID ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch lead",
    });
  }
};


// =====================================================
// UPDATE LEAD STATUS
// =====================================================

const updateLeadStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid lead ID",
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid lead status",
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
      where: {
        id,
      },
      data: {
        status,
      },
    });

    return res.status(200).json({
      message: "Lead status updated successfully",
      lead: decryptLead(updatedLead),
    });

  } catch (error) {
    console.error("UPDATE LEAD STATUS ERROR:", error);

    return res.status(500).json({
      message: "Failed to update lead status",
    });
  }
};



// =====================================================
// DELETE LEAD
// =====================================================

const deleteLead = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid lead ID",
      });
    }

    // Verify that the lead belongs to the logged-in user
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

    // Delete the lead and its dependent records safely
    await prisma.$transaction(async (tx) => {
      // Find itineraries belonging to this lead
      const itineraries = await tx.itinerary.findMany({
        where: {
          leadId: id,
        },
        select: {
          id: true,
        },
      });

      const itineraryIds = itineraries.map(
        (itinerary) => itinerary.id
      );

      // Delete bookings associated with this lead
      await tx.booking.deleteMany({
        where: {
          leadId: id,
        },
      });

      if (itineraryIds.length > 0) {
        // Delete quotations associated with these itineraries
        await tx.quotation.deleteMany({
          where: {
            itineraryId: {
              in: itineraryIds,
            },
          },
        });

        // Delete itinerary days
        await tx.itineraryDay.deleteMany({
          where: {
            itineraryId: {
              in: itineraryIds,
            },
          },
        });

        // Delete itineraries
        await tx.itinerary.deleteMany({
          where: {
            id: {
              in: itineraryIds,
            },
          },
        });
      }

      // Finally delete the lead
      await tx.lead.delete({
        where: {
          id,
        },
      });
    });

    return res.status(200).json({
      message: "Lead and associated records deleted successfully",
      leadId: id,
    });

  } catch (error) {
    console.error("DELETE LEAD ERROR:", error);

    return res.status(500).json({
      message: "Failed to delete lead",
      error: error.message,
    });
  }
};



// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createLead,
  getLeads,
  getPriorityLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
};

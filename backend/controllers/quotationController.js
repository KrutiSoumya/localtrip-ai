
const prisma = require("../services/db");

const {
    buildQuote,
    detectPricingAnomalies,
} = require("../services/quotationService");

console.log("QUOTATION CONTROLLER VERSION: PRICING INTEGRATION - SCHEMA FIXED");

// --------------------------------------------------
// CREATE QUOTATION
// --------------------------------------------------

const createQuotation = async (req, res) => {
    try {
        const {
            lead_id,
            itineraryId,
            itinerary,
            margin = 0,
            group_size,
            currency = "INR",
            notes,
        } = req.body;

        // ------------------------------------------
        // 1. VALIDATE AUTHENTICATED USER
        // ------------------------------------------

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // ------------------------------------------
        // 2. VALIDATE LEAD ID
        // ------------------------------------------

        const parsedLeadId = Number(lead_id);

        if (!Number.isInteger(parsedLeadId) || parsedLeadId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid lead ID is required.",
            });
        }

        // ------------------------------------------
        // 3. VERIFY LEAD OWNERSHIP
        // ------------------------------------------

        const lead = await prisma.lead.findFirst({
            where: {
                id: parsedLeadId,
                userId,
            },
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found or access denied.",
            });
        }

        // ------------------------------------------
        // 4. VALIDATE GROUP SIZE
        // ------------------------------------------

        const parsedGroupSize = Number(
            group_size ?? lead.group_size ?? 1
        );

        if (
            !Number.isInteger(parsedGroupSize) ||
            parsedGroupSize < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Group size must be a positive whole number.",
            });
        }

        // ------------------------------------------
        // 5. VALIDATE MARGIN
        // ------------------------------------------

        const parsedMargin = Number(margin);

        if (
            !Number.isFinite(parsedMargin) ||
            parsedMargin < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Margin must be a valid non-negative number.",
            });
        }

        // ------------------------------------------
        // 6. GET AND VERIFY ITINERARY
        // ------------------------------------------

        let selectedItinerary = itinerary || null;
        let resolvedItineraryId = itineraryId
            ? Number(itineraryId)
            : null;

        if (
            resolvedItineraryId !== null &&
            (!Number.isInteger(resolvedItineraryId) ||
                resolvedItineraryId <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid itinerary ID.",
            });
        }

        // Fetch the saved itinerary and verify ownership.
        if (resolvedItineraryId !== null) {
            const savedItinerary = await prisma.itinerary.findFirst({
                where: {
                    id: resolvedItineraryId,
                    leadId: parsedLeadId,
                    lead: {
                        userId,
                    },
                },
                include: {
                    days: true,
                },
            });

            if (!savedItinerary) {
                return res.status(404).json({
                    success: false,
                    message: "Itinerary not found or access denied.",
                });
            }

            // Merge the supplied itinerary with the saved itinerary.
            // Saved fields remain available when the frontend sends
            // only destination and days.
            selectedItinerary = {
                ...savedItinerary,
                ...(itinerary || {}),
                id: savedItinerary.id,
                days:
                    itinerary?.days?.length > 0
                        ? itinerary.days
                        : savedItinerary.days,
            };
        }

        // If no itinerary ID was supplied, find the latest saved one.
        if (!selectedItinerary) {
            const latestItinerary = await prisma.itinerary.findFirst({
                where: {
                    leadId: parsedLeadId,
                    lead: {
                        userId,
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    days: true,
                },
            });

            if (latestItinerary) {
                selectedItinerary = latestItinerary;
                resolvedItineraryId = latestItinerary.id;
            }
        }

        // ------------------------------------------
        // 7. VALIDATE ITINERARY
        // ------------------------------------------

        if (
            !selectedItinerary ||
            !Array.isArray(selectedItinerary.days) ||
            selectedItinerary.days.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid saved itinerary with at least one day is required.",
            });
        }

        // Quotation requires an itineraryId because the Prisma
        // Quotation model has a mandatory itinerary relationship.
        if (!resolvedItineraryId) {
            return res.status(400).json({
                success: false,
                message:
                    "Save the itinerary before generating a quotation.",
            });
        }

        // ------------------------------------------
        // 8. RESOLVE DESTINATION
        // ------------------------------------------

        const destination =
            selectedItinerary.destination ||
            selectedItinerary.destination_name ||
            lead.destination;

        if (!destination) {
            return res.status(400).json({
                success: false,
                message:
                    "Destination is required to generate a quotation.",
            });
        }

        // ------------------------------------------
        // 9. BUILD FINAL ITINERARY INPUT
        // ------------------------------------------

        const itineraryForPricing = {
            ...selectedItinerary,

            destination,

            accommodation_type:
                selectedItinerary.accommodation_type,

            transport_type:
                selectedItinerary.transport_type,

            airport_transfer_type:
                selectedItinerary.airport_transfer_type,

            airport_transfers:
                selectedItinerary.airport_transfers,

            vehicle_count:
                selectedItinerary.vehicle_count,

            nights:
                selectedItinerary.nights,
        };

        // ------------------------------------------
        // 10. BUILD QUOTATION
        // ------------------------------------------

        let quote;

        try {
            quote = buildQuote(
                itineraryForPricing,
                parsedMargin,
                parsedGroupSize
            );
        } catch (pricingError) {
            console.error(
                "QUOTATION PRICING ERROR:",
                pricingError
            );

            return res.status(400).json({
                success: false,
                message:
                    pricingError.message ||
                    "Unable to calculate quotation. Check the itinerary and pricing selections.",
            });
        }

        // Validate calculated totals.
        if (
            !quote ||
            !Number.isFinite(Number(quote.group_total)) ||
            !Number.isFinite(Number(quote.per_person))
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quotation calculation returned an invalid total.",
            });
        }

        if (Number(quote.group_total) < 0) {
            return res.status(400).json({
                success: false,
                message: "Quotation total cannot be negative.",
            });
        }

        // ------------------------------------------
        // 11. CHECK PRICING ANOMALIES
        // ------------------------------------------

        const durationDays = itineraryForPricing.days.length;

        const anomalyCheck = detectPricingAnomalies(
            quote.breakdown,
            destination,
            durationDays,
            parsedGroupSize
        );

        // ------------------------------------------
        // 12. SAVE QUOTATION
        // ------------------------------------------

        // IMPORTANT:
        // Quotation has no leadId field in schema.prisma.
        // The lead relationship is available through itineraryId.

        const quotation = await prisma.quotation.create({
            data: {
                itineraryId: resolvedItineraryId,

                total_price: Math.round(quote.group_total),

                currency,

                notes: notes || null,

                breakdown: {
                    ...quote.breakdown,
                    pricing_details: quote.pricing_details,
                    anomaly_check: anomalyCheck,
                },
            },
        });

        // Link newly generated customer quotations to the active booking, so
        // post-trip invoices use this locked price instead of the internal stub.
        await prisma.booking.updateMany({
            where: { itineraryId: resolvedItineraryId, lead: { userId }, status: { not: "Cancelled" } },
            data: { quotationId: quotation.id },
        });

        // ------------------------------------------
        // 13. RETURN COMPLETE QUOTATION RESPONSE
        // ------------------------------------------

        return res.status(201).json({
            success: true,

            message: "Quotation generated successfully.",

            quotation,

            pricing: {
                destination,

                duration_days: durationDays,

                group_size: parsedGroupSize,

                per_person: quote.per_person,

                group_total: quote.group_total,

                margin_applied: quote.margin_applied,

                breakdown: quote.breakdown,

                pricing_details: quote.pricing_details,
            },

            anomaly_check: anomalyCheck,
        });

    } catch (error) {
        console.error("CREATE QUOTATION ERROR:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to generate quotation.",
        });
    }
};

// --------------------------------------------------
// GET QUOTATIONS BY LEAD ID
// --------------------------------------------------

const getQuotationByLeadId = async (req, res) => {
    try {
        const parsedLeadId = Number(req.params.leadId);

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (
            !Number.isInteger(parsedLeadId) ||
            parsedLeadId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid lead ID.",
            });
        }

        // ------------------------------------------
        // 1. VERIFY LEAD OWNERSHIP
        // ------------------------------------------

        const lead = await prisma.lead.findFirst({
            where: {
                id: parsedLeadId,
                userId,
            },
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found or access denied.",
            });
        }

        // ------------------------------------------
        // 2. FETCH QUOTATIONS THROUGH ITINERARY
        // ------------------------------------------

        // Quotation does not have a direct leadId.
        // Filter through its related itinerary instead.

        const quotations = await prisma.quotation.findMany({
            where: {
                itinerary: {
                    leadId: parsedLeadId,
                    lead: {
                        userId,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // ------------------------------------------
        // 3. RETURN QUOTATIONS
        // ------------------------------------------

        return res.status(200).json({
            success: true,
            count: quotations.length,
            quotations,
        });

    } catch (error) {
        console.error("GET QUOTATIONS ERROR:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to retrieve quotations.",
        });
    }
};


const markQuotationSent = async (req, res) => {
    try {
        const quotation = await prisma.quotation.findFirst({
            where: { id: Number(req.params.id), itinerary: { lead: { userId: req.user.id } } },
        });
        if (!quotation) return res.status(404).json({ message: "Quotation not found" });
        const sent = await prisma.quotation.update({ where: { id: quotation.id }, data: { status: "Sent", sentAt: new Date() } });
        return res.json({ quotation: sent, message: "Quotation marked as sent. No payment is due until after the trip." });
    } catch (error) {
        console.error("Mark quotation sent error:", error);
        return res.status(500).json({ message: "Could not mark quotation as sent" });
    }
};

// --------------------------------------------------
// EXPORT CONTROLLERS
// --------------------------------------------------

module.exports = {
    createQuotation,
    getQuotationByLeadId,
    markQuotationSent,
};

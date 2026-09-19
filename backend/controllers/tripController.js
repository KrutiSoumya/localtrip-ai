const { generateItinerary } = require("../services/aiService");
const destinations = require("../data/destinations.json");

exports.createTrip = async (req, res) => {
    try {
        const {
            destination,
            duration_days,
            budget_total,
            group_size = 1,
            group_type,
            interests = [],
            avoid = []
        } = req.body;

        const query = {
            destination,
            duration_days: Number(duration_days),
            budget_total: Number(budget_total),
            group_size: Number(group_size),
            group_type,
            interests,
            avoid
        };

        const itinerary = await generateItinerary(
            query,
            "balanced",
            destinations
        );

        if (!itinerary) {
            return res.status(500).json({
                error: "Failed to generate itinerary"
            });
        }

        res.json({
            itinerary
        });

    } catch (error) {
        console.error("Trip generation error:", error);

        res.status(500).json({
            error: "Failed to generate trip",
            details: error.message
        });
    }
};
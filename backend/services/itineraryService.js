const { generateItinerary } = require('./aiService');
const destinations = require('../data/destinations.json');


// ==============================
// 🔹 Validate itinerary format
// ==============================
function isValidItinerary(text, days) {
    if (!text) return false;

    const dayMatches = text.match(/Day\s\d+:/g) || [];
    const hasBullets = text.includes("-");

    return (
        text.includes("Day 1") &&
        dayMatches.length === days &&
        hasBullets &&
        text.length > 80 &&
        !text.toLowerCase().includes("please note") &&
        !text.includes("**")
    );
}


// ==============================
// 🔹 GENERATE VARIATIONS
// ==============================
async function generateVariations(query) {
    try {
        let [budgetTrip, experienceTrip] = await Promise.all([
            generateItinerary(query, "budget", destinations),
            generateItinerary(query, "experience", destinations)
        ]);

        const variations = [];

        // =============================
        // 🔹 Budget Validation + Retry
        // =============================
        if (!isValidItinerary(budgetTrip, query.duration_days)) {
            console.warn("⚠️ Budget itinerary failed — retrying...");
            budgetTrip = await generateItinerary(query, "budget", destinations);
        }

        if (isValidItinerary(budgetTrip, query.duration_days)) {
            variations.push({
                type: "budget",
                itinerary: budgetTrip
            });
        }


        // =============================
        // 🔹 Experience Validation + Retry
        // =============================
        if (!isValidItinerary(experienceTrip, query.duration_days)) {
            console.warn("⚠️ Experience itinerary failed — retrying...");
            experienceTrip = await generateItinerary(query, "experience", destinations);
        }

        if (isValidItinerary(experienceTrip, query.duration_days)) {
            variations.push({
                type: "experience",
                itinerary: experienceTrip
            });
        }


        // =============================
        // 🔹 FINAL FALLBACK
        // =============================
        if (variations.length === 0) {
            throw new Error("AI failed to generate any valid itineraries");
        }

        // If only one variation exists, still return it (don't crash system)
        if (variations.length === 1) {
            console.warn("⚠️ Only one valid itinerary generated");
        }

        return { variations };

    } catch (err) {
        console.error("Variation Error:", err.message);
        return { variations: [] };
    }
}


module.exports = { generateVariations };
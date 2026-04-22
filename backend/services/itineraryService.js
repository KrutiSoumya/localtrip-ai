const { generateItinerary } = require('./aiService');

// 🔥 Validate itinerary
function isValidItinerary(text, days) {
    if (!text) return false;

    const matches = text.match(/Day\s\d+/g) || [];
    return matches.length === days;
}

async function generateVariations(query) {
    const v1 = await generateItinerary(query, "budget");
    const v2 = await generateItinerary(query, "experience");

    const variations = [];

    if (v1) {
        variations.push({
            type: "budget",
            itinerary: v1
        });
    }

    if (v2) {
        variations.push({
            type: "experience",
            itinerary: v2
        });
    }

    // 🔥 fallback (VERY IMPORTANT)
    if (variations.length === 1) {
        variations.push({
            type: "alternative",
            itinerary: variations[0].itinerary
        });
    }

    return { variations };
}

module.exports = { generateVariations };
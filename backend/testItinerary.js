const { generateVariations } = require('./services/itineraryService');
const { rankItineraries, generateExplanation } = require('./services/rankingService');
const { validateItinerary } = require('./services/constraintChecker');

(async () => {
    const query = {
        destination: "Goa",
        duration_days: 3,
        budget_total: 20000,
        group_size: 3,
        interests: ["beach", "food"]
    };

    // =============================
    // 🔹 Generate AI variations
    // =============================
    const result = await generateVariations(query);

    if (!result.variations || result.variations.length === 0) {
        console.log(JSON.stringify({
            error: "AI failed to generate itineraries"
        }, null, 2));
        return;
    }

    // =============================
    // 🔹 Apply constraint filtering
    // =============================
    let validVariations = result.variations.filter(v =>
        validateItinerary(v.itinerary, query)
    );

    // 🔥 FALLBACK: if all rejected, relax constraints
    if (validVariations.length === 0) {
        console.warn("⚠️ All failed constraints — relaxing filter...");
        validVariations = result.variations;
    }

    // =============================
    // 🔹 Ranking
    // =============================
    const ranked = rankItineraries(validVariations, query);

    if (!ranked || ranked.length === 0) {
        console.log(JSON.stringify({
            error: "Ranking failed"
        }, null, 2));
        return;
    }

    // =============================
    // 🔹 Explanation
    // =============================
    const explanation = generateExplanation(ranked[0], query);

    // =============================
    // 🔹 Final output
    // =============================
    console.log(JSON.stringify({
        variations: result.variations,   // show all generated
        ranked,
        explanation
    }, null, 2));

})();
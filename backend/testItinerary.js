const { generateVariations } = require('./services/itineraryService');
const { rankItineraries, generateExplanation } = require('./services/rankingService');

(async () => {
    const query = {
        destination: "Goa",
        duration_days: 3,
        budget_total: 20000,
        group_size: 3,
        interests: ["beach", "food"]
    };

    const result = await generateVariations(query);

    const ranked = rankItineraries(result.variations, query);

    const explanation = generateExplanation(ranked[0], query);

    console.log(JSON.stringify({
        variations: result.variations,
        ranked,
        explanation
    }, null, 2));
})();
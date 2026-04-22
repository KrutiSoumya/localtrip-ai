// 🔥 Score function
function scoreItinerary(itinerary, query) {
    let score = 0;
    const text = itinerary.toLowerCase();

    // 🔹 Budget
    if (query.budget_total <= 20000) {
        if (text.includes("budget") || text.includes("free") || text.includes("local")) {
            score += 0.4;
        } else {
            score += 0.2;
        }
    } else {
        if (text.includes("luxury") || text.includes("resort")) {
            score += 0.4;
        } else {
            score += 0.2;
        }
    }

    // 🔹 Interests
    let match = 0;
    for (let interest of query.interests || []) {
        if (text.includes(interest.toLowerCase())) match++;
    }

    if (query.interests?.length) {
        score += (match / query.interests.length) * 0.4;
    }

    // 🔹 Days check
    const days = (itinerary.match(/Day/g) || []).length;
    if (days === query.duration_days) score += 0.2;

    return Number(score.toFixed(2));
}


// 🔥 Rank
function rankItineraries(variations, query) {
    const ranked = variations.map(v => {
        const score = scoreItinerary(v.itinerary, query);

        let label = "Low";
        if (score > 0.7) label = "High";
        else if (score > 0.4) label = "Medium";

        return { ...v, score, label };
    });

    ranked.sort((a, b) => b.score - a.score);

    return ranked;
}


// 🔥 Explanation
function generateExplanation(best, query) {
    return `Selected ${best.type} itinerary because it fits your ₹${query.budget_total} budget and matches ${query.interests?.join(", ")} within ${query.duration_days} days.`;
}

module.exports = {
    rankItineraries,
    generateExplanation
};
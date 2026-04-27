// ==============================
// 🔹 Score function
// ==============================
function scoreItinerary(itinerary, query) {
    if (!itinerary) return 0;

    const text = itinerary.toLowerCase().trim();

    // Reject invalid itineraries
    if (!text.includes("day 1")) return 0;

    let score = 0;

    // ---------------------------------
    // CONFIG WEIGHTS
    // ---------------------------------
    const WEIGHTS = {
        budget: 0.35,
        interests: 0.35,
        duration: 0.15,
        structure: 0.10,
        quality: 0.05
    };

    // ---------------------------------
    // 1. BUDGET SCORE (0–0.35)
    // ---------------------------------
    const cheapSignals = [
        "free", "market", "local", "street", "bus", "walk"
    ];

    const luxurySignals = [
        "cruise", "resort", "spa", "private", "fine dining", "villa"
    ];

    const cheapHits = cheapSignals.filter(k => text.includes(k)).length;
    const luxuryHits = luxurySignals.filter(k => text.includes(k)).length;

    let budgetScore = 0;

    if (query.budget_total <= 20000) {
        // Low budget users should avoid luxury
        budgetScore =
            1 -
            Math.min(1, luxuryHits * 0.35) +
            Math.min(0.4, cheapHits * 0.08);
    } else if (query.budget_total <= 50000) {
        // Mid budget likes balance
        budgetScore =
            0.5 +
            Math.min(0.25, cheapHits * 0.05) +
            Math.min(0.25, luxuryHits * 0.05);
    } else {
        // High budget prefers premium
        budgetScore =
            0.4 +
            Math.min(0.6, luxuryHits * 0.12) -
            Math.min(0.2, cheapHits * 0.03);
    }

    budgetScore = Math.max(0, Math.min(1, budgetScore));
    score += budgetScore * WEIGHTS.budget;

    // ---------------------------------
    // 2. INTEREST SCORE (0–0.35)
    // ---------------------------------
    const keywordMap = {
        beach: ["beach", "sea", "coast"],
        food: ["food", "restaurant", "market", "cafe"],
        adventure: ["sports", "snorkeling", "hiking", "trek", "parasailing"],
        culture: ["church", "fort", "temple", "museum", "heritage"],
        nightlife: ["club", "bar", "party", "pub"]
    };

    let totalInterestScore = 0;

    for (const interest of query.interests || []) {
        const keywords = keywordMap[interest] || [interest];
        const hits = keywords.filter(k => text.includes(k)).length;

        // partial scoring instead of binary match
        totalInterestScore += Math.min(1, hits / 2);
    }

    const interestScore =
        query.interests?.length
            ? totalInterestScore / query.interests.length
            : 0.5;

    score += interestScore * WEIGHTS.interests;

    // ---------------------------------
    // 3. DURATION SCORE (0–0.15)
    // ---------------------------------
    const days = (itinerary.match(/Day\s+\d+/gi) || []).length;

    let durationScore = 0;

    if (days === query.duration_days) {
        durationScore = 1;
    } else {
        const diff = Math.abs(days - query.duration_days);
        durationScore = Math.max(0, 1 - diff * 0.4);
    }

    score += durationScore * WEIGHTS.duration;

    // ---------------------------------
    // 4. STRUCTURE SCORE (0–0.10)
    // ---------------------------------
    const activityCount = (itinerary.match(/^\s*-/gm) || []).length;
    const idealActivities = query.duration_days * 3.5;

    const structureScore = Math.max(
        0,
        1 - Math.abs(activityCount - idealActivities) / idealActivities
    );

    score += structureScore * WEIGHTS.structure;

    // ---------------------------------
    // 5. QUALITY / VARIETY SCORE (0–0.05)
    // ---------------------------------
    const repeatedWords = ["beach", "market", "fort"];
    let repetitionPenalty = 0;

    for (const word of repeatedWords) {
        const count = (text.match(new RegExp(word, "g")) || []).length;
        if (count > query.duration_days) repetitionPenalty += 0.1;
    }

    const qualityScore = Math.max(0, 1 - repetitionPenalty);
    score += qualityScore * WEIGHTS.quality;

    // ---------------------------------
    // FINAL SCORE
    // ---------------------------------
    return Number(Math.min(1, score).toFixed(2));
}


// ==============================
// 🔹 Ranking
// ==============================
function rankItineraries(variations, query) {

    const validVariations = variations.filter(v =>
        v &&
        v.itinerary &&
        v.itinerary.includes("Day 1") &&
        !v.itinerary.toLowerCase().includes("error")
    );

    if (validVariations.length === 0) return [];

    const ranked = validVariations.map(v => {
        const score = scoreItinerary(v.itinerary, query);

        let label = "Low";
        if (score > 0.75) label = "High";
        else if (score > 0.45) label = "Medium";

        return { ...v, score, label };
    });

    // 🔥 Tie-breaker logic
    ranked.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        // Prefer budget if low budget
        if (query.budget_total <= 20000) {
            if (a.type === "budget") return -1;
            if (b.type === "budget") return 1;
        }

        return 0;
    });

    return ranked;
}


// ==============================
// 🔹 Explanation
// ==============================
function generateExplanation(best, query) {
    if (!best || best.score === 0) {
        return "Could not generate a valid itinerary. Please try again.";
    }

    return `Selected ${best.type} itinerary because:
- Score: ${best.score}
- Matches interests: ${query.interests?.join(", ") || "general"}
- Fits within budget ₹${query.budget_total}
- Covers ${query.duration_days} days efficiently`;
}


module.exports = {
    rankItineraries,
    generateExplanation
};
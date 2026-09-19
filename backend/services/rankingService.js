function getAllActivities(itinerary) {

    if (
        !itinerary ||
        !Array.isArray(itinerary.days)
    ) {
        return [];
    }

    return itinerary.days.flatMap(day =>
        Array.isArray(day.activities)
            ? day.activities
            : []
    );
}


/**
 * ============================================================
 * BUDGET FIT
 * ============================================================
 */
function calculateBudgetFit(
    itinerary,
    budget
) {

    if (!budget || budget <= 0) {
        return 0;
    }

    const totalCost =
        itinerary.days.reduce(
            (sum, day) =>
                sum + Number(
                    day.estimated_cost || 0
                ),
            0
        );

    if (totalCost <= 0) {
        return 0;
    }

    /*
     * Full score when cost is very comfortably inside budget.
     */
    if (totalCost <= budget) {
        return Math.min(
            1,
            1 - totalCost / budget + 0.5
        );
    }

    return 0;
}


/**
 * ============================================================
 * PREFERENCE MATCH
 * ============================================================
 */
function calculatePreferenceMatch(
    itinerary,
    interests = []
) {

    if (
        !Array.isArray(interests) ||
        interests.length === 0
    ) {
        return 1;
    }

    const activities =
        getAllActivities(itinerary);

    if (activities.length === 0) {
        return 0;
    }

    /*
     * Map user interests to keywords that can
     * realistically appear in itinerary activities.
     */
    const interestKeywords = {

        beach: [
            "beach",
            "water sports",
            "dolphin",
            "snorkeling",
            "scuba"
        ],

        food: [
            "food",
            "restaurant",
            "cafe",
            "cuisine",
            "market",
            "food tour"
        ],

        adventure: [
            "adventure",
            "water sports",
            "scuba",
            "snorkeling",
            "rafting",
            "trek",
            "trekking",
            "hiking",
            "camping",
            "safari",
            "snow",
            "bike"
        ],

        culture: [
            "fort",
            "palace",
            "temple",
            "church",
            "museum",
            "heritage",
            "cultural",
            "monastery",
            "market",
            "show"
        ]
    };

    let matched = 0;

    interests.forEach(interest => {

        const normalizedInterest =
            String(interest)
                .toLowerCase()
                .trim();

        const keywords =
            interestKeywords[
                normalizedInterest
            ] || [normalizedInterest];

        const found =
            activities.some(activity => {

                const text =
                    `${activity.name || ""} ${
                        activity.location || ""
                    }`.toLowerCase();

                return keywords.some(keyword =>
                    text.includes(keyword)
                );
            });

        if (found) {
            matched++;
        }
    });

    return Math.min(
        1,
        matched / interests.length
    );
}


/**
 * ============================================================
 * TIME EFFICIENCY
 * ============================================================
 */
function calculateTimeEfficiency(
    itinerary,
    durationDays
) {

    if (
        !durationDays ||
        durationDays <= 0
    ) {
        return 0;
    }

    const totalTravelHours =
        itinerary.days.reduce(
            (sum, day) =>
                sum +
                Number(
                    day.travel_time_hours || 0
                ),
            0
        );

    const maximumHours =
        durationDays * 8;

    return Math.max(
        0,
        Math.min(
            1,
            1 -
                totalTravelHours /
                maximumHours
        )
    );
}


/**
 * ============================================================
 * LABEL
 * ============================================================
 */
function getLabel(score) {

    if (score > 0.7) {
        return "High";
    }

    if (score >= 0.4) {
        return "Medium";
    }

    return "Low";
}


/**
 * ============================================================
 * RANK ITINERARIES
 * ============================================================
 */
function rankItineraries(
    variations,
    query
) {

    if (!Array.isArray(variations)) {
        return [];
    }

    return variations
        .filter(
            variation =>
                variation &&
                variation.itinerary &&
                typeof variation.itinerary === "object"
        )
        .map(variation => {

            const itinerary =
                variation.itinerary;

            const budgetFit =
                calculateBudgetFit(
                    itinerary,
                    query.budget_total
                );

            const preferenceMatch =
                calculatePreferenceMatch(
                    itinerary,
                    query.interests
                );

            const timeEfficiency =
                calculateTimeEfficiency(
                    itinerary,
                    query.duration_days
                );

            const score =
                budgetFit * 0.4 +
                preferenceMatch * 0.4 +
                timeEfficiency * 0.2;

            return {
                type: variation.type,

                itinerary,

                score:
                    Number(
                        score.toFixed(3)
                    ),

                label:
                    getLabel(score),

                components: {
                    budget_fit:
                        Number(
                            budgetFit.toFixed(3)
                        ),

                    preference_match:
                        Number(
                            preferenceMatch.toFixed(3)
                        ),

                    time_efficiency:
                        Number(
                            timeEfficiency.toFixed(3)
                        )
                }
            };
        })
        .sort(
            (a, b) =>
                b.score - a.score
        );
}


/**
 * ============================================================
 * EXPLANATION
 * ============================================================
 */
function generateExplanation(
    rankedItinerary,
    query
) {

    if (!rankedItinerary) {
        return "No valid itinerary available.";
    }

    const itinerary =
        rankedItinerary.itinerary;

    const totalCost =
        itinerary.days.reduce(
            (sum, day) =>
                sum +
                Number(
                    day.estimated_cost || 0
                ),
            0
        );

    const totalTravelHours =
        itinerary.days.reduce(
            (sum, day) =>
                sum +
                Number(
                    day.travel_time_hours || 0
                ),
            0
        );

    const interests =
        Array.isArray(query.interests) &&
        query.interests.length > 0
            ? query.interests.join(", ")
            : "your preferences";

    return (
        `Selected because: estimated cost ` +
        `(₹${totalCost}) is within the ` +
        `budget of ₹${query.budget_total}, ` +
        `matches your interests ` +
        `(${interests}), and keeps total ` +
        `travel time at approximately ` +
        `${totalTravelHours} hours.`
    );
}


module.exports = {
    rankItineraries,
    generateExplanation
};
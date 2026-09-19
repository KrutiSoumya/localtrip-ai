const axios = require("axios");

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "phi3:mini";


/**
 * ============================================================
 * GENERIC LOCAL AI JSON GENERATOR
 * ============================================================
 */
async function generateTrip(prompt) {
    try {
        const response = await axios.post(
            OLLAMA_URL,
            {
                model: MODEL,
                stream: false,
                format: "json",
                options: {
                    temperature: 0,
                    num_predict: 500
                },
                messages: [
                    {
                        role: "system",
                        content: `
You are a strict JSON generator.

Rules:
- Return ONLY valid JSON.
- No markdown.
- No explanations.
- No comments.
- Never invent information.
- If information is unavailable, use null.
`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            },
            {
                timeout: 120000
            }
        );

        let text = response.data?.message?.content?.trim();

        if (!text) {
            console.error("AI returned empty response");
            return null;
        }

        text = cleanJson(text);

        try {
            JSON.parse(text);
        } catch (error) {
            console.error("AI returned invalid JSON:");
            console.error(text);
            return null;
        }

        return text;

    } catch (error) {
        console.error("AI Error:", error.message);

        if (error.response?.data) {
            console.error("Ollama response:", error.response.data);
        }

        return null;
    }
}


/**
 * ============================================================
 * CLEAN JSON
 * ============================================================
 */
function cleanJson(text) {
    return text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
}


/**
 * ============================================================
 * NORMALIZE AI ACTIVITY
 * ============================================================
 */
function normalizeActivity(activity, destinationData) {

    if (!activity || typeof activity !== "object") {
        return null;
    }

    /*
     * Phi-3 sometimes produces variations such as:
     * namein
     * activity
     * activity_name
     */
    let name =
        activity.name ||
        activity.namein ||
        activity.activity ||
        activity.activity_name;

    let location =
        activity.location ||
        activity.place ||
        activity.attraction;

    let cost = activity.cost;

    if (typeof name !== "string") {
        return null;
    }

    name = name.trim();

    /*
     * --------------------------------------------------------
     * Match the AI activity against our real destination data.
     * --------------------------------------------------------
     */
    const activities = destinationData.activities || [];

    const matchedActivity = activities.find(item =>
        item.name.toLowerCase() === name.toLowerCase()
    );

    /*
     * If the AI gave a known activity, use the authoritative
     * cost from destinations.json.
     */
    if (matchedActivity) {
        cost = matchedActivity.cost;
        name = matchedActivity.name;
    } else {
        /*
         * Try partial matching.
         */
        const partialMatch = activities.find(item =>
            name.toLowerCase().includes(item.name.toLowerCase()) ||
            item.name.toLowerCase().includes(name.toLowerCase())
        );

        if (partialMatch) {
            cost = partialMatch.cost;
            name = partialMatch.name;
        }
    }

    /*
     * Cost fallback.
     */
    if (typeof cost === "string") {
        cost = Number(
            cost.replace(/[₹,\s]/g, "")
        );
    }

    if (typeof cost !== "number" || Number.isNaN(cost)) {
        if (matchedActivity) {
            cost = matchedActivity.cost;
        } else {
            return null;
        }
    }

    /*
     * Location fallback.
     */
    if (typeof location !== "string" || !location.trim()) {
        location =
            destinationData.attractions?.[0] ||
            destinationData.name;
    }

    /*
     * Only allow real attractions from our dataset.
     */
    const attractionMatch =
        destinationData.attractions?.find(
            attraction =>
                attraction.toLowerCase() ===
                location.trim().toLowerCase()
        );

    if (attractionMatch) {
        location = attractionMatch;
    } else {
        const partialAttraction =
            destinationData.attractions?.find(
                attraction =>
                    location
                        .toLowerCase()
                        .includes(attraction.toLowerCase()) ||
                    attraction
                        .toLowerCase()
                        .includes(location.toLowerCase())
            );

        if (partialAttraction) {
            location = partialAttraction;
        } else {
            /*
             * If AI invented a location, use a real attraction.
             */
            location =
                destinationData.attractions?.[0] ||
                destinationData.name;
        }
    }

    return {
        name,
        location,
        cost
    };
}


/**
 * ============================================================
 * NORMALIZE COMPLETE ITINERARY
 * ============================================================
 */
function normalizeItinerary(itinerary, query, destinationData) {

    if (!itinerary || !Array.isArray(itinerary.days)) {
        return null;
    }

    const days = itinerary.days;

    if (
        days.length !==
        Number(query.duration_days)
    ) {
        return null;
    }

    const normalizedDays = days.map(
        (day, index) => {

            if (!day || !Array.isArray(day.activities)) {
                return null;
            }

            /*
             * Maximum 4 activities per day.
             */
            const activities =
                day.activities
                    .slice(0, 4)
                    .map(activity =>
                        normalizeActivity(
                            activity,
                            destinationData
                        )
                    )
                    .filter(Boolean);

            if (activities.length === 0) {
                return null;
            }

            let estimatedCost =
                Number(day.estimated_cost);

            /*
             * If AI did not provide a valid estimated cost,
             * calculate it from activities + average daily cost.
             */
            if (
                Number.isNaN(estimatedCost) ||
                estimatedCost <= 0
            ) {

                const activityCost =
                    activities.reduce(
                        (sum, activity) =>
                            sum + activity.cost,
                        0
                    );

                estimatedCost =
                    destinationData.avg_cost_per_day +
                    activityCost;
            }

            let travelTime =
                Number(day.travel_time_hours);

            if (
                Number.isNaN(travelTime) ||
                travelTime < 0
            ) {
                travelTime =
                    destinationData.travel_time_between;
            }

            return {
                day: index + 1,
                activities,
                accommodation:
                    typeof day.accommodation === "string"
                        ? day.accommodation
                        : "Budget-friendly local accommodation",
                estimated_cost:
                    Math.round(estimatedCost),
                travel_time_hours:
                    travelTime
            };
        }
    );

    if (normalizedDays.some(day => !day)) {
        return null;
    }

    /*
     * Keep total cost within budget.
     */
    const totalCost =
        normalizedDays.reduce(
            (sum, day) =>
                sum + day.estimated_cost,
            0
        );

    if (totalCost > Number(query.budget_total)) {
        /*
         * Do not reject immediately.
         * Recalculate estimated cost from the actual
         * destination average and activity costs.
         */
        normalizedDays.forEach(day => {

            const activityCost =
                day.activities.reduce(
                    (sum, activity) =>
                        sum + activity.cost,
                    0
                );

            day.estimated_cost =
                Math.round(
                    destinationData.avg_cost_per_day +
                    activityCost
                );
        });
    }

    return {
        days: normalizedDays
    };
}


/**
 * ============================================================
 * FALLBACK ITINERARY
 *
 * This guarantees the application can still produce a valid
 * itinerary if the local model fails.
 * ============================================================
 */
function createFallbackItinerary(
    query,
    mode,
    destinationData
) {

    const requestedDays =
        Number(query.duration_days);

    const interests =
        Array.isArray(query.interests)
            ? query.interests.map(i =>
                String(i).toLowerCase()
            )
            : [];

    let availableActivities =
        [...destinationData.activities];

    /*
     * Budget mode:
     * cheapest activities first.
     */
    if (mode === "budget") {
        availableActivities.sort(
            (a, b) => a.cost - b.cost
        );
    } else {
        /*
         * Experience mode:
         * expensive/unique activities first.
         */
        availableActivities.sort(
            (a, b) => b.cost - a.cost
        );
    }

    /*
     * Try to match interests using activity names.
     */
    const interestMatches =
        availableActivities.filter(activity =>
            interests.some(interest =>
                activity.name
                    .toLowerCase()
                    .includes(interest)
            )
        );

    const remaining =
        availableActivities.filter(
            activity =>
                !interestMatches.includes(activity)
        );

    availableActivities = [
        ...interestMatches,
        ...remaining
    ];

    const days = [];

    for (let i = 0; i < requestedDays; i++) {

        const activities = [];

        /*
         * 2 activities per day is enough for the
         * deterministic fallback.
         */
        for (let j = 0; j < 2; j++) {

            const index =
                (i * 2 + j) %
                availableActivities.length;

            const activity =
                availableActivities[index];

            if (activity) {
                activities.push({
                    name: activity.name,
                    location:
                        destinationData.attractions[
                            (i * 2 + j) %
                            destinationData.attractions.length
                        ],
                    cost: activity.cost
                });
            }
        }

        const activityCost =
            activities.reduce(
                (sum, activity) =>
                    sum + activity.cost,
                0
            );

        days.push({
            day: i + 1,
            activities,
            accommodation:
                mode === "budget"
                    ? "Budget-friendly local accommodation"
                    : "Comfortable premium accommodation",
            estimated_cost:
                Math.round(
                    destinationData.avg_cost_per_day +
                    activityCost
                ),
            travel_time_hours:
                destinationData.travel_time_between
        });
    }

    return {
        days
    };
}


/**
 * ============================================================
 * AI ITINERARY GENERATOR
 * ============================================================
 */
async function generateItinerary(
    query,
    mode = "balanced",
    destinations = []
) {

    const destinationData =
        destinations.find(
            destination =>
                destination.name.toLowerCase() ===
                String(query.destination).toLowerCase()
        );

    if (!destinationData) {
        console.error(
            `Destination not found: ${query.destination}`
        );

        return null;
    }

    const style =
        mode === "budget"
            ? `
Create a budget-oriented itinerary.
Prefer free and low-cost activities.
`
            : `
Create an experience-oriented itinerary.
Prefer memorable and premium activities.
`;

    const prompt = `
Create a travel itinerary.

DESTINATION:
${destinationData.name}

DURATION:
${query.duration_days} days

TOTAL BUDGET:
₹${query.budget_total}

GROUP SIZE:
${query.group_size || 1}

GROUP TYPE:
${query.group_type || "not specified"}

INTERESTS:
${(query.interests || []).join(", ") || "none"}

AVOID:
${(query.avoid || []).join(", ") || "none"}

AVAILABLE ATTRACTIONS:
${JSON.stringify(destinationData.attractions)}

AVAILABLE ACTIVITIES:
${JSON.stringify(destinationData.activities)}

TRAVEL TIME BETWEEN LOCATIONS:
${destinationData.travel_time_between} hours

AVERAGE DAILY COST:
₹${destinationData.avg_cost_per_day}

${style}

RULES:
1. Create exactly ${query.duration_days} days.
2. Every day must have 1 to 4 activities.
3. Use ONLY activities from AVAILABLE ACTIVITIES.
4. Use ONLY attractions from AVAILABLE ATTRACTIONS.
5. Use the exact activity names.
6. Use the exact activity costs.
7. Do not invent activities.
8. Do not invent attractions.
9. Do not use another destination.
10. Keep the total estimated cost within ₹${query.budget_total}.
11. Use travel time of ${destinationData.travel_time_between} hours per day.
12. Return compact JSON.

OUTPUT:

{
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "name": "Beach visit",
          "location": "Baga Beach",
          "cost": 0
        }
      ],
      "accommodation": "Budget-friendly accommodation",
      "estimated_cost": 2500,
      "travel_time_hours": 2
    }
  ]
}

Return ONLY JSON.
`;

    /*
     * Try AI up to 3 times.
     */
    for (let attempt = 1; attempt <= 3; attempt++) {

        try {

            console.log(
                `Generating ${mode} itinerary - attempt ${attempt}`
            );

            const response =
                await axios.post(
                    OLLAMA_URL,
                    {
                        model: MODEL,
                        stream: false,
                        format: "json",
                        options: {
                            temperature: 0,
                            num_predict: 4000
                        },
                        messages: [
                            {
                                role: "system",
                                content: `
You generate compact valid JSON only.

Never use markdown.
Never explain.
Never invent fields.
Never invent activities.
Never invent locations.
`
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ]
                    },
                    {
                        timeout: 180000
                    }
                );

            let text =
                response.data?.message?.content?.trim();

            if (!text) {
                console.warn(
                    `Attempt ${attempt}: empty AI response`
                );
                continue;
            }

            text = cleanJson(text);

            let itinerary;

            try {
                itinerary =
                    JSON.parse(text);
            } catch (error) {
                console.warn(
                    `Attempt ${attempt}: invalid JSON`
                );
                console.warn(text);
                continue;
            }

            const normalized =
                normalizeItinerary(
                    itinerary,
                    query,
                    destinationData
                );

            if (normalized) {
                console.log(
                    `✓ ${mode} itinerary generated successfully`
                );

                return normalized;
            }

            console.warn(
                `Attempt ${attempt}: itinerary normalization failed`
            );

        } catch (error) {

            console.error(
                `Attempt ${attempt} failed:`,
                error.message
            );
        }
    }

    /*
     * --------------------------------------------------------
     * AI failed.
     *
     * Use deterministic local fallback so the API does not
     * fail just because Phi-3 generated malformed JSON.
     * --------------------------------------------------------
     */
    console.warn(
        `⚠️ ${mode} AI generation failed. Using local fallback.`
    );

    return createFallbackItinerary(
        query,
        mode,
        destinationData
    );
}


/**
 * ============================================================
 * AI QUOTE SUMMARY
 * ============================================================
 */
async function generateQuoteSummary(quote) {

    const total =
        Number(quote?.group_total || 0);

    const margin =
        Number(quote?.margin_applied || 0);

    const breakdown =
        quote?.breakdown || {};

    const prompt = `
Write a 2-sentence professional summary of this travel quote for a customer.

QUOTE DETAILS:
${JSON.stringify(quote, null, 2)}

IMPORTANT:
- The currency is INR (Indian Rupees).
- Always use the ₹ symbol.
- Never use $, USD, dollars, EUR, euros, or any other currency.
- The total price is exactly ₹${total.toLocaleString("en-IN")}.
- The applied margin is ${margin}%.
- The quote includes activities, transport, and accommodation.
- Do not change or recalculate the total price.
- Do not invent services, prices, discounts, or other details.
- Return exactly 2 sentences.
- Return plain text only.
`;

    try {

        const response = await axios.post(
            OLLAMA_URL,
            {
                model: MODEL,
                stream: false,
                options: {
                    temperature: 0,
                    num_predict: 300
                },
                messages: [
                    {
                        role: "system",
                        content: `
You are a professional travel quotation assistant.

Always use Indian Rupees (₹).
Never use USD ($) or any other currency.
Use the exact total supplied by the application.
Return exactly 2 sentences.
Return plain text only.
`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            },
            {
                timeout: 120000
            }
        );

        let summary =
            response.data?.message?.content?.trim() || "";

        /*
         * Protect against the model changing INR to USD.
         */
        summary = summary
            .replace(/\$/g, "₹")
            .replace(/\bUSD\b/gi, "INR")
            .replace(/\bdollars?\b/gi, "Indian Rupees");

        /*
         * If the model omitted the currency entirely,
         * append the exact total.
         */
        if (
            !summary.includes("₹") &&
            !summary.includes("INR")
        ) {
            summary =
                `${summary} The total quoted amount is ₹${total.toLocaleString("en-IN")}.`;
        }

        /*
         * Make sure the exact application-calculated total
         * appears in the final summary.
         */
        if (
            !summary.includes(
                `₹${total.toLocaleString("en-IN")}`
            )
        ) {
            summary =
                `The total quoted amount for your trip is ₹${total.toLocaleString("en-IN")}. ${summary}`;
        }

        return summary;

    } catch (error) {

        console.error(
            "Quote Summary AI Error:",
            error.message
        );

        /*
         * Deterministic fallback ensures the quotation
         * still has a usable customer-facing summary.
         */
        return (
            `The total quoted amount for your trip is ₹${total.toLocaleString("en-IN")}, including activities, transport, and accommodation. ` +
            `A ${margin}% margin has been applied to the calculated travel costs.`
        );
    }
}


module.exports = {
    generateTrip,
    generateItinerary,
    generateQuoteSummary
};
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

    const activities =
        destinationData.activities || [];

    /*
     * First try exact activity-name matching.
     */
    let matchedActivity =
        activities.find(
            item =>
                item.name.toLowerCase() ===
                name.toLowerCase()
        );

    /*
     * Then try partial matching.
     */
    if (!matchedActivity) {
        matchedActivity =
            activities.find(
                item =>
                    name
                        .toLowerCase()
                        .includes(item.name.toLowerCase()) ||
                    item.name
                        .toLowerCase()
                        .includes(name.toLowerCase())
            );
    }

    if (matchedActivity) {
        cost = matchedActivity.cost;
        name = matchedActivity.name;
    }

    if (typeof cost === "string") {
        cost = Number(
            cost.replace(/[₹,\s]/g, "")
        );
    }

    /*
     * If the AI did not provide a valid cost,
     * use the destination activity cost.
     */
    if (
        typeof cost !== "number" ||
        Number.isNaN(cost)
    ) {
        if (matchedActivity) {
            cost = matchedActivity.cost;
        } else {
            return null;
        }
    }

    /*
     * Normalize location.
     */
    if (
        typeof location !== "string" ||
        !location.trim()
    ) {
        location =
            destinationData.attractions?.[0] ||
            destinationData.name;
    }

    const attractions =
        destinationData.attractions || [];

    const attractionMatch =
        attractions.find(
            attraction =>
                attraction.toLowerCase() ===
                location.trim().toLowerCase()
        );

    if (attractionMatch) {

        location = attractionMatch;

    } else {

        const partialAttraction =
            attractions.find(
                attraction =>
                    location
                        .toLowerCase()
                        .includes(
                            attraction.toLowerCase()
                        ) ||
                    attraction
                        .toLowerCase()
                        .includes(
                            location.toLowerCase()
                        )
            );

        if (partialAttraction) {

            location = partialAttraction;

        } else {

            location =
                attractions[0] ||
                destinationData.name;
        }
    }

    return {
        name,
        location,
        cost: Number(cost) || 0
    };
}


/**
 * ============================================================
 * ENSURE ACTIVITY DIVERSITY
 *
 * Guarantees that repeated activities are replaced with
 * unused destination activities.
 *
 * Budget:
 *   cheaper activities first
 *
 * Experience:
 *   more expensive activities first
 * ============================================================
 */
function ensureActivityDiversity(
    days,
    destinationData,
    mode
) {

    const availableActivities =
        [...(destinationData.activities || [])];

    if (availableActivities.length === 0) {
        return days;
    }

    const sortedActivities =
        availableActivities.sort(
            (a, b) =>
                mode === "budget"
                    ? Number(a.cost || 0) -
                      Number(b.cost || 0)
                    : Number(b.cost || 0) -
                      Number(a.cost || 0)
        );

    const usedActivities = new Set();

    days.forEach(
        (day, dayIndex) => {

            if (
                !Array.isArray(
                    day.activities
                )
            ) {
                return;
            }

            day.activities =
                day.activities.map(
                    (
                        activity,
                        activityIndex
                    ) => {

                        const activityKey =
                            String(
                                activity?.name || ""
                            )
                                .trim()
                                .toLowerCase();

                        /*
                         * Keep the first occurrence.
                         */
                        if (
                            activityKey &&
                            !usedActivities.has(
                                activityKey
                            )
                        ) {

                            usedActivities.add(
                                activityKey
                            );

                            return activity;
                        }

                        /*
                         * Find an unused activity.
                         */
                        const replacement =
                            sortedActivities.find(
                                candidate =>
                                    !usedActivities.has(
                                        candidate.name
                                            .trim()
                                            .toLowerCase()
                                    )
                            );

                        /*
                         * If all available activities
                         * have already been used,
                         * keep the original.
                         */
                        if (!replacement) {
                            return activity;
                        }

                        const replacementKey =
                            replacement.name
                                .trim()
                                .toLowerCase();

                        usedActivities.add(
                            replacementKey
                        );

                        const attractions =
                            destinationData.attractions ||
                            [];

                        const location =
                            attractions.length > 0
                                ? attractions[
                                      (
                                          dayIndex +
                                          activityIndex
                                      ) %
                                          attractions.length
                                  ]
                                : destinationData.name;

                        return {
                            name:
                                replacement.name,

                            location,

                            cost:
                                Number(
                                    replacement.cost
                                ) || 0
                        };
                    }
                );
        }
    );

    return days;
}


/**
 * ============================================================
 * NORMALIZE COMPLETE ITINERARY
 *
 * This function was missing from the previous file.
 * It validates the AI response, normalizes activities,
 * enforces activity diversity and recalculates costs.
 * ============================================================
 */
function normalizeItinerary(
    itinerary,
    query,
    destinationData,
    mode
) {

    if (
        !itinerary ||
        !Array.isArray(itinerary.days)
    ) {
        return null;
    }

    const requestedDays =
        Number(query.duration_days);

    if (
        !Number.isInteger(requestedDays) ||
        requestedDays <= 0
    ) {
        return null;
    }

    /*
     * The AI must return exactly the requested
     * number of days.
     */
    if (
        itinerary.days.length !==
        requestedDays
    ) {
        return null;
    }

    const normalizedDays = [];

    for (
        let index = 0;
        index < itinerary.days.length;
        index++
    ) {

        const day =
            itinerary.days[index];

        if (
            !day ||
            !Array.isArray(day.activities)
        ) {
            return null;
        }

        /*
         * Normalize up to 4 activities per day.
         */
        const activities =
            day.activities
                .slice(0, 4)
                .map(
                    activity =>
                        normalizeActivity(
                            activity,
                            destinationData
                        )
                )
                .filter(Boolean);

        if (
            activities.length === 0
        ) {
            return null;
        }

        /*
         * Normalize accommodation.
         *
         * Budget itineraries always receive
         * budget accommodation.
         *
         * Experience itineraries always receive
         * premium accommodation.
         */
        const accommodation =
            mode === "experience"
                ? "Premium hotel or resort accommodation"
                : "Budget-friendly local accommodation";

        /*
         * Calculate activity costs.
         */
        const activityCost =
            activities.reduce(
                (sum, activity) =>
                    sum +
                    Number(activity.cost || 0),
                0
            );

        /*
         * Use the destination's average daily
         * base cost plus activities.
         */
        const estimatedCost =
            Math.round(
                Number(
                    destinationData.avg_cost_per_day ||
                    0
                ) +
                activityCost
            );

        normalizedDays.push({
            day: index + 1,

            activities,

            accommodation,

            estimated_cost:
                estimatedCost,

            travel_time_hours:
                Number(
                    destinationData.travel_time_between ||
                    0
                )
        });
    }

    /*
     * Enforce diversity AFTER all activities
     * have been normalized.
     */
    ensureActivityDiversity(
        normalizedDays,
        destinationData,
        mode
    );

    /*
     * Recalculate costs after replacements.
     */
    normalizedDays.forEach(day => {

        const activityCost =
            day.activities.reduce(
                (sum, activity) =>
                    sum +
                    Number(activity.cost || 0),
                0
            );

        day.estimated_cost =
            Math.round(
                Number(
                    destinationData.avg_cost_per_day ||
                    0
                ) +
                activityCost
            );
    });

    /*
     * If the generated itinerary exceeds the
     * requested budget, keep the itinerary valid
     * but prefer cheaper activities for budget mode.
     */
    const totalCost =
        normalizedDays.reduce(
            (sum, day) =>
                sum +
                Number(
                    day.estimated_cost || 0
                ),
            0
        );

    const budget =
        Number(query.budget_total);

    if (
        mode === "budget" &&
        Number.isFinite(budget) &&
        totalCost > budget
    ) {

        const budgetActivities =
            [...(destinationData.activities || [])]
                .sort(
                    (a, b) =>
                        Number(a.cost || 0) -
                        Number(b.cost || 0)
                );

        const replacementMap =
            new Map(
                budgetActivities.map(
                    activity => [
                        activity.name
                            .toLowerCase(),
                        activity
                    ]
                )
            );

        normalizedDays.forEach(day => {

            day.activities =
                day.activities.map(
                    activity => {

                        const matched =
                            replacementMap.get(
                                activity.name
                                    .toLowerCase()
                            );

                        if (matched) {
                            return {
                                name:
                                    matched.name,
                                location:
                                    activity.location,
                                cost:
                                    Number(
                                        matched.cost
                                    ) || 0
                            };
                        }

                        return activity;
                    }
                );

            const activityCost =
                day.activities.reduce(
                    (sum, activity) =>
                        sum +
                        Number(
                            activity.cost || 0
                        ),
                    0
                );

            day.estimated_cost =
                Math.round(
                    Number(
                        destinationData.avg_cost_per_day ||
                        0
                    ) +
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
 * Used when Ollama fails.
 * Still produces two different styles.
 * ============================================================
 */
function createFallbackItinerary(
    query,
    mode,
    destinationData
) {

    const requestedDays =
        Number(query.duration_days);

    let availableActivities =
        [
            ...(destinationData.activities || [])
        ];

    if (mode === "budget") {

        availableActivities.sort(
            (a, b) =>
                Number(a.cost || 0) -
                Number(b.cost || 0)
        );

    } else {

        availableActivities.sort(
            (a, b) =>
                Number(b.cost || 0) -
                Number(a.cost || 0)
        );
    }

    /*
     * Remove duplicate activity names.
     */
    const uniqueActivities = [];

    const seen = new Set();

    availableActivities.forEach(
        activity => {

            const key =
                activity.name
                    .trim()
                    .toLowerCase();

            if (!seen.has(key)) {

                seen.add(key);

                uniqueActivities.push(
                    activity
                );
            }
        }
    );

    availableActivities =
        uniqueActivities;

    const days = [];

    for (
        let i = 0;
        i < requestedDays;
        i++
    ) {

        const activity =
            availableActivities[
                i %
                    availableActivities.length
            ];

        if (!activity) {
            continue;
        }

        const attractions =
            destinationData.attractions ||
            [];

        const attractionIndex =
            attractions.length > 0
                ? i % attractions.length
                : 0;

        const activityCost =
            Number(activity.cost || 0);

        days.push({

            day: i + 1,

            activities: [
                {
                    name:
                        activity.name,

                    location:
                        attractions[
                            attractionIndex
                        ] ||
                        destinationData.name,

                    cost:
                        activityCost
                }
            ],

            accommodation:
                mode === "budget"
                    ? "Budget-friendly local accommodation"
                    : "Premium hotel or resort accommodation",

            estimated_cost:
                Math.round(
                    Number(
                        destinationData.avg_cost_per_day ||
                        0
                    ) +
                    activityCost
                ),

            travel_time_hours:
                Number(
                    destinationData.travel_time_between ||
                    0
                )
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
                destination.name
                    .toLowerCase() ===
                String(
                    query.destination
                ).toLowerCase()
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
Create a BUDGET EXPLORER itinerary.

Priorities:
- Minimize total trip cost.
- Prefer free and low-cost activities.
- Prefer simple local accommodation.
- Avoid expensive paid activities when a free or low-cost alternative exists.
- Keep activities practical and geographically efficient.
- Focus on essential sightseeing and affordable experiences.
- The itinerary must contain VARIETY.
- Do NOT use the same activity on multiple days unless there are not enough activities available.
- Include a mixture of beaches, sightseeing, culture, food, nature or other available low-cost activities.
- The itinerary should feel clearly different from a premium itinerary.
`
            : `
Create a PREMIUM EXPERIENCE itinerary.

Priorities:
- Focus on memorable and distinctive experiences.
- Prefer higher-cost activities when they provide substantially more experience value.
- Use comfortable or premium accommodation.
- Include a richer mix of sightseeing, activities and experiences.
- Do NOT use "Budget-friendly accommodation".
- Do NOT describe accommodation as budget-friendly.
- Do not simply repeat the same activities in the same order as the budget itinerary.
- Do NOT use the same activity on multiple days unless there are not enough activities available.
- Prioritize unique and paid experiences where appropriate.
- The itinerary should feel clearly different from a budget itinerary.
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
${
    Array.isArray(query.interests)
        ? query.interests.join(", ")
        : query.interests || "none"
}

AVOID:
${
    Array.isArray(query.avoid)
        ? query.avoid.join(", ")
        : query.avoid || "none"
}

AVAILABLE ATTRACTIONS:
${JSON.stringify(
    destinationData.attractions
)}

AVAILABLE ACTIVITIES:
${JSON.stringify(
    destinationData.activities
)}

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

12. Make the itinerary internally consistent with the requested mode.

13. Do not repeat the same activity across multiple days when enough different activities exist.

14. For BUDGET EXPLORER:
    - Favor low-cost or free activities.
    - Use budget-friendly accommodation.
    - Avoid repeatedly selecting expensive activities.
    - Prefer variety among available low-cost activities.

15. For PREMIUM EXPERIENCE:
    - Favor distinctive and higher-value experiences.
    - Use comfortable or premium accommodation.
    - Never use "Budget-friendly accommodation".
    - Do not simply copy the budget itinerary.

16. Return compact JSON.

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
      "accommodation": "Budget-friendly local accommodation",
      "estimated_cost": 2500,
      "travel_time_hours": 2
    }
  ]
}

Return ONLY JSON.
`;

    for (
        let attempt = 1;
        attempt <= 3;
        attempt++
    ) {

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

The requested itinerary mode is:
${mode}

If the mode is "budget":
- prioritize low-cost activities
- use budget-friendly accommodation
- use varied activities
- do not repeat the same activity unnecessarily

If the mode is "experience":
- prioritize memorable and premium experiences
- use comfortable or premium accommodation
- never use budget-friendly accommodation
- use varied activities
- avoid copying the budget itinerary structure
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
                response.data
                    ?.message
                    ?.content
                    ?.trim();

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
                    destinationData,
                    mode
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
 * GENERATE TWO ITINERARY OPTIONS
 * ============================================================
 */
async function generateItineraryOptions(
    query,
    destinations = []
) {

    const budgetItinerary =
        await generateItinerary(
            query,
            "budget",
            destinations
        );

    const experienceItinerary =
        await generateItinerary(
            query,
            "experience",
            destinations
        );

    if (
        !budgetItinerary &&
        !experienceItinerary
    ) {
        return null;
    }

    return {
        options: [

            {
                id: "A",
                type: "budget",
                title: "Budget Explorer",
                description:
                    "A cost-conscious itinerary focused on essential experiences and practical travel.",
                itinerary:
                    budgetItinerary
            },

            {
                id: "B",
                type: "experience",
                title: "Premium Experience",
                description:
                    "A richer itinerary focused on memorable experiences, comfort and premium activities.",
                itinerary:
                    experienceItinerary
            }

        ].filter(
            option =>
                option.itinerary
        )
    };
}


/**
 * ============================================================
 * AI QUOTE SUMMARY
 * ============================================================
 */
async function generateQuoteSummary(
    quote
) {

    const total =
        Number(
            quote?.group_total || 0
        );

    const margin =
        Number(
            quote?.margin_applied || 0
        );

    const prompt = `
Write a 2-sentence professional summary of this travel quote for a customer.

QUOTE DETAILS:
${JSON.stringify(
    quote,
    null,
    2
)}

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

        const response =
            await axios.post(
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
            response.data
                ?.message
                ?.content
                ?.trim() || "";

        summary =
            summary
                .replace(/\$/g, "₹")
                .replace(
                    /\bUSD\b/gi,
                    "INR"
                )
                .replace(
                    /\bdollars?\b/gi,
                    "Indian Rupees"
                );

        if (
            !summary.includes("₹") &&
            !summary.includes("INR")
        ) {

            summary =
                `${summary} The total quoted amount is ₹${total.toLocaleString("en-IN")}.`;
        }

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

        return (
            `The total quoted amount for your trip is ₹${total.toLocaleString("en-IN")}, including activities, transport, and accommodation. ` +
            `A ${margin}% margin has been applied to the calculated travel costs.`
        );
    }
}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */
module.exports = {
    generateTrip,
    generateItinerary,
    generateItineraryOptions,
    generateQuoteSummary
};
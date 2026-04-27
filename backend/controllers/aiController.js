const { generateTrip } = require('../services/aiService');

const {
    replaceHinglish,
    normalise,
    resolveDate,
    checkMissingFields
} = require('../services/utils');

const { generateVariations } = require('../services/itineraryService');
const { rankItineraries, generateExplanation } = require('../services/rankingService');

// ==============================
// 🔹 PARSE QUERY
// ==============================
exports.handleParseQuery = async (req, res) => {
    try {
        let { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message required" });
        }

        // 🔹 Normalize Hinglish → English
        message = replaceHinglish(message.toLowerCase());

        const prompt = `
Return ONLY valid JSON:

{
  "destination": string,
  "duration_days": number,
  "budget_total": number,
  "group_size": number,
  "group_type": string | null,
  "interests": string[] | null
}

Rules:
- Extract meaningful travel intent ONLY
- Ignore filler words like "log", "people", "guys"
- Interests must be from: beach, food, adventure, culture
- If none found → null
- Convert informal text into structured fields
- NO explanation
- NO markdown
- VALID JSON ONLY

Message: "${message}"
`;

        const raw = await generateTrip(prompt);

        if (!raw) {
            return res.status(500).json({ error: "AI failed" });
        }

        let parsed;

        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            console.error("Invalid JSON:", raw);
            return res.status(500).json({
                error: "AI returned invalid JSON",
                raw
            });
        }

        // =========================
        // 🔹 POST-PROCESS FIXES
        // =========================

// =========================
// 🔹 RULE-BASED FALLBACKS
// =========================

// 🔹 Duration (3 din / 3 days)
if (!parsed.duration_days) {
    const dayMatch = message.match(/(\d+)\s*(day|days|din)/);
    if (dayMatch) {
        parsed.duration_days = Number(dayMatch[1]);
    }
}

// 🔹 Budget (20k → 20000)
if (!parsed.budget_total) {
    const budgetMatch = message.match(/(\d+)\s*k/);
    if (budgetMatch) {
        parsed.budget_total = Number(budgetMatch[1]) * 1000;
    }
}

// 🔹 Group size (3 log)
if (!parsed.group_size) {
    const groupMatch = message.match(/(\d+)\s*(people|persons|log|guys)/);
    if (groupMatch) {
        parsed.group_size = Number(groupMatch[1]);
    }
}
        // 🔹 Budget normalize
        if (parsed.budget_total) {
            parsed.budget_total = Number(
                normalise(parsed.budget_total.toString())
            );
        }

        // 🔹 Fix group size (detect "3 log", "2 people")
        const groupMatch = message.match(/(\d+)\s*(people|persons|log|guys)/);
        if (groupMatch) {
            parsed.group_size = Number(groupMatch[1]);
        }

        // 🔹 Clean interests (REMOVE junk like "log")
        const validInterests = ["beach", "food", "adventure", "culture"];

        if (parsed.interests && Array.isArray(parsed.interests)) {
            parsed.interests = parsed.interests.filter(i =>
                validInterests.includes(i.toLowerCase())
            );
        }

        if (!parsed.interests || parsed.interests.length === 0) {
            parsed.interests = ["beach"]; // 🔥 default fallback
        }

        // 🔹 Date extraction
        const date = resolveDate(message);
        if (date) parsed.start_date = date;

        // 🔹 Final validation / clarification
        const clarification = checkMissingFields(parsed);
        if (clarification) {
    // only ask if REALLY missing critical fields
    if (!parsed.destination || !parsed.duration_days) {
        return res.json(clarification);
    }
}

        res.json(parsed);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Parsing failed" });
    }
};


// ==============================
// 🔹 GENERATE ITINERARY
// ==============================
exports.handleGenerateItinerary = async (req, res) => {
    try {
        const query = req.body;

        if (!query.destination || !query.duration_days || !query.budget_total) {
            return res.status(400).json({
                error: "destination, duration_days, budget_total required"
            });
        }

        const result = await generateVariations(query);
        const variations = result.variations;

        // 🚨 CRITICAL FIX
        if (!variations || variations.length === 0) {
            return res.status(500).json({
                error: "Failed to generate valid itineraries"
            });
        }

        const ranked = rankItineraries(variations, query);

        const best = ranked[0];

        const explanation = generateExplanation(best, query);

        res.json({
            variations,
            ranked,
            explanation
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Failed to generate itinerary"
        });
    }
};
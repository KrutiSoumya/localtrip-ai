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
// 🔥 SAFE JSON PARSER (CRITICAL FIX)
// ==============================
function safeJSONParse(text) {
    try {
        if (!text) return null;

        // 🔥 Remove markdown
        text = text.replace(/```json|```/g, '').trim();

        // 🔥 Extract fields manually (ULTRA ROBUST)
        const destination = text.match(/"destination"\s*:\s*"([^"]+)"/i)?.[1] || null;

        const duration = text.match(/"duration_days"\s*:\s*(\d+)/i)?.[1];
        const budget = text.match(/"budget_total"\s*:\s*(\d+)/i)?.[1];
        const groupSize = text.match(/"group_size"\s*:\s*(\d+)/i)?.[1];

        const groupType = text.match(/"group_type"\s*:\s*"([^"]+)"/i)?.[1] || null;

        // 🔥 interests array (safe extraction)
        let interests = null;
        const interestsMatch = text.match(/"interests"\s*:\s*\[(.*?)\]/i);

        if (interestsMatch) {
            interests = interestsMatch[1]
                .split(',')
                .map(i => i.replace(/"/g, '').trim())
                .filter(Boolean);
        }

        return {
            destination: destination,
            duration_days: duration ? Number(duration) : null,
            budget_total: budget ? Number(budget) : null,
            group_size: groupSize ? Number(groupSize) : null,
            group_type: groupType,
            interests: interests
        };

    } catch (err) {
        console.error("REGEX PARSE FAILED:", text);
        return null;
    }
}


// ==============================
// 🔹 PARSE QUERY
// ==============================
exports.handleParseQuery = async (req, res) => {
    try {
        let { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message required" });
        }

        // 🔹 Hinglish → English
        message = replaceHinglish(message);

        // 🔹 Clean prompt (shorter = better)
        const prompt = `
Return ONLY this JSON:

{
  "destination": string,
  "duration_days": number,
  "budget_total": number,
  "group_size": number,
  "group_type": string | null,
  "interests": string[] | null
}

STRICT:
- No explanation
- No extra text
- No markdown
- If missing → null

Message: "${message}"
`;

        const raw = await generateTrip(prompt);

        if (!raw) {
            return res.status(500).json({ error: "AI failed" });
        }

        // 🔥 SAFE PARSE (NOT direct JSON.parse)
        const parsed = safeJSONParse(raw);

        if (!parsed) {
            return res.status(500).json({
                error: "AI returned invalid JSON",
                raw
            });
        }

        // 🔹 Normalize budget
        if (parsed.budget_total) {
            parsed.budget_total = Number(
                normalise(parsed.budget_total.toString())
            );
        }

        // 🔹 Resolve date
        const date = resolveDate(message);
        if (date) parsed.start_date = date;

        // 🔹 Missing fields check
        const clarification = checkMissingFields(parsed);
        if (clarification) return res.json(clarification);

        res.json(parsed);

    } catch (err) {
        console.error("Parse Query Error:", err);
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

        // 🔹 Generate variations
        const result = await generateVariations(query);
        const variations = result.variations;

        if (!variations || variations.length === 0) {
            return res.status(500).json({
                error: "Failed to generate itineraries"
            });
        }

        // 🔹 Rank itineraries
        const ranked = rankItineraries(variations, query);

        // 🔹 Pick best
        const best = ranked[0];

        // 🔹 Explanation
        const explanation = generateExplanation(best, query);

        res.json({
            variations,
            ranked,
            explanation
        });

    } catch (err) {
        console.error("Generate Itinerary Error:", err);
        res.status(500).json({
            error: "Failed to generate itinerary"
        });
    }
};
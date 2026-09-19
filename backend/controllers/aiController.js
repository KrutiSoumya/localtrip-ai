const { generateTrip } = require('../services/aiService');
const prisma = require('../services/db');

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

if (!parsed.duration_days) {
    const dayMatch = message.match(/(\d+)\s*(day|days|din)/);
    if (dayMatch) {
        parsed.duration_days = Number(dayMatch[1]);
    }
}

if (!parsed.budget_total) {
    const budgetMatch = message.match(/(\d+)\s*k/);
    if (budgetMatch) {
        parsed.budget_total = Number(budgetMatch[1]) * 1000;
    }
}

if (!parsed.group_size) {
    const groupMatch = message.match(/(\d+)\s*(people|persons|log|guys)/);
    if (groupMatch) {
        parsed.group_size = Number(groupMatch[1]);
    }
}
        if (parsed.budget_total) {
            parsed.budget_total = Number(
                normalise(parsed.budget_total.toString())
            );
        }

        const groupMatch = message.match(/(\d+)\s*(people|persons|log|guys)/);
        if (groupMatch) {
            parsed.group_size = Number(groupMatch[1]);
        }

        const validInterests = ["beach", "food", "adventure", "culture"];

        if (parsed.interests && Array.isArray(parsed.interests)) {
            parsed.interests = parsed.interests.filter(i =>
                validInterests.includes(i.toLowerCase())
            );
        }

        if (!parsed.interests || parsed.interests.length === 0) {
            parsed.interests = ["beach"]; 
        }

        const date = resolveDate(message);
        if (date) parsed.start_date = date;

        const clarification = checkMissingFields(parsed);
        if (clarification) {
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
                error: "destination, duration_days and budget_total are required"
            });
        }

        const result = await generateVariations(query);
        const variations = result.variations;

        if (!variations || variations.length === 0) {
            return res.status(500).json({
                error: "Failed to generate itinerary variations"
            });
        }

        const ranked = rankItineraries(variations, query);
        const best = ranked[0];

        const explanation = generateExplanation(best, query);

        // Prepare the complete AI output
        const aiOutput = {
            variations,
            ranked,
            explanation
        };

        // Log AI input and output in the database
        const aiLog = await prisma.aILog.create({
            data: {
                input: JSON.stringify(query),
                output: JSON.stringify(aiOutput)
            }
        });

        res.json({
            output_id: aiLog.id,
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
// ==============================
// 🔹 AI FEEDBACK
// ==============================
exports.handleAIFeedback = async (req, res) => {
    try {
        const {
            output_id,
            action,
            reason
        } = req.body;

        const validActions = ["accept", "edit", "reject"];

        if (!output_id) {
            return res.status(400).json({
                error: "output_id is required"
            });
        }

        if (!validActions.includes(action)) {
            return res.status(400).json({
                error: "action must be accept, edit, or reject"
            });
        }

        const aiLog = await prisma.aILog.findUnique({
            where: {
                id: Number(output_id)
            }
        });

        if (!aiLog) {
            return res.status(404).json({
                error: "AI output not found"
            });
        }

        const updatedLog = await prisma.aILog.update({
            where: {
                id: Number(output_id)
            },
            data: {
                action,
                feedback: reason || null
            }
        });

        res.json({
            message: "AI feedback recorded successfully",
            output_id: updatedLog.id,
            action: updatedLog.action,
            feedback: updatedLog.feedback
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to record AI feedback"
        });
    }
};

exports.getAIFeedbackStats = async (req, res) => {
    try {
        const total = await prisma.aILog.count({
            where: {
                action: {
                    not: null
                }
            }
        });

        const accepted = await prisma.aILog.count({
            where: {
                action: "accept"
            }
        });

        const edited = await prisma.aILog.count({
            where: {
                action: "edit"
            }
        });

        const rejected = await prisma.aILog.count({
            where: {
                action: "reject"
            }
        });

        const acceptanceRate = total > 0
            ? Number(((accepted / total) * 100).toFixed(2))
            : 0;

        res.json({
            total_feedback: total,
            accepted,
            edited,
            rejected,
            acceptance_rate: acceptanceRate
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to fetch AI feedback statistics"
        });
    }
};
const { generateTrip } = require('../services/aiService');

const {
    replaceHinglish,
    normalise,
    resolveDate,
    checkMissingFields
} = require('../services/utils');

// 🔥 Extract clean JSON from messy AI response
function extractJSON(text) {
    if (!text) return null;

    // remove markdown
    text = text.replace(/```json/g, '').replace(/```/g, '');

    // extract JSON block
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    let jsonText = match[0];

    // 🔥 remove comments (// ...)
    jsonText = jsonText.replace(/\/\/.*$/gm, '');

    // 🔥 remove trailing commas
    jsonText = jsonText.replace(/,\s*}/g, '}');
    jsonText = jsonText.replace(/,\s*]/g, ']');

    // 🔥 remove weird text after values
    jsonText = jsonText.replace(/:\s*null\s*,?\s*[^\n,}]*/g, ': null');

    try {
        return JSON.parse(jsonText);
    } catch (err) {
        console.log("Cleaned JSON failed:", jsonText);
        return null;
    }
}

exports.handleParseQuery = async (req, res) => {
    try {
        let { message } = req.body;

        // ✅ validation
        if (!message) {
            return res.status(400).json({ error: "Message required" });
        }

        // ✅ Step 1: Hinglish preprocessing
        message = replaceHinglish(message);

        // ✅ Step 2: Strict AI prompt
        const prompt = `
You are a strict JSON extractor.

Extract ONLY these fields:
- destination
- duration_days
- budget_total
- group_size
- group_type
- interests

Rules:
- Return ONLY valid JSON
- No explanation
- No markdown
- No comments
- No trailing commas

Message: "${message}"
`;

        const raw = await generateTrip(prompt);

        // ✅ Step 3: Safe JSON parsing
        const parsed = extractJSON(raw);

        if (!parsed) {
            return res.status(500).json({
                error: "AI returned invalid JSON",
                raw
            });
        }

        // ✅ Step 4: Normalize budget
        if (parsed.budget_total) {
            const normalized = normalise(parsed.budget_total.toString());
            parsed.budget_total = Number(normalized) || parsed.budget_total;
        }

        // ✅ Step 5: Resolve relative dates
        const date = resolveDate(message);
        if (date) {
            parsed.start_date = date;
        }

        // ✅ Step 6: Check missing fields
        const clarification = checkMissingFields(parsed);
        if (clarification) {
            return res.json(clarification);
        }

        // ✅ Final response
        res.json(parsed);

    } catch (err) {
        console.error("Parse Query Error:", err);
        res.status(500).json({ error: "Parsing failed" });
    }
};
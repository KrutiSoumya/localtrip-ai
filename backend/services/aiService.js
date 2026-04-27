const axios = require('axios');

const OLLAMA_URL = 'http://localhost:11434/api/chat';


// ==============================
// 🔹 STRICT JSON GENERATOR
// ==============================
async function generateTrip(prompt) {
    try {
        const response = await axios.post(OLLAMA_URL, {
            model: 'phi3:mini',
            stream: false,
            options: {
                temperature: 0,
                num_predict: 150,
                stop: ["\n\n", "Explanation", "Note", "incorrectly"]
            },
            messages: [
                {
                    role: "system",
                    content: `
You are a STRICT JSON generator.

Rules:
- Output ONLY valid JSON
- No markdown
- No explanation
- No comments
- Close JSON properly
- If missing → null
`
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        let text = response.data.message.content?.trim();

        if (!text) return null;

        // 🔥 Clean markdown if any
        text = text.replace(/```json|```/g, '').trim();

        return text;

    } catch (error) {
        console.error("AI Error:", error.message);
        return null;
    }
}


// ==============================
// 🔹 ITINERARY GENERATOR
// ==============================
async function generateItinerary(query, mode = "balanced", destinations = []) {

    const style =
        mode === "budget"
            ? "Focus on low-cost and free activities."
            : "Focus on premium and unique experiences.";

    // 🔥 DIFFERENTIATION
    let extraInstruction = "";

    if (mode === "budget") {
        extraInstruction = `
Use:
- free attractions
- street markets
- local food
Avoid:
- luxury experiences
- private tours
- expensive dining
`;
    } else {
        extraInstruction = `
Use:
- premium experiences
- guided tours
- unique activities
Avoid:
- free-only activities
- street markets
`;
    }

    // 🔥 DATASET GROUNDING
    const attractionList = destinations
        .map(d => d.attractions)
        .flat()
        .join(", ");

    const prompt = `
You are a STRICT itinerary generator.

CRITICAL RULES:
- Output ONLY itinerary text
- NO markdown (**, *, etc.)
- NO explanations
- NO introductions
- NO notes
- NO "Destination" headings
- NO cost explanations
- ONLY use places from this list:
${attractionList} from that destination, and nothing else.
- DO NOT invent places
- DO NOT MIX DESTINATIONS AND THEIR ATTRACTIONS, STICK TO THE GIVEN DESTINATION ONLY!!

FORMAT MUST BE EXACT:

Day 1:
- Activity
- Activity
- Activity

Day 2:
- Activity
- Activity
- Activity

TASK:
Create a ${query.duration_days}-day itinerary.

CONSTRAINTS:
- EXACTLY ${query.duration_days} days
- EACH day must have 3–4 activities
- EACH activity must start with "-"
- Use SHORT, simple sentences
- Use ONLY real place names from list

${style}
${extraInstruction}

Trip:
Destination: ${query.destination}
Budget: ${query.budget_total}
People: ${query.group_size}
`;

    // 🔁 Retry logic
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const response = await axios.post(OLLAMA_URL, {
                model: 'phi3:mini',
                stream: false,
                options: {
                    temperature: 0.2,
                    num_predict: 700
                },
                messages: [
                    {
                        role: "system",
                        content: `
You must STRICTLY follow formatting rules.
If you add explanations or markdown → output is INVALID.
`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            let text = response.data.message.content?.trim();

            if (!text) continue;

            // 🔥 HARD CLEANING
            text = text
                .replace(/```/g, "")
                .replace(/\*\*/g, "")
                .replace(/\*/g, "")
                .replace(/Destination:.*/gi, "")
                .replace(/Please note:.*/gi, "")
                .replace(/Note:.*/gi, "")
                .replace(/approx[^.\n]*/gi, "")
                .replace(/per person[^.\n]*/gi, "")
                .replace(/not included[^.\n]*/gi, "")
                .trim();

            // 🔥 STRICT VALIDATION
            const dayMatches = text.match(/Day\s\d+:/g) || [];
            const hasBullets = text.includes("-");

            if (
                text &&
                dayMatches.length === query.duration_days &&
                hasBullets &&
                !text.includes("**") &&
                !text.toLowerCase().includes("please note") &&
                !text.toLowerCase().includes("destination")
            ) {
                return text;
            }

        } catch (err) {
            console.error(`Attempt ${attempt} failed:`, err.message);
        }
    }

    return null;
}

module.exports = {
    generateTrip,
    generateItinerary
};
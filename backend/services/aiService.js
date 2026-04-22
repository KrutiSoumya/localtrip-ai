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
                num_predict: 120,
                stop: ["\n\n", "incorrectly", "Explanation", "Note"]
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

        let text = response.data.message.content.trim();

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
async function generateItinerary(query, mode = "balanced") {
    const style =
        mode === "budget"
            ? "Focus on low-cost and free activities."
            : "Focus on unique and premium experiences.";

    const prompt = `
Create a ${query.duration_days}-day travel itinerary.

STRICT FORMAT:

Day 1:
- ...
- ...
- ...

Day 2:
- ...
- ...
- ...

Rules:
- EXACTLY ${query.duration_days} days
- 3-4 activities per day
- Short sentences
- NO markdown
- NO explanation
- NO extra text

${style}

Trip:
Destination: ${query.destination}
Budget: ${query.budget_total}
People: ${query.group_size}
`;

    // 🔥 Retry logic
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const response = await axios.post(OLLAMA_URL, {
                model: 'phi3:mini',
                stream: false,
                options: {
                    temperature: 0.3,
                    num_predict: 800
                },
                messages: [
                    { role: "system", content: "Return ONLY clean itinerary text." },
                    { role: "user", content: prompt }
                ]
            });

            const text = response.data.message.content?.trim();

            // 🔥 basic validation
            if (text && text.includes("Day 1") && text.includes("Day")) {
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
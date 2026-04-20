const axios = require('axios');

const OLLAMA_URL = 'http://localhost:11434/api/chat';

async function generateTrip(prompt) {
    try {
        const response = await axios.post(OLLAMA_URL, {
            model: 'phi3:mini',
            stream: false,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const content = response.data?.message?.content;

        if (!content) {
            console.log("Unexpected response:", response.data);
            return "AI failed to generate response";
        }

        return content;

    } catch (error) {
        console.error("AI Error:", error.message);
        return "AI failed to respond";
    }
}
async function parseUserQuery(message) {
    const prompt = `
Extract the following fields from this customer message:
- destination
- duration_days
- budget_total
- group_size
- group_type
- interests

Return ONLY valid JSON. No explanation.

Message:
"${message}"
`;

    return await generateTrip(prompt);
}

function replaceHinglish(text) {
    const map = {
        "ek din": "1 day",
        "do din": "2 days",
        "teen din": "3 days",
        "char din": "4 days",
        "paanch din": "5 days",
        "ek banda": "1 person",
        "do log": "2 people",
        "teen log": "3 people",
        "char log": "4 people",
        "paanch hazaar": "5000",
        "das hazaar": "10000",
        "pandrah hazaar": "15000",
        "bees hazaar": "20000"
    };

    let result = text.toLowerCase();

    for (let key in map) {
        result = result.replaceAll(key, map[key]);
    }

    return result;
}

function normalise(text) {
    return text
        .replace(/(\d+)\s*k/gi, (_, n) => n * 1000)
        .replace(/(\d+(\.\d+)?)\s*l/gi, (_, n) => n * 100000);
}

function resolveDate(text) {
    const now = new Date();

    if (text.includes("next week")) {
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7));
        return nextMonday.toISOString().split("T")[0];
    }

    if (text.includes("next month")) {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth.toISOString().split("T")[0];
    }

    if (text.includes("this weekend")) {
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + (6 - now.getDay()));
        return saturday.toISOString().split("T")[0];
    }

    return null;
}

function checkMissingFields(data) {
    const required = ["destination", "duration_days", "budget_total"];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
        return {
            missing,
            question: `Please provide: ${missing.join(", ")}`
        };
    }

    return null;
}

// test function
async function testAI() {
    const prompt = "Plan a 3-day trip to Goa for 2 people with budget 15000 rupees.";
    const result = await generateTrip(prompt);
    console.log(result);
}

module.exports = { generateTrip, testAI };
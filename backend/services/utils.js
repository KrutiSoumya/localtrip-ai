// Hinglish → English normalization
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

// Budget normalization (30k → 30000, 1.5L → 150000)
function normalise(text) {
    return text
        .replace(/(\d+)\s*k/gi, (_, n) => n * 1000)
        .replace(/(\d+(\.\d+)?)\s*l/gi, (_, n) => n * 100000);
}

// Relative date handling
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

// Check missing required fields
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

module.exports = {
    replaceHinglish,
    normalise,
    resolveDate,
    checkMissingFields
};
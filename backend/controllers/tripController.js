const { generateTrip } = require('../services/aiService');

exports.createTrip = async (req, res) => {
    try {
        const { destination, days, budget, people } = req.body;

        if (!destination || !days || !budget || !people) {
            return res.status(400).json({ error: "All fields required" });
        }

        const prompt = `
Plan a ${days}-day trip to ${destination} for ${people} people with a budget of ₹${budget}.

Give a detailed day-wise itinerary including:
- places to visit
- food suggestions
- approximate costs
- travel tips

Keep it practical and budget-friendly.
`;

        const itinerary = await generateTrip(prompt);

        res.json({ itinerary });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate trip" });
    }
};
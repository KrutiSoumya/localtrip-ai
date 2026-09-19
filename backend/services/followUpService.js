function generateFollowUpMessage(lead, status) {

    const name =
        lead.name ||
        "there";

    switch (status) {

        case "New":
            return `Hi ${name}, thank you for your travel enquiry. I’d be happy to help you plan your trip. Please let me know if you’d like me to prepare an itinerary and quotation.`;

        case "Quoted":
            return `Hi ${name}, I wanted to follow up on the quotation we shared for your trip. Please let me know if you’d like any changes to the itinerary, budget, or activities.`;

        case "Inactive":
            return `Hi ${name}, just checking in regarding your travel plans. If you’re still planning your trip, I’d be happy to help you explore an updated itinerary or quotation.`;

        default:
            return `Hi ${name}, just following up regarding your travel enquiry. Please let me know how I can help.`;
    }
}


function generateFollowUpMessages(lead) {

    return {
        New: generateFollowUpMessage(
            lead,
            "New"
        ),

        Quoted: generateFollowUpMessage(
            lead,
            "Quoted"
        ),

        Inactive: generateFollowUpMessage(
            lead,
            "Inactive"
        )
    };
}


module.exports = {
    generateFollowUpMessage,
    generateFollowUpMessages
};